/**
 * DangerActionButton — soft-red button for emergency/call actions.
 *
 * Requirements: 1.3, 8.8
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface DangerActionButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function DangerActionButton({
  label,
  onPress,
  accessibilityLabel,
}: DangerActionButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.red,
    minHeight: Typography.minTouchTarget,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: Typography.bodySize,
    fontWeight: '600',
    textAlign: 'center',
  },
});
