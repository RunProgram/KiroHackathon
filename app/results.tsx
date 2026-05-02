/**
 * Results screen — clear, calm summary of the scam check.
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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../constants/colors';
import { useAppContext } from '../hooks/useAppContext';

const RISK_CONFIG = {
  'High Risk': {
    bg: '#FDECEA',
    border: Colors.red,
    icon: '🚨',
    headline: 'This looks like a scam',
    color: Colors.red,
  },
  'Be Careful': {
    bg: '#FFF8E7',
    border: Colors.amber,
    icon: '⚠️',
    headline: 'Be careful — something seems off',
    color: Colors.amber,
  },
  'Probably Safe': {
    bg: '#EDF7EE',
    border: Colors.green,
    icon: '✅',
    headline: 'This looks probably safe',
    color: Colors.green,
  },
} as const;

const FLAG_LABELS: Record<string, string> = {
  urgency: 'Creating urgency / pressure',
  secrecy: 'Asking you to keep it secret',
  money_transfer: 'Asking for money transfer',
  gift_card: 'Asking for gift cards',
  otp_request: 'Asking for a verification code',
  password_request: 'Asking for your password',
  ssn_medicare_request: 'Asking for Social Security / Medicare number',
  remote_access_request: 'Asking to access your computer',
  impersonation_bank: 'Pretending to be your bank',
  impersonation_amazon: 'Pretending to be Amazon',
  impersonation_medicare: 'Pretending to be Medicare',
  impersonation_irs: 'Pretending to be the IRS',
  impersonation_government: 'Pretending to be a government agency',
  impersonation_family: 'Pretending to be a family member',
  impersonation_police: 'Pretending to be police',
};

export default function ResultsScreen(): React.JSX.Element {
  const router = useRouter();
  const { recentResult, trustedContact } = useAppContext();

  const [ready, setReady] = React.useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && recentResult === null) router.replace('/');
  }, [ready, recentResult, router]);

  if (!ready || recentResult === null) {
    return <View style={styles.empty} />;
  }

  const result = recentResult;
  const config = RISK_CONFIG[result.riskLevel];

  function handleCall(): void {
    if (!trustedContact) {
      Alert.alert('No trusted contact', 'Go to Settings to add one.');
      return;
    }
    Linking.openURL('tel:' + trustedContact.phoneNumber).catch(() =>
      Alert.alert('Could not call', trustedContact.phoneNumber),
    );
  }

  function handleSpeak(): void {
    const text =
      config.headline +
      '. ' +
      (result.redFlags.length > 0
        ? 'Warning signs: ' + result.redFlags.map((f) => FLAG_LABELS[f] ?? f).join(', ') + '. '
        : '') +
      'What to do: ' +
      result.doNow.join('. ');
    Speech.speak(text, { rate: 0.85 });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Risk banner */}
        <View style={[styles.riskBanner, { backgroundColor: config.bg, borderColor: config.border }]}>
          <Text style={styles.riskIcon}>{config.icon}</Text>
          <Text style={[styles.riskHeadline, { color: config.color }]}>
            {config.headline}
          </Text>
          {result.inputSummary ? (
            <Text style={styles.riskSummary} numberOfLines={2}>
              "{result.inputSummary}"
            </Text>
          ) : null}
        </View>

        {/* Caregiver alert */}
        {result.caregiverRecommended && (
          <View style={styles.caregiverAlert}>
            <Text style={styles.caregiverAlertText}>
              📣 We strongly recommend calling your trusted person about this right now.
            </Text>
            <TouchableOpacity
              style={styles.caregiverCallBtn}
              onPress={handleCall}
              accessibilityRole="button"
            >
              <Text style={styles.caregiverCallBtnText}>
                📞 Call {trustedContact?.name ?? 'trusted person'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Warning signs */}
        {result.redFlags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Warning signs detected</Text>
            {result.redFlags.map((flag) => (
              <View key={flag} style={styles.flagRow}>
                <Text style={styles.flagDot}>•</Text>
                <Text style={styles.flagText}>{FLAG_LABELS[flag] ?? flag.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* What to do */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ What to do now</Text>
          {result.doNow.map((item, i) => (
            <View key={i} style={styles.actionRow}>
              <Text style={styles.actionNumber}>{i + 1}</Text>
              <Text style={styles.actionText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* What NOT to do */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚫 Do NOT do these</Text>
          {result.doNotDo.map((item, i) => (
            <View key={i} style={styles.flagRow}>
              <Text style={styles.flagDot}>✗</Text>
              <Text style={styles.flagText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* What to say */}
        <View style={styles.scriptSection}>
          <Text style={styles.sectionTitle}>💬 What to say to them</Text>
          <Text style={styles.scriptText}>"{result.safeResponseScript}"</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.speakBtn}
            onPress={handleSpeak}
            accessibilityRole="button"
          >
            <Text style={styles.speakBtnText}>🔊 Read this aloud to me</Text>
          </TouchableOpacity>

          {!result.caregiverRecommended && (
            <TouchableOpacity
              style={styles.callBtn}
              onPress={handleCall}
              accessibilityRole="button"
            >
              <Text style={styles.callBtnText}>
                📞 Call {trustedContact?.name ?? 'trusted person'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text style={styles.homeBtnText}>← Back to home</Text>
          </TouchableOpacity>
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
    paddingTop: 24,
    paddingBottom: 48,
    gap: 16,
  },
  empty: { flex: 1, backgroundColor: Colors.cream },
  riskBanner: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  riskIcon: { fontSize: 48 },
  riskHeadline: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
  },
  riskSummary: {
    fontSize: 16,
    color: Colors.grayText,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  caregiverAlert: {
    backgroundColor: Colors.red,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  caregiverAlertText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
    textAlign: 'center',
  },
  caregiverCallBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  caregiverCallBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.red,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkText,
  },
  flagRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  flagDot: {
    fontSize: 18,
    color: Colors.red,
    fontWeight: '700',
    marginTop: 1,
  },
  flagText: {
    fontSize: 18,
    color: Colors.darkText,
    flex: 1,
    lineHeight: 26,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  actionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.deepNavy,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    overflow: 'hidden',
  },
  actionText: {
    fontSize: 18,
    color: Colors.darkText,
    flex: 1,
    lineHeight: 26,
  },
  scriptSection: {
    backgroundColor: Colors.deepNavy,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  scriptText: {
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  actions: {
    gap: 12,
    marginTop: 4,
  },
  speakBtn: {
    backgroundColor: Colors.softBlue,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
  },
  speakBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callBtn: {
    backgroundColor: Colors.red,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
  },
  callBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  homeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  homeBtnText: {
    fontSize: 18,
    color: Colors.softBlue,
  },
});
