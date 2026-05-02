/**
 * Home screen — entry point of TrustPause.
 * Designed for elderly users: large text, clear hierarchy, generous spacing.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../constants/colors';
import { useAppContext } from '../hooks/useAppContext';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { trustedContact, recentResult } = useAppContext();

  async function handleCall(): Promise<void> {
    if (!trustedContact) {
      Alert.alert(
        'No trusted contact saved',
        'Go to Settings to add a trusted person you can call for help.',
        [
          { text: 'Go to Settings', onPress: () => router.push('/trusted-contact') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    try {
      await Linking.openURL('tel:' + trustedContact.phoneNumber);
    } catch {
      Alert.alert('Could not start call', trustedContact.phoneNumber);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>🛡️ TrustPause</Text>
          <Text style={styles.tagline}>You're safe. Let's check together.</Text>
        </View>

        {/* Recent result banner */}
        {recentResult && (
          <TouchableOpacity
            style={[
              styles.recentBanner,
              recentResult.riskLevel === 'High Risk' && styles.recentBannerRed,
              recentResult.riskLevel === 'Be Careful' && styles.recentBannerAmber,
              recentResult.riskLevel === 'Probably Safe' && styles.recentBannerGreen,
            ]}
            onPress={() => router.push('/results')}
            accessibilityRole="button"
            accessibilityLabel={`Last check: ${recentResult.riskLevel}. Tap to view.`}
          >
            <Text style={styles.recentBannerLabel}>Last check</Text>
            <Text style={styles.recentBannerRisk}>{recentResult.riskLevel}</Text>
            <Text style={styles.recentBannerTap}>Tap to view →</Text>
          </TouchableOpacity>
        )}

        {/* Main question */}
        <Text style={styles.question}>
          Something feel off?
        </Text>

        {/* Primary action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.bigButton}
            onPress={() => router.push('/voice-input')}
            accessibilityRole="button"
            accessibilityLabel="Tell me what happened"
          >
            <Text style={styles.bigButtonIcon}>🎤</Text>
            <View style={styles.bigButtonText}>
              <Text style={styles.bigButtonTitle}>Tell me what happened</Text>
              <Text style={styles.bigButtonSub}>Describe a suspicious call or message</Text>
            </View>
            <Text style={styles.bigButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bigButton}
            onPress={() => router.push('/photo-input')}
            accessibilityRole="button"
            accessibilityLabel="Show a message or photo"
          >
            <Text style={styles.bigButtonIcon}>📷</Text>
            <View style={styles.bigButtonText}>
              <Text style={styles.bigButtonTitle}>Show a message or photo</Text>
              <Text style={styles.bigButtonSub}>Take a photo of a suspicious text or email</Text>
            </View>
            <Text style={styles.bigButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bigButton}
            onPress={() => router.push('/demo-scenarios')}
            accessibilityRole="button"
            accessibilityLabel="See example scams"
          >
            <Text style={styles.bigButtonIcon}>📚</Text>
            <View style={styles.bigButtonText}>
              <Text style={styles.bigButtonTitle}>See example scams</Text>
              <Text style={styles.bigButtonSub}>Learn what common scams look like</Text>
            </View>
            <Text style={styles.bigButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency call button */}
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCall}
          accessibilityRole="button"
          accessibilityLabel={
            trustedContact
              ? `Call ${trustedContact.name}`
              : 'Set up trusted contact'
          }
        >
          <Text style={styles.callButtonIcon}>📞</Text>
          <View>
            <Text style={styles.callButtonTitle}>
              {trustedContact ? `Call ${trustedContact.name}` : 'Call my trusted person'}
            </Text>
            {trustedContact && (
              <Text style={styles.callButtonSub}>{trustedContact.relationship}</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Settings link */}
        <TouchableOpacity
          style={styles.settingsLink}
          onPress={() => router.push('/trusted-contact')}
          accessibilityRole="button"
        >
          <Text style={styles.settingsLinkText}>
            ⚙️ {trustedContact ? 'Change trusted contact' : 'Set up trusted contact'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.deepNavy,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    color: Colors.grayText,
    marginTop: 4,
    textAlign: 'center',
  },
  recentBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentBannerRed: { backgroundColor: '#FDECEA' },
  recentBannerAmber: { backgroundColor: '#FFF8E7' },
  recentBannerGreen: { backgroundColor: '#EDF7EE' },
  recentBannerLabel: {
    fontSize: 14,
    color: Colors.grayText,
    flex: 0,
  },
  recentBannerRisk: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkText,
    flex: 1,
  },
  recentBannerTap: {
    fontSize: 14,
    color: Colors.softBlue,
  },
  question: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.darkText,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  bigButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 88,
  },
  bigButtonIcon: {
    fontSize: 32,
  },
  bigButtonText: {
    flex: 1,
    gap: 2,
  },
  bigButtonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkText,
  },
  bigButtonSub: {
    fontSize: 15,
    color: Colors.grayText,
    lineHeight: 20,
  },
  bigButtonArrow: {
    fontSize: 28,
    color: Colors.softBlue,
    fontWeight: '300',
  },
  callButton: {
    backgroundColor: Colors.red,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 88,
  },
  callButtonIcon: {
    fontSize: 32,
  },
  callButtonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callButtonSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  settingsLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingsLinkText: {
    fontSize: 16,
    color: Colors.softBlue,
  },
});
