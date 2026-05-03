/**
 * Email Check screen — paste an entire email to analyze for scam indicators.
 * Single input field. URLs are scanned inline before navigating to results.
 */

import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import { useRecentResult } from '../hooks/useRecentResult';
import { analyzeScamRisk } from '../lib/analyzeScamRisk';
import { analyzeUrl, type UrlAnalysisResult } from '../lib/analyzeUrl';

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const domainRegex =
    /(?:^|\s)((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|org|net|gov|edu|io|co|us|uk|info|biz|xyz|top|club|online|site|store|app|dev|me|tv|cc|ru|cn|tk|ml|ga|cf|gq|icu|buzz|work|click|link|space|pw|ws|fun|monster|rest|cam)[^\s<>"{}|\\^`\[\]]*)/gi;
  const matches = new Set<string>();
  for (const m of text.match(urlRegex) ?? []) matches.add(m);
  for (const m of text.match(domainRegex) ?? []) matches.add(m.trim());
  return [...matches];
}

const EXAMPLES = [
  `Subject: Your account has been compromised\n\nDear customer, we detected unauthorized access to your bank account. Click here to verify: http://chase-secure-login.xyz/verify\n\nYou must act within 24 hours or your account will be permanently locked.\n\nSincerely, Chase Security Team`,
  `Subject: You've won $1,000,000!\n\nCongratulations! You have been selected as our grand prize winner. To claim your winnings, please send a processing fee of $500 via wire transfer immediately. This offer expires today.`,
  `Subject: USPS Delivery Failed\n\nYour package could not be delivered due to an unpaid shipping fee of $1.99. Update your information at: http://usps-redelivery.top/update to reschedule delivery.`,
];

export default function EmailCheckScreen(): React.JSX.Element {
  const router = useRouter();
  const { saveResult } = useRecentResult();
  const scrollRef = useRef<ScrollView>(null);

  const [emailText, setEmailText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [urlResults, setUrlResults] = useState<UrlAnalysisResult[]>([]);
  const [scanned, setScanned] = useState(false);

  function handleScan(): void {
    Keyboard.dismiss();
    const trimmed = emailText.trim();
    if (!trimmed) return;

    // Extract and scan URLs first
    const urls = extractUrls(trimmed);
    setUrlResults(urls.map((u) => analyzeUrl(u)));
    setScanned(true);

    // Scroll down to show results
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }

  async function handleFullAnalysis(): Promise<void> {
    const trimmed = emailText.trim();
    if (!trimmed) return;
    setIsAnalyzing(true);
    try {
      const result = analyzeScamRisk(trimmed);
      await saveResult(result);
      router.push('/results');
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleReset(): void {
    setEmailText('');
    setUrlResults([]);
    setScanned(false);
  }

  const canScan = emailText.trim().length > 0 && !isAnalyzing;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Check an Email</Text>
          <Text style={styles.subtitle}>
            Paste the full email below — subject, body, everything.
            We'll scan the text for scam patterns and check any links.
          </Text>

          {/* Single paste field */}
          <TextInput
            style={styles.input}
            value={emailText}
            onChangeText={(val) => {
              setEmailText(val);
              if (scanned) { setScanned(false); setUrlResults([]); }
            }}
            placeholder={'Paste the full email here…\n\nInclude the subject line, body, and any links.'}
            placeholderTextColor={Colors.grayText}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Paste email content"
          />

          {/* Examples */}
          {!scanned && (
            <View style={styles.examples}>
              <Text style={styles.examplesLabel}>Or try an example:</Text>
              {EXAMPLES.map((ex, i) => {
                const firstLine = ex.split('\n')[0];
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.exampleChip}
                    onPress={() => { setEmailText(ex); setScanned(false); setUrlResults([]); }}
                  >
                    <Text style={styles.exampleChipTitle}>{firstLine}</Text>
                    <Text style={styles.exampleChipBody} numberOfLines={1}>
                      {ex.split('\n').filter(l => l.trim()).slice(1).join(' ').slice(0, 80)}…
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Scan button */}
          {!scanned && (
            <TouchableOpacity
              style={[styles.scanBtn, !canScan && styles.scanBtnDisabled]}
              onPress={handleScan}
              disabled={!canScan}
              accessibilityRole="button"
            >
              <Text style={styles.scanBtnText}>Scan Email</Text>
            </TouchableOpacity>
          )}

          {/* Results section */}
          {scanned && (
            <View style={styles.resultsSection}>
              {/* URL results */}
              {urlResults.length > 0 ? (
                <View style={styles.urlSection}>
                  <Text style={styles.urlSectionTitle}>
                    {urlResults.length} {urlResults.length === 1 ? 'link' : 'links'} found
                  </Text>
                  {urlResults.map((ur, i) => (
                    <View
                      key={i}
                      style={[
                        styles.urlCard,
                        ur.riskLevel === 'Dangerous' && styles.urlCardDangerous,
                        ur.riskLevel === 'Suspicious' && styles.urlCardSuspicious,
                        ur.riskLevel === 'Probably Safe' && styles.urlCardSafe,
                      ]}
                    >
                      <Text style={[
                        styles.urlCardRisk,
                        ur.riskLevel === 'Dangerous' && { color: Colors.red },
                        ur.riskLevel === 'Suspicious' && { color: Colors.amber },
                        ur.riskLevel === 'Probably Safe' && { color: Colors.green },
                      ]}>
                        {ur.riskLevel}
                      </Text>
                      <Text style={styles.urlCardUrl} numberOfLines={2}>{ur.url}</Text>
                      {ur.flags.length > 0 && (
                        <View style={styles.urlCardFlags}>
                          {ur.flags.map((flag, j) => (
                            <Text key={j} style={styles.urlCardFlag}>• {flag}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noLinksBox}>
                  <Text style={styles.noLinksText}>No links found in this email</Text>
                </View>
              )}

              {/* Full analysis button */}
              <TouchableOpacity
                style={styles.analyzeBtn}
                onPress={handleFullAnalysis}
                disabled={isAnalyzing}
                accessibilityRole="button"
              >
                <Text style={styles.analyzeBtnText}>
                  {isAnalyzing ? 'Analyzing…' : 'Run Full Scam Analysis'}
                </Text>
              </TouchableOpacity>

              {/* Reset */}
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>Check Another Email</Text>
              </TouchableOpacity>
            </View>
          )}

          {!scanned && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
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
  title: { fontSize: 24, fontWeight: '800', color: Colors.darkText },
  subtitle: { fontSize: 15, color: Colors.grayText, lineHeight: 22 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    padding: 16,
    fontSize: 15,
    color: Colors.darkText,
    minHeight: 200,
    lineHeight: 22,
  },
  examples: { gap: 8 },
  examplesLabel: { fontSize: 14, color: Colors.grayText, fontWeight: '600' },
  exampleChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  exampleChipTitle: { fontSize: 14, fontWeight: '700', color: Colors.darkText },
  exampleChipBody: { fontSize: 13, color: Colors.grayText },
  scanBtn: {
    backgroundColor: Colors.deepNavy,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scanBtnDisabled: { opacity: 0.4 },
  scanBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  resultsSection: { gap: 14 },
  urlSection: { gap: 10 },
  urlSectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.darkText },
  urlCard: {
    borderRadius: 10,
    padding: 14,
    gap: 6,
    borderWidth: 1,
  },
  urlCardDangerous: { backgroundColor: '#FDECEA', borderColor: Colors.red },
  urlCardSuspicious: { backgroundColor: '#FFF8E7', borderColor: Colors.amber },
  urlCardSafe: { backgroundColor: '#EDF7EE', borderColor: Colors.green },
  urlCardRisk: { fontSize: 16, fontWeight: '800' },
  urlCardUrl: { fontSize: 13, color: Colors.grayText, fontFamily: 'monospace' },
  urlCardFlags: { gap: 3 },
  urlCardFlag: { fontSize: 14, color: Colors.darkText, lineHeight: 20 },
  noLinksBox: {
    backgroundColor: '#F4F5F7',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  noLinksText: { fontSize: 15, color: Colors.grayText },
  analyzeBtn: {
    backgroundColor: Colors.deepNavy,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  analyzeBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  resetBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4D4D8',
  },
  resetBtnText: { fontSize: 15, fontWeight: '600', color: Colors.grayText },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { fontSize: 16, color: Colors.grayText },
});
