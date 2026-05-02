/**
 * RiskBadge — color-coded pill showing risk level.
 *
 * Requirements: 5.1, 8.3
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  riskLevel: RiskLevel;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  'High Risk': Colors.red,
  'Be Careful': Colors.amber,
  'Probably Safe': Colors.green,
};

export function RiskBadge({ riskLevel }: RiskBadgeProps): React.JSX.Element {
  const backgroundColor = RISK_COLORS[riskLevel];

  return (
    <View
      style={[styles.badge, { backgroundColor }]}
      accessibilityRole="text"
      accessibilityLabel={`Risk level: ${riskLevel}`}
    >
      <Text style={styles.label}>{riskLevel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  label: {
    color: '#FFFFFF',
    fontSize: Typography.bodySize,
    fontWeight: '700',
    textAlign: 'center',
  },
});
