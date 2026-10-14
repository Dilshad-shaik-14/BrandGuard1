import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Copy,
  Check,
  X,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  Layers,
  FileText,
  Sliders,
  History,
  AlertCircle,
  EyeOff,
  Flame,
  MessageSquare,
  CheckCheck,
} from 'lucide-react';
import { Brand, Finding, Exclusion, ReviewStatus, RiskBand } from '../../types/brandguard';
import { RiskGlyph } from '../../components/risk/RiskGlyph';
import { BandLabel } from '../../components/risk/BandLabel';
import { ScoreRuler } from '../../components/risk/ScoreRuler';
import { CoverageMeter } from '../../components/risk/CoverageMeter';
import { GateNote } from '../../components/risk/GateNote';
import { ImageWipe } from '../../components/evidence/ImageWipe';
import { ComparisonTable } from '../../components/evidence/ComparisonTable';
import { SignalList } from '../../components/evidence/SignalList';
import { AssetComparisonStudio } from '../../components/evidence/AssetComparisonStudio';
import { InteractiveRiskAnalysis } from '../../components/risk/InteractiveRiskAnalysis';
import { InvestigationTimeline } from '../../components/evidence/InvestigationTimeline';
import { formatRelativeTime, formatDateTime } from '../../lib/format';
import { BANDS, REVIEW_STATUSES } from '../../lib/labels';
import { store } from '../../services/store';

interface FindingsScreenProps {
  brand: Brand;
  findings: Finding[];
  exclusions: Exclusion[];
}

