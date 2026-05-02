import * as fc from 'fast-check';
import { validatePhoneNumber } from '../../lib/validation';

// ---------------------------------------------------------------------------
// Property 9: Phone number validation rejects invalid formats
// Validates: Requirements 6.4
// ---------------------------------------------------------------------------
describe('Property 9: Phone number validation rejects invalid formats', () => {
  /**
   * Any string that does not match a recognised phone number format must be
   * rejected with valid === false.
   *
   * We filter fc.string() to exclude strings that happen to match one of the
   * accepted patterns so the property is well-defined.
   */
  it('rejects strings that do not match any valid phone number format', () => {
    // Patterns that the validator accepts — used to exclude them from the
    // generated corpus so every generated value is genuinely invalid.
    const validPatterns = [
      /^\+1\d{10}$/,
      /^\d{10}$/,
      /^\d{3}-\d{3}-\d{4}$/,
      /^\(\d{3}\)\s?\d{3}-\d{4}$/,
    ];

    const isValidPhone = (s: string): boolean =>
      validPatterns.some((p) => p.test(s.trim()));

    fc.assert(
      fc.property(
        fc.string().filter((s) => !isValidPhone(s)),
        (invalidInput) => {
          const result = validatePhoneNumber(invalidInput);
          expect(result.valid).toBe(false);
          if (!result.valid) {
            expect(result.error).toBe('Invalid phone number format.');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Valid E.164 US phone numbers (e.g. +12025551234) must always pass.
   * We use fc.stringMatching to generate strings that conform to the E.164
   * US format: +1 followed by exactly 10 digits where the area code starts
   * with 2–9 (NANP rule).
   */
  it('accepts valid E.164 US phone numbers', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\+1[2-9]\d{9}$/),
        (validE164) => {
          const result = validatePhoneNumber(validE164);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
