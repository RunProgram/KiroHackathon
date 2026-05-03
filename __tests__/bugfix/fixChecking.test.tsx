/**
 * Fix Checking Tests — Tasks 4.1 & 4.2
 *
 * Task 4.1: Verifies that after the fix, Speech.speak() is called with the
 * `language: 'en-US'` option and a non-empty text string when the
 * user presses "Read aloud" on the results screen.
 *
 * Task 4.2: Verifies that after the fix, Alert.alert is called with the
 * correct title when the onError callback fires, and that the button
 * text resets from "Stop" back to "Read aloud".
 *
 * Expected: PASS on fixed code.
 *
 * Validates: Requirements 2.1, 2.2
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

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Fix Checking — Speech.speak() includes language option after fix', () => {
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

  /**
   * **Validates: Requirements 2.1**
   *
   * After the fix, pressing "Read aloud" should call Speech.speak()
   * with options that include `language: 'en-US'`.
   */
  it('calls Speech.speak() with language: "en-US" when "Read aloud" is pressed', () => {
    const { getByText } = render(<ResultsScreen />);

    // Advance past the 300ms ready delay
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // Press "Read aloud"
    const readAloudButton = getByText('Read aloud');
    fireEvent.press(readAloudButton);

    // Verify Speech.speak was called exactly once
    expect(mockSpeak).toHaveBeenCalledTimes(1);

    // Extract the options (second argument)
    const [text, options] = mockSpeak.mock.calls[0];

    // The text argument must be a non-empty string
    expect(typeof text).toBe('string');
    expect(text.trim().length).toBeGreaterThan(0);

    // The options must include language: 'en-US'
    expect(options).toBeDefined();
    expect(options).toHaveProperty('language', 'en-US');
  });
});

// ── Tests — Task 4.2 ──────────────────────────────────────────────────────

describe('Fix Checking — Alert.alert is called when onError fires after fix', () => {
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
   * **Validates: Requirements 2.2**
   *
   * After the fix, when Speech.speak() fires its onError callback,
   * the code should call Alert.alert with 'Read Aloud Failed' as the
   * title to inform the user that TTS failed.
   */
  it('calls Alert.alert with "Read Aloud Failed" when onError fires', () => {
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

    // Extract the onError callback from Speech.speak options
    const [_text, options] = mockSpeak.mock.calls[0];
    expect(options).toBeDefined();
    expect(typeof options.onError).toBe('function');

    // Simulate a speech error by invoking the onError callback
    act(() => {
      options.onError(new Error('TTS engine failed'));
    });

    // After the fix, Alert.alert SHOULD be called with the failure title
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      'Read Aloud Failed',
      'Text-to-speech could not play the audio. Please try again.',
    );
  });

  /**
   * **Validates: Requirements 2.2**
   *
   * After the fix, when onError fires, the button text should reset
   * from "Stop" back to "Read aloud" (isSpeaking state reset).
   */
  it('resets button text from "Stop" to "Read aloud" when onError fires', () => {
    const { getByText, queryByText } = render(<ResultsScreen />);

    // Advance past the 300ms ready delay
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // Press "Read aloud" — button should change to "Stop"
    fireEvent.press(getByText('Read aloud'));
    expect(getByText('Stop')).toBeTruthy();

    // Extract the onError callback
    const [_text, options] = mockSpeak.mock.calls[0];

    // Simulate a speech error
    act(() => {
      options.onError(new Error('TTS engine failed'));
    });

    // Button should reset back to "Read aloud"
    expect(getByText('Read aloud')).toBeTruthy();
    expect(queryByText('Stop')).toBeNull();
  });
});

// ── Tests — Task 4.3 ──────────────────────────────────────────────────────

describe('Fix Checking — Empty text guard prevents Speech.speak() and shows alert', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    alertSpy = jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    alertSpy.mockRestore();
    jest.useRealTimers();
  });

  /**
   * **Validates: Requirements 2.1**
   *
   * With a minimal valid result (empty redFlags, minimal doNow and
   * safeResponseScript), Speech.speak() should still be called because
   * the RISK_CONFIG headline always provides non-empty text.
   * The "Nothing to Read" alert should NOT fire.
   */
  it('calls Speech.speak() with minimal result content (headline ensures non-empty text)', () => {
    mockUseAppContext.mockReturnValue({
      recentResult: makeResult({
        redFlags: [],
        doNow: [''],
        safeResponseScript: '',
      }),
      trustedContact: null,
      trustedContacts: [],
      setTrustedContacts: jest.fn(),
      setTrustedContact: jest.fn(),
      setRecentResult: jest.fn(),
    });

    const { getByText } = render(<ResultsScreen />);

    act(() => {
      jest.advanceTimersByTime(350);
    });

    fireEvent.press(getByText('Read aloud'));

    // Speech.speak should still be called — headline is always non-empty
    expect(mockSpeak).toHaveBeenCalledTimes(1);

    const [text] = mockSpeak.mock.calls[0];
    expect(typeof text).toBe('string');
    expect(text.trim().length).toBeGreaterThan(0);

    // The "Nothing to Read" alert should NOT have been triggered
    expect(alertSpy).not.toHaveBeenCalledWith(
      'Nothing to Read',
      expect.any(String),
    );
  });

  /**
   * **Validates: Requirements 2.1**
   *
   * Verify the guard does not interfere with normal operation across
   * all three risk levels. Each risk level has a hardcoded headline in
   * RISK_CONFIG, so the constructed text is always non-empty.
   */
  it.each([
    'High Risk' as const,
    'Be Careful' as const,
    'Probably Safe' as const,
  ])('does not trigger "Nothing to Read" alert for risk level "%s"', (riskLevel) => {
    mockUseAppContext.mockReturnValue({
      recentResult: makeResult({
        riskLevel,
        redFlags: [],
        doNow: ['Stay calm'],
        safeResponseScript: 'No thanks.',
      }),
      trustedContact: null,
      trustedContacts: [],
      setTrustedContacts: jest.fn(),
      setTrustedContact: jest.fn(),
      setRecentResult: jest.fn(),
    });

    const { getByText } = render(<ResultsScreen />);

    act(() => {
      jest.advanceTimersByTime(350);
    });

    fireEvent.press(getByText('Read aloud'));

    // Speech.speak must be called for every valid risk level
    expect(mockSpeak).toHaveBeenCalledTimes(1);

    // "Nothing to Read" alert must NOT appear
    expect(alertSpy).not.toHaveBeenCalledWith(
      'Nothing to Read',
      expect.any(String),
    );
  });
});
