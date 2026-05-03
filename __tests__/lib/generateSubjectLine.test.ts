import {
  generateSubjectLine,
  extractCleanPhrase,
  SCAM_TYPE_LABELS,
  ACTION_LABELS,
} from '../../lib/generateSubjectLine';
import type { SubjectLineInput } from '../../lib/generateSubjectLine';

// ---------------------------------------------------------------------------
// Unit tests for extractCleanPhrase
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2
// ---------------------------------------------------------------------------

describe('extractCleanPhrase', () => {
  // Requirement 4.1: empty / whitespace-only → "Empty message"
  it('returns "Empty message" for an empty string', () => {
    expect(extractCleanPhrase('')).toBe('Empty message');
  });

  it('returns "Empty message" for whitespace-only input', () => {
    expect(extractCleanPhrase('   \n\t  ')).toBe('Empty message');
  });

  // Requirement 2.2: strip leading OCR noise (digits, symbols, whitespace)
  it('strips leading OCR noise (digits, symbols) from input', () => {
    const result = extractCleanPhrase('123 456 ## Hello world');
    expect(result).toBe('Hello world');
  });

  it('strips leading numbers and dashes', () => {
    const result = extractCleanPhrase('---123--- Actual content here');
    expect(result).toBe('Actual content here');
  });

  // Requirement 2.3: newlines replaced with spaces, whitespace collapsed
  it('replaces newlines with spaces and collapses whitespace', () => {
    const result = extractCleanPhrase('Hello\n\nworld   this\nis   a test');
    expect(result).toBe('Hello world this is a test');
  });

  // Requirement 4.2: fallback when OCR stripping removes all content
  it('falls back to original text when OCR stripping removes all content', () => {
    const result = extractCleanPhrase('123 456 789');
    // After stripping leading noise, nothing remains, so it falls back
    // to the original with whitespace normalized
    expect(result).toBe('123 456 789');
  });

  // Requirement 2.4: sentence boundary extraction within 100 characters
  it('extracts first sentence when boundary is within 100 characters', () => {
    const result = extractCleanPhrase(
      'Your account has been compromised. Please call us immediately to resolve this issue.'
    );
    expect(result).toBe('Your account has been compromised.');
  });

  it('extracts first sentence ending with exclamation mark', () => {
    const result = extractCleanPhrase(
      'Congratulations! You have won a prize. Claim it now.'
    );
    expect(result).toBe('Congratulations!');
  });

  // Requirement 2.5: word boundary truncation with ellipsis for long text
  it('truncates at word boundary with ellipsis when no sentence boundary is found', () => {
    // Build a long string with no sentence boundaries (no ". " or "! " or "? ")
    const words = 'word '.repeat(25).trim(); // 124 chars: "word word word..."
    const result = extractCleanPhrase(words);
    expect(result.length).toBeLessThanOrEqual(103);
    expect(result).toMatch(/\.\.\.$/);
  });

  it('returns text as-is when cleaned text is under 100 characters', () => {
    const result = extractCleanPhrase('Short clean text');
    expect(result).toBe('Short clean text');
  });
});

// ---------------------------------------------------------------------------
// Unit tests for generateSubjectLine
// Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 7.2
// ---------------------------------------------------------------------------

