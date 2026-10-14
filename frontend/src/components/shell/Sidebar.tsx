import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertTriangle,
  Radio,
  Fingerprint,
  Database,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  ChevronDown,
  Terminal,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { Brand } from '../../types/brandguard';

interface SidebarProps {
  brands: Brand[];
  activeBrand: Brand;
  onSelectBrand: (brandId: string) => void;
  onAddBrand: () => void;
  openFindingsCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  brands,
  activeBrand,
  onSelectBrand,
  onAddBrand,
  openFindingsCount,
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showBrandMenu, setShowBrandMenu] = useState(false);

  const brandId = activeBrand.id;
  const currentPath = location.pathname;

  const handleSelectBrand = (newBrandId: string) => {
    onSelectBrand(newBrandId);
    setShowBrandMenu(false);

    // Maintain current subroute (e.g. findings, scans, profile, evaluation) when switching brands
    if (currentPath.includes('/findings')) {
      navigate(`/brands/${newBrandId}/findings`);
    } else if (currentPath.includes('/scans')) {
      navigate(`/brands/${newBrandId}/scans`);
    } else if (currentPath.includes('/profile')) {
      navigate(`/brands/${newBrandId}/profile`);
    } else if (currentPath.includes('/evaluation')) {
      navigate(`/brands/${newBrandId}/evaluation`);
    } else {
      navigate(`/brands/${newBrandId}`);
    }
  };

  const navItems = [
    {
      label: 'Overview',
      path: `/brands/${brandId}`,
      icon: Shield,
      exact: true,
    },
    {
      label: 'Findings',
      path: `/brands/${brandId}/findings`,
      icon: AlertTriangle,
      badge: openFindingsCount,
      exact: false,
    },
    {
      label: 'Scans',
      path: `/brands/${brandId}/scans`,
      icon: Radio,
      exact: false,
    },
    {
      label: 'Brand Profile',
      path: `/brands/${brandId}/profile`,
      icon: Fingerprint,
      exact: false,
    },
    {
      label: 'Sources & Imports',
      path: `/sources`,
      icon: Database,
      exact: false,
    },
    {
      label: 'Detection Quality',
      path: `/brands/${brandId}/evaluation`,
      icon: BarChart3,
      exact: false,
    },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 bg-[#080E15] border-r border-[var(--line-strong)] flex flex-col transition-all duration-200 select-none shadow-[4px_0_24px_rgba(0,0,0,0.5)] ${
        isCollapsed ? 'w-[68px]' : 'w-[250px]'
      }`}
    >
      {/* 1. Header & BrandGuard Wordmark */}
      <div className="h-[60px] px-4 flex items-center justify-between border-b border-[var(--line-subtle)] bg-[#060B10]">
        <Link
          to={`/brands/${brandId}`}
          className="flex items-center gap-3 text-white hover:opacity-95 transition-opacity"
        >
          {/* Cyber security geometric mark */}
          <div className="w-8 h-8 rounded-[6px] bg-gradient-to-br from-[#06b6d4] to-[#10b981] p-[1.5px] shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <div className="w-full h-full bg-[#080c10] rounded-[4.5px] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <rect x="2.5" y="2.5" width="10" height="10" rx="1.5" stroke="#06b6d4" strokeWidth="1.75" />
                <rect x="9.5" y="9.5" width="10" height="10" rx="1.5" fill="#10b981" />
              </svg>
            </div>
          </div>

          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-stretch-title text-[15px] font-bold tracking-tight text-white leading-none">
                Brand<span className="text-[var(--cyan-accent)]">Guard</span>
              </span>
              <span className="text-[10px] font-mono-code text-[var(--text-muted)] tracking-wider uppercase mt-0.5">
                Brand Defense SOC
              </span>
            </div>
          )}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-[4px] border border-[var(--line-strong)] hover:border-[var(--line-active)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. Active Brand Selector */}
      <div className="p-3 border-b border-[var(--line-subtle)] relative">
        <button
          onClick={() => setShowBrandMenu(!showBrandMenu)}
          className={`w-full p-2 rounded-[6px] bg-[#0A121A] border border-[var(--line-subtle)] hover:border-[var(--line-active)] flex items-center justify-between text-left transition-all cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={`Active Brand: ${activeBrand.name}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-[4px] bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={activeBrand.logo_url}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-[12.5px] font-bold text-white truncate leading-tight">
                  {activeBrand.name}
                </div>
                <div className="text-[10px] font-mono-code text-[var(--cyan-accent)] truncate">
                  {activeBrand.domain || 'All domains'}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <ChevronDown
              className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${
                showBrandMenu ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>

        {/* Brand Switcher Dropdown */}
        {showBrandMenu && (
          <div className="absolute top-[calc(100%+4px)] left-3 right-3 z-50 bg-[#0B141E] border border-[var(--line-active)] rounded-[8px] p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.85)] space-y-1">
            <div className="text-[10px] font-mono-code text-[var(--text-muted)] uppercase px-2 py-1">
              Protected Brand Identities
            </div>
            {brands.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBrand(b.id)}
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
                {b.id === activeBrand.id && <Check className="w-3.5 h-3.5 text-[var(--cyan-accent)] shrink-0" />}
              </button>
            ))}

            <div className="pt-1 border-t border-[var(--line-subtle)]">
              <button
                onClick={() => {
                  setShowBrandMenu(false);
                  onAddBrand();
                }}
                className="w-full px-2.5 py-1.5 rounded-[5px] text-[12px] text-[var(--cyan-accent)] hover:bg-[var(--bg-surface-elevated)] flex items-center gap-2 font-medium cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add new brand</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? currentPath === item.path
            : currentPath.startsWith(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#06b6d4]/15 to-transparent text-white border-l-2 border-[var(--cyan-accent)] font-semibold shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-surface-hover)]'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-[var(--cyan-accent)]' : 'text-[var(--text-muted)] group-hover:text-white'
                }`}
              />

              {!isCollapsed && <span className="truncate">{item.label}</span>}

              {/* Badges */}
              {item.badge !== undefined && item.badge > 0 && !isCollapsed && (
                <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10.5px] font-mono-code font-bold bg-[var(--high-bg)] text-[var(--high)] border border-[var(--high-border)]">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 4. Operator Status Badge at Bottom */}
      <div className="p-3 border-t border-[var(--line-subtle)] bg-[#060B10]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 p-2 rounded-[6px] bg-[#0A121A] border border-[var(--line-subtle)]">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--official)] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <div className="absolute inset-0 rounded-full bg-[var(--official)] animate-ping opacity-60" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-mono-code font-bold text-white uppercase tracking-wider">
                SOC Operator L3
              </div>
              <div className="text-[10px] font-mono-code text-[var(--text-muted)] truncate">
                Defensive Telemetry Active
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="SOC Operator Active">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--official)] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>
        )}
      </div>
    </aside>
  );
};
