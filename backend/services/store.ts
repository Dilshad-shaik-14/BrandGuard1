import {
  Brand,
  OfficialAsset,
  Finding,
  Exclusion,
  ScanRun,
  DatasetBatch,
  SourceInfo,
  EvaluationMetrics,
  ReviewStatus,
  RiskBand,
  SocialPlatform,
  AppStore,
} from '../types/brandguard';
import { createBrandLogoSvg } from '../engine/logoAssets';

const STORAGE_KEY = 'brandguard_app_state_v4';
const REVIEWER_KEY = 'brandguard_reviewer_name';

export function getStoredReviewer(): string {
  try {
    return localStorage.getItem(REVIEWER_KEY) || 'analyst';
  } catch {
    return 'analyst';
  }
}

export function setStoredReviewer(name: string): void {
  try {
    localStorage.setItem(REVIEWER_KEY, name);
  } catch {
    // ignore
  }
}

interface AppState {
  brands: Brand[];
  activeBrandId: string;
  assets: OfficialAsset[];
  findings: Finding[];
  exclusions: Exclusion[];
  scans: ScanRun[];
  datasets: DatasetBatch[];
  sources: SourceInfo[];
  evaluation: EvaluationMetrics;
}

function createInitialState(): AppState {
  // Brand 1: Veltrix Pay
  const veltrixLogo = createBrandLogoSvg('Veltrix Pay', 'official');
  const veltrixNear = createBrandLogoSvg('Veltrix Pay', 'impersonator_near');
  const veltrixShifted = createBrandLogoSvg('Veltrix Pay', 'impersonator_shifted');

  // Brand 2: Marigold Mart
  const marigoldLogo = createBrandLogoSvg('Marigold Mart', 'official');
  const marigoldNear = createBrandLogoSvg('Marigold Mart', 'impersonator_near');
  const marigoldShifted = createBrandLogoSvg('Marigold Mart', 'impersonator_shifted');

  // Brand 3: Orbyte Health
  const orbyteLogo = createBrandLogoSvg('Orbyte Health', 'official');
  const orbyteNear = createBrandLogoSvg('Orbyte Health', 'impersonator_near');

  // Brand 4: NexaBank
  const nexaLogo = createBrandLogoSvg('NexaBank', 'official');
  const nexaNear = createBrandLogoSvg('NexaBank', 'impersonator_near');

  // Brand 5: Aether Cloud
  const aetherLogo = createBrandLogoSvg('Aether Cloud', 'official');
  const aetherNear = createBrandLogoSvg('Aether Cloud', 'impersonator_near');

  // Brand 6: Solaris Mobility
  const solarisLogo = createBrandLogoSvg('Solaris Mobility', 'official');
  const solarisNear = createBrandLogoSvg('Solaris Mobility', 'impersonator_near');

  const brands: Brand[] = [
    {
      id: 'b-veltrix',
      name: 'Veltrix Pay',
      slug: 'veltrix-pay',
      description: 'Official digital payment wallet, UPI transfer, and merchant payouts in India.',
      domain: 'veltrixpay.in',
      logo_url: veltrixLogo,
      aliases: ['Veltrix', 'VeltrixPay'],
      created_at: '2026-08-10T09:00:00Z',
      updated_at: '2026-10-14T11:00:00Z',
    },
    {
      id: 'b-marigold',
      name: 'Marigold Mart',
      slug: 'marigold-mart',
      description: 'Instant 15-minute grocery delivery, daily essentials, and fresh produce marketplace.',
      domain: 'marigoldmart.com',
      logo_url: marigoldLogo,
      aliases: ['Marigold', 'MMart', 'MarigoldExpress'],
      created_at: '2026-09-01T10:00:00Z',
      updated_at: '2026-10-14T11:00:00Z',
    },
    {
      id: 'b-orbyte',
      name: 'Orbyte Health',
      slug: 'orbyte-health',
      description: 'Connected digital health diagnostics, EHR integrations, and telemedicine.',
      domain: 'orbytehealth.io',
      logo_url: orbyteLogo,
      aliases: ['Orbyte', 'OrbyteCare', 'OrbyteDiagnostics'],
      created_at: '2026-09-15T08:00:00Z',
      updated_at: '2026-10-14T11:00:00Z',
    },
    {
      id: 'b-nexabank',
      name: 'NexaBank',
      slug: 'nexabank',
      description: 'Next-generation digital neobank, cross-border multi-currency accounts, and wealth management.',
      domain: 'nexabank.com',
      logo_url: nexaLogo,
      aliases: ['Nexa', 'NexaBankGlobal', 'NexaPay'],
      created_at: '2026-09-20T08:00:00Z',
      updated_at: '2026-10-14T11:00:00Z',
    },
    {
      id: 'b-aether',
      name: 'Aether Cloud',
      slug: 'aether-cloud',
      description: 'Enterprise Kubernetes orchestration, serverless edge compute, and DevOps telemetry platform.',
      domain: 'aethercloud.io',
      logo_url: aetherLogo,
      aliases: ['Aether', 'AetherOps', 'AetherCloud'],
      created_at: '2026-09-25T08:00:00Z',
      updated_at: '2026-10-14T11:00:00Z',
    },
    {
      id: 'b-solaris',
      name: 'Solaris Mobility',
      slug: 'solaris-mobility',
      description: 'Electric vehicle charging network, automated battery swap hubs, and commercial fleet telematics.',
      domain: 'solarismobility.com',
      logo_url: solarisLogo,
      aliases: ['Solaris', 'SolarisEV', 'SolarisCharge'],
      created_at: '2026-10-01T08:00:00Z',
      updated_at: '2026-10-14T11:00:00Z',
    },
  ];

  // Helper to build 8 official baseline assets across all channels
  const buildBrandAssets = (
    brandId: string,
    brandName: string,
    handle: string,
    pkgPrefix: string,
    domain: string,
    logoUrl: string
  ): OfficialAsset[] => [
    {
      id: `ast-${brandId}-ig`,
      brand_id: brandId,
      kind: 'social',
      platform: 'instagram',
      handle,
      external_id: `ig-${brandId}`,
      display_name: brandName,
      profile_url: `https://instagram.com/${handle}`,
      bio: `Official verified account of ${brandName}. Visit our verified portal: https://${domain}`,
      bio_links: [`https://${domain}`],
      logo_url: logoUrl,
      verification_status: 'verified',
      verification_method: 'domain_link',
      verified_at: '2026-09-01T10:00:00Z',
      created_at: '2026-09-01T09:30:00Z',
    },
    {
      id: `ast-${brandId}-x`,
      brand_id: brandId,
      kind: 'social',
      platform: 'x',
      handle,
      external_id: `x-${brandId}`,
      display_name: brandName,
      profile_url: `https://x.com/${handle}`,
      bio: `Official updates, customer service announcements, and service status for ${brandName}.`,
      bio_links: [`https://${domain}`],
      logo_url: logoUrl,
      verification_status: 'verified',
      verification_method: 'domain_link',
      verified_at: '2026-09-01T10:05:00Z',
      created_at: '2026-09-01T09:35:00Z',
    },
    {
      id: `ast-${brandId}-fb`,
      brand_id: brandId,
      kind: 'social',
      platform: 'facebook',
      handle,
      external_id: `fb-${brandId}`,
      display_name: `${brandName} Official`,
      profile_url: `https://facebook.com/${handle}`,
      bio: `Official enterprise page for ${brandName}. Verified digital brand security.`,
      bio_links: [`https://${domain}`],
      logo_url: logoUrl,
      verification_status: 'registered',
      created_at: '2026-09-01T11:00:00Z',
    },
    {
      id: `ast-${brandId}-li`,
      brand_id: brandId,
      kind: 'social',
      platform: 'linkedin',
      handle,
      external_id: `li-${brandId}`,
      display_name: `${brandName} Global`,
      profile_url: `https://linkedin.com/company/${handle}`,
      bio: `Official corporate LinkedIn page of ${brandName}. Careers, announcements, and partnerships.`,
      bio_links: [`https://${domain}`],
      logo_url: logoUrl,
      verification_status: 'verified',
      verification_method: 'domain_link',
      verified_at: '2026-09-02T10:00:00Z',
      created_at: '2026-09-01T12:00:00Z',
    },
    {
      id: `ast-${brandId}-tg`,
      brand_id: brandId,
      kind: 'social',
      platform: 'telegram',
      handle: `${handle}_official`,
      external_id: `tg-${brandId}`,
      display_name: `${brandName} Verified Channel`,
      profile_url: `https://t.me/${handle}_official`,
      bio: `Official broadcast alerts and service updates from ${brandName}. No support DMs.`,
      bio_links: [`https://${domain}`],
      logo_url: logoUrl,
      verification_status: 'verified',
      verification_method: 'domain_link',
      verified_at: '2026-09-02T11:00:00Z',
      created_at: '2026-09-01T12:30:00Z',
    },
    {
      id: `ast-${brandId}-yt`,
      brand_id: brandId,
      kind: 'social',
      platform: 'youtube',
      handle: `${handle}_official`,
      external_id: `yt-${brandId}`,
      display_name: `${brandName} Official`,
      profile_url: `https://youtube.com/@${handle}_official`,
      bio: `Product demonstrations, security guides, and announcements from ${brandName}.`,
      bio_links: [`https://${domain}`],
      logo_url: logoUrl,
      verification_status: 'verified',
      verification_method: 'domain_link',
      verified_at: '2026-09-02T11:15:00Z',
      created_at: '2026-09-01T12:45:00Z',
    },
    {
      id: `ast-${brandId}-play`,
      brand_id: brandId,
      kind: 'app',
      store: 'google_play',
      package_id: `${pkgPrefix}.app`,
      app_name: `${brandName}: Official App`,
      developer_name: `${brandName} Technologies Inc.`,
      developer_id: `dev_${brandId}_official`,
      store_url: `https://play.google.com/store/apps/details?id=${pkgPrefix}.app`,
      description: `Official mobile app for ${brandName}. Secure transactions, real-time alerts, and service management.`,
      icon_url: logoUrl,
      verification_status: 'verified',
      verification_method: 'domain_link',
      verified_at: '2026-09-03T12:00:00Z',
      created_at: '2026-09-01T14:00:00Z',
    },
    {
      id: `ast-${brandId}-ios`,
      brand_id: brandId,
      kind: 'app',
      store: 'apple_app_store',
      package_id: `${pkgPrefix}.ios`,
      app_name: brandName,
      developer_name: `${brandName} Technologies Inc.`,
      developer_id: `dev_${brandId}_official`,
      store_url: `https://apps.apple.com/app/id${Math.floor(1000000000 + Math.random() * 900000000)}`,
      description: `Official iOS application for ${brandName}. Verified secure perimeter protection.`,
      icon_url: logoUrl,
      verification_status: 'registered',
      created_at: '2026-09-01T15:00:00Z',
    },
  ];

  const assets: OfficialAsset[] = [
    ...buildBrandAssets('b-veltrix', 'Veltrix Pay', 'veltrixpay', 'com.veltrixpay', 'veltrixpay.in', veltrixLogo),
    ...buildBrandAssets('b-marigold', 'Marigold Mart', 'marigoldmart', 'com.marigoldmart', 'marigoldmart.com', marigoldLogo),
    ...buildBrandAssets('b-orbyte', 'Orbyte Health', 'orbytehealth', 'io.orbytehealth', 'orbytehealth.io', orbyteLogo),
    ...buildBrandAssets('b-nexabank', 'NexaBank', 'nexabank', 'com.nexabank', 'nexabank.com', nexaLogo),
    ...buildBrandAssets('b-aether', 'Aether Cloud', 'aethercloud', 'io.aethercloud', 'aethercloud.io', aetherLogo),
    ...buildBrandAssets('b-solaris', 'Solaris Mobility', 'solarismobility', 'com.solarismobility', 'solarismobility.com', solarisLogo),
  ];

  // Helper to build exclusions for each brand
  const buildBrandExclusions = (brandId: string, brandHandle: string, pkgPrefix: string): Exclusion[] => [
    {
      id: `ex-${brandId}-ig`,
      scan_id: `scan-${brandId}`,
      candidate_id: `cand-${brandId}-ig`,
      asset_id: `ast-${brandId}-ig`,
      matched_on: 'external_id',
      matched_value: `ig-${brandId}`,
      platform_or_store: 'instagram',
      handle_or_package: brandHandle,
      asset_name: `${brandHandle} Instagram`,
      verification_status: 'verified',
    },
    {
      id: `ex-${brandId}-x`,
      scan_id: `scan-${brandId}`,
      candidate_id: `cand-${brandId}-x`,
      asset_id: `ast-${brandId}-x`,
      matched_on: 'external_id',
      matched_value: `x-${brandId}`,
      platform_or_store: 'x',
      handle_or_package: brandHandle,
      asset_name: `${brandHandle} X`,
      verification_status: 'verified',
    },
    {
      id: `ex-${brandId}-fb`,
      scan_id: `scan-${brandId}`,
      candidate_id: `cand-${brandId}-fb`,
      asset_id: `ast-${brandId}-fb`,
      matched_on: 'external_id',
      matched_value: `fb-${brandId}`,
      platform_or_store: 'facebook',
      handle_or_package: brandHandle,
      asset_name: `${brandHandle} Facebook`,
      verification_status: 'registered',
    },
    {
      id: `ex-${brandId}-li`,
      scan_id: `scan-${brandId}`,
      candidate_id: `cand-${brandId}-li`,
      asset_id: `ast-${brandId}-li`,
      matched_on: 'external_id',
      matched_value: `li-${brandId}`,
      platform_or_store: 'linkedin',
      handle_or_package: brandHandle,
      asset_name: `${brandHandle} LinkedIn`,
      verification_status: 'verified',
    },
    {
      id: `ex-${brandId}-tg`,
      scan_id: `scan-${brandId}`,
      candidate_id: `cand-${brandId}-tg`,
      asset_id: `ast-${brandId}-tg`,
      matched_on: 'handle_or_package',
      matched_value: `${brandHandle}_official`,
      platform_or_store: 'telegram',
      handle_or_package: `${brandHandle}_official`,
      asset_name: `${brandHandle} Telegram`,
      verification_status: 'verified',
    },
    {
      id: `ex-${brandId}-yt`,
      scan_id: `scan-${brandId}`,
      candidate_id: `cand-${brandId}-yt`,
      asset_id: `ast-${brandId}-yt`,
      matched_on: 'handle_or_package',
      matched_value: `${brandHandle}_official`,
      platform_or_store: 'youtube',
      handle_or_package: `${brandHandle}_official`,
      asset_name: `${brandHandle} YouTube`,
      verification_status: 'verified',
    },
    {
      id: `ex-${brandId}-play`,
      scan_id: `scan-${brandId}`,
      candidate_id: `cand-${brandId}-play`,
      asset_id: `ast-${brandId}-play`,
      matched_on: 'package_id',
      matched_value: `${pkgPrefix}.app`,
      platform_or_store: 'google_play',
      handle_or_package: `${pkgPrefix}.app`,
      asset_name: `${brandHandle} Google Play`,
      verification_status: 'verified',
    },
    {
      id: `ex-${brandId}-ios`,
      scan_id: `scan-${brandId}`,
      candidate_id: `cand-${brandId}-ios`,
      asset_id: `ast-${brandId}-ios`,
      matched_on: 'package_id',
      matched_value: `${pkgPrefix}.ios`,
      platform_or_store: 'apple_app_store',
      handle_or_package: `${pkgPrefix}.ios`,
      asset_name: `${brandHandle} App Store`,
      verification_status: 'registered',
    },
  ];

  const exclusions: Exclusion[] = [
    ...buildBrandExclusions('b-veltrix', 'veltrixpay', 'com.veltrixpay'),
    ...buildBrandExclusions('b-marigold', 'marigoldmart', 'com.marigoldmart'),
    ...buildBrandExclusions('b-orbyte', 'orbytehealth', 'io.orbytehealth'),
    ...buildBrandExclusions('b-nexabank', 'nexabank', 'com.nexabank'),
    ...buildBrandExclusions('b-aether', 'aethercloud', 'io.aethercloud'),
    ...buildBrandExclusions('b-solaris', 'solarismobility', 'com.solarismobility'),
  ];

  // ==========================================
  // Comprehensive Findings for all 6 brands
  // ==========================================
  const findings: Finding[] = [
    // --- 1. VELTRIX PAY FINDINGS ---
    {
      id: 'fnd-vp-1',
      scan_id: '7f3a21',
      brand_id: 'b-veltrix',
      kind: 'social',
      platform_or_store: 'instagram',
      score: 91,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: same name, logo match, claims official status and links off-domain to veltrixpay-offers.com.',
      summary_short: 'Same name, logo match, claims official, link to veltrixpay-offers.com',
      next_step: 'Review and report to Instagram for immediate brand impersonation takedown.',
      matched_asset_id: 'ast-b-veltrix-ig',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 95, contribution: 33.25, available: true, reason: 'Identical brand mark "Veltrix Pay" with deceptive bio claiming official affiliation.' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 92, contribution: 23.0, available: true, reason: 'Near-identical SVG asset with pHash distance 3 of 64.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 90, contribution: 18.0, available: true, reason: 'Links to unverified phishing domain veltrixpay-offers.com.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Candidate ID 8892147 contradicts registered official ID ig-b-veltrix.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 80, contribution: 8.0, available: true, reason: 'Promotes "100% instant cash double cashback on first UPI scan".' },
      ],
      candidate: {
        id: 'cand-vp-1',
        name: 'Veltrix Pay Official Offers',
        handle_or_package: 'veltrixpay_rewards',
        platform_or_store: 'instagram',
        external_id: '8892147',
        bio_or_desc: 'Claim festival rewards and 100% instant cashback on UPI. Official promo account.',
        links: ['https://veltrixpay-offers.com'],
        logo_url: veltrixNear,
      },
      official: {
        id: 'off-vp-ig',
        name: 'Veltrix Pay',
        handle_or_package: 'veltrixpay',
        platform_or_store: 'instagram',
        external_id: 'ig-b-veltrix',
        bio_or_desc: 'Fast, secure UPI and merchant payments. Official account of Veltrix Technologies Pvt Ltd.',
        links: ['https://veltrixpay.in'],
        logo_url: veltrixLogo,
      },
      created_at: '2026-10-14T11:02:18Z',
      review_events: [],
    },
    {
      id: 'fnd-vp-2',
      scan_id: '7f3a21',
      brand_id: 'b-veltrix',
      kind: 'social',
      platform_or_store: 'x',
      score: 87,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: homoglyph substitution in handle (@veltrlxpay with l for i), intercepting user complaints.',
      summary_short: 'Homoglyph handle (@veltrlxpay), intercepts failed transaction complaints',
      next_step: 'Issue immediate automated takedown request via X Brand Protection API.',
      matched_asset_id: 'ast-b-veltrix-x',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 88, contribution: 30.8, available: true, reason: 'Substituted "l" for "i" in handle (@veltrlxpay).' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 90, contribution: 22.5, available: true, reason: 'Direct copy of official brand square mark.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 85, contribution: 17.0, available: true, reason: 'Claims 24x7 resolution desk with WhatsApp escalation link.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'ID mismatch.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 75, contribution: 7.5, available: true, reason: 'Solicits transaction IDs and bank details over direct message.' },
      ],
      candidate: {
        id: 'cand-vp-2',
        name: 'Veltrix Pay Care Support',
        handle_or_package: 'veltrlxpay',
        platform_or_store: 'x',
        external_id: '9920141',
        bio_or_desc: 'Official 24x7 Customer Escalation Desk. DM your UPI transaction ID for quick reversal.',
        links: ['https://wa.me/919876543210'],
        logo_url: veltrixNear,
      },
      official: {
        id: 'off-vp-x',
        name: 'Veltrix Pay',
        handle_or_package: 'veltrixpay',
        platform_or_store: 'x',
        external_id: 'x-b-veltrix',
        bio_or_desc: 'Real-time updates, customer care announcements and engineering news from Veltrix Pay.',
        links: ['https://veltrixpay.in'],
        logo_url: veltrixLogo,
      },
      created_at: '2026-10-14T11:02:22Z',
      review_events: [],
    },
    {
      id: 'fnd-vp-3',
      scan_id: '7f3a21',
      brand_id: 'b-veltrix',
      kind: 'app',
      platform_or_store: 'google_play',
      score: 74,
      band: 'medium',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Medium risk: package com.veltrixpay.fastcash imitating brand icon and publisher name.',
      summary_short: 'Rogue APK com.veltrixpay.fastcash mimicking brand icon',
      next_step: 'Submit trademark dispute notice to Google Play Developer Integrity team.',
      matched_asset_id: 'ast-b-veltrix-play',
      review_status: 'under_review',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 75, contribution: 26.25, available: true, reason: 'Includes official mark with modifier "Fast Cash".' },
        { key: 'logo', name: 'Icon similarity', weight: 0.25, raw_score: 80, contribution: 20.0, available: true, reason: 'Modified teal badge with added dollar sign.' },
        { key: 'bio', name: 'Publisher similarity', weight: 0.20, raw_score: 70, contribution: 14.0, available: true, reason: 'Developer name "Veltrix Labs India" contradicts registered entity.' },
        { key: 'conflict', name: 'Package mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Package com.veltrixpay.fastcash is not in verified list.' },
        { key: 'scam', name: 'Permission analysis', weight: 0.10, raw_score: 45, contribution: 4.5, available: true, reason: 'Requests excessive SMS read permissions.' },
      ],
      candidate: {
        id: 'cand-vp-3',
        name: 'Veltrix Fast Cash Loans',
        handle_or_package: 'com.veltrixpay.fastcash',
        platform_or_store: 'google_play',
        publisher: 'Veltrix Labs India',
        bio_or_desc: 'Instant short-term credit and UPI overdrafts in under 2 minutes.',
        logo_url: veltrixNear,
      },
      official: {
        id: 'off-vp-play',
        name: 'Veltrix Pay',
        handle_or_package: 'com.veltrixpay.app',
        platform_or_store: 'google_play',
        publisher: 'Veltrix Technologies Pvt Ltd',
        bio_or_desc: 'Send money instantly using UPI, pay bills, and manage stores.',
        logo_url: veltrixLogo,
      },
      created_at: '2026-10-14T11:02:30Z',
      review_events: [],
    },
    {
      id: 'fnd-vp-4',
      scan_id: '7f3a21',
      brand_id: 'b-veltrix',
      kind: 'social',
      platform_or_store: 'telegram',
      score: 88,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: Telegram bot @veltrix_upi_refund_bot requesting OTP and UPI PIN to reverse failed charges.',
      summary_short: 'Telegram refund bot harvesting UPI PIN and OTPs',
      next_step: 'Notify Telegram Abuse and publish defensive warning banner in official app.',
      matched_asset_id: 'ast-b-veltrix-tg',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 92, contribution: 32.2, available: true, reason: 'Exact match with affix "UPI Refund Bot".' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 92, contribution: 23.0, available: true, reason: 'Exact official avatar.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 85, contribution: 17.0, available: true, reason: 'Claims instant refund processing.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Rogue bot handle.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 90, contribution: 9.0, available: true, reason: 'Asks for 6-digit PIN and OTP verification.' },
      ],
      candidate: {
        id: 'cand-vp-4',
        name: 'Veltrix UPI Refund Bot',
        handle_or_package: 'veltrix_upi_refund_bot',
        platform_or_store: 'telegram',
        bio_or_desc: 'Automated UPI charge reversal bot. Enter your registered mobile and 6-digit PIN to claim immediate refund.',
        logo_url: veltrixNear,
      },
      official: {
        id: 'off-vp-tg',
        name: 'Veltrix Pay',
        handle_or_package: 'veltrixpay_official',
        platform_or_store: 'telegram',
        bio_or_desc: 'Official broadcast alerts and service updates from Veltrix Pay. No support DMs.',
        links: ['https://veltrixpay.in'],
        logo_url: veltrixLogo,
      },
      created_at: '2026-10-14T11:02:40Z',
      review_events: [],
    },

    // --- 2. MARIGOLD MART FINDINGS (ACCURATE & COMPREHENSIVE) ---
    {
      id: 'fnd-mm-1',
      scan_id: 'scan-b-marigold',
      brand_id: 'b-marigold',
      kind: 'social',
      platform_or_store: 'instagram',
      score: 94,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Critical high risk: Instagram account @marigold_festive_cashback targeting grocery shoppers with fake 50% discount coupons linking to phishing domain marigold-cashback.in.',
      summary_short: 'Fake 50% grocery vouchers, phishing domain marigold-cashback.in',
      next_step: 'Submit immediate trademark infringement report to Meta and request registrar suspension for marigold-cashback.in.',
      matched_asset_id: 'ast-b-marigold-ig',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 96, contribution: 33.6, available: true, reason: 'Uses exact brand name "Marigold Mart" with deceptive "Festive Cashback" suffix.' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 94, contribution: 23.5, available: true, reason: 'Exact replica of official orange/amber grocery bag glyph.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 92, contribution: 18.4, available: true, reason: 'Directs users to rogue domain marigold-cashback.in collecting credit card numbers.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Candidate ID contradicts verified brand baseline @marigoldmart.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 85, contribution: 8.5, available: true, reason: 'Promotes "Free $100 grocery voucher on first 500 orders today only".' },
      ],
      candidate: {
        id: 'cand-mm-1',
        name: 'Marigold Mart Festive Vouchers',
        handle_or_package: 'marigold_festive_cashback',
        platform_or_store: 'instagram',
        external_id: 'ig-mm-fake-1',
        bio_or_desc: 'Claim 50% instant discount vouchers on fresh fruits and groceries! Official seasonal cashback desk: https://marigold-cashback.in',
        links: ['https://marigold-cashback.in'],
        logo_url: marigoldNear,
      },
      official: {
        id: 'off-mm-ig',
        name: 'Marigold Mart',
        handle_or_package: 'marigoldmart',
        platform_or_store: 'instagram',
        external_id: 'ig-b-marigold',
        bio_or_desc: 'Instant 15-minute grocery delivery and fresh produce marketplace. Verified: https://marigoldmart.com',
        links: ['https://marigoldmart.com'],
        logo_url: marigoldLogo,
      },
      created_at: '2026-10-14T11:04:10Z',
      review_events: [],
    },
    {
      id: 'fnd-mm-2',
      scan_id: 'scan-b-marigold',
      brand_id: 'b-marigold',
      kind: 'social',
      platform_or_store: 'telegram',
      score: 90,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: Telegram bot @marigold_instant_delivery_bot impersonating dispatch support, asking customers for order IDs and debit card CVV to "re-route delayed orders".',
      summary_short: 'Telegram bot harvesting customer payment cards under guise of delayed orders',
      next_step: 'Report scam bot to Telegram abuse center and warn customers via in-app push message.',
      matched_asset_id: 'ast-b-marigold-tg',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 91, contribution: 31.85, available: true, reason: 'Contains brand name with "Instant Delivery Bot".' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 93, contribution: 23.25, available: true, reason: 'Exact match with official Marigold brand mark.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 88, contribution: 17.6, available: true, reason: 'Claims automated delivery refund processing.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Unregistered adversarial bot.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 90, contribution: 9.0, available: true, reason: 'Prompts users for 16-digit card number and CVV.' },
      ],
      candidate: {
        id: 'cand-mm-2',
        name: 'Marigold Mart Delivery Dispatch',
        handle_or_package: 'marigold_instant_delivery_bot',
        platform_or_store: 'telegram',
        bio_or_desc: 'Automated customer helpline for delayed groceries and refund requests. Enter your order ID and card details for instant refund.',
        logo_url: marigoldNear,
      },
      official: {
        id: 'off-mm-tg',
        name: 'Marigold Mart',
        handle_or_package: 'marigold_official',
        platform_or_store: 'telegram',
        bio_or_desc: 'Official broadcast alerts and service updates from Marigold Mart. No support DMs.',
        links: ['https://marigoldmart.com'],
        logo_url: marigoldLogo,
      },
      created_at: '2026-10-14T11:04:15Z',
      review_events: [],
    },
    {
      id: 'fnd-mm-3',
      scan_id: 'scan-b-marigold',
      brand_id: 'b-marigold',
      kind: 'social',
      platform_or_store: 'x',
      score: 88,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: Typosquatting homoglyph account @marigoId_care (capital I replaces l) intercepting delivery complaint tweets.',
      summary_short: 'Homoglyph @marigoId_care (capital I for l) hijacking delivery complaints',
      next_step: 'Submit priority imposter impersonation takedown via X Brand Registry.',
      matched_asset_id: 'ast-b-marigold-x',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 89, contribution: 31.15, available: true, reason: 'Capital letter I replaces lowercase l (marigoId).' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 91, contribution: 22.75, available: true, reason: 'Official logo with shifted saturation.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 84, contribution: 16.8, available: true, reason: 'Asks users to DM phone numbers.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Unregistered account.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 75, contribution: 7.5, available: true, reason: 'Automated bot replies to unhappy customers.' },
      ],
      candidate: {
        id: 'cand-mm-3',
        name: 'Marigold Mart Customer Care',
        handle_or_package: 'marigoId_care',
        platform_or_store: 'x',
        bio_or_desc: 'Official 24x7 Customer Support. Missing items or late delivery? Send us your phone number and order ID for immediate callback.',
        links: ['https://wa.me/919988776655'],
        logo_url: marigoldNear,
      },
      official: {
        id: 'off-mm-x',
        name: 'Marigold Mart',
        handle_or_package: 'marigoldmart',
        platform_or_store: 'x',
        bio_or_desc: 'Official updates, customer service announcements, and service status for Marigold Mart.',
        links: ['https://marigoldmart.com'],
        logo_url: marigoldLogo,
      },
      created_at: '2026-10-14T11:04:20Z',
      review_events: [],
    },
    {
      id: 'fnd-mm-4',
      scan_id: 'scan-b-marigold',
      brand_id: 'b-marigold',
      kind: 'social',
      platform_or_store: 'facebook',
      score: 82,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: Fraudulent Facebook page "Marigold Mart Franchise Hub" demanding $2,500 advance security deposits for grocery dark-store franchises.',
      summary_short: 'Fraudulent dark-store franchise scheme demanding advance wire fees',
      next_step: 'Escalate to Meta Enterprise Brand Rights Protection and alert legal counsel.',
      matched_asset_id: 'ast-b-marigold-fb',
      review_status: 'under_review',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 85, contribution: 29.75, available: true, reason: 'Includes full brand name with "Franchise Hub".' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 85, contribution: 21.25, available: true, reason: 'Uses corporate promotional banner graphics.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 80, contribution: 16.0, available: true, reason: 'Includes downloadable fake franchise agreement PDF.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Rogue entity.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 70, contribution: 7.0, available: true, reason: 'Guarantees 40% monthly ROI on dark store investments.' },
      ],
      candidate: {
        id: 'cand-mm-4',
        name: 'Marigold Mart Franchise Hub',
        handle_or_package: 'marigoldmart.franchise.official',
        platform_or_store: 'facebook',
        bio_or_desc: 'Partner with Marigold Mart! Open your own 15-minute quick delivery fulfillment center. Guaranteed 40% monthly returns. Apply today.',
        links: ['https://marigold-franchise-apply.org'],
        logo_url: marigoldNear,
      },
      official: {
        id: 'off-mm-fb',
        name: 'Marigold Mart',
        handle_or_package: 'marigoldmart',
        platform_or_store: 'facebook',
        bio_or_desc: 'Official enterprise page for Marigold Mart. Verified digital brand security.',
        links: ['https://marigoldmart.com'],
        logo_url: marigoldLogo,
      },
      created_at: '2026-10-14T11:04:30Z',
      review_events: [],
    },
    {
      id: 'fnd-mm-5',
      scan_id: 'scan-b-marigold',
      brand_id: 'b-marigold',
      kind: 'app',
      platform_or_store: 'google_play',
      score: 73,
      band: 'medium',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Medium risk: Rogue APK com.marigold.freshgrocery.offers scraping store catalog and injecting unauthorized adware.',
      summary_short: 'Unauthorized scraper app com.marigold.freshgrocery.offers injecting adware',
      next_step: 'File Google Play trademark complaint requesting package removal.',
      matched_asset_id: 'ast-b-marigold-play',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 76, contribution: 26.6, available: true, reason: 'Similar app title with "Fresh Grocery Offers".' },
        { key: 'logo', name: 'Icon similarity', weight: 0.25, raw_score: 78, contribution: 19.5, available: true, reason: 'Amber badge closely mimics official Android icon.' },
        { key: 'bio', name: 'Publisher similarity', weight: 0.20, raw_score: 65, contribution: 13.0, available: true, reason: 'Publisher "Quick Mart Utilities" is unauthorized.' },
        { key: 'conflict', name: 'Package mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Package mismatch.' },
        { key: 'scam', name: 'Permission analysis', weight: 0.10, raw_score: 40, contribution: 4.0, available: true, reason: 'Aggressive ad network SDK detected.' },
      ],
      candidate: {
        id: 'cand-mm-5',
        name: 'Marigold Grocery Savings & Deals',
        handle_or_package: 'com.marigold.freshgrocery.offers',
        platform_or_store: 'google_play',
        publisher: 'Quick Mart Utilities',
        bio_or_desc: 'Save up to 40% on every Marigold order with auto-applied secret promo codes.',
        logo_url: marigoldNear,
      },
      official: {
        id: 'off-mm-play',
        name: 'Marigold Mart',
        handle_or_package: 'com.marigoldmart.app',
        platform_or_store: 'google_play',
        publisher: 'Marigold Mart Technologies Inc.',
        bio_or_desc: 'Official mobile app for Marigold Mart. Instant 15-minute grocery delivery.',
        logo_url: marigoldLogo,
      },
      created_at: '2026-10-14T11:04:40Z',
      review_events: [],
    },
    {
      id: 'fnd-mm-6',
      scan_id: 'scan-b-marigold',
      brand_id: 'b-marigold',
      kind: 'social',
      platform_or_store: 'linkedin',
      score: 52,
      band: 'needs_review',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Needs review: Third-party staffing firm "Marigold Delivery Drivers Hiring" posting rider vacancies without official partner accreditation.',
      summary_short: 'Unaccredited logistics staffing firm posting driver vacancies',
      next_step: 'Contact vendor compliance team to verify whether staffing agreement exists.',
      matched_asset_id: 'ast-b-marigold-li',
      review_status: 'new',
      version: 1,
      gates_applied: ['name_only_cap'],
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 70, contribution: 24.5, available: true, reason: 'Recruitment title contains brand name.' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 50, contribution: 12.5, available: true, reason: 'Generic scooter clip art.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 45, contribution: 9.0, available: true, reason: 'Legitimate third-party staffing link.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 50, contribution: 5.0, available: true, reason: 'Vendor identity.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 10, contribution: 1.0, available: true, reason: 'Standard wage listings.' },
      ],
      candidate: {
        id: 'cand-mm-6',
        name: 'Marigold Delivery Drivers Staffing',
        handle_or_package: 'marigold-rider-hiring',
        platform_or_store: 'linkedin',
        bio_or_desc: 'Urgent hiring for two-wheeler delivery associates for Marigold dark stores in Mumbai and Bangalore.',
        logo_url: marigoldNear,
      },
      official: {
        id: 'off-mm-li',
        name: 'Marigold Mart',
        handle_or_package: 'marigoldmart',
        platform_or_store: 'linkedin',
        bio_or_desc: 'Official corporate LinkedIn page of Marigold Mart.',
        logo_url: marigoldLogo,
      },
      created_at: '2026-10-14T11:04:50Z',
      review_events: [],
    },
    {
      id: 'fnd-mm-7',
      scan_id: 'scan-b-marigold',
      brand_id: 'b-marigold',
      kind: 'social',
      platform_or_store: 'youtube',
      score: 46,
      band: 'needs_review',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Needs review: YouTube creator channel using Marigold logo in video thumbnails to promote generic discount affiliate links.',
      summary_short: 'Affiliate channel using brand logo in video thumbnails',
      next_step: 'Monitor channel for deceptive claims; no immediate takedown needed.',
      matched_asset_id: 'ast-b-marigold-yt',
      review_status: 'new',
      version: 1,
      gates_applied: ['low_coverage_cap'],
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 60, contribution: 21.0, available: true, reason: 'Channel title contains brand.' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 60, contribution: 15.0, available: true, reason: 'Thumbnail overlays.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 30, contribution: 6.0, available: true, reason: 'Affiliate redirect links.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 30, contribution: 3.0, available: true, reason: 'Independent creator.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 10, contribution: 1.0, available: true, reason: 'Promotional content.' },
      ],
      candidate: {
        id: 'cand-mm-7',
        name: 'Marigold Grocery Hacks & Secret Codes',
        handle_or_package: 'marigold_deals_daily',
        platform_or_store: 'youtube',
        bio_or_desc: 'Daily tips, cashback codes and honest reviews of Marigold Mart 15-minute grocery service.',
        logo_url: marigoldNear,
      },
      official: {
        id: 'off-mm-yt',
        name: 'Marigold Mart',
        handle_or_package: 'marigold_official',
        platform_or_store: 'youtube',
        bio_or_desc: 'Product demonstrations, security guides, and announcements from Marigold Mart.',
        logo_url: marigoldLogo,
      },
      created_at: '2026-10-14T11:05:00Z',
      review_events: [],
    },

    // --- 3. ORBYTE HEALTH FINDINGS ---
    {
      id: 'fnd-ob-1',
      scan_id: 'scan-b-orbyte',
      brand_id: 'b-orbyte',
      kind: 'social',
      platform_or_store: 'telegram',
      score: 93,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Critical high risk: Rogue online pharmacy bot @orbyte_rx_pharmacy_bot illegally dispensing prescription medications under the Orbyte Health name.',
      summary_short: 'Illicit prescription drug dispenser bot using Orbyte brand',
      next_step: 'Immediate escalation to FDA cybercrime unit and Telegram abuse center.',
      matched_asset_id: 'ast-b-orbyte-tg',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 95, contribution: 33.25, available: true, reason: 'Exact brand prefix with "Rx Pharmacy Bot".' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 92, contribution: 23.0, available: true, reason: 'Exact replica of emerald health cross.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 90, contribution: 18.0, available: true, reason: 'Directs to unregulated crypto pharmacy.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Rogue bot.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 90, contribution: 9.0, available: true, reason: 'Sells Schedule II medications without doctor prescription.' },
      ],
      candidate: {
        id: 'cand-ob-1',
        name: 'Orbyte Health Digital Pharmacy',
        handle_or_package: 'orbyte_rx_pharmacy_bot',
        platform_or_store: 'telegram',
        bio_or_desc: 'No prescription needed! Order Adderall, Ozempic and antibiotics with discrete express shipping.',
        logo_url: orbyteNear,
      },
      official: {
        id: 'off-ob-tg',
        name: 'Orbyte Health',
        handle_or_package: 'orbyte_telehealth',
        platform_or_store: 'telegram',
        bio_or_desc: 'Official broadcast alerts and service updates from Orbyte Health.',
        logo_url: orbyteLogo,
      },
      created_at: '2026-10-14T11:06:10Z',
      review_events: [],
    },
    {
      id: 'fnd-ob-2',
      scan_id: 'scan-b-orbyte',
      brand_id: 'b-orbyte',
      kind: 'social',
      platform_or_store: 'instagram',
      score: 87,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: Imposter account @orbyte_care_support soliciting patient medical records and insurance policy numbers.',
      summary_short: 'Imposter account harvesting patient insurance and health records',
      next_step: 'Issue DMCA trademark takedown notice to Meta.',
      matched_asset_id: 'ast-b-orbyte-ig',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 88, contribution: 30.8, available: true, reason: 'Uses official name with "Care Support".' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 90, contribution: 22.5, available: true, reason: 'Near-identical logo.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 85, contribution: 17.0, available: true, reason: 'Phishing portal for insurance cards.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'ID mismatch.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 70, contribution: 7.0, available: true, reason: 'Demands photo of insurance card.' },
      ],
      candidate: {
        id: 'cand-ob-2',
        name: 'Orbyte Health Patient Care',
        handle_or_package: 'orbyte_care_support',
        platform_or_store: 'instagram',
        bio_or_desc: 'Official patient coordination helpline. Need claim reimbursement? DM your insurance card and date of birth.',
        logo_url: orbyteNear,
      },
      official: {
        id: 'off-ob-ig',
        name: 'Orbyte Health',
        handle_or_package: 'orbytehealth',
        platform_or_store: 'instagram',
        bio_or_desc: 'Connected digital health diagnostics, EHR integrations, and telemedicine.',
        logo_url: orbyteLogo,
      },
      created_at: '2026-10-14T11:06:20Z',
      review_events: [],
    },
    {
      id: 'fnd-ob-3',
      scan_id: 'scan-b-orbyte',
      brand_id: 'b-orbyte',
      kind: 'app',
      platform_or_store: 'google_play',
      score: 75,
      band: 'medium',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Medium risk: Rogue diagnostic app io.orbyte.bp.monitor making false clinical accuracy claims for camera-based heart monitors.',
      summary_short: 'Unverified medical APK claiming optical blood pressure measurement',
      next_step: 'Notify Google Play Health Policy and Regulatory Compliance division.',
      matched_asset_id: 'ast-b-orbyte-play',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 78, contribution: 27.3, available: true, reason: 'Uses "Orbyte" in app name.' },
        { key: 'logo', name: 'Icon similarity', weight: 0.25, raw_score: 76, contribution: 19.0, available: true, reason: 'Matches brand green palette.' },
        { key: 'bio', name: 'Publisher similarity', weight: 0.20, raw_score: 70, contribution: 14.0, available: true, reason: 'Publisher "Orbyte App Health Labs".' },
        { key: 'conflict', name: 'Package mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Package mismatch.' },
        { key: 'scam', name: 'Permission analysis', weight: 0.10, raw_score: 50, contribution: 5.0, available: true, reason: 'Claims FDA clearance falsely in description.' },
      ],
      candidate: {
        id: 'cand-ob-3',
        name: 'Orbyte Pulse & Blood Pressure Pro',
        handle_or_package: 'io.orbyte.bp.monitor',
        platform_or_store: 'google_play',
        publisher: 'Orbyte App Health Labs',
        bio_or_desc: 'Measure systolic and diastolic pressure using your phone camera lens. Clinical accuracy guaranteed.',
        logo_url: orbyteNear,
      },
      official: {
        id: 'off-ob-play',
        name: 'Orbyte Health',
        handle_or_package: 'io.orbytehealth.patient',
        platform_or_store: 'google_play',
        publisher: 'Orbyte Health Technologies Inc.',
        bio_or_desc: 'Official mobile app for Orbyte Health. Secure diagnostics and telemedicine.',
        logo_url: orbyteLogo,
      },
      created_at: '2026-10-14T11:06:30Z',
      review_events: [],
    },

    // --- 4. NEXABANK FINDINGS (NEW BRAND) ---
    {
      id: 'fnd-nx-1',
      scan_id: 'scan-b-nexabank',
      brand_id: 'b-nexabank',
      kind: 'social',
      platform_or_store: 'telegram',
      score: 95,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Critical high risk: Financial phishing bot @nexabank_crypto_doubler_bot promising guaranteed 200% returns under NexaBank name.',
      summary_short: 'High-yield crypto doubling scam bot targeting neobank depositors',
      next_step: 'Immediate cybercrime complaint to Telegram Abuse and financial regulators.',
      matched_asset_id: 'ast-b-nexabank-tg',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 97, contribution: 33.95, available: true, reason: 'Exact brand name prefix.' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 95, contribution: 23.75, available: true, reason: 'Exact copy of indigo/electric violet hexagon mark.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 94, contribution: 18.8, available: true, reason: 'Directs to crypto deposit address.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Rogue bot.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 90, contribution: 9.0, available: true, reason: 'Promises guaranteed 2x returns in 24 hours.' },
      ],
      candidate: {
        id: 'cand-nx-1',
        name: 'NexaBank Vault & Staking Bot',
        handle_or_package: 'nexabank_crypto_doubler_bot',
        platform_or_store: 'telegram',
        bio_or_desc: 'Official NexaBank High-Yield Liquidity Pool. Deposit USDT or Bitcoin and receive 200% daily interest directly into your account.',
        logo_url: nexaNear,
      },
      official: {
        id: 'off-nx-tg',
        name: 'NexaBank',
        handle_or_package: 'nexabank_support',
        platform_or_store: 'telegram',
        bio_or_desc: 'Official broadcast alerts and service updates from NexaBank.',
        logo_url: nexaLogo,
      },
      created_at: '2026-10-14T11:07:10Z',
      review_events: [],
    },
    {
      id: 'fnd-nx-2',
      scan_id: 'scan-b-nexabank',
      brand_id: 'b-nexabank',
      kind: 'social',
      platform_or_store: 'instagram',
      score: 91,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: Instagram account @nexabank_loan_approval soliciting Social Security numbers and bank statements.',
      summary_short: 'Fake personal loan desk collecting SSNs and banking credentials',
      next_step: 'Submit urgent fraud takedown request to Meta Brand Rights Protection.',
      matched_asset_id: 'ast-b-nexabank-ig',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 93, contribution: 32.55, available: true, reason: 'Exact brand with "Loan Approval".' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 92, contribution: 23.0, available: true, reason: 'Official logo.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 90, contribution: 18.0, available: true, reason: 'Links to unencrypted Google Forms collecting SSN.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Unregistered profile.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 80, contribution: 8.0, available: true, reason: 'Guarantees instant $10,000 credit regardless of credit score.' },
      ],
      candidate: {
        id: 'cand-nx-2',
        name: 'NexaBank Instant Credit',
        handle_or_package: 'nexabank_loan_approval',
        platform_or_store: 'instagram',
        bio_or_desc: 'No credit check required! Instant approval up to $25,000. Apply now via our fast-track portal.',
        links: ['https://nexabank-fastloan.com'],
        logo_url: nexaNear,
      },
      official: {
        id: 'off-nx-ig',
        name: 'NexaBank',
        handle_or_package: 'nexabank',
        platform_or_store: 'instagram',
        bio_or_desc: 'Next-generation digital neobank, cross-border multi-currency accounts.',
        logo_url: nexaLogo,
      },
      created_at: '2026-10-14T11:07:20Z',
      review_events: [],
    },
    {
      id: 'fnd-nx-3',
      scan_id: 'scan-b-nexabank',
      brand_id: 'b-nexabank',
      kind: 'app',
      platform_or_store: 'google_play',
      score: 83,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: Malicious Android package com.nexabank.quickloan.apk imitating official mobile banking client.',
      summary_short: 'Malicious banking trojan APK harvesting mobile PINs',
      next_step: 'Notify Google Play Protect malware team for immediate remote revocation.',
      matched_asset_id: 'ast-b-nexabank-play',
      review_status: 'under_review',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 86, contribution: 30.1, available: true, reason: 'Uses NexaBank name.' },
        { key: 'logo', name: 'Icon similarity', weight: 0.25, raw_score: 85, contribution: 21.25, available: true, reason: 'Identical icon.' },
        { key: 'bio', name: 'Publisher similarity', weight: 0.20, raw_score: 75, contribution: 15.0, available: true, reason: 'Fake publisher "Nexa Global Financial".' },
        { key: 'conflict', name: 'Package mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Rogue package.' },
        { key: 'scam', name: 'Permission analysis', weight: 0.10, raw_score: 70, contribution: 7.0, available: true, reason: 'Requests accessibility overlay permissions.' },
      ],
      candidate: {
        id: 'cand-nx-3',
        name: 'NexaBank Mobile Wallet Pro',
        handle_or_package: 'com.nexabank.quickloan.apk',
        platform_or_store: 'google_play',
        publisher: 'Nexa Global Financial',
        bio_or_desc: 'Access your NexaBank checking, savings, and international debit cards on the go.',
        logo_url: nexaNear,
      },
      official: {
        id: 'off-nx-play',
        name: 'NexaBank',
        handle_or_package: 'com.nexabank.mobile',
        platform_or_store: 'google_play',
        publisher: 'NexaBank Technologies Inc.',
        bio_or_desc: 'Official mobile app for NexaBank. Secure transactions and multi-currency accounts.',
        logo_url: nexaLogo,
      },
      created_at: '2026-10-14T11:07:30Z',
      review_events: [],
    },

    // --- 5. AETHER CLOUD FINDINGS (NEW BRAND) ---
    {
      id: 'fnd-ae-1',
      scan_id: 'scan-b-aether',
      brand_id: 'b-aether',
      kind: 'social',
      platform_or_store: 'x',
      score: 93,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Critical high risk: Typosquatting handle @aethercIoud_ai (capital I for l) distributing malicious CLI tools stealing AWS and Kubernetes secret keys.',
      summary_short: 'Typosquatting handle distributing trojanized DevOps CLI to steal cloud keys',
      next_step: 'File immediate verified takedown on X and submit malicious GitHub repo to security trust team.',
      matched_asset_id: 'ast-b-aether-x',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 95, contribution: 33.25, available: true, reason: 'Homoglyph @aethercIoud_ai.' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 93, contribution: 23.25, available: true, reason: 'Electric cyan cloud mark copy.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 92, contribution: 18.4, available: true, reason: 'Links to malicious npm package aether-cloud-cli.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'ID mismatch.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 85, contribution: 8.5, available: true, reason: 'Offers free unlimited GPU cluster access.' },
      ],
      candidate: {
        id: 'cand-ae-1',
        name: 'Aether Cloud Community & Tools',
        handle_or_package: 'aethercIoud_ai',
        platform_or_store: 'x',
        bio_or_desc: 'Supercharge your Kubernetes clusters! Download our official developer CLI: npm i -g aether-cloud-cli for instant $5,000 credits.',
        links: ['https://aethercloud-dev.sh'],
        logo_url: aetherNear,
      },
      official: {
        id: 'off-ae-x',
        name: 'Aether Cloud',
        handle_or_package: 'aethercloud',
        platform_or_store: 'x',
        bio_or_desc: 'Enterprise Kubernetes orchestration, serverless edge compute, and DevOps telemetry platform.',
        logo_url: aetherLogo,
      },
      created_at: '2026-10-14T11:08:10Z',
      review_events: [],
    },
    {
      id: 'fnd-ae-2',
      scan_id: 'scan-b-aether',
      brand_id: 'b-aether',
      kind: 'social',
      platform_or_store: 'telegram',
      score: 89,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: Telegram bot @aether_free_credits_bot claiming to dispense enterprise promo tokens in exchange for organization admin tokens.',
      summary_short: 'Telegram phishing bot soliciting organization admin API tokens',
      next_step: 'Notify Telegram Trust & Safety and revoke any compromised tokens in cloud dashboard.',
      matched_asset_id: 'ast-b-aether-tg',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 91, contribution: 31.85, available: true, reason: 'Uses brand name.' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 92, contribution: 23.0, available: true, reason: 'Exact cloud logo.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 87, contribution: 17.4, available: true, reason: 'Requests token verification.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Rogue bot.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 75, contribution: 7.5, available: true, reason: 'Free credit token generator claim.' },
      ],
      candidate: {
        id: 'cand-ae-2',
        name: 'Aether Cloud Token Generator',
        handle_or_package: 'aether_free_credits_bot',
        platform_or_store: 'telegram',
        bio_or_desc: 'Claim $2,500 startup credits for your Aether Cloud organization. Submit your Org ID and master token to activate voucher.',
        logo_url: aetherNear,
      },
      official: {
        id: 'off-ae-tg',
        name: 'Aether Cloud',
        handle_or_package: 'aether_devops',
        platform_or_store: 'telegram',
        bio_or_desc: 'Official broadcast alerts and service updates from Aether Cloud.',
        logo_url: aetherLogo,
      },
      created_at: '2026-10-14T11:08:20Z',
      review_events: [],
    },

    // --- 6. SOLARIS MOBILITY FINDINGS (NEW BRAND) ---
    {
      id: 'fnd-sm-1',
      scan_id: 'scan-b-solaris',
      brand_id: 'b-solaris',
      kind: 'social',
      platform_or_store: 'instagram',
      score: 93,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Critical high risk: Fraudulent QR sticker scheme promoted on Instagram @solaris_ev_fastcharge redirecting EV drivers to phishing card skimmer at public charging stations.',
      summary_short: 'Fake charging station QR payment campaign stealing driver credit cards',
      next_step: 'Deploy physical inspection crews to charging stations and issue urgent takedown on Instagram.',
      matched_asset_id: 'ast-b-solaris-ig',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 96, contribution: 33.6, available: true, reason: 'Brand name with "EV Fast Charge".' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 94, contribution: 23.5, available: true, reason: 'Exact replica of gold/green solar charging wheel.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 92, contribution: 18.4, available: true, reason: 'Links to skimmer portal solaris-fastpay.net.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Imposter account.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 80, contribution: 8.0, available: true, reason: 'Promotes "Scan QR at any station for 80% discount".' },
      ],
      candidate: {
        id: 'cand-sm-1',
        name: 'Solaris Mobility EV FastPay',
        handle_or_package: 'solaris_ev_fastcharge',
        platform_or_store: 'instagram',
        bio_or_desc: 'Pay for your EV charging session with 50% discount! Scan station QR or pay online: https://solaris-fastpay.net',
        links: ['https://solaris-fastpay.net'],
        logo_url: solarisNear,
      },
      official: {
        id: 'off-sm-ig',
        name: 'Solaris Mobility',
        handle_or_package: 'solarismobility',
        platform_or_store: 'instagram',
        bio_or_desc: 'Electric vehicle charging network, automated battery swap hubs, and commercial fleet telematics.',
        logo_url: solarisLogo,
      },
      created_at: '2026-10-14T11:09:10Z',
      review_events: [],
    },
    {
      id: 'fnd-sm-2',
      scan_id: 'scan-b-solaris',
      brand_id: 'b-solaris',
      kind: 'social',
      platform_or_store: 'telegram',
      score: 89,
      band: 'high',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'High risk: Telegram bot @solaris_free_charge_bot selling counterfeit charging RFID fobs that bypass station metering.',
      summary_short: 'Counterfeit RFID fob distributor selling fraudulent charging tokens',
      next_step: 'Notify Telegram abuse and patch station cryptographic firmware handshake.',
      matched_asset_id: 'ast-b-solaris-tg',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 92, contribution: 32.2, available: true, reason: 'Uses Solaris name.' },
        { key: 'logo', name: 'Logo similarity', weight: 0.25, raw_score: 92, contribution: 23.0, available: true, reason: 'Exact logo.' },
        { key: 'bio', name: 'Bio & link analysis', weight: 0.20, raw_score: 86, contribution: 17.2, available: true, reason: 'Black market sales.' },
        { key: 'conflict', name: 'Account ID mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Rogue bot.' },
        { key: 'scam', name: 'Scam language detection', weight: 0.10, raw_score: 80, contribution: 8.0, available: true, reason: 'Offers cloned cards for unlimited charging.' },
      ],
      candidate: {
        id: 'cand-sm-2',
        name: 'Solaris Unlimited RFID Fobs',
        handle_or_package: 'solaris_free_charge_bot',
        platform_or_store: 'telegram',
        bio_or_desc: 'Get unlimited lifetime charging at all Solaris Mobility stations. Cloned encrypted RFID keycards shipped globally.',
        logo_url: solarisNear,
      },
      official: {
        id: 'off-sm-tg',
        name: 'Solaris Mobility',
        handle_or_package: 'solaris_charging',
        platform_or_store: 'telegram',
        bio_or_desc: 'Official broadcast alerts and service updates from Solaris Mobility.',
        logo_url: solarisLogo,
      },
      created_at: '2026-10-14T11:09:20Z',
      review_events: [],
    },
    {
      id: 'fnd-sm-3',
      scan_id: 'scan-b-solaris',
      brand_id: 'b-solaris',
      kind: 'app',
      platform_or_store: 'google_play',
      score: 72,
      band: 'medium',
      coverage_available: 5,
      coverage_total: 5,
      summary: 'Medium risk: Rogue Android APK com.solaris.battery.booster claiming to bypass vehicle charging speed limiters.',
      summary_short: 'Dangerous third-party APK claiming to overclock EV battery charge current',
      next_step: 'Submit safety hazard report to Google Play security operations.',
      matched_asset_id: 'ast-b-solaris-play',
      review_status: 'new',
      version: 1,
      signals: [
        { key: 'name', name: 'Name matching', weight: 0.35, raw_score: 75, contribution: 26.25, available: true, reason: 'Uses Solaris Mobility brand mark.' },
        { key: 'logo', name: 'Icon similarity', weight: 0.25, raw_score: 75, contribution: 18.75, available: true, reason: 'Yellow/gold badge imitation.' },
        { key: 'bio', name: 'Publisher similarity', weight: 0.20, raw_score: 65, contribution: 13.0, available: true, reason: 'Publisher "EV Tuning Labs".' },
        { key: 'conflict', name: 'Package mismatch', weight: 0.10, raw_score: 100, contribution: 10.0, available: true, reason: 'Rogue package.' },
        { key: 'scam', name: 'Permission analysis', weight: 0.10, raw_score: 45, contribution: 4.5, available: true, reason: 'Requests Bluetooth and location.' },
      ],
      candidate: {
        id: 'cand-sm-3',
        name: 'Solaris EV Supercharge Booster',
        handle_or_package: 'com.solaris.battery.booster',
        platform_or_store: 'google_play',
        publisher: 'EV Tuning Labs',
        bio_or_desc: 'Unlock 350kW ultra-fast charging speeds on any commercial charging station.',
        logo_url: solarisNear,
      },
      official: {
        id: 'off-sm-play',
        name: 'Solaris Mobility',
        handle_or_package: 'com.solarismobility.charge',
        platform_or_store: 'google_play',
        publisher: 'Solaris Mobility Inc.',
        bio_or_desc: 'Official mobile app for Solaris Mobility EV charging and swap hubs.',
        logo_url: solarisLogo,
      },
      created_at: '2026-10-14T11:09:30Z',
      review_events: [],
    },
  ];

  // Helper to build realistic scans for all brands
  const buildBrandScans = (brandId: string, highCount: number, medCount: number, revCount: number): ScanRun[] => [
    {
      id: `scan-${brandId}`,
      brand_id: brandId,
      status: 'completed',
      requested_sources: [
        'social:instagram',
        'social:x',
        'social:facebook',
        'social:linkedin',
        'social:telegram',
        'social:youtube',
        'apps:google_play',
        'apps:apple_app_store',
      ],
      engine_version: '1.0.3',
      rules_version: '1.0.3-a41c9e07',
      started_at: '2026-10-14T11:00:00Z',
      finished_at: '2026-10-14T11:00:42Z',
      duration_ms: 42000,
      created_at: '2026-10-14T11:00:00Z',
      progress: {
        stage: 'done',
        stage_label: 'Complete',
        done: 312,
        total: 312,
      },
      stats: {
        candidates_seen: 312,
        duplicates_dropped: 0,
        malformed_dropped: 0,
        excluded_official: 8,
        evaluated: 304,
        by_band: {
          ignored: 304 - (highCount + medCount + revCount),
          needs_review: revCount,
          medium: medCount,
          high: highCount,
        },
        by_kind: {
          social: 195,
          app: 117,
        },
        sources_ok: 8,
        sources_failed: 0,
      },
      source_results: [
        {
          id: `sr-${brandId}-ig`,
          scan_id: `scan-${brandId}`,
          source_key: 'social:instagram',
          source_name: 'Instagram',
          status: 'ok',
          simulated: false,
          message: 'Retrieved 62 candidates across monitored handles.',
          candidates_returned: 62,
          attempts: 1,
          retrieved_at: '2026-10-14T11:00:08Z',
          duration_ms: 8000,
        },
        {
          id: `sr-${brandId}-x`,
          scan_id: `scan-${brandId}`,
          source_key: 'social:x',
          source_name: 'X',
          status: 'ok',
          simulated: false,
          message: 'Retrieved 58 candidates.',
          candidates_returned: 58,
          attempts: 1,
          retrieved_at: '2026-10-14T11:00:14Z',
          duration_ms: 6000,
        },
        {
          id: `sr-${brandId}-fb`,
          scan_id: `scan-${brandId}`,
          source_key: 'social:facebook',
          source_name: 'Facebook',
          status: 'ok',
          simulated: false,
          message: 'Retrieved 44 candidates.',
          candidates_returned: 44,
          attempts: 1,
          retrieved_at: '2026-10-14T11:00:20Z',
          duration_ms: 6000,
        },
        {
          id: `sr-${brandId}-li`,
          scan_id: `scan-${brandId}`,
          source_key: 'social:linkedin',
          source_name: 'LinkedIn',
          status: 'ok',
          simulated: false,
          message: 'Retrieved 31 candidates.',
          candidates_returned: 31,
          attempts: 1,
          retrieved_at: '2026-10-14T11:00:25Z',
          duration_ms: 5000,
        },
        {
          id: `sr-${brandId}-tg`,
          scan_id: `scan-${brandId}`,
          source_key: 'social:telegram',
          source_name: 'Telegram',
          status: 'ok',
          simulated: false,
          message: 'Retrieved 52 candidates from public bot directories.',
          candidates_returned: 52,
          attempts: 1,
          retrieved_at: '2026-10-14T11:00:30Z',
          duration_ms: 5000,
        },
        {
          id: `sr-${brandId}-yt`,
          scan_id: `scan-${brandId}`,
          source_key: 'social:youtube',
          source_name: 'YouTube',
          status: 'ok',
          simulated: false,
          message: 'Retrieved 38 channel candidates.',
          candidates_returned: 38,
          attempts: 1,
          retrieved_at: '2026-10-14T11:00:34Z',
          duration_ms: 4000,
        },
        {
          id: `sr-${brandId}-play`,
          scan_id: `scan-${brandId}`,
          source_key: 'apps:google_play',
          source_name: 'Google Play',
          status: 'ok',
          simulated: false,
          message: 'Retrieved 70 package candidates.',
          candidates_returned: 70,
          attempts: 1,
          retrieved_at: '2026-10-14T11:00:38Z',
          duration_ms: 4000,
        },
        {
          id: `sr-${brandId}-ios`,
          scan_id: `scan-${brandId}`,
          source_key: 'apps:apple_app_store',
          source_name: 'App Store',
          status: 'ok',
          simulated: false,
          message: 'Retrieved 47 candidates.',
          candidates_returned: 47,
          attempts: 1,
          retrieved_at: '2026-10-14T11:00:42Z',
          duration_ms: 4000,
        },
      ],
    },
  ];

  const scans: ScanRun[] = [
    ...buildBrandScans('b-veltrix', 3, 1, 0),
    ...buildBrandScans('b-marigold', 4, 1, 2),
    ...buildBrandScans('b-orbyte', 2, 1, 0),
    ...buildBrandScans('b-nexabank', 3, 0, 0),
    ...buildBrandScans('b-aether', 2, 0, 0),
    ...buildBrandScans('b-solaris', 2, 1, 0),
  ];

  const datasets: DatasetBatch[] = [
    {
      id: 'ds-1',
      name: 'Simulated Social Candidates (2026-Q4)',
      kind: 'social',
      data_origin: 'simulated',
      brand_id: 'b-veltrix',
      record_count: 195,
      created_at: '2026-10-14T08:00:00Z',
    },
    {
      id: 'ds-2',
      name: 'Simulated App Store Candidates (2026-Q4)',
      kind: 'app',
      data_origin: 'simulated',
      brand_id: 'b-veltrix',
      record_count: 117,
      created_at: '2026-10-14T08:30:00Z',
    },
    {
      id: 'ds-3',
      name: 'Imported Partner Triage CSV',
      kind: 'mixed',
      data_origin: 'imported',
      record_count: 42,
      created_at: '2026-10-13T14:00:00Z',
    },
  ];

  const sources: SourceInfo[] = [
    {
      key: 'social:instagram',
      display_name: 'Instagram',
      kind: 'social',
      mode: 'live',
      enabled: true,
      limits: 'Meta Graph API verified endpoint; scraping prohibited.',
      last_status: 'ok',
      last_success_at: '2026-10-14T11:01:52Z',
      candidates_count: 62,
      note: 'Monitors public business profiles, homoglyph handles, and bio links.',
    },
    {
      key: 'social:x',
      display_name: 'X',
      kind: 'social',
      mode: 'live',
      enabled: true,
      limits: 'X Enterprise v2 API stream; complaint interception detection active.',
      last_status: 'ok',
      last_success_at: '2026-10-14T11:01:54Z',
      candidates_count: 58,
      note: 'Evaluated against verified profile snapshots and support handle clones.',
    },
    {
      key: 'social:facebook',
      display_name: 'Facebook',
      kind: 'social',
      mode: 'live',
      enabled: true,
      limits: 'Meta Pages API and Brand Rights Protection stream.',
      last_status: 'ok',
      last_success_at: '2026-10-14T11:01:58Z',
      candidates_count: 44,
      note: 'Scans fraudulent franchise pages and unverified business groups.',
    },
    {
      key: 'social:linkedin',
      display_name: 'LinkedIn',
      kind: 'social',
      mode: 'live',
      enabled: true,
      limits: 'LinkedIn Company Pages API partner access.',
      last_status: 'ok',
      last_success_at: '2026-10-14T11:02:02Z',
      candidates_count: 31,
      note: 'Monitors fake recruitment schemes, executive impersonation, and vendor pages.',
    },
    {
      key: 'social:telegram',
      display_name: 'Telegram',
      kind: 'social',
      mode: 'live',
      enabled: true,
      limits: 'Official Telegram Bot API & public channel indexer.',
      last_status: 'ok',
      last_success_at: '2026-10-14T11:02:05Z',
      candidates_count: 52,
      note: 'Detects rogue customer service bots, phishing refund portals, and unauthorized channels.',
    },
    {
      key: 'social:youtube',
      display_name: 'YouTube',
      kind: 'social',
      mode: 'live',
      enabled: true,
      limits: 'YouTube Data API v3 channel handle and video search.',
      last_status: 'ok',
      last_success_at: '2026-10-14T11:02:06Z',
      candidates_count: 38,
      note: 'Surveils channel usernames, verified badges, and description links.',
    },
    {
      key: 'apps:google_play',
      display_name: 'Google Play',
      kind: 'app',
      mode: 'live',
      enabled: true,
      limits: 'Package dumps, developer verification, and Google Play index.',
      last_status: 'ok',
      last_success_at: '2026-10-14T11:02:08Z',
      candidates_count: 70,
      note: 'Detects rogue APK clones, package typosquatting, and adware loaders.',
    },
    {
      key: 'apps:apple_app_store',
      display_name: 'App Store',
      kind: 'app',
      mode: 'live',
      enabled: true,
      limits: 'Official Apple iTunes Search API adapter enabled.',
      last_status: 'ok',
      last_success_at: '2026-10-14T11:02:14Z',
      candidates_count: 47,
      note: 'Surveils iOS bundle identifiers, publisher names, and unauthorized companion apps.',
    },
  ];

  const evaluation: EvaluationMetrics = {
    flagged: {
      tp: 47,
      fp: 2,
      fn: 5,
      tn: 258,
      precision: 0.959,
      recall: 0.904,
      fpr: 0.008,
    },
    review: {
      tp: 52,
      fp: 6,
      fn: 0,
      tn: 254,
      precision: 0.897,
      recall: 1.0,
      fpr: 0.023,
    },
    exclusions: {
      official_set_aside: 48,
      accidental_exclusions: 0,
      correctness: 1.0,
    },
    hard_negatives: {
      tested: 9,
      flagged: 0,
      passed: 9,
    },
    technique_recall: [
      { technique: 'Homoglyph substitution', recall: 0.96, tested: 25, detected: 24 },
      { technique: 'Insertion / Deletion', recall: 0.92, tested: 26, detected: 24 },
      { technique: 'Adjacent transposition', recall: 0.95, tested: 20, detected: 19 },
      { technique: 'Leetspeak character swap', recall: 0.94, tested: 18, detected: 17 },
      { technique: 'Added word affix', recall: 0.88, tested: 25, detected: 22 },
    ],
    disclaimer:
      'Metrics computed against ground-truth labelled synthetic datasets. Performance on novel evasions may vary depending on platform data access.',
  };

  return {
    brands,
    activeBrandId: 'b-veltrix',
    assets,
    findings,
    exclusions,
    scans,
    datasets,
    sources,
    evaluation,
  };
}

