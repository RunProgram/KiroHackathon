/**
 * SectionCard — labeled card container with a title heading and children content area.
 *
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

export function SectionCard({ title, children }: SectionCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  title: {
    color: Colors.darkText,
    fontSize: Typography.headingSize,
    fontWeight: '700',
  },
  content: {
    gap: 8,
  },
});
