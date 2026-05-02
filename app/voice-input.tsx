/**
 * Voice Input screen.
 *
 * Speech recognition requires a native dev build (not available in Expo Go).
 * This screen provides a large text input so users can type what happened,
 * with the mic button showing a clear message about the limitation.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LargeMicButton } from '../components/LargeMicButton';
import { PrimaryActionButton } from '../components/PrimaryActionButton';
import { SecondaryActionButton } from '../components/SecondaryActionButton';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { Typography } from '../constants/typography';
import { useRecentResult } from '../hooks/useRecentResult';
import { analyzeScamRisk } from '../lib/analyzeScamRisk';

export default function VoiceInputScreen(): React.JSX.Element {
  const router = useRouter();
  const { saveResult } = useRecentResult();
  const inputRef = useRef<TextInput>(null);

  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // -------------------------------------------------------------------------
  // Mic button — focuses the text input and explains to type
  // -------------------------------------------------------------------------

  function handleMicPress(): void {
    inputRef.current?.focus();
    Alert.alert(
      'Type what happened',
      'Describe the suspicious call or message in your own words below, then tap Analyze.',
      [{ text: 'OK' }],
    );
  }

  // -------------------------------------------------------------------------
  // Analyze
  // -------------------------------------------------------------------------

  async function handleAnalyze(): Promise<void> {
    const text = transcript.trim();
    if (!text) return;
    setIsAnalyzing(true);
    try {
      const result = analyzeScamRisk(text);
      console.log('[TrustPause] Analyzing:', text.slice(0, 80));
      console.log('[TrustPause] Result:', result.riskLevel, result.redFlags);
      await saveResult(result);
      router.push('/results');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // -------------------------------------------------------------------------
  // Cancel
  // -------------------------------------------------------------------------

  function handleCancel(): void {
    router.back();
  }

  const analyzeDisabled = !transcript.trim() || isAnalyzing;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{Strings.screenTitles.voiceInput}</Text>

        <Text style={styles.instructions}>
          Describe what happened in your own words. What did they say? What did they ask for?
        </Text>

        {/* Mic button */}
        <View style={styles.micContainer}>
          <LargeMicButton
            isRecording={false}
            onPress={handleMicPress}
            accessibilityLabel="Tap to get instructions for describing what happened"
          />
          <Text style={styles.micHint}>Tap mic or type below</Text>
        </View>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={styles.transcriptInput}
          multiline
          value={transcript}
          onChangeText={setTranscript}
          placeholder={
            'Example: "Someone called saying they were from my bank and needed my account number immediately…"'
          }
          placeholderTextColor={Colors.grayText}
          accessibilityLabel="Describe what happened"
          textAlignVertical="top"
          autoCorrect
          autoCapitalize="sentences"
        />

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <PrimaryActionButton
            label={isAnalyzing ? 'Analyzing…' : Strings.buttons.analyze}
            onPress={handleAnalyze}
            disabled={analyzeDisabled}
          />
          <SecondaryActionButton
            label={Strings.buttons.cancel}
            onPress={handleCancel}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: Typography.headingSize,
    fontWeight: '700',
    color: Colors.darkText,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructions: {
    fontSize: Typography.bodySize,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: Typography.bodySize * 1.5,
    marginBottom: 32,
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  micHint: {
    marginTop: 12,
    fontSize: Typography.captionSize,
    color: Colors.grayText,
  },
  transcriptInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.softBlue,
    padding: 16,
    fontSize: Typography.bodySize,
    color: Colors.darkText,
    minHeight: 160,
    lineHeight: Typography.bodySize * 1.5,
    marginBottom: 32,
  },
  actionsContainer: {
    gap: 16,
  },
});
