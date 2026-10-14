import { RiskBand, ReviewStatus, ScanStatus, SourceResultStatus, DataOrigin, PlatformOrStore } from '../types/brandguard';

export const BANDS: Record<RiskBand, { label: string; glyphClass: string; colorVar: string; description: string }> = {
  high: {
    label: 'High',
    glyphClass: 'glyph-high',
    colorVar: 'var(--high)',
    description: 'Strong corroborating evidence of impersonation. Immediate review recommended.',
  },
  medium: {
    label: 'Medium',
    glyphClass: 'glyph-medium',
    colorVar: 'var(--med)',
    description: 'Suspicious indicators detected alongside look-alike name or asset markers.',
  },
  needs_review: {
    label: 'Needs review',
    glyphClass: 'glyph-needs-review',
    colorVar: 'var(--rev)',
    description: 'Look-alike pattern found, but corroborating signals are limited or capped by rule gates.',
  },
  ignored: {
    label: 'Ignored',
    glyphClass: 'glyph-ignored',
    colorVar: 'var(--ign)',
    description: 'Scores below threshold or legitimate distinct entity.',
  },
};

export const REVIEW_STATUSES: Record<ReviewStatus, { label: string; description: string }> = {
  new: { label: 'New', description: 'Discovered candidate awaiting initial triage.' },
  under_review: { label: 'Under review', description: 'Analyst is currently evaluating candidate evidence.' },
  confirmed: { label: 'Confirmed', description: 'Confirmed brand impersonation.' },
  false_positive: { label: 'False positive', description: 'Legitimate or unrelated account/app.' },
  resolved: { label: 'Resolved', description: 'Remediated or taken down.' },
};

export const SCAN_STATUSES: Record<ScanStatus, { label: string; glyphClass: string }> = {
  queued: { label: 'Queued', glyphClass: 'glyph-needs-review' },
  running: { label: 'Running', glyphClass: 'glyph-needs-review' },
  completed: { label: 'Completed', glyphClass: 'glyph-status-completed' },
  partial: { label: 'Partial', glyphClass: 'glyph-status-partial' },
  failed: { label: 'Failed', glyphClass: 'glyph-status-failed' },
};

export const SOURCE_RESULTS: Record<SourceResultStatus, { label: string; glyphClass: string }> = {
  ok: { label: 'Completed', glyphClass: 'glyph-status-completed' },
  cached: { label: 'Completed from cache', glyphClass: 'glyph-status-completed' },
  rate_limited: { label: 'Rate limited', glyphClass: 'glyph-status-partial' },
  timeout: { label: 'Timed out', glyphClass: 'glyph-status-partial' },
  access_not_configured: { label: 'Not configured', glyphClass: 'glyph-status-partial' },
  failed: { label: 'Failed', glyphClass: 'glyph-status-failed' },
  circuit_open: { label: 'Paused after repeated failures', glyphClass: 'glyph-status-partial' },
  skipped: { label: 'Skipped', glyphClass: 'glyph-ignored' },
};

export const DATA_ORIGINS: Record<DataOrigin, { label: string; description: string }> = {
  simulated: { label: 'Simulated data', description: 'Synthetic test dataset provided for offline evaluation.' },
  imported: { label: 'Imported data', description: 'Imported batch of records without direct external scraping.' },
  live: { label: 'Live', description: 'Official API live connection.' },
};

export const PLATFORMS: Record<PlatformOrStore, { label: string; kind: 'social' | 'app'; placeholderHandle: string }> = {
  instagram: { label: 'Instagram', kind: 'social', placeholderHandle: 'e.g. brandname' },
  x: { label: 'X', kind: 'social', placeholderHandle: 'e.g. brandname' },
  facebook: { label: 'Facebook', kind: 'social', placeholderHandle: 'e.g. brandname' },
  linkedin: { label: 'LinkedIn', kind: 'social', placeholderHandle: 'e.g. brandname' },
  youtube: { label: 'YouTube', kind: 'social', placeholderHandle: 'e.g. brandname' },
  telegram: { label: 'Telegram', kind: 'social', placeholderHandle: 'e.g. brandname' },
  google_play: { label: 'Google Play', kind: 'app', placeholderHandle: 'e.g. com.brand.app' },
  apple_app_store: { label: 'App Store', kind: 'app', placeholderHandle: 'e.g. id123456789 or bundle ID' },
};

export const SIGNALS: Record<string, { label: string; description: string }> = {
  name: { label: 'Name similarity', description: 'Look-alike pattern, confusable glyphs, or character manipulation.' },
  logo: { label: 'Logo / Icon', description: 'Perceptual hash and HSV histogram distance against registered marks.' },
  bio_similarity: { label: 'Bio similarity / Description', description: 'TF-IDF cosine similarity against official reference copy.' },
  identity_conflict: { label: 'Identity conflict', description: 'Claims official or links to off-domain destination.' },
  scam_language: { label: 'Scam language', description: 'High-risk phrases like OTP, prize claims, or unverified refund claims.' },
  publisher_mismatch: { label: 'Publisher', description: 'Candidate app developer does not match registered developer identity.' },
  package_id_conflict: { label: 'Package ID', description: 'Package or bundle ID copies brand token under different namespace.' },
};

export const LOOKALIKE_TECHNIQUES: Record<string, { title: string; description: string }> = {
  adjacent_transposition: { title: 'Swapped letters', description: 'Two adjacent letters swapped in the brand name.' },
  leetspeak: { title: 'Look-alike digits or symbols', description: 'Numbers or symbols substituted for letters (e.g. 0 for o, 1 for l).' },
  confusable_characters: { title: 'Look-alike characters', description: 'Visually indistinguishable characters mapped through Unicode confusables.' },
  mixed_script: { title: 'Mixed scripts in one word', description: 'Characters from multiple Unicode scripts inside a single word token.' },
  added_word: { title: 'Added word', description: 'High-risk affix attached (e.g. support, help, official, rewards, care).' },
  spacing_punctuation_variant: { title: 'Case, spacing or punctuation variant', description: 'Altered dots, dashes, underscores or casing.' },
  character_substitution: { title: 'One letter changed', description: 'Single character replaced with an edit distance of 1.' },
  character_insertion: { title: 'One letter added', description: 'Single character inserted.' },
  character_deletion: { title: 'One letter missing', description: 'Single character removed.' },
  two_edit_variant: { title: 'Two small edits', description: 'Two character modifications on a longer brand name.' },
  reordered_words: { title: 'Reordered words', description: 'Same words arranged in a different sequence.' },
  repeated_or_dropped_character: { title: 'Repeated letter', description: 'Duplicated or collapsed character sequence.' },
};

export const GATES: Record<string, { title: string; explanation: string }> = {
  name_only_cap: {
    title: 'Capped at Needs review',
    explanation: 'Only the name matched, so this cannot be rated higher. A name match alone is never enough.',
  },
  low_coverage_cap: {
    title: 'Capped at Needs review',
    explanation: 'Fewer than 60% of evaluation signals were available. Evidence coverage is insufficient for high certainty.',
  },
};
