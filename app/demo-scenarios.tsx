/**
 * Demo Scenarios screen — learn what common scams look like.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../constants/colors';
import { useRecentResult } from '../hooks/useRecentResult';
import { analyzeScamRisk } from '../lib/analyzeScamRisk';
import { DEMO_SCENARIOS } from '../lib/demoScenarios';
import { DemoScenario } from '../types';

const SCENARIO_ICONS: Record<string, string> = {
  bank_impersonation: '🏦',
  grandparent_scam: '👴',
  medicare_government: '🏥',
  amazon_delivery: '📦',
  tech_support: '💻',
  irs_tax: '📋',
  lottery_prize: '🎰',
  romance_scam: '💔',
  unknown: '⚠️',
};

export default function DemoScenariosScreen(): React.JSX.Element {
  const router = useRouter();
  const { saveResult } = useRecentResult();

  async function handlePress(scenario: DemoScenario): Promise<void> {
    const result = analyzeScamRisk(scenario.scenarioText);
    await saveResult(result);
    router.push('/results');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>📚 Example Scams</Text>
        <Text style={styles.subtitle}>
          Tap any example to see how TrustPause would analyze it.
        </Text>

        <View style={styles.list}>
          {DEMO_SCENARIOS.map((scenario) => (
            <TouchableOpacity
              key={scenario.id}
              style={styles.card}
              onPress={() => handlePress(scenario)}
              accessibilityRole="button"
              accessibilityLabel={scenario.title}
            >
              <Text style={styles.cardIcon}>
                {SCENARIO_ICONS[scenario.scamType] ?? '⚠️'}
              </Text>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{scenario.title}</Text>
                <Text style={styles.cardDesc}>{scenario.description}</Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
  },
  back: { paddingVertical: 4 },
  backText: { fontSize: 18, color: Colors.softBlue, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.darkText },
  subtitle: { fontSize: 18, color: Colors.grayText, lineHeight: 26 },
  list: { gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardIcon: { fontSize: 32 },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: Colors.darkText },
  cardDesc: { fontSize: 15, color: Colors.grayText, lineHeight: 20 },
  cardArrow: { fontSize: 28, color: Colors.softBlue, fontWeight: '300' },
});
