import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  UserCheck,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { Finding, RiskBand, SignalBreakdown } from '../../types/brandguard';
import { BANDS, REVIEW_STATUSES } from '../../lib/labels';

interface InteractiveRiskAnalysisProps {
  finding: Finding;
  onInspectSignal?: (signalKey: string) => void;
  className?: string;
}

export const InteractiveRiskAnalysis: React.FC<InteractiveRiskAnalysisProps> = ({
  finding,
  onInspectSignal,
  className = '',
}) => {
  const [expandedSignalKey, setExpandedSignalKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'signals' | 'gates' | 'analyst'>('signals');

  const { score, band, signals, coverage_available, coverage_total, gates_applied, review_status, review_note } =
    finding;

  const bandConfig = BANDS[band];

  // Radial calculation (stroke-dasharray for 100 max)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const toggleExpandSignal = (key: string) => {
    setExpandedSignalKey((prev) => (prev === key ? null : key));
  };

  const getSignalColor = (s: SignalBreakdown) => {
    if (!s.available) return '#64748b'; // slate-500
    const sc = typeof s.score === 'number' ? s.score : (s.contribution || 0) / 100;
    if (sc >= 0.75) return '#ef4444'; // red
    if (sc >= 0.4) return '#f59e0b'; // amber
    return '#10b981'; // green
  };

  const availableSignals = signals.filter((s) => s.available);
  const missingSignals = signals.filter((s) => !s.available);

  return (
    <div className={`space-y-4 rounded-[10px] border border-[var(--line-strong)] bg-[#070E16] p-5 ${className}`}>
      {/* Top Header: Radial Gauge + Summary + Threshold Status */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border-b border-[var(--line-subtle)] pb-5">
        {/* Left: Interactive Radial Gauge */}
        <div className="flex items-center gap-5">
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
              {/* Background Track */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="text-[#131F2D]"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Animated Value Ring */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke={bandConfig.colorVar}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter:
                    band === 'high'
                      ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))'
                      : band === 'medium'
                      ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))'
                      : 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.4))',
                }}
              />
            </svg>

            {/* Center Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                className="text-[34px] font-bold font-stretch-numeral tabular-nums leading-none"
                style={{ color: bandConfig.colorVar }}
              >
                {score}
              </span>
              <span className="text-[10px] font-mono-code uppercase text-[var(--text-muted)] tracking-wider mt-0.5">
                / 100 RISK
              </span>
            </div>
          </div>

          {/* Severity & Coverage Description */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-[4px] text-[11px] font-mono-code font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `color-mix(in srgb, ${bandConfig.colorVar} 15%, transparent)`,
                  color: bandConfig.colorVar,
                  border: `1px solid color-mix(in srgb, ${bandConfig.colorVar} 30%, transparent)`,
                }}
              >
                {bandConfig.label} Severity
              </span>

              <span className="text-[11px] font-mono-code text-[var(--cyan-accent)] bg-[var(--cyan-glow)] px-2 py-0.5 rounded-[4px]">
                {coverage_available} of {coverage_total} Signals Active
              </span>
            </div>

            <p className="text-[13px] text-white font-medium leading-relaxed max-w-md">
              {finding.summary}
            </p>

            <div className="flex items-center gap-3 text-[11px] font-mono-code text-[var(--text-muted)] pt-1">
              <span>Threshold: High ≥ 75 · Medium 40–74</span>
              <span>·</span>
              <span className="text-[var(--text-secondary)]">Engine v{finding.engine_version || '1.0.3'}</span>
            </div>
          </div>
        </div>

        {/* Right: Human Review Status Pill */}
        <div className="sm:text-right shrink-0 p-3 rounded-[6px] bg-[#0A141F] border border-[var(--line-strong)] text-[12px] space-y-1">
          <span className="text-[10.5px] font-mono-code text-[var(--text-muted)] uppercase block">
            Analyst Conclusion
          </span>
          <div className="flex items-center sm:justify-end gap-1.5 font-bold font-mono-code text-white">
            <UserCheck className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
            <span>{REVIEW_STATUSES[review_status].label}</span>
          </div>
          {review_note ? (
            <p className="text-[11px] text-[var(--text-secondary)] italic max-w-[200px] truncate" title={review_note}>
              "{review_note}"
            </p>
          ) : (
            <span className="text-[10.5px] text-[var(--text-dim)]">Awaiting permanent sign-off</span>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--line-subtle)] pb-2 text-[12px] font-mono-code">
        <button
          type="button"
          onClick={() => setActiveTab('signals')}
          className={`px-3 py-1 rounded-[4px] font-bold transition-colors cursor-pointer ${
            activeTab === 'signals'
              ? 'bg-[var(--cyan-accent)] text-[#041217]'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Signal Weights & Contribution ({availableSignals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gates')}
          className={`px-3 py-1 rounded-[4px] font-bold transition-colors cursor-pointer ${
            activeTab === 'gates'
              ? 'bg-[var(--cyan-accent)] text-[#041217]'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Rule Gates ({gates_applied?.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analyst')}
          className={`px-3 py-1 rounded-[4px] font-bold transition-colors cursor-pointer ${
            activeTab === 'analyst'
              ? 'bg-[var(--cyan-accent)] text-[#041217]'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Algorithmic vs Analyst Separation
        </button>
      </div>

      {/* Tab 1: Signals Breakdown */}
      {activeTab === 'signals' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono-code text-[var(--text-muted)] px-1">
            <span>DETECTION SIGNAL & EVIDENCE SOURCE</span>
            <div className="flex items-center gap-8">
              <span>WEIGHT</span>
              <span>SCORE</span>
              <span className="w-16 text-right">POINTS</span>
            </div>
          </div>

          <div className="space-y-2">
            {signals.map((sig) => {
              const isExpanded = expandedSignalKey === sig.key;
              const color = getSignalColor(sig);
              const scoreVal = typeof sig.score === 'number' ? sig.score : typeof sig.raw_score === 'number' ? sig.raw_score : 0;
              const percentScore = Math.round(scoreVal * 100);

              return (
                <div
                  key={sig.key}
                  className={`rounded-[6px] border transition-all ${
                    isExpanded
                      ? 'border-[var(--cyan-accent)] bg-[#0C1724]'
                      : 'border-[var(--line-subtle)] bg-[#0A131E] hover:border-[var(--line-strong)]'
                  }`}
                >
                  <div
                    onClick={() => toggleExpandSignal(sig.key)}
                    className="p-3 flex items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    {/* Left: Indicator, Title, Expand Chevron */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        className="text-[var(--text-muted)] hover:text-white transition-transform"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[var(--cyan-accent)]" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: color,
                          boxShadow: sig.available ? `0 0 6px ${color}88` : 'none',
                        }}
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-white truncate">
                            {sig.label || sig.name || sig.key}
                          </span>
                          {!sig.available && (
                            <span className="text-[9.5px] font-mono-code text-[var(--text-muted)] px-1.5 py-0.2 rounded bg-[var(--bg-surface-inset)]">
                              NOT AVAILABLE
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-[var(--text-muted)] truncate max-w-sm">
                          {sig.reason || 'Evidence evaluated against verified brand baseline'}
                        </p>
                      </div>
                    </div>

                    {/* Right: Metrics & Points */}
                    <div className="flex items-center gap-8 shrink-0 font-mono-code text-[12px]">
                      {/* Weight */}
                      <span className="text-[var(--text-secondary)] text-[11px] w-12 text-right">
                        {(sig.weight * 100).toFixed(0)}%
                      </span>

                      {/* Score Bar */}
                      <div className="w-24 hidden sm:flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="text-[var(--text-muted)]">Val</span>
                          <span className="font-bold text-white">{sig.available ? `${percentScore}%` : 'N/A'}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[#131F2D] overflow-hidden">
                          <div
                            className="h-full transition-all duration-500 rounded-full"
                            style={{
                              width: sig.available ? `${percentScore}%` : '0%',
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>

                      {/* Contribution Points */}
                      <div className="w-16 text-right">
                        <span
                          className="font-bold text-[13px] tabular-nums"
                          style={{ color: sig.available ? color : 'var(--text-muted)' }}
                        >
                          {sig.available ? `+${sig.contribution.toFixed(1)}` : '0.0'}
                        </span>
                        <span className="text-[9.5px] text-[var(--text-muted)] block">pts</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Forensic Evidence Deep-Dive */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[var(--line-subtle)] bg-[#070E17]/60 space-y-3 text-[12px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="p-2.5 rounded-[5px] bg-[#050A10] border border-[var(--line-subtle)] space-y-1">
                          <span className="text-[10px] font-mono-code text-[var(--cyan-accent)] uppercase block">
                            Forensic Evidence Findings
                          </span>
                          <p className="text-[12.5px] text-white leading-relaxed">
                            {sig.reason}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-[5px] bg-[#050A10] border border-[var(--line-subtle)] space-y-1">
                          <span className="text-[10px] font-mono-code text-[var(--text-secondary)] uppercase block">
                            Comparison Against Official
                          </span>
                          <p className="text-[12px] text-[var(--text-secondary)] font-mono-code">
                            {sig.compared
                              ? typeof sig.compared === 'string'
                                ? sig.compared
                                : `Target: "${sig.compared.candidate}" vs Official: "${sig.compared.official}"`
                              : `Verified brand profile parameter for ${finding.candidate.platform_or_store}`}
                          </p>
                        </div>
                      </div>

                      {onInspectSignal && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => onInspectSignal(sig.key)}
                            className="text-[11px] font-mono-code text-[var(--cyan-accent)] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect raw evidence in comparison studio</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Rule Gates */}
      {activeTab === 'gates' && (
        <div className="space-y-3">
          <div className="p-3.5 rounded-[6px] bg-[#0A131E] border border-[var(--line-strong)] text-[12.5px] space-y-2">
            <h4 className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--cyan-accent)]" />
              <span>Safety Rule Gates & Caps</span>
            </h4>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
              BrandGuard applies rule gates to prevent false positive alert fatigue. If an alert has limited corroborating data (e.g. only matching name letters without matching logo or external links), it is capped to avoid false High severity alerts.
            </p>

            <div className="pt-2 space-y-2">
              <div className="p-2.5 rounded-[4px] bg-[#060D15] border border-[var(--line-subtle)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-[12px] font-mono-code">Name-Only Cap Rule</span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Caps maximum risk to 65 unless corroborated by visual or bio signals.
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10.5px] font-mono-code font-bold ${
                    gates_applied?.includes('name_only_cap')
                      ? 'bg-[var(--med-bg)] text-[var(--med)] border border-[var(--med-border)]'
                      : 'bg-[#102316] text-[var(--official)]'
                  }`}
                >
                  {gates_applied?.includes('name_only_cap') ? 'ACTIVATED (CAPPED)' : 'PASSED'}
                </span>
              </div>

              <div className="p-2.5 rounded-[4px] bg-[#060D15] border border-[var(--line-subtle)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-[12px] font-mono-code">Low Coverage Guard</span>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Requires at least 50% signal coverage before promoting to High risk tier.
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10.5px] font-mono-code font-bold ${
                    coverage_available / coverage_total < 0.5
                      ? 'bg-[var(--med-bg)] text-[var(--med)] border border-[var(--med-border)]'
                      : 'bg-[#102316] text-[var(--official)]'
                  }`}
                >
                  {coverage_available / coverage_total >= 0.5 ? 'COVERAGE MET' : 'LOW COVERAGE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Algorithmic Detections vs Analyst Conclusions */}
      {activeTab === 'analyst' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
          <div className="p-3.5 rounded-[6px] bg-[#09131E] border border-[var(--line-strong)] space-y-2">
            <span className="text-[11px] font-mono-code uppercase font-bold text-[var(--cyan-accent)] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Algorithmic Detections (Machine)</span>
            </span>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Unbiased, deterministic scoring based on multi-vector forensic algorithms:
            </p>
            <ul className="space-y-1.5 font-mono-code text-[11px] text-white">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[var(--cyan-accent)]" />
                <span>Visual mark perceptual distance (dHash-64)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[var(--cyan-accent)]" />
                <span>Levenshtein edit distance & homoglyph scanner</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-[var(--cyan-accent)]" />
                <span>Account ID exclusion set-aside</span>
              </li>
            </ul>
          </div>

          <div className="p-3.5 rounded-[6px] bg-[#0F1710] border border-[var(--official-border)]/40 space-y-2">
            <span className="text-[11px] font-mono-code uppercase font-bold text-[var(--official)] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Analyst Conclusions (Human Review)</span>
            </span>
            <p className="text-[12px] text-[var(--text-secondary)]">
              Authoritative human validation recorded in permanent tamper-resistant audit logs:
            </p>
            <div className="p-2.5 rounded bg-[#070E09] border border-[var(--official-border)]/30 space-y-1 font-mono-code text-[11px]">
              <div>
                <span className="text-[var(--text-muted)]">Current Status: </span>
                <span className="text-white font-bold">{REVIEW_STATUSES[review_status].label}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Audit Note: </span>
                <span className="text-white italic">"{review_note || 'No note attached'}"</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Recorded Events: </span>
                <span className="text-[var(--official)]">{finding.review_events?.length || 0} reviews</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
