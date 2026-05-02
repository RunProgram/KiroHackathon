/**
 * Home screen — static, no scroll. Everything fits on one screen.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Linking,
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

    // If multiple contacts, show picker
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
      <View style={styles.container}>

        {/* App header */}
        <View style={styles.header}>
          <Text style={styles.appName}>🛡️ TrustPause</Text>
          <Text style={styles.tagline}>You're safe. Let's check together.</Text>
        </View>

        {/* Recent result — compact */}
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
                {recentResult.riskLevel === 'High Risk' ? '🚨 ' : recentResult.riskLevel === 'Be Careful' ? '⚠️ ' : '✅ '}
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
        ) : (
          <View style={styles.recentPlaceholder}>
            <Text style={styles.recentPlaceholderText}>No checks yet — tap below to get started</Text>
          </View>
        )}

        {/* Main actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.bigBtn}
            onPress={() => router.push('/voice-input')}
            accessibilityRole="button"
          >
            <Text style={styles.bigBtnIcon}>🎤</Text>
            <View style={styles.bigBtnText}>
              <Text style={styles.bigBtnTitle}>Tell me what happened</Text>
              <Text style={styles.bigBtnSub}>Describe a suspicious call or message</Text>
            </View>
            <Text style={styles.bigBtnArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bigBtn}
            onPress={() => router.push('/photo-input')}
            accessibilityRole="button"
          >
            <Text style={styles.bigBtnIcon}>📷</Text>
            <View style={styles.bigBtnText}>
              <Text style={styles.bigBtnTitle}>Show a message or photo</Text>
              <Text style={styles.bigBtnSub}>Photo of a suspicious text or email</Text>
            </View>
            <Text style={styles.bigBtnArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bigBtn}
            onPress={() => router.push('/demo-scenarios')}
            accessibilityRole="button"
          >
            <Text style={styles.bigBtnIcon}>📚</Text>
            <View style={styles.bigBtnText}>
              <Text style={styles.bigBtnTitle}>See example scams</Text>
              <Text style={styles.bigBtnSub}>Learn what common scams look like</Text>
            </View>
            <Text style={styles.bigBtnArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom row: call + settings */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCall}
            accessibilityRole="button"
          >
            <Text style={styles.callBtnIcon}>📞</Text>
            <View>
              <Text style={styles.callBtnTitle}>
                {trustedContact ? `Call ${trustedContact.name}` : 'Call trusted person'}
              </Text>
              {trustedContact && (
                <Text style={styles.callBtnSub}>{trustedContact.relationship}</Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => router.push('/trusted-contact')}
            accessibilityRole="button"
          >
            <Text style={styles.settingsBtnIcon}>⚙️</Text>
            <Text style={styles.settingsBtnText}>Settings</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  header: { alignItems: 'center', paddingBottom: 4 },
  appName: { fontSize: 30, fontWeight: '800', color: Colors.deepNavy },
  tagline: { fontSize: 16, color: Colors.grayText, marginTop: 2 },

  recentBanner: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  bannerRed: { backgroundColor: '#FDECEA', borderColor: Colors.red },
  bannerAmber: { backgroundColor: '#FFF8E7', borderColor: Colors.amber },
  bannerGreen: { backgroundColor: '#EDF7EE', borderColor: Colors.green },
  recentLeft: { flex: 1, gap: 2 },
  recentLabel: { fontSize: 11, color: Colors.grayText, fontWeight: '700', letterSpacing: 0.8 },
  recentRisk: { fontSize: 18, fontWeight: '800' },
  recentSummary: { fontSize: 13, color: Colors.grayText, fontStyle: 'italic' },
  recentArrow: { fontSize: 14, color: Colors.softBlue, fontWeight: '600' },
  recentPlaceholder: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0DDD6',
    alignItems: 'center',
  },
  recentPlaceholderText: { fontSize: 15, color: Colors.grayText },

  actions: { flex: 1, gap: 10, justifyContent: 'center' },
  bigBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
  },
  bigBtnIcon: { fontSize: 28 },
  bigBtnText: { flex: 1, gap: 1 },
  bigBtnTitle: { fontSize: 18, fontWeight: '700', color: Colors.darkText },
  bigBtnSub: { fontSize: 13, color: Colors.grayText, lineHeight: 18 },
  bigBtnArrow: { fontSize: 26, color: Colors.softBlue, fontWeight: '300' },

  bottomRow: { flexDirection: 'row', gap: 10 },
  callBtn: {
    flex: 1,
    backgroundColor: Colors.red,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 72,
  },
  callBtnIcon: { fontSize: 24 },
  callBtnTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  callBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  settingsBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsBtnIcon: { fontSize: 22 },
  settingsBtnText: { fontSize: 13, color: Colors.grayText, fontWeight: '600' },
});
