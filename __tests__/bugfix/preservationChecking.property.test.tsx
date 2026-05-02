/**
 * Preservation Checking Property Test — Task 5.4
 *
 * Generates random AnalysisResult objects using fast-check and verifies that
 * the text passed to Speech.speak() is always a non-empty string. Since the
 * text always starts with a RISK_CONFIG headline (which is non-empty for all
 * three risk levels), the constructed text should never be empty.
 *
 * Expected: PASS on both unfixed and fixed code.
 *
 * **Validates: Requirements 3.1**
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import * as fc from 'fast-check';
import ResultsScreen from '../../app/results';
import type { AnalysisResult, RiskLevel, RedFlag, ScamType } from '../../types';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockSpeak = jest.fn();
const mockStop = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-speech', () => ({
  speak: (...args: unknown[]) => mockSpeak(...args),
  stop: (...args: unknown[]) => mockStop(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock('../../hooks/useAppContext', () => ({
  useAppContext: jest.fn(),
}));

import { useAppContext } from '../../hooks/useAppContext';

const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>;

// ── Generators ─────────────────────────────────────────────────────────────

const ALL_RISK_LEVELS: RiskLevel[] = ['High Risk', 'Be Careful', 'Probably Safe'];

const ALL_RED_FLAGS: RedFlag[] = [
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

const ALL_SCAM_TYPES: ScamType[] = [
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

const arbAnalysisResult: fc.Arbitrary<AnalysisResult> = fc.record({
  riskLevel: fc.constantFrom(...ALL_RISK_LEVELS),
  scamType: fc.constantFrom(...ALL_SCAM_TYPES),
  redFlags: fc.subarray(ALL_RED_FLAGS),
  doNow: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 4 }),
  doNotDo: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
  safeResponseScript: fc.string(),
  suggestions: fc.array(fc.string()),
  verificationQuestions: fc.array(fc.string()),
  caregiverRecommended: fc.boolean(),
  analyzedAt: fc.date().map((d) => d.toISOString()),
  inputSummary: fc.string({ maxLength: 100 }),
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Preservation — Property: constructed speech text is always non-empty', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * **Validates: Requirements 3.1**
   *
   * For any randomly generated AnalysisResult, pressing "Read aloud" should
   * always result in Speech.speak() being called with a non-empty text string.
   * The text always starts with the RISK_CONFIG headline for the given risk
   * level, so it can never be empty.
   */
  it('Speech.speak() is always called with non-empty text for any valid AnalysisResult', () => {
    fc.assert(
      fc.property(arbAnalysisResult, (result) => {
        // Reset mocks for each iteration
        mockSpeak.mockClear();
        mockStop.mockClear();

        mockUseAppContext.mockReturnValue({
          recentResult: result,
          trustedContact: null,
          trustedContacts: [],
          setTrustedContacts: jest.fn(),
          setTrustedContact: jest.fn(),
          setRecentResult: jest.fn(),
        });

        const { getByText, unmount } = render(<ResultsScreen />);

        // Advance past the 300ms ready delay
        act(() => {
          jest.advanceTimersByTime(350);
        });

        // Press "Read aloud"
        fireEvent.press(getByText('🔊 Read aloud'));

        // Assert Speech.speak was called
        expect(mockSpeak).toHaveBeenCalledTimes(1);

        // Capture the text argument
        const [actualText] = mockSpeak.mock.calls[0];

        // The text must be a non-empty string
        expect(typeof actualText).toBe('string');
        expect(actualText.length).toBeGreaterThan(0);
        expect(actualText.trim().length).toBeGreaterThan(0);

        // Clean up to avoid leaking state between iterations
        unmount();
      }),
      { numRuns: 50 },
    );
  });
});
