import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sliders,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  Check,
  Copy,
  ChevronRight,
  Split,
  Sun,
  Moon,
  Grid,
} from 'lucide-react';
import { AssetKind, CandidateEntity, SignalBreakdown } from '../../types/brandguard';
import { CharDiff } from './CharDiff';

interface AssetComparisonStudioProps {
  kind: AssetKind;
  official: CandidateEntity;
  candidate: CandidateEntity;
  signals?: SignalBreakdown[];
  className?: string;
  defaultExpanded?: boolean;
}

type ViewMode = 'wipe' | 'sideBySide' | 'difference' | 'flicker';
type CanvasBackground = 'dark' | 'black' | 'white' | 'checker';

export const AssetComparisonStudio: React.FC<AssetComparisonStudioProps> = ({
  kind,
  official,
  candidate,
  signals = [],
  className = '',
  defaultExpanded = false,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('wipe');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [canvasBg, setCanvasBg] = useState<CanvasBackground>('dark');
  const [isFlickerOfficial, setIsFlickerOfficial] = useState<boolean>(false);
  const [isExpandedModal, setIsExpandedModal] = useState<boolean>(defaultExpanded);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const hasLogos = Boolean(official.logo_url && candidate.logo_url);

  // Flicker interval (2Hz) when in flicker mode
  useEffect(() => {
    if (viewMode !== 'flicker') return;
    const interval = setInterval(() => {
      setIsFlickerOfficial((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, [viewMode]);

  // Pointer drag handler for wipe divider
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      setSliderPos(pos);
    },
    [isDragging]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isSocial = kind === 'social';

  // Extract signals related to visual and text marks
  const logoSignal = signals.find((s) => s.key === 'logo');
  const nameSignal = signals.find((s) => s.key === 'name');
  const handleSignal = signals.find((s) => s.key === 'handle' || s.key === 'package_name');

  const bgStyles: Record<CanvasBackground, string> = {
    dark: 'bg-[#060D14]',
    black: 'bg-[#000000]',
    white: 'bg-[#FFFFFF] text-black',
    checker: 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] bg-[#070e17]',
  };

  const comparisonRows = isSocial
    ? [
        {
          id: 'name',
          label: 'Display Name',
          officialVal: official.name,
          candidateVal: candidate.name,
          useDiff: true,
          isMono: false,
          signalReason: nameSignal?.reason || 'Character transposition & substitution check',
        },
        {
          id: 'handle',
          label: 'Social Handle',
          officialVal: official.handle_or_package,
          candidateVal: candidate.handle_or_package,
          useDiff: true,
          isMono: true,
          signalReason: handleSignal?.reason || 'Lookalike handle pattern match',
        },
        {
          id: 'id',
          label: 'Account / Platform ID',
          officialVal: official.external_id || 'Registered brand account',
          candidateVal: candidate.external_id || 'Discovered entity',
          useDiff: false,
          isMono: true,
          signalReason: 'Exact identity registration check',
        },
        {
          id: 'desc',
          label: 'Bio / Profile Text',
          officialVal: official.bio_or_desc || 'Official verified bio',
          candidateVal: candidate.bio_or_desc || 'No candidate bio recorded',
          useDiff: false,
          isMono: false,
          signalReason: 'Keywords, support fraud language & phone token analysis',
        },
      ]
    : [
        {
          id: 'name',
          label: 'Application Title',
          officialVal: official.name,
          candidateVal: candidate.name,
          useDiff: true,
          isMono: false,
          signalReason: nameSignal?.reason || 'App store look-alike title check',
        },
        {
          id: 'pkg',
          label: 'Package Identifier',
          officialVal: official.handle_or_package,
          candidateVal: candidate.handle_or_package,
          useDiff: true,
          isMono: true,
          signalReason: handleSignal?.reason || 'Namespace squatting & package spoofing check',
        },
        {
          id: 'pub',
          label: 'Developer / Publisher',
          officialVal: official.publisher || 'Verified Brand Entity',
          candidateVal: candidate.publisher || 'Independent publisher',
          useDiff: true,
          isMono: false,
          signalReason: 'Developer signature validation',
        },
        {
          id: 'desc',
          label: 'Store Description',
          officialVal: official.bio_or_desc || 'Official store listing copy',
          candidateVal: candidate.bio_or_desc || 'No description provided',
          useDiff: false,
          isMono: false,
          signalReason: 'Impersonation claim analysis',
        },
      ];

  const StudioContent = (
    <div className="space-y-4">
      {/* Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-[8px] bg-[#070D14] border border-[var(--line-strong)]">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-0.5 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] text-[11px] font-mono-code">
          <button
            type="button"
            onClick={() => setViewMode('wipe')}
            className={`px-2.5 py-1 rounded-[4px] font-bold transition-all cursor-pointer ${
              viewMode === 'wipe'
                ? 'bg-[var(--cyan-accent)] text-[#041217]'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Split className="w-3 h-3" />
              <span>Wipe Divider</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sideBySide')}
            className={`px-2.5 py-1 rounded-[4px] font-bold transition-all cursor-pointer ${
              viewMode === 'sideBySide'
                ? 'bg-[var(--cyan-accent)] text-[#041217]'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              <span>Side-by-Side</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('difference')}
            className={`px-2.5 py-1 rounded-[4px] font-bold transition-all cursor-pointer ${
              viewMode === 'difference'
                ? 'bg-[#ef4444] text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
            title="Difference mode reveals color shifts and pixel tampering"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Difference</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('flicker')}
            className={`px-2.5 py-1 rounded-[4px] font-bold transition-all cursor-pointer ${
              viewMode === 'flicker'
                ? 'bg-[var(--med)] text-[#041217] font-bold'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
            title="Flicker mode alternates official and candidate at 2Hz"
          >
            <span className="flex items-center gap-1.5">
              <Eye className="w-3 h-3" />
              <span>Flicker (2Hz)</span>
            </span>
          </button>
        </div>

        {/* Canvas Controls: Zoom, Pan, Background, Expand */}
        <div className="flex items-center gap-2">
          {/* Background Canvas Selector */}
          <div className="flex items-center rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] p-0.5">
            <button
              type="button"
              onClick={() => setCanvasBg('dark')}
              className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
                canvasBg === 'dark' ? 'bg-[var(--line-strong)] text-white' : 'text-[var(--text-muted)] hover:text-white'
              }`}
              title="Dark Slate Canvas"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCanvasBg('black')}
              className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
                canvasBg === 'black' ? 'bg-[var(--line-strong)] text-white' : 'text-[var(--text-muted)] hover:text-white'
              }`}
              title="Pure Black Canvas"
            >
              <span className="w-3.5 h-3.5 block rounded-[2px] bg-black border border-white/20" />
            </button>
            <button
              type="button"
              onClick={() => setCanvasBg('checker')}
              className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
                canvasBg === 'checker' ? 'bg-[var(--line-strong)] text-white' : 'text-[var(--text-muted)] hover:text-white'
              }`}
              title="Transparency Checkerboard"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCanvasBg('white')}
              className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
                canvasBg === 'white' ? 'bg-[var(--line-strong)] text-black' : 'text-[var(--text-muted)] hover:text-white'
              }`}
              title="High-Key White Canvas"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] px-1 py-0.5 text-[11px] font-mono-code text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
              disabled={zoomLevel <= 0.75}
              className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 tabular-nums text-white font-bold">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
              disabled={zoomLevel >= 3}
              className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:text-[var(--cyan-accent)] cursor-pointer ml-0.5 border-l border-[var(--line-subtle)]"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Expand / Minimize Fullscreen Studio */}
          <button
            type="button"
            onClick={() => setIsExpandedModal(!isExpandedModal)}
            className="p-1.5 rounded-[5px] border border-[var(--line-strong)] hover:border-[var(--line-active)] text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
            title={isExpandedModal ? 'Minimize Studio' : 'Expand Full Studio'}
          >
            {isExpandedModal ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Visual Canvas Stage */}
      {hasLogos ? (
        <div className="space-y-2">
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`relative w-full ${
              isExpandedModal ? 'h-[360px]' : 'h-[240px]'
            } rounded-[8px] overflow-hidden border border-[var(--line-strong)] ${bgStyles[canvasBg]} select-none transition-colors`}
          >
            {/* View Mode: WIPE SLIDER */}
            {viewMode === 'wipe' && (
              <>
                {/* Layer 1: Candidate Image (Left/Full Base) */}
                <div
                  className="absolute inset-0 flex items-center justify-center p-6"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                >
                  <img
                    src={candidate.logo_url}
                    alt="Questioned Candidate Mark"
                    className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md"
                  />
                </div>

                {/* Layer 2: Official Registered Mark (Clipped by slider position) */}
                <div
                  className="absolute inset-0 flex items-center justify-center p-6 overflow-hidden border-r border-[var(--cyan-accent)] shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                  style={{
                    width: `${sliderPos}%`,
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'left center',
                  }}
                >
                  <img
                    src={official.logo_url}
                    alt="Official Baseline Mark"
                    className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md"
                    style={{
                      minWidth: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                      transform: `translateX(${50 - sliderPos / 2}%)`,
                    }}
                  />
                </div>

                {/* Draggable Divider Handle */}
                <div
                  onPointerDown={handlePointerDown}
                  style={{ left: `${sliderPos}%` }}
                  className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize z-20 touch-none group"
                >
                  <div className="w-[2px] h-full bg-[var(--cyan-accent)] shadow-[0_0_8px_rgba(6,182,212,0.9)]" />
                  <div className="absolute w-7 h-7 rounded-full bg-[#06121D] border-2 border-[var(--cyan-accent)] shadow-[0_0_14px_rgba(6,182,212,0.8)] flex items-center justify-center text-[var(--cyan-accent)] group-hover:scale-110 transition-transform">
                    <Split className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Floating HUD Labels */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#07131D]/90 backdrop-blur-md border border-[var(--official-border)] text-[10.5px] font-mono-code font-bold text-[var(--official)]">
                  <ShieldCheck className="w-3 h-3" />
                  <span>OFFICIAL REGISTERED BASELINE ({Math.round(sliderPos)}%)</span>
                </div>
                <div className="absolute top-3 right-3 z-10 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#180A0A]/90 backdrop-blur-md border border-[var(--high-border)] text-[10.5px] font-mono-code font-bold text-[var(--high)]">
                  <AlertTriangle className="w-3 h-3" />
                  <span>QUESTIONED CANDIDATE ({Math.round(100 - sliderPos)}%)</span>
                </div>
              </>
            )}

            {/* View Mode: SIDE-BY-SIDE */}
            {viewMode === 'sideBySide' && (
              <div className="grid grid-cols-2 h-full divide-x divide-[var(--line-strong)]">
                {/* Official Panel */}
                <div
                  className="relative h-full p-6 flex flex-col items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                >
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-[var(--official-bg)] border border-[var(--official-border)] text-[10.5px] font-mono-code font-bold text-[var(--official)] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>OFFICIAL BASELINE</span>
                  </div>
                  <img
                    src={official.logo_url}
                    alt="Official Mark"
                    className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md"
                  />
                  <span className="absolute bottom-2 text-[10px] font-mono-code text-[var(--text-muted)]">
                    Vector Reference Master
                  </span>
                </div>

                {/* Candidate Panel */}
                <div
                  className="relative h-full p-6 flex flex-col items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                >
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-[var(--high-bg)] border border-[var(--high-border)] text-[10.5px] font-mono-code font-bold text-[var(--high)] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>QUESTIONED ASSET</span>
                  </div>
                  <img
                    src={candidate.logo_url}
                    alt="Candidate Mark"
                    className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md"
                  />
                  <span className="absolute bottom-2 text-[10px] font-mono-code text-[var(--text-muted)]">
                    Scraped Candidate Mark
                  </span>
                </div>
              </div>
            )}

            {/* View Mode: DIFFERENCE (Inverted subtractive overlay) */}
            {viewMode === 'difference' && (
              <div
                className="relative w-full h-full flex items-center justify-center p-6"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              >
                <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-[var(--high-bg)] border border-[var(--high-border)] text-[10.5px] font-mono-code font-bold text-[var(--high)] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>DIFFERENCE MATRIX · BLACK = IDENTICAL, VIVID = ALTERED</span>
                </div>
                {/* Official Base */}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <img src={official.logo_url} alt="Official" className="max-h-full max-w-full object-contain" />
                </div>
                {/* Candidate Difference Blend */}
                <div className="absolute inset-0 flex items-center justify-center p-6 mix-blend-difference filter contrast-200">
                  <img src={candidate.logo_url} alt="Candidate" className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            )}

            {/* View Mode: FLICKER (Rapid comparison) */}
            {viewMode === 'flicker' && (
              <div
                className="relative w-full h-full flex items-center justify-center p-6"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              >
                <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-[var(--med-bg)] border border-[var(--med-border)] text-[10.5px] font-mono-code font-bold text-[var(--med)] flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>
                    FLICKER VIEW (2Hz):{' '}
                    <strong className="text-white">
                      {isFlickerOfficial ? 'OFFICIAL BASELINE' : 'CANDIDATE LOGO'}
                    </strong>
                  </span>
                </div>
                <img
                  src={isFlickerOfficial ? official.logo_url : candidate.logo_url}
                  alt={isFlickerOfficial ? 'Official' : 'Candidate'}
                  className="max-h-full max-w-full object-contain transition-opacity duration-75"
                />
              </div>
            )}
          </div>

          {/* Visual Signal Readout Bar */}
          <div className="px-3.5 py-2 rounded-[6px] bg-[#070D14] border border-[var(--line-strong)] flex flex-wrap items-center justify-between gap-2 text-[11.5px] font-mono-code">
            <div className="flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-[var(--high)]" />
              <span className="text-[var(--text-secondary)]">Visual Mark Spoofing Signal:</span>
              <span className="font-bold text-white">
                {logoSignal?.reason || 'Near-identical perceptual hash distance (score: 95/100)'}
              </span>
            </div>
            <div className="text-[var(--text-muted)] flex items-center gap-2 text-[11px]">
              <span>Hash Engine: dHash-64</span>
              <span>·</span>
              <span>Tolerance: Δ ≤ 4 bits</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-[var(--line-strong)] p-6 text-center bg-[#070D14] text-[var(--text-muted)]">
          <Info className="w-6 h-6 mx-auto mb-2 text-[var(--cyan-accent)]" />
          <p className="text-[13px] text-white font-medium">No logo mark image available for comparison.</p>
          <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
            This candidate was detected via textual and metadata identifiers; visual hash was excluded.
          </p>
        </div>
      )}

      {/* Forensic Identifier & Text Diff Studio Table */}
      <div className="rounded-[8px] border border-[var(--line-strong)] bg-[#070D14] overflow-hidden">
        <div className="px-3.5 py-2.5 bg-[var(--bg-surface-inset)] border-b border-[var(--line-strong)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
            <h3 className="text-[12.5px] font-mono-code font-bold uppercase text-white tracking-wider">
              Identifier Forensic Comparison Matrix
            </h3>
          </div>
          <span className="text-[11px] font-mono-code text-[var(--text-muted)]">
            Character-level diff with insertion/deletion markers
          </span>
        </div>

        <div className="divide-y divide-[var(--line-subtle)]">
          {comparisonRows.map((row) => {
            const isCopied = copiedField === row.id;

            return (
              <div key={row.id} className="p-3 hover:bg-[var(--bg-surface-hover)] transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono-code text-[var(--cyan-accent)] uppercase font-semibold">
                    {row.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-mono-code text-[var(--text-muted)]">
                      {row.signalReason}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(row.candidateVal, row.id)}
                      className="text-[10px] font-mono-code text-[var(--text-muted)] hover:text-white flex items-center gap-1 cursor-pointer"
                      title="Copy candidate value"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-[var(--official)]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Official Baseline Column */}
                  <div className="p-2 rounded-[5px] bg-[#050A0F] border border-[var(--official-border)]/40 text-[12px]">
                    <span className="text-[10px] font-mono-code text-[var(--official)] block mb-1">
                      OFFICIAL BASELINE:
                    </span>
                    <div className={row.isMono ? 'font-mono-code text-white' : 'text-white'}>
                      {row.officialVal}
                    </div>
                  </div>

                  {/* Questioned Candidate Column */}
                  <div className="p-2 rounded-[5px] bg-[#0B0505] border border-[var(--high-border)]/40 text-[12px]">
                    <span className="text-[10px] font-mono-code text-[var(--high)] block mb-1">
                      QUESTIONED CANDIDATE:
                    </span>
                    <div className={row.isMono ? 'font-mono-code' : ''}>
                      {row.useDiff ? (
                        <CharDiff
                          official={row.officialVal}
                          candidate={row.candidateVal}
                          className={row.isMono ? 'font-mono-code' : ''}
                        />
                      ) : (
                        <span className="text-white">{row.candidateVal}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (isExpandedModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-5xl rounded-[12px] bg-[#081018] border border-[var(--cyan-accent)]/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-6 space-y-4 my-auto">
          <div className="flex items-center justify-between border-b border-[var(--line-strong)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[var(--cyan-glow)] border border-[var(--cyan-accent)]/50 flex items-center justify-center">
                <Sliders className="w-4 h-4 text-[var(--cyan-accent)]" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-white font-mono-code flex items-center gap-2">
                  <span>Interactive Asset Comparison Studio</span>
                  <span className="px-2 py-0.2 rounded bg-[var(--high-bg)] text-[var(--high)] text-[10.5px]">
                    FORENSIC ANALYSIS
                  </span>
                </h2>
                <p className="text-[11.5px] text-[var(--text-muted)]">
                  Side-by-side logo mark alignment, difference channel matrix, and character transposition inspection.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpandedModal(false)}
              className="p-1.5 rounded-[5px] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>

          {StudioContent}
        </div>
      </div>
    );
  }

  return <div className={className}>{StudioContent}</div>;
};
