/**
 * SecondaryActionButton — outlined soft-blue button for secondary CTAs.
 *
 * Requirements: 1.7, 8.8
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface SecondaryActionButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function SecondaryActionButton({
  label,
  onPress,
  accessibilityLabel,
}: SecondaryActionButtonProps): React.JSX.Element {
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
    backgroundColor: 'transparent',
    minHeight: Typography.minTouchTarget,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.softBlue,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.softBlue,
    fontSize: Typography.bodySize,
    fontWeight: '600',
    textAlign: 'center',
  },
});
