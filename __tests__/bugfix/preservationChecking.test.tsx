/**
 * Preservation Checking Test — Task 5.1
 *
 * Verifies that pressing "Read aloud" while speech is already playing
 * calls Speech.stop() and resets the button text to "Read aloud".
 * This is existing behavior that must NOT be broken by the bugfix.
 *
 * Expected: PASS on both unfixed and fixed code.
 *
 * Validates: Requirements 3.1
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ResultsScreen from '../../app/results';
import type { AnalysisResult } from '../../types';

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

describe('Preservation — Speech stop behavior when pressing "Read aloud" while speaking', () => {
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
   * **Validates: Requirements 3.1**
   *
   * Full flow:
   * 1. Render ResultsScreen with a mock recentResult
   * 2. Press "Read aloud" → starts speaking, button changes to "Stop"
   * 3. Press "Stop" → should call Speech.stop()
   * 4. Assert Speech.stop was called
   * 5. Simulate the onStopped callback to reset state
   * 6. Assert button text is back to "Read aloud"
   */
  it('calls Speech.stop() and resets button when pressing stop while speaking', async () => {
    const { getByText, queryByText } = render(<ResultsScreen />);

    // Step 1: Advance past the 300ms ready delay
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // Step 2: Press "Read aloud" — starts speaking
    const readAloudButton = getByText('Read aloud');
    fireEvent.press(readAloudButton);

    // Verify Speech.speak was called and button changed to "Stop"
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    expect(getByText('Stop')).toBeTruthy();
    expect(queryByText('Read aloud')).toBeNull();

    // Step 3: Press "Stop" while speaking
    const stopButton = getByText('Stop');
    await act(async () => {
      fireEvent.press(stopButton);
    });

    // Step 4: Assert Speech.stop was called
    expect(mockStop).toHaveBeenCalledTimes(1);

    // Step 5: Simulate the onStopped callback firing (Speech.stop triggers onStopped)
    const [_text, options] = mockSpeak.mock.calls[0];
    expect(typeof options.onStopped).toBe('function');
    act(() => {
      options.onStopped();
    });

    // Step 6: Assert button text is back to "Read aloud"
    expect(getByText('Read aloud')).toBeTruthy();
    expect(queryByText('Stop')).toBeNull();
  });
});

describe('Preservation — Speech.stop() cleanup effect on unmount', () => {
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
   * **Validates: Requirements 3.2**
   *
   * The results screen has a useEffect cleanup that calls Speech.stop()
   * when the component unmounts. This ensures speech playback is stopped
   * if the user navigates away. This test verifies that behavior is preserved.
   *
   * Flow:
   * 1. Render ResultsScreen with a mock recentResult
   * 2. Advance past the 300ms ready delay so the component fully renders
   * 3. Unmount the component
   * 4. Assert Speech.stop() was called during unmount cleanup
   */
  it('calls Speech.stop() when the component unmounts', () => {
    const { unmount } = render(<ResultsScreen />);

    // Advance past the 300ms ready delay
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // Ensure Speech.stop has not been called yet
    expect(mockStop).not.toHaveBeenCalled();

    // Unmount the component — triggers the cleanup effect
    unmount();

    // Assert Speech.stop() was called during cleanup
    expect(mockStop).toHaveBeenCalledTimes(1);
  });
});


describe('Preservation — Text construction from AnalysisResult is unchanged', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * **Validates: Requirements 3.1**
   *
   * Verifies the text passed to Speech.speak() is constructed as:
   *   headline + '. ' +
   *   (redFlags.length > 0 ? 'Warning signs: ' + mapped flags + '. ' : '') +
   *   'What to do: ' + doNow joined by '. ' + '. ' +
   *   'What to say: ' + safeResponseScript
   *
   * Uses a High Risk result with specific red flags, doNow items, and safeResponseScript.
   */
  it('constructs the correct text with red flags present', () => {
    mockUseAppContext.mockReturnValue({
      recentResult: makeResult({
        riskLevel: 'High Risk',
        redFlags: ['urgency', 'money_transfer'],
        doNow: ['Hang up immediately', 'Call your bank directly'],
        safeResponseScript: 'I need to verify this independently.',
      }),
      trustedContact: null,
      trustedContacts: [],
      setTrustedContacts: jest.fn(),
      setTrustedContact: jest.fn(),
      setRecentResult: jest.fn(),
    });

    const { getByText } = render(<ResultsScreen />);

    // Advance past the 300ms ready delay
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // Press "Read aloud"
    fireEvent.press(getByText('Read aloud'));

    // Capture the text argument passed to Speech.speak()
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const [actualText] = mockSpeak.mock.calls[0];

    const expectedText =
      'This looks like a scam. ' +
      'Warning signs: Creating urgency / pressure, Asking for money transfer. ' +
      'What to do: Hang up immediately. Call your bank directly. ' +
      'What to say: I need to verify this independently.';

    expect(actualText).toBe(expectedText);
  });

  /**
   * **Validates: Requirements 3.1**
   *
   * Verifies that when redFlags is empty, the "Warning signs" section is omitted
   * from the constructed text.
   */
  it('omits warning signs section when redFlags is empty', () => {
    mockUseAppContext.mockReturnValue({
      recentResult: makeResult({
        riskLevel: 'High Risk',
        redFlags: [],
        doNow: ['Hang up immediately', 'Call your bank directly'],
        safeResponseScript: 'I need to verify this independently.',
      }),
      trustedContact: null,
      trustedContacts: [],
      setTrustedContacts: jest.fn(),
      setTrustedContact: jest.fn(),
      setRecentResult: jest.fn(),
    });

    const { getByText } = render(<ResultsScreen />);

    // Advance past the 300ms ready delay
    act(() => {
      jest.advanceTimersByTime(350);
    });

    // Press "Read aloud"
    fireEvent.press(getByText('Read aloud'));

    // Capture the text argument passed to Speech.speak()
    expect(mockSpeak).toHaveBeenCalledTimes(1);
    const [actualText] = mockSpeak.mock.calls[0];

    const expectedText =
      'This looks like a scam. ' +
      'What to do: Hang up immediately. Call your bank directly. ' +
      'What to say: I need to verify this independently.';

    expect(actualText).toBe(expectedText);
  });
});
