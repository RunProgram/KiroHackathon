/**
 * Demo Scenarios screen — lets users explore pre-written scam examples.
 *
 * Requirements: 7.3, 7.4, 7.5
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScenarioCard } from '../components/ScenarioCard';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { Typography } from '../constants/typography';
import { useRecentResult } from '../hooks/useRecentResult';
import { analyzeScamRisk } from '../lib/analyzeScamRisk';
import { DEMO_SCENARIOS } from '../lib/demoScenarios';
import { DemoScenario } from '../types';

export default function DemoScenariosScreen(): React.JSX.Element {
  const router = useRouter();
  const { saveResult } = useRecentResult();

  async function handleScenarioPress(scenario: DemoScenario): Promise<void> {
    const result = analyzeScamRisk(scenario.scenarioText);
    await saveResult(result);
    router.push('/results');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle} accessibilityRole="header">
          {Strings.screenTitles.demoScenarios}
        </Text>

        {DEMO_SCENARIOS.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onPress={handleScenarioPress}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  screenTitle: {
    color: Colors.darkText,
    fontSize: Typography.headingSize,
    fontWeight: '700',
    marginBottom: 4,
  },
});
