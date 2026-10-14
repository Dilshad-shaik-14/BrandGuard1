import React, { useState, useMemo, useRef } from 'react';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  ChevronRight,
  Filter,
  Maximize2,
  Minimize2,
  X,
  ExternalLink,
  Flame,
  Radio,
} from 'lucide-react';
import { Brand, Finding, OfficialAsset, RiskBand } from '../../types/brandguard';
import { RiskGlyph } from '../risk/RiskGlyph';
import { BANDS } from '../../lib/labels';

interface ThreatRelationshipGraphProps {
  brand: Brand;
  officialAssets: OfficialAsset[];
  findings: Finding[];
  onSelectFinding: (findingId: string) => void;
  className?: string;
}

export const ThreatRelationshipGraph: React.FC<ThreatRelationshipGraphProps> = ({
  brand,
  officialAssets,
  findings,
  onSelectFinding,
  className = '',
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'high' | 'medium'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter threats
  const activeThreats = useMemo(() => {
    return findings.filter((f) => {
      if (filterType === 'high') return f.band === 'high';
      if (filterType === 'medium') return f.band === 'medium';
      return f.band !== 'ignored';
    });
  }, [findings, filterType]);

  // Layout node positions in radial orbit topology
  const graphData = useMemo(() => {
    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Center Brand HQ
    const centerNode = {
      id: `brand-${brand.id}`,
      type: 'brand' as const,
      name: brand.name,
      subtitle: brand.domain || 'Core HQ',
      x: centerX,
      y: centerY,
      radius: 36,
      color: 'var(--cyan-accent)',
    };

    // 2. Inner Ring: Official Assets (Green)
    const officialNodes = officialAssets.map((asset, idx) => {
      const angle = (idx / Math.max(1, officialAssets.length)) * 2 * Math.PI - Math.PI / 2;
      const r = 130;
      return {
        id: `asset-${asset.id}`,
        type: 'official' as const,
        name: asset.display_name || asset.app_name || asset.handle,
        subtitle: `${asset.platform || asset.store}: ${asset.handle || asset.package_id}`,
        raw: asset,
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        radius: 20,
        color: 'var(--official)',
      };
    });

    // 3. Outer Ring: Suspicious Candidates / Threats (Red / Amber)
    const threatNodes = activeThreats.slice(0, 14).map((f, idx) => {
      const count = Math.min(14, activeThreats.length);
      const angle = (idx / Math.max(1, count)) * 2 * Math.PI - Math.PI / 2 + 0.2;
      const r = 240;
      const isHigh = f.band === 'high' || f.score >= 75;
      return {
        id: `finding-${f.id}`,
        type: 'threat' as const,
        findingId: f.id,
        name: f.candidate.name,
        subtitle: `@${f.candidate.handle_or_package}`,
        band: f.band,
        score: f.score,
        summary: f.summary_short,
        matchedAssetId: f.matched_asset_id,
        raw: f,
        x: centerX + r * Math.cos(angle),
        y: centerY + r * Math.sin(angle),
        radius: isHigh ? 18 : 14,
        color: isHigh ? '#ff2222' : '#f59e0b',
      };
    });

    // 4. Edges: Connect Brand -> Official Assets
    const officialEdges = officialNodes.map((n) => ({
      id: `edge-brand-${n.id}`,
      source: centerNode,
      target: n,
      type: 'official_baseline' as const,
      color: 'var(--official)',
    }));

    // 5. Edges: Connect Threat -> Target Asset or Center
    const threatEdges = threatNodes.map((th) => {
      const targetOfficial = officialNodes.find((on) => on.raw.id === th.matchedAssetId) || centerNode;
      return {
        id: `edge-threat-${th.id}`,
        source: targetOfficial,
        target: th,
        type: 'threat_attack' as const,
        color: th.color,
      };
    });

    return {
      centerNode,
      officialNodes,
      threatNodes,
      edges: [...officialEdges, ...threatEdges],
      allNodes: [centerNode, ...officialNodes, ...threatNodes],
    };
  }, [brand, officialAssets, activeThreats]);

  // Selected Node inspector details
  const activeNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.allNodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData.allNodes]);

  // Pan controls
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsPanning(false);
  };

  return (
    <div className={`relative rounded-[10px] border border-[var(--line-strong)] bg-[#050B12] overflow-hidden ${className}`}>
      {/* Graph Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-[#09131F]/90 backdrop-blur-md px-3 py-1.5 rounded-[6px] border border-[var(--line-strong)] shadow-md">
          <Layers className="w-4 h-4 text-[var(--cyan-accent)]" />
          <span className="text-[12.5px] font-mono-code font-bold text-white uppercase tracking-wider">
            Threat Relationship Topology
          </span>
          <span className="text-[11px] font-mono-code text-[var(--cyan-accent)] bg-[var(--cyan-glow)] px-2 py-0.2 rounded font-bold">
            {activeThreats.length} NODES
          </span>
        </div>

        {/* Filters and Zoom */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Severity Filter */}
          <div className="flex items-center rounded-[5px] bg-[#09131F]/90 backdrop-blur-md border border-[var(--line-strong)] p-0.5 text-[11px] font-mono-code">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-[3px] font-bold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[var(--cyan-accent)] text-[#041217]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              All Vectors
            </button>
            <button
              type="button"
              onClick={() => setFilterType('high')}
              className={`px-2.5 py-1 rounded-[3px] font-bold transition-colors cursor-pointer ${
                filterType === 'high'
                  ? 'bg-[#ef4444] text-white'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              High Risk
            </button>
            <button
              type="button"
              onClick={() => setFilterType('medium')}
              className={`px-2.5 py-1 rounded-[3px] font-bold transition-colors cursor-pointer ${
                filterType === 'medium'
                  ? 'bg-[#f59e0b] text-[#041217]'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Medium
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center rounded-[5px] bg-[#09131F]/90 backdrop-blur-md border border-[var(--line-strong)] p-0.5 text-[11px] font-mono-code">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}
              className="p-1 text-[var(--text-secondary)] hover:text-white cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-white font-bold">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))}
              className="p-1 text-[var(--text-secondary)] hover:text-white cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-1 text-[var(--text-secondary)] hover:text-white cursor-pointer border-l border-[var(--line-subtle)] ml-0.5"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-[460px] cursor-grab active:cursor-grabbing select-none"
      >
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Subtle Cyber Grid */}
          <defs>
            <pattern id="topology-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(6, 182, 212, 0.05)" strokeWidth="1" />
            </pattern>
            {/* Filter Glows */}
            <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="800" height="500" fill="url(#topology-grid)" />

          {/* Radial concentric range rings */}
          <circle cx="400" cy="250" r="130" fill="none" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="400" cy="250" r="240" fill="none" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="1" strokeDasharray="3 3" />

          {/* Edges */}
          {graphData.edges.map((edge) => {
            const isOfficial = edge.type === 'official_baseline';

            return (
              <g key={edge.id}>
                <line
                  x1={edge.source.x}
                  y1={edge.source.y}
                  x2={edge.target.x}
                  y2={edge.target.y}
                  stroke={edge.color}
                  strokeWidth={isOfficial ? 1.5 : 1.2}
                  strokeOpacity={isOfficial ? 0.4 : 0.6}
                  strokeDasharray={isOfficial ? undefined : '5 4'}
                  className={!isOfficial ? 'animate-pulse' : undefined}
                />
              </g>
            );
          })}

          {/* Center Brand Node */}
          <g
            className="cursor-pointer"
            onClick={() => setSelectedNodeId(graphData.centerNode.id)}
          >
            <circle
              cx={graphData.centerNode.x}
              cy={graphData.centerNode.y}
              r={graphData.centerNode.radius}
              fill="#06121D"
              stroke="var(--cyan-accent)"
              strokeWidth="2.5"
              filter="url(#glow-cyan)"
            />
            <text
              x={graphData.centerNode.x}
              y={graphData.centerNode.y + 4}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
              className="pointer-events-none select-none"
            >
              CORE HQ
            </text>
            <text
              x={graphData.centerNode.x}
              y={graphData.centerNode.y + 50}
              textAnchor="middle"
              fill="var(--cyan-accent)"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {graphData.centerNode.name}
            </text>
          </g>

          {/* Official Asset Nodes (Green) */}
          {graphData.officialNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;

            return (
              <g
                key={node.id}
                className="cursor-pointer group"
                onClick={() => setSelectedNodeId(node.id)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill="#061A13"
                  stroke="var(--official)"
                  strokeWidth={isSelected ? 3 : 1.5}
                />
                <circle cx={node.x} cy={node.y} r={node.radius - 5} fill="var(--official)" fillOpacity="0.4" />
                <text
                  x={node.x}
                  y={node.y + 3}
                  textAnchor="middle"
                  fill="#10b981"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  ASSET
                </text>
                <text
                  x={node.x}
                  y={node.y + 28}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontFamily="monospace"
                  className="opacity-80 group-hover:opacity-100"
                >
                  {(node.name || '').length > 14 ? `${(node.name || '').slice(0, 12)}...` : (node.name || '')}
                </text>
              </g>
            );
          })}

          {/* Threat / Candidate Nodes (Red / Amber) */}
          {graphData.threatNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isHigh = node.band === 'high';

            return (
              <g
                key={node.id}
                className="cursor-pointer group"
                onClick={() => setSelectedNodeId(node.id)}
              >
                {/* Outer Ring Pulse for High Risk */}
                {isHigh && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius + 6}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1"
                    strokeOpacity="0.5"
                    className="animate-ping"
                    style={{ transformOrigin: `${node.x}px ${node.y}px`, animationDuration: '3s' }}
                  />
                )}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={isHigh ? '#200909' : '#1F1407'}
                  stroke={node.color}
                  strokeWidth={isSelected ? 3 : 1.8}
                />
                <text
                  x={node.x}
                  y={node.y + 3.5}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.score}
                </text>
                <text
                  x={node.x}
                  y={node.y + (isHigh ? 27 : 24)}
                  textAnchor="middle"
                  fill={node.color}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="opacity-90 group-hover:opacity-100"
                >
                  {node.name.length > 12 ? `${node.name.slice(0, 10)}...` : node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Contextual Node Inspection Drawer */}
      {activeNode && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 z-20 rounded-[8px] bg-[#0A141F]/95 backdrop-blur-md border border-[var(--cyan-accent)]/60 shadow-[0_12px_36px_rgba(0,0,0,0.85)] p-4 space-y-3 animate-fadeIn">
          <div className="flex items-start justify-between gap-2 border-b border-[var(--line-subtle)] pb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeNode.color }}
                />
                <span className="text-[10px] font-mono-code font-bold uppercase text-[var(--cyan-accent)]">
                  {activeNode.type === 'threat'
                    ? 'SUSPICIOUS CANDIDATE'
                    : activeNode.type === 'official'
                    ? 'VERIFIED OFFICIAL ASSET'
                    : 'PROTECTED BRAND'}
                </span>
              </div>
              <h4 className="text-[13px] font-bold text-white font-mono-code mt-0.5">{activeNode.name}</h4>
              <p className="text-[11px] font-mono-code text-[var(--text-muted)] truncate">{activeNode.subtitle}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="text-[var(--text-muted)] hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeNode.type === 'threat' && (
            <div className="space-y-2 text-[11.5px] font-mono-code">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Risk Severity:</span>
                <span className="font-bold text-white" style={{ color: activeNode.color }}>
                  {activeNode.score}/100 ({activeNode.band?.toUpperCase()})
                </span>
              </div>

              {activeNode.summary && (
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {activeNode.summary}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSelectFinding(activeNode.findingId!)}
                  className="w-full h-7 rounded-[4px] bg-[var(--cyan-accent)] hover:brightness-110 text-[#041217] font-bold text-[11.5px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <span>Open Investigation Workbench</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeNode.type === 'official' && (
            <div className="space-y-1.5 text-[11.5px] font-mono-code text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5 text-[var(--official)]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Exact Identifier Baseline</span>
              </div>
              <p className="text-[10.5px] text-[var(--text-muted)]">
                Exclusion filter guarantees this asset is set aside before threat calculation.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Legend Indicator */}
      <div className="absolute bottom-3 right-3 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-[5px] bg-[#070E17]/90 backdrop-blur-md border border-[var(--line-strong)] text-[10.5px] font-mono-code">
        <span className="flex items-center gap-1.5 text-white">
          <span className="w-2 h-2 rounded-full bg-[var(--cyan-accent)] shadow-[0_0_6px_rgba(6,182,212,0.8)]" /> Brand Core
        </span>
        <span className="flex items-center gap-1.5 text-white">
          <span className="w-2 h-2 rounded-full bg-[var(--official)] shadow-[0_0_6px_rgba(16,185,129,0.8)]" /> Verified Asset
        </span>
        <span className="flex items-center gap-1.5 text-white">
          <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_6px_rgba(239,68,68,0.8)]" /> High Threat
        </span>
        <span className="flex items-center gap-1.5 text-white">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_6px_rgba(245,158,11,0.8)]" /> Medium Risk
        </span>
      </div>
    </div>
  );
};
