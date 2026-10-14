/**
 * In-memory SVG logo generator for BrandGuard official assets and candidates
 * Generates crisp SVG Data URIs matching security-printing and cybersecurity brand marks
 */

const BRAND_PALETTES: Record<string, { bg: string; accent: string }> = {
  'Veltrix Pay': { bg: '#0D9488', accent: '#042F2C' },
  'Marigold Mart': { bg: '#D97706', accent: '#451A03' },
  'Orbyte Health': { bg: '#059669', accent: '#022C22' },
  'NexaBank': { bg: '#4F46E5', accent: '#1E1B4B' },
  'Aether Cloud': { bg: '#0284C7', accent: '#082F49' },
  'Solaris Mobility': { bg: '#CA8A04', accent: '#422006' },
  'Chronos AI': { bg: '#8B5CF6', accent: '#2E1065' },
  'Nordic Stream': { bg: '#EC4899', accent: '#500724' },
  'Apex Quantum Capital': { bg: '#0EA5E9', accent: '#032D60' },
};

export function createBrandLogoSvg(
  brandName: string,
  variant: 'official' | 'impersonator_near' | 'impersonator_shifted' | 'different' = 'official'
): string {
  const initials = brandName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const palette = BRAND_PALETTES[brandName] || { bg: '#0D9488', accent: '#042F2C' };
  let bgColor = palette.bg;
  let accentColor = palette.accent;
  let offsetX = 0;
  let offsetY = 0;
  let badgeText = '';

  if (variant === 'impersonator_near') {
    bgColor = palette.bg;
    accentColor = '#B54708';
    offsetX = 1.5;
  } else if (variant === 'impersonator_shifted') {
    bgColor = '#991B1B'; // Rogue red
    accentColor = '#FEF2F2';
    offsetY = -1;
    badgeText = 'OFFICIAL';
  } else if (variant === 'different') {
    bgColor = '#334155';
    accentColor = '#0F172A';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="grad-${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}" />
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.9" />
      </linearGradient>
    </defs>
    <rect width="160" height="160" rx="20" fill="url(#grad-${initials})"/>
    <g transform="translate(${offsetX}, ${offsetY})">
      <!-- Security Guilloche background circles -->
      <circle cx="80" cy="80" r="56" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>
      <circle cx="80" cy="80" r="44" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
      <circle cx="80" cy="80" r="32" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      
      <!-- Brand geometry: intersecting offset squares -->
      <rect x="52" y="52" width="46" height="46" rx="8" fill="none" stroke="white" stroke-width="3.5"/>
      <rect x="62" y="62" width="46" height="46" rx="8" fill="white" fill-opacity="0.92"/>
      
      <!-- Monogram -->
      <text x="85" y="93" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="22" font-weight="800" fill="${accentColor}" text-anchor="middle">${initials}</text>
    </g>
    ${
      badgeText
        ? `<rect x="34" y="126" width="92" height="22" rx="4" fill="#B42318"/><text x="80" y="141" font-family="-apple-system, sans-serif" font-size="11" font-weight="800" fill="white" text-anchor="middle" letter-spacing="0.5">${badgeText}</text>`
        : ''
    }
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
