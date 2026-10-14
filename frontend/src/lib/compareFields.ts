/**
 * Compares two string fields and returns comparison category:
 * 'Same' | 'Similar' | 'Differs' | 'Not provided'
 */
export function compareFieldValues(
  official: string | undefined | null,
  candidate: string | undefined | null,
  isExactIdentifier: boolean = false
): 'Same' | 'Similar' | 'Differs' | 'Not provided' {
  if (!candidate || candidate.trim() === '') {
    return 'Not provided';
  }
  if (!official || official.trim() === '') {
    return 'Not provided';
  }

  const normOff = official.trim().toLowerCase();
  const normCand = candidate.trim().toLowerCase();

  if (normOff === normCand) {
    return 'Same';
  }

  // Identifiers (handles, package IDs, account IDs) can only be Same or Differs
  if (isExactIdentifier) {
    return 'Differs';
  }

  // For text/names/bios, check if substrings or token sets overlap
  const tokensOff = new Set(normOff.split(/[\s_.-]+/));
  const tokensCand = new Set(normCand.split(/[\s_.-]+/));
  let overlap = 0;
  for (const t of tokensCand) {
    if (tokensOff.has(t)) overlap++;
  }

  if (overlap > 0 || normCand.includes(normOff) || normOff.includes(normCand)) {
    return 'Similar';
  }

  return 'Differs';
}
