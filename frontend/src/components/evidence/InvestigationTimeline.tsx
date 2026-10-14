import React, { useState, useMemo } from 'react';
import {
  Clock,
  Radio,
  Sliders,
  ShieldAlert,
  User,
  CheckCircle2,
  XCircle,
  EyeOff,
  Flame,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  FileText,
  Calendar,
} from 'lucide-react';
import { Finding, ReviewEvent, RiskBand } from '../../types/brandguard';
import { formatDateTime, formatRelativeTime } from '../../lib/format';
import { BANDS, REVIEW_STATUSES } from '../../lib/labels';

interface InvestigationTimelineProps {
  finding: Finding;
  onNavigateToScan?: (scanId: string) => void;
  className?: string;
}

type TimelineFilter = 'all' | 'discovery' | 'scoring' | 'analyst';

export const InvestigationTimeline: React.FC<InvestigationTimelineProps> = ({
  finding,
  onNavigateToScan,
  className = '',
}) => {
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [expandedEventIds, setExpandedEventIds] = useState<Set<string>>(new Set(['evt-discovered', 'evt-scoring']));

  const toggleExpand = (id: string) => {
    setExpandedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Compile genuine recorded lifecycle events
  const timelineEvents = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'discovery' | 'scoring' | 'analyst';
      title: string;
      subtitle: string;
      timestamp: string;
      icon: React.ReactNode;
      iconBg: string;
      details?: React.ReactNode;
    }> = [];

    const discoveredTime = finding.first_seen_at || finding.created_at;

    // 1. Discovery Event
    list.push({
      id: 'evt-discovered',
      category: 'discovery',
      title: 'Candidate Discovered in Wild',
      subtitle: `Discovered on ${finding.candidate.platform_or_store} as "${finding.candidate.name}" (@${finding.candidate.handle_or_package})`,
      timestamp: discoveredTime,
      icon: <Radio className="w-4 h-4 text-[var(--cyan-accent)]" />,
      iconBg: 'bg-[var(--cyan-glow)] border-[var(--cyan-accent)]/50',
      details: (
        <div className="space-y-1.5 text-[11.5px] font-mono-code text-[var(--text-secondary)]">
          <div className="flex items-center justify-between">
            <span>Data Ingestion Channel:</span>
            <span className="text-white font-bold">{finding.candidate.platform_or_store}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Associated Scan Run:</span>
            {finding.scan_id ? (
              <button
                type="button"
                onClick={() => onNavigateToScan?.(finding.scan_id)}
                className="text-[var(--cyan-accent)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>#{finding.scan_id}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[var(--text-muted)]">Batch Import</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span>Matched Baseline Asset:</span>
            <span className="text-white font-bold">ID: {finding.matched_asset_id}</span>
          </div>
        </div>
      ),
    });

    // 2. Similarity & Signals Evaluated
    list.push({
      id: 'evt-evaluated',
      category: 'scoring',
      title: 'Multi-Vector Similarity Signals Evaluated',
      subtitle: `${finding.coverage_available} of ${finding.coverage_total} detection vectors computed (dHash-64, Levenshtein, Account ID)`,
      timestamp: discoveredTime,
      icon: <Sliders className="w-4 h-4 text-[var(--med)]" />,
      iconBg: 'bg-[var(--med-bg)] border-[var(--med-border)]',
      details: (
        <div className="space-y-2 text-[11.5px] font-mono-code">
          <div className="grid grid-cols-2 gap-2">
            {finding.signals.slice(0, 4).map((s) => (
              <div key={s.key} className="p-1.5 rounded bg-[#050A10] border border-[var(--line-subtle)]">
                <span className="text-[var(--text-muted)] block text-[10px]">{s.label || s.key}</span>
                <span className="text-white font-bold">
                  {s.available ? `${Math.round(((s.score || 0) as number) * 100)}% match` : 'Not Available'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    });

    // 3. Risk Score Calculated & Gates Applied
    const bandStyle = BANDS[finding.band];
    list.push({
      id: 'evt-scoring',
      category: 'scoring',
      title: `Risk Threshold Assigned: ${finding.score}/100 (${bandStyle.label})`,
      subtitle: `${finding.gates_applied && finding.gates_applied.length > 0 ? `Safety gates applied: ${finding.gates_applied.join(', ')}` : 'Standard thresholding matrix applied'}`,
      timestamp: discoveredTime,
      icon: <ShieldAlert className="w-4 h-4" style={{ color: bandStyle.colorVar }} />,
      iconBg: `bg-[#0D1520] border-[${bandStyle.colorVar}]/40`,
      details: (
        <div className="space-y-1.5 text-[11.5px] font-mono-code text-[var(--text-secondary)]">
          <div className="flex items-center justify-between">
            <span>Engine Version:</span>
            <span className="text-white">{finding.engine_version || '1.0.3'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Ruleset Hash:</span>
            <span className="text-white">{finding.rules_version || '1.0.3-a41c9e07'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Threshold Range:</span>
            <span className="text-white font-bold" style={{ color: bandStyle.colorVar }}>
              {bandStyle.label} Severity
            </span>
          </div>
        </div>
      ),
    });

    // 4. Recorded Human Review Events (Audit Trail)
    if (finding.review_events && finding.review_events.length > 0) {
      finding.review_events.forEach((re, idx) => {
        const isConfirmed = re.to_status === 'confirmed';
        const isFP = re.to_status === 'false_positive';
        const isUnderReview = re.to_status === 'under_review';
        const isIgnored = re.note?.toLowerCase().includes('ignored');
        const isEscalated = re.note?.toLowerCase().includes('escalated');

        let icon = <User className="w-4 h-4 text-[var(--cyan-accent)]" />;
        let iconBg = 'bg-[var(--cyan-glow)] border-[var(--cyan-accent)]/50';

        if (isConfirmed) {
          icon = <ShieldAlert className="w-4 h-4 text-[var(--high)]" />;
          iconBg = 'bg-[var(--high-bg)] border-[var(--high-border)]';
        } else if (isFP) {
          icon = <CheckCircle2 className="w-4 h-4 text-[var(--official)]" />;
          iconBg = 'bg-[var(--official-bg)] border-[var(--official-border)]';
        } else if (isEscalated) {
          icon = <Flame className="w-4 h-4 text-[#ef4444]" />;
          iconBg = 'bg-[var(--high-bg)] border-red-500';
        } else if (isIgnored) {
          icon = <EyeOff className="w-4 h-4 text-slate-400" />;
          iconBg = 'bg-[#142334] border-[var(--line-strong)]';
        }

        list.push({
          id: re.id || `re-${idx}`,
          category: 'analyst',
          title: `Analyst Action: ${re.from_status} → ${re.to_status.toUpperCase()}`,
          subtitle: `Reviewed by "${re.reviewer || 'analyst'}" with audit trail record`,
          timestamp: re.created_at,
          icon,
          iconBg,
          details: (
            <div className="p-2.5 rounded bg-[#060C14] border border-[var(--line-subtle)] space-y-1 text-[11.5px] font-mono-code">
              <div className="flex items-center justify-between text-[var(--text-muted)]">
                <span>Auditor: {re.reviewer || 'analyst'}</span>
                <span>ID: {re.id}</span>
              </div>
              <p className="text-white italic">"{re.note || 'No note supplied'}"</p>
            </div>
          ),
        });
      });
    }

    return list;
  }, [finding, onNavigateToScan]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return timelineEvents;
    return timelineEvents.filter((evt) => evt.category === filter);
  }, [timelineEvents, filter]);

  return (
    <div className={`space-y-4 rounded-[10px] border border-[var(--line-strong)] bg-[#070D14] p-5 ${className}`}>
      {/* Header and Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--cyan-accent)]" />
          <h3 className="text-[13px] font-mono-code font-bold uppercase text-white tracking-wider">
            Threat Investigation Timeline
          </h3>
          <span className="px-2 py-0.5 rounded bg-[var(--cyan-glow)] text-[10.5px] font-mono-code text-[var(--cyan-accent)]">
            {timelineEvents.length} Recorded Events
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1 p-0.5 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] text-[11px] font-mono-code">
          {(['all', 'discovery', 'scoring', 'analyst'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-2.5 py-0.5 rounded-[3px] font-bold capitalize transition-colors cursor-pointer ${
                filter === cat
                  ? 'bg-[var(--cyan-accent)] text-[#041217]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Vertical Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-[var(--cyan-accent)] before:via-[var(--line-strong)] before:to-[#1e293b]">
        {filteredEvents.map((evt) => {
          const isExpanded = expandedEventIds.has(evt.id);

          return (
            <div key={evt.id} className="relative group">
              {/* Event Node Icon on Spine */}
              <div
                className={`absolute -left-[27px] top-0.5 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110 ${evt.iconBg}`}
              >
                {evt.icon}
              </div>

              {/* Event Card */}
              <div className="rounded-[8px] border border-[var(--line-subtle)] bg-[#0A131F] p-3.5 hover:border-[var(--line-strong)] transition-all space-y-2">
                <div
                  onClick={() => toggleExpand(evt.id)}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-bold text-white font-mono-code">{evt.title}</h4>
                      <button
                        type="button"
                        className="text-[var(--text-muted)] hover:text-white"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11.5px] text-[var(--text-secondary)] mt-0.5">{evt.subtitle}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10.5px] font-mono-code text-[var(--cyan-accent)] block">
                      {formatRelativeTime(evt.timestamp)}
                    </span>
                    <span className="text-[9.5px] font-mono-code text-[var(--text-muted)]" title={formatDateTime(evt.timestamp)}>
                      {formatDateTime(evt.timestamp).split(',')[1] || evt.timestamp}
                    </span>
                  </div>
                </div>

                {/* Expandable Details Container */}
                {isExpanded && evt.details && (
                  <div className="pt-2 border-t border-[var(--line-subtle)] animate-fadeIn">
                    {evt.details}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
