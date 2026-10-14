import React from 'react';
import { RiskBand } from '../../types/brandguard';
import { BANDS } from '../../lib/labels';
import { RiskGlyph } from './RiskGlyph';

interface BandLabelProps {
  band: RiskBand;
  score?: number;
  className?: string;
}

export const BandLabel: React.FC<BandLabelProps> = ({ band, score, className = '' }) => {
  const config = BANDS[band];

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <RiskGlyph band={band} />
      <span className="text-[13.5px] font-medium" style={{ color: config.colorVar }}>
        {config.label}
      </span>
      {score !== undefined && (
        <span className="text-[13.5px] font-mono-code tabular-nums" style={{ color: config.colorVar }}>
          {score}
        </span>
      )}
    </div>
  );
};
