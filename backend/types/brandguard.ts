/**
 * BrandGuard Domain Types (matching OpenAPI contract)
 */

export type RiskBand = 'high' | 'medium' | 'needs_review' | 'ignored';
export type ReviewStatus = 'new' | 'under_review' | 'confirmed' | 'false_positive' | 'resolved';
export type ScanStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed';
export type SourceResultStatus = 'ok' | 'cached' | 'rate_limited' | 'timeout' | 'access_not_configured' | 'failed' | 'circuit_open' | 'skipped';
export type DataOrigin = 'simulated' | 'imported' | 'live';
export type AssetKind = 'social' | 'app';
export type SocialPlatform = 'instagram' | 'x' | 'facebook' | 'linkedin' | 'youtube' | 'telegram';
export type AppStore = 'google_play' | 'apple_app_store';
export type PlatformOrStore = SocialPlatform | AppStore;
export type VerificationStatus = 'registered' | 'verified';
export type VerificationMethod = 'domain_link' | 'manual';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  domain: string;
  logo_url: string;
  aliases: string[];
  created_at: string;
  updated_at: string;
}

export interface OfficialAsset {
  id: string;
  brand_id: string;
  kind: AssetKind;
  platform?: SocialPlatform;
  handle?: string;
  external_id?: string;
  display_name?: string;
  profile_url?: string;
  bio?: string;
  bio_links?: string[];
  logo_url?: string;
  store?: AppStore;
  package_id?: string;
  app_name?: string;
  developer_name?: string;
  developer_id?: string;
  store_url?: string;
  description?: string;
  icon_url?: string;
  verification_status: VerificationStatus;
  verification_method?: VerificationMethod;
  verification_note?: string;
  verified_at?: string;
  created_at: string;
}

export interface LookalikeTechnique {
  technique: string;
  title: string;
  evidence: string;
  code_points?: string[];
  strength?: 'high' | 'medium' | 'low';
}

export interface LookalikeVariantItem {
  variant: string;
  technique: string;
  technique_title: string;
  explanation: string;
}

export interface SignalBreakdown {
  key: string;
  label?: string;
  name?: string;
  weight: number;
  available: boolean;
  score?: number | null; // 0 to 1
  raw_score?: number | null;
  contribution: number; // contribution points, renormalized over available
  reason: string;
  compared?: {
    official: string;
    candidate: string;
  };
  techniques?: string[];
}

export interface CandidateContext {
  follower_count?: number;
  account_created_at?: string;
  has_platform_badge?: boolean;
  install_count_bucket?: string;
  app_category?: string;
  first_listed?: string;
}

export interface CandidateEntity {
  id: string;
  name: string;
  platform_or_store: PlatformOrStore;
  handle_or_package: string;
  external_id?: string;
  publisher?: string;
  bio_or_desc?: string;
  logo_url?: string;
  links?: string[];
  context?: CandidateContext;
}

export interface ReviewEvent {
  id: string;
  finding_id: string;
  from_status: ReviewStatus;
  to_status: ReviewStatus;
  note: string;
  reviewer: string;
  created_at: string;
}

export interface Finding {
  id: string;
  scan_id: string;
  brand_id: string;
  kind: AssetKind;
  platform_or_store: PlatformOrStore;
  score: number; // 0 to 100
  band: RiskBand;
  coverage_available: number;
  coverage_total: number;
  signals: SignalBreakdown[];
  techniques?: LookalikeTechnique[];
  gates_applied?: string[]; // 'name_only_cap', 'low_coverage_cap'
  summary: string;
  summary_short: string;
  next_step: string;
  matched_asset_id: string;
  review_status: ReviewStatus;
  review_note?: string;
  version?: number;
  engine_version?: string;
  rules_version?: string;
  first_seen_at?: string;
  created_at: string;
  candidate: CandidateEntity;
  official: CandidateEntity;
  review_events: ReviewEvent[];
  data_origin?: DataOrigin;
}

export interface Exclusion {
  id: string;
  scan_id: string;
  candidate_id: string;
  asset_id: string;
  matched_on: 'external_id' | 'handle' | 'package_id' | 'developer_id' | 'handle_or_package';
  matched_value: string;
  platform_or_store: PlatformOrStore;
  handle_or_package: string;
  asset_name: string;
  verification_status: VerificationStatus;
}

export interface ScanSourceResult {
  id: string;
  scan_id: string;
  source_key: string;
  source_name: string;
  status: SourceResultStatus;
  simulated: boolean;
  message: string;
  candidates_returned: number;
  attempts: number;
  retrieved_at: string;
  duration_ms: number;
}

export interface ScanStats {
  candidates_seen: number;
  duplicates_dropped: number;
  malformed_dropped: number;
  excluded_official: number;
  evaluated: number;
  by_band: {
    ignored: number;
    needs_review: number;
    medium: number;
    high: number;
  };
  by_kind: {
    social: number;
    app: number;
  };
  sources_ok: number;
  sources_failed: number;
}

export interface ScanRun {
  id: string;
  brand_id: string;
  status: ScanStatus;
  requested_sources: string[];
  simulate_failures?: Record<string, string>;
  idempotency_key?: string;
  engine_version: string;
  rules_version: string;
  progress: {
    stage: 'collect' | 'exclusions' | 'scoring' | 'saving' | 'done';
    stage_label: string;
    done: number;
    total: number;
  };
  stats: ScanStats;
  error_message?: string;
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  created_at: string;
  source_results: ScanSourceResult[];
}

export interface DatasetBatch {
  id: string;
  name: string;
  kind: 'social' | 'app' | 'mixed';
  data_origin: DataOrigin;
  brand_id?: string;
  record_count: number;
  created_at: string;
}

export interface SourceInfo {
  key: string;
  display_name: string;
  kind: AssetKind;
  mode: 'import_only' | 'live';
  enabled: boolean;
  limits: string;
  last_status: SourceResultStatus | null;
  last_success_at: string | null;
  candidates_count: number;
  note?: string;
}

export interface EvaluationMetrics {
  flagged: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
    precision: number;
    recall: number;
    fpr: number;
  };
  review: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
    precision: number;
    recall: number;
    fpr: number;
  };
  exclusions: {
    official_set_aside?: number;
    official_total?: number;
    non_official_mistakenly_set_aside?: number;
    accidental_exclusions?: number;
    correctness?: number;
  };
  hard_negatives: {
    passed?: number;
    total?: number;
    tested?: number;
    flagged?: number;
  };
  technique_recall: Array<{
    technique: string;
    title?: string;
    found?: number;
    total?: number;
    recall?: number;
    detected?: number;
    tested?: number;
  }>;
  disclaimer: string;
}

export interface ScoringThresholds {
  bands: Array<{ key: RiskBand; label: string; min: number; max: number }>;
  engine_version: string;
  rules_version: string;
  logo_match_threshold: number;
}
