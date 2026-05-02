import { validatePhoneNumber } from '../../lib/validation';

// ---------------------------------------------------------------------------
// Unit tests for validatePhoneNumber
// Requirements: 6.4
// ---------------------------------------------------------------------------

describe('validatePhoneNumber — unit tests', () => {
  // -------------------------------------------------------------------------
  // Valid formats
  // -------------------------------------------------------------------------
  it('accepts a valid E.164 US number (+15551234567)', () => {
    const result = validatePhoneNumber('+15551234567');
    expect(result.valid).toBe(true);
  });

  it('accepts a 10-digit bare number (5551234567)', () => {
    const result = validatePhoneNumber('5551234567');
    expect(result.valid).toBe(true);
  });

  it('accepts a 10-digit dashed number (555-123-4567)', () => {
    const result = validatePhoneNumber('555-123-4567');
    expect(result.valid).toBe(true);
  });

  it('accepts a number with area code in parentheses — (555) 123-4567', () => {
    const result = validatePhoneNumber('(555) 123-4567');
    expect(result.valid).toBe(true);
  });

  it('accepts a number with area code in parentheses without space — (555)123-4567', () => {
    const result = validatePhoneNumber('(555)123-4567');
    expect(result.valid).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Invalid formats
  // -------------------------------------------------------------------------
  it('rejects a non-phone string ("not-a-phone") with an error message', () => {
    const result = validatePhoneNumber('not-a-phone');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Invalid phone number format.');
    }
  });

  it('rejects an empty string with an error message', () => {
    const result = validatePhoneNumber('');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Invalid phone number format.');
    }
  });

  it('rejects a too-short number ("123") with an error message', () => {
    const result = validatePhoneNumber('123');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toBe('Invalid phone number format.');
    }
  });

  it('rejects an 11-digit bare number without country code prefix', () => {
    const result = validatePhoneNumber('15551234567');
    expect(result.valid).toBe(false);
  });

  it('rejects a number with letters mixed in', () => {
    const result = validatePhoneNumber('555-ABC-4567');
    expect(result.valid).toBe(false);
  });
});
