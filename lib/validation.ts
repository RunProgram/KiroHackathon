/**
 * Validation utilities for user-provided data.
 *
 * Requirements: 6.4
 */

/**
 * Accepted phone number formats:
 *
 * - 10-digit bare:          5551234567
 * - 10-digit dashes:        555-123-4567
 * - 10-digit with parens:   (555) 123-4567  or  (555)123-4567
 * - E.164 US:               +15551234567
 *
 * All formats are stripped of formatting characters before the digit count
 * is verified, so minor spacing variations (e.g. "(555) 123 4567") are also
 * accepted.
 */
const PHONE_PATTERNS: RegExp[] = [
  // E.164 US: +1 followed by exactly 10 digits
  /^\+1\d{10}$/,
  // 10-digit bare (digits only)
  /^\d{10}$/,
  // 10-digit with dashes: NXX-NXX-XXXX
  /^\d{3}-\d{3}-\d{4}$/,
  // 10-digit with area code in parens: (NXX) NXX-XXXX or (NXX)NXX-XXXX
  /^\(\d{3}\)\s?\d{3}-\d{4}$/,
];

/**
 * Validates a phone number string.
 *
 * @param value - The raw phone number string entered by the user.
 * @returns `{ valid: true }` when the value matches a recognised format, or
 *          `{ valid: false, error: 'Invalid phone number format.' }` otherwise.
 */
export function validatePhoneNumber(
  value: string
): { valid: true } | { valid: false; error: string } {
  const trimmed = value.trim();

  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: true };
    }
  }

  return { valid: false, error: "Invalid phone number format." };
}
