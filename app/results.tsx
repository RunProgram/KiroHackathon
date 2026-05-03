/**
 * Results screen — clear, calm summary of the scam check.
 */

import * as Speech from 'expo-speech';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
    icon: '',
    headline: 'This looks like a scam',
    color: Colors.red,
  },
  'Be Careful': {
    bg: '#FFF8E7',
    border: Colors.amber,
    icon: '',
    headline: 'Be careful — something seems off',
    color: Colors.amber,
  },
  'Probably Safe': {
    bg: '#EDF7EE',
    border: Colors.green,
    icon: '',
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
  impersonation_amazon: 'Pretending to be Amazon / delivery service',
  impersonation_medicare: 'Pretending to be Medicare',
  impersonation_irs: 'Pretending to be the IRS',
  impersonation_government: 'Pretending to be a government agency',
  impersonation_family: 'Pretending to be a family member',
  impersonation_police: 'Pretending to be police / law enforcement',
  impersonation_tech_support: 'Fake tech support scam',
  lottery_prize_scam: 'Fake prize / lottery scam',
  romance_scam: 'Romance / relationship scam',
};

const SCAM_TYPE_LABELS: Record<string, string> = {
  bank_impersonation: 'Bank Impersonation Scam',
  grandparent_scam: 'Grandparent / Family Emergency Scam',
  medicare_government: 'Government Impersonation Scam',
  amazon_delivery: 'Delivery / Shopping Scam',
  tech_support: 'Tech Support Scam',
  irs_tax: 'IRS / Tax Scam',
  lottery_prize: 'Lottery / Prize Scam',
  romance_scam: 'Romance Scam',
  unknown: 'Suspicious Activity',
};

export default function ResultsScreen(): React.JSX.Element {
  const router = useRouter();
  const { recentResult, trustedContact } = useAppContext();
  const [ready, setReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Stop speech when leaving screen
  useEffect(() => {
    return () => { Speech.stop(); };
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

  async function handleSpeakToggle(): Promise<void> {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const text =
      config.headline + '. ' +
      (result.redFlags.length > 0
        ? 'Warning signs: ' + result.redFlags.map((f) => FLAG_LABELS[f] ?? f).join(', ') + '. '
        : '') +
      'What to do: ' + result.doNow.join('. ') + '. ' +
      'What to say: ' + result.safeResponseScript;

    if (!text.trim()) {
      Alert.alert('Nothing to Read', 'There is no text available to read aloud.');
      return;
    }

    setIsSpeaking(true);
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        Alert.alert('Read Aloud Failed', 'Text-to-speech could not play the audio. Please try again.');
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Pinned top bar — always visible */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => { Speech.stop(); router.back(); }}
          accessibilityRole="button"
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.speakBtn, isSpeaking && styles.speakBtnActive]}
          onPress={handleSpeakToggle}
          accessibilityRole="button"
          accessibilityLabel={isSpeaking ? 'Stop reading aloud' : 'Read aloud'}
        >
          <Text style={styles.speakBtnText}>
            {isSpeaking ? 'Stop' : 'Read aloud'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Risk banner */}
        <View style={[styles.riskBanner, { backgroundColor: config.bg, borderColor: config.border }]}>
          <Text style={[styles.riskHeadline, { color: config.color }]}>
            {config.headline}
          </Text>
          {result.inputSummary ? (
            <Text style={styles.riskSummary} numberOfLines={2}>
              "{result.inputSummary}"
            </Text>
          ) : null}
        </View>

        {/* Confidence section */}
        <View style={styles.confidenceSection}>
          <Text style={styles.confidenceTitle}>Analysis</Text>
          <Text style={styles.confidenceScamType}>
            {SCAM_TYPE_LABELS[result.scamType] ?? 'Suspicious Activity'}
          </Text>
          <Text style={styles.confidenceFlagCount}>
            {result.redFlags.length === 0
              ? 'No warning signs detected'
              : result.redFlags.length === 1
                ? '1 warning sign detected'
                : `${result.redFlags.length} warning signs detected`}
          </Text>
          <Text style={styles.confidenceDescription}>
            {result.redFlags.length === 0
              ? 'No warning signs detected'
              : result.redFlags.length === 1
                ? 'One warning sign found'
                : result.redFlags.length <= 3
                  ? 'Multiple warning signs found'
                  : 'Many warning signs found — very likely a scam'}
          </Text>
        </View>

        {/* Caregiver alert */}
        {result.caregiverRecommended && (
          <View style={styles.caregiverAlert}>
            <Text style={styles.caregiverAlertText}>
              We strongly recommend calling your trusted person about this right now.
            </Text>
            <TouchableOpacity
              style={styles.caregiverCallBtn}
              onPress={handleCall}
              accessibilityRole="button"
            >
              <Text style={styles.caregiverCallBtnText}>
                Call {trustedContact?.name ?? 'trusted person'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Warning signs */}
        {result.redFlags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Warning Signs Detected</Text>
            {result.redFlags.map((flag, i) => (
              <View key={`${flag}-${i}`} style={styles.flagRow}>
                <Text style={styles.flagDot}>•</Text>
                <Text style={styles.flagText}>{FLAG_LABELS[flag] ?? flag.replace(/_/g, ' ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* What to do */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What To Do Now</Text>
          {result.doNow.map((item, i) => (
            <View key={i} style={styles.actionRow}>
              <View style={styles.actionNumber}>
                <Text style={styles.actionNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.actionText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* What NOT to do */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Do NOT Do These</Text>
          {result.doNotDo.map((item, i) => (
            <View key={i} style={styles.flagRow}>
              <Text style={styles.flagDot}>✗</Text>
              <Text style={styles.flagText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* What to say */}
        <View style={styles.scriptSection}>
          <Text style={styles.scriptTitle}>What To Say</Text>
          <Text style={styles.scriptText}>"{result.safeResponseScript}"</Text>
        </View>

        {/* Call button */}
        {!result.caregiverRecommended && (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCall}
            accessibilityRole="button"
          >
            <Text style={styles.callBtnText}>
              Call {trustedContact?.name ?? 'trusted person'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  empty: { flex: 1, backgroundColor: Colors.cream },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backBtnText: { fontSize: 18, color: Colors.softBlue, fontWeight: '600' },
  speakBtn: {
    backgroundColor: Colors.softBlue,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  speakBtnActive: {
    backgroundColor: Colors.red,
  },
  speakBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
  },

  riskBanner: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  riskHeadline: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
  },
  riskSummary: {
    fontSize: 16,
    color: Colors.grayText,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 22,
  },

  confidenceSection: {
    backgroundColor: '#F4F5F7',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  confidenceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.grayText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  confidenceScamType: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.darkText,
    lineHeight: 24,
  },
  confidenceFlagCount: {
    fontSize: 14,
    color: Colors.grayText,
    lineHeight: 20,
  },
  confidenceDescription: {
    fontSize: 14,
    color: Colors.grayText,
    lineHeight: 20,
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
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.darkText },
  flagRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  flagDot: { fontSize: 16, color: Colors.red, fontWeight: '700', marginTop: 2 },
  flagText: { fontSize: 16, color: Colors.darkText, flex: 1, lineHeight: 22 },
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  actionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.deepNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  actionNumberText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionText: { fontSize: 16, color: Colors.darkText, flex: 1, lineHeight: 22 },

  scriptSection: {
    backgroundColor: Colors.deepNavy,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  scriptTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  scriptText: { fontSize: 16, color: '#FFFFFF', lineHeight: 24, fontStyle: 'italic' },

  callBtn: {
    backgroundColor: Colors.red,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  callBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
