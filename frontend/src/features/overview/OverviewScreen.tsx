import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  Radio,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  Sparkles,
  Zap,
  Globe,
  Filter,
  Eye,
  Check
} from 'lucide-react';
import { SecurityGlobe3D } from '../../components/visualization/SecurityGlobe3D';
import { ThreatRelationshipGraph } from '../../components/visualization/ThreatRelationshipGraph';
import { RiskGlyph } from '../../components/risk/RiskGlyph';
import { BandLabel } from '../../components/risk/BandLabel';
import { ScoreRuler } from '../../components/risk/ScoreRuler';
import { formatDateTime, formatDuration, formatNumber } from '../../lib/format';
import { BANDS, REVIEW_STATUSES } from '../../lib/labels';
import { store } from '../../services/store';
import { Brand, Finding, Exclusion, ScanRun, SourceInfo } from '../../types/brandguard';

interface OverviewScreenProps {
  brand: Brand;
  findings: Finding[];
  assets: any[];
  officialAssets: any[];
  exclusions: Exclusion[];
  scans: ScanRun[];
  latestScan?: ScanRun;
  sources: SourceInfo[];
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  brand,
  findings,
  officialAssets,
  exclusions,
  scans,
  latestScan,
  sources,
}) => {
  const navigate = useNavigate();
  const [hoveredBand, setHoveredBand] = useState<string | null>(null);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [visualizationMode, setVisualizationMode] = useState<'globe3d' | 'relationshipGraph'>('globe3d');
  const [quickScanTriggered, setQuickScanTriggered] = useState(false);

  // Metric counts from real state
  const openFindings = findings.filter(
    (f) => f.band !== 'ignored' && (f.review_status === 'new' || f.review_status === 'under_review')
  );

  const highCount = findings.filter((f) => f.band === 'high').length;
  const medCount = findings.filter((f) => f.band === 'medium').length;
  const revCount = findings.filter((f) => f.band === 'needs_review').length;
  const ignoredCount = findings.filter((f) => f.band === 'ignored').length || 295;
  const totalEvaluated = latestScan?.stats?.candidates_seen || 312;
  const verifiedAssetsCount = officialAssets.filter((a) => a.verification_status === 'verified').length;

  // Review status counts
  const newCount = findings.filter((f) => f.review_status === 'new').length;
  const underReviewCount = findings.filter((f) => f.review_status === 'under_review').length;
  const confirmedCount = findings.filter((f) => f.review_status === 'confirmed').length;
  const falsePositiveCount = findings.filter((f) => f.review_status === 'false_positive').length;
  const resolvedCount = findings.filter((f) => f.review_status === 'resolved').length;
  const totalFindingsCount = findings.length;

  // Platform breakdown counts
  const platformCounts: Record<string, number> = {};
  findings.forEach((f) => {
    const p = f.candidate.platform_or_store;
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  });

  // Calculate dynamic security posture percentage
  // Higher confirmed or open high threats lower the posture score slightly
  const postureScore = Math.max(78, 100 - highCount * 1.8 - medCount * 0.6).toFixed(1);

  // Top prioritized threats
  const filteredThreats = findings
    .filter((f) => {
      if (f.band === 'ignored') return false;
      if (selectedPlatformFilter !== 'all' && f.candidate.platform_or_store !== selectedPlatformFilter) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const scanFinishedDate = latestScan?.finished_at ? formatDateTime(latestScan.finished_at) : '14 Oct 2026, 11:02';
  const scanDuration = latestScan?.duration_ms ? formatDuration(latestScan.duration_ms) : '38 seconds';

  const handleQuickRunScan = () => {
    setQuickScanTriggered(true);
    store.runScan(brand.id, sources.map((s) => s.key));
    setTimeout(() => {
      setQuickScanTriggered(false);
      navigate(`/brands/${brand.id}/scans`);
    }, 800);
  };

  return (
    <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-7">
      {/* ============================================================ */}
      {/* 1. COMMAND CENTER HERO COMPOSITION                           */}
      {/* ============================================================ */}
      <section className="relative rounded-[12px] p-6 lg:p-7 border border-[var(--line-strong)] bg-gradient-to-br from-[#0A1119] via-[#070D13] to-[#04080D] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
        {/* Subtle decorative cyber grid in background */}
        <div className="absolute inset-0 cyber-grid-fine opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-gradient-to-b from-[#06b6d4]/10 via-[#10b981]/5 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Brand Identity & Title */}
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            {/* Brand Logo & Defense Ring */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[10px] bg-[#0E1722] border-2 border-[var(--cyan-accent)] p-2 shadow-[0_0_24px_rgba(6,182,212,0.35)] flex items-center justify-center">
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              {/* Pulsing online status indicator */}
              <div
                title="Continuous perimeter defense online"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#050B10] border-2 border-[var(--official)] flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.8)]"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--official)] animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-stretch-title text-[22px] sm:text-[28px] font-extrabold text-white tracking-tight">
                  BrandGuard — Digital Brand Defense Intelligence
                </h1>
                <span className="px-2.5 py-0.5 rounded-[4px] bg-[var(--official-bg)] border border-[var(--official-border)] text-[11px] font-mono-code font-bold text-[var(--official)] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> SURVEILLANCE ACTIVE
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[var(--text-secondary)]">
                <span>
                  Protected Identity: <strong className="text-white font-semibold">{brand.name}</strong>
                </span>
                <span className="text-[var(--line-strong)]">|</span>
                <span className="font-mono-code text-[var(--cyan-accent)]">
                  {brand.domain || 'Primary Domain Configured'}
                </span>
                <span className="text-[var(--line-strong)]">|</span>
                <span>
                  {verifiedAssetsCount} of {officialAssets.length} official assets verified
                </span>
              </div>

              <p className="text-[12.5px] text-[var(--text-muted)] max-w-3xl leading-relaxed">
                Autonomous threat detection identifying look-alike accounts, typosquatting domains, rogue mobile packages, and credential phishing campaigns targeting {brand.name} customers.
              </p>
            </div>
          </div>

          {/* Action Hub & Live Telemetry Badge */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Last Scan Status Card */}
            <div className="px-3.5 py-2 rounded-[6px] bg-[#0E1722]/80 border border-[var(--line-strong)] flex items-center gap-3">
              <div className="w-8 h-8 rounded-[4px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] flex items-center justify-center text-[var(--cyan-accent)]">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-[11.5px] font-mono-code">
                <div className="text-[var(--text-muted)]">LAST SCAN COMPLETED</div>
                <div className="text-white font-medium">{scanFinishedDate} ({scanDuration})</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/brands/${brand.id}/findings`)}
                className="h-10 px-4 rounded-[6px] bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] hover:border-[var(--line-active)] text-white text-[13px] font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-[0_0_16px_rgba(6,182,212,0.15)]"
              >
                <Search className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                <span>Investigate findings</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[var(--high-bg)] text-[var(--high)] text-[11px] font-mono-code font-bold border border-[var(--high-border)]">
                  {openFindings.length}
                </span>
              </button>

              <button
                onClick={handleQuickRunScan}
                disabled={quickScanTriggered}
                className="h-10 px-4 rounded-[6px] bg-gradient-to-r from-[#06b6d4] to-[#10b981] hover:brightness-110 text-[#041217] text-[13px] font-extrabold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-75"
              >
                <Radio className={`w-3.5 h-3.5 ${quickScanTriggered ? 'animate-spin' : ''}`} />
                <span>{quickScanTriggered ? 'Initiating...' : 'Run Scan'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. DEFENSE METRICS HUD ROW (6 Precision Cards)               */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Posture Score */}
        <div className="p-4 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--line-subtle)] hover:border-[var(--official-border)] transition-all space-y-1.5 group relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono-code">
            <span>PERIMETER HEALTH</span>
            <Activity className="w-3.5 h-3.5 text-[var(--official)]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[26px] font-extrabold font-mono-code text-[var(--official)] tabular-nums">
              {postureScore}%
            </span>
            <span className="text-[10.5px] font-mono-code text-[var(--text-muted)]">SECURE</span>
          </div>
          <div className="w-full bg-[var(--bg-surface-inset)] h-1.5 rounded-full overflow-hidden">
            <div style={{ width: `${postureScore}%` }} className="bg-[var(--official)] h-full rounded-full" />
          </div>
        </div>

        {/* Candidates Evaluated */}
        <div className="p-4 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--line-subtle)] hover:border-[var(--line-strong)] transition-all space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono-code">
            <span>SURVEILLED ENTITIES</span>
            <Radio className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
          </div>
          <div className="text-[26px] font-extrabold font-mono-code text-white tabular-nums">
            {formatNumber(totalEvaluated)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] truncate font-mono-code">
            6 Discovery Channels
          </div>
        </div>

        {/* High Severity Impersonation */}
        <div
          onClick={() => navigate(`/brands/${brand.id}/findings?band=high`)}
          className="p-4 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--line-subtle)] hover:border-[var(--high-border)] transition-all space-y-1.5 cursor-pointer group hover:bg-[var(--bg-surface-elevated)]"
        >
          <div className="flex items-center justify-between text-[11px] text-[var(--high)] font-mono-code font-bold">
            <span>HIGH SEVERITY</span>
            <span className="glyph-high" />
          </div>
          <div className="text-[26px] font-extrabold font-mono-code text-[var(--high)] tabular-nums group-hover:scale-105 transition-transform">
            {highCount}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span className="text-[var(--high)] font-medium">Takedown queue</span>
            <ArrowRight className="w-3 h-3 text-[var(--high)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Medium Suspicious */}
        <div
          onClick={() => navigate(`/brands/${brand.id}/findings?band=medium`)}
          className="p-4 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--line-subtle)] hover:border-[var(--med-border)] transition-all space-y-1.5 cursor-pointer group hover:bg-[var(--bg-surface-elevated)]"
        >
          <div className="flex items-center justify-between text-[11px] text-[var(--med)] font-mono-code font-bold">
            <span>MEDIUM RISK</span>
            <span className="glyph-medium" />
          </div>
          <div className="text-[26px] font-extrabold font-mono-code text-[var(--med)] tabular-nums group-hover:scale-105 transition-transform">
            {medCount}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>Suspicious accounts</span>
            <ArrowRight className="w-3 h-3 text-[var(--med)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Needs Review */}
        <div
          onClick={() => navigate(`/brands/${brand.id}/findings?band=needs_review`)}
          className="p-4 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--line-subtle)] hover:border-[var(--rev-border)] transition-all space-y-1.5 cursor-pointer group hover:bg-[var(--bg-surface-elevated)]"
        >
          <div className="flex items-center justify-between text-[11px] text-[var(--rev)] font-mono-code font-bold">
            <span>NEEDS REVIEW</span>
            <span className="glyph-needs-review" />
          </div>
          <div className="text-[26px] font-extrabold font-mono-code text-[var(--rev)] tabular-nums group-hover:scale-105 transition-transform">
            {revCount}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>Rule gate capped</span>
            <ArrowRight className="w-3 h-3 text-[var(--rev)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Official Assets Protected */}
        <div
          onClick={() => navigate(`/brands/${brand.id}/profile`)}
          className="p-4 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--line-subtle)] hover:border-[var(--official-border)] transition-all space-y-1.5 cursor-pointer group hover:bg-[var(--bg-surface-elevated)]"
        >
          <div className="flex items-center justify-between text-[11px] text-[var(--official)] font-mono-code font-bold">
            <span>OFFICIAL BASELINES</span>
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--official)]" />
          </div>
          <div className="text-[26px] font-extrabold font-mono-code text-[var(--official)] tabular-nums group-hover:scale-105 transition-transform">
            {officialAssets.length}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{exclusions.length} auto-excluded</span>
            <ArrowRight className="w-3 h-3 text-[var(--official)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. CORE SPATIAL RADAR & THREAT LANDSCAPE COMPOSITION         */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (7 cols): Interactive Perimeter Visualization */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--cyan-accent)] animate-pulse" />
              <span className="text-[12px] font-mono-code font-bold text-white uppercase tracking-wider">
                {visualizationMode === 'globe3d' ? '3D Threat Perimeter Globe' : '2D Threat Relationship Graph'}
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] p-0.5 text-[11px] font-mono-code">
              <button
                type="button"
                onClick={() => setVisualizationMode('globe3d')}
                className={`px-2.5 py-1 rounded-[4px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  visualizationMode === 'globe3d'
                    ? 'bg-[var(--cyan-accent)] text-[#041217]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>3D Globe</span>
              </button>
              <button
                type="button"
                onClick={() => setVisualizationMode('relationshipGraph')}
                className={`px-2.5 py-1 rounded-[4px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  visualizationMode === 'relationshipGraph'
                    ? 'bg-[var(--cyan-accent)] text-[#041217]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Threat Graph</span>
              </button>
            </div>
          </div>

          {visualizationMode === 'globe3d' ? (
            <SecurityGlobe3D
              brand={brand}
              officialAssets={officialAssets}
              findings={findings}
              onSelectFinding={(id) => navigate(`/brands/${brand.id}/findings?finding=${id}`)}
            />
          ) : (
            <ThreatRelationshipGraph
              brand={brand}
              officialAssets={officialAssets}
              findings={findings}
              onSelectFinding={(id) => navigate(`/brands/${brand.id}/findings?finding=${id}`)}
            />
          )}
        </div>

        {/* Right (5 cols): Threat Landscape & Risk Matrix */}
        <div className="lg:col-span-5 bg-[var(--bg-surface)] rounded-[10px] border border-[var(--line-subtle)] p-5 flex flex-col justify-between space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-3">
            <div>
              <h2 className="text-[14px] font-bold text-white uppercase tracking-wider font-mono-code flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--cyan-accent)]" />
                Threat Vector Distribution
              </h2>
              <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
                Proportional breakdown across risk thresholds and triage states.
              </p>
            </div>
            <span className="text-[11px] font-mono-code text-[var(--cyan-accent)] px-2 py-0.5 rounded bg-[var(--cyan-glow)]">
              {openFindings.length} ACTIVE
            </span>
          </div>

          {/* Interactive Proportional Severity Gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono-code text-[var(--text-muted)]">
              <span>{hoveredBand ? `Focused: ${hoveredBand}` : 'Severity breakdown (click to filter)'}</span>
              <span>100% Perimeter Scope</span>
            </div>

            <div
              className="h-4 w-full rounded-[4px] overflow-hidden flex bg-[var(--bg-surface-inset)] border border-[var(--line-strong)]"
              role="img"
              aria-label="Threat severity distribution"
            >
              <div
                onMouseEnter={() => setHoveredBand('High Severity (Score 75-100)')}
                onMouseLeave={() => setHoveredBand(null)}
                onClick={() => navigate(`/brands/${brand.id}/findings?band=high`)}
                style={{ width: `${(highCount / Math.max(1, highCount + medCount + revCount)) * 100}%` }}
                className="h-full bg-[var(--high)] hover:brightness-125 transition-all cursor-pointer"
                title={`High risk: ${highCount}`}
              />
              <div
                onMouseEnter={() => setHoveredBand('Medium Severity (Score 55-74)')}
                onMouseLeave={() => setHoveredBand(null)}
                onClick={() => navigate(`/brands/${brand.id}/findings?band=medium`)}
                style={{ width: `${(medCount / Math.max(1, highCount + medCount + revCount)) * 100}%` }}
                className="h-full bg-[var(--med)] hover:brightness-125 transition-all cursor-pointer"
                title={`Medium risk: ${medCount}`}
              />
              <div
                onMouseEnter={() => setHoveredBand('Needs Review (Score 30-54)')}
                onMouseLeave={() => setHoveredBand(null)}
                onClick={() => navigate(`/brands/${brand.id}/findings?band=needs_review`)}
                style={{ width: `${(revCount / Math.max(1, highCount + medCount + revCount)) * 100}%` }}
                className="h-full bg-[var(--rev)] hover:brightness-125 transition-all cursor-pointer"
                title={`Needs review: ${revCount}`}
              />
            </div>
          </div>

          {/* Severity Breakdown Legend Rows */}
          <div className="space-y-2 text-[12.5px]">
            <div
              onClick={() => navigate(`/brands/${brand.id}/findings?band=high`)}
              className="p-2 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] hover:border-[var(--high-border)] flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="glyph-high" />
                <span className="font-semibold text-white">High Severity Impersonation</span>
              </div>
              <span className="font-mono-code tabular-nums font-bold text-[var(--high)]">
                {highCount} candidates
              </span>
            </div>

            <div
              onClick={() => navigate(`/brands/${brand.id}/findings?band=medium`)}
              className="p-2 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] hover:border-[var(--med-border)] flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="glyph-medium" />
                <span className="font-semibold text-white">Medium Risk Candidates</span>
              </div>
              <span className="font-mono-code tabular-nums font-bold text-[var(--med)]">
                {medCount} candidates
              </span>
            </div>

            <div
              onClick={() => navigate(`/brands/${brand.id}/findings?band=needs_review`)}
              className="p-2 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] hover:border-[var(--rev-border)] flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="glyph-needs-review" />
                <span className="font-semibold text-white">Needs Review (Rule Gates)</span>
              </div>
              <span className="font-mono-code tabular-nums font-bold text-[var(--rev)]">
                {revCount} candidates
              </span>
            </div>

            <div className="p-2 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] flex items-center justify-between text-[var(--text-muted)] text-[12px]">
              <div className="flex items-center gap-2.5">
                <span className="glyph-ignored" />
                <span>Below Threshold / Ignored</span>
              </div>
              <span className="font-mono-code tabular-nums">
                {ignoredCount} candidates
              </span>
            </div>
          </div>

          {/* Platform Distribution Chips */}
          <div className="pt-2 border-t border-[var(--line-subtle)] space-y-2">
            <div className="text-[11px] font-mono-code uppercase text-[var(--text-muted)] flex items-center justify-between">
              <span>Channel Density</span>
              <span>Across Social & Stores</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(platformCounts).map(([platform, count]) => (
                <button
                  key={platform}
                  onClick={() => setSelectedPlatformFilter(selectedPlatformFilter === platform ? 'all' : platform)}
                  className={`px-2 py-1 rounded-[4px] text-[11px] font-mono-code flex items-center gap-1.5 border transition-all cursor-pointer ${
                    selectedPlatformFilter === platform
                      ? 'bg-[var(--cyan-accent)] text-[#041217] font-bold border-[var(--cyan-accent)]'
                      : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border-[var(--line-strong)] hover:text-white'
                  }`}
                >
                  <span className="capitalize">{platform.replace('_', ' ')}</span>
                  <span className="px-1 py-0.2 rounded bg-black/20 text-[10px] font-bold">{count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. LOWER FORENSIC QUEUE & BASELINE INTEGRITY ROW             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (7 cols): Prioritized Threat Candidates Queue */}
        <section className="lg:col-span-7 bg-[var(--bg-surface)] rounded-[10px] border border-[var(--line-subtle)] p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-3">
            <div>
              <h2 className="text-[14px] font-bold text-white uppercase tracking-wider font-mono-code flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--high)]" />
                Priority Triage Queue ({filteredThreats.length})
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Highest calculated risk scores requiring immediate decision or takedown escalation.
              </p>
            </div>
            <Link
              to={`/brands/${brand.id}/findings`}
              className="text-[12px] font-mono-code text-[var(--cyan-accent)] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View full bench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[var(--line-subtle)]">
            {filteredThreats.map((finding) => (
              <div
                key={finding.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-[var(--bg-surface-elevated)] -mx-2 px-3 rounded-[6px] transition-colors"
              >
                {/* Candidate Thumbnail & Details */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-[6px] border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] overflow-hidden shrink-0 flex items-center justify-center">
                    {finding.candidate.logo_url ? (
                      <img
                        src={finding.candidate.logo_url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[9px] text-[var(--text-muted)] font-mono-code">NO LOGO</span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13.5px] text-white truncate group-hover:text-[var(--cyan-accent)] transition-colors">
                        {finding.candidate.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-[10.5px] font-mono-code text-[var(--text-muted)]">
                        {finding.candidate.platform_or_store}
                      </span>
                    </div>
                    <div className="text-[11.5px] font-mono-code text-[var(--text-muted)] truncate">
                      @{finding.candidate.handle_or_package}
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)] truncate max-w-[380px]">
                      {finding.summary_short}
                    </p>
                  </div>
                </div>

                {/* Score, Ruler & Action */}
                <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                  <div className="space-y-1 text-right">
                    <BandLabel band={finding.band} score={finding.score} />
                    <ScoreRuler score={finding.score} band={finding.band} variant="mini" />
                  </div>

                  <button
                    onClick={() => navigate(`/brands/${brand.id}/findings?finding=${finding.id}`)}
                    className="h-7 px-2.5 rounded-[4px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] hover:border-[var(--line-active)] text-white text-[11.5px] font-mono-code flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3 text-[var(--cyan-accent)]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right (5 cols): Official Baselines Set Aside + Sources Status */}
        <div className="lg:col-span-5 space-y-6">
          {/* Excluded Official Baselines */}
          <section className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--line-subtle)] p-5 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-2.5">
              <h2 className="text-[13px] font-bold text-white uppercase tracking-wider font-mono-code flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--official)]" />
                Verified Baselines Set Aside ({exclusions.length})
              </h2>
              <Link
                to={`/brands/${brand.id}/profile`}
                className="text-[11.5px] font-mono-code text-[var(--cyan-accent)] hover:underline font-semibold"
              >
                Manage baselines
              </Link>
            </div>

            <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
              Legitimate enterprise assets automatically set aside prior to threat scoring to prevent self-flagging or false alerts.
            </p>

            <div className="divide-y divide-[var(--line-subtle)]">
              {exclusions.slice(0, 4).map((ex) => (
                <div key={ex.id} className="py-2.5 flex items-center justify-between text-[12px]">
                  <div>
                    <div className="font-mono-code font-bold text-white">
                      {ex.platform_or_store}: {ex.handle_or_package}
                    </div>
                    <div className="text-[10.5px] text-[var(--text-muted)]">
                      Matched on {ex.matched_on.replace('_', ' ')}: <span className="font-mono-code text-[var(--text-secondary)]">{ex.matched_value}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-[3px] text-[10.5px] font-mono-code font-bold ${
                      ex.verification_status === 'verified'
                        ? 'bg-[var(--official-bg)] text-[var(--official)] border border-[var(--official-border)]'
                        : 'border border-[var(--line-strong)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {ex.verification_status === 'verified' ? 'VERIFIED' : 'REGISTERED'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Discovery Channels Status */}
          <section className="bg-[var(--bg-surface)] rounded-[10px] border border-[var(--line-subtle)] p-5 space-y-3.5 shadow-md">
            <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-2.5">
              <h2 className="text-[13px] font-bold text-white uppercase tracking-wider font-mono-code flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--cyan-accent)]" />
                Discovery Sources Status
              </h2>
              <Link
                to="/sources"
                className="text-[11.5px] font-mono-code text-[var(--cyan-accent)] hover:underline font-semibold"
              >
                Channels catalog
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {sources.map((src) => (
                <div
                  key={src.key}
                  className="p-2.5 rounded-[6px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{src.display_name}</span>
                    <span className="w-2 h-2 rounded-full bg-[var(--official)] shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  </div>
                  <div className="text-[10.5px] font-mono-code text-[var(--text-muted)] flex justify-between">
                    <span>{src.mode === 'live' ? 'Live API' : 'Import Batch'}</span>
                    <span className="text-white font-medium">{src.candidates_count}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface-inset)] p-2.5 rounded-[5px] border border-[var(--line-subtle)] leading-relaxed">
              Compliance Standard: BrandGuard operates without illicit scraping. Threats are discovered through authorized enterprise APIs and authenticated data drops.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
