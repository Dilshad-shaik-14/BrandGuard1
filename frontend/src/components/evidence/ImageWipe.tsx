import React, { useState } from 'react';
import { Layers, Sliders, Eye, ZoomIn } from 'lucide-react';

interface ImageWipeProps {
  officialUrl?: string;
  candidateUrl?: string;
  readoutText?: string;
  className?: string;
}

export const ImageWipe: React.FC<ImageWipeProps> = ({
  officialUrl,
  candidateUrl,
  readoutText = 'Near-identical, perceptual hash distance 3 of 64',
  className = '',
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage (0 to 100)
  const [viewMode, setViewMode] = useState<'wipe' | 'difference' | 'sideBySide'>('wipe');

  const hasBoth = Boolean(officialUrl && candidateUrl);

  if (!hasBoth) {
    return (
      <div className={`rounded-[8px] border border-dashed border-[var(--line-strong)] p-6 text-center bg-[var(--bg-surface-inset)] ${className}`}>
        <div className="w-12 h-12 mx-auto mb-2 rounded-[6px] border border-dashed border-[var(--line-strong)] flex items-center justify-center text-[var(--text-muted)]">
          <Layers className="w-5 h-5" />
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium">
          No image asset to compare. This visual perceptual hash is excluded from threat scoring.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mode controls header */}
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-mono-code uppercase text-[var(--text-muted)] flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
          <span>Forensic Mark Comparison</span>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center p-0.5 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] text-[11px] font-mono-code">
          <button
            type="button"
            onClick={() => setViewMode('wipe')}
            className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer ${
              viewMode === 'wipe' ? 'bg-[var(--line-strong)] text-white font-bold' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Wipe
          </button>
          <button
            type="button"
            onClick={() => setViewMode('difference')}
            className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer ${
              viewMode === 'difference' ? 'bg-[var(--high-bg)] text-[var(--high)] font-bold' : 'text-[var(--text-muted)] hover:text-white'
            }`}
            title="Difference Blend Mode highlights altered color channels"
          >
            Difference
          </button>
          <button
            type="button"
            onClick={() => setViewMode('sideBySide')}
            className={`px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer ${
              viewMode === 'sideBySide' ? 'bg-[var(--line-strong)] text-white font-bold' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            Dual View
          </button>
        </div>
      </div>

      {/* Main comparison stage */}
      {viewMode === 'sideBySide' ? (
        <div className="grid grid-cols-2 gap-3 h-[180px]">
          <div className="h-full rounded-[6px] border border-[var(--line-strong)] bg-[#070D14] p-3 flex flex-col items-center justify-center relative">
            <span className="absolute top-2 left-2 text-[10px] font-mono-code text-[var(--official)] bg-[var(--official-bg)] px-1.5 py-0.5 rounded border border-[var(--official-border)]">
              OFFICIAL BASELINE
            </span>
            <img src={officialUrl} alt="Official registered mark" className="max-h-[120px] max-w-full object-contain" />
          </div>
          <div className="h-full rounded-[6px] border border-[var(--high-border)] bg-[#070D14] p-3 flex flex-col items-center justify-center relative">
            <span className="absolute top-2 left-2 text-[10px] font-mono-code text-[var(--high)] bg-[var(--high-bg)] px-1.5 py-0.5 rounded border border-[var(--high-border)]">
              CANDIDATE LOGO
            </span>
            <img src={candidateUrl} alt="Candidate logo" className="max-h-[120px] max-w-full object-contain" />
          </div>
        </div>
      ) : viewMode === 'difference' ? (
        <div className="relative w-full h-[180px] rounded-[6px] overflow-hidden border border-[var(--line-strong)] bg-[#030609] select-none flex items-center justify-center">
          {/* Base official image */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img src={officialUrl} alt="Official" className="max-h-[150px] max-w-full object-contain" />
          </div>
          {/* Difference layer */}
          <div className="absolute inset-0 flex items-center justify-center p-4 mix-blend-difference filter contrast-200">
            <img src={candidateUrl} alt="Candidate" className="max-h-[150px] max-w-full object-contain" />
          </div>
          <div className="absolute bottom-2 left-3 text-[11px] font-mono-code text-[var(--high)] bg-black/80 px-2 py-0.5 rounded border border-[var(--high-border)]">
            Difference Mode Active: Non-black pixels indicate mark manipulation
          </div>
        </div>
      ) : (
        /* Interactive Wipe Slider */
        <div className="relative w-full h-[180px] rounded-[6px] overflow-hidden border border-[var(--line-strong)] bg-[#070D14] select-none">
          {/* Background layer: Registered official image */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img
              src={officialUrl}
              alt="Official registered logo baseline"
              className="max-h-[140px] max-w-full object-contain"
              loading="lazy"
            />
          </div>

          {/* Foreground layer: Candidate image with clip-path inset */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{
              clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
            }}
          >
            <img
              src={candidateUrl}
              alt="Questioned candidate image"
              className="max-h-[140px] max-w-full object-contain"
              loading="lazy"
            />
          </div>

          {/* Glowing Cyber Divider Line */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="h-full w-[2px] -ml-[1px] bg-[var(--cyan-accent)] shadow-[0_0_8px_var(--cyan-accent)]" />
            <div className="absolute top-1/2 -mt-3 -ml-3 w-6 h-6 rounded-full bg-[#080E15] border border-[var(--cyan-accent)] flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.6)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-accent)]" />
            </div>
          </div>

          {/* Range input slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            aria-label="Compare logos: drag slider to reveal registered mark or candidate"
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10 m-0 p-0"
          />

          {/* Top badges for Candidate vs Official */}
          <div className="absolute top-2 left-3 pointer-events-none">
            <span className="text-[10px] font-mono-code text-[var(--high)] bg-[var(--high-bg)] px-1.5 py-0.5 rounded border border-[var(--high-border)] font-bold">
              CANDIDATE ({sliderPos}%)
            </span>
          </div>
          <div className="absolute top-2 right-3 pointer-events-none">
            <span className="text-[10px] font-mono-code text-[var(--official)] bg-[var(--official-bg)] px-1.5 py-0.5 rounded border border-[var(--official-border)] font-bold">
              OFFICIAL ({100 - sliderPos}%)
            </span>
          </div>
        </div>
      )}

      {/* Readout rationale banner */}
      {readoutText && (
        <div className="text-[12px] text-white bg-[var(--bg-surface-inset)] rounded-[5px] px-3.5 py-2 border border-[var(--line-strong)] font-mono-code leading-relaxed">
          <strong className="text-[var(--cyan-accent)]">Visual Perceptual Analysis: </strong>
          {readoutText}
        </div>
      )}
    </div>
  );
};
