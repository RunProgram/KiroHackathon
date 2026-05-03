import * as fc from 'fast-check';
import {
  generateSubjectLine,
  SCAM_TYPE_LABELS,
  ACTION_LABELS,
} from '../../lib/generateSubjectLine';
import type { SubjectLineInput } from '../../lib/generateSubjectLine';
import type { ScamType, RedFlag, RiskLevel } from '../../types';

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

const SCAM_TYPES: ScamType[] = [
  'bank_impersonation',
  'grandparent_scam',
  'medicare_government',
  'amazon_delivery',
  'tech_support',
  'irs_tax',
  'lottery_prize',
  'romance_scam',
  'unknown',
];

const RED_FLAGS: RedFlag[] = [
  'urgency',
  'secrecy',
  'money_transfer',
  'gift_card',
  'otp_request',
  'password_request',
  'ssn_medicare_request',
  'remote_access_request',
  'impersonation_bank',
  'impersonation_amazon',
  'impersonation_medicare',
  'impersonation_irs',
  'impersonation_government',
  'impersonation_family',
  'impersonation_police',
  'impersonation_tech_support',
  'lottery_prize_scam',
  'romance_scam',
];

const RISK_LEVELS: RiskLevel[] = ['High Risk', 'Be Careful', 'Probably Safe'];

const scamTypeArb = fc.constantFrom(...SCAM_TYPES);
const redFlagArb = fc.constantFrom(...RED_FLAGS);
const redFlagsArb = fc.array(redFlagArb, { minLength: 0, maxLength: 10 });
const riskLevelArb = fc.constantFrom(...RISK_LEVELS);

const subjectLineInputArb: fc.Arbitrary<SubjectLineInput> = fc.record({
  inputText: fc.string(),
  scamType: scamTypeArb,
  redFlags: redFlagsArb,
  riskLevel: riskLevelArb,
});

// ---------------------------------------------------------------------------
// Property 1: Non-empty output
// Validates: Requirements 3.1
// ---------------------------------------------------------------------------
describe('Property 1: Non-empty output', () => {
  it('generateSubjectLine always returns a non-empty string', () => {
    fc.assert(
      fc.property(subjectLineInputArb, (input) => {
        expect(generateSubjectLine(input).length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Max length
// Validates: Requirements 3.2
// ---------------------------------------------------------------------------
describe('Property 2: Max length', () => {
  it('generateSubjectLine output never exceeds 120 characters', () => {
    fc.assert(
      fc.property(subjectLineInputArb, (input) => {
        expect(generateSubjectLine(input).length).toBeLessThanOrEqual(120);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: No newlines
// Validates: Requirements 3.4
// ---------------------------------------------------------------------------
describe('Property 3: No newlines', () => {
  it('generateSubjectLine output never contains newline characters', () => {
    fc.assert(
      fc.property(subjectLineInputArb, (input) => {
        expect(generateSubjectLine(input).indexOf('\n')).toBe(-1);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Scam type presence
// Validates: Requirements 1.1
// ---------------------------------------------------------------------------
describe('Property 4: Scam type presence', () => {
  it('output contains the scam type label when scamType is not unknown', () => {
    const knownScamTypeArb = fc.constantFrom(
      ...SCAM_TYPES.filter((t) => t !== 'unknown')
    );

    const knownScamInputArb: fc.Arbitrary<SubjectLineInput> = fc.record({
      inputText: fc.string(),
      scamType: knownScamTypeArb,
      redFlags: redFlagsArb,
      riskLevel: riskLevelArb,
    });

    fc.assert(
      fc.property(knownScamInputArb, (input) => {
        const result = generateSubjectLine(input);
        const label = SCAM_TYPE_LABELS[input.scamType];
        expect(result).toContain(label);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Suspicious fallback
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------
describe('Property 5: Suspicious fallback', () => {
  it('output starts with "Suspicious message" when scamType is unknown and action flags exist', () => {
    // Only pick red flags that have action labels
    const actionRedFlags = RED_FLAGS.filter((f) => ACTION_LABELS[f] !== undefined);
    const actionRedFlagArb = fc.constantFrom(...actionRedFlags);

    const suspiciousInputArb: fc.Arbitrary<SubjectLineInput> = fc.record({
      inputText: fc.string(),
      scamType: fc.constant('unknown' as ScamType),
      redFlags: fc
        .array(actionRedFlagArb, { minLength: 1, maxLength: 5 }),
      riskLevel: riskLevelArb,
    });

    fc.assert(
      fc.property(suspiciousInputArb, (input) => {
        const result = generateSubjectLine(input);
        expect(result.startsWith('Suspicious message')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Empty input handling
// Validates: Requirements 4.1
// ---------------------------------------------------------------------------
describe('Property 6: Empty input handling', () => {
  it('returns "Empty message" for whitespace-only input with unknown scam type and no red flags', () => {
    // Generate strings that are empty or whitespace-only
    const whitespaceArb = fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'));

    const emptyInputArb: fc.Arbitrary<SubjectLineInput> = fc.record({
      inputText: whitespaceArb,
      scamType: fc.constant('unknown' as ScamType),
      redFlags: fc.constant([] as RedFlag[]),
      riskLevel: riskLevelArb,
    });

    fc.assert(
      fc.property(emptyInputArb, (input) => {
        expect(generateSubjectLine(input)).toBe('Empty message');
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Deterministic
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------
describe('Property 7: Deterministic', () => {
  it('calling generateSubjectLine twice with the same input produces identical output', () => {
    fc.assert(
      fc.property(subjectLineInputArb, (input) => {
        const result1 = generateSubjectLine(input);
        const result2 = generateSubjectLine(input);
        expect(result1).toBe(result2);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Action limit
// Validates: Requirements 1.2
// ---------------------------------------------------------------------------
describe('Property 8: Action limit', () => {
  it('output contains at most 2 action descriptors from ACTION_LABELS', () => {
    const actionLabelValues = Object.values(ACTION_LABELS).filter(
      (v): v is string => v !== undefined
    );

    fc.assert(
      fc.property(subjectLineInputArb, (input) => {
        const result = generateSubjectLine(input);
        const count = actionLabelValues.filter((label) =>
          result.includes(label)
        ).length;
        expect(count).toBeLessThanOrEqual(2);
      }),
      { numRuns: 100 }
    );
  });
});
