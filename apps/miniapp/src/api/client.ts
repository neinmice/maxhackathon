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
    this.kind = kind;
  }
}

export type QuizSubmitResult = {
  attempt_id: string;
  score: number;
  passed: boolean;
  certificate?: {
    certificate_id: string;
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

  async getHealth(): Promise<{ status: string; version: string }> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/health`);
    } catch {
      throw new ApiErrorResponse('Сервис недоступен', 'api_unavailable', undefined, 0, 'network');
    }
    if (!res.ok) throw await this.toApiError(res, `Health check failed with ${res.status}`);
    return await this.parseResponseJson(res);
  }

  async getCatalogFilters(): Promise<CatalogFiltersResponse> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/catalog/filters`);
    } catch {
      throw new ApiErrorResponse('Каталог недоступен', 'api_unavailable', undefined, 0, 'network');
    }
    if (!res.ok) throw await this.toApiError(res, 'Каталог недоступен');
    return await this.parseResponseJson(res);
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch {
      throw new ApiErrorResponse('Рекомендации недоступны', 'api_unavailable', undefined, 0, 'network');
    }
    if (!res.ok) throw await this.toApiError(res, 'Рекомендации недоступны');
    const data = await this.parseResponseJson(res);
    if (!Array.isArray(data.items) || typeof data.catalog_version !== 'string') {
      throw new ApiErrorResponse('Некорректный ответ рекомендаций', 'invalid_response', undefined, res.status, 'unavailable');
    }
    return data;
  }

  async getMeasure(id: string): Promise<MeasureRecord> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/measures/${id}`);
    } catch {
      throw new ApiErrorResponse('Мера недоступна', 'api_unavailable', undefined, 0, 'network');
    }
    if (!res.ok) throw await this.toApiError(res, `Мера поддержки "${id}" не найдена в каталоге`);
    const item = await this.parseResponseJson(res);
    if (!item || item.id !== id) {
      throw new ApiErrorResponse('Сервер вернул другую меру', 'invalid_response');
    }
    return item;
  }

  async getAllMeasures(): Promise<MeasureRecord[]> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/measures`);
    } catch {
      throw new ApiErrorResponse('Каталог мер недоступен', 'api_unavailable', undefined, 0, 'network');
    }
    if (!res.ok) throw await this.toApiError(res, 'Каталог мер недоступен');
    const items = await this.parseResponseJson(res);
    if (!Array.isArray(items)) throw new ApiErrorResponse('Некорректный ответ каталога', 'invalid_response');
    return items;
  }

  async saveMeasure(measureId: string): Promise<{ measure_id: string; saved: boolean }> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/measures/${measureId}/save`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch {
      throw new ApiErrorResponse('Не удалось сохранить меру', 'api_unavailable', undefined, 0, 'network');
    }
    if (!res.ok) throw await this.toApiError(res, 'Не удалось сохранить меру');
    return await this.parseResponseJson(res);
  }

  async removeSavedMeasure(measureId: string): Promise<{ measure_id: string; saved: boolean }> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/measures/${measureId}/save`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
    } catch {
      throw new ApiErrorResponse('Не удалось удалить меру', 'api_unavailable', undefined, 0, 'network');
    }
    if (!res.ok) throw await this.toApiError(res, 'Не удалось удалить меру');
    return await this.parseResponseJson(res);
  }

  async getSavedMeasures(): Promise<string[]> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/measures/saved`, {
        headers: this.getAuthHeaders(),
      });
    } catch {
      throw new ApiErrorResponse('Сохранённые меры недоступны', 'api_unavailable', undefined, 0, 'network');
    }
    if (!res.ok) throw await this.toApiError(res, 'Сохранённые меры недоступны');
    const data = await this.parseResponseJson(res);
    if (!Array.isArray(data.measure_ids)) {
      throw new ApiErrorResponse('Некорректный ответ сохранённых мер', 'invalid_response');
    }
    return data.measure_ids;
  }

  async submitQuiz(
    quizVersion: string,
    answers: Record<string, string>,
  ): Promise<QuizSubmitResult> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/v1/quiz/submit`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          quiz_version: quizVersion,
          answers,
        }),
      });
    } catch {
      throw new ApiErrorResponse(
        'Не удалось связаться с сервером проверки квиза',
        'api_unavailable',
        undefined,
        0,
        'network',
      );
    }
    if (!res.ok) {
      throw await this.toApiError(res, 'Квиз не удалось проверить');
    }
    const data = await this.parseResponseJson(res);
    if (
      typeof data.attempt_id !== 'string' ||
      typeof data.score !== 'number' ||
      typeof data.passed !== 'boolean' ||
      (data.passed && !data.certificate)
    ) {
      throw new ApiErrorResponse(
        'Сервер вернул неполный результат квиза',
        'invalid_response',
        undefined,
        res.status,
        'unavailable',
      );
    }
    return data;
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
