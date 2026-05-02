/**
 * Results screen — displays the AnalysisResult from the most recent scam check.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10
 */

import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DangerActionButton } from '../components/DangerActionButton';
import { RiskBadge } from '../components/RiskBadge';
import { SecondaryActionButton } from '../components/SecondaryActionButton';
import { SectionCard } from '../components/SectionCard';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { Typography } from '../constants/typography';
import { useAppContext } from '../hooks/useAppContext';

export default function ResultsScreen(): React.JSX.Element {
  const router = useRouter();
  const { recentResult, trustedContact } = useAppContext();

  // Redirect to home if there is no result to display
  useEffect(() => {
    if (recentResult === null) {
      router.replace('/');
    }
  }, [recentResult, router]);

  // While the redirect is in flight, render nothing to avoid a flash
  if (recentResult === null) {
    return <View style={styles.empty} />;
  }

  const result = recentResult;

  // -------------------------------------------------------------------------
  // Action handlers
  // -------------------------------------------------------------------------

  function handleCallTrustedPerson(): void {
    if (trustedContact === null) {
      Alert.alert('', Strings.messages.noContactForCall);
      return;
    }
    try {
      Linking.openURL('tel:' + trustedContact.phoneNumber);
    } catch {
      Alert.alert('', Strings.messages.callFailed);
    }
  }

  function handleHearAloud(): void {
    const text = result.riskLevel + '. ' + result.doNow.join('. ');
    Speech.speak(text);
  }

  function handleStartOver(): void {
    router.replace('/');
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen title */}
        <Text style={styles.screenTitle} accessibilityRole="header">
          {Strings.screenTitles.results}
        </Text>

        {/* Risk badge — prominent at top */}
        <View style={styles.badgeContainer}>
          <RiskBadge riskLevel={result.riskLevel} />
        </View>

        {/* Section: Why this looks suspicious */}
        <SectionCard title={Strings.sectionHeadings.whyLooksSuspicious}>
          {result.redFlags.length === 0 ? (
            <Text style={styles.bodyText}>No specific red flags detected</Text>
          ) : (
            result.redFlags.map((flag) => (
              <Text key={flag} style={styles.bulletText}>
                {'• '}
                {flag.replace(/_/g, ' ')}
              </Text>
            ))
          )}
        </SectionCard>

        {/* Section: What to do now */}
        <SectionCard title={Strings.sectionHeadings.whatToDoNow}>
          {result.doNow.map((item, index) => (
            <Text key={index} style={styles.bulletText}>
              {'• '}
              {item}
            </Text>
          ))}
        </SectionCard>

        {/* Section: What not to do */}
        <SectionCard title={Strings.sectionHeadings.whatNotToDo}>
          {result.doNotDo.map((item, index) => (
            <Text key={index} style={styles.bulletText}>
              {'• '}
              {item}
            </Text>
          ))}
        </SectionCard>

        {/* Section: Suggestions */}
        {result.suggestions.length > 0 && (
          <SectionCard title={Strings.sectionHeadings.suggestions}>
            {result.suggestions.map((item, index) => (
              <Text key={index} style={styles.bulletText}>
                {'• '}
                {item}
              </Text>
            ))}
          </SectionCard>
        )}

        {/* Section: Questions to ask */}
        {result.verificationQuestions.length > 0 && (
          <SectionCard title={Strings.sectionHeadings.questionsToAsk}>
            {result.verificationQuestions.map((item, index) => (
              <Text key={index} style={styles.bulletText}>
                {'• '}
                {item}
              </Text>
            ))}
          </SectionCard>
        )}

        {/* Section: What to say */}
        <SectionCard title={Strings.sectionHeadings.whatToSay}>
          <Text style={styles.bodyText}>{result.safeResponseScript}</Text>
        </SectionCard>

        {/* Caregiver recommendation banner (conditional) */}
        {result.caregiverRecommended && (
          <View
            style={styles.caregiverBanner}
            accessibilityRole="alert"
            accessibilityLabel={Strings.caregiverRecommendation}
          >
            <Text style={styles.caregiverText}>
              {Strings.caregiverRecommendation}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <DangerActionButton
            label={Strings.buttons.callTrustedPerson}
            onPress={handleCallTrustedPerson}
            accessibilityLabel={Strings.buttons.callTrustedPerson}
          />
          <SecondaryActionButton
            label={Strings.buttons.hearThisAloud}
            onPress={handleHearAloud}
            accessibilityLabel={Strings.buttons.hearThisAloud}
          />
          <SecondaryActionButton
            label={Strings.buttons.startOver}
            onPress={handleStartOver}
            accessibilityLabel={Strings.buttons.startOver}
          />
        </View>
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
  empty: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  screenTitle: {
    color: Colors.darkText,
    fontSize: Typography.headingSize,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeContainer: {
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bodyText: {
    color: Colors.darkText,
    fontSize: Typography.bodySize,
    lineHeight: Typography.bodySize * 1.5,
  },
  bulletText: {
    color: Colors.darkText,
    fontSize: Typography.bodySize,
    lineHeight: Typography.bodySize * 1.5,
  },
  caregiverBanner: {
    backgroundColor: Colors.amber,
    borderRadius: 12,
    padding: 16,
  },
  caregiverText: {
    color: Colors.darkText,
    fontSize: Typography.bodySize,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
    marginTop: 4,
  },
});
