import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Shield,
  Upload,
  Plus,
  X,
  Check,
  Fingerprint,
  Radio,
  ExternalLink,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Brand, OfficialAsset, SocialPlatform, AppStore } from '../../types/brandguard';
import { BrandIdentityOrbital } from '../../components/visualization/BrandIdentityOrbital';
import { CharDiff } from '../../components/evidence/CharDiff';
import { parseProfileInput } from '../../lib/parseProfile';
import {
  analyzeCandidateName,
  generateLookalikeVariants,
  LookalikeAnalysisResult,
} from '../../lib/lookalikeDetector';
import { store } from '../../services/store';

interface ProfileScreenProps {
  brand: Brand;
  assets: OfficialAsset[];
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ brand, assets }) => {
  const navigate = useNavigate();

  // Navigation tab for the profile page
  const [activeSection, setActiveSection] = useState<'identity' | 'social' | 'apps' | 'lookalikes'>('identity');

  // Identity Form State
  const [brandName, setBrandName] = useState(brand.name);
  const [domain, setDomain] = useState(brand.domain);
  const [description, setDescription] = useState(brand.description);
  const [aliases, setAliases] = useState<string[]>(brand.aliases || []);
  const [newAlias, setNewAlias] = useState('');
  const [logoPreview, setLogoPreview] = useState(brand.logo_url);
  const [identityMessage, setIdentityMessage] = useState<string | null>(null);

  // Sync state when active brand changes
  useEffect(() => {
    setBrandName(brand.name);
    setDomain(brand.domain);
    setDescription(brand.description);
    setAliases(brand.aliases || []);
    setLogoPreview(brand.logo_url);
    setTestCandidateName(`${brand.name} Support`);
  }, [brand.id, brand.name, brand.domain, brand.description, brand.logo_url, brand.aliases]);

  // Social Form State
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>('instagram');
  const [socialInput, setSocialInput] = useState('');
  const [socialAccountId, setSocialAccountId] = useState('');
  const [socialDisplayName, setSocialDisplayName] = useState('');
  const [socialError, setSocialError] = useState('');

  // App Form State
  const [appStore, setAppStore] = useState<AppStore>('google_play');
  const [appInput, setAppInput] = useState('');
  const [appName, setAppName] = useState('');
  const [appDeveloper, setAppDeveloper] = useState('');
  const [appError, setAppError] = useState('');

  // Look-alike Playground State
  const [testCandidateName, setTestCandidateName] = useState(`${brand.name} Support`);
  const [debouncedCandidate, setDebouncedCandidate] = useState(testCandidateName);
  const [variantLimit, setVariantLimit] = useState(18);

  // Verification Dialog
  const [verifyingAsset, setVerifyingAsset] = useState<OfficialAsset | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'domain_link' | 'manual'>('domain_link');
  const [manualNote, setManualNote] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCandidate(testCandidateName);
    }, 250);
    return () => clearTimeout(timer);
  }, [testCandidateName]);

  const parsedSocial = useMemo(() => parseProfileInput(socialInput, socialPlatform), [socialInput, socialPlatform]);
  const parsedApp = useMemo(() => parseProfileInput(appInput, appStore), [appInput, appStore]);

  const lookalikeAnalysis: LookalikeAnalysisResult = useMemo(() => {
    return analyzeCandidateName(brandName, debouncedCandidate, aliases);
  }, [brandName, debouncedCandidate, aliases]);

  const allVariants = useMemo(() => {
    return generateLookalikeVariants(brandName);
  }, [brandName]);

  const socialAssets = assets.filter((a) => a.kind === 'social');
  const appAssets = assets.filter((a) => a.kind === 'app');
  const verifiedCount = assets.filter((a) => a.verification_status === 'verified').length;

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateBrand(brand.id, {
      name: brandName.trim(),
      domain: domain.trim(),
      description: description.trim(),
      aliases,
      logo_url: logoPreview,
    });
    setIdentityMessage('Identity parameters saved.');
    setTimeout(() => setIdentityMessage(null), 3000);
  };

  const handleAddAlias = (e: React.KeyboardEvent | React.MouseEvent) => {
    e.preventDefault();
    const clean = newAlias.trim();
    if (clean && !aliases.includes(clean) && aliases.length < 10) {
      setAliases([...aliases, clean]);
      setNewAlias('');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      alert('Only PNG, JPEG or WebP images supported.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setLogoPreview(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSocial = (e: React.FormEvent) => {
    e.preventDefault();
    setSocialError('');
    const handle = parsedSocial.handle || socialInput.trim().toLowerCase().replace(/^@/, '');
    if (!handle) {
      setSocialError('Profile handle is required.');
      return;
    }

    const exists = assets.some((a) => a.platform === socialPlatform && a.handle?.toLowerCase() === handle);
    if (exists) {
      setSocialError(`@${handle} is already registered on ${socialPlatform}.`);
      return;
    }

    store.addOfficialAsset({
      brand_id: brand.id,
      kind: 'social',
      platform: socialPlatform,
      handle,
      external_id: socialAccountId.trim() || undefined,
      display_name: socialDisplayName.trim() || brand.name,
      profile_url: `https://${socialPlatform}.com/${handle}`,
      logo_url: logoPreview,
    });

    setSocialInput('');
    setSocialAccountId('');
    setSocialDisplayName('');
  };

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    setAppError('');
    const packageId = parsedApp.package_id || appInput.trim();
    if (!packageId) {
      setAppError('Package identifier or store link required.');
      return;
    }

    const exists = assets.some((a) => a.store === appStore && a.package_id?.toLowerCase() === packageId.toLowerCase());
    if (exists) {
      setAppError(`${packageId} is already registered on ${appStore}.`);
      return;
    }

    store.addOfficialAsset({
      brand_id: brand.id,
      kind: 'app',
      store: appStore,
      package_id: packageId,
      app_name: appName.trim() || brand.name,
      developer_name: appDeveloper.trim() || 'Veltrix Technologies Pvt Ltd',
      icon_url: logoPreview,
    });

    setAppInput('');
    setAppName('');
    setAppDeveloper('');
  };

  const handleVerifyAsset = () => {
    if (!verifyingAsset) return;
    const res = store.verifyAsset(verifyingAsset.id, verificationMethod, manualNote);
    setVerifyResult(res);
    if (res.success) {
      setTimeout(() => {
        setVerifyingAsset(null);
        setVerifyResult(null);
        setManualNote('');
      }, 1500);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-stretch-title text-[22px] font-bold text-white tracking-tight">
              Brand Perimeter & Official Identity
            </h1>
            <span className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] text-[11px] font-mono-code text-[var(--cyan-accent)]">
              {verifiedCount} VERIFIED / {assets.length} TOTAL
            </span>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            Configure authentic identity baselines, verified identifiers, and look-alike detection models for {brand.name}.
          </p>
        </div>

        <button
          onClick={() => navigate(`/brands/${brand.id}/scans`)}
          className="h-8 px-4 rounded-[5px] bg-[var(--bg-surface-elevated)] border border-[var(--line-strong)] hover:border-[var(--line-active)] text-white text-[12.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Radio className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
          <span>Launch Perimeter Scan</span>
        </button>
      </div>

      {/* Hero Visualizer: Interactive Brand Identity Orbital */}
      <BrandIdentityOrbital
        brand={brand}
        assets={assets}
        onSelectAsset={(ast) => {
          if (ast.kind === 'social') setActiveSection('social');
          else setActiveSection('apps');
        }}
      />

      {/* Section Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-surface-inset)] rounded-[6px] border border-[var(--line-subtle)] text-[13px] font-medium">
        <button
          onClick={() => setActiveSection('identity')}
          className={`flex-1 py-2 px-3 rounded-[4px] transition-colors cursor-pointer ${
            activeSection === 'identity'
              ? 'bg-[var(--bg-surface-elevated)] text-[var(--cyan-accent)] font-semibold border border-[var(--line-strong)]'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Identity & Domain
        </button>
        <button
          onClick={() => setActiveSection('social')}
          className={`flex-1 py-2 px-3 rounded-[4px] transition-colors cursor-pointer ${
            activeSection === 'social'
              ? 'bg-[var(--bg-surface-elevated)] text-[var(--cyan-accent)] font-semibold border border-[var(--line-strong)]'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Official Social ({socialAssets.length})
        </button>
        <button
          onClick={() => setActiveSection('apps')}
          className={`flex-1 py-2 px-3 rounded-[4px] transition-colors cursor-pointer ${
            activeSection === 'apps'
              ? 'bg-[var(--bg-surface-elevated)] text-[var(--cyan-accent)] font-semibold border border-[var(--line-strong)]'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Official Apps ({appAssets.length})
        </button>
        <button
          onClick={() => setActiveSection('lookalikes')}
          className={`flex-1 py-2 px-3 rounded-[4px] transition-colors cursor-pointer ${
            activeSection === 'lookalikes'
              ? 'bg-[var(--bg-surface-elevated)] text-[var(--cyan-accent)] font-semibold border border-[var(--line-strong)]'
              : 'text-[var(--text-secondary)] hover:text-white'
          }`}
        >
          Look-Alike Playground
        </button>
      </div>

      {/* Section 1: Identity */}
      {activeSection === 'identity' && (
        <section className="bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-3">
            <h2 className="text-[15px] font-semibold text-white uppercase tracking-wider font-mono-code">
              Brand Identity Baseline
            </h2>
            {identityMessage && (
              <span className="text-[12px] font-mono-code text-[var(--official)] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {identityMessage}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveIdentity} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full h-8 px-3 rounded-[4px] border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[13px] text-white focus:outline-none focus:border-[var(--line-active)]"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Primary Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. veltrixpay.in"
                  className="w-full h-8 px-3 rounded-[4px] border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] font-mono-code text-[12.5px] text-white focus:outline-none focus:border-[var(--line-active)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                Brand Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-[4px] border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[12.5px] text-white focus:outline-none focus:border-[var(--line-active)]"
              />
              <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                Used by TF-IDF model to detect stolen phrasing across suspicious account bios and application descriptions.
              </span>
            </div>

            {/* Aliases Tags */}
            <div>
              <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                Protected Aliases & Name Variants
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {aliases.map((al) => (
                  <span
                    key={al}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] text-[12px] text-white font-mono-code"
                  >
                    <span>{al}</span>
                    <button
                      type="button"
                      onClick={() => setAliases(aliases.filter((a) => a !== al))}
                      className="text-[var(--text-muted)] hover:text-[var(--high)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {aliases.length < 10 && (
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    placeholder="Add protected alias"
                    className="h-8 px-2.5 rounded-[4px] border border-[var(--line-strong)] bg-[var(--bg-surface-inset)] text-[12px] flex-1 text-white focus:outline-none focus:border-[var(--line-active)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddAlias}
                    className="h-8 px-3 rounded-[4px] border border-[var(--line-strong)] hover:border-white text-[12px] text-white"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Logo baseline */}
            <div className="pt-2 border-t border-[var(--line-subtle)]">
              <label className="block text-[11.5px] font-mono-code uppercase text-[var(--text-muted)] mb-2">
                Official Visual Logo Baseline
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-[6px] border border-[var(--line-strong)] bg-white p-2 flex items-center justify-center shrink-0">
                  <img
                    src={logoPreview}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-1.5 text-[12px] text-[var(--text-secondary)]">
                  <p className="text-[11.5px] text-[var(--text-muted)]">
                    PNG, JPEG or WebP up to 2 MB. Used for perceptual hash distance calculations.
                  </p>
                  <label className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[4px] border border-[var(--line-strong)] hover:border-white bg-[var(--bg-surface-elevated)] text-[12px] text-white cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[var(--cyan-accent)]" />
                    <span>Upload replacement mark</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="h-8 px-4 rounded-[4px] bg-[var(--cyan-accent)] text-[#041217] text-[12px] font-bold hover:brightness-110 cursor-pointer"
              >
                Save Identity Settings
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Section 2: Social Assets */}
      {activeSection === 'social' && (
        <section className="bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-6 space-y-5">
          <h2 className="text-[15px] font-semibold text-white uppercase tracking-wider font-mono-code">
            Verified Social Profiles ({socialAssets.length})
          </h2>

          <div className="overflow-x-auto rounded-[5px] border border-[var(--line-subtle)]">
            <table className="w-full text-left text-[12px] border-collapse">
              <thead>
                <tr className="bg-[var(--bg-surface-inset)] border-b border-[var(--line-subtle)] text-[11px] font-mono-code text-[var(--text-muted)]">
                  <th className="py-2.5 px-3 font-medium">Platform</th>
                  <th className="py-2.5 px-3 font-medium">Handle</th>
                  <th className="py-2.5 px-3 font-medium">Account ID</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-subtle)]">
                {socialAssets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-[var(--bg-surface-elevated)]">
                    <td className="py-2.5 px-3 font-semibold text-white">{ast.platform}</td>
                    <td className="py-2.5 px-3 font-mono-code text-white">@{ast.handle}</td>
                    <td className="py-2.5 px-3 font-mono-code text-[var(--text-muted)]">
                      {ast.external_id || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded-[2px] text-[10.5px] font-mono-code font-bold ${
                          ast.verification_status === 'verified'
                            ? 'bg-[var(--official-bg)] text-[var(--official)] border border-[var(--official-border)]'
                            : 'bg-[var(--bg-surface-inset)] text-[var(--text-secondary)] border border-[var(--line-strong)]'
                        }`}
                      >
                        {ast.verification_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      {ast.verification_status !== 'verified' && (
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyingAsset(ast);
                            setVerifyResult(null);
                          }}
                          className="text-[11.5px] font-mono-code text-[var(--cyan-accent)] hover:underline"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => store.removeOfficialAsset(ast.id)}
                        className="text-[11.5px] text-[var(--text-muted)] hover:text-[var(--high)]"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Social Form */}
          <form onSubmit={handleAddSocial} className="p-4 rounded-[6px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] space-y-3">
            <h3 className="text-[12.5px] font-mono-code uppercase font-semibold text-white">
              Register New Social Profile
            </h3>

            {socialError && (
              <div role="alert" className="p-2 rounded bg-[var(--high-bg)] text-[var(--high)] text-[12px] border border-[var(--high-border)]">
                {socialError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono-code text-[var(--text-muted)] mb-1">
                  Platform
                </label>
                <select
                  value={socialPlatform}
                  onChange={(e) => setSocialPlatform(e.target.value as SocialPlatform)}
                  className="w-full h-8 px-2 rounded border border-[var(--line-strong)] bg-[var(--bg-surface)] text-[12px] text-white"
                >
                  <option value="instagram">Instagram</option>
                  <option value="x">X</option>
                  <option value="facebook">Facebook</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="youtube">YouTube</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono-code text-[var(--text-muted)] mb-1">
                  Handle or Profile URL
                </label>
                <input
                  type="text"
                  value={socialInput}
                  onChange={(e) => setSocialInput(e.target.value)}
                  placeholder="e.g. veltrixpay"
                  className="w-full h-8 px-2.5 rounded border border-[var(--line-strong)] bg-[var(--bg-surface)] text-[12px] text-white focus:outline-none focus:border-[var(--line-active)]"
                />
                {parsedSocial.previewText && (
                  <span className="text-[11px] text-[var(--cyan-accent)] mt-0.5 block font-mono-code">
                    {parsedSocial.previewText}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="h-8 px-4 rounded-[4px] bg-[var(--cyan-accent)] text-[#041217] text-[12px] font-bold hover:brightness-110 cursor-pointer"
            >
              Register Asset
            </button>
          </form>
        </section>
      )}

      {/* Section 3: App Assets */}
      {activeSection === 'apps' && (
        <section className="bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-6 space-y-5">
          <h2 className="text-[15px] font-semibold text-white uppercase tracking-wider font-mono-code">
            Verified Application Identifiers ({appAssets.length})
          </h2>

          <div className="overflow-x-auto rounded-[5px] border border-[var(--line-subtle)]">
            <table className="w-full text-left text-[12px] border-collapse">
              <thead>
                <tr className="bg-[var(--bg-surface-inset)] border-b border-[var(--line-subtle)] text-[11px] font-mono-code text-[var(--text-muted)]">
                  <th className="py-2.5 px-3 font-medium">Store</th>
                  <th className="py-2.5 px-3 font-medium">App Name</th>
                  <th className="py-2.5 px-3 font-medium">Package / Bundle ID</th>
                  <th className="py-2.5 px-3 font-medium">Publisher</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-subtle)]">
                {appAssets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-[var(--bg-surface-elevated)]">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {ast.store === 'google_play' ? 'Google Play' : 'App Store'}
                    </td>
                    <td className="py-2.5 px-3 text-white">{ast.app_name}</td>
                    <td className="py-2.5 px-3 font-mono-code text-[var(--cyan-accent)]">
                      {ast.package_id}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)]">{ast.developer_name}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => store.removeOfficialAsset(ast.id)}
                        className="text-[11.5px] text-[var(--text-muted)] hover:text-[var(--high)]"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add App Form */}
          <form onSubmit={handleAddApp} className="p-4 rounded-[6px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] space-y-3">
            <h3 className="text-[12.5px] font-mono-code uppercase font-semibold text-white">
              Register Official Application
            </h3>

            {appError && (
              <div role="alert" className="p-2 rounded bg-[var(--high-bg)] text-[var(--high)] text-[12px] border border-[var(--high-border)]">
                {appError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono-code text-[var(--text-muted)] mb-1">
                  Store
                </label>
                <select
                  value={appStore}
                  onChange={(e) => setAppStore(e.target.value as AppStore)}
                  className="w-full h-8 px-2 rounded border border-[var(--line-strong)] bg-[var(--bg-surface)] text-[12px] text-white font-mono-code"
                >
                  <option value="google_play">Google Play</option>
                  <option value="apple_app_store">Apple App Store</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono-code text-[var(--text-muted)] mb-1">
                  Package ID or Store URL
                </label>
                <input
                  type="text"
                  value={appInput}
                  onChange={(e) => setAppInput(e.target.value)}
                  placeholder="e.g. com.veltrixpay.app"
                  className="w-full h-8 px-2.5 rounded border border-[var(--line-strong)] bg-[var(--bg-surface)] text-[12px] text-white focus:outline-none focus:border-[var(--line-active)] font-mono-code"
                />
              </div>
            </div>

            <button
              type="submit"
              className="h-8 px-4 rounded-[4px] bg-[var(--cyan-accent)] text-[#041217] text-[12px] font-bold hover:brightness-110 cursor-pointer"
            >
              Register Application
            </button>
          </form>
        </section>
      )}

      {/* Section 4: Look-Alike Playground */}
      {activeSection === 'lookalikes' && (
        <section className="bg-[var(--bg-surface)] rounded-[8px] border border-[var(--line-subtle)] p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--cyan-accent)]" />
              <h2 className="text-[15px] font-semibold text-white uppercase tracking-wider font-mono-code">
                Real-Time Look-Alike Detection Playground
              </h2>
            </div>
            <p className="text-[12.5px] text-[var(--text-secondary)] mt-0.5">
              Deterministic detection for Cyrillic/Greek homoglyphs, adjacent letter swaps, leetspeak, and deceptive affixes.
            </p>
          </div>

          {/* Live Tester Card */}
          <div className="p-4 rounded-[6px] bg-[var(--bg-surface-inset)] border border-[var(--line-strong)] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Baseline Brand Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={brandName}
                  className="w-full h-8 px-2.5 rounded border border-[var(--line-strong)] bg-[var(--bg-surface)] text-[12.5px] text-white font-bold select-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-code uppercase text-[var(--text-muted)] mb-1">
                  Candidate String to Test
                </label>
                <input
                  type="text"
                  value={testCandidateName}
                  onChange={(e) => setTestCandidateName(e.target.value)}
                  placeholder="e.g. Veltrix Pаy, veltrlxpay"
                  className="w-full h-8 px-2.5 rounded border border-[var(--line-active)] bg-[var(--bg-surface)] text-[12.5px] text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Analysis Result Card */}
            <div className="p-3.5 rounded-[5px] bg-[var(--bg-surface)] border border-[var(--line-strong)] space-y-3">
              <div className="flex items-baseline justify-between border-b border-[var(--line-subtle)] pb-2">
                <div className="text-[20px] font-stretch-title text-white">
                  <CharDiff official={brandName} candidate={debouncedCandidate} />
                </div>
                <div className="text-right">
                  <span className="text-[11.5px] text-[var(--text-muted)] font-mono-code">Calculated Similarity: </span>
                  <span className="font-mono-code tabular-nums font-bold text-[15px] text-[var(--cyan-accent)]">
                    {lookalikeAnalysis.name_score.toFixed(2)}
                  </span>
                </div>
              </div>

              {lookalikeAnalysis.techniques.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-[11.5px] font-mono-code uppercase text-[var(--text-muted)]">
                    Detected Impersonation Techniques ({lookalikeAnalysis.techniques.length}):
                  </div>
                  <ul className="space-y-1 text-[12px] text-[var(--text-secondary)]">
                    {lookalikeAnalysis.techniques.map((t, idx) => (
                      <li key={`${t.technique}-${idx}`} className="flex items-start gap-2">
                        <span className="glyph-high mt-1 shrink-0" />
                        <div>
                          <strong className="text-white">{t.title}: </strong>
                          <span>{t.evidence}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-[12px] text-[var(--text-muted)] italic">
                  {lookalikeAnalysis.summary}
                </p>
              )}
            </div>
          </div>

          {/* Generated Variants Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-mono-code uppercase font-semibold text-white">
                Pre-Computed Risk Variants ({allVariants.length})
              </h3>
              <span className="text-[11px] font-mono-code text-[var(--text-muted)]">
                Displaying {Math.min(variantLimit, allVariants.length)} of {allVariants.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {allVariants.slice(0, variantLimit).map((v, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-[4px] bg-[var(--bg-surface-inset)] border border-[var(--line-subtle)] space-y-0.5"
                >
                  <div className="font-mono-code font-bold text-[12px] text-white truncate">
                    {v.variant}
                  </div>
                  <div className="text-[10.5px] text-[var(--text-muted)] truncate" title={v.explanation}>
                    {v.technique_title}
                  </div>
                </div>
              ))}
            </div>

            {variantLimit < allVariants.length && (
              <button
                type="button"
                onClick={() => setVariantLimit((prev) => prev + 18)}
                className="h-7 px-3 rounded border border-[var(--line-strong)] text-[11.5px] text-white hover:border-white"
              >
                Load more variants
              </button>
            )}
          </div>
        </section>
      )}

      {/* Verification Dialog */}
      {verifyingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface-elevated)] rounded-[8px] border border-[var(--line-strong)] shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-3">
              <h2 className="text-[15px] font-semibold text-white">
                Verify @{verifyingAsset.handle || verifyingAsset.package_id}
              </h2>
              <button onClick={() => setVerifyingAsset(null)} className="text-[var(--text-muted)] hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {verifyResult && (
              <div
                className={`p-2.5 rounded text-[12px] border ${
                  verifyResult.success
                    ? 'bg-[var(--official-bg)] border-[var(--official-border)] text-[var(--official)]'
                    : 'bg-[var(--high-bg)] border-[var(--high-border)] text-[var(--high)]'
                }`}
              >
                {verifyResult.message}
              </div>
            )}

            <div className="space-y-3 text-[12.5px]">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="verMethod"
                  value="domain_link"
                  checked={verificationMethod === 'domain_link'}
                  onChange={() => setVerificationMethod('domain_link')}
                  className="mt-0.5 text-[var(--cyan-accent)]"
                />
                <div>
                  <div className="font-semibold text-white">
                    Automated domain link verification
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Verifies that profile bio or store page links to {brand.domain}.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="verMethod"
                  value="manual"
                  checked={verificationMethod === 'manual'}
                  onChange={() => setVerificationMethod('manual')}
                  className="mt-0.5 text-[var(--cyan-accent)]"
                />
                <div>
                  <div className="font-semibold text-white">Manual compliance confirmation</div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Requires compliance audit note.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line-subtle)]">
              <button
                type="button"
                onClick={() => setVerifyingAsset(null)}
                className="h-8 px-3 rounded text-[12px] text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyAsset}
                className="h-8 px-4 rounded bg-[var(--cyan-accent)] text-[#041217] text-[12px] font-bold"
              >
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
