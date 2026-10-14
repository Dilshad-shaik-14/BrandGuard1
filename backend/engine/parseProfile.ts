import { PlatformOrStore } from '../types/brandguard';

export interface ParsedProfile {
  platform?: PlatformOrStore;
  handle?: string;
  package_id?: string;
  error?: string;
  previewText?: string;
}

export function parseProfileInput(input: string, selectedPlatform?: PlatformOrStore): ParsedProfile {
  const trimmed = input.trim();
  if (!trimmed) {
    return {};
  }

  // 1. Google Play URL parsing
  if (trimmed.includes('play.google.com')) {
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const pkg = url.searchParams.get('id');
      if (pkg) {
        const validPkg = /^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(pkg);
        return {
          platform: 'google_play',
          package_id: pkg,
          previewText: `Parsed as Google Play, package ${pkg}`,
          error: validPkg ? undefined : 'Invalid package ID format in Google Play URL.',
        };
      }
    } catch {
      // not a standard URL, continue
    }
  }

  // 2. Apple App Store URL parsing
  if (trimmed.includes('apps.apple.com') || trimmed.includes('itunes.apple.com')) {
    const idMatch = trimmed.match(/\/id(\d+)/i);
    if (idMatch && idMatch[1]) {
      return {
        platform: 'apple_app_store',
        package_id: `id${idMatch[1]}`,
        previewText: `Parsed as App Store, ID ${idMatch[1]}`,
      };
    }
  }

  // 3. Social platform URL patterns
  const urlPatterns: Array<{ regex: RegExp; platform: PlatformOrStore; label: string }> = [
    { regex: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/i, platform: 'instagram', label: 'Instagram' },
    { regex: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i, platform: 'x', label: 'X' },
    { regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9._-]+)/i, platform: 'facebook', label: 'Facebook' },
    { regex: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9._-]+)/i, platform: 'linkedin', label: 'LinkedIn' },
    { regex: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|channel\/|c\/)?([a-zA-Z0-9._-]+)/i, platform: 'youtube', label: 'YouTube' },
    { regex: /(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9._-]+)/i, platform: 'telegram', label: 'Telegram' },
  ];

  for (const { regex, platform, label } of urlPatterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      const handle = match[1].toLowerCase().replace(/^@/, '');
      const validationError = validateHandle(platform, handle);
      return {
        platform,
        handle,
        previewText: `Parsed as ${label}, handle ${handle}`,
        error: validationError,
      };
    }
  }

  // 4. Raw handle or package ID input
  const platform = selectedPlatform || 'instagram';
  const clean = trimmed.toLowerCase().replace(/^@/, '');

  if (platform === 'google_play' || platform === 'apple_app_store') {
    return {
      platform,
      package_id: clean,
      previewText: `Entered as ${platform === 'google_play' ? 'Google Play' : 'App Store'} ID: ${clean}`,
    };
  }

  const validationError = validateHandle(platform, clean);
  const platformLabel = platform === 'x' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1);

  return {
    platform,
    handle: clean,
    previewText: `Parsed as ${platformLabel}, handle ${clean}`,
    error: validationError,
  };
}

export function validateHandle(platform: PlatformOrStore, handle: string): string | undefined {
  if (!handle) return 'Handle cannot be empty.';

  if (platform === 'instagram') {
    if (handle.length > 30) return 'Instagram handles cannot exceed 30 characters.';
    if (!/^[a-z0-9._]+$/.test(handle)) {
      return 'Instagram handles can use letters, numbers, periods and underscores, up to 30 characters. Remove spaces or disallowed symbols.';
    }
  } else if (platform === 'x') {
    if (handle.length > 15) return 'X handles cannot exceed 15 characters.';
    if (!/^[a-z0-9_]+$/.test(handle)) {
      return 'X handles can use letters, numbers and underscores, up to 15 characters.';
    }
  } else if (['facebook', 'linkedin', 'youtube', 'telegram'].includes(platform)) {
    if (handle.length < 2 || handle.length > 64) {
      return 'Handle must be between 2 and 64 characters.';
    }
    if (!/^[a-z0-9._-]+$/.test(handle)) {
      return 'Handle can contain letters, numbers, periods, dashes and underscores.';
    }
  }

  return undefined;
}
