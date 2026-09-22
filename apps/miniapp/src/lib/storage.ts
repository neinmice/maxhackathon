import type { UserProfile, Region, Role } from '../types/api';

const STORAGE_KEYS = {
  PROFILE: 'zvery_user_profile_v1',
  SAVED_MEASURES: 'zvery_saved_measures_v1',
  CHECKLIST_PROGRESS: 'zvery_checklist_progress_v1',
  CERTIFICATES: 'zvery_certificates_v1',
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

export interface StoredCertificate {
  id: string;
  userName: string;
  date: string;
  score: string;
  title: string;
}

export function loadCertificates(): StoredCertificate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCertificate(cert: StoredCertificate): void {
  const current = loadCertificates();
  const next = [cert, ...current.filter((c) => c.id !== cert.id)];
  try {
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(next));
  } catch (err) {
    console.warn('[Storage] Failed to save certificate:', err);
  }
}
