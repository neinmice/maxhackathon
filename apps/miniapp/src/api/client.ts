import type {
  CatalogFiltersResponse,
  MeasureRecord,
  RecommendationRequest,
  RecommendationResponse,
} from '../types/api';
import { FIXTURE_MEASURES } from './fixtures';

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

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async getHealth(): Promise<{ status: string; version: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) throw new Error(`Health check failed with ${res.status}`);
      return await res.json();
    } catch {
      return { status: 'mock_ok', version: '0.1.0' };
    }
  }

  async getCatalogFilters(): Promise<CatalogFiltersResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/catalog/filters`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }

    return {
      regions: ['kazan', 'moscow', 'spb'],
      roles: ['ip', 'self_employed', 'llc'],
      tax_modes: ['usn6', 'usn15', 'none', 'osno'],
      sectors: [
        'Любая сфера деятельности',
        'IT, инновации и цифровые сервисы',
        'Услуги и торговля',
        'Производство, креативные индустрии',
        'Электронная коммерция',
      ],
    };
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Network failure, fallback to curated dataset
    }

    // Curated local deterministic filtering fallback
    const filtered = FIXTURE_MEASURES.filter((item) => {
      if (item.region !== request.region) return false;
      if (!item.roles.includes(request.role)) return false;
      if (request.tax_mode && !item.tax_modes.includes(request.tax_mode)) return false;
      return true;
    });

    return {
      items: filtered.map((item) => ({
        id: item.id,
        title: item.title,
        data_status: item.data_status,
        match_reasons: [
          `Регион: ${item.region.toUpperCase()}`,
          `Форма бизнеса: ${request.role.toUpperCase()}`,
        ],
        freshness: item.last_checked,
      })),
      catalog_version: 'zvery-verified-2026-09-20',
    };
  }

  async getMeasure(id: string): Promise<MeasureRecord> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/measures/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback
    }

    const item = FIXTURE_MEASURES.find((m) => m.id === id);
    if (item) return item;

    throw new ApiErrorResponse(`Мера поддержки "${id}" не найдена в каталоге`, 'measure_not_found');
  }

  async getAllMeasures(): Promise<MeasureRecord[]> {
    return FIXTURE_MEASURES;
  }
}

export const apiClient = new ApiClient();
