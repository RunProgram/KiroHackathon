/**
 * Home screen — scrollable list of actions with a clean, professional layout.
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
  const { trustedContacts, trustedContact, recentResult } = useAppContext();

  async function handleCall(): Promise<void> {
    if (!trustedContact) {
      Alert.alert(
        'No trusted contact saved',
        'Tap Settings below to add someone you trust.',
        [
          { text: 'Go to Settings', onPress: () => router.push('/trusted-contact') },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }
    if (trustedContacts.length > 1) {
      Alert.alert(
        'Call who?',
        'Choose a trusted contact to call:',
        [
          ...trustedContacts.map((c) => ({
            text: `${c.name} (${c.relationship})`,
            onPress: () => Linking.openURL('tel:' + c.phoneNumber).catch(() =>
              Alert.alert('Could not call', c.phoneNumber)
            ),
          })),
          { text: 'Cancel', style: 'cancel' as const },
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
          <Text style={styles.appName}>TrustPause</Text>
          <Text style={styles.tagline}>You're safe. Let's check together.</Text>
        </View>

        {/* Recent result */}
        {recentResult ? (
          <TouchableOpacity
            style={[
              styles.recentBanner,
              recentResult.riskLevel === 'High Risk' && styles.bannerRed,
              recentResult.riskLevel === 'Be Careful' && styles.bannerAmber,
              recentResult.riskLevel === 'Probably Safe' && styles.bannerGreen,
            ]}
            onPress={() => router.push('/results')}
            accessibilityRole="button"
          >
            <View style={styles.recentLeft}>
              <Text style={styles.recentLabel}>LAST CHECK</Text>
              <Text style={[
                styles.recentRisk,
                recentResult.riskLevel === 'High Risk' && { color: Colors.red },
                recentResult.riskLevel === 'Be Careful' && { color: Colors.amber },
                recentResult.riskLevel === 'Probably Safe' && { color: Colors.green },
              ]}>
                {recentResult.riskLevel}
              </Text>
              {recentResult.inputSummary ? (
                <Text style={styles.recentSummary} numberOfLines={1}>
                  "{recentResult.inputSummary}"
                </Text>
              ) : null}
            </View>
            <Text style={styles.recentArrow}>View →</Text>
          </TouchableOpacity>
        ) : null}

        {/* Section label */}
        <Text style={styles.sectionLabel}>CHECK SOMETHING</Text>

        {/* Primary action — most common use case */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/voice-input')}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnTitle}>Describe what happened</Text>
          <Text style={styles.primaryBtnSub}>Type out a suspicious call, text, or message</Text>
        </TouchableOpacity>

        {/* Secondary actions */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={() => router.push('/photo-input')}
            accessibilityRole="button"
          >
            <Text style={styles.gridBtnTitle}>Scan a photo</Text>
            <Text style={styles.gridBtnSub}>Screenshot or photo of a message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridBtn}
            onPress={() => router.push('/email-check')}
            accessibilityRole="button"
          >
            <Text style={styles.gridBtnTitle}>Check an email</Text>
            <Text style={styles.gridBtnSub}>Paste a suspicious email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={() => router.push('/url-check')}
            accessibilityRole="button"
          >
            <Text style={styles.gridBtnTitle}>Check a link</Text>
            <Text style={styles.gridBtnSub}>Paste a suspicious URL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridBtn}
            onPress={() => router.push('/demo-scenarios')}
            accessibilityRole="button"
          >
            <Text style={styles.gridBtnTitle}>Example scams</Text>
            <Text style={styles.gridBtnSub}>Learn what to look for</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom actions */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCall}
            accessibilityRole="button"
          >
            <Text style={styles.callBtnTitle}>
              {trustedContact ? `Call ${trustedContact.name}` : 'Call trusted person'}
            </Text>
            {trustedContact && (
              <Text style={styles.callBtnSub}>{trustedContact.relationship}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/trusted-contact')}
            accessibilityRole="button"
          >
            <Text style={styles.settingsBtnTitle}>Settings</Text>
            <Text style={styles.settingsBtnSub}>Contacts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
  },
  header: { alignItems: 'center', paddingBottom: 8 },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.deepNavy, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: Colors.grayText, marginTop: 4 },

  recentBanner: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  bannerRed: { backgroundColor: '#FDECEA', borderColor: Colors.red },
  bannerAmber: { backgroundColor: '#FFF8E7', borderColor: Colors.amber },
  bannerGreen: { backgroundColor: '#EDF7EE', borderColor: Colors.green },
  recentLeft: { flex: 1, gap: 2 },
  recentLabel: { fontSize: 10, color: Colors.grayText, fontWeight: '700', letterSpacing: 1 },
  recentRisk: { fontSize: 17, fontWeight: '800' },
  recentSummary: { fontSize: 13, color: Colors.grayText, fontStyle: 'italic' },
  recentArrow: { fontSize: 14, color: Colors.softBlue, fontWeight: '600' },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.grayText,
    letterSpacing: 1.2,
    marginTop: 4,
  },

  primaryBtn: {
    backgroundColor: Colors.deepNavy,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 4,
  },
  primaryBtnTitle: { fontSize: 19, fontWeight: '700', color: '#FFFFFF' },
  primaryBtnSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },

  grid: { flexDirection: 'row', gap: 12 },
  gridBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  gridBtnTitle: { fontSize: 16, fontWeight: '700', color: Colors.darkText },
  gridBtnSub: { fontSize: 12, color: Colors.grayText, lineHeight: 16 },

  bottomRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  callBtn: {
    flex: 1,
    backgroundColor: Colors.red,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    gap: 2,
  },
  callBtnTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  callBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  settingsBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  settingsBtnTitle: { fontSize: 15, fontWeight: '700', color: Colors.darkText },
  settingsBtnSub: { fontSize: 12, color: Colors.grayText },
});
