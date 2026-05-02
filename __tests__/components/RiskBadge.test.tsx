/**
 * Unit tests for RiskBadge component.
 *
 * Requirements: 5.1
 */

import { render } from '@testing-library/react-native';
import React from 'react';

import { Colors } from '../../constants/colors';
import { RiskBadge } from '../../components/RiskBadge';
import { RiskLevel } from '../../types';

// ---------------------------------------------------------------------------
// Tests: correct text rendered for each RiskLevel
// ---------------------------------------------------------------------------

describe('RiskBadge — text rendering', () => {
  it('renders "High Risk" text for High Risk level', () => {
    const { getByText } = render(<RiskBadge riskLevel="High Risk" />);
    expect(getByText('High Risk')).toBeTruthy();
  });

  it('renders "Be Careful" text for Be Careful level', () => {
    const { getByText } = render(<RiskBadge riskLevel="Be Careful" />);
    expect(getByText('Be Careful')).toBeTruthy();
  });

  it('renders "Probably Safe" text for Probably Safe level', () => {
    const { getByText } = render(<RiskBadge riskLevel="Probably Safe" />);
    expect(getByText('Probably Safe')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Tests: correct background color for each RiskLevel
// ---------------------------------------------------------------------------

describe('RiskBadge — color coding', () => {
  function getBadgeStyle(riskLevel: RiskLevel) {
    const { getByRole } = render(<RiskBadge riskLevel={riskLevel} />);
    const badge = getByRole('text');
    // StyleSheet.flatten returns the merged style object
    const { StyleSheet } = require('react-native');
    return StyleSheet.flatten(badge.props.style);
  }

  it('uses red background for "High Risk"', () => {
    const style = getBadgeStyle('High Risk');
    expect(style.backgroundColor).toBe(Colors.red);
  });

  it('uses amber background for "Be Careful"', () => {
    const style = getBadgeStyle('Be Careful');
    expect(style.backgroundColor).toBe(Colors.amber);
  });

  it('uses green background for "Probably Safe"', () => {
    const style = getBadgeStyle('Probably Safe');
    expect(style.backgroundColor).toBe(Colors.green);
  });
});

// ---------------------------------------------------------------------------
// Tests: accessibility
// ---------------------------------------------------------------------------

describe('RiskBadge — accessibility', () => {
  it('has an accessibilityLabel describing the risk level', () => {
    const { getByRole } = render(<RiskBadge riskLevel="High Risk" />);
    const badge = getByRole('text');
    expect(badge.props.accessibilityLabel).toBe('Risk level: High Risk');
  });
});
