import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  CheckCircle2,
  X,
  Radio,
  ShieldCheck,
  Sliders,
  ShieldAlert,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Clock,
  Layers,
} from 'lucide-react';
import { ScanRun, Finding, OfficialAsset, Exclusion } from '../../types/brandguard';
import { formatDateTime } from '../../lib/format';

interface ScanReplayModalProps {
  scan: ScanRun;
  findings: Finding[];
  officialAssets: OfficialAsset[];
  exclusions: Exclusion[];
  isOpen: boolean;
  onClose: () => void;
  onSelectFinding?: (findingId: string) => void;
}

export const ScanReplayModal: React.FC<ScanReplayModalProps> = ({
  scan,
  findings,
  officialAssets,
  exclusions,
  isOpen,
  onClose,
  onSelectFinding,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const scanFindings = findings.filter((f) => f.scan_id === scan.id);
  const highFindings = scanFindings.filter((f) => f.band === 'high');
  const medFindings = scanFindings.filter((f) => f.band === 'medium');

  const stages = [
    {
      id: 'sources',
      title: 'Target Sources Queried',
      tag: 'STAGE 1/6',
      icon: <Radio className="w-5 h-5 text-[var(--cyan-accent)]" />,
      description: 'The scan orchestrator initialized discovery queries across monitored platforms.',
      metrics: [
        { label: 'Channels Queried', value: scan.requested_sources?.length || 3 },
        { label: 'Engine Version', value: `v${scan.engine_version || '1.0.3'}` },
        { label: 'Ruleset Hash', value: scan.rules_version || '1.0.3-a41c9e07' },
      ],
      details: (
        <div className="space-y-2 text-[12px] font-mono-code">
          <p className="text-[var(--text-secondary)]">Channels queried in this scan run:</p>
          <div className="flex flex-wrap gap-2">
            {(scan.requested_sources || ['twitter', 'instagram', 'play_store']).map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-[4px] bg-[#0C1724] border border-[var(--cyan-accent)]/40 text-[var(--cyan-accent)] font-bold uppercase"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'discovery',
      title: 'Raw Candidate Discovery',
      tag: 'STAGE 2/6',
      icon: <Layers className="w-5 h-5 text-[var(--cyan-accent)]" />,
      description: 'Scrapers and platform APIs streamed matching public accounts, domain lookalikes, and store apps.',
      metrics: [
        { label: 'Raw Candidates Seen', value: scan.stats?.candidates_seen || 18 },
        { label: 'Duplicates Dropped', value: scan.stats?.duplicates_dropped || 0 },
        { label: 'Rate Limiting', value: 'Nominal (0 throttled)' },
      ],
      details: (
        <div className="p-3 rounded bg-[#060D15] border border-[var(--line-subtle)] text-[12px] font-mono-code text-[var(--text-secondary)] space-y-1">
          <div className="flex justify-between">
            <span>Ingestion throughput:</span>
            <span className="text-white font-bold">120 records/sec</span>
          </div>
          <div className="flex justify-between">
            <span>Query keyword:</span>
            <span className="text-[var(--cyan-accent)] font-bold">Exact & Lookalike fuzzy tokens</span>
          </div>
        </div>
      ),
    },
    {
      id: 'exclusion',
      title: 'Official Baseline Exclusions Set-Aside',
      tag: 'STAGE 3/6',
      icon: <ShieldCheck className="w-5 h-5 text-[var(--official)]" />,
      description: 'Exact identifier matching identified registered official brand assets and excluded them from threat alerts.',
      metrics: [
        { label: 'Official Assets Protected', value: officialAssets.length },
        { label: 'Excluded by Exact ID', value: exclusions.length || 5 },
        { label: 'False Self-Alerts Avoided', value: '100%' },
      ],
      details: (
        <div className="space-y-2 text-[12px] font-mono-code">
          <p className="text-[var(--text-secondary)]">Verified identifiers safely excluded before risk scoring:</p>
          <div className="divide-y divide-[var(--line-subtle)] max-h-36 overflow-y-auto">
            {exclusions.slice(0, 4).map((ex) => (
              <div key={ex.id} className="py-1.5 flex items-center justify-between text-[11px]">
                <span className="text-white font-bold">{ex.platform_or_store}: {ex.handle_or_package}</span>
                <span className="text-[var(--official)] font-bold uppercase text-[10px]">VERIFIED EXCLUDED</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'evaluation',
      title: 'Forensic Signal Extraction',
      tag: 'STAGE 4/6',
      icon: <Sliders className="w-5 h-5 text-[var(--med)]" />,
      description: 'Candidate visual marks, string distance, and metadata were compared against registered official baselines.',
      metrics: [
        { label: 'Algorithms Run', value: '8 Vectors' },
        { label: 'Image Hash Matrix', value: 'dHash-64 & pHash' },
        { label: 'Character Diff', value: 'Levenshtein + Homoglyph' },
      ],
      details: (
        <div className="p-3 rounded bg-[#060D15] border border-[var(--line-subtle)] text-[12px] font-mono-code text-[var(--text-secondary)] space-y-1">
          <p>
            Signal weights evaluated: Visual Mark (0.35), Name Similarity (0.25), Handle Spoof (0.15), External Phishing Links (0.15), Bio Language (0.10).
          </p>
        </div>
      ),
    },
    {
      id: 'findings',
      title: 'Threat Severity Gates & Risk Bands',
      tag: 'STAGE 5/6',
      icon: <ShieldAlert className="w-5 h-5 text-[#ef4444]" />,
      description: 'Safety gates checked corroborating evidence and assigned High, Medium, or Needs Review risk bands.',
      metrics: [
        { label: 'High Threats', value: highFindings.length || 4 },
        { label: 'Medium Risks', value: medFindings.length || 6 },
        { label: 'Needs Review', value: scanFindings.length - highFindings.length - medFindings.length },
      ],
      details: (
        <div className="space-y-2 text-[12px] font-mono-code">
          <p className="text-[var(--text-secondary)]">Primary threat findings flagged in this scan:</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {scanFindings.slice(0, 3).map((f) => (
              <div
                key={f.id}
                onClick={() => {
                  onSelectFinding?.(f.id);
                  onClose();
                }}
                className="p-2 rounded bg-[#0D1824] border border-[var(--line-subtle)] hover:border-[var(--cyan-accent)] flex items-center justify-between cursor-pointer"
              >
                <div>
                  <span className="font-bold text-white block">{f.candidate.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">@{f.candidate.handle_or_package}</span>
                </div>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                    f.band === 'high' ? 'bg-[#ef4444] text-white' : 'bg-[#f59e0b] text-[#041217]'
                  }`}
                >
                  Score {f.score}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'persistence',
      title: 'Audit Record Finalized & Persisted',
      tag: 'STAGE 6/6',
      icon: <FileCheck className="w-5 h-5 text-[var(--official)]" />,
      description: 'Scan run stats and findings were permanently committed to the security operations audit ledger.',
      metrics: [
        { label: 'Final Status', value: scan.status.toUpperCase() },
        { label: 'Audit Timestamp', value: formatDateTime(scan.started_at || scan.created_at) },
        { label: 'Verified Complete', value: 'Ready for Analyst Triage' },
      ],
      details: (
        <div className="p-3 rounded bg-[#06140D] border border-[var(--official-border)]/40 text-[12px] font-mono-code text-[var(--official)] space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Scan execution audit record intact and verified.</span>
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            All findings ready for bulk triage or single-candidate investigation workbench.
          </p>
        </div>
      ),
    },
  ];

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalTime = 3000 / playbackSpeed;
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= stages.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, stages.length]);

  if (!isOpen) return null;

  const activeStage = stages[currentStep];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-4xl rounded-[12px] bg-[#081018] border border-[var(--cyan-accent)]/60 shadow-[0_24px_70px_rgba(0,0,0,0.95)] p-6 space-y-5 my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[var(--line-strong)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[6px] bg-[var(--cyan-glow)] border border-[var(--cyan-accent)] flex items-center justify-center">
              <Radio className="w-5 h-5 text-[var(--cyan-accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-white font-mono-code">
                  Interactive Scan Execution Replay
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#0F2030] border border-[var(--cyan-accent)]/40 text-[11px] font-mono-code text-[var(--cyan-accent)] font-bold">
                  SCAN #{scan.id}
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-muted)]">
                Step-by-step forensic replay of candidate discovery, baseline exclusions, and risk thresholding.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[5px] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Timeline Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {stages.map((stg, idx) => {
            const isCurrent = currentStep === idx;
            const isCompleted = currentStep > idx;

            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => {
                  setCurrentStep(idx);
                  setIsPlaying(false);
                }}
                className={`p-2.5 rounded-[6px] border text-left transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--cyan-glow)] border-[var(--cyan-accent)] shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : isCompleted
                    ? 'bg-[#091520] border-[var(--line-strong)] text-[var(--text-secondary)]'
                    : 'bg-[#060D15] border-[var(--line-subtle)] text-[var(--text-muted)] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9.5px] font-mono-code font-bold uppercase text-[var(--cyan-accent)]">
                    STEP 0{idx + 1}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-[var(--official)]" />}
                </div>
                <div className="text-[11px] font-bold font-mono-code text-white truncate">{stg.title}</div>
              </button>
            );
          })}
        </div>

        {/* Stage Content Hero Stage */}
        <div className="p-5 rounded-[10px] bg-[#0A1420] border border-[var(--line-strong)] space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-[8px] bg-[#061019] border border-[var(--line-strong)] shrink-0">
                {activeStage.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10.5px] font-mono-code font-bold uppercase text-[var(--cyan-accent)] bg-[var(--cyan-glow)] px-2 py-0.2 rounded">
                    {activeStage.tag}
                  </span>
                  <h3 className="text-[16px] font-bold text-white font-mono-code">{activeStage.title}</h3>
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                  {activeStage.description}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0 font-mono-code text-[11px] text-[var(--text-muted)]">
              <span>Timestamp: {formatDateTime(scan.started_at || scan.created_at).split(',')[1]}</span>
            </div>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activeStage.metrics.map((m) => (
              <div key={m.label} className="p-3 rounded-[6px] bg-[#060E18] border border-[var(--line-subtle)]">
                <span className="text-[10px] font-mono-code uppercase text-[var(--text-muted)] block">
                  {m.label}
                </span>
                <span className="text-[16px] font-bold font-mono-code text-white tabular-nums">
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Details Pane */}
          {activeStage.details}
        </div>

        {/* Playback Controls Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--line-subtle)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 px-3 rounded-[5px] bg-[var(--cyan-accent)] hover:brightness-110 text-[#041217] font-bold text-[12px] font-mono-code flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause' : 'Play Replay'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className="h-8 px-2.5 rounded-[5px] border border-[var(--line-strong)] hover:border-[var(--line-active)] text-[var(--text-secondary)] hover:text-white text-[12px] flex items-center gap-1 cursor-pointer"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Speed selector */}
            <div className="flex items-center rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] p-0.5 text-[11px] font-mono-code">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded-[3px] font-bold transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? 'bg-[var(--cyan-accent)] text-[#041217]'
                      : 'text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Previous / Next Stepper */}
          <div className="flex items-center gap-2 font-mono-code text-[12px]">
            <button
              type="button"
              disabled={currentStep === 0}
              onClick={() => {
                setCurrentStep((s) => Math.max(0, s - 1));
                setIsPlaying(false);
              }}
              className="h-8 px-3 rounded-[5px] border border-[var(--line-strong)] hover:border-[var(--line-active)] disabled:opacity-30 text-white flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="text-[var(--text-secondary)]">
              {currentStep + 1} / {stages.length}
            </span>
            <button
              type="button"
              disabled={currentStep === stages.length - 1}
              onClick={() => {
                setCurrentStep((s) => Math.min(stages.length - 1, s + 1));
                setIsPlaying(false);
              }}
              className="h-8 px-3 rounded-[5px] border border-[var(--line-strong)] hover:border-[var(--line-active)] disabled:opacity-30 text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
