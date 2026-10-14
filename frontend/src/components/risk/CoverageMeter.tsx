import React from 'react';

interface CoverageMeterProps {
  available: number;
  total: number;
  className?: string;
}

export const CoverageMeter: React.FC<CoverageMeterProps> = ({ available, total, className = '' }) => {
  const squares = Array.from({ length: total }, (_, i) => i < available);

  return (
    <div className={`flex items-center gap-2 text-[12.5px] text-[var(--ink-2)] ${className}`}>
      <div className="flex items-center gap-1" aria-hidden="true">
        {squares.map((isFilled, idx) => (
          <span
            key={idx}
            className={`inline-block w-2.5 h-2.5 rounded-[1px] transition-colors ${
              isFilled ? 'bg-[var(--official)]' : 'bg-transparent border border-dashed border-[var(--line-2)]'
            }`}
          />
        ))}
      </div>
      <span>
        Evidence coverage: <strong className="font-medium text-[var(--ink)] tabular-nums">{available} of {total}</strong> signals available
      </span>
    </div>
  );
};
