/**
 * Voice Input screen — record audio, transcribe, and analyze for scam risk.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */

import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { transcribeAudio } from '../lib/transcribeAudio';

export default function VoiceInputScreen(): React.JSX.Element {
  const router = useRouter();
  const { saveResult } = useRecentResult();

  // expo-audio recorder hook — uses HIGH_QUALITY preset
  // Note: AudioModule.requestRecordingPermissionsAsync() is the expo-audio API.
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [noSpeechDetected, setNoSpeechDetected] = useState(false);

  // -------------------------------------------------------------------------
  // Permission helper
  // -------------------------------------------------------------------------

  async function requestMicrophonePermission(): Promise<boolean> {
    const { granted } = await requestRecordingPermissionsAsync();

    if (!granted) {
      Alert.alert(
        'Microphone access needed',
        'TrustPause needs microphone access to record your voice. ' +
          'Please enable it in your device Settings under Privacy → Microphone.',
        [{ text: 'OK' }],
      );
      return false;
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // Recording toggle
  // -------------------------------------------------------------------------

  async function handleMicPress(): Promise<void> {
    if (isRecording) {
      await audioRecorder.stop();
      setIsRecording(false);

      const audioUri = audioRecorder.uri ?? '';

      setIsTranscribing(true);
      setNoSpeechDetected(false);
      try {
        const result = await transcribeAudio(audioUri);
        setTranscript(result);
        if (!result) {
          setNoSpeechDetected(true);
        }
      } catch {
        setTranscript('');
        setNoSpeechDetected(true);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      const permitted = await requestMicrophonePermission();
      if (!permitted) return;

      try {
        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsRecording(true);
        setTranscript('');
        setNoSpeechDetected(false);
      } catch {
        Alert.alert(
          'Recording error',
          'Could not start recording. Please try again.',
          [{ text: 'OK' }],
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // Analyze action
  // -------------------------------------------------------------------------

  async function handleAnalyze(): Promise<void> {
    if (!transcript) return;

    setIsAnalyzing(true);
    try {
      const result = analyzeScamRisk(transcript);
      await saveResult(result);
      router.push('/results');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // -------------------------------------------------------------------------
  // Cancel action
  // -------------------------------------------------------------------------

  function handleCancel(): void {
    if (isRecording) {
      audioRecorder.stop().catch(() => {
        // ignore stop errors on cancel
      });
      setIsRecording(false);
    }
    router.back();
  }

  const analyzeDisabled = !transcript || isTranscribing || isAnalyzing;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{Strings.screenTitles.voiceInput}</Text>

        <View style={styles.micContainer}>
          <LargeMicButton
            isRecording={isRecording}
            onPress={handleMicPress}
            accessibilityLabel={
              isRecording ? 'Stop recording' : 'Start recording'
            }
          />

          {isRecording && (
            <Text style={styles.recordingLabel}>Listening…</Text>
          )}
          {isTranscribing && (
            <Text style={styles.statusLabel}>Transcribing…</Text>
          )}
        </View>

        {noSpeechDetected && !isTranscribing ? (
          <View style={styles.noSpeechContainer}>
            <Text style={styles.noSpeechText}>
              {Strings.messages.noSpeechDetected}
            </Text>
          </View>
        ) : (
          <TextInput
            style={styles.transcriptInput}
            multiline
            editable
            value={transcript}
            onChangeText={setTranscript}
            placeholder="Your transcript will appear here after recording…"
            placeholderTextColor={Colors.grayText}
            accessibilityLabel="Transcript preview"
            accessibilityHint="Edit the transcript before analyzing"
            textAlignVertical="top"
          />
        )}

        <View style={styles.actionsContainer}>
          <PrimaryActionButton
            label={Strings.buttons.analyze}
            onPress={handleAnalyze}
            disabled={analyzeDisabled}
            accessibilityLabel="Analyze transcript for scam risk"
          />

          <SecondaryActionButton
            label={Strings.buttons.cancel}
            onPress={handleCancel}
            accessibilityLabel="Cancel and go back"
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
    marginBottom: 32,
    textAlign: 'center',
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 32,
    minHeight: 160,
    justifyContent: 'center',
  },
  recordingLabel: {
    marginTop: 16,
    fontSize: Typography.bodySize,
    color: Colors.red,
    fontWeight: '600',
  },
  statusLabel: {
    marginTop: 16,
    fontSize: Typography.bodySize,
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
    minHeight: 120,
    lineHeight: Typography.bodySize * 1.5,
    marginBottom: 32,
  },
  noSpeechContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 16,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  noSpeechText: {
    fontSize: Typography.bodySize,
    color: Colors.amber,
    textAlign: 'center',
    lineHeight: Typography.bodySize * 1.5,
  },
  actionsContainer: {
    gap: 16,
  },
});