export const FindingsScreen: React.FC<FindingsScreenProps> = ({
  brand,
  findings: allFindings,
  exclusions,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter state derived from URL
  const searchQuery = searchParams.get('q') || '';
  const selectedType = searchParams.get('type') || 'all';
  const selectedBands = useMemo(() => {
    const raw = searchParams.getAll('band');
    return raw.length > 0 ? (raw as RiskBand[]) : (['high', 'medium', 'needs_review'] as RiskBand[]);
  }, [searchParams]);
  const includeIgnored = searchParams.get('include_ignored') === 'true';
  const selectedStatus = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sort') || 'risk';
  const selectedFindingId = searchParams.get('finding') || '';

  // UI state
  const [activeTab, setActiveTab] = useState<'signals' | 'comparison' | 'context' | 'audit'>('signals');
  const [copiedId, setCopiedId] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [showExclusionsModal, setShowExclusionsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bulk Multi-Selection State
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(new Set());
  const [bulkAuditNote, setBulkAuditNote] = useState('');
  const [showBulkNoteInput, setShowBulkNoteInput] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // Filter & sort
  const filteredFindings = useMemo(() => {
    return allFindings.filter((f) => {
      if (f.band === 'ignored') {
        if (!includeIgnored) return false;
      } else if (selectedBands.length > 0 && !selectedBands.includes(f.band)) {
        return false;
      }
      if (selectedType === 'social' && f.kind !== 'social') return false;
      if (selectedType === 'app' && f.kind !== 'app') return false;
      if (selectedStatus !== 'all' && f.review_status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = f.candidate.name.toLowerCase().includes(q);
        const matchHandle = f.candidate.handle_or_package.toLowerCase().includes(q);
        const matchSummary = f.summary_short.toLowerCase().includes(q);
        if (!matchName && !matchHandle && !matchSummary) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'risk') {
        const rank = { high: 4, medium: 3, needs_review: 2, ignored: 1 };
        if (rank[b.band] !== rank[a.band]) return rank[b.band] - rank[a.band];
        return b.score - a.score;
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'name') {
        return a.candidate.name.localeCompare(b.candidate.name);
      }
      return 0;
    });
  }, [allFindings, searchQuery, selectedType, selectedBands, includeIgnored, selectedStatus, sortBy]);

  // Selected finding
  const activeFinding = useMemo(() => {
    if (selectedFindingId) {
      const found = allFindings.find((f) => f.id === selectedFindingId);
      if (found) return found;
    }
    return filteredFindings[0] || null;
  }, [selectedFindingId, allFindings, filteredFindings]);

  useEffect(() => {
    if (!selectedFindingId && activeFinding) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('finding', activeFinding.id);
      setSearchParams(newParams, { replace: true });
    }
  }, [activeFinding, selectedFindingId]);

  useEffect(() => {
    setReviewError('');
    setReviewNote('');
  }, [activeFinding?.id]);

  // Sync indeterminate state on the select-all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const isAll = filteredFindings.length > 0 && selectedFindingIds.size === filteredFindings.length;
      const isSome = selectedFindingIds.size > 0 && !isAll;
      selectAllCheckboxRef.current.indeterminate = isSome;
    }
  }, [selectedFindingIds, filteredFindings]);

  // Bulk Selection Handlers
  const toggleSelectFinding = (id: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedFindingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedFindingIds.size === filteredFindings.length) {
      setSelectedFindingIds(new Set());
    } else {
      setSelectedFindingIds(new Set(filteredFindings.map((f) => f.id)));
    }
  };

  const selectByBand = (band: RiskBand) => {
    const matchingIds = filteredFindings.filter((f) => f.band === band).map((f) => f.id);
    setSelectedFindingIds(new Set(matchingIds));
  };

  const clearSelection = () => {
    setSelectedFindingIds(new Set());
    setShowBulkNoteInput(false);
    setBulkAuditNote('');
  };

  const handleBulkMarkAsIgnored = () => {
    const ids = Array.from(selectedFindingIds);
    if (ids.length === 0) return;
    const res = store.bulkMarkFindingsAsIgnored(ids, bulkAuditNote);
    if (res.success) {
      showToast(`Marked ${res.count} alerts as Ignored`);
      clearSelection();
    }
  };

  const handleBulkEscalateToHigh = () => {
    const ids = Array.from(selectedFindingIds);
    if (ids.length === 0) return;
    const res = store.bulkEscalateFindingsToHigh(ids, bulkAuditNote);
    if (res.success) {
      showToast(`Escalated ${res.count} alerts to High Risk Priority`);
      clearSelection();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        if (e.key === 'Escape') target.blur();
        return;
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const idx = filteredFindings.findIndex((f) => f.id === activeFinding?.id);
        if (idx >= 0 && idx < filteredFindings.length - 1) {
          selectFinding(filteredFindings[idx + 1]!.id);
        }
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const idx = filteredFindings.findIndex((f) => f.id === activeFinding?.id);
        if (idx > 0) {
          selectFinding(filteredFindings[idx - 1]!.id);
        }
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        if (activeFinding) {
          toggleSelectFinding(activeFinding.id);
        }
      } else if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        handleToggleSelectAll();
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        if (activeFinding && activeFinding.review_status !== 'under_review') {
          handleReviewAction('under_review');
        }
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        noteTextareaRef.current?.focus();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        noteTextareaRef.current?.focus();
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(true);
      } else if (e.key === 'Escape') {
        if (selectedFindingIds.size > 0) {
          e.preventDefault();
          clearSelection();
          return;
        }
        setShowExclusionsModal(false);
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredFindings, activeFinding, selectedFindingIds]);

  const selectFinding = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('finding', id);
    setSearchParams(newParams);
  };

  const toggleBandFilter = (band: RiskBand) => {
    const newParams = new URLSearchParams(searchParams);
    let current = newParams.getAll('band') as RiskBand[];
    if (current.length === 0) current = ['high', 'medium', 'needs_review'];

    if (current.includes(band)) {
      if (current.length > 1) current = current.filter((b) => b !== band);
    } else {
      current.push(band);
    }

    newParams.delete('band');
    for (const b of current) newParams.append('band', b);
    setSearchParams(newParams);
  };

  const handleReviewAction = (status: ReviewStatus) => {
    if (!activeFinding) return;

    if ((status === 'confirmed' || status === 'false_positive') && !reviewNote.trim()) {
      setReviewError('Add a note before confirming. It becomes part of the permanent audit trail.');
      noteTextareaRef.current?.focus();
      return;
    }

    const res = store.updateFindingReview(activeFinding.id, status, reviewNote, activeFinding.version ?? 1);
    if (!res.success) {
      setReviewError(res.error || 'Failed to update review status.');
      return;
    }

    setReviewNote('');
    setReviewError('');
    showToast(`Marked finding as ${REVIEW_STATUSES[status].label.toLowerCase()}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const currentStatus = activeFinding?.review_status || 'new';
  const canStartReview = currentStatus !== 'under_review';
  const canConfirm = currentStatus !== 'confirmed';
  const canMarkFalsePositive = currentStatus !== 'false_positive';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-stretch-title text-[22px] font-bold text-white tracking-tight">
              Threat Investigation Workspace
            </h1>
            <span className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[11px] font-mono-code text-[var(--cyan-accent)]">
              {filteredFindings.length} CANDIDATES
            </span>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            Compare suspected impersonators against verified baselines. Set aside{' '}
            <strong className="text-white font-mono-code tabular-nums font-semibold">5</strong> official assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExclusionsModal(true)}
            className="h-8 px-3 rounded-[5px] border border-[var(--line-strong)] hover:border-[var(--line-active)] bg-[var(--bg-surface)] text-[12px] font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--official)]" />
            <span>Official assets excluded (5)</span>
          </button>
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="h-8 w-8 rounded-[5px] border border-[var(--line-strong)] hover:border-[var(--line-active)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Single Sheet: Toolbar + Split View */}
      <div className="rounded-[8px] border border-[var(--line-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-xl flex flex-col">
        {/* Workspace Toolbar */}
        <div className="p-3 border-b border-[var(--line-subtle)] bg-[var(--bg-surface-inset)] flex flex-wrap items-center justify-between gap-3">
          {/* Left tools: Search, Type filter, Risk toggle chips */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const newParams = new URLSearchParams(searchParams);
                  if (e.target.value) newParams.set('q', e.target.value);
                  else newParams.delete('q');
                  setSearchParams(newParams);
                }}
                placeholder="Search candidates... (/)"
                className="w-full h-8 pl-8 pr-2.5 rounded-[5px] border border-[var(--line-strong)] text-[12px] bg-[var(--bg-surface)] text-white focus:outline-none focus:border-[var(--line-active)]"
              />
            </div>

            {/* Type Segmented Control */}
            <div className="flex items-center gap-0.5 p-0.5 bg-[var(--bg-surface)] rounded-[5px] border border-[var(--line-strong)]">
              {(['all', 'social', 'app'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    if (t === 'all') newParams.delete('type');
                    else newParams.set('type', t);
                    setSearchParams(newParams);
                  }}
                  className={`px-2.5 py-1 text-[11.5px] font-medium rounded-[3px] transition-colors cursor-pointer ${
                    selectedType === t
                      ? 'bg-[var(--cyan-accent)] text-[#041217] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'social' ? 'Social' : 'Apps'}
                </button>
              ))}
            </div>

            {/* Severity Toggle Chips */}
            <div className="flex items-center gap-1.5">
              {(['high', 'medium', 'needs_review'] as const).map((b) => {
                const isSelected = selectedBands.includes(b);
                const count = allFindings.filter((f) => f.band === b).length;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBandFilter(b)}
                    aria-pressed={isSelected}
                    className={`h-7 px-2.5 rounded-[4px] text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border border-[var(--line-active)] bg-[var(--bg-surface-elevated)] text-white font-semibold'
                        : 'border border-[var(--line-strong)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    <RiskGlyph band={b} />
                    <span>{BANDS[b].label}</span>
                    <span className="font-mono-code tabular-nums text-[10.5px] text-[var(--text-secondary)]">
                      {count}
                    </span>
                  </button>
                );
              })}

              {/* Ignored Band Toggle Chip */}
              <button
                type="button"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  if (includeIgnored) {
                    newParams.delete('include_ignored');
                  } else {
                    newParams.set('include_ignored', 'true');
                  }
                  setSearchParams(newParams);
                }}
                aria-pressed={includeIgnored}
                className={`h-7 px-2.5 rounded-[4px] text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  includeIgnored
                    ? 'border border-[var(--line-active)] bg-[var(--bg-surface-elevated)] text-[var(--cyan-accent)] font-semibold'
                    : 'border border-[var(--line-strong)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white'
                }`}
                title="Toggle display of ignored security alerts"
              >
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Ignored</span>
                <span className="font-mono-code tabular-nums text-[10.5px] text-[var(--text-secondary)]">
                  {allFindings.filter((f) => f.band === 'ignored').length}
                </span>
              </button>
            </div>
          </div>

          {/* Right tools: Status & Sort */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value === 'all') newParams.delete('status');
                else newParams.set('status', e.target.value);
                setSearchParams(newParams);
              }}
              className="h-8 px-2.5 rounded-[5px] border border-[var(--line-strong)] text-[12px] bg-[var(--bg-surface)] text-white focus:outline-none focus:border-[var(--line-active)]"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="under_review">Under review</option>
              <option value="confirmed">Confirmed</option>
              <option value="false_positive">False positive</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set('sort', e.target.value);
                setSearchParams(newParams);
              }}
              className="h-8 px-2.5 rounded-[5px] border border-[var(--line-strong)] text-[12px] bg-[var(--bg-surface)] text-white focus:outline-none focus:border-[var(--line-active)]"
            >
              <option value="risk">Highest Risk</option>
              <option value="newest">Newest First</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Split View: Left List (54%) + Right Investigation Bench (46%) */}
        <div className="flex flex-col lg:flex-row min-h-[660px]">
          {/* Left Table / Candidate List */}
          <div className="lg:w-[54%] border-b lg:border-b-0 lg:border-r border-[var(--line-subtle)] overflow-x-auto flex flex-col justify-between relative">
            {/* Bulk Action Bar (Docked Top) */}
            {selectedFindingIds.size > 0 && (
              <div className="bg-[#091522] border-b border-[var(--cyan-accent)]/50 p-2.5 sm:px-3 flex flex-wrap items-center justify-between gap-2.5 sticky top-0 z-20 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-[var(--cyan-accent)] animate-pulse" />
                  <span className="text-[12px] font-mono-code font-bold text-white">
                    <span className="text-[var(--cyan-accent)] font-extrabold">{selectedFindingIds.size}</span> of{' '}
                    <span className="text-[var(--text-secondary)]">{filteredFindings.length}</span> alerts selected
                  </span>

                  {/* Quick Select Buttons */}
                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono-code border-l border-[var(--line-strong)] pl-2 ml-1">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="px-1.5 py-0.5 rounded text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
                    >
                      {selectedFindingIds.size === filteredFindings.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {filteredFindings.some((f) => f.band === 'medium') && (
                      <button
                        type="button"
                        onClick={() => selectByBand('medium')}
                        className="px-1.5 py-0.5 rounded text-[var(--med)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
                      >
                        Medium ({filteredFindings.filter((f) => f.band === 'medium').length})
                      </button>
                    )}
                    {filteredFindings.some((f) => f.band === 'needs_review') && (
                      <button
                        type="button"
                        onClick={() => selectByBand('needs_review')}
                        className="px-1.5 py-0.5 rounded text-[var(--rev)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
                      >
                        Review ({filteredFindings.filter((f) => f.band === 'needs_review').length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Optional Audit Reason Note Input */}
                  {showBulkNoteInput ? (
                    <div className="flex items-center gap-1 bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] rounded-[4px] px-2 py-0.5">
                      <input
                        type="text"
                        value={bulkAuditNote}
                        onChange={(e) => setBulkAuditNote(e.target.value)}
                        placeholder="Audit reason (optional)..."
                        className="w-36 sm:w-48 h-6 text-[11px] font-mono-code bg-transparent text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowBulkNoteInput(false)}
                        className="text-[var(--text-muted)] hover:text-white text-[10px]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowBulkNoteInput(true)}
                      className="h-7 px-2 rounded-[4px] border border-[var(--line-strong)] hover:border-[var(--line-active)] text-[11px] font-mono-code text-[var(--text-secondary)] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                      title="Add audit reason note for this batch"
                    >
                      <MessageSquare className="w-3 h-3 text-[var(--cyan-accent)]" />
                      <span className="hidden md:inline">Note</span>
                    </button>
                  )}

                  {/* Bulk 'Mark as Ignored' Button */}
                  <button
                    type="button"
                    onClick={handleBulkMarkAsIgnored}
                    className="h-7.5 px-3 rounded-[5px] bg-[#142334] hover:bg-[#1d334d] text-slate-200 hover:text-white border border-[var(--line-strong)] hover:border-[var(--line-active)] text-[11.5px] font-bold font-mono-code flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    title={`Bulk set ${selectedFindingIds.size} alerts to Ignored`}
                  >
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mark as Ignored</span>
                    <span className="px-1 py-0.2 rounded bg-black/40 text-[10px] text-slate-300 font-bold">
                      {selectedFindingIds.size}
                    </span>
                  </button>

                  {/* Bulk 'Escalate to High' Button */}
                  <button
                    type="button"
                    onClick={handleBulkEscalateToHigh}
                    className="h-7.5 px-3.5 rounded-[5px] bg-[#ef4444] hover:bg-[#dc2626] text-white border border-red-400 text-[11.5px] font-bold font-mono-code flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(239,68,68,0.45)] cursor-pointer"
                    title={`Bulk escalate ${selectedFindingIds.size} alerts to High Risk Priority`}
                  >
                    <Flame className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Escalate to High</span>
                    <span className="px-1 py-0.2 rounded bg-black/30 text-[10px] text-white font-bold">
                      {selectedFindingIds.size}
                    </span>
                  </button>

                  {/* Clear Selection */}
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="w-7 h-7 rounded-[4px] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Clear selection (Esc)"
                    aria-label="Clear selection"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {filteredFindings.length === 0 ? (
              <div className="p-12 text-center text-[var(--text-secondary)] space-y-3">
                <AlertCircle className="w-8 h-8 text-[var(--cyan-accent)] mx-auto" />
                <p className="text-[14px] font-medium text-white">No candidates match active filter parameters.</p>
                <p className="text-[12.5px] text-[var(--text-muted)]">
                  Total findings available: {allFindings.length}. Clear search or band filters to inspect all.
                </p>
                <button
                  onClick={() => setSearchParams({})}
                  className="h-8 px-3 rounded-[5px] border border-[var(--line-strong)] text-[12px] font-medium text-white hover:border-[var(--line-active)]"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface-inset)] border-b border-[var(--line-subtle)] text-[11.5px] font-mono-code uppercase text-[var(--text-muted)] sticky top-0 z-10">
                    <th className="py-2.5 px-3 font-medium w-8 text-center">
                      <input
                        type="checkbox"
                        ref={selectAllCheckboxRef}
                        checked={filteredFindings.length > 0 && selectedFindingIds.size === filteredFindings.length}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[var(--cyan-accent)] accent-[var(--cyan-accent)] focus:ring-1 focus:ring-[var(--cyan-accent)] cursor-pointer align-middle"
                        title={selectedFindingIds.size === filteredFindings.length ? 'Deselect all' : 'Select all'}
                        aria-label="Select all alerts"
                      />
                    </th>
                    <th className="py-2.5 px-2 font-medium w-10"></th>
                    <th className="py-2.5 px-3 font-medium w-1/3">Target Candidate</th>
                    <th className="py-2.5 px-3 font-medium">Primary Indicators</th>
                    <th className="py-2.5 px-3 font-medium w-28">Risk</th>
                    <th className="py-2.5 px-3 font-medium w-24">Status</th>
                    <th className="py-2.5 px-3 font-medium w-20 text-right">Discovered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line-subtle)]">
                  {filteredFindings.map((finding) => {
                    const isSelected = activeFinding?.id === finding.id;
                    const isRowChecked = selectedFindingIds.has(finding.id);

                    return (
                      <tr
                        key={finding.id}
                        onClick={() => selectFinding(finding.id)}
                        className={`h-[56px] transition-all cursor-pointer ${
                          isRowChecked
                            ? 'bg-[rgba(6,182,212,0.08)] ring-1 ring-inset ring-[var(--cyan-accent)]/50'
                            : isSelected
                            ? 'bg-[var(--bg-surface-elevated)] ring-1 ring-inset ring-[var(--cyan-accent)]'
                            : 'hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-2 px-3 align-middle text-center w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isRowChecked}
                            onChange={(e) => toggleSelectFinding(finding.id, e)}
                            className="w-4 h-4 rounded border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[var(--cyan-accent)] accent-[var(--cyan-accent)] focus:ring-1 focus:ring-[var(--cyan-accent)] cursor-pointer align-middle"
                            aria-label={`Select ${finding.candidate.name}`}
                          />
                        </td>

                        {/* Logo Thumbnail */}
                        <td className="py-2 px-2 align-middle w-10">
                          <div className="w-8 h-8 rounded-[4px] border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] overflow-hidden shrink-0 flex items-center justify-center">
                            {finding.candidate.logo_url ? (
                              <img
                                src={finding.candidate.logo_url}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-[9px] text-[var(--text-muted)]">No logo</span>
                            )}
                          </div>
                        </td>

                        {/* Name & Platform/Handle */}
                        <td className="py-2 px-3 align-middle max-w-[190px]">
                          <div
                            className="font-semibold text-[13px] text-white truncate"
                            title={finding.candidate.name}
                          >
                            <bdi>{finding.candidate.name}</bdi>
                          </div>
                          <div
                            className="text-[11px] font-mono-code text-[var(--text-muted)] truncate"
                            title={finding.candidate.handle_or_package}
                          >
                            {finding.candidate.platform_or_store} / {finding.candidate.handle_or_package}
                          </div>
                        </td>

                        {/* Summary / Indicators */}
                        <td className="py-2 px-3 align-middle">
                          <p
                            className="text-[11.5px] text-[var(--text-secondary)] line-clamp-2 max-w-[220px]"
                            title={finding.summary_short}
                          >
                            {finding.summary_short}
                          </p>
                        </td>

                        {/* Risk Glyph, Score, Ruler */}
                        <td className="py-2 px-3 align-middle space-y-1">
                          <BandLabel band={finding.band} score={finding.score} />
                          <ScoreRuler score={finding.score} band={finding.band} variant="mini" />
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3 align-middle">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[10.5px] font-medium font-mono-code ${
                              finding.review_status === 'confirmed'
                                ? 'bg-[var(--high-bg)] text-[var(--high)] border border-[var(--high-border)]'
                                : finding.review_status === 'false_positive'
                                ? 'bg-[var(--official-bg)] text-[var(--official)] border border-[var(--official-border)]'
                                : finding.review_status === 'under_review'
                                ? 'bg-[var(--rev-bg)] text-[var(--rev)] border border-[var(--rev-border)]'
                                : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--line-strong)]'
                            }`}
                          >
                            {REVIEW_STATUSES[finding.review_status].label}
                          </span>
                        </td>

                        {/* Relative Time */}
                        <td className="py-2 px-3 align-middle text-right text-[11px] text-[var(--text-muted)] font-mono-code whitespace-nowrap">
                          <span title={formatDateTime(finding.first_seen_at || finding.created_at)}>
                            {formatRelativeTime(finding.first_seen_at || finding.created_at)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Floating Quick Action Pill for Deep Scroll */}
            {selectedFindingIds.size > 0 && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#08131E]/95 backdrop-blur-md border border-[var(--cyan-accent)] shadow-[0_8px_24px_rgba(0,0,0,0.8)] text-white text-[12px] font-mono-code animate-fadeIn">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[var(--cyan-accent)] animate-ping" />
                    <span>{selectedFindingIds.size} selected</span>
                  </span>

                  <span className="h-3.5 w-px bg-[var(--line-strong)]" />

                  <button
                    type="button"
                    onClick={handleBulkMarkAsIgnored}
                    className="px-2.5 py-1 rounded-full bg-[#142334] hover:bg-[#1d334d] text-slate-200 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer border border-[var(--line-strong)] shadow-sm"
                    title={`Bulk set ${selectedFindingIds.size} alerts to Ignored`}
                  >
                    <EyeOff className="w-3 h-3 text-slate-400" />
                    <span>Mark Ignored</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBulkEscalateToHigh}
                    className="px-2.5 py-1 rounded-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(239,68,68,0.5)] cursor-pointer"
                    title={`Bulk escalate ${selectedFindingIds.size} alerts to High Risk Priority`}
                  >
                    <Flame className="w-3 h-3 text-yellow-300" />
                    <span>Escalate High</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearSelection}
                    className="w-5 h-5 rounded-full hover:bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Deselect all (Esc)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* List Footer */}
            <div className="p-3 border-t border-[var(--line-subtle)] bg-[var(--bg-surface-inset)] flex items-center justify-between text-[11.5px] font-mono-code text-[var(--text-muted)]">
              <span>
                Displaying <strong className="text-white">{filteredFindings.length}</strong> of{' '}
                <strong className="text-white">{allFindings.length}</strong> candidates
              </span>
              <span>
                Navigate with <kbd className="px-1 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-white">J</kbd> / <kbd className="px-1 py-0.2 rounded bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-white">K</kbd>
              </span>
            </div>
          </div>

          {/* Right Investigation Bench (46%) */}
          <div className="lg:w-[46%] bg-[var(--bg-surface)] p-6 space-y-6 overflow-y-auto max-h-[850px]">
            {activeFinding ? (
              <>
                {/* 1. Header: Candidate Identity, Platform, Radial/Score Gauge */}
                <div className="flex items-start justify-between border-b border-[var(--line-subtle)] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono-code uppercase px-1.5 py-0.2 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-[var(--cyan-accent)]">
                        {activeFinding.candidate.platform_or_store}
                      </span>
                      <span className="text-[11.5px] font-mono-code text-[var(--text-muted)]">
                        {activeFinding.candidate.handle_or_package}
                      </span>
                    </div>

                    <h2 className="font-stretch-title text-[20px] font-bold text-white">
                      <bdi>{activeFinding.candidate.name}</bdi>
                    </h2>
                  </div>

                  {/* High-tech Risk Score Gauge Block */}
                  <div className="text-right">
                    <div
                      className="font-stretch-numeral text-[44px] leading-none font-bold tabular-nums"
                      style={{ color: BANDS[activeFinding.band].colorVar }}
                    >
                      {activeFinding.score}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-1 font-mono-code">
                      <RiskGlyph band={activeFinding.band} />
                      <span
                        className="text-[12.5px] font-bold uppercase tracking-wider"
                        style={{ color: BANDS[activeFinding.band].colorVar }}
                      >
                        {BANDS[activeFinding.band].label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. ScoreRuler + Summary + Coverage */}
                <div className="space-y-3">
                  <ScoreRuler
                    score={activeFinding.score}
                    band={activeFinding.band}
                    variant="full"
                    signals={activeFinding.signals}
                  />

                  <p className="text-[14px] text-white leading-relaxed font-medium">
                    {activeFinding.summary}
                  </p>

                  <CoverageMeter
                    available={activeFinding.coverage_available}
                    total={activeFinding.coverage_total}
                  />
                </div>

                {/* 3. GateNote if rule gates capped the finding */}
                {activeFinding.gates_applied && activeFinding.gates_applied.length > 0 && (
                  <GateNote
                    gates={activeFinding.gates_applied}
                    coverageAvailable={activeFinding.coverage_available}
                    coverageTotal={activeFinding.coverage_total}
                  />
                )}

                {/* 4. Investigation Tabs */}
                <div className="pt-2 border-t border-[var(--line-subtle)] space-y-4">
                  <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface-inset)] rounded-[5px] border border-[var(--line-subtle)] text-[12px]">
                    <button
                      onClick={() => setActiveTab('signals')}
                      className={`flex-1 py-1.5 px-2 rounded-[4px] font-medium transition-colors cursor-pointer ${
                        activeTab === 'signals'
                          ? 'bg-[var(--bg-surface-elevated)] text-[var(--cyan-accent)] font-semibold border border-[var(--line-strong)]'
                          : 'text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      Signals ({activeFinding.signals.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('comparison')}
                      className={`flex-1 py-1.5 px-2 rounded-[4px] font-medium transition-colors cursor-pointer ${
                        activeTab === 'comparison'
                          ? 'bg-[var(--bg-surface-elevated)] text-[var(--cyan-accent)] font-semibold border border-[var(--line-strong)]'
                          : 'text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      Side-by-side
                    </button>
                    <button
                      onClick={() => setActiveTab('context')}
                      className={`flex-1 py-1.5 px-2 rounded-[4px] font-medium transition-colors cursor-pointer ${
                        activeTab === 'context'
                          ? 'bg-[var(--bg-surface-elevated)] text-[var(--cyan-accent)] font-semibold border border-[var(--line-strong)]'
                          : 'text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      Metadata
                    </button>
                    <button
                      onClick={() => setActiveTab('audit')}
                      className={`flex-1 py-1.5 px-2 rounded-[4px] font-medium transition-colors cursor-pointer ${
                        activeTab === 'audit'
                          ? 'bg-[var(--bg-surface-elevated)] text-[var(--cyan-accent)] font-semibold border border-[var(--line-strong)]'
                          : 'text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      Audit ({activeFinding.review_events.length})
                    </button>
                  </div>

                  {/* Tab 1: Signals Breakdown */}
                  {/* Tab 1: Interactive Risk Analysis & Signals Breakdown */}
                  {activeTab === 'signals' && (
                    <InteractiveRiskAnalysis
                      finding={activeFinding}
                      onInspectSignal={() => setActiveTab('comparison')}
                    />
                  )}

                  {/* Tab 2: Interactive Asset Comparison Studio */}
                  {activeTab === 'comparison' && (
                    <AssetComparisonStudio
                      kind={activeFinding.kind}
                      official={activeFinding.official}
                      candidate={activeFinding.candidate}
                      signals={activeFinding.signals}
                    />
                  )}

                  {/* Tab 3: Context & Metadata */}
                  {activeTab === 'context' && (
                    <div className="p-4 rounded-[6px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] space-y-3 text-[12.5px]">
                      <div className="text-[12px] font-semibold text-white uppercase tracking-wider font-mono-code">
                        Discovered Profile Context
                      </div>
                      <dl className="grid grid-cols-2 gap-3">
                        {activeFinding.candidate.context?.follower_count !== undefined && (
                          <div>
                            <dt className="text-[var(--text-muted)]">Followers</dt>
                            <dd className="font-mono-code font-bold text-white">
                              {activeFinding.candidate.context.follower_count.toLocaleString()}
                            </dd>
                          </div>
                        )}
                        {activeFinding.candidate.context?.account_created_at && (
                          <div>
                            <dt className="text-[var(--text-muted)]">Account Created</dt>
                            <dd className="font-mono-code text-white">
                              {formatDateTime(activeFinding.candidate.context.account_created_at)}
                            </dd>
                          </div>
                        )}
                        {activeFinding.candidate.context?.install_count_bucket && (
                          <div>
                            <dt className="text-[var(--text-muted)]">Installs</dt>
                            <dd className="font-mono-code font-bold text-white">
                              {activeFinding.candidate.context.install_count_bucket}
                            </dd>
                          </div>
                        )}
                        {activeFinding.candidate.context?.app_category && (
                          <div>
                            <dt className="text-[var(--text-muted)]">Category</dt>
                            <dd className="text-white">
                              {activeFinding.candidate.context.app_category}
                            </dd>
                          </div>
                        )}
                        {activeFinding.candidate.external_id && (
                          <div>
                            <dt className="text-[var(--text-muted)]">Discovered External ID</dt>
                            <dd className="font-mono-code text-[var(--cyan-accent)]">
                              {activeFinding.candidate.external_id}
                            </dd>
                          </div>
                        )}
                      </dl>

                      {activeFinding.candidate.bio_or_desc && (
                        <div className="pt-2 border-t border-[var(--line-subtle)] space-y-1">
                          <div className="text-[11.5px] font-mono-code text-[var(--text-muted)]">Raw Description / Bio</div>
                          <p className="text-[12px] text-[var(--text-secondary)] italic bg-[var(--bg-surface)] p-2.5 rounded border border-[var(--line-subtle)]">
                            "{activeFinding.candidate.bio_or_desc}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 4: Threat Investigation Timeline */}
                  {activeTab === 'audit' && (
                    <InvestigationTimeline
                      finding={activeFinding}
                      onNavigateToScan={(scanId) => navigate(`/brands/${brand.id}/scans?scanId=${scanId}`)}
                    />
                  )}
                </div>

                {/* 5. Review Decision Actions */}
                <div className="pt-4 border-t border-[var(--line-subtle)] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-white uppercase tracking-wider font-mono-code">
                      Analyst Decision
                    </h3>
                    <span className="text-[11px] font-mono-code text-[var(--text-muted)]">
                      Current: {REVIEW_STATUSES[activeFinding.review_status].label}
                    </span>
                  </div>

                  {reviewError && (
                    <div role="alert" className="p-2.5 rounded-[4px] bg-[var(--high-bg)] text-[var(--high)] text-[12px] border border-[var(--high-border)]">
                      {reviewError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11.5px] font-mono-code text-[var(--text-muted)] mb-1">
                      Investigation rationale (Required for confirmation or false positive)
                    </label>
                    <textarea
                      ref={noteTextareaRef}
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Enter threat analysis rationale, phishing evidence, or official relationship justification..."
                      rows={2}
                      className="w-full p-2.5 rounded-[4px] border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[12.5px] text-white focus:outline-none focus:border-[var(--line-active)]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canConfirm && (
                      <button
                        type="button"
                        onClick={() => handleReviewAction('confirmed')}
                        className="h-8 px-4 rounded-[4px] bg-[var(--high)] hover:brightness-110 text-white text-[12.5px] font-bold transition-all shadow-[0_0_10px_rgba(239,68,68,0.3)] cursor-pointer"
                      >
                        Confirm impersonation
                      </button>
                    )}

                    {canMarkFalsePositive && (
                      <button
                        type="button"
                        onClick={() => handleReviewAction('false_positive')}
                        className="h-8 px-3.5 rounded-[4px] border border-[var(--line-strong)] hover:border-[var(--official-border)] bg-[var(--bg-surface-elevated)] text-[12.5px] font-medium text-[var(--official)] transition-colors cursor-pointer"
                      >
                        Mark as false positive
                      </button>
                    )}

                    {canStartReview && (
                      <button
                        type="button"
                        onClick={() => handleReviewAction('under_review')}
                        className="h-8 px-3.5 rounded-[4px] border border-[var(--line-strong)] hover:border-[var(--line-active)] bg-[var(--bg-surface-elevated)] text-[12.5px] font-medium text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
                      >
                        Start review
                      </button>
                    )}
                  </div>

                  {/* Scan Engine Version & Finding ID Copy */}
                  <div className="pt-2 text-[11px] font-mono-code text-[var(--text-muted)] flex items-center justify-between border-t border-[var(--line-subtle)]">
                    <span>
                      Scan {activeFinding.scan_id} (Engine {activeFinding.engine_version}, Rules {activeFinding.rules_version})
                    </span>
                    <button
                      onClick={() => handleCopyId(activeFinding.id)}
                      className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                      title="Copy finding ID"
                    >
                      <span>{activeFinding.id}</span>
                      {copiedId ? <Check className="w-3 h-3 text-[var(--official)]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm">
                Select a candidate from the left list to inspect detailed evidence.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exclusions Modal */}
      {showExclusionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface-elevated)] rounded-[8px] border border-[var(--line-strong)] shadow-[0_16px_48px_rgba(0,0,0,0.8)] w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[var(--official)]" />
                <h2 className="text-[15px] font-semibold text-white">
                  Official Assets Excluded by ID ({exclusions.length})
                </h2>
              </div>
              <button
                onClick={() => setShowExclusionsModal(false)}
                className="text-[var(--text-muted)] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12.5px] text-[var(--text-secondary)]">
              These registered assets were discovered during the scan but set aside by exact identifier match before risk scoring, preventing false self-alerts.
            </p>

            <div className="divide-y divide-[var(--line-subtle)] max-h-72 overflow-y-auto">
              {exclusions.map((ex) => (
                <div key={ex.id} className="py-2.5 flex items-center justify-between text-[12.5px]">
                  <div>
                    <div className="font-mono-code font-bold text-white">
                      {ex.platform_or_store}: {ex.handle_or_package}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      Matched on {ex.matched_on.replace('_', ' ')}{' '}
                      <span className="font-mono-code text-[var(--cyan-accent)]">{ex.matched_value}</span>
                    </div>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded-[2px] text-[10.5px] font-mono-code font-medium ${
                      ex.verification_status === 'verified'
                        ? 'bg-[var(--official-bg)] text-[var(--official)] border border-[var(--official-border)]'
                        : 'border border-[var(--line-strong)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {ex.verification_status === 'verified' ? 'VERIFIED' : 'REGISTERED'}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowExclusionsModal(false)}
                className="h-8 px-4 rounded-[4px] bg-[var(--cyan-accent)] text-[#041217] text-[12px] font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Dialog */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface-elevated)] rounded-[8px] border border-[var(--line-strong)] shadow-[0_16px_48px_rgba(0,0,0,0.8)] w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-3">
              <h2 className="text-[15px] font-semibold text-white">Command Center Shortcuts</h2>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-[var(--text-muted)] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-[12.5px] font-mono-code">
              <div className="flex justify-between py-1.5 border-b border-[var(--line-subtle)]">
                <span className="text-[var(--text-secondary)]">Next finding</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-white">J</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line-subtle)]">
                <span className="text-[var(--text-secondary)]">Previous finding</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-white">K</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line-subtle)]">
                <span className="text-[var(--text-secondary)]">Start review</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-white">U</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line-subtle)]">
                <span className="text-[var(--text-secondary)]">Focus note to confirm impersonation</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-white">C</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line-subtle)]">
                <span className="text-[var(--text-secondary)]">Focus note for false positive</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-white">F</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line-subtle)]">
                <span className="text-[var(--text-secondary)]">Focus candidate search</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-white">/</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line-subtle)]">
                <span className="text-[var(--text-secondary)]">Toggle select alert</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-white">X</kbd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line-subtle)]">
                <span className="text-[var(--text-secondary)]">Select all filtered alerts</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-white">Shift + A</kbd>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[var(--text-secondary)]">Deselect / Close dialogs</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-white">Esc</kbd>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="h-8 px-4 rounded-[4px] bg-[var(--cyan-accent)] text-[#041217] text-[12px] font-bold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-[5px] bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-white text-[12.5px] shadow-[0_12px_36px_rgba(0,0,0,0.8)] flex items-center gap-2.5"
        >
          <Check className="w-4 h-4 text-[var(--official)]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
