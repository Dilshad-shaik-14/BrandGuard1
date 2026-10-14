import { LookalikeTechnique, LookalikeVariantItem } from '../types/brandguard';

const AFFIXES = [
  'official', 'support', 'help', 'care', 'secure', 'app', 'india', 'customer',
  'service', 'team', 'rewards', 'offers', 'login', 'verify', 'wallet', 'giveaway',
  'pay', 'global', 'alert', 'desk'
];

const LEET_MAP: Record<string, string[]> = {
  '0': ['o'],
  '1': ['l', 'i'],
  '3': ['e'],
  '4': ['a'],
  '5': ['s'],
  '7': ['t'],
  '@': ['a'],
  '$': ['s'],
};

// Reverse leet map for generator
const CHAR_TO_LEET: Record<string, string[]> = {
  'o': ['0'],
  'l': ['1'],
  'i': ['1'],
  'e': ['3'],
  'a': ['4', '@'],
  's': ['5', '$'],
  't': ['7'],
};

export interface LookalikeAnalysisResult {
  candidate_name: string;
  brand_name: string;
  name_score: number;
  techniques: LookalikeTechnique[];
  summary: string;
}

export function analyzeCandidateName(brandName: string, candidateName: string, aliases: string[] = []): LookalikeAnalysisResult {
  const targets = [brandName, ...aliases].filter(Boolean);
  const techniques: LookalikeTechnique[] = [];
  let maxScore = 0;

  if (!candidateName || !brandName) {
    return {
      candidate_name: candidateName,
      brand_name: brandName,
      name_score: 0,
      techniques: [],
      summary: 'No look-alike pattern found. On its name alone, this would not be flagged.',
    };
  }

  for (const target of targets) {
    const detected = detectTechniques(target, candidateName);
    for (const d of detected.techniques) {
      if (!techniques.some(t => t.technique === d.technique)) {
        techniques.push(d);
      }
    }
    if (detected.score > maxScore) {
      maxScore = detected.score;
    }
  }

  // Cap score if no technique detected
  if (techniques.length === 0) {
    maxScore = 0;
  }

  return {
    candidate_name: candidateName,
    brand_name: brandName,
    name_score: Math.round(maxScore * 100) / 100,
    techniques,
    summary: techniques.length > 0
      ? `Detected ${techniques.length} look-alike technique${techniques.length === 1 ? '' : 's'} targeting "${brandName}".`
      : 'No look-alike pattern found. On its name alone, this would not be flagged.',
  };
}