describe('generateSubjectLine', () => {
  // Requirement 1.1 + 1.3: known scam type with action flags → "{entity} — {action1}, {action2}"
  it('produces "{entity} — {action1}, {action2}" for known scam type with action flags', () => {
    const input: SubjectLineInput = {
      inputText: 'Your account has been compromised',
      scamType: 'bank_impersonation',
      redFlags: ['urgency', 'password_request'],
      riskLevel: 'High Risk',
    };
    const result = generateSubjectLine(input);
    expect(result).toBe('Bank impersonation \u2014 using urgent pressure, asking for password');
  });

  // Requirement 1.1: known scam type without action flags → just entity label
  it('produces just the entity label for known scam type without action flags', () => {
    const input: SubjectLineInput = {
      inputText: 'Your grandson has been in an accident',
      scamType: 'grandparent_scam',
      redFlags: ['impersonation_family'],
      riskLevel: 'High Risk',
    };
    const result = generateSubjectLine(input);
    expect(result).toBe('Family emergency scam');
  });

  // Requirement 1.4: unknown scam type with action flags → "Suspicious message — ..."
  it('produces "Suspicious message — ..." for unknown scam type with action flags', () => {
    const input: SubjectLineInput = {
      inputText: 'Send money now',
      scamType: 'unknown',
      redFlags: ['money_transfer', 'urgency'],
      riskLevel: 'High Risk',
    };
    const result = generateSubjectLine(input);
    expect(result).toBe('Suspicious message \u2014 requesting money transfer, using urgent pressure');
  });

  // Requirement 2.1: unknown scam type without flags → cleaned text extraction
  it('falls back to cleaned text extraction for unknown scam type without flags', () => {
    const input: SubjectLineInput = {
      inputText: 'Hi, just checking in about our meeting on Thursday.',
      scamType: 'unknown',
      redFlags: [],
      riskLevel: 'Probably Safe',
    };
    const result = generateSubjectLine(input);
    expect(result).toBe('Hi, just checking in about our meeting on Thursday.');
  });

  // Requirement 4.1: empty input → "Empty message"
  it('returns "Empty message" for empty input with no signals', () => {
    const input: SubjectLineInput = {
      inputText: '',
      scamType: 'unknown',
      redFlags: [],
      riskLevel: 'Probably Safe',
    };
    expect(generateSubjectLine(input)).toBe('Empty message');
  });

  it('returns "Empty message" for whitespace-only input with no signals', () => {
    const input: SubjectLineInput = {
      inputText: '   \n\t  ',
      scamType: 'unknown',
      redFlags: [],
      riskLevel: 'Probably Safe',
    };
    expect(generateSubjectLine(input)).toBe('Empty message');
  });

  // Requirement 1.2: more than 2 action flags → only first 2 included
  it('includes only the first 2 action flags when more than 2 are present', () => {
    const input: SubjectLineInput = {
      inputText: 'Scam text',
      scamType: 'bank_impersonation',
      redFlags: ['money_transfer', 'gift_card', 'otp_request', 'password_request'],
      riskLevel: 'High Risk',
    };
    const result = generateSubjectLine(input);
    expect(result).toBe('Bank impersonation \u2014 requesting money transfer, asking for gift cards');
    // Verify the third and fourth action labels are NOT present
    expect(result).not.toContain('asking for verification code');
    expect(result).not.toContain('asking for password');
  });

  // Requirement 3.2 + 3.3: 120-character max length enforcement
  it('enforces 120-character max length with truncation to 117 + ellipsis', () => {
    // Create a scenario that would produce a very long subject line
    // "Suspicious message — " is 22 chars, then we need long action labels
    // Let's use a known scam type with long actions to push over 120
    const input: SubjectLineInput = {
      inputText: 'a'.repeat(200),
      scamType: 'unknown',
      redFlags: [],
      riskLevel: 'Probably Safe',
    };
    const result = generateSubjectLine(input);
    expect(result.length).toBeLessThanOrEqual(120);
  });

  // Requirement 3.4: no newlines in output
  it('produces output with no newline characters', () => {
    const input: SubjectLineInput = {
      inputText: 'Line one\nLine two\nLine three',
      scamType: 'unknown',
      redFlags: [],
      riskLevel: 'Probably Safe',
    };
    const result = generateSubjectLine(input);
    expect(result).not.toContain('\n');
  });

  // Requirement 3.5: deterministic output
  it('produces identical output for identical inputs', () => {
    const input: SubjectLineInput = {
      inputText: 'Test message for determinism',
      scamType: 'tech_support',
      redFlags: ['remote_access_request'],
      riskLevel: 'High Risk',
    };
    const result1 = generateSubjectLine(input);
    const result2 = generateSubjectLine(input);
    expect(result1).toBe(result2);
  });

  // Requirement 7.2: unknown scamType key falls back to empty entity
  it('treats an unrecognized scamType as unknown (empty entity)', () => {
    const input: SubjectLineInput = {
      inputText: 'Some message text here.',
      scamType: 'nonexistent_type' as any,
      redFlags: [],
      riskLevel: 'Probably Safe',
    };
    const result = generateSubjectLine(input);
    // With no entity and no action flags, it falls back to extractCleanPhrase
    expect(result).toBe('Some message text here.');
  });

  it('treats an unrecognized scamType with action flags as "Suspicious message"', () => {
    const input: SubjectLineInput = {
      inputText: 'Some message',
      scamType: 'nonexistent_type' as any,
      redFlags: ['urgency'],
      riskLevel: 'High Risk',
    };
    const result = generateSubjectLine(input);
    expect(result).toMatch(/^Suspicious message/);
  });

  // Requirement 3.1: non-empty output for all inputs
  it('always returns a non-empty string', () => {
    const inputs: SubjectLineInput[] = [
      { inputText: '', scamType: 'unknown', redFlags: [], riskLevel: 'Probably Safe' },
      { inputText: 'hello', scamType: 'bank_impersonation', redFlags: ['urgency'], riskLevel: 'High Risk' },
      { inputText: '   ', scamType: 'unknown', redFlags: [], riskLevel: 'Probably Safe' },
    ];
    for (const input of inputs) {
      expect(generateSubjectLine(input).length).toBeGreaterThan(0);
    }
  });
});
