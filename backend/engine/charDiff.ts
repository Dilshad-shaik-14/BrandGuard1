/**
 * Character-level diff utility with Unicode script and homoglyph annotations
 */

export interface DiffChar {
  char: string;
  isDiff: boolean;
  codePoint?: string;
  script?: string;
  lookalikeHint?: string;
}

// Common confusable homoglyph notes
const CONFUSABLE_MAP: Record<string, { script: string; looksLike: string }> = {
  '\u0430': { script: 'Cyrillic', looksLike: 'Latin a' }, // Cyrillic small letter a
  '\u0435': { script: 'Cyrillic', looksLike: 'Latin e' }, // Cyrillic small letter ie
  '\u043E': { script: 'Cyrillic', looksLike: 'Latin o' }, // Cyrillic small letter o
  '\u0440': { script: 'Cyrillic', looksLike: 'Latin p' }, // Cyrillic small letter er
  '\u0441': { script: 'Cyrillic', looksLike: 'Latin c' }, // Cyrillic small letter es
  '\u0443': { script: 'Cyrillic', looksLike: 'Latin y' }, // Cyrillic small letter u
  '\u0445': { script: 'Cyrillic', looksLike: 'Latin x' }, // Cyrillic small letter ha
  '\u0456': { script: 'Cyrillic', looksLike: 'Latin i' }, // Cyrillic small letter byelorussian-ukrainian i
  '\u03BF': { script: 'Greek', looksLike: 'Latin o' },    // Greek small letter omicron
  '\u03C1': { script: 'Greek', looksLike: 'Latin p' },    // Greek small letter rho
  '\u03BD': { script: 'Greek', looksLike: 'Latin v' },    // Greek small letter nu
};

/**
 * Longest Common Subsequence based character diff between official string and candidate string
 */
export function computeCharDiff(official: string, candidate: string): DiffChar[] {
  if (!candidate) return [];
  if (!official) {
    return Array.from(candidate).map(ch => inspectChar(ch, true));
  }

  const s1 = Array.from(official.toLowerCase());
  const s2 = Array.from(candidate);
  const s2Lower = Array.from(candidate.toLowerCase());

  // Compute LCS table
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2Lower[j - 1]) {
        dp[i]![j] = (dp[i - 1]![j - 1] || 0) + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]![j] || 0, dp[i]![j - 1] || 0);
      }
    }
  }

  // Backtrack to find matched characters in candidate
  const matchedInCandidate = new Set<number>();
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (s1[i - 1] === s2Lower[j - 1]) {
      matchedInCandidate.add(j - 1);
      i--;
      j--;
    } else if ((dp[i - 1]![j] || 0) >= (dp[i]![j - 1] || 0)) {
      i--;
    } else {
      j--;
    }
  }

  return s2.map((ch, idx) => inspectChar(ch, !matchedInCandidate.has(idx)));
}

function inspectChar(char: string, isDiff: boolean): DiffChar {
  const code = char.codePointAt(0);
  if (!code) {
    return { char, isDiff };
  }

  const hex = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
  
  if (code > 0x7f) {
    const known = CONFUSABLE_MAP[char];
    if (known) {
      return {
        char,
        isDiff: true,
        codePoint: hex,
        script: known.script,
        lookalikeHint: `${known.script} ${char}, ${hex}, looks like ${known.looksLike}`,
      };
    }

    return {
      char,
      isDiff: true,
      codePoint: hex,
      script: 'Non-ASCII',
      lookalikeHint: `Unicode character ${char} (${hex})`,
    };
  }

  return { char, isDiff };
}
