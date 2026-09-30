import type {
  CatalogFiltersResponse,
  MeasureRecord,
  RecommendationRequest,
  RecommendationResponse,
} from '../types/api';

export class ApiErrorResponse extends Error {
  code: string;
  requestId?: string;
  status: number;
  kind: 'network' | 'unauthorized' | 'client' | 'unavailable';

  constructor(
    message: string,
    code: string = 'api_error',
    requestId?: string,
    status: number = 0,
    kind: 'network' | 'unauthorized' | 'client' | 'unavailable' = 'client',
  ) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.code = code;
    this.requestId = requestId;
    this.status = status;
    this.kind = (kind === 'client' && code === 'invalid_response') ? 'unavailable' : kind;
  }
}

// Схема QuizSubmitResponse из openapi.yaml: certificate выдаёт только сервер
export type QuizSubmitResult = {
  attempt_id: string;
  score: number;
  passed: boolean;
  pass_score: number;
  certificate: {
    certificate_id: string;
    title: string;
    disclaimer: string;
    payload: string;
  } | null;
};

export type ChecklistItem = {
  key: string;
  label: string;
  completed: boolean;
};

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const initData = (window as any).WebApp?.initData;
    if (initData) {
      headers['X-Max-Init-Data'] = initData;
    }
    return headers;
  }

  async getHealth(): Promise<{ status: string; version: string }> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/health`);
    } catch {
      throw new ApiErrorResponse('Сервис проверки недоступен', 'network_error');
    }
    if (!res.ok) {
      let code = 'http_error';
      let requestId: string | undefined;
      try {
        const body = JSON.parse(await res.text());
        if (typeof body?.error?.code === 'string') code = body.error.code;
        if (typeof body?.error?.request_id === 'string') requestId = body.error.request_id;
      } catch {
        // тело не envelope
      }
      throw new ApiErrorResponse(`Health check failed with ${res.status}`, code, requestId);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await res.text());
    } catch {
      throw new ApiErrorResponse('Health check: ответ не является JSON', 'invalid_response');
    }
    const health = parsed as { status?: unknown; version?: unknown };
    if (typeof health?.status !== 'string' || typeof health?.version !== 'string') {
      throw new ApiErrorResponse('Health check: ответ не соответствует схеме /health', 'invalid_response');
    }
    return { status: health.status, version: health.version };
  }

  async getCatalogFilters(): Promise<CatalogFiltersResponse> {
    const parsed = await this.requestJson<Record<string, unknown>>(
      `${this.baseUrl}/api/v1/catalog/filters`,
    );
    if (!parsed || !Array.isArray(parsed.regions) || !Array.isArray(parsed.goals)) {
      throw new ApiErrorResponse('Фильтры каталога: неожиданная схема ответа', 'invalid_response');
    }
    return parsed as unknown as CatalogFiltersResponse;
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const parsed = await this.requestJson<Record<string, unknown>>(
      `${this.baseUrl}/api/v1/recommendations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
    );
    if (!parsed || !Array.isArray(parsed.items) || typeof parsed.catalog_version !== 'string') {
      throw new ApiErrorResponse('Рекомендации: неожиданная схема ответа', 'invalid_response');
    }
    return parsed as unknown as RecommendationResponse;
  }

  // Запрос к API: network/HTTP/invalid JSON всегда дают typed rejection, никаких локальных fallback
  private async requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetch(url, init);
    } catch {
      throw new ApiErrorResponse('Сервис недоступен', 'network_error', undefined, 0, 'network');
    }
    if (!res.ok) {
      let code = 'http_error';
      let requestId: string | undefined;
      let message = `Запрос завершился с кодом ${res.status}`;
      try {
        const body = JSON.parse(await res.text());
        if (typeof body?.error?.code === 'string') code = body.error.code;
        if (typeof body?.error?.request_id === 'string') requestId = body.error.request_id;
        if (typeof body?.error?.message === 'string') message = body.error.message;
      } catch {
        // тело не error-envelope — остаётся generic http_error
      }
      const kind = res.status === 401
        ? 'unauthorized'
        : res.status >= 500
          ? 'unavailable'
          : 'client';
      throw new ApiErrorResponse(message, code, requestId, res.status, kind);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await res.text());
    } catch {
      throw new ApiErrorResponse('Ответ не является JSON', 'invalid_response');
    }
    return parsed as T;
  }

  private async toApiError(res: Response, fallback: string): Promise<ApiErrorResponse> {
    try {
      const body = typeof res.json === 'function'
        ? await res.json()
        : JSON.parse(await res.text());
      const error = body?.error;
      if (error?.code && error?.message) {
        const kind = res.status === 401
          ? 'unauthorized'
          : res.status >= 500
            ? 'unavailable'
            : 'client';
        return new ApiErrorResponse(error.message, error.code, error.request_id, res.status, kind);
      }
    } catch {
      // Non-JSON responses are converted to a stable client error below.
    }
    const kind = res.status === 401
      ? 'unauthorized'
      : res.status >= 500
        ? 'unavailable'
        : 'client';
    return new ApiErrorResponse(fallback, 'api_error', undefined, res.status, kind);
  }

  private async parseResponseJson(res: Response): Promise<any> {
    try {
      const data = typeof res.json === 'function'
        ? await res.json()
        : JSON.parse(await res.text());
      if (data === null || typeof data !== 'object') throw new Error('non-object response');
      return data;
    } catch {
      throw new ApiErrorResponse(
        'Сервер вернул некорректный ответ',
        'invalid_response',
        undefined,
        res.status,
        'unavailable',
      );
    }
  }

  async getMeasure(id: string): Promise<MeasureRecord> {
    const parsed = await this.requestJson<Record<string, unknown>>(
      `${this.baseUrl}/api/v1/measures/${encodeURIComponent(id)}`,
    );
    if (typeof parsed?.id !== 'string') {
      throw new ApiErrorResponse(`Мера поддержки "${id}" не найдена в каталоге`, 'measure_not_found');
    }
    if (parsed.id !== id) {
      throw new ApiErrorResponse('Идентификатор меры не совпадает с запрошенным', 'invalid_response');
    }
    return parsed as unknown as MeasureRecord;
  }

  async getAllMeasures(): Promise<MeasureRecord[]> {
    const parsed = await this.requestJson<unknown>(`${this.baseUrl}/api/v1/measures`);
    if (!Array.isArray(parsed)) {
      throw new ApiErrorResponse('Каталог мер: ожидался массив', 'invalid_response');
    }
    return parsed as MeasureRecord[];
  }

  async saveMeasure(measureId: string): Promise<{ measure_id: string; saved: boolean }> {
    const parsed = await this.requestJson<Record<string, unknown>>(
      `${this.baseUrl}/api/v1/measures/${encodeURIComponent(measureId)}/save`,
      { method: 'POST', headers: this.getAuthHeaders() },
    );
    if (parsed?.saved !== true) {
      throw new ApiErrorResponse('Сервер не подтвердил сохранение меры', 'invalid_response');
    }
    return parsed as unknown as { measure_id: string; saved: boolean };
  }

  async removeSavedMeasure(measureId: string): Promise<{ measure_id: string; saved: boolean }> {
    const parsed = await this.requestJson<Record<string, unknown>>(
      `${this.baseUrl}/api/v1/measures/${encodeURIComponent(measureId)}/save`,
      { method: 'DELETE', headers: this.getAuthHeaders() },
    );
    if (parsed?.saved !== false) {
      throw new ApiErrorResponse('Сервер не подтвердил удаление меры', 'invalid_response');
    }
    return parsed as unknown as { measure_id: string; saved: boolean };
  }

  async getSavedMeasures(): Promise<string[]> {
    const parsed = await this.requestJson<Record<string, unknown>>(
      `${this.baseUrl}/api/v1/measures/saved`,
      { headers: this.getAuthHeaders() },
    );
    if (!parsed || !Array.isArray(parsed.measure_ids)) {
      throw new ApiErrorResponse('Сохранённые меры: ожидался measure_ids', 'invalid_response');
    }
    return parsed.measure_ids.filter((id): id is string => typeof id === 'string');
  }

  // Результат квиза создаёт только сервер: network/HTTP/не-JSON/схема — typed rejection, локальной оценки нет
  async submitQuiz(
    quizVersion: string,
    answers: Record<string, string>,
  ): Promise<QuizSubmitResult> {
    const parsed = await this.requestJson<Record<string, unknown>>(
      `${this.baseUrl}/api/v1/quiz/submit`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          quiz_version: quizVersion,
          answers,
        }),
      },
    );
    if (
      typeof parsed?.attempt_id !== 'string' ||
      typeof parsed?.score !== 'number' ||
      typeof parsed?.passed !== 'boolean' ||
      typeof parsed?.pass_score !== 'number'
    ) {
      throw new ApiErrorResponse('Квиз: неожиданная схема ответа сервера', 'invalid_response');
    }
    const cert = (parsed.certificate ?? null) as Record<string, unknown> | null;
    const fullCert =
      !!cert &&
      typeof cert.certificate_id === 'string' && cert.certificate_id.length > 0 &&
      typeof cert.title === 'string' && cert.title.length > 0 &&
      typeof cert.disclaimer === 'string' && cert.disclaimer.length > 0 &&
      typeof cert.payload === 'string' && cert.payload.length > 0;
    if (parsed.passed && !fullCert) {
      // passed=true без полного серверного сертификата не является успехом
      throw new ApiErrorResponse('Квиз: passed без серверного сертификата', 'invalid_response');
    }
    if (!parsed.passed && cert !== null) {
      throw new ApiErrorResponse('Квиз: сертификат в неуспешном результате', 'invalid_response');
    }
    return parsed as unknown as QuizSubmitResult;
  }

  async getChecklist(measureId: string): Promise<ChecklistItem[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/measures/${measureId}/checklist`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      throw await this.toApiError(res, 'Чеклист не удалось загрузить');
    }
    const data = await this.parseResponseJson(res);
    return data.items || [];
  }

  async updateChecklist(
    measureId: string,
    itemKey: string,
    completed: boolean,
  ): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/measures/${measureId}/checklist`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ item_key: itemKey, completed }),
      });
    } catch {
      throw new ApiErrorResponse(
        'Не удалось сохранить чеклист на сервере',
        'api_unavailable',
        undefined,
        0,
        'network',
      );
    }
    if (!res.ok) {
      throw await this.toApiError(res, 'Чеклист не удалось сохранить');
    }
  }

  async optInNotifications(enabled: boolean): Promise<boolean> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/notifications/opt-in`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ enabled }),
      });
    } catch {
      throw new ApiErrorResponse(
        'Не удалось сохранить настройки уведомлений',
        'api_unavailable',
        undefined,
        0,
        'network',
      );
    }
    if (!res.ok) {
      throw await this.toApiError(res, 'Настройку уведомлений не удалось сохранить');
    }
    const data = await this.parseResponseJson(res);
    return Boolean(data.enabled);
  }
}

export const apiClient = new ApiClient();
