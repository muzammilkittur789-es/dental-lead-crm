import type { Clinic, DuplicateMatch } from '../types/clinic';

/**
 * Normalizes phone numbers:
 * Strips all non-digit characters, and standardizes Indian prefixes (+91, 0).
 * Compares the significant digits (last 10 digits for mobile/STD, or clean digits).
 */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If Indian 12-digit number starting with 91, extract the 10 digits
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }

  // If 11 digits starting with 0 (e.g. 09876543210 or STD 08012345678)
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  // If >= 10 digits, use last 10 digits
  if (digits.length >= 10) {
    return digits.slice(-10);
  }

  return digits;
}

/**
 * Normalizes a clinic name for fuzzy comparison:
 * Lowercases, removes punctuation, and strips common dental filler words.
 */
export function normalizeClinicName(name: string): string {
  if (!name) return '';

  let normalized = name.toLowerCase().trim();

  // Remove common punctuation and special characters
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');

  // Common dental filler terms in Indian clinic names
  const stopWords = [
    'multispeciality dental clinic',
    'multispeciality dental care',
    'multispeciality dental center',
    'multispeciality clinic',
    'multispecialty dental clinic',
    'multispecialty clinic',
    'super speciality dental',
    'dental clinic',
    'dental care',
    'dental hospital',
    'dental studio',
    'dental centre',
    'dental center',
    'dental solutions',
    'dental lounge',
    'dental spa',
    'dentistry',
    'dentist',
    'dentocare',
    'clinic',
    'hospital',
    'centre',
    'center',
    'dr',
    'the'
  ];

  for (const word of stopWords) {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }

  // Collapse multiple spaces
  return normalized.replace(/\s+/g, ' ').trim();
}

/**
 * Calculates string similarity using Levenshtein distance normalized (0 to 1)
 */
export function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  const costs: number[] = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }

  return (longer.length - costs[shorter.length]) / longer.length;
}

/**
 * Checks a new or edited clinic against existing clinics to find potential duplicates.
 * Returns an array of matching clinics with reasons.
 */
export function findDuplicates(
  target: { name: string; phone?: string; city?: string; locality?: string; id?: string },
  allClinics: Clinic[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  const targetNormPhone = normalizePhone(target.phone);
  const targetNormName = normalizeClinicName(target.name);
  const targetRawName = target.name.trim().toLowerCase();

  for (const clinic of allClinics) {
    // Skip self when updating
    if (target.id && clinic.id === target.id) {
      continue;
    }

    const clinicNormPhone = normalizePhone(clinic.phone);
    const clinicNormName = normalizeClinicName(clinic.name);
    const clinicRawName = clinic.name.trim().toLowerCase();

    const isPhoneMatch =
      Boolean(targetNormPhone) &&
      Boolean(clinicNormPhone) &&
      targetNormPhone.length >= 7 &&
      targetNormPhone === clinicNormPhone;

    // Check exact raw name match
    const isExactNameMatch = targetRawName === clinicRawName;

    // Check normalized dental name match (e.g. "Apex Dental" vs "Apex Dental Clinic")
    const isNormNameMatch =
      Boolean(targetNormName) &&
      Boolean(clinicNormName) &&
      targetNormName === clinicNormName;

    // Check fuzzy similarity on normalized names
    const similarity =
      targetNormName && clinicNormName
        ? calculateSimilarity(targetNormName, clinicNormName)
        : 0;

    const isFuzzyNameMatch = similarity >= 0.85;

    // Same city/locality increases confidence
    const targetCityTrim = target.city ? target.city.trim().toLowerCase() : '';
    const clinicCityTrim = clinic.city ? clinic.city.trim().toLowerCase() : '';
    const sameCity = Boolean(targetCityTrim) && Boolean(clinicCityTrim) && targetCityTrim === clinicCityTrim;

    if (isPhoneMatch && (isExactNameMatch || isNormNameMatch || isFuzzyNameMatch)) {
      matches.push({
        clinic,
        matchReason: 'both',
        similarityScore: 1.0,
      });
    } else if (isPhoneMatch) {
      matches.push({
        clinic,
        matchReason: 'phone',
        similarityScore: 0.95,
      });
    } else if (isExactNameMatch) {
      matches.push({
        clinic,
        matchReason: 'name',
        similarityScore: 0.95,
      });
    } else if (isNormNameMatch && (sameCity || !targetCityTrim)) {
      matches.push({
        clinic,
        matchReason: 'name',
        similarityScore: 0.9,
      });
    } else if (isFuzzyNameMatch && sameCity) {
      matches.push({
        clinic,
        matchReason: 'name',
        similarityScore: similarity,
      });
    }
  }

  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}