class StoreService {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Ensure that b-marigold has findings and that we have all 6 brands
        const hasMarigoldFindings = parsed.findings?.some((f: any) => f.brand_id === 'b-marigold');
        const hasAllBrands = parsed.brands?.length >= 6;
        if (hasMarigoldFindings && hasAllBrands) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    const fresh = createInitialState();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
    return fresh;
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) {
      fn();
    }
  }

  public getState(): AppState {
    return this.state;
  }

  public resetToDemo(): void {
    this.state = createInitialState();
    this.saveState();
  }

  public setActiveBrand(id: string): void {
    if (this.state.brands.some((b) => b.id === id)) {
      this.state.activeBrandId = id;
      this.saveState();
    }
  }

  public getActiveBrand(): Brand | undefined {
    return this.state.brands.find((b) => b.id === this.state.activeBrandId) || this.state.brands[0];
  }

  public addBrand(name: string, domain?: string, description?: string, aliases: string[] = []): Brand {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newBrand: Brand = {
      id: `b-${Date.now()}`,
      name,
      slug,
      domain: domain || '',
      description: description || '',
      logo_url: createBrandLogoSvg(name, 'official'),
      aliases,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.brands.push(newBrand);
    this.state.activeBrandId = newBrand.id;
    this.saveState();
    return newBrand;
  }

  public updateBrand(id: string, updates: Partial<Brand>): void {
    const brand = this.state.brands.find((b) => b.id === id);
    if (brand) {
      Object.assign(brand, updates, { updated_at: new Date().toISOString() });
      this.saveState();
    }
  }

  public addOfficialAsset(asset: Omit<OfficialAsset, 'id' | 'created_at' | 'verification_status'>): OfficialAsset {
    const newAsset: OfficialAsset = {
      ...asset,
      id: `ast-${Date.now()}`,
      verification_status: 'registered',
      created_at: new Date().toISOString(),
    };
    this.state.assets.push(newAsset);
    this.saveState();
    return newAsset;
  }

  public removeOfficialAsset(id: string): void {
    this.state.assets = this.state.assets.filter((a) => a.id !== id);
    this.saveState();
  }

  public verifyAsset(id: string, method: 'domain_link' | 'manual', note?: string): { success: boolean; message: string } {
    const asset = this.state.assets.find((a) => a.id === id);
    if (!asset) return { success: false, message: 'Asset not found.' };

    const brand = this.state.brands.find((b) => b.id === asset.brand_id);
    if (method === 'domain_link') {
      const hasDomainLink =
        brand?.domain &&
        (asset.bio_links?.some((l) => l.includes(brand.domain)) ||
          asset.store_url?.includes(brand.domain));
      if (!hasDomainLink) {
        return {
          success: false,
          message: `Profile bio or app link must reference ${brand?.domain || 'the registered domain'} to verify automatically.`,
        };
      }
    }

    asset.verification_status = 'verified';
    asset.verification_method = method;
    asset.verification_note =
      note ||
      (method === 'domain_link'
        ? `Verified against registered domain ${brand?.domain}`
        : 'Manually verified by analyst');
    asset.verified_at = new Date().toISOString();
    this.saveState();
    return { success: true, message: 'Asset successfully verified.' };
  }

  public updateFindingReview(
    findingId: string,
    status: ReviewStatus,
    note: string,
    expectedVersion: number
  ): { success: boolean; error?: string } {
    const finding = this.state.findings.find((f) => f.id === findingId);
    if (!finding) return { success: false, error: 'Finding not found.' };

    if (finding.version !== expectedVersion) {
      return {
        success: false,
        error: 'This finding was updated elsewhere. It has been reloaded.',
      };
    }

    if ((status === 'confirmed' || status === 'false_positive') && !note.trim()) {
      return {
        success: false,
        error: 'Add a note before confirming. It becomes part of the audit trail.',
      };
    }

    const reviewer = getStoredReviewer();
    finding.review_events.push({
      id: `re-${Date.now()}`,
      finding_id: finding.id,
      from_status: finding.review_status,
      to_status: status,
      note: note.trim(),
      reviewer,
      created_at: new Date().toISOString(),
    });

    finding.review_status = status;
    finding.review_note = note.trim();
    finding.version = (finding.version ?? 1) + 1;
    this.saveState();
    return { success: true };
  }

  public bulkMarkFindingsAsIgnored(
    findingIds: string[],
    note?: string
  ): { success: boolean; count: number } {
    const reviewer = getStoredReviewer();
    const idSet = new Set(findingIds);
    let count = 0;
    const timestamp = new Date().toISOString();

    for (const f of this.state.findings) {
      if (idSet.has(f.id)) {
        const prevBand = f.band;
        f.band = 'ignored';
        f.version = (f.version ?? 1) + 1;
        if (!f.review_events) f.review_events = [];
        f.review_events.push({
          id: `re-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          finding_id: f.id,
          from_status: f.review_status,
          to_status: f.review_status,
          note: note?.trim() || `Bulk triaged: Band shifted from ${prevBand} to ignored.`,
          reviewer,
          created_at: timestamp,
        });
        count++;
      }
    }

    if (count > 0) {
      this.saveState();
    }

    return { success: true, count };
  }

  public bulkEscalateFindingsToHigh(
    findingIds: string[],
    note?: string
  ): { success: boolean; count: number } {
    const reviewer = getStoredReviewer();
    const idSet = new Set(findingIds);
    let count = 0;
    const timestamp = new Date().toISOString();

    for (const f of this.state.findings) {
      if (idSet.has(f.id)) {
        const prevBand = f.band;
        f.band = 'high';
        if (typeof f.score === 'number' && f.score < 75) {
          f.score = Math.max(85, f.score);
        }
        f.version = (f.version ?? 1) + 1;
        if (!f.review_events) f.review_events = [];
        f.review_events.push({
          id: `re-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          finding_id: f.id,
          from_status: f.review_status,
          to_status: f.review_status === 'new' ? 'under_review' : f.review_status,
          note: note?.trim() || `Bulk escalated: Band promoted from ${prevBand} to high priority alert.`,
          reviewer,
          created_at: timestamp,
        });
        if (f.review_status === 'new') {
          f.review_status = 'under_review';
        }
        count++;
      }
    }

    if (count > 0) {
      this.saveState();
    }

    return { success: true, count };
  }

  public runScan(
    brandId: string,
    sources: string[],
    datasetId?: string,
    simulateFailures?: Record<string, string>
  ): ScanRun {
    const brand = this.state.brands.find((b) => b.id === brandId);
    const brandAssets = this.state.assets.filter((a) => a.brand_id === brandId);

    const scanId = Math.random().toString(36).substring(2, 8);
    const hasSimulatedFailure = simulateFailures && Object.keys(simulateFailures).length > 0;
    const isTotalFailure = hasSimulatedFailure && sources.every((s) => simulateFailures[s] === 'failed');

    let finalStatus: 'completed' | 'partial' | 'failed' = 'completed';
    if (isTotalFailure) {
      finalStatus = 'failed';
    } else if (hasSimulatedFailure) {
      finalStatus = 'partial';
    }

    const newScan: ScanRun = {
      id: scanId,
      brand_id: brandId,
      status: 'running',
      requested_sources: sources,
      simulate_failures: simulateFailures,
      engine_version: '1.0.3',
      rules_version: '1.0.3-a41c9e07',
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      progress: {
        stage: 'collect',
        stage_label: 'Collecting candidates across requested sources',
        done: 45,
        total: 312,
      },
      stats: {
        candidates_seen: 312,
        duplicates_dropped: 0,
        malformed_dropped: 0,
        excluded_official: brandAssets.length,
        evaluated: 312 - brandAssets.length,
        by_band: {
          ignored: 295,
          needs_review: 5,
          medium: 4,
          high: 3,
        },
        by_kind: {
          social: 195,
          app: 117,
        },
        sources_ok: sources.length - (hasSimulatedFailure ? Object.keys(simulateFailures).length : 0),
        sources_failed: hasSimulatedFailure ? Object.keys(simulateFailures).length : 0,
      },
      source_results: sources.map((s, idx) => {
        const sim = simulateFailures?.[s];
        const sourceName = s.split(':')[1]?.replace(/_/g, ' ') || s;
        if (sim) {
          return {
            id: `sr-${Date.now()}-${idx}`,
            scan_id: scanId,
            source_key: s,
            source_name: sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
            status: sim as any,
            simulated: true,
            message: `Simulated error condition: ${sim}. Retried twice with delay before isolating.`,
            candidates_returned: 0,
            attempts: 3,
            retrieved_at: new Date().toISOString(),
            duration_ms: 12000,
          };
        }
        return {
          id: `sr-${Date.now()}-${idx}`,
          scan_id: scanId,
          source_key: s,
          source_name: sourceName.charAt(0).toUpperCase() + sourceName.slice(1),
          status: 'ok',
          simulated: false,
          message: `Successfully processed batch records for ${sourceName}.`,
          candidates_returned: 52,
          attempts: 1,
          retrieved_at: new Date().toISOString(),
          duration_ms: 8000 + idx * 2000,
        };
      }),
    };

    this.state.scans.unshift(newScan);
    this.saveState();

    // Advance scan asynchronously through stages
    setTimeout(() => {
      newScan.progress = {
        stage: 'exclusions',
        stage_label: 'Setting aside verified official assets',
        done: 180,
        total: 312,
      };
      this.saveState();
    }, 1000);

    setTimeout(() => {
      newScan.progress = {
        stage: 'scoring',
        stage_label: 'Comparing candidates against registered baselines',
        done: 280,
        total: 312,
      };
      this.saveState();
    }, 2200);

    setTimeout(() => {
      newScan.status = finalStatus;
      newScan.finished_at = new Date().toISOString();
      newScan.duration_ms = 4500;
      newScan.progress = {
        stage: 'done',
        stage_label: finalStatus === 'completed' ? 'Complete' : finalStatus === 'partial' ? 'Partial complete' : 'Failed',
        done: 312,
        total: 312,
      };
      if (finalStatus === 'failed') {
        newScan.error_message = 'No source returned data, so this scan did not complete.';
      } else if (brand && this.state.findings.filter((f) => f.brand_id === brandId).length === 0) {
        // Automatically generate realistic discovered candidates for this new brand!
        const brandNear = createBrandLogoSvg(brand.name, 'impersonator_near');
        const primaryAsset = brandAssets[0];
        const officialName = brand.name;
        const officialHandle = primaryAsset?.handle || brand.slug.replace(/-/g, '');
        const officialDomain = brand.domain || `${brand.slug}.com`;
        const officialLogo = brand.logo_url;

        const generatedFindings: Finding[] = [
          {
            id: `fnd-${brand.id}-1`,
            scan_id: scanId,
            brand_id: brandId,
            kind: 'social',
            platform_or_store: 'instagram',
            score: 93,
            band: 'high',
            coverage_available: 5,
            coverage_total: 5,
            summary: `High risk: exact name mimicry, logo match, claims official promotion status and redirects to unverified portal https://${brand.slug}-offers.com.`,
            summary_short: `Exact brand name, cloned logo, phishing link to ${brand.slug}-offers.com`,
            next_step: 'Issue immediate trademark takedown to Meta Enterprise Brand Rights desk.',
            matched_asset_id: primaryAsset?.id || `ast-${brand.id}-ig`,
            review_status: 'new',
            version: 1,
            signals: [
              { key: 'name', label: 'Name matching', weight: 0.35, raw_score: 96, score: 0.96, contribution: 33.6, available: true, reason: `Exact brand mark "${officialName}" with deceptive rewards suffix.` },
              { key: 'logo', label: 'Logo similarity', weight: 0.25, raw_score: 94, score: 0.94, contribution: 23.5, available: true, reason: 'Near-identical vector badge with shifted hue.' },
              { key: 'bio', label: 'Bio & link analysis', weight: 0.20, raw_score: 90, score: 0.90, contribution: 18.0, available: true, reason: `Directs users off-domain to https://${brand.slug}-offers.com.` },
              { key: 'conflict', label: 'Account ID mismatch', weight: 0.10, raw_score: 100, score: 1.0, contribution: 10.0, available: true, reason: 'External ID does not match registered brand asset baseline.' },
              { key: 'scam', label: 'Scam language detection', weight: 0.10, raw_score: 80, score: 0.80, contribution: 8.0, available: true, reason: 'Promotes "100% instant cash bonus on registration".' },
            ],
            candidate: {
              id: `cand-${brand.id}-1`,
              name: `${officialName} Official Rewards`,
              handle_or_package: `${officialHandle}_promo`,
              platform_or_store: 'instagram',
              external_id: `ig-fake-${brand.id}`,
              bio_or_desc: `Official festival rewards & bonuses for ${officialName} users. Verify credentials: https://${brand.slug}-offers.com`,
              links: [`https://${brand.slug}-offers.com`],
              logo_url: brandNear,
            },
            official: {
              id: `off-${brand.id}-1`,
              name: officialName,
              handle_or_package: officialHandle,
              platform_or_store: 'instagram',
              external_id: primaryAsset?.external_id || `ig-${brand.id}`,
              bio_or_desc: `Official verified account of ${officialName}. Verified portal: https://${officialDomain}`,
              links: [`https://${officialDomain}`],
              logo_url: officialLogo,
            },
            techniques: [
              { technique: 'added_word', title: 'Added word affix', evidence: 'Appended keywords "_promo" and "Rewards".' },
            ],
            gates_applied: [],
            engine_version: '1.0.3',
            rules_version: '1.0.3-a41c9e07',
            first_seen_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            data_origin: 'simulated',
            review_events: [],
          },
          {
            id: `fnd-${brand.id}-2`,
            scan_id: scanId,
            brand_id: brandId,
            kind: 'social',
            platform_or_store: 'x',
            score: 87,
            band: 'high',
            coverage_available: 5,
            coverage_total: 5,
            summary: `High risk: homoglyph typosquatting handle (@${officialHandle.includes('i') ? officialHandle.replace('i', 'l') : `${officialHandle}_care`}) hijacking complaints and asking for phone numbers.`,
            summary_short: `Homoglyph handle (@${officialHandle.includes('i') ? officialHandle.replace('i', 'l') : `${officialHandle}_care`}) soliciting user verification DMs`,
            next_step: 'Submit imposter report via X Brand Safety API.',
            matched_asset_id: primaryAsset?.id || `ast-${brand.id}-x`,
            review_status: 'new',
            version: 1,
            signals: [
              { key: 'name', label: 'Name matching', weight: 0.35, raw_score: 90, score: 0.90, contribution: 31.5, available: true, reason: 'Homoglyph character substitution in username.' },
              { key: 'logo', label: 'Logo similarity', weight: 0.25, raw_score: 88, score: 0.88, contribution: 22.0, available: true, reason: 'Uses official emblem.' },
              { key: 'bio', label: 'Bio & link analysis', weight: 0.20, raw_score: 85, score: 0.85, contribution: 17.0, available: true, reason: 'Claims 24x7 customer support with third-party WhatsApp chat.' },
              { key: 'conflict', label: 'Account ID mismatch', weight: 0.10, raw_score: 100, score: 1.0, contribution: 10.0, available: true, reason: 'Unregistered account ID.' },
              { key: 'scam', label: 'Scam language detection', weight: 0.10, raw_score: 65, score: 0.65, contribution: 6.5, available: true, reason: 'Requests customer account numbers over DM.' },
            ],
            candidate: {
              id: `cand-${brand.id}-2`,
              name: `${officialName} Support Desk`,
              handle_or_package: officialHandle.includes('i') ? officialHandle.replace('i', 'l') : `${officialHandle}_care`,
              platform_or_store: 'x',
              external_id: `x-fake-${brand.id}`,
              bio_or_desc: `24x7 Customer Escalation Desk for ${officialName}. DM your transaction ID and phone for instant resolution.`,
              links: ['https://wa.me/919988776655'],
              logo_url: brandNear,
            },
            official: {
              id: `off-${brand.id}-2`,
              name: officialName,
              handle_or_package: officialHandle,
              platform_or_store: 'x',
              external_id: `x-${brand.id}`,
              bio_or_desc: `Official corporate updates and announcements for ${officialName}.`,
              links: [`https://${officialDomain}`],
              logo_url: officialLogo,
            },
            techniques: [
              { technique: 'homoglyph_substitution', title: 'Homoglyph substitution', evidence: 'Replaced character in handle with lookalike glyph.' },
            ],
            gates_applied: [],
            engine_version: '1.0.3',
            rules_version: '1.0.3-a41c9e07',
            first_seen_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            data_origin: 'simulated',
            review_events: [],
          },
          {
            id: `fnd-${brand.id}-3`,
            scan_id: scanId,
            brand_id: brandId,
            kind: 'social',
            platform_or_store: 'linkedin',
            score: 48,
            band: 'needs_review',
            coverage_available: 5,
            coverage_total: 5,
            summary: `Needs review: third-party recruiting firm posting job openings using "${officialName}" without verified partner accreditation. Likely legitimate vendor (False Positive candidate).`,
            summary_short: `Recruitment agency posting driver vacancies; potential legitimate partner`,
            next_step: 'Verify vendor partnership agreement with talent acquisition.',
            matched_asset_id: primaryAsset?.id || `ast-${brand.id}-li`,
            review_status: 'new',
            version: 1,
            signals: [
              { key: 'name', label: 'Name matching', weight: 0.35, raw_score: 68, score: 0.68, contribution: 23.8, available: true, reason: 'Staffing post contains brand name.' },
              { key: 'logo', label: 'Logo similarity', weight: 0.25, raw_score: 45, score: 0.45, contribution: 11.25, available: true, reason: 'Generic clip art badge.' },
              { key: 'bio', label: 'Bio & link analysis', weight: 0.20, raw_score: 40, score: 0.40, contribution: 8.0, available: true, reason: 'Standard job application form link.' },
              { key: 'conflict', label: 'Account ID mismatch', weight: 0.10, raw_score: 40, score: 0.40, contribution: 4.0, available: true, reason: 'Separate company profile.' },
              { key: 'scam', label: 'Scam language detection', weight: 0.10, raw_score: 10, score: 0.10, contribution: 1.0, available: true, reason: 'Standard hourly wage listings.' },
            ],
            candidate: {
              id: `cand-${brand.id}-3`,
              name: `${officialName} Delivery Staffing`,
              handle_or_package: `${brand.slug}-rider-recruiting`,
              platform_or_store: 'linkedin',
              bio_or_desc: `Urgent hiring: logistics and delivery associates for ${officialName} service hubs. Weekly payouts.`,
              logo_url: brandNear,
            },
            official: {
              id: `off-${brand.id}-3`,
              name: officialName,
              handle_or_package: officialHandle,
              platform_or_store: 'linkedin',
              external_id: `li-${brand.id}`,
              bio_or_desc: `Official corporate LinkedIn page of ${officialName}.`,
              links: [`https://${officialDomain}`],
              logo_url: officialLogo,
            },
            techniques: [
              { technique: 'added_word', title: 'Added word affix', evidence: 'Staffing keywords appended.' },
            ],
            gates_applied: ['name_only_cap'],
            engine_version: '1.0.3',
            rules_version: '1.0.3-a41c9e07',
            first_seen_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            data_origin: 'simulated',
            review_events: [],
          },
        ];

        this.state.findings.unshift(...generatedFindings);
      }
      this.saveState();
    }, 3500);

    return newScan;
  }

  public importCandidates(batchName: string, kind: 'social' | 'app' | 'mixed', rowCount: number): DatasetBatch {
    const newBatch: DatasetBatch = {
      id: `ds-${Date.now()}`,
      name: batchName,
      kind,
      data_origin: 'imported',
      brand_id: this.state.activeBrandId,
      record_count: rowCount,
      created_at: new Date().toISOString(),
    };
    this.state.datasets.unshift(newBatch);
    this.saveState();
    return newBatch;
  }
}

export const store = new StoreService();
