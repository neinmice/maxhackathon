// Единый production deep-link модуль: классификация payload, приоритет источников, маршрутизация.
// Контракт: docs/API_CONTRACT.md «Deep link» и README «Контракт корректирующего пакета»:
// валиден только measure_<id> с ID каталога, полный payload ≤ 512, маршруты — белый список.

export type DeepLinkRoute = 'home' | 'quiz' | 'cert' | 'catalog' | 'saved' | 'onboarding';

export type DeepLinkAction =
  | { kind: 'route'; route: DeepLinkRoute }
  | { kind: 'measure'; measureId: string };

export type LaunchDeps = {
  openMeasure: (measureId: string) => void;
  openQuiz: () => void;
  openOnboarding: () => void;
  navigate: (path: string) => void;
};

const MEASURE_PREFIX = 'measure_';
const MAX_PAYLOAD_LENGTH = 512;
// Полный payload ≤ 512, поэтому ID ≤ 504 ('measure_' = 8 символов)
const MAX_MEASURE_ID_LENGTH = MAX_PAYLOAD_LENGTH - MEASURE_PREFIX.length;

const ROUTES: readonly DeepLinkRoute[] = ['home', 'quiz', 'cert', 'catalog', 'saved', 'onboarding'];

// ID: lowercase a-z/цифры, дефисы только между непустыми сегментами
const MEASURE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidMeasureId(id: string): boolean {
  return id.length > 0 && id.length <= MAX_MEASURE_ID_LENGTH && MEASURE_ID_RE.test(id);
}

// Синтаксис payload доказывает только форму; существование ID проверяет сервер через getMeasure
export function classifyStartParam(value: string | null | undefined): DeepLinkAction | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_PAYLOAD_LENGTH) {
    return null;
  }
  if (value.startsWith(MEASURE_PREFIX)) {
    const id = value.slice(MEASURE_PREFIX.length);
    return isValidMeasureId(id) ? { kind: 'measure', measureId: id } : null;
  }
  return (ROUTES as readonly string[]).includes(value)
    ? { kind: 'route', route: value as DeepLinkRoute }
    : null;
}

// Первый непустой источник фиксируется: невалидный приоритетный не проваливается к нижним.
// Порядок: bridge initDataUnsafe.start_param → query startapp → tgWebAppStartParam → start_param → hash (те же ключи).
export function resolveLaunchParam(env: {
  bridgeStartParam?: string | null;
  search?: string | null;
  hash?: string | null;
}): string | null {
  const candidates: (string | null | undefined)[] = [
    env.bridgeStartParam,
    ...paramValues(env.search),
    ...paramValues(env.hash),
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  }
  return null;
}

function paramValues(source: string | null | undefined): (string | null)[] {
  if (typeof source !== 'string' || source.length === 0) return [null];
  const params = new URLSearchParams(source.replace(/^#/, ''));
  return [params.get('startapp'), params.get('tgWebAppStartParam'), params.get('start_param')];
}

// Читает фактические источники окружения MAX; безопасен при отсутствии window
export function resolveLaunchParamFromWindow(): string | null {
  if (typeof window === 'undefined') return null;
  const env = window as any;
  const bridge = env.WebApp ?? env.MAXBridge;
  return resolveLaunchParam({
    bridgeStartParam: bridge?.initDataUnsafe?.start_param ?? null,
    search: typeof env.location?.search === 'string' ? env.location.search : null,
    hash: typeof env.location?.hash === 'string' ? env.location.hash : null,
  });
}

// Orchestration: resolve/classify → маршруты или getMeasure через deps.openMeasure.
// Возвращает false для всех невалидных payload — карточка и первая запись не открываются.
export function applyLaunchParam(raw: string | null | undefined, deps: LaunchDeps): boolean {
  const action = classifyStartParam(raw);
  if (!action) return false;
  if (action.kind === 'measure') {
    deps.openMeasure(action.measureId);
    return true;
  }
  switch (action.route) {
    case 'quiz':
    case 'cert':
      deps.openQuiz();
      break;
    case 'catalog':
      deps.navigate('/grants');
      break;
    case 'saved':
      deps.navigate('/profile');
      break;
    case 'home':
      deps.navigate('/');
      break;
    case 'onboarding':
      deps.openOnboarding();
      break;
  }
  return true;
}
