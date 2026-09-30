import type {
  CatalogFiltersResponse,
  MeasureRecord,
  RecommendationRequest,
  RecommendationResponse,
} from '../types/api';

export class ApiErrorResponse extends Error {
  code: string;
  requestId?: string;

  constructor(message: string, code: string = 'api_error', requestId?: string) {
    super(message);
    this.name = 'ApiErrorResponse';
    this.code = code;
    this.requestId = requestId;
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
      // 503 bot-health отвечает BotHealth-телом, а не error-envelope — код остаётся generic
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
      throw new ApiErrorResponse('Сервис недоступен', 'network_error');
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
      throw new ApiErrorResponse(message, code, requestId);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await res.text());
    } catch {
      throw new ApiErrorResponse('Ответ не является JSON', 'invalid_response');
    }
    return parsed as T;
  }

  async getMeasure(id: string): Promise<MeasureRecord> {
    const parsed = await this.requestJson<Record<string, unknown>>(
      `${this.baseUrl}/api/v1/measures/${encodeURIComponent(id)}`,
    );
    if (typeof parsed?.id !== 'string' || parsed.id !== id) {
      throw new ApiErrorResponse(`Мера поддержки "${id}" не найдена в каталоге`, 'measure_not_found');
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

  async optInNotifications(enabled: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/notifications/opt-in`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ enabled }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.enabled;
      }
    } catch {
      // Fallback
    }
    return enabled;
  }
}

export const apiClient = new ApiClient();
