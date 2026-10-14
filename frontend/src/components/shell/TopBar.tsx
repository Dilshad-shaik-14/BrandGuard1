import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  User,
  X,
  Shield,
  Radio,
  Check,
  Command,
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Layers,
  Filter,
  CornerDownLeft,
  Bell,
} from 'lucide-react';
import { Brand, Finding, OfficialAsset, ScanRun } from '../../types/brandguard';
import { getStoredReviewer, setStoredReviewer, store } from '../../services/store';
import { GlobalCommandPalette } from './GlobalCommandPalette';
import { NotificationDrawer } from './NotificationDrawer';

interface TopBarProps {
  activeBrand: Brand;
  brands?: Brand[];
  activeScan?: ScanRun;
  isSidebarCollapsed: boolean;
  onOpenGlobalSearch?: () => void;
  dataOrigin?: string;
}

type SearchFilterCategory = 'all' | 'findings' | 'assets' | 'scans' | 'brands';

export const TopBar: React.FC<TopBarProps> = ({
  activeBrand,
  brands = [],
  activeScan,
  isSidebarCollapsed,
  dataOrigin = 'Simulated data',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Reviewer state
  const [showReviewerModal, setShowReviewerModal] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [reviewerName, setReviewerName] = useState(getStoredReviewer());
  const [editReviewerInput, setEditReviewerInput] = useState(reviewerName);

  // Command palette & notification drawer modal state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Global search bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState<SearchFilterCategory>('all');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const isScanning = activeScan && activeScan.status === 'running';

  // Pull live state across ALL monitored brands
  const appState = store.getState();
  const allBrands = brands.length > 0 ? brands : appState.brands;
  const allFindings = appState.findings;
  const allAssets = appState.assets;
  const allScans = appState.scans;

  const brandMap = useMemo(() => {
    const map = new Map<string, Brand>();
    allBrands.forEach((b) => map.set(b.id, b));
    return map;
  }, [allBrands]);

  // Handle switching brand
  const handleSwitchBrand = (newBrandId: string) => {
    store.setActiveBrand(newBrandId);
    setShowBrandDropdown(false);
    const path = location.pathname;
    if (path.includes('/findings')) {
      navigate(`/brands/${newBrandId}/findings`);
    } else if (path.includes('/scans')) {
      navigate(`/brands/${newBrandId}/scans`);
    } else if (path.includes('/profile')) {
      navigate(`/brands/${newBrandId}/profile`);
    } else if (path.includes('/evaluation')) {
      navigate(`/brands/${newBrandId}/evaluation`);
    } else {
      navigate(`/brands/${newBrandId}`);
    }
  };

  // Keyboard shortcut listener for Cmd+K / Ctrl+K and /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter findings across all brands
  const matchedFindings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allFindings.slice(0, 5);
    return allFindings.filter((f) => {
      const fBrand = brandMap.get(f.brand_id);
      const brandName = fBrand?.name.toLowerCase() || '';
      const candidateName = f.candidate.name.toLowerCase();
      const handle = f.candidate.handle_or_package.toLowerCase();
      const summary = (f.summary_short || f.summary || '').toLowerCase();
      const platform = (f.platform_or_store || '').toLowerCase();
      const band = f.band.toLowerCase();
      const score = f.score.toString();
      const id = f.id.toLowerCase();
      return (
        candidateName.includes(q) ||
        handle.includes(q) ||
        summary.includes(q) ||
        platform.includes(q) ||
        band.includes(q) ||
        score.includes(q) ||
        id.includes(q) ||
        brandName.includes(q)
      );
    });
  }, [allFindings, searchQuery, brandMap]);

  // Filter official assets across all brands
  const matchedAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allAssets.slice(0, 4);
    return allAssets.filter((a) => {
      const aBrand = brandMap.get(a.brand_id);
      const brandName = aBrand?.name.toLowerCase() || '';
      const name = (a.display_name || a.app_name || '').toLowerCase();
      const handle = (a.handle || a.package_id || '').toLowerCase();
      const platform = (a.platform || a.store || '').toLowerCase();
      const dev = (a.developer_name || '').toLowerCase();
      const status = (a.verification_status || '').toLowerCase();
      return (
        name.includes(q) ||
        handle.includes(q) ||
        platform.includes(q) ||
        dev.includes(q) ||
        status.includes(q) ||
        brandName.includes(q)
      );
    });
  }, [allAssets, searchQuery, brandMap]);

  // Filter scan history across all brands
  const matchedScans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allScans.slice(0, 4);
    return allScans.filter((s) => {
      const sBrand = brandMap.get(s.brand_id);
      const brandName = sBrand?.name.toLowerCase() || '';
      const id = s.id.toLowerCase();
      const status = s.status.toLowerCase();
      const sources = (s.requested_sources || []).join(' ').toLowerCase();
      const date = (s.started_at || s.created_at || '').toLowerCase();
      return (
        id.includes(q) ||
        status.includes(q) ||
        sources.includes(q) ||
        brandName.includes(q) ||
        date.includes(q) ||
        q === 'scan' ||
        q === 'scans' ||
        q === 'history'
      );
    });
  }, [allScans, searchQuery, brandMap]);

  // Filter monitored brands
  const matchedBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allBrands;
    return allBrands.filter((b) => {
      const name = b.name.toLowerCase();
      const domain = (b.domain || '').toLowerCase();
      const aliases = (b.aliases || []).join(' ').toLowerCase();
      const desc = (b.description || '').toLowerCase();
      return (
        name.includes(q) ||
        domain.includes(q) ||
        aliases.includes(q) ||
        desc.includes(q)
      );
    });
  }, [allBrands, searchQuery]);

  // Flatten active items for keyboard navigation based on current category tab
  const flattenedResults = useMemo(() => {
    type FlatItem =
      | { type: 'finding'; item: Finding }
      | { type: 'asset'; item: OfficialAsset }
      | { type: 'scan'; item: ScanRun }
      | { type: 'brand'; item: Brand }
      | { type: 'nav'; label: string; desc: string; path: string };

    const list: FlatItem[] = [];
    const q = searchQuery.trim().toLowerCase();

    // Check if query matches Detection Quality or Look-Alike Inspector
    const matchesEval =
      !q ||
      'detection quality'.includes(q) ||
      'live look-alike inspector'.includes(q) ||
      'lookalike'.includes(q) ||
      'evaluation'.includes(q) ||
      'inspector'.includes(q) ||
      'benchmarks'.includes(q);

    if (matchesEval && (searchFilter === 'all' || searchFilter === 'brands')) {
      list.push({
        type: 'nav',
        label: 'Detection Quality & Live Look-Alike Inspector',
        desc: `Adversarial look-alike recall & live candidate tester for ${activeBrand.name}`,
        path: `/brands/${activeBrand.id}/evaluation`,
      });
    }

    if (searchFilter === 'all' || searchFilter === 'brands') {
      matchedBrands.slice(0, searchFilter === 'brands' ? 10 : 2).forEach((b) => list.push({ type: 'brand', item: b }));
    }
    if (searchFilter === 'all' || searchFilter === 'findings') {
      matchedFindings.slice(0, searchFilter === 'findings' ? 15 : 4).forEach((f) => list.push({ type: 'finding', item: f }));
    }
    if (searchFilter === 'all' || searchFilter === 'assets') {
      matchedAssets.slice(0, searchFilter === 'assets' ? 15 : 3).forEach((a) => list.push({ type: 'asset', item: a }));
    }
    if (searchFilter === 'all' || searchFilter === 'scans') {
      matchedScans.slice(0, searchFilter === 'scans' ? 15 : 3).forEach((s) => list.push({ type: 'scan', item: s }));
    }

    return list;
  }, [searchFilter, matchedFindings, matchedAssets, matchedScans, matchedBrands, searchQuery, activeBrand]);

  // Execute selection
  const handleSelectItem = (item: (typeof flattenedResults)[0]) => {
    if (item.type === 'finding') {
      store.setActiveBrand(item.item.brand_id);
      navigate(`/brands/${item.item.brand_id}/findings?finding=${item.item.id}`);
    } else if (item.type === 'asset') {
      store.setActiveBrand(item.item.brand_id);
      navigate(`/brands/${item.item.brand_id}/profile`);
    } else if (item.type === 'scan') {
      store.setActiveBrand(item.item.brand_id);
      navigate(`/brands/${item.item.brand_id}/scans/${item.item.id}`);
    } else if (item.type === 'brand') {
      store.setActiveBrand(item.item.id);
      navigate(`/brands/${item.item.id}`);
    } else if (item.type === 'nav') {
      navigate(item.path);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (!isSearchOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsSearchOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, flattenedResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + flattenedResults.length) % Math.max(1, flattenedResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flattenedResults[highlightedIndex];
      if (target) {
        handleSelectItem(target);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

  const handleSaveReviewer = (e: React.FormEvent) => {
    e.preventDefault();
    if (editReviewerInput.trim()) {
      setStoredReviewer(editReviewerInput.trim());
      setReviewerName(editReviewerInput.trim());
      setShowReviewerModal(false);
    }
  };

  const totalResultsCount =
    matchedFindings.length + matchedAssets.length + matchedScans.length + matchedBrands.length;

  return (
    <>
      <header
        className={`h-[60px] bg-[#080E15] border-b border-[var(--line-strong)] sticky top-0 z-20 flex flex-col justify-between transition-all duration-200 ${
          isSidebarCollapsed ? 'pl-[68px]' : 'pl-[250px]'
        }`}
      >
        <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Brand Context Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Interactive Brand Selector Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] bg-[#0A121A] border border-[var(--line-subtle)] hover:border-[var(--line-active)] transition-colors cursor-pointer"
                title="Click to switch brand"
              >
                <span className="w-2 h-2 rounded-full bg-[var(--official)] shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
                <span className="text-[12.5px] font-bold text-white truncate max-w-[90px] sm:max-w-[130px] md:max-w-none">
                  {activeBrand.name}
                </span>
                <span className="hidden xl:inline text-[10px] font-mono-code text-[var(--official)] px-1.5 py-0.2 rounded bg-[var(--official-bg)] font-bold">
                  PROTECTED
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${
                    showBrandDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Brand Dropdown Menu */}
              {showBrandDropdown && (
                <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-64 bg-[#0B141E] border border-[var(--line-active)] rounded-[8px] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.9)] space-y-1">
                  <div className="text-[10px] font-mono-code text-[var(--text-muted)] uppercase px-2 py-1">
                    Switch Protected Brand ({allBrands.length})
                  </div>
                  {allBrands.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleSwitchBrand(b.id)}
                      className={`w-full px-2.5 py-1.5 rounded-[5px] flex items-center justify-between text-[12px] transition-colors cursor-pointer ${
                        b.id === activeBrand.id
                          ? 'bg-[var(--cyan-glow)] text-white font-bold border border-[var(--cyan-accent)]/40'
                          : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface-elevated)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 rounded-[3px] bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                          <img src={b.logo_url} alt="" className="w-full h-full object-contain" />
                        </div>
                        <span className="truncate">{b.name}</span>
                      </div>
                      {b.id === activeBrand.id && (
                        <Check className="w-3.5 h-3.5 text-[var(--cyan-accent)] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Global Cross-Brand Search Bar */}
          <div className="flex-1 max-w-xl mx-1 sm:mx-2 relative" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[var(--cyan-accent)] absolute left-3 pointer-events-none shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  setHighlightedIndex(0);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search findings, assets, scans across all brands..."
                className="w-full h-9 pl-9 pr-16 bg-[#0A121A] border border-[var(--line-strong)] hover:border-[var(--line-active)] focus:border-[var(--cyan-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--cyan-accent)]/30 rounded-[6px] text-white text-[12.5px] font-sans placeholder-[var(--text-muted)] transition-all"
              />

              <div className="absolute right-2.5 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="w-5 h-5 rounded hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[10px] font-mono-code text-[var(--text-muted)]">
                  <Command className="w-2.5 h-2.5" /> K
                </kbd>
              </div>
            </div>

            {/* Global Search Results Dropdown Panel */}
            {isSearchOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-[#0A121A] border border-[var(--line-active)] rounded-[8px] shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[480px]">
                {/* Category Filter Pills Header */}
                <div className="px-3 py-2 bg-[#080E15] border-b border-[var(--line-strong)] flex items-center justify-between gap-2 overflow-x-auto">
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: 'all', label: 'All', count: totalResultsCount },
                        { id: 'findings', label: 'Findings', count: matchedFindings.length },
                        { id: 'assets', label: 'Assets', count: matchedAssets.length },
                        { id: 'scans', label: 'Scans', count: matchedScans.length },
                        { id: 'brands', label: 'Brands', count: matchedBrands.length },
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSearchFilter(cat.id);
                          setHighlightedIndex(0);
                        }}
                        className={`px-2 py-1 rounded-[4px] text-[11px] font-mono-code transition-colors flex items-center gap-1 shrink-0 ${
                          searchFilter === cat.id
                            ? 'bg-[var(--cyan-glow)] text-[var(--cyan-accent)] border border-[var(--cyan-accent)]/50 font-bold'
                            : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface-elevated)]'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className="text-[10px] opacity-75">({cat.count})</span>
                      </button>
                    ))}
                  </div>

                  <span className="text-[10.5px] font-mono-code text-[var(--text-dim)] hidden sm:inline shrink-0">
                    Cross-Brand Intelligence
                  </span>
                </div>

                {/* Suggestions bar when query is empty */}
                {!searchQuery && (
                  <div className="p-3 bg-[#080E15]/50 border-b border-[var(--line-subtle)] space-y-1.5">
                    <span className="text-[10.5px] font-mono-code text-[var(--text-muted)] uppercase block">
                      Suggested Quick Filters:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Homoglyph',
                        'Telegram',
                        'APK',
                        'Offers',
                        'Veltrix',
                        'Marigold',
                        'High Risk',
                        'Failed scans',
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setSearchQuery(chip);
                            setHighlightedIndex(0);
                          }}
                          className="px-2 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[11px] font-mono-code text-[var(--text-secondary)] hover:text-white hover:border-[var(--line-active)] transition-all"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results List */}
                <div className="overflow-y-auto p-1.5 space-y-1 max-h-[340px]">
                  {flattenedResults.length > 0 ? (
                    flattenedResults.map((entry, idx) => {
                      const isHighlighted = idx === highlightedIndex;

                      if (entry.type === 'finding') {
                        const f = entry.item;
                        const fBrand = brandMap.get(f.brand_id);
                        return (
                          <div
                            key={`f-${f.id}`}
                            onClick={() => handleSelectItem(entry)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`p-2.5 rounded-[6px] flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isHighlighted
                                ? 'bg-[var(--cyan-glow)] border border-[var(--cyan-accent)]/50 text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-[4px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] flex items-center justify-center shrink-0">
                                <ShieldAlert
                                  className={`w-3.5 h-3.5 ${
                                    f.band === 'high'
                                      ? 'text-[var(--high)]'
                                      : f.band === 'medium'
                                      ? 'text-[var(--med)]'
                                      : 'text-[var(--rev)]'
                                  }`}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12.5px] font-semibold text-white truncate flex items-center gap-1.5">
                                  <span>{f.candidate.name}</span>
                                  <span className="text-[11px] font-mono-code text-[var(--text-muted)] font-normal">
                                    @{f.candidate.handle_or_package}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono-code text-[var(--text-muted)] truncate flex items-center gap-1.5">
                                  <span className="text-[var(--cyan-accent)] font-semibold">
                                    [{fBrand?.name || 'Brand'}]
                                  </span>
                                  <span>{f.summary_short || f.summary}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded ${
                                  f.band === 'high'
                                    ? 'bg-[var(--high-bg)] text-[var(--high)]'
                                    : f.band === 'medium'
                                    ? 'bg-[var(--med-bg)] text-[var(--med)]'
                                    : 'bg-[var(--rev-bg)] text-[var(--rev)]'
                                }`}
                              >
                                {f.band.toUpperCase()} ({f.score})
                              </span>
                              {isHighlighted && (
                                <CornerDownLeft className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (entry.type === 'asset') {
                        const a = entry.item;
                        const aBrand = brandMap.get(a.brand_id);
                        return (
                          <div
                            key={`a-${a.id}`}
                            onClick={() => handleSelectItem(entry)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`p-2.5 rounded-[6px] flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isHighlighted
                                ? 'bg-[var(--cyan-glow)] border border-[var(--cyan-accent)]/50 text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-[4px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-3.5 h-3.5 text-[var(--official)]" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12.5px] font-semibold text-white truncate flex items-center gap-1.5">
                                  <span>{a.display_name || a.app_name || a.handle}</span>
                                  <span className="text-[11px] font-mono-code text-[var(--text-muted)] font-normal">
                                    ({a.platform || a.store})
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono-code text-[var(--text-muted)] truncate flex items-center gap-1.5">
                                  <span className="text-[var(--official)] font-semibold">
                                    [{aBrand?.name || 'Brand'}]
                                  </span>
                                  <span>{a.handle || a.package_id || 'Registered baseline'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono-code text-[var(--official)] bg-[var(--official-bg)] px-1.5 py-0.5 rounded font-bold">
                                {a.verification_status.toUpperCase()}
                              </span>
                              {isHighlighted && (
                                <CornerDownLeft className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (entry.type === 'scan') {
                        const s = entry.item;
                        const sBrand = brandMap.get(s.brand_id);
                        return (
                          <div
                            key={`s-${s.id}`}
                            onClick={() => handleSelectItem(entry)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`p-2.5 rounded-[6px] flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isHighlighted
                                ? 'bg-[var(--cyan-glow)] border border-[var(--cyan-accent)]/50 text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-[4px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] flex items-center justify-center shrink-0">
                                <Clock className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12.5px] font-semibold text-white truncate flex items-center gap-1.5">
                                  <span>Scan Run #{s.id}</span>
                                  <span className="text-[11px] font-mono-code text-[var(--text-muted)] font-normal">
                                    ({s.requested_sources?.length || 0} channels)
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono-code text-[var(--text-muted)] truncate flex items-center gap-1.5">
                                  <span className="text-[var(--cyan-accent)] font-semibold">
                                    [{sBrand?.name || 'Brand'}]
                                  </span>
                                  <span>
                                    {s.stats?.candidates_seen || 0} candidates evaluated · Status: {s.status}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded ${
                                  s.status === 'completed'
                                    ? 'bg-[var(--official-bg)] text-[var(--official)]'
                                    : s.status === 'partial'
                                    ? 'bg-[var(--med-bg)] text-[var(--med)]'
                                    : s.status === 'failed'
                                    ? 'bg-[var(--high-bg)] text-[var(--high)]'
                                    : 'bg-[var(--cyan-glow)] text-[var(--cyan-accent)]'
                                }`}
                              >
                                {s.status.toUpperCase()}
                              </span>
                              {isHighlighted && (
                                <CornerDownLeft className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (entry.type === 'brand') {
                        const b = entry.item;
                        return (
                          <div
                            key={`b-${b.id}`}
                            onClick={() => handleSelectItem(entry)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`p-2.5 rounded-[6px] flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isHighlighted
                                ? 'bg-[var(--cyan-glow)] border border-[var(--cyan-accent)]/50 text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-[4px] bg-white p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                                <img src={b.logo_url} alt="" className="w-full h-full object-contain" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12.5px] font-semibold text-white truncate flex items-center gap-1.5">
                                  <span>{b.name}</span>
                                  <span className="text-[11px] font-mono-code text-[var(--text-muted)] font-normal">
                                    {b.domain || 'Domain protected'}
                                  </span>
                                </div>
                                <div className="text-[11px] font-mono-code text-[var(--text-muted)] truncate">
                                  {b.description}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono-code text-[var(--cyan-accent)] bg-[var(--cyan-glow)] px-1.5 py-0.5 rounded font-bold">
                                BRAND CONSOLE
                              </span>
                              {isHighlighted && (
                                <CornerDownLeft className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                              )}
                            </div>
                          </div>
                        );
                      }

                      if (entry.type === 'nav') {
                        return (
                          <div
                            key={`nav-${entry.path}`}
                            onClick={() => handleSelectItem(entry)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`p-2.5 rounded-[6px] flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isHighlighted
                                ? 'bg-[var(--cyan-glow)] border border-[var(--cyan-accent)]/50 text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-[4px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] flex items-center justify-center shrink-0">
                                <Sparkles className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[12.5px] font-semibold text-white truncate flex items-center gap-1.5">
                                  <span>{entry.label}</span>
                                </div>
                                <div className="text-[11px] font-mono-code text-[var(--text-muted)] truncate">
                                  {entry.desc}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-mono-code text-[var(--cyan-accent)] bg-[var(--cyan-glow)] px-1.5 py-0.5 rounded font-bold">
                                FEATURE
                              </span>
                              {isHighlighted && (
                                <CornerDownLeft className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                              )}
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })
                  ) : (
                    <div className="py-8 text-center text-[12.5px] text-[var(--text-muted)] font-mono-code space-y-1">
                      <p>No records found matching "{searchQuery}".</p>
                      <p className="text-[11px] text-[var(--text-dim)]">
                        Try searching by brand name, threat handle, package name, or scan ID.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer keyboard navigation helper */}
                <div className="px-3 py-1.5 bg-[#060B10] border-t border-[var(--line-subtle)] flex items-center justify-between text-[11px] font-mono-code text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <span>
                      <kbd className="px-1 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[10px]">
                        ↑↓
                      </kbd>{' '}
                      navigate
                    </span>
                    <span>
                      <kbd className="px-1 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[10px]">
                        ↵
                      </kbd>{' '}
                      jump to record
                    </span>
                    <span>
                      <kbd className="px-1 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[10px]">
                        esc
                      </kbd>{' '}
                      close
                    </span>
                  </div>
                  <span className="text-[var(--cyan-accent)]">Global Brand Defense</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Utility Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Active scan indicator */}
            {isScanning ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-[5px] bg-[var(--cyan-glow)] border border-[var(--cyan-accent)]/50 text-[11px] font-mono-code text-[var(--cyan-accent)] animate-pulse">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden md:inline font-bold">SCANNING...</span>
              </div>
            ) : (
              <div
                title="Records origin: synthetic and verified datasets."
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] border border-[var(--line-strong)] text-[11px] font-mono-code text-[var(--text-muted)] bg-[#0A121A]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--med)]" aria-hidden="true" />
                <span>{dataOrigin.toUpperCase()}</span>
              </div>
            )}

            {/* Run Scan Primary Action */}
            <button
              onClick={() => navigate(`/brands/${activeBrand.id}/scans`)}
              className="h-8 sm:h-8.5 px-2.5 sm:px-3.5 rounded-[5px] bg-gradient-to-r from-[#06b6d4] to-[#10b981] hover:brightness-110 text-[#041217] text-[12px] sm:text-[12.5px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_14px_rgba(6,182,212,0.35)] cursor-pointer shrink-0"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Run scan</span>
            </button>

            {/* Analyst Identity Button */}
            <button
              onClick={() => setShowReviewerModal(true)}
              className="h-8 sm:h-8.5 px-2 sm:px-2.5 rounded-[5px] border border-[var(--line-strong)] hover:border-[var(--line-active)] bg-[#0A121A] text-[12px] text-[var(--text-secondary)] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Change active analyst reviewer identity"
            >
              <User className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
              <span className="hidden xl:inline text-[var(--text-muted)]">Analyst:</span>
              <span className="font-semibold text-white font-mono-code truncate max-w-[70px] sm:max-w-[90px]">
                {reviewerName}
              </span>
            </button>
          </div>
        </div>

        {/* Global Progress Indicator during Scan */}
        {isScanning && (
          <div className="h-[2px] w-full bg-[var(--bg-surface-inset)] overflow-hidden">
            <div className="h-full cyber-scanner-line w-full" />
          </div>
        )}
      </header>

      {/* Global Command Palette Modal (Cmd+K alternative modal) */}
      <GlobalCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        brand={activeBrand}
      />

      {/* Analyst Identity Modal */}
      {showReviewerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[10px] bg-[#0B141E] border border-[var(--line-strong)] p-5 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--cyan-accent)]" />
                <h3 className="font-semibold text-white text-[14px]">Analyst Identity</h3>
              </div>
              <button
                onClick={() => setShowReviewerModal(false)}
                className="w-6 h-6 rounded border border-[var(--line-strong)] text-[var(--text-muted)] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
              This name is stamped on all audit logs, decision records, and exclusion rule updates.
            </p>

            <form onSubmit={handleSaveReviewer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Analyst Handle / Name
                </label>
                <input
                  type="text"
                  value={editReviewerInput}
                  onChange={(e) => setEditReviewerInput(e.target.value)}
                  placeholder="e.g., Dilshad / SOC-Lead"
                  className="w-full px-3 py-2 rounded-[5px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-white text-[13px] font-mono-code focus:outline-none focus:border-[var(--line-active)]"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewerModal(false)}
                  className="px-3 py-1.5 rounded-[4px] border border-[var(--line-strong)] text-[12px] text-[var(--text-secondary)] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-[4px] bg-[var(--cyan-accent)] hover:brightness-110 text-[#041217] text-[12px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Identity</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
