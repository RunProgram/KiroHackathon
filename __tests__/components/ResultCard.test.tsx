/**
 * Unit tests for ResultCard component.
 *
 * Requirements: 1.5
 */

import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { ResultCard } from '../../components/ResultCard';
import { AnalysisResult } from '../../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockResult: AnalysisResult = {
  riskLevel: 'High Risk',
  scamType: 'bank_impersonation',
  redFlags: ['urgency', 'secrecy'],
  doNow: ['Hang up immediately', 'Call your bank directly'],
  doNotDo: ['Do not give out your PIN'],
  safeResponseScript: 'I need to verify this with my bank. Goodbye.',
  caregiverRecommended: true,
  analyzedAt: new Date().toISOString(),
  inputSummary: 'Someone called claiming to be from my bank and asked for my PIN.',
};

const safeResult: AnalysisResult = {
  riskLevel: 'Probably Safe',
  scamType: 'unknown',
  redFlags: [],
  doNow: ['Stay calm', 'No action needed'],
  doNotDo: ['Do not worry'],
  safeResponseScript: 'This looks fine.',
  caregiverRecommended: false,
  analyzedAt: new Date().toISOString(),
  inputSummary: 'A friend called to say hello.',
};

// ---------------------------------------------------------------------------
// Tests: content rendering
// ---------------------------------------------------------------------------

describe('ResultCard — content rendering', () => {
  it('renders the inputSummary text', () => {
    const { getByText } = render(<ResultCard result={mockResult} />);
    expect(getByText(mockResult.inputSummary)).toBeTruthy();
  });

  it('renders the riskLevel badge', () => {
    const { getByText } = render(<ResultCard result={mockResult} />);
    expect(getByText('High Risk')).toBeTruthy();
  });

  it('renders "Probably Safe" badge for a safe result', () => {
    const { getByText } = render(<ResultCard result={safeResult} />);
    expect(getByText('Probably Safe')).toBeTruthy();
  });

  it('renders the inputSummary for a safe result', () => {
    const { getByText } = render(<ResultCard result={safeResult} />);
    expect(getByText(safeResult.inputSummary)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Tests: onPress interaction
// ---------------------------------------------------------------------------

describe('ResultCard — onPress interaction', () => {
  it('calls onPress when tapped and onPress is provided', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<ResultCard result={mockResult} onPress={onPress} />);
    const card = getByRole('button');
    fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render a button when onPress is not provided', () => {
    const { queryByRole } = render(<ResultCard result={mockResult} />);
    expect(queryByRole('button')).toBeNull();
  });

  it('calls onPress only once per tap', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<ResultCard result={mockResult} onPress={onPress} />);
    const card = getByRole('button');
    fireEvent.press(card);
    fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
