/**
 * Voice Input screen — describe what happened in your own words.
 */

import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  InputAccessoryView,
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

const INPUT_ACCESSORY_ID = 'voice-input-done';

export default function VoiceInputScreen(): React.JSX.Element {
  const router = useRouter();
  const { saveResult } = useRecentResult();
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const inputYRef = useRef<number>(0);

  const [text, setText] = useState('');

  async function handleAnalyze(): Promise<void> {
    Keyboard.dismiss();
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
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={styles.back} onPress={() => { Keyboard.dismiss(); router.back(); }}>
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
            <Text style={styles.examplesLabel}>Tap an example to start:</Text>
            {[
              'Someone called saying they were from my bank and needed my account number',
              'I got a text saying my Amazon order was flagged and I need to call immediately',
              'They said I owed money to the IRS and would be arrested if I didn\'t pay',
            ].map((ex, i) => (
              <TouchableOpacity
                key={i}
                style={styles.exampleChip}
                onPress={() => {
                  setText(ex);
                  inputRef.current?.focus();
                  // Wait for keyboard to animate up, then snap to input
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: inputYRef.current - 20, animated: true });
                  }, 350);
                }}
              >
                <Text style={styles.exampleChipText}>"{ex}"</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text input */}
          <TextInput
            ref={inputRef}
            style={styles.input}
            multiline
            value={text}
            onChangeText={(val) => {
              setText(val);
              // Snap scroll to input when user starts typing
              if (val.length === 1) {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: inputYRef.current - 20, animated: true });
                }, 50);
              }
            }}
            placeholder="Type here what happened…"
            placeholderTextColor={Colors.grayText}
            textAlignVertical="top"
            autoCorrect
            autoCapitalize="sentences"
            accessibilityLabel="Describe what happened"
            inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
            returnKeyType="default"
            onLayout={(e) => { inputYRef.current = e.nativeEvent.layout.y; }}
          />

          {/* Analyze button */}
          <TouchableOpacity
            style={[styles.analyzeBtn, !canAnalyze && styles.analyzeBtnDisabled]}
            onPress={handleAnalyze}
            disabled={!canAnalyze}
            accessibilityRole="button"
          >
            <Text style={styles.analyzeBtnText}>
              {isAnalyzing ? '⏳ Checking…' : '🔍 Check for scam'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => { Keyboard.dismiss(); router.back(); }}
            accessibilityRole="button"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* iOS keyboard toolbar with Done button */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <View style={styles.toolbar}>
            <Text style={styles.toolbarHint}>
              {text.trim().length > 0 ? `${text.trim().length} characters` : 'Type what happened…'}
            </Text>
            <TouchableOpacity
              style={styles.toolbarDone}
              onPress={Keyboard.dismiss}
            >
              <Text style={styles.toolbarDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.cream },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  back: { paddingVertical: 4 },
  backText: { fontSize: 18, color: Colors.softBlue, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.darkText },
  subtitle: { fontSize: 18, color: Colors.grayText, lineHeight: 26 },
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
  exampleChipText: { fontSize: 16, color: Colors.softBlue, lineHeight: 22 },
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
  analyzeBtnDisabled: { opacity: 0.4 },
  analyzeBtnText: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { fontSize: 18, color: Colors.grayText },
  toolbar: {
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderTopColor: '#C8C8CC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolbarHint: { fontSize: 14, color: Colors.grayText },
  toolbarDone: {
    backgroundColor: Colors.deepNavy,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  toolbarDoneText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
