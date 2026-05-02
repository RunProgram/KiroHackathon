/**
 * PrimaryActionButton — large navy button for primary CTAs.
 *
 * Requirements: 1.7, 8.1, 8.8
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface PrimaryActionButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export function PrimaryActionButton({
  label,
  onPress,
  accessibilityLabel,
  disabled = false,
}: PrimaryActionButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
    >
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.deepNavy,
    minHeight: Typography.minTouchTarget,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    color: '#FFFFFF',
    fontSize: Typography.bodySize,
    fontWeight: '600',
    textAlign: 'center',
  },
});
