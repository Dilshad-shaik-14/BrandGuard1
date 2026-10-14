import React, { useState, useRef } from 'react';
import { ShieldCheck, Shield, ExternalLink, Globe, Smartphone, CheckCircle2, AlertCircle, X, ChevronRight } from 'lucide-react';
import { Brand, OfficialAsset } from '../../types/brandguard';

interface BrandIdentityOrbitalProps {
  brand: Brand;
  assets: OfficialAsset[];
  onSelectAsset?: (asset: OfficialAsset) => void;
  className?: string;
}

export const BrandIdentityOrbital: React.FC<BrandIdentityOrbitalProps> = ({
  brand,
  assets,
  onSelectAsset,
  className = '',
}) => {
  const [hoveredAsset, setHoveredAsset] = useState<OfficialAsset | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<OfficialAsset | null>(null);
  const isCardHoveredRef = useRef(false);
  const dismissTimerRef = useRef<number | null>(null);

  const radius = 145; // Orbital circle radius in px
  const center = { x: 220, y: 200 };

  const handleNodeEnter = (ast: OfficialAsset) => {
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setHoveredAsset(ast);
    setSelectedAsset(ast);
  };

  const handleNodeLeave = () => {
    if (!dismissTimerRef.current) {
      dismissTimerRef.current = window.setTimeout(() => {
        if (!isCardHoveredRef.current) {
          setHoveredAsset(null);
        }
        dismissTimerRef.current = null;
      }, 1200);
    }
  };

  const activeAsset = hoveredAsset || selectedAsset;

  return (
    <div
      className={`relative w-full h-[400px] rounded-[10px] border border-[var(--line-strong)] bg-gradient-to-b from-[#09111A] via-[#060B10] to-[#04080D] overflow-hidden flex items-center justify-center select-none shadow-[0_8px_32px_rgba(0,0,0,0.6)] ${className}`}
    >
      {/* Background Cyber Radar & Grid Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="orbitalGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0.12)" />
            <stop offset="60%" stopColor="rgba(16, 185, 129, 0.04)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#orbitalGlow)" />

        {/* Concentric Defense Perimeter Circles */}
        <circle cx={center.x} cy={center.y} r={radius * 0.4} fill="none" stroke="rgba(22, 38, 54, 0.9)" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx={center.x} cy={center.y} r={radius * 0.75} fill="none" stroke="rgba(22, 38, 54, 0.8)" strokeWidth="1" />
        <circle cx={center.x} cy={center.y} r={radius} fill="none" stroke="rgba(6, 182, 212, 0.35)" strokeWidth="1.5" />
        <circle cx={center.x} cy={center.y} r={radius * 1.25} fill="none" stroke="rgba(22, 38, 54, 0.7)" strokeWidth="1" strokeDasharray="5 5" />

        {/* Crosshair coordinate lines */}
        <line x1={center.x - radius * 1.3} y1={center.y} x2={center.x + radius * 1.3} y2={center.y} stroke="rgba(22, 38, 54, 0.6)" strokeWidth="1" />
        <line x1={center.x} y1={center.y - radius * 1.3} x2={center.x} y2={center.y + radius * 1.3} stroke="rgba(22, 38, 54, 0.6)" strokeWidth="1" />

        {/* Dynamic connection lines to each orbiting baseline asset */}
        {assets.map((ast, idx) => {
          const angle = (idx / Math.max(1, assets.length)) * Math.PI * 2 - Math.PI / 2;
          const x = center.x + Math.cos(angle) * radius;
          const y = center.y + Math.sin(angle) * radius;
          const isVerified = ast.verification_status === 'verified';
          const isSelected = activeAsset?.id === ast.id;

          return (
            <g key={ast.id}>
              <line
                x1={center.x}
                y1={center.y}
                x2={x}
                y2={y}
                stroke={isSelected ? '#06b6d4' : isVerified ? 'rgba(16, 185, 129, 0.5)' : 'rgba(234, 179, 8, 0.35)'}
                strokeWidth={isSelected ? 2 : 1}
                strokeDasharray={isVerified ? undefined : '3 3'}
              />
              {/* Radar pulse blip */}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4}
                fill={isVerified ? '#10b981' : '#eab308'}
                opacity={0.8}
              />
            </g>
          );
        })}
      </svg>

      {/* Rotating Cyber Radar Sweep Line */}
      <div
        className="absolute pointer-events-none origin-center"
        style={{
          left: center.x - radius,
          top: center.y - radius,
          width: radius * 2,
          height: radius * 2,
        }}
      >
        <div className="w-full h-full rounded-full radar-sweep" style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(6,182,212,0.18) 360deg)'
        }} />
      </div>

      {/* Center Protected Core Brand Mark */}
      <div
        className="absolute z-10 flex flex-col items-center justify-center p-3 rounded-full bg-[#0B1520] border-2 border-[var(--cyan-accent)] shadow-[0_0_28px_rgba(6,182,212,0.4)] transition-transform hover:scale-105"
        style={{
          left: center.x - 45,
          top: center.y - 45,
          width: 90,
          height: 90,
        }}
      >
        <div className="w-13 h-13 rounded-full overflow-hidden bg-white p-1 flex items-center justify-center shadow-inner">
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Orbiting Baseline Asset Nodes */}
      {assets.map((ast, idx) => {
        const angle = (idx / Math.max(1, assets.length)) * Math.PI * 2 - Math.PI / 2;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;
        const isVerified = ast.verification_status === 'verified';
        const isHovered = activeAsset?.id === ast.id;

        return (
          <div
            key={ast.id}
            onMouseEnter={() => handleNodeEnter(ast)}
            onMouseLeave={handleNodeLeave}
            onClick={() => {
              setSelectedAsset(ast);
              if (onSelectAsset) onSelectAsset(ast);
            }}
            className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 p-1.5 rounded-[6px] border transition-all cursor-pointer ${
              isHovered
                ? 'bg-[#0E1A27] border-[var(--cyan-accent)] shadow-[0_0_16px_rgba(6,182,212,0.5)] scale-110 z-30'
                : isVerified
                ? 'bg-[#08121B] border-[var(--official-border)] text-white hover:border-[var(--official)]'
                : 'bg-[#08121B] border-[var(--line-strong)] text-[var(--text-secondary)]'
            }`}
            style={{ left: x, top: y }}
          >
            {isVerified ? (
              <ShieldCheck className="w-4 h-4 text-[var(--official)] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[var(--med)] shrink-0" />
            )}

            <span className="text-[11px] font-mono-code font-bold max-w-[90px] truncate">
              {ast.handle ? `@${ast.handle}` : ast.package_id || ast.display_name}
            </span>
          </div>
        );
      })}

      {/* Floating HUD Telemetry for Hovered/Selected Asset */}
      {activeAsset && (
        <div
          onMouseEnter={() => {
            isCardHoveredRef.current = true;
            if (dismissTimerRef.current) {
              window.clearTimeout(dismissTimerRef.current);
              dismissTimerRef.current = null;
            }
          }}
          onMouseLeave={() => {
            isCardHoveredRef.current = false;
          }}
          className="absolute bottom-3 left-4 right-4 z-30 p-3.5 rounded-[8px] bg-[#0A1420]/98 backdrop-blur-md border border-[var(--line-active)] shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex items-center justify-between text-[12px] animate-in fade-in duration-100"
        >
          <div className="space-y-1 min-w-0 flex-1 mr-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white font-mono-code">
                {activeAsset.platform ? activeAsset.platform.toUpperCase() : activeAsset.store?.toUpperCase()}: @{activeAsset.handle || activeAsset.package_id}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold ${
                  activeAsset.verification_status === 'verified'
                    ? 'bg-[var(--official-bg)] text-[var(--official)] border border-[var(--official-border)]'
                    : 'bg-[var(--med-bg)] text-[var(--med)] border border-[var(--med-border)]'
                }`}
              >
                {activeAsset.verification_status === 'verified' ? 'VERIFIED OFFICIAL' : 'REGISTERED BASELINE'}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] truncate">
              Registered ID: {activeAsset.id} · Verification: {activeAsset.verification_method || 'Domain link'}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onSelectAsset && onSelectAsset(activeAsset)}
              className="h-8 px-3.5 rounded-[5px] bg-gradient-to-r from-[#06b6d4] to-[#10b981] text-[#041217] text-[11.5px] font-bold flex items-center gap-1.5 hover:brightness-110 shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              <span>Validate Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setSelectedAsset(null);
                setHoveredAsset(null);
                isCardHoveredRef.current = false;
              }}
              className="w-7 h-7 rounded-[4px] border border-[var(--line-strong)] hover:border-white text-[var(--text-muted)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Radar telemetry labels */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 text-[11px] font-mono-code text-[var(--text-muted)]">
        <span className="w-2 h-2 rounded-full bg-[var(--cyan-accent)] animate-pulse" />
        <span className="text-white font-bold uppercase">Perimeter Orbital Radar</span>
        <span className="text-[var(--line-strong)]">|</span>
        <span>{assets.filter((a) => a.verification_status === 'verified').length} / {assets.length} Verified</span>
      </div>
    </div>
  );
};
