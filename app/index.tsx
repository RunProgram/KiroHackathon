/**
 * Home screen — the entry point of TrustPause.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DangerActionButton } from '../components/DangerActionButton';
import { PrimaryActionButton } from '../components/PrimaryActionButton';
import { ResultCard } from '../components/ResultCard';
import { SecondaryActionButton } from '../components/SecondaryActionButton';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { Typography } from '../constants/typography';
import { useAppContext } from '../hooks/useAppContext';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { trustedContact, recentResult } = useAppContext();

  async function handleCallTrustedPerson(): Promise<void> {
    if (!trustedContact) {
      Alert.alert(
        'No trusted contact',
        Strings.messages.noContactForCall,
      );
      return;
    }

    try {
      await Linking.openURL('tel:' + trustedContact.phoneNumber);
    } catch {
      Alert.alert(
        'Call failed',
        `${Strings.messages.callFailed}\n\n${trustedContact.phoneNumber}`,
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App title */}
        <Text style={styles.title}>{Strings.screenTitles.home}</Text>

        {/* Reassuring subtitle */}
        <Text style={styles.subtitle}>{Strings.subtitles.homeReassurance}</Text>

        {/* Recent result card (Task 9.2) */}
        {recentResult !== null && (
          <View style={styles.resultCardContainer}>
            <ResultCard
              result={recentResult}
              onPress={() => router.push('/results')}
            />
          </View>
        )}

        {/* Primary actions */}
        <View style={styles.actionsContainer}>
          <PrimaryActionButton
            label={Strings.buttons.tellMeWhatHappened}
            onPress={() => router.push('/voice-input')}
          />

          <SecondaryActionButton
            label={Strings.buttons.showMessageOrPhoto}
            onPress={() => router.push('/photo-input')}
          />

          <DangerActionButton
            label={Strings.buttons.callTrustedPerson}
            onPress={handleCallTrustedPerson}
          />
        </View>

        {/* No trusted contact prompt (Task 9.2) */}
        {trustedContact === null && (
          <View style={styles.noContactContainer}>
            <Text style={styles.noContactText}>
              {Strings.messages.noTrustedContactPrompt}
            </Text>
            <SecondaryActionButton
              label={Strings.buttons.setUpTrustedContact}
              onPress={() => router.push('/trusted-contact')}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: Typography.headingSize,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.bodySize,
    color: Colors.grayText,
    marginBottom: 24,
    lineHeight: Typography.bodySize * 1.5,
  },
  resultCardContainer: {
    marginBottom: 24,
  },
  actionsContainer: {
    gap: 16,
  },
  noContactContainer: {
    marginTop: 32,
    gap: 16,
  },
  noContactText: {
    fontSize: Typography.bodySize,
    color: Colors.grayText,
    lineHeight: Typography.bodySize * 1.5,
  },
});
