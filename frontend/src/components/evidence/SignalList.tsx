import React from 'react';
import { SignalBreakdown } from '../../types/brandguard';

interface SignalListProps {
  signals: SignalBreakdown[];
  coverageAvailable: number;
  coverageTotal: number;
  className?: string;
}

export const SignalList: React.FC<SignalListProps> = ({
  signals,
  coverageAvailable,
  coverageTotal,
  className = '',
}) => {
  const isPartial = coverageAvailable < coverageTotal;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {signals.map((sig) => {
          const scoreVal = typeof sig.score === 'number' ? sig.score : typeof sig.raw_score === 'number' ? sig.raw_score : 0;
          const scorePercent = Math.round(scoreVal * 100);

          return (
            <div key={sig.key} className="py-3 space-y-1.5">
              <div className="flex items-center justify-between text-[13.5px]">
                <div className="flex items-baseline gap-2">
                  <span className={`font-semibold ${sig.available ? 'text-[var(--ink)]' : 'text-[var(--ink-3)]'}`}>
                    {sig.label}
                  </span>
                  <span className="text-[12px] text-[var(--ink-3)] font-mono-code tabular-nums">
                    weight {sig.weight.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* 96px bar */}
                  {sig.available ? (
                    <div
                      className="w-[96px] h-[7px] rounded-[1px] bg-[var(--ign-t)] overflow-hidden border border-[var(--line)]"
                      title={`Signal score: ${scorePercent}%`}
                    >
                      <div
                        className="h-full bg-[var(--ink)] transition-all duration-200"
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-[96px] h-[7px] rounded-[1px] border border-dashed border-[var(--line-2)] bg-transparent"
                      title="Signal not available"
                    />
                  )}

                  {/* Contribution points */}
                  <span className="w-16 text-right font-mono-code tabular-nums text-[13px] font-medium text-[var(--ink)]">
                    {sig.available ? `${sig.contribution.toFixed(1)} pts` : '—'}
                  </span>
                </div>
              </div>

              {/* Plain language reason */}
              <p className={`text-[12.5px] max-w-[500px] leading-relaxed ${sig.available ? 'text-[var(--ink-2)]' : 'text-[var(--ink-3)] italic'}`}>
                {sig.reason}
              </p>

              {/* Compared raw values in mono */}
              {sig.compared && (
                <div className="bg-[var(--sunk)] p-2 rounded-[3px] font-mono-code text-[11.5px] text-[var(--ink-2)] border border-[var(--line)] space-y-0.5">
                  <div className="truncate">
                    <span className="text-[var(--ink-3)]">Official: </span>
                    {sig.compared.official}
                  </div>
                  <div className="truncate">
                    <span className="text-[var(--ink-3)]">Candidate: </span>
                    {sig.compared.candidate}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanatory sentence under list */}
      <p className="text-[12.5px] text-[var(--ink-3)] leading-relaxed">
        {isPartial
          ? 'The score is calculated over the signals that were available, so these points are scaled up to add to 100.'
          : 'All five signals were available, so each signal contributes its weight times its score.'}
      </p>
    </div>
  );
};
