import React from 'react';
import { GATES } from '../../lib/labels';

interface GateNoteProps {
  gates: string[];
  coverageAvailable?: number;
  coverageTotal?: number;
  className?: string;
}

export const GateNote: React.FC<GateNoteProps> = ({
  gates,
  coverageAvailable = 2,
  coverageTotal = 5,
  className = '',
}) => {
  if (!gates || gates.length === 0) return null;

  return (
    <div
      role="note"
      className={`rounded-[5px] border border-[var(--rev)] bg-[var(--rev-t)] p-3.5 text-[13px] text-[var(--ink)] ${className}`}
    >
      <div className="flex items-center gap-2 font-medium text-[var(--rev)] mb-1">
        <span className="glyph-needs-review" aria-hidden="true" />
        <span>Rule gate applied</span>
      </div>
      <div className="space-y-1.5 text-[var(--ink-2)]">
        {gates.includes('name_only_cap') && (
          <p>
            {GATES.name_only_cap.explanation}
          </p>
        )}
        {gates.includes('low_coverage_cap') && (
          <p>
            Capped at Needs review. Only {coverageAvailable} of {coverageTotal} signals were available.
          </p>
        )}
      </div>
    </div>
  );
};
