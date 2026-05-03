/**
 * Exploratory Bug Condition Tests — Tasks 1.1 & 1.2
 *
 * Task 1.1: Verifies that Speech.speak() is called WITHOUT a `language` option
 * on the current (unfixed) code. This confirms the bug exists.
 *
 * Task 1.2: Verifies that the onError callback does NOT show an Alert to the
 * user on the current (unfixed) code. This confirms silent error swallowing.
 *
 * Expected: PASS on unfixed code (bug confirmed), FAIL after fix.
 *
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2
 */

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import ResultsScreen from '../../app/results';
import type { AnalysisResult } from '../../types';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockSpeak = jest.fn();
const mockStop = jest.fn();

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

// ── Helpers ────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    riskLevel: 'High Risk',
    scamType: 'bank_impersonation',
    redFlags: ['urgency', 'money_transfer'],
    doNow: ['Hang up immediately', 'Call your bank directly'],
    doNotDo: ['Do not share personal information'],
    safeResponseScript: 'I need to verify this independently.',
    suggestions: [],
    verificationQuestions: [],
    caregiverRecommended: false,
    analyzedAt: new Date().toISOString(),
    inputSummary: 'Someone called claiming to be my bank',
    ...overrides,
  };
}

// ── Test ───────────────────────────────────────────────────────────────────

describe('Exploratory Bug Condition — Speech.speak() missing language option', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseAppContext.mockReturnValue({
      recentResult: makeResult(),
      trustedContact: null,
      trustedContacts: [],
      setTrustedContacts: jest.fn(),
      setTrustedContact: jest.fn(),
      setRecentResult: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('confirms Speech.speak() is called without a language option (bug condition)', () => {
    const { getByText } = render(<ResultsScreen />);

    // Advance past the 300ms ready delay
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // Find and press the "Read aloud" button
    const readAloudButton = getByText('Read aloud');
    fireEvent.press(readAloudButton);

    // Verify Speech.speak was called
    expect(mockSpeak).toHaveBeenCalledTimes(1);

    // Extract the options object (second argument to Speech.speak)
    const [_text, options] = mockSpeak.mock.calls[0];

    // BUG CONDITION: The options should NOT include a `language` property
    // This confirms the bug — Speech.speak() is called without specifying a language
    expect(options).toBeDefined();
    expect(options).not.toHaveProperty('language');
  });
});

// ── Test — Task 1.2 ───────────────────────────────────────────────────────

describe('Exploratory Bug Condition — onError callback does not show Alert', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    alertSpy = jest.spyOn(Alert, 'alert');

    mockUseAppContext.mockReturnValue({
      recentResult: makeResult(),
      trustedContact: null,
      trustedContacts: [],
      setTrustedContacts: jest.fn(),
      setTrustedContact: jest.fn(),
      setRecentResult: jest.fn(),
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
    jest.useRealTimers();
  });

  /**
   * Validates: Requirements 1.2, 2.2
   *
   * This test confirms the bug: when Speech.speak() fires its onError
   * callback, the current (unfixed) code only calls setIsSpeaking(false)
   * and does NOT show an Alert to inform the user of the failure.
   *
   * Expected: PASS on unfixed code (bug confirmed), FAIL after fix.
   */
  it('confirms onError callback does not call Alert.alert (bug condition — silent error swallowing)', () => {
    const { getByText } = render(<ResultsScreen />);

    // Advance past the 300ms ready delay
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // Press "Read aloud" to trigger Speech.speak()
    const readAloudButton = getByText('Read aloud');
    fireEvent.press(readAloudButton);

    // Verify Speech.speak was called
    expect(mockSpeak).toHaveBeenCalledTimes(1);

    // Extract the onError callback from the Speech.speak options
    const [_text, options] = mockSpeak.mock.calls[0];
    expect(options).toBeDefined();
    expect(typeof options.onError).toBe('function');

    // Simulate a speech error by invoking the onError callback
    act(() => {
      options.onError(new Error('TTS engine failed'));
    });

    // BUG CONDITION: Alert.alert should NOT have been called
    // This confirms the bug — the onError callback silently swallows the error
    // without informing the user that text-to-speech failed
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
