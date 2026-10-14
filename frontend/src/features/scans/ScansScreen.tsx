import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Radio,
  Play,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Shield,
  FileCheck,
} from 'lucide-react';
import { Brand, ScanRun, OfficialAsset, DatasetBatch, SourceInfo } from '../../types/brandguard';
import { formatDateTime, formatDuration, formatNumber } from '../../lib/format';
import { SCAN_STATUSES, SOURCE_RESULTS } from '../../lib/labels';
import { store } from '../../services/store';

interface ScansScreenProps {
  brand: Brand;
  scans: ScanRun[];
  officialAssets: OfficialAsset[];
  datasets: DatasetBatch[];
  sources: SourceInfo[];
}

export const ScansScreen: React.FC<ScansScreenProps> = ({
  brand,
  scans,
  officialAssets,
  datasets,
  sources,
}) => {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId?: string }>();

  const [selectedSources, setSelectedSources] = useState<string[]>(
    sources.map((s) => s.key)
  );
  const [selectedDataset, setSelectedDataset] = useState<string>(datasets[0]?.id || '');
  const [simulatedFailureSource, setSimulatedFailureSource] = useState<string>('none');
  const [simulatedFailureType, setSimulatedFailureType] = useState<string>('rate_limited');
  const [selectedScanId, setSelectedScanId] = useState<string>(scanId || scans[0]?.id || '');

  useEffect(() => {
    if (scanId && scans.some((s) => s.id === scanId)) {
      setSelectedScanId(scanId);
    } else if (scans.length > 0 && !selectedScanId) {
      setSelectedScanId(scans[0].id);
    }
  }, [scanId, scans]);

  const hasOfficialAssets = officialAssets.length > 0;
  const activeScan = scans.find((s) => s.id === selectedScanId) || scans[0];

  const toggleSource = (key: string) => {
    setSelectedSources((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleStartScan = (overrideSource?: string) => {
    if (!hasOfficialAssets) return;

    const sourcesToRun = overrideSource ? [overrideSource] : selectedSources;
    if (sourcesToRun.length === 0) return;

    const failures: Record<string, string> = {};
    if (!overrideSource && simulatedFailureSource !== 'none') {
      failures[simulatedFailureSource] = simulatedFailureType;
    }

    const newScan = store.runScan(brand.id, sourcesToRun, selectedDataset, failures);
    setSelectedScanId(newScan.id);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-stretch-title text-[22px] font-bold text-white tracking-tight">
              Scan Orchestration & Audit Center
            </h1>
            <span className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[11px] font-mono-code text-[var(--cyan-accent)]">
              SCAN ENGINE v1.0.3
            </span>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            Coordinate multi-source candidate collection, exclusion of registered baselines, and threat scoring.
          </p>
        </div>

        <button
          onClick={() => handleStartScan()}
          disabled={!hasOfficialAssets || selectedSources.length === 0}
          className="h-9 px-4 rounded-[5px] bg-gradient-to-r from-[#06b6d4] to-[#10b981] hover:brightness-110 disabled:opacity-40 text-[#041217] text-[13px] font-bold flex items-center gap-2 transition-all shadow-[0_0_16px_rgba(6,182,212,0.3)] cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Launch new scan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Scan Configuration */}
        <div className="lg:col-span-5 bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-5 space-y-5">
          <div className="border-b border-[var(--line-subtle)] pb-3">
            <h2 className="text-[14px] font-semibold text-white uppercase tracking-wider font-mono-code">
              Scan Configuration
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Select ingestion channels and reference candidate datasets.
            </p>
          </div>

          {!hasOfficialAssets && (
            <div role="alert" className="p-3 rounded-[5px] bg-[var(--high-bg)] border border-[var(--high-border)] text-[12px] text-[var(--high)] space-y-1.5">
              <p className="font-semibold">
                No official assets registered.
              </p>
              <p className="text-[11.5px] text-[var(--text-secondary)]">
                Register at least one official social profile or application before initiating discovery.
              </p>
              <button
                type="button"
                onClick={() => navigate(`/brands/${brand.id}/profile`)}
                className="underline font-bold text-white block pt-1"
              >
                Go to Brand Profile
              </button>
            </div>
          )}

          {/* Sources Checkboxes */}
          <div className="space-y-2">
            <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)]">
              Integrated Discovery Channels
            </label>
            <div className="space-y-1.5">
              {sources.map((src) => {
                const isChecked = selectedSources.includes(src.key);
                return (
                  <label
                    key={src.key}
                    className={`flex items-start gap-2.5 p-2 rounded-[5px] border transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-[var(--bg-surface-elevated)] border-[var(--line-strong)]'
                        : 'bg-[var(--bg-surface-inset)] border-[var(--line-subtle)] opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSource(src.key)}
                      disabled={!hasOfficialAssets}
                      className="mt-0.5 rounded-[2px] border-[var(--line-strong)] text-[var(--cyan-accent)] focus:ring-[var(--cyan-accent)]"
                    />
                    <div className="min-w-0 flex-1 text-[12.5px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{src.display_name}</span>
                        <span className="text-[10.5px] font-mono-code px-1.5 py-0.2 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] text-[var(--cyan-accent)]">
                          {src.mode === 'live' ? 'Live API' : 'Import'}
                        </span>
                      </div>
                      {src.note && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{src.note}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Dataset select */}
          <div className="space-y-1.5">
            <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)]">
              Candidate Dataset Batch
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              disabled={!hasOfficialAssets}
              className="w-full h-8 px-2.5 rounded-[4px] border border-[var(--line-strong)] text-[12px] bg-[var(--bg-surface-inset)] text-white focus:outline-none focus:border-[var(--line-active)] font-mono-code"
            >
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.data_origin.toUpperCase()}, {ds.record_count} records)
                </option>
              ))}
            </select>
          </div>

          {/* Collapsed Failure Simulator */}
          <details className="rounded-[5px] border border-[var(--line-strong)] p-3 bg-[var(--bg-surface-inset)] text-[12px]">
            <summary className="font-mono-code uppercase text-[var(--text-secondary)] hover:text-white cursor-pointer select-none">
              Resilience Failure Simulator
            </summary>
            <div className="mt-3 space-y-3 pt-2 border-t border-[var(--line-subtle)]">
              <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
                Simulate circuit breaks, rate limits, and timeouts to test BrandGuard's partial and isolated fallback mechanisms.
              </p>

              <div>
                <label className="block text-[11px] font-mono-code text-[var(--text-muted)] mb-1">
                  Target Channel
                </label>
                <select
                  value={simulatedFailureSource}
                  onChange={(e) => setSimulatedFailureSource(e.target.value)}
                  className="w-full h-7 px-2 rounded border border-[var(--line-strong)] text-[11.5px] bg-[var(--bg-surface)] text-white font-mono-code"
                >
                  <option value="none">None (nominal scan execution)</option>
                  {sources.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {simulatedFailureSource !== 'none' && (
                <div>
                  <label className="block text-[11px] font-mono-code text-[var(--text-muted)] mb-1">
                    Fault Condition
                  </label>
                  <select
                    value={simulatedFailureType}
                    onChange={(e) => setSimulatedFailureType(e.target.value)}
                    className="w-full h-7 px-2 rounded border border-[var(--line-strong)] text-[11.5px] bg-[var(--bg-surface)] text-white font-mono-code"
                  >
                    <option value="rate_limited">Rate limited (HTTP 429)</option>
                    <option value="timeout">Gateway timeout</option>
                    <option value="access_not_configured">Endpoint unconfigured</option>
                    <option value="failed">Fatal service drop</option>
                  </select>
                </div>
              )}
            </div>
          </details>
        </div>

        {/* Right Column (7 cols): Active Scan Status & History */}
        <div className="lg:col-span-7 space-y-6">
          {activeScan ? (
            <div className="bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-5 space-y-5">
              {/* Scan Title & Badge */}
              <div className="flex items-start justify-between border-b border-[var(--line-subtle)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] font-mono-code font-bold text-white">
                      Scan {activeScan.id}
                    </span>
                    <span className="text-[11px] font-mono-code px-1.5 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[var(--text-muted)]">
                      {activeScan.rules_version}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)] font-mono-code mt-0.5">
                    Executed {formatDateTime(activeScan.started_at)} · Duration:{' '}
                    {activeScan.duration_ms ? formatDuration(activeScan.duration_ms) : 'Processing'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={SCAN_STATUSES[activeScan.status]?.glyphClass || 'glyph-status-completed'} />
                  <span className="text-[13px] font-mono-code font-bold uppercase text-white">
                    {SCAN_STATUSES[activeScan.status]?.label || activeScan.status}
                  </span>
                </div>
              </div>

              {/* Running Stage Sequence */}
              {activeScan.status === 'running' && (
                <div className="p-4 rounded-[6px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] space-y-3">
                  <div className="flex items-center justify-between text-[12.5px] font-semibold text-white">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--cyan-accent)] animate-ping" />
                      <span>Pipeline in execution</span>
                    </span>
                    <span className="font-mono-code tabular-nums text-[var(--cyan-accent)]">
                      {activeScan.progress.done} / {activeScan.progress.total}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[12px] font-mono-code text-[var(--text-secondary)]">
                    {[
                      { key: 'collect', label: '1. Candidate collection across requested sources' },
                      { key: 'exclusions', label: '2. Setting aside verified official assets' },
                      { key: 'scoring', label: '3. Risk scoring and gate evaluations' },
                      { key: 'saving', label: '4. Indexing and persisting findings' },
                    ].map((stg) => {
                      const isCurrent = activeScan.progress.stage === stg.key;
                      return (
                        <div key={stg.key} className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCurrent ? 'bg-[var(--cyan-accent)] shadow-[0_0_6px_var(--cyan-accent)]' : 'bg-[var(--line-strong)]'
                            }`}
                          />
                          <span className={isCurrent ? 'text-white font-bold' : ''}>
                            {stg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Partial Banner */}
              {activeScan.status === 'partial' && (
                <div
                  role="alert"
                  className="rounded-[6px] border border-[var(--med-border)] bg-[var(--med-bg)] p-4 space-y-2.5 text-[12.5px]"
                >
                  <div className="flex items-center justify-between font-bold text-[var(--med)]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Partial Scan: 1 of {activeScan.requested_sources.length} sources unavailable</span>
                    </div>
                    <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-[var(--bg-surface)] text-[var(--med)] border border-[var(--med-border)]">
                      SIMULATED FAULT
                    </span>
                  </div>

                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    Instagram encountered a rate limit (HTTP 429). The system retried twice with exponential backoff before isolating the source.
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)]">
                    Remaining channels executed normally. Existing findings from prior scans remain intact.
                  </p>

                  <button
                    type="button"
                    onClick={() => handleStartScan('social:instagram')}
                    className="h-7 px-3 rounded bg-[var(--med)] text-[#041217] text-[11.5px] font-bold hover:brightness-110 cursor-pointer"
                  >
                    Retry Instagram Ingestion
                  </button>
                </div>
              )}

              {/* Stats Grid */}
              {activeScan.stats && (
                <div className="space-y-2">
                  <div className="text-[12px] font-mono-code uppercase text-[var(--text-muted)]">
                    Telemetry Metrics
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
                    <div className="p-3 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)]">
                      <div className="text-[var(--text-muted)] font-mono-code text-[11px]">Collected</div>
                      <div className="text-[18px] font-bold font-mono-code text-white mt-0.5">
                        {formatNumber(activeScan.stats.candidates_seen)}
                      </div>
                    </div>
                    <div className="p-3 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)]">
                      <div className="text-[var(--text-muted)] font-mono-code text-[11px]">Excluded Official</div>
                      <div className="text-[18px] font-bold font-mono-code text-[var(--official)] mt-0.5">
                        {activeScan.stats.excluded_official}
                      </div>
                    </div>
                    <div className="p-3 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)]">
                      <div className="text-[var(--text-muted)] font-mono-code text-[11px]">Scored & Gated</div>
                      <div className="text-[18px] font-bold font-mono-code text-white mt-0.5">
                        {activeScan.stats.evaluated}
                      </div>
                    </div>
                    <div className="p-3 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)]">
                      <div className="text-[var(--text-muted)] font-mono-code text-[11px]">Findings Logged</div>
                      <Link
                        to={`/brands/${brand.id}/findings`}
                        className="text-[18px] font-bold font-mono-code text-[var(--high)] mt-0.5 block hover:underline"
                      >
                        {activeScan.stats.by_band.high + activeScan.stats.by_band.medium + activeScan.stats.by_band.needs_review}
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Results by Source */}
              <div className="space-y-2 pt-2 border-t border-[var(--line-subtle)]">
                <div className="text-[12px] font-mono-code uppercase text-[var(--text-muted)]">
                  Channel Execution Breakdown
                </div>

                <div className="overflow-x-auto rounded-[5px] border border-[var(--line-subtle)]">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-surface-inset)] border-b border-[var(--line-subtle)] text-[11px] font-mono-code text-[var(--text-muted)]">
                        <th className="py-2 px-3 font-medium">Channel</th>
                        <th className="py-2 px-3 font-medium">Result</th>
                        <th className="py-2 px-3 font-medium text-right">Candidates</th>
                        <th className="py-2 px-3 font-medium text-right">Attempts</th>
                        <th className="py-2 px-3 font-medium text-right">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line-subtle)]">
                      {activeScan.source_results.map((sr) => (
                        <tr key={sr.id} className="hover:bg-[var(--bg-surface-elevated)]">
                          <td className="py-2 px-3 font-semibold text-white">
                            {sr.source_name}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5 font-mono-code text-[11.5px]">
                              <span className={SOURCE_RESULTS[sr.status]?.glyphClass} />
                              <span>{SOURCE_RESULTS[sr.status]?.label}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono-code text-white">
                            {sr.candidates_returned}
                          </td>
                          <td className="py-2 px-3 text-right font-mono-code text-[var(--text-muted)]">
                            {sr.attempts}
                          </td>
                          <td className="py-2 px-3 text-right font-mono-code text-[var(--text-muted)]">
                            {formatDuration(sr.duration_ms)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-8 text-center text-[var(--text-muted)]">
              No scans logged yet. Initiate your first scan from the left panel.
            </div>
          )}

          {/* Scan History Table */}
          <div className="bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-5 space-y-3">
            <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider font-mono-code">
              Scan Audit History
            </h3>

            <div className="overflow-x-auto rounded-[5px] border border-[var(--line-subtle)]">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface-inset)] border-b border-[var(--line-subtle)] text-[11px] font-mono-code text-[var(--text-muted)]">
                    <th className="py-2 px-3 font-medium">Scan ID</th>
                    <th className="py-2 px-3 font-medium">Started</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                    <th className="py-2 px-3 font-medium text-right">Candidates</th>
                    <th className="py-2 px-3 font-medium text-right">Findings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-subtle)]">
                  {scans.map((sc) => (
                    <tr
                      key={sc.id}
                      onClick={() => setSelectedScanId(sc.id)}
                      className={`cursor-pointer transition-colors ${
                        sc.id === activeScan?.id
                          ? 'bg-[var(--bg-surface-elevated)] font-semibold'
                          : 'hover:bg-[var(--bg-surface-elevated)]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono-code text-white">
                        {sc.id}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                        {formatDateTime(sc.started_at)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 font-mono-code text-[11.5px]">
                          <span className={SCAN_STATUSES[sc.status]?.glyphClass} />
                          <span>{SCAN_STATUSES[sc.status]?.label}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-code text-white">
                        {sc.stats.candidates_seen}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-code text-[var(--high)]">
                        {sc.stats.by_band.high + sc.stats.by_band.medium + sc.stats.by_band.needs_review}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
