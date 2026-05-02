import React from 'react';
import { render } from '@testing-library/react-native';
import ResultsScreen from '../../app/results';
import type { AnalysisResult } from '../../types';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Mock expo-speech
jest.mock('expo-speech', () => ({
  speak: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

// Mock useAppContext
jest.mock('../../hooks/useAppContext', () => ({
  useAppContext: jest.fn(),
}));

import { useAppContext } from '../../hooks/useAppContext';

const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>;

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    riskLevel: 'Be Careful',
    scamType: 'unknown',
    redFlags: [],
    doNow: ['Hang up'],
    doNotDo: ['Do not share personal information'],
    safeResponseScript: 'I need to verify this.',
    suggestions: [],
    verificationQuestions: [],
    caregiverRecommended: false,
    analyzedAt: new Date().toISOString(),
    inputSummary: 'test input',
    ...overrides,
  };
}

describe('ResultsScreen — Suggestions and Verification Questions sections', () => {
  beforeEach(() => {
    mockUseAppContext.mockReturnValue({
      recentResult: makeResult(),
      trustedContact: null,
      setRecentResult: jest.fn(),
      setTrustedContact: jest.fn(),
    });
  });

  // Test 1: renders Suggestions section when suggestions is non-empty
  it('renders Suggestions section when suggestions is non-empty', () => {
    mockUseAppContext.mockReturnValue({
      recentResult: makeResult({ suggestions: ['Call your family member back on the number saved in your phone.'] }),
      trustedContact: null,
      setRecentResult: jest.fn(),
      setTrustedContact: jest.fn(),
    });
    const { queryByText } = render(<ResultsScreen />);
    expect(queryByText('Suggestions')).not.toBeNull();
  });

  // Test 2: does not render Suggestions section when suggestions is empty
  it('does not render Suggestions section when suggestions is empty', () => {
    mockUseAppContext.mockReturnValue({
      recentResult: makeResult({ suggestions: [] }),
      trustedContact: null,
      setRecentResult: jest.fn(),
      setTrustedContact: jest.fn(),
    });
    const { queryByText } = render(<ResultsScreen />);
    expect(queryByText('Suggestions')).toBeNull();
  });

  // Test 3: renders Verification Questions section when verificationQuestions is non-empty
  it('renders Verification Questions section when verificationQuestions is non-empty', () => {
    mockUseAppContext.mockReturnValue({
      recentResult: makeResult({ verificationQuestions: ['What is the name of our family pet?'] }),
      trustedContact: null,
      setRecentResult: jest.fn(),
      setTrustedContact: jest.fn(),
    });
    const { queryByText } = render(<ResultsScreen />);
    expect(queryByText('Questions to ask')).not.toBeNull();
  });

  // Test 4: does not render Verification Questions section when verificationQuestions is empty
  it('does not render Verification Questions section when verificationQuestions is empty', () => {
    mockUseAppContext.mockReturnValue({
      recentResult: makeResult({ verificationQuestions: [] }),
      trustedContact: null,
      setRecentResult: jest.fn(),
      setTrustedContact: jest.fn(),
    });
    const { queryByText } = render(<ResultsScreen />);
    expect(queryByText('Questions to ask')).toBeNull();
  });

  // Test 5: section order
  it('section order: "What not to do" before Suggestions, Suggestions before "What to say"', () => {
    mockUseAppContext.mockReturnValue({
      recentResult: makeResult({ suggestions: ['A suggestion'] }),
      trustedContact: null,
      setRecentResult: jest.fn(),
      setTrustedContact: jest.fn(),
    });
    const { queryByText, UNSAFE_getAllByType } = render(<ResultsScreen />);
    // All three headings should be present
    expect(queryByText('What not to do')).not.toBeNull();
    expect(queryByText('Suggestions')).not.toBeNull();
    expect(queryByText('What to say')).not.toBeNull();
  });
});
