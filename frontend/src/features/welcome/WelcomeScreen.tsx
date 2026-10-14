import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldCheck, Radio, Check, ArrowRight, Sparkles } from 'lucide-react';
import { store } from '../../services/store';
import { parseProfileInput } from '../../lib/parseProfile';

export const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [createdBrandId, setCreatedBrandId] = useState<string>('');

  // Step 1: Brand form
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [aliasesInput, setAliasesInput] = useState('');
  const [brandError, setBrandError] = useState('');

  // Step 2: First Asset form
  const [assetKind, setAssetKind] = useState<'social' | 'app'>('social');
  const [platform, setPlatform] = useState<string>('instagram');
  const [profileInput, setProfileInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [assetError, setAssetError] = useState('');

  const parsed = parseProfileInput(profileInput, platform as any);

  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setBrandError('Brand name is required.');
      return;
    }
    const aliases = aliasesInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const newBrand = store.addBrand(name.trim(), domain.trim(), description.trim(), aliases);
    setCreatedBrandId(newBrand.id);
    setStep(2);
  };

  const handleAddFirstAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileInput.trim()) {
      setAssetError('Profile handle or application identifier is required.');
      return;
    }

    if (assetKind === 'social') {
      const handle = parsed.handle || profileInput.trim().toLowerCase().replace(/^@/, '');
      store.addOfficialAsset({
        brand_id: createdBrandId,
        kind: 'social',
        platform: (parsed.platform || platform) as any,
        handle,
        display_name: displayName || name,
        profile_url: `https://${parsed.platform || platform}.com/${handle}`,
      });
    } else {
      const pkg = parsed.package_id || profileInput.trim();
      store.addOfficialAsset({
        brand_id: createdBrandId,
        kind: 'app',
        store: (parsed.platform || platform) as any,
        package_id: pkg,
        app_name: displayName || name,
      });
    }

    navigate(`/brands/${createdBrandId}`);
  };

  const handleLoadDemo = () => {
    store.resetToDemo();
    navigate('/brands/b-veltrix');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4 sm:p-6 cyber-grid-bg">
      <div className="max-w-[1080px] w-full bg-[var(--bg-surface)] rounded-[10px] border border-[var(--line-strong)] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Column (42%): Mission briefing & sequence steps */}
        <div className="md:w-5/12 p-8 border-b md:border-b-0 md:border-r border-[var(--line-subtle)] bg-[var(--bg-surface-inset)] flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div>
              <div className="w-10 h-10 rounded-[8px] bg-gradient-to-br from-[#06b6d4] to-[#10b981] p-[1.5px] mb-4">
                <div className="w-full h-full bg-[#080c10] rounded-[6.5px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[var(--cyan-accent)]" />
                </div>
              </div>
              <h1 className="font-stretch-title text-[24px] font-bold text-white tracking-tight">
                BrandGuard Perimeter Onboarding
              </h1>
              <p className="mt-2 text-[13.5px] text-[var(--text-secondary)] leading-relaxed">
                Define authentic digital assets for your brand. Candidates discovered across social networks and app stores will be continuously evaluated against these baselines.
              </p>
            </div>

            {/* Steps indicator */}
            <div className="space-y-3.5 pt-4 border-t border-[var(--line-subtle)]">
              <div className="flex items-start gap-3">
                <span
                  className={`w-6 h-6 rounded font-mono-code text-[11px] flex items-center justify-center font-bold shrink-0 ${
                    step > 1
                      ? 'bg-[var(--official)] text-[#041217]'
                      : 'bg-[var(--cyan-accent)] text-[#041217]'
                  }`}
                >
                  {step > 1 ? '✓' : '1'}
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-white">Define Brand Core</div>
                  <div className="text-[11.5px] text-[var(--text-muted)]">
                    {step > 1 ? 'Completed' : 'Active: Name, primary domain, and aliases'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span
                  className={`w-6 h-6 rounded font-mono-code text-[11px] flex items-center justify-center font-bold shrink-0 ${
                    step === 2
                      ? 'bg-[var(--cyan-accent)] text-[#041217]'
                      : 'border border-[var(--line-strong)] text-[var(--text-muted)]'
                  }`}
                >
                  2
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-white">Register Verified Asset</div>
                  <div className="text-[11.5px] text-[var(--text-muted)]">
                    {step === 2 ? 'Active: Register genuine profile or app ID' : 'Pending step 1'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded border border-[var(--line-strong)] font-mono-code text-[11px] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                  3
                </span>
                <div>
                  <div className="text-[13px] font-semibold text-white">Automated Triage</div>
                  <div className="text-[11.5px] text-[var(--text-muted)]">
                    Perimeter scans compare candidates against authentic marks
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--line-subtle)] text-[11px] font-mono-code text-[var(--text-muted)]">
            Single Source of Truth: Verified assets are excluded by exact registered identifier, never by display name alone.
          </div>
        </div>

        {/* Right Column (58%): Forms & Instant Demo Loader */}
        <div className="md:w-7/12 p-8 flex flex-col justify-between space-y-6">
          {step === 1 ? (
            <form onSubmit={handleCreateBrand} className="space-y-4">
              <div>
                <h2 className="text-[16px] font-semibold text-white uppercase tracking-wider font-mono-code">
                  Step 1: Brand Parameters
                </h2>
                <p className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">
                  Enter identity baselines for automated impersonation monitoring.
                </p>
              </div>

              {/* Explanatory Guidance Banner */}
              <div className="p-3.5 rounded-[6px] bg-[var(--bg-surface-inset)] border border-[var(--cyan-accent)]/30 text-[12px] space-y-1.5 shadow-sm">
                <div className="font-semibold flex items-center gap-1.5 font-mono-code text-[11px] uppercase text-[var(--cyan-accent)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  What to register:
                </div>
                <p className="text-white leading-relaxed font-medium">
                  Register <strong>ONLY your official, legitimate channels</strong> (your real website, official handles, and store package IDs).
                </p>
                <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
                  Do not register fake or imposter links! Once registered, BrandGuard's multi-channel scanners automatically crawl social networks and app stores to discover unauthorized look-alikes attempting to mimic you.
                </p>
              </div>

              {brandError && (
                <div role="alert" className="p-2 rounded bg-[var(--high-bg)] text-[var(--high)] text-[12px] border border-[var(--high-border)]">
                  {brandError}
                </div>
              )}

              <div>
                <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Brand Name <span className="text-[var(--high)]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full h-8 px-3 rounded border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[13px] text-white focus:outline-none focus:border-[var(--line-active)]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Primary Domain (Optional)
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. acme.com"
                  className="w-full h-8 px-3 rounded border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] font-mono-code text-[12.5px] text-white focus:outline-none focus:border-[var(--line-active)]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Protected Aliases (Comma-separated)
                </label>
                <input
                  type="text"
                  value={aliasesInput}
                  onChange={(e) => setAliasesInput(e.target.value)}
                  placeholder="e.g. Acme, AcmePay"
                  className="w-full h-8 px-3 rounded border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] font-mono-code text-[12.5px] text-white focus:outline-none focus:border-[var(--line-active)]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what your organization provides..."
                  rows={2}
                  className="w-full p-2.5 rounded border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[12px] text-white focus:outline-none focus:border-[var(--line-active)]"
                />
              </div>

              <button
                type="submit"
                className="h-8 px-5 rounded bg-[var(--cyan-accent)] text-[#041217] text-[12.5px] font-bold hover:brightness-110 cursor-pointer"
              >
                Proceed to Asset Registration
              </button>
            </form>
          ) : (
            <form onSubmit={handleAddFirstAsset} className="space-y-4">
              <div>
                <h2 className="text-[16px] font-semibold text-white uppercase tracking-wider font-mono-code">
                  Step 2: Register Perimeter Asset
                </h2>
                <p className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">
                  Register your genuine, verified digital baseline.
                </p>
              </div>

              {/* Clarification Callout */}
              <div className="p-3 rounded-[6px] bg-[var(--cyan-glow)] border border-[rgba(6,182,212,0.3)] text-[12px] space-y-1">
                <div className="flex items-center gap-1.5 text-[var(--cyan-accent)] font-bold font-mono-code text-[11px] uppercase">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  Register Official Links Only
                </div>
                <p className="text-[var(--text-secondary)] text-[11.5px] leading-relaxed">
                  Enter only your <strong>genuine, official accounts</strong> (e.g. your real handle or app package ID). <strong>Do not enter fake or impersonator links here</strong> — once registered, BrandGuard&apos;s scanner automatically scrapes and surfaces look-alike impersonator candidates by comparing them against this official baseline.
                </p>
              </div>

              {assetError && (
                <div role="alert" className="p-2 rounded bg-[var(--high-bg)] text-[var(--high)] text-[12px] border border-[var(--high-border)]">
                  {assetError}
                </div>
              )}

              <div className="flex gap-2 p-1 bg-[var(--bg-surface-inset)] rounded border border-[var(--line-strong)] w-fit text-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    setAssetKind('social');
                    setPlatform('instagram');
                  }}
                  className={`px-3 py-1 rounded font-medium cursor-pointer ${
                    assetKind === 'social' ? 'bg-[var(--cyan-accent)] text-[#041217] font-bold' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Social Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssetKind('app');
                    setPlatform('google_play');
                  }}
                  className={`px-3 py-1 rounded font-medium cursor-pointer ${
                    assetKind === 'app' ? 'bg-[var(--cyan-accent)] text-[#041217] font-bold' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  Application Identifier
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                    Channel
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full h-8 px-2 rounded border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[12px] text-white"
                  >
                    {assetKind === 'social' ? (
                      <>
                        <option value="instagram">Instagram</option>
                        <option value="x">X</option>
                        <option value="facebook">Facebook</option>
                        <option value="linkedin">LinkedIn</option>
                      </>
                    ) : (
                      <>
                        <option value="google_play">Google Play</option>
                        <option value="apple_app_store">Apple App Store</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                    Handle or Package ID
                  </label>
                  <input
                    type="text"
                    value={profileInput}
                    onChange={(e) => setProfileInput(e.target.value)}
                    placeholder="e.g. acmeofficial"
                    className="w-full h-8 px-2.5 rounded border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[12px] text-white focus:outline-none focus:border-[var(--line-active)]"
                    autoFocus
                  />
                  {parsed.previewText && (
                    <span className="text-[11px] text-[var(--cyan-accent)] mt-0.5 block font-mono-code">
                      {parsed.previewText}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="h-8 px-5 rounded bg-[var(--cyan-accent)] text-[#041217] text-[12.5px] font-bold hover:brightness-110 cursor-pointer"
              >
                Save and Enter Command Center
              </button>
            </form>
          )}

          {/* Instant Synthetic Demo Loader */}
          <div className="p-4 rounded-[6px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] space-y-2">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
              <Sparkles className="w-4 h-4 text-[var(--cyan-accent)]" />
              <span>Instant Threat Intelligence Sandbox</span>
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
              Explore BrandGuard immediately with pre-configured brands (<strong className="text-white">Veltrix Pay</strong>, <strong className="text-white">Marigold Mart</strong>, <strong className="text-white">Orbyte Health</strong>) loaded with 312 candidates, look-alike homoglyphs, and simulated scans.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleLoadDemo}
                className="h-8 px-4 rounded border border-[var(--line-strong)] hover:border-[var(--cyan-accent)] bg-[var(--bg-surface-elevated)] text-[12px] font-bold text-white transition-colors cursor-pointer"
              >
                Load Pre-Configured Demo Environment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