function detectTechniques(target: string, candidate: string): { techniques: LookalikeTechnique[]; score: number } {
  const techniques: LookalikeTechnique[] = [];
  const tNorm = target.trim().toLowerCase();
  const cNorm = candidate.trim().toLowerCase();

  const tCompact = tNorm.replace(/[\s_.-]+/g, '');
  const cCompact = cNorm.replace(/[\s_.-]+/g, '');

  let score = 0;

  // 1. Exact match after normalization / spacing variant
  if (tCompact === cCompact && target !== candidate) {
    if (tNorm === cNorm) {
      techniques.push({
        technique: 'case_variant',
        title: 'Case variant',
        evidence: `Matches brand name with altered capitalization.`,
        strength: 'high',
      });
      score = Math.max(score, 0.95);
    } else {
      techniques.push({
        technique: 'spacing_punctuation_variant',
        title: 'Case, spacing or punctuation variant',
        evidence: `Separators or spacing modified ("${candidate}" vs "${target}").`,
        strength: 'high',
      });
      score = Math.max(score, 0.95);
    }
  }

  // 2. Confusable characters / Mixed script
  const nonAsciiMatches: string[] = [];
  for (const ch of candidate) {
    const cp = ch.codePointAt(0);
    if (cp && cp > 0x7f) {
      const hex = 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
      nonAsciiMatches.push(`'${ch}' ${hex}`);
    }
  }

  if (nonAsciiMatches.length > 0) {
    // Check if replacing confusables matches brand
    techniques.push({
      technique: 'confusable_characters',
      title: 'Look-alike characters',
      evidence: `Contains look-alike character (${nonAsciiMatches.join(', ')}).`,
      code_points: nonAsciiMatches,
      strength: 'high',
    });
    techniques.push({
      technique: 'mixed_script',
      title: 'Mixed scripts in one word',
      evidence: `Single token mixes scripts (${nonAsciiMatches.join(', ')}).`,
      code_points: nonAsciiMatches,
      strength: 'high',
    });
    score = Math.max(score, 0.97);
  }

  // 3. Leetspeak
  let hasLeet = false;
  let deLeeted = cCompact;
  for (const [digit, letters] of Object.entries(LEET_MAP)) {
    if (deLeeted.includes(digit)) {
      hasLeet = true;
      for (const l of letters) {
        if (deLeeted.replaceAll(digit, l) === tCompact) {
          deLeeted = tCompact;
          break;
        }
      }
    }
  }

  if (hasLeet && deLeeted === tCompact) {
    techniques.push({
      technique: 'leetspeak',
      title: 'Look-alike digits or symbols',
      evidence: `Substitutes digits or symbols for letters in "${target}".`,
      strength: 'high',
    });
    score = Math.max(score, 0.92);
  }

  // 4. Added word (affixes)
  const cTokens = cNorm.split(/[\s_.-]+/);
  const tTokens = tNorm.split(/[\s_.-]+/);
  const addedTokens = cTokens.filter(tok => !tTokens.includes(tok));
  const hasBrandToken = tTokens.every(tok => cTokens.includes(tok)) || cCompact.includes(tCompact);

  if (hasBrandToken && addedTokens.length > 0) {
    const knownAffix = addedTokens.find(tok => AFFIXES.includes(tok));
    if (knownAffix) {
      techniques.push({
        technique: 'added_word',
        title: 'Added word',
        evidence: `Added high-risk keyword "${knownAffix}" alongside brand name.`,
        strength: 'high',
      });
      score = Math.max(score, 0.88);
    } else {
      techniques.push({
        technique: 'added_word',
        title: 'Added word',
        evidence: `Added word "${addedTokens.join(' ')}" alongside brand name.`,
        strength: 'medium',
      });
      score = Math.max(score, 0.70);
    }
  }

  // 5. Reordered words
  if (cTokens.length > 1 && cTokens.length === tTokens.length) {
    const sortedC = [...cTokens].sort().join(' ');
    const sortedT = [...tTokens].sort().join(' ');
    if (sortedC === sortedT && cNorm !== tNorm) {
      techniques.push({
        technique: 'reordered_words',
        title: 'Reordered words',
        evidence: `Same brand words arranged in altered order ("${candidate}").`,
        strength: 'medium',
      });
      score = Math.max(score, 0.80);
    }
  }

  // 6. Adjacent transposition / edit distance 1
  if (tCompact.length >= 4) {
    // Check transposition
    let isTransposition = false;
    for (let k = 0; k < tCompact.length - 1; k++) {
      const swapped = tCompact.slice(0, k) + tCompact[k + 1] + tCompact[k] + tCompact.slice(k + 2);
      if (swapped === cCompact) {
        isTransposition = true;
        techniques.push({
          technique: 'adjacent_transposition',
          title: 'Swapped letters',
          evidence: `Transposition: "${tCompact.slice(k, k + 2)}" swapped at position ${k + 1}.`,
          strength: 'high',
        });
        score = Math.max(score, 0.92);
        break;
      }
    }

    if (!isTransposition) {
      const editDist = levenshtein(tCompact, cCompact);
      if (editDist === 1) {
        if (cCompact.length > tCompact.length) {
          techniques.push({
            technique: 'character_insertion',
            title: 'One letter added',
            evidence: `Single extra character inserted into brand name.`,
            strength: 'medium',
          });
        } else if (cCompact.length < tCompact.length) {
          techniques.push({
            technique: 'character_deletion',
            title: 'One letter missing',
            evidence: `Single character missing from brand name.`,
            strength: 'medium',
          });
        } else {
          techniques.push({
            technique: 'character_substitution',
            title: 'One letter changed',
            evidence: `Single character substituted in brand name.`,
            strength: 'medium',
          });
        }
        score = Math.max(score, 0.85);
      } else if (editDist === 2 && tCompact.length >= 7) {
        techniques.push({
          technique: 'two_edit_variant',
          title: 'Two small edits',
          evidence: `Two character changes in brand name.`,
          strength: 'low',
        });
        score = Math.max(score, 0.70);
      }
    }
  }

  return { techniques, score };
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]!;
      } else {
        dp[i]![j] = 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
      }
    }
  }
  return dp[m]![n]!;
}

