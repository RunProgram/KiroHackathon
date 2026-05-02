/**
 * Voice Input screen — describe what happened by typing or speaking.
 */

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

  // Speech recognition event handlers
  useSpeechRecognitionEvent('start', () => {
    setRecognizing(true);
  });

  useSpeechRecognitionEvent('end', () => {
    setRecognizing(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      setText(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.log('Speech recognition error:', event.error, event.message);
    setRecognizing(false);
  });

  async function handleMicPress(): Promise<void> {
    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
    } else {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true,
      });
    }
  }

  async function handleAnalyze(): Promise<void> {
    Keyboard.dismiss();
    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
    }
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

  const canAnalyze = text.trim().length > 0 && !isAnalyzing && !recognizing;

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
            Tap the microphone to speak, or type below.{'\n'}
            Don't worry about getting it perfect — just tell us what they said.
          </Text>

          {/* Big mic button */}
          <View style={styles.micSection}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                recognizing && styles.micBtnRecording,
              ]}
              onPress={handleMicPress}
              disabled={isAnalyzing}
              accessibilityRole="button"
              accessibilityLabel={recognizing ? 'Stop recording' : 'Start recording'}
            >
              <Text style={styles.micBtnIcon}>{recognizing ? '⏹' : '🎤'}</Text>
            </TouchableOpacity>
            <Text style={styles.micLabel}>
              {recognizing ? 'Listening… tap to stop' : 'Tap to speak'}
            </Text>
            {recognizing && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Recording</Text>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or type below</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Text input */}
          <TextInput
            ref={inputRef}
            style={styles.input}
            multiline
            value={text}
            onChangeText={(val) => {
              setText(val);
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

          {/* Example prompts — below the text box */}
          <View style={styles.examples}>
            <Text style={styles.examplesLabel}>Or tap an example to start:</Text>
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
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ y: inputYRef.current - 20, animated: true });
                  }, 350);
                }}
              >
                <Text style={styles.exampleChipText}>"{ex}"</Text>
              </TouchableOpacity>
            ))}
          </View>

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

  // Mic button
  micSection: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  micBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.deepNavy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  micBtnRecording: {
    backgroundColor: Colors.red,
  },
  micBtnIcon: { fontSize: 48 },
  micLabel: { fontSize: 18, color: Colors.grayText, fontWeight: '600' },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.red,
  },
  recordingText: { fontSize: 16, color: Colors.red, fontWeight: '700' },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D9D5CE',
  },
  dividerText: { fontSize: 14, color: Colors.grayText },

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
