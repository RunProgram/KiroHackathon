import type { ScamType, RedFlag, RiskLevel } from '../types';

/**
 * Input for the subject line generator.
 */
export interface SubjectLineInput {
  inputText: string;
  scamType: ScamType;
  redFlags: RedFlag[];
  riskLevel: RiskLevel;
}

/**
 * Maps every ScamType value to a human-readable entity descriptor.
 * The `unknown` type maps to an empty string so it is omitted from subject lines.
 */
export const SCAM_TYPE_LABELS: Record<ScamType, string> = {
  bank_impersonation: 'Bank impersonation',
  grandparent_scam: 'Family emergency scam',
  medicare_government: 'Government impersonation',
  amazon_delivery: 'Delivery/shopping scam',
  tech_support: 'Tech support scam',
  irs_tax: 'IRS/tax scam',
  lottery_prize: 'Lottery/prize scam',
  romance_scam: 'Romance scam',
  unknown: '',
};

/**
 * Maps a subset of RedFlag values to action descriptor strings.
 * Only the most descriptive flags have labels; others are silently skipped.
 */
export const ACTION_LABELS: Partial<Record<RedFlag, string>> = {
  money_transfer: 'requesting money transfer',
  gift_card: 'asking for gift cards',
  otp_request: 'asking for verification code',
  password_request: 'asking for password',
  ssn_medicare_request: 'requesting personal ID numbers',
  remote_access_request: 'requesting computer access',
  urgency: 'using urgent pressure',
  secrecy: 'demanding secrecy',
};

/**
 * Extracts a clean, human-readable phrase from raw input text.
 *
 * - Returns "Empty message" for empty / whitespace-only input.
 * - Strips leading OCR noise (digits, symbols, whitespace).
 * - Replaces newlines with spaces and collapses consecutive whitespace.
 * - Falls back to the original text (whitespace-normalised) when cleaning
 *   removes all content.
 * - Extracts the first sentence when a sentence boundary appears within
 *   100 characters.
 * - Truncates at the last word boundary before 100 characters and appends
 *   an ellipsis when no sentence boundary is found.
 */
export function extractCleanPhrase(text: string): string {
  // Step 1: Handle empty / whitespace-only input
  const trimmed = text.trim();
  if (trimmed === '') return 'Empty message';

  // Step 2: Remove common OCR noise patterns from the start
  let cleaned = trimmed
    .replace(/^[\d\s\-.,#*=_+|]+/, '') // Leading numbers / symbols
    .replace(/\n+/g, ' ')               // Newlines → spaces
    .replace(/\s{2,}/g, ' ')            // Collapse whitespace
    .trim();

  // Step 3: If cleaning removed everything, fall back to original with normalised whitespace
  if (cleaned === '') {
    cleaned = trimmed.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  // Step 4: Extract first sentence if a boundary is found within 100 characters
  const sentenceEnd = cleaned.search(/[.!?]\s/);
  if (sentenceEnd > 0 && sentenceEnd <= 100) {
    return cleaned.slice(0, sentenceEnd + 1);
  }

  // Step 5: Truncate at word boundary if text exceeds 100 characters
  if (cleaned.length <= 100) return cleaned;

  const truncated = cleaned.slice(0, 100);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 50) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}

/**
 * Produces a human-readable subject line from scam-analysis signals and
 * the original input text.
 *
 * Priority order:
 *  1. Known scam type + action flags  → "{entity} — {action1}, {action2}"
 *  2. Known scam type, no action flags → "{entity}"
 *  3. Unknown scam type + action flags → "Suspicious message — {actions}"
 *  4. No signals                       → extractCleanPhrase(inputText)
 *
 * The result is always non-empty, at most 120 characters, and contains no
 * newline characters.
 */
export function generateSubjectLine(input: SubjectLineInput): string {
  const { inputText, scamType, redFlags } = input;

  // Step 1: Look up entity descriptor from scam type
  const entity: string = SCAM_TYPE_LABELS[scamType] ?? '';

  // Step 2: Collect up to 2 action descriptors from red flags (preserving order)
  const actions: string[] = [];
  for (const flag of redFlags) {
    const label = ACTION_LABELS[flag];
    if (label !== undefined) {
      actions.push(label);
    }
    if (actions.length >= 2) break;
  }

  // Step 3: Compose subject line from entity + actions
  let subjectLine = '';

  if (entity !== '') {
    if (actions.length > 0) {
      subjectLine = `${entity} \u2014 ${actions.join(', ')}`;
    } else {
      subjectLine = entity;
    }
  } else if (actions.length > 0) {
    subjectLine = `Suspicious message \u2014 ${actions.join(', ')}`;
  }

  // Step 4: Fallback to cleaned text extraction when no signals produced a line
  if (subjectLine === '') {
    subjectLine = extractCleanPhrase(inputText);
  }

  // Step 5: Enforce 120-character max length
  if (subjectLine.length > 120) {
    subjectLine = subjectLine.slice(0, 117) + '...';
  }

  return subjectLine;
}
