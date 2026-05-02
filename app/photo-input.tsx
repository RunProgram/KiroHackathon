/**
 * Photo Input screen — select or capture an image, run OCR, and analyze for scam risk.
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [noTextFound, setNoTextFound] = useState(false);

  // -------------------------------------------------------------------------
  // Permission helpers
  // -------------------------------------------------------------------------

  async function requestCameraPermission(): Promise<boolean> {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Camera access needed',
        'TrustPause needs camera access to take a photo. ' +
          'Please enable it in your device Settings under Privacy → Camera.',
        [{ text: 'OK' }],
      );
      return false;
    }
    return true;
  }

  async function requestMediaLibraryPermission(): Promise<boolean> {
    const { granted } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Photo library access needed',
        'TrustPause needs access to your photo library to choose an image. ' +
          'Please enable it in your device Settings under Privacy → Photos.',
        [{ text: 'OK' }],
      );
      return false;
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // OCR helper — called after any image is selected
  // -------------------------------------------------------------------------

  async function runOcr(uri: string): Promise<void> {
    setIsExtracting(true);
    setNoTextFound(false);
    setExtractedText('');
    try {
      const text = await extractTextFromImage(uri);
      setExtractedText(text);
      if (!text) {
        setNoTextFound(true);
      }
    } catch {
      setExtractedText('');
      setNoTextFound(true);
    } finally {
      setIsExtracting(false);
    }
  }

  // -------------------------------------------------------------------------
  // Take a photo
  // -------------------------------------------------------------------------

  async function handleTakePhoto(): Promise<void> {
    const permitted = await requestCameraPermission();
    if (!permitted) return;

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
      Alert.alert(
        'Camera error',
        'Could not open the camera. Please try again.',
        [{ text: 'OK' }],
      );
    }
  }

  // -------------------------------------------------------------------------
  // Choose from library
  // -------------------------------------------------------------------------

  async function handleChooseFromLibrary(): Promise<void> {
    const permitted = await requestMediaLibraryPermission();
    if (!permitted) return;

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
      Alert.alert(
        'Library error',
        'Could not open the photo library. Please try again.',
        [{ text: 'OK' }],
      );
    }
  }

  // -------------------------------------------------------------------------
  // Analyze action
  // -------------------------------------------------------------------------

  async function handleAnalyze(): Promise<void> {
    if (!extractedText) return;

    setIsAnalyzing(true);
    try {
      const result = analyzeScamRisk(extractedText);
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
    router.back();
  }

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const analyzeDisabled = !extractedText || isExtracting || isAnalyzing;

  // When an image is selected, show the image-specific action buttons;
  // otherwise show the camera/library selection buttons.
  const hasImage = imageUri.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{Strings.screenTitles.photoInput}</Text>

        {/* Image preview area */}
        <View style={styles.previewContainer}>
          {hasImage ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              accessibilityLabel="Selected image preview"
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        {/* Image selection buttons — always visible so user can re-select */}
        <View style={styles.selectionButtons}>
          <PrimaryActionButton
            label={Strings.buttons.takePhoto}
            onPress={handleTakePhoto}
            accessibilityLabel="Take a photo with the camera"
            disabled={isExtracting || isAnalyzing}
          />
          <SecondaryActionButton
            label={Strings.buttons.chooseFromLibrary}
            onPress={handleChooseFromLibrary}
            accessibilityLabel="Choose an image from the photo library"
          />
        </View>

        {/* Extracted text preview */}
        {isExtracting && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>Extracting text from image…</Text>
          </View>
        )}

        {noTextFound && !isExtracting && (
          <View style={styles.noTextContainer}>
            <Text style={styles.noTextMessage}>
              {Strings.messages.noTextInImage}
            </Text>
          </View>
        )}

        {extractedText.length > 0 && !isExtracting && (
          <View style={styles.extractedTextContainer}>
            <Text style={styles.extractedTextLabel}>Extracted text:</Text>
            <Text
              style={styles.extractedTextContent}
              accessibilityLabel="Extracted text from image"
            >
              {extractedText}
            </Text>
          </View>
        )}

        {/* Analyze and Cancel buttons */}
        <View style={styles.actionsContainer}>
          <PrimaryActionButton
            label={Strings.buttons.analyze}
            onPress={handleAnalyze}
            disabled={analyzeDisabled}
            accessibilityLabel="Analyze extracted text for scam risk"
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
    marginBottom: 24,
    textAlign: 'center',
  },
  previewContainer: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.softBlue,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  placeholderContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: Typography.bodySize,
    color: Colors.grayText,
  },
  selectionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.softBlue,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusText: {
    fontSize: Typography.bodySize,
    color: Colors.grayText,
  },
  noTextContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 16,
    marginBottom: 24,
  },
  noTextMessage: {
    fontSize: Typography.bodySize,
    color: Colors.amber,
    textAlign: 'center',
    lineHeight: Typography.bodySize * 1.5,
  },
  extractedTextContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.softBlue,
    padding: 16,
    marginBottom: 24,
  },
  extractedTextLabel: {
    fontSize: Typography.captionSize,
    fontWeight: '600',
    color: Colors.grayText,
    marginBottom: 8,
  },
  extractedTextContent: {
    fontSize: Typography.bodySize,
    color: Colors.darkText,
    lineHeight: Typography.bodySize * 1.5,
  },
  actionsContainer: {
    gap: 16,
  },
});
