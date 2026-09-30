import type { UserProfile, Region, Role } from '../types/api';
import type { QuizSubmitResult } from '../api/client';

const STORAGE_KEYS = {
  PROFILE: 'zvery_user_profile_v1',
  SAVED_MEASURES: 'zvery_saved_measures_v1',
  CHECKLIST_PROGRESS: 'zvery_checklist_progress_v1',
  // Legacy-ключ первого прототипа: данные в нём не читаются, не перезаписываются и
  // не мигрируются — demo/boolean-записи не являются серверной историей.
  CERTIFICATES: 'zvery_certificates_v1',
  CERTIFICATES_V2: 'zvery_certificates_v2',
};

export const defaultProfile: UserProfile = {
  region: 'kazan',
  role: 'ip',
  tax_mode: 'usn6',
  sector: 'Услуги и торговля',
  goal: 'Получение гранта или субсидии',
  isOnboarded: false,
};

export function loadUserProfile(): UserProfile {
  if (typeof window === 'undefined') return defaultProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return defaultProfile;
    return { ...defaultProfile, ...JSON.parse(raw) };
  } catch {
    return defaultProfile;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.warn('[Storage] Failed to save profile:', err);
  }
}

export function loadSavedMeasureIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_MEASURES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSavedMeasure(measureId: string): string[] {
  const current = loadSavedMeasureIds();
  const next = current.includes(measureId)
    ? current.filter((id) => id !== measureId)
    : [...current, measureId];
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_MEASURES, JSON.stringify(next));
  } catch (err) {
    console.warn('[Storage] Failed to toggle saved measure:', err);
  }
  return next;
}

export function loadChecklistProgress(): Record<string, Record<string, boolean>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKLIST_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function toggleChecklistItem(measureId: string, itemKey: string): Record<string, Record<string, boolean>> {
  const current = loadChecklistProgress();
  const measureItems = current[measureId] || {};
  const updatedMeasureItems = {
    ...measureItems,
    [itemKey]: !measureItems[itemKey],
  };
  const updated = {
    ...current,
    [measureId]: updatedMeasureItems,
  };
  try {
    localStorage.setItem(STORAGE_KEYS.CHECKLIST_PROGRESS, JSON.stringify(updated));
  } catch (err) {
    console.warn('[Storage] Failed to save checklist progress:', err);
  }
  return updated;
}

// Запись v2 — локальный кэш точного server submit response. cached_at/display_name —
// presentation-only (не issued_at и не официальное имя). Формат и наличие полей НЕ
// доказывают подлинность: криптографической верификации локального кэша нет, HMAC не проверяется.
export interface StoredCertificateV2 {
  schema_version: 2;
  attempt_id: string;
  score: number;
  passed: true;
  pass_score: number;
  certificate: {
    certificate_id: string;
    title: string;
    disclaimer: string;
    payload: string;
  };
  cached_at: string;
  display_name: string;
}

// Presentation-модель UI-списка; userName/date не являются серверными полями.
export interface StoredCertificate {
  id: string;
  userName: string;
  date: string;
  score: string;
  title: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isPercentInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
}

function isValidV2Entry(entry: unknown): entry is StoredCertificateV2 {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as Record<string, unknown>;
  const cert = e.certificate as Record<string, unknown> | null | undefined;
  return (
    e.schema_version === 2 &&
    e.passed === true &&
    isNonEmptyString(e.attempt_id) &&
    isPercentInt(e.score) &&
    isPercentInt(e.pass_score) &&
    (e.score as number) >= (e.pass_score as number) &&
    isNonEmptyString(e.cached_at) &&
    Number.isFinite(Date.parse(e.cached_at)) &&
    isNonEmptyString(e.display_name) &&
    !!cert &&
    isNonEmptyString(cert.certificate_id) &&
    isNonEmptyString(cert.title) &&
    isNonEmptyString(cert.disclaimer) &&
    isNonEmptyString(cert.payload)
  );
}

// Читает только v2. Повреждённый JSON даёт пустой список без перезаписи ключа;
// malformed-записи пропускаются; недоступный storage не превращается в успех записи.
export function loadCertificates(): StoredCertificateV2[] {
  if (typeof window === 'undefined') return [];
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEYS.CERTIFICATES_V2);
  } catch {
    return [];
  }
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isValidV2Entry);
}

// Пишет только валидированный серверный успех; failed/incomplete ответ не сохраняется.
// Локальная оценка не выполняется — только проверка согласованности с server contract.
export function saveCertificateResult(result: QuizSubmitResult, displayName: string): void {
  if (
    !result ||
    result.passed !== true ||
    !isNonEmptyString(result.attempt_id) ||
    !isPercentInt(result.score) ||
    !isPercentInt(result.pass_score) ||
    result.score < result.pass_score
  ) {
    console.warn('[Storage] Certificate save skipped: response does not match server contract');
    return;
  }
  const cert = result.certificate;
  if (
    !cert ||
    !isNonEmptyString(cert.certificate_id) ||
    !isNonEmptyString(cert.title) ||
    !isNonEmptyString(cert.disclaimer) ||
    !isNonEmptyString(cert.payload)
  ) {
    console.warn('[Storage] Certificate save skipped: server certificate incomplete');
    return;
  }
  const entry: StoredCertificateV2 = {
    schema_version: 2,
    attempt_id: result.attempt_id,
    score: result.score,
    passed: true,
    pass_score: result.pass_score,
    certificate: {
      certificate_id: cert.certificate_id,
      title: cert.title,
      disclaimer: cert.disclaimer,
      payload: cert.payload,
    },
    cached_at: new Date().toISOString(),
    display_name: isNonEmptyString(displayName) ? displayName : 'Предприниматель',
  };
  const current = loadCertificates();
  const next = [entry, ...current.filter((c) => c.certificate.certificate_id !== entry.certificate.certificate_id)];
  try {
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES_V2, JSON.stringify(next));
  } catch (err) {
    console.warn('[Storage] Failed to save certificate:', err);
  }
}

function formatCachedDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Адаптер presentation: единственный источник UI-списка сертификатов. Legacy v1 сюда не попадает.
export function loadCertificateViews(): StoredCertificate[] {
  return loadCertificates().map((entry) => ({
    id: entry.certificate.certificate_id,
    userName: entry.display_name,
    date: formatCachedDate(entry.cached_at),
    score: `${entry.score}%`,
    title: entry.certificate.title,
  }));
}
