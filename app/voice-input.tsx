/**
 * Voice Input screen — describe what happened in your own words.
 */

import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
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

export default function VoiceInputScreen(): React.JSX.Element {
  const router = useRouter();
  const { saveResult } = useRecentResult();
  const inputRef = useRef<TextInput>(null);

  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleAnalyze(): Promise<void> {
    const trimmed = text.trim();
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

  const canAnalyze = text.trim().length > 0 && !isAnalyzing;

  return (
    <SafeAreaView style={styles.safe}>
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
        <Text style={styles.title}>🎤 What happened?</Text>
        <Text style={styles.subtitle}>
          Describe the call or message in your own words.{'\n'}
          Don't worry about spelling — just tell us what they said.
        </Text>

        {/* Example prompts */}
        <View style={styles.examples}>
          <Text style={styles.examplesLabel}>For example:</Text>
          {[
            '"Someone called saying they were from my bank…"',
            '"I got a text saying my Amazon order was flagged…"',
            '"They said I owed money to the IRS…"',
          ].map((ex, i) => (
            <TouchableOpacity
              key={i}
              style={styles.exampleChip}
              onPress={() => {
                setText(ex.replace(/"/g, ''));
                inputRef.current?.focus();
              }}
            >
              <Text style={styles.exampleChipText}>{ex}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          multiline
          value={text}
          onChangeText={setText}
          placeholder="Type here what happened…"
          placeholderTextColor={Colors.grayText}
          textAlignVertical="top"
          autoCorrect
          autoCapitalize="sentences"
          accessibilityLabel="Describe what happened"
        />

        {/* Analyze button */}
        <TouchableOpacity
          style={[styles.analyzeBtn, !canAnalyze && styles.analyzeBtnDisabled]}
          onPress={handleAnalyze}
          disabled={!canAnalyze}
          accessibilityRole="button"
          accessibilityLabel="Check if this is a scam"
        >
          <Text style={styles.analyzeBtnText}>
            {isAnalyzing ? '⏳ Checking…' : '🔍 Check for scam'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.darkText,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.grayText,
    lineHeight: 26,
  },
  examples: {
    gap: 8,
  },
  examplesLabel: {
    fontSize: 16,
    color: Colors.grayText,
    fontWeight: '600',
  },
  exampleChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.softBlue,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  exampleChipText: {
    fontSize: 16,
    color: Colors.softBlue,
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.softBlue,
    padding: 18,
    fontSize: 20,
    color: Colors.darkText,
    minHeight: 160,
    lineHeight: 28,
  },
  analyzeBtn: {
    backgroundColor: Colors.deepNavy,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    minHeight: 72,
    justifyContent: 'center',
  },
  analyzeBtnDisabled: {
    opacity: 0.4,
  },
  analyzeBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 18,
    color: Colors.grayText,
  },
});
