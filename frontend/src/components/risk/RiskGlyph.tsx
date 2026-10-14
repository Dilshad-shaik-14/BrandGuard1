import React from 'react';
import { RiskBand } from '../../types/brandguard';
import { BANDS } from '../../lib/labels';

interface RiskGlyphProps {
  band: RiskBand;
  className?: string;
  size?: number;
}

export const RiskGlyph: React.FC<RiskGlyphProps> = ({ band, className = '', size = 10 }) => {
  const config = BANDS[band];

  if (band === 'high') {
    return (
      <span
        role="img"
        aria-label="High risk"
        className={`inline-block flex-shrink-0 ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: 'var(--high)',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        }}
      />
    );
  }

  if (band === 'medium') {
    return (
      <span
        role="img"
        aria-label="Medium risk"
        className={`inline-block flex-shrink-0 ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: 'var(--med)',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }}
      />
    );
  }

  if (band === 'needs_review') {
    return (
      <span
        role="img"
        aria-label="Needs review"
        className={`inline-block flex-shrink-0 ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: 'linear-gradient(to right, var(--rev) 50%, transparent 50%)',
          border: '1px solid var(--rev)',
        }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label="Ignored"
      className={`inline-block flex-shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: '1.5px solid var(--ign)',
        backgroundColor: 'transparent',
      }}
    />
  );
};
