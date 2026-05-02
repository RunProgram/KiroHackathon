/**
 * ScenarioCard — tappable card showing a demo scenario title and description.
 *
 * Requirements: 7.4, 7.5
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { DemoScenario } from '../types';

interface ScenarioCardProps {
  scenario: DemoScenario;
  onPress: (scenario: DemoScenario) => void;
}

export function ScenarioCard({ scenario, onPress }: ScenarioCardProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(scenario)}
      accessibilityRole="button"
      accessibilityLabel={`${scenario.title}: ${scenario.description}`}
    >
      <Text style={styles.title}>{scenario.title}</Text>
      <Text style={styles.description}>{scenario.description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 16,
    minHeight: Typography.minTouchTarget,
    gap: 8,
    justifyContent: 'center',
  },
  title: {
    color: Colors.darkText,
    fontSize: Typography.bodySize,
    fontWeight: '600',
  },
  description: {
    color: Colors.grayText,
    fontSize: Typography.captionSize,
    lineHeight: Typography.captionSize * 1.5,
  },
});
