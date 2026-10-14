import React, { useState } from 'react';
import { computeCharDiff, DiffChar } from '../../lib/charDiff';

interface CharDiffProps {
  official: string;
  candidate: string;
  isMono?: boolean;
  className?: string;
  showAnnotations?: boolean;
}

export const CharDiff: React.FC<CharDiffProps> = ({
  official,
  candidate,
  isMono = false,
  className = '',
  showAnnotations = false,
}) => {
  const diffTokens: DiffChar[] = computeCharDiff(official, candidate);
  const [activeTooltip, setActiveTooltip] = useState<{ token: DiffChar; index: number } | null>(null);

  const confusableTokens = diffTokens.filter((t) => t.isDiff && t.lookalikeHint);

  return (
    <div className="space-y-1.5 inline-block max-w-full">
      <bdi
        className={`inline-block truncate ${isMono ? 'font-mono-code' : ''} ${className}`}
        title={candidate}
      >
        {diffTokens.map((token, idx) => {
          if (!token.isDiff) {
            return <span key={idx}>{token.char}</span>;
          }

          return (
            <span
              key={idx}
              onMouseEnter={() => setActiveTooltip({ token, index: idx })}
              onMouseLeave={() => setActiveTooltip(null)}
              title={token.lookalikeHint || `Altered character: ${token.char}`}
              className="inline-block px-[2px] font-bold text-[var(--high)] bg-[var(--high-bg)] border-b-2 border-[var(--high)] shadow-[0_0_6px_rgba(239,68,68,0.4)] cursor-help rounded-t-[2px] mx-[0.5px]"
            >
              {token.char}
            </span>
          );
        })}
      </bdi>

      {/* Floating or inline Unicode Confusable Explanation */}
      {showAnnotations && confusableTokens.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {confusableTokens.map((token, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 rounded-[3px] bg-[var(--high-bg)] border border-[var(--high-border)] text-[10.5px] font-mono-code text-[var(--high)] flex items-center gap-1"
            >
              <strong className="text-white">'{token.char}'</strong>
              <span>({token.codePoint || 'Non-ASCII'} · {token.script || 'Homoglyph'})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
