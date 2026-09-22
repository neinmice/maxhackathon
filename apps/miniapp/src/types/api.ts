export type Region = 'kazan' | 'moscow' | 'spb';
export type Role = 'ip' | 'self_employed' | 'llc';
export type TaxMode = 'usn6' | 'usn15' | 'none' | 'osno' | string;

export type DataStatus = 'MODEL DATA' | 'CONFIRMED' | 'VERIFIED';
export type FreshnessStatus = 'fresh' | 'reviewed' | 'model';

export interface MeasureRecord {
  id: string;
  title: string;
  operator: string;
  region: Region;
  roles: Role[];
  tax_modes: string[];
  sector: string;
  goal: string;
  eligibility: string;
  documents: string[];
  deadline: string | null;
  source_name: string;
  source_url: string;
  last_checked: string;
  freshness_status: FreshnessStatus;
  data_status: DataStatus;
  disclaimer: string;
  amount_description?: string;
  category?: 'start' | 'programs' | 'finance' | 'grants';
}

export interface RecommendationRequest {
  region: Region;
  role: Role;
  tax_mode: string;
  sector?: string;
  goal?: string;
}

export interface RecommendationItem {
  id: string;
  title: string;
  data_status: DataStatus;
  match_reasons?: string[];
  freshness?: string;
}

export interface RecommendationResponse {
  items: RecommendationItem[];
  catalog_version: string;
}

export interface CatalogFiltersResponse {
  regions: Region[];
  roles: Role[];
  tax_modes: string[];
  sectors: string[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    request_id?: string;
  };
}

export interface UserProfile {
  region: Region;
  role: Role;
  tax_mode: string;
  sector: string;
  goal: string;
  isOnboarded: boolean;
}
