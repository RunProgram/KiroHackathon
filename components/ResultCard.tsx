/**
 * ResultCard — summary card showing risk level and input summary.
 * Tappable when onPress is provided.
 *
 * Requirements: 1.5
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { AnalysisResult } from '../types';
import { RiskBadge } from './RiskBadge';

interface ResultCardProps {
  result: AnalysisResult;
  onPress?: () => void;
}

export function ResultCard({ result, onPress }: ResultCardProps): React.JSX.Element {
  const content = (
    <>
      <RiskBadge riskLevel={result.riskLevel} />
      <Text style={styles.summary} numberOfLines={3}>
        {result.inputSummary}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Recent result: ${result.riskLevel}. ${result.inputSummary}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  summary: {
    color: Colors.darkText,
    fontSize: Typography.bodySize,
    lineHeight: Typography.bodySize * 1.5,
  },
});
