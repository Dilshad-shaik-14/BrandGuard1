import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ShieldAlert, ShieldCheck, Radio, ArrowRight, CornerDownLeft, ExternalLink, Clock, Shield } from 'lucide-react';
import { Brand, Finding, OfficialAsset } from '../../types/brandguard';
import { store } from '../../services/store';

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand;
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  brand,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const state = store.getState();
  const allBrands = state.brands;
  const allFindings = state.findings;
  const allAssets = state.assets;
  const allScans = state.scans;

  const brandMap = React.useMemo(() => {
    const map = new Map<string, Brand>();
    allBrands.forEach((b) => map.set(b.id, b));
    return map;
  }, [allBrands]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter findings, assets, and scans across all brands based on query
  const searchResults = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'finding' | 'asset' | 'scan' | 'brand' | 'navigation';
      badge?: string;
      badgeColor?: string;
      brandName?: string;
      action: () => void;
    }> = [];

    // Matching brands
    allBrands.forEach((b) => {
      if (
        q &&
        (b.name.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q) ||
          (b.domain && b.domain.toLowerCase().includes(q)) ||
          b.aliases?.some((al) => al.toLowerCase().includes(q)))
      ) {
        results.push({
          id: `brand-${b.id}`,
          title: `Brand: ${b.name}`,
          subtitle: `${b.domain || 'Domain protected'} · ${b.description.slice(0, 60)}...`,
          type: 'brand',
          badge: 'BRAND',
          badgeColor: 'text-[var(--cyan-accent)]',
          action: () => {
            store.setActiveBrand(b.id);
            navigate(`/brands/${b.id}`);
          },
        });
      }
    });

    // Matching findings across ALL brands
    allFindings.forEach((f) => {
      const fBrand = brandMap.get(f.brand_id);
      const brandName = fBrand?.name || 'Unknown';
      if (
        !q ||
        f.candidate.name.toLowerCase().includes(q) ||
        f.candidate.handle_or_package.toLowerCase().includes(q) ||
        f.summary_short.toLowerCase().includes(q) ||
        f.band.toLowerCase().includes(q) ||
        brandName.toLowerCase().includes(q) ||
        f.platform_or_store.toLowerCase().includes(q)
      ) {
        results.push({
          id: `finding-${f.id}`,
          title: `${f.candidate.name} (@${f.candidate.handle_or_package})`,
          subtitle: `[${brandName}] ${f.summary_short} · Risk Score: ${f.score}/100`,
          type: 'finding',
          brandName,
          badge: f.band === 'high' ? 'HIGH THREAT' : f.band === 'medium' ? 'MEDIUM' : 'REVIEW',
          badgeColor:
            f.band === 'high'
              ? 'text-[var(--high)]'
              : f.band === 'medium'
              ? 'text-[var(--med)]'
              : 'text-[var(--rev)]',
          action: () => {
            store.setActiveBrand(f.brand_id);
            navigate(`/brands/${f.brand_id}/findings?finding=${f.id}`);
          },
        });
      }
    });

    // Matching official assets across ALL brands
    allAssets.forEach((a) => {
      const aBrand = brandMap.get(a.brand_id);
      const brandName = aBrand?.name || 'Unknown';
      if (
        !q ||
        (a.handle && a.handle.toLowerCase().includes(q)) ||
        (a.package_id && a.package_id.toLowerCase().includes(q)) ||
        (a.display_name && a.display_name.toLowerCase().includes(q)) ||
        (a.app_name && a.app_name.toLowerCase().includes(q)) ||
        brandName.toLowerCase().includes(q)
      ) {
        results.push({
          id: `asset-${a.id}`,
          title: `Official Asset: ${a.display_name || a.handle || a.package_id}`,
          subtitle: `[${brandName}] ${a.platform || a.store} · ${a.verification_status.toUpperCase()}`,
          type: 'asset',
          brandName,
          badge: 'BASELINE',
          badgeColor: 'text-[var(--official)]',
          action: () => {
            store.setActiveBrand(a.brand_id);
            navigate(`/brands/${a.brand_id}/profile`);
          },
        });
      }
    });

    // Matching scan history records across ALL brands
    allScans.forEach((s) => {
      const sBrand = brandMap.get(s.brand_id);
      const brandName = sBrand?.name || 'Unknown';
      if (
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q) ||
        (s.requested_sources || []).some((src) => src.toLowerCase().includes(q)) ||
        brandName.toLowerCase().includes(q) ||
        q === 'scan' ||
        q === 'scans'
      ) {
        results.push({
          id: `scan-${s.id}`,
          title: `Scan Run #${s.id}`,
          subtitle: `[${brandName}] Status: ${s.status.toUpperCase()} · ${s.stats?.candidates_seen || 0} candidates evaluated`,
          type: 'scan',
          brandName,
          badge: s.status.toUpperCase(),
          badgeColor:
            s.status === 'completed'
              ? 'text-[var(--official)]'
              : s.status === 'partial'
              ? 'text-[var(--med)]'
              : s.status === 'failed'
              ? 'text-[var(--high)]'
              : 'text-[var(--cyan-accent)]',
          action: () => {
            store.setActiveBrand(s.brand_id);
            navigate(`/brands/${s.brand_id}/scans/${s.id}`);
          },
        });
      }
    });

    // Navigation shortcuts (if query is empty or matches)
    if (
      !q ||
      'detection quality evaluation lookalike inspector'.includes(q) ||
      q.includes('inspect') ||
      q.includes('eval') ||
      q.includes('qual')
    ) {
      results.push({
        id: 'nav-evaluation',
        title: 'Detection Quality & Live Look-Alike Inspector',
        subtitle: `Evaluate synthetic benchmark recall and live adversarial variants for ${brand.name}`,
        type: 'navigation',
        badge: 'PAGE',
        badgeColor: 'text-[var(--cyan-accent)]',
        action: () => navigate(`/brands/${brand.id}/evaluation`),
      });
    }

    if (!q || 'overview'.includes(q)) {
      results.push({
        id: 'nav-overview',
        title: 'Go to Command Center Overview',
        subtitle: `Perimeter status for active brand ${brand.name}`,
        type: 'navigation',
        badge: 'PAGE',
        badgeColor: 'text-[var(--cyan-accent)]',
        action: () => navigate(`/brands/${brand.id}`),
      });
    }

    if (!q || 'profile baseline lookalikes'.includes(q)) {
      results.push({
        id: 'nav-profile',
        title: 'Brand Profile & Official Baselines',
        subtitle: `Registered assets, domain link verification, and look-alike playground for ${brand.name}`,
        type: 'navigation',
        badge: 'PAGE',
        badgeColor: 'text-[var(--cyan-accent)]',
        action: () => navigate(`/brands/${brand.id}/profile`),
      });
    }

    return results.slice(0, 12);
  }, [query, brand, allBrands, allFindings, allAssets, allScans, brandMap, navigate]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        searchResults[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-[10px] bg-[#0A121A] border border-[var(--line-active)] shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="px-4 py-3.5 border-b border-[var(--line-strong)] flex items-center gap-3 bg-[#080E15]">
          <Search className="w-5 h-5 text-[var(--cyan-accent)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search candidate threats, domains, official baselines, or commands..."
            className="flex-1 bg-transparent border-none text-[14px] text-white placeholder-[var(--text-muted)] focus:outline-none font-sans"
          />
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-[4px] border border-[var(--line-strong)] text-[var(--text-muted)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {searchResults.length > 0 ? (
            searchResults.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-2.5 rounded-[6px] flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-[var(--cyan-glow)] border border-[var(--cyan-accent)]/50 text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-[4px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] flex items-center justify-center shrink-0">
                    {item.type === 'finding' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-[var(--high)]" />
                    ) : item.type === 'asset' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--official)]" />
                    ) : item.type === 'scan' ? (
                      <Clock className="w-3.5 h-3.5 text-[var(--med)]" />
                    ) : item.type === 'brand' ? (
                      <Shield className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                    ) : (
                      <Radio className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] font-mono-code text-[var(--text-muted)] truncate">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.badge && (
                    <span className={`text-[10px] font-mono-code font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                  {idx === selectedIndex && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-[13px] text-[var(--text-muted)] font-mono-code">
              No matching threats or assets found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[#060B10] border-t border-[var(--line-subtle)] flex items-center justify-between text-[11px] font-mono-code text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[10px]">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[10px]">
                ↵
              </kbd>{' '}
              Select
            </span>
            <span>
              <kbd className="px-1 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[10px]">
                ESC
              </kbd>{' '}
              Close
            </span>
          </div>
          <span className="text-[var(--cyan-accent)]">BrandGuard Command Center</span>
        </div>
      </div>
    </div>
  );
};
