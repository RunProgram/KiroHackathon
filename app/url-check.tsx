/**
 * URL Check screen — paste a suspicious link to scan it.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { analyzeUrl, type UrlAnalysisResult } from '../lib/analyzeUrl';

const RISK_CONFIG = {
  Dangerous: { bg: '#FDECEA', border: Colors.red, icon: '', color: Colors.red },
  Suspicious: { bg: '#FFF8E7', border: Colors.amber, icon: '', color: Colors.amber },
  'Probably Safe': { bg: '#EDF7EE', border: Colors.green, icon: '', color: Colors.green },
} as const;

export default function UrlCheckScreen(): React.JSX.Element {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<UrlAnalysisResult | null>(null);

  function handleCheck(): void {
    Keyboard.dismiss();
    const trimmed = url.trim();
    if (!trimmed) return;
    setResult(analyzeUrl(trimmed));
  }

  function handleReset(): void {
    setUrl('');
    setResult(null);
  }

  const canCheck = url.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <Text style={styles.title}>Check a Link</Text>
          <Text style={styles.subtitle}>
            Paste a suspicious URL below and we'll scan it for scam indicators.
          </Text>

          {/* URL input */}
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="Paste URL here…"
            placeholderTextColor={Colors.grayText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            accessibilityLabel="Enter URL to check"
          />

          {/* Example URLs */}
          <View style={styles.examples}>
            <Text style={styles.examplesLabel}>Try an example:</Text>
            {[
              'http://amaz0n-verify.xyz/login/secure',
              'https://usps-delivery-update.top/track',
              'http://192.168.1.1:8080/paypal/verify',
              'https://bit.ly/3xScAmLink',
            ].map((ex, i) => (
              <TouchableOpacity
                key={i}
                style={styles.exampleChip}
                onPress={() => { setUrl(ex); setResult(null); }}
              >
                <Text style={styles.exampleChipText} numberOfLines={1}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Check button */}
          <TouchableOpacity
            style={[styles.checkBtn, !canCheck && styles.checkBtnDisabled]}
            onPress={handleCheck}
            disabled={!canCheck}
            accessibilityRole="button"
          >
            <Text style={styles.checkBtnText}>Scan URL</Text>
          </TouchableOpacity>

          {/* Results */}
          {result && (
            <View style={styles.results}>
              {/* Risk banner */}
              <View style={[
                styles.riskBanner,
                { backgroundColor: RISK_CONFIG[result.riskLevel].bg, borderColor: RISK_CONFIG[result.riskLevel].border },
              ]}>
                <Text style={[styles.riskText, { color: RISK_CONFIG[result.riskLevel].color }]}>
                  {result.riskLevel}
                </Text>
                <Text style={styles.domainText}>Domain: {result.domain}</Text>
              </View>

              {/* Flags */}
              {result.flags.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Issues Found</Text>
                  {result.flags.map((flag, i) => (
                    <View key={i} style={styles.flagRow}>
                      <Text style={styles.flagDot}>•</Text>
                      <Text style={styles.flagText}>{flag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Advice */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What To Do</Text>
                {result.advice.map((item, i) => (
                  <View key={i} style={styles.flagRow}>
                    <Text style={styles.actionNumber}>{i + 1}</Text>
                    <Text style={styles.flagText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Check another */}
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>Check Another URL</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    padding: 16,
    fontSize: 16,
    color: Colors.darkText,
    minHeight: 48,
  },
  examples: { gap: 8 },
  examplesLabel: { fontSize: 16, color: Colors.grayText, fontWeight: '600' },
  exampleChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.softBlue,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  exampleChipText: { fontSize: 14, color: Colors.softBlue, fontFamily: 'monospace' },
  checkBtn: {
    backgroundColor: Colors.deepNavy,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  checkBtnDisabled: { opacity: 0.4 },
  checkBtnText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  results: { gap: 16 },
  riskBanner: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  riskText: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  domainText: { fontSize: 14, color: Colors.grayText, fontFamily: 'monospace' },
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
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.darkText },
  flagRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flagDot: { fontSize: 18, color: Colors.red, fontWeight: '700', marginTop: 2 },
  flagText: { fontSize: 17, color: Colors.darkText, flex: 1, lineHeight: 24 },
  actionNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.deepNavy,
    width: 20,
    marginTop: 2,
  },
  resetBtn: {
    backgroundColor: Colors.softBlue,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetBtnText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
});
