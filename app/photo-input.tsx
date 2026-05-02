/**
 * Photo Input screen — select or capture an image, auto-extract text via OCR, analyze.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryActionButton } from '../components/PrimaryActionButton';
import { SecondaryActionButton } from '../components/SecondaryActionButton';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { Typography } from '../constants/typography';
import { useRecentResult } from '../hooks/useRecentResult';
import { analyzeScamRisk } from '../lib/analyzeScamRisk';
import { extractTextFromImage } from '../lib/extractTextFromImage';

export default function PhotoInputScreen(): React.JSX.Element {
  const router = useRouter();
  const { saveResult } = useRecentResult();

  const [imageUri, setImageUri] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrFailed, setOcrFailed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // -------------------------------------------------------------------------
  // Run OCR after image selected
  // -------------------------------------------------------------------------

  async function runOcr(uri: string): Promise<void> {
    setIsExtracting(true);
    setExtractedText('');
    setOcrFailed(false);
    try {
      const text = await extractTextFromImage(uri);
      if (text) {
        setExtractedText(text);
        setOcrFailed(false);
      } else {
        setOcrFailed(true);
      }
    } catch {
      setOcrFailed(true);
    } finally {
      setIsExtracting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Camera
  // -------------------------------------------------------------------------

  async function handleTakePhoto(): Promise<void> {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Camera access needed', 'Please enable it in Settings → Privacy → Camera.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        await runOcr(uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera. Please try again.');
    }
  }

  // -------------------------------------------------------------------------
  // Photo library
  // -------------------------------------------------------------------------

  async function handleChooseFromLibrary(): Promise<void> {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Photos access needed', 'Please enable it in Settings → Privacy → Photos.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });
      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        await runOcr(uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library. Please try again.');
    }
  }

  // -------------------------------------------------------------------------
  // Analyze
  // -------------------------------------------------------------------------

  async function handleAnalyze(): Promise<void> {
    const text = extractedText.trim();
    if (!text) return;
    setIsAnalyzing(true);
    try {
      const result = analyzeScamRisk(text);
      console.log('[TrustPause] Photo analyzing:', text.slice(0, 80));
      console.log('[TrustPause] Result:', result.riskLevel, result.redFlags);
      await saveResult(result);
      router.push('/results');
    } finally {
      setIsAnalyzing(false);
    }
  }

  const analyzeDisabled = !extractedText.trim() || isAnalyzing || isExtracting;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{Strings.screenTitles.photoInput}</Text>

        {/* Image selection */}
        <View style={styles.selectionButtons}>
          <PrimaryActionButton
            label={Strings.buttons.takePhoto}
            onPress={handleTakePhoto}
            disabled={isExtracting || isAnalyzing}
          />
          <SecondaryActionButton
            label={Strings.buttons.chooseFromLibrary}
            onPress={handleChooseFromLibrary}
          />
        </View>

        {/* Image preview */}
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              resizeMode="contain"
              accessibilityLabel="Selected image"
            />
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              📷 Take a photo or choose from your library
            </Text>
          </View>
        )}

        {/* OCR status */}
        {isExtracting && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>🔍 Reading text from image…</Text>
          </View>
        )}

        {/* Network error message */}
        {ocrFailed && !isExtracting && (
          <View style={styles.networkWarning}>
            <Text style={styles.networkWarningText}>
              ⚠️ Could not read text automatically — network may be blocking the request.
              {'\n'}Switch to cellular data, or type the message below.
            </Text>
          </View>
        )}

        {/* Extracted text — editable so user can correct OCR errors */}
        {imageUri && !isExtracting && (
          <View style={styles.textSection}>
            <Text style={styles.textLabel}>
              {extractedText
                ? '✅ Text detected — edit if needed:'
                : 'Type the message text here:'}
            </Text>
            <TextInput
              style={styles.textInput}
              multiline
              value={extractedText}
              onChangeText={setExtractedText}
              placeholder={'Type what the message says…'}
              placeholderTextColor={Colors.grayText}
              accessibilityLabel="Message text"
              textAlignVertical="top"
              autoCorrect={false}
            />
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {imageUri && !isExtracting && (
            <PrimaryActionButton
              label={isAnalyzing ? 'Analyzing…' : Strings.buttons.analyze}
              onPress={handleAnalyze}
              disabled={analyzeDisabled}
            />
          )}
          <SecondaryActionButton
            label={Strings.buttons.cancel}
            onPress={() => router.back()}
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
    gap: 20,
  },
  title: {
    fontSize: Typography.headingSize,
    fontWeight: '700',
    color: Colors.darkText,
    textAlign: 'center',
  },
  selectionButtons: {
    gap: 12,
  },
  previewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.softBlue,
    backgroundColor: '#000',
  },
  imagePreview: {
    width: '100%',
    height: 220,
  },
  placeholderContainer: {
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.softBlue,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  placeholderText: {
    fontSize: Typography.bodySize,
    color: Colors.grayText,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.softBlue,
    padding: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: Typography.bodySize,
    color: Colors.grayText,
  },
  networkWarning: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 16,
  },
  networkWarningText: {
    fontSize: Typography.captionSize,
    color: Colors.darkText,
    lineHeight: Typography.captionSize * 1.6,
  },
  textSection: {
    gap: 8,
  },
  textLabel: {
    fontSize: Typography.bodySize,
    fontWeight: '600',
    color: Colors.darkText,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.softBlue,
    padding: 16,
    fontSize: Typography.bodySize,
    color: Colors.darkText,
    minHeight: 140,
    lineHeight: Typography.bodySize * 1.5,
  },
  actionsContainer: {
    gap: 12,
  },
});
