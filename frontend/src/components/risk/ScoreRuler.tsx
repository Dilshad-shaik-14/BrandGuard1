import React from 'react';
import { RiskBand, SignalBreakdown } from '../../types/brandguard';
import { BANDS } from '../../lib/labels';

interface ScoreRulerProps {
  score: number;
  band: RiskBand;
  variant?: 'mini' | 'full';
  signals?: SignalBreakdown[];
  className?: string;
}

export const ScoreRuler: React.FC<ScoreRulerProps> = ({
  score,
  band,
  variant = 'mini',
  signals = [],
  className = '',
}) => {
  const bandConfig = BANDS[band];
  const boundedScore = Math.max(0, Math.min(100, score));

  if (variant === 'mini') {
    return (
      <div
        role="img"
        aria-label={`Score ${boundedScore} of 100, ${bandConfig.label}`}
        className={`relative h-[6px] w-[96px] overflow-hidden rounded-[2px] bg-slate-100 ${className}`}
        style={{
          background: 'linear-gradient(to right, var(--ign-t) 0%, var(--ign-t) 30%, var(--rev-t) 30%, var(--rev-t) 55%, var(--med-t) 55%, var(--med-t) 75%, var(--high-t) 75%, var(--high-t) 100%)',
          border: '1px solid var(--line)',
        }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${boundedScore}%`,
            backgroundColor: bandConfig.colorVar,
          }}
        />
      </div>
    );
  }

  // Full variant: segments per available signal
  const availableSignals = signals.filter(s => s.available && (s.contribution > 0 || (typeof s.score === 'number' && s.score > 0) || (typeof s.raw_score === 'number' && s.raw_score > 0)));

  return (
    <div className={`w-full ${className}`}>
      {/* 14px segmented ruler bar */}
      <div
        role="img"
        aria-label={`Score ${boundedScore} of 100, ${bandConfig.label}`}
        className="relative h-[14px] w-full overflow-hidden rounded-[2px]"
        style={{
          background: 'linear-gradient(to right, var(--ign-t) 0%, var(--ign-t) 30%, var(--rev-t) 30%, var(--rev-t) 55%, var(--med-t) 55%, var(--med-t) 75%, var(--high-t) 75%, var(--high-t) 100%)',
          border: '1px solid var(--line)',
        }}
      >
        {/* Ticks at 30, 55, 75 */}
        <div className="absolute top-0 bottom-0 left-[30%] w-[1px] bg-white opacity-80" />
        <div className="absolute top-0 bottom-0 left-[55%] w-[1px] bg-white opacity-80" />
        <div className="absolute top-0 bottom-0 left-[75%] w-[1px] bg-white opacity-80" />

        {/* Segments container */}
        <div className="absolute top-0 bottom-0 left-0 flex h-full" style={{ width: `${boundedScore}%` }}>
          {availableSignals.length > 0 ? (
            availableSignals.map((sig, idx) => {
              const segPct = boundedScore > 0 ? (sig.contribution / boundedScore) * 100 : 0;
              return (
                <div
                  key={sig.key}
                  title={`${sig.label}: ${sig.contribution} pts`}
                  style={{
                    width: `${segPct}%`,
                    backgroundColor: bandConfig.colorVar,
                    marginRight: idx < availableSignals.length - 1 ? '1px' : '0px',
                    opacity: 0.85 + (idx % 2) * 0.15, // subtle contrast difference between segments
                  }}
                  className="h-full"
                />
              );
            })
          ) : (
            <div
              className="h-full w-full"
              style={{ backgroundColor: bandConfig.colorVar }}
            />
          )}
        </div>
      </div>

      {/* Threshold ticks and labels beneath */}
      <div className="relative mt-1 text-[11.5px] text-[var(--ink-3)] font-mono-code tabular-nums select-none h-4">
        <span className="absolute left-0">0</span>
        <span className="absolute left-[30%] -translate-x-1/2">
          Needs review from 30
        </span>
        <span className="absolute left-[55%] -translate-x-1/2">
          Medium 55
        </span>
        <span className="absolute left-[75%] -translate-x-1/2">
          High 75
        </span>
        <span className="absolute right-0">100</span>
      </div>
    </div>
  );
};