/**
 * Generates deterministic look-alike variants for a brand
 */
export function generateLookalikeVariants(brandName: string): LookalikeVariantItem[] {
  const variants: LookalikeVariantItem[] = [];
  const clean = brandName.trim();
  const lower = clean.toLowerCase();
  const compact = lower.replace(/[\s_.-]+/g, '');

  // 1. Swapped letters (adjacent transposition)
  for (let i = 0; i < lower.length - 1; i++) {
    if (lower[i] !== lower[i + 1] && lower[i] !== ' ' && lower[i + 1] !== ' ') {
      const swapped = lower.slice(0, i) + lower[i + 1] + lower[i] + lower.slice(i + 2);
      variants.push({
        variant: swapped,
        technique: 'adjacent_transposition',
        technique_title: 'Swapped letters',
        explanation: `Transposition of '${lower[i]}' and '${lower[i + 1]}' at position ${i + 1}.`,
      });
    }
  }

  // 2. Confusable characters
  if (lower.includes('a')) {
    variants.push({
      variant: lower.replace('a', '\u0430'), // Cyrillic small a
      technique: 'confusable_characters',
      technique_title: 'Look-alike characters',
      explanation: "Substituted Latin 'a' with Cyrillic 'а' (U+0430). Visually indistinguishable.",
    });
  }
  if (lower.includes('o')) {
    variants.push({
      variant: lower.replace('o', '\u043E'), // Cyrillic small o
      technique: 'confusable_characters',
      technique_title: 'Look-alike characters',
      explanation: "Substituted Latin 'o' with Cyrillic 'о' (U+043E).",
    });
  }
  if (lower.includes('e')) {
    variants.push({
      variant: lower.replace('e', '\u0435'), // Cyrillic small ie
      technique: 'confusable_characters',
      technique_title: 'Look-alike characters',
      explanation: "Substituted Latin 'e' with Cyrillic 'е' (U+0435).",
    });
  }

  // 3. Leetspeak substitutions
  for (const [ch, leetChars] of Object.entries(CHAR_TO_LEET)) {
    if (lower.includes(ch)) {
      for (const leet of leetChars) {
        variants.push({
          variant: lower.replace(ch, leet),
          technique: 'leetspeak',
          technique_title: 'Look-alike digits or symbols',
          explanation: `Replaced '${ch}' with '${leet}'.`,
        });
      }
    }
  }

  // 4. Added words
  const keyAffixes = ['official', 'support', 'help', 'care', 'rewards', 'wallet', 'india', 'secure'];
  for (const affix of keyAffixes) {
    variants.push({
      variant: `${lower}_${affix}`,
      technique: 'added_word',
      technique_title: 'Added word',
      explanation: `Appended high-risk keyword '${affix}'.`,
    });
    variants.push({
      variant: `${affix}_${lower}`,
      technique: 'added_word',
      technique_title: 'Added word',
      explanation: `Prepended high-risk keyword '${affix}'.`,
    });
  }

  // 5. Spacing and punctuation
  variants.push({
    variant: lower.replace(/\s+/g, '_'),
    technique: 'spacing_punctuation_variant',
    technique_title: 'Case, spacing or punctuation variant',
    explanation: 'Substituted underscores for spaces.',
  });
  variants.push({
    variant: lower.replace(/\s+/g, '.'),
    technique: 'spacing_punctuation_variant',
    technique_title: 'Case, spacing or punctuation variant',
    explanation: 'Substituted periods for spaces.',
  });
  variants.push({
    variant: compact,
    technique: 'spacing_punctuation_variant',
    technique_title: 'Case, spacing or punctuation variant',
    explanation: 'Removed all separators.',
  });

  // 6. Character insertions / deletions
  if (compact.length >= 4) {
    // Repeated character
    variants.push({
      variant: compact + compact[compact.length - 1],
      technique: 'repeated_or_dropped_character',
      technique_title: 'Repeated letter',
      explanation: `Duplicated trailing character '${compact[compact.length - 1]}'.`,
    });
    // Single deletion
    variants.push({
      variant: compact.slice(0, -1),
      technique: 'character_deletion',
      technique_title: 'One letter missing',
      explanation: `Deleted character '${compact[compact.length - 1]}'.`,
    });
  }

  return variants;
}
