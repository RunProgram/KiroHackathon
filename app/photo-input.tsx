/**
 * Photo Input screen — take or upload a photo, auto-extract text, analyze.
 */

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../constants/colors';
import { useRecentResult } from '../hooks/useRecentResult';
import { analyzeScamRisk } from '../lib/analyzeScamRisk';
import { analyzeUrl, type UrlAnalysisResult } from '../lib/analyzeUrl';
import { extractTextFromImage } from '../lib/extractTextFromImage';

/** Pull all URLs out of a block of text. */
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const domainRegex = /(?:^|\s)((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|org|net|gov|edu|io|co|us|uk|info|biz|xyz|top|club|online|site|store|app|dev|me|tv|cc|ru|cn|tk|ml|ga|cf|gq|icu|buzz|work|click|link|space|pw|ws|fun|monster|rest|cam)[^\s<>"{}|\\^`\[\]]*)/gi;
  const matches = new Set<string>();
  for (const m of text.match(urlRegex) ?? []) matches.add(m);
  for (const m of text.match(domainRegex) ?? []) matches.add(m.trim());
  return [...matches];
}

export default function PhotoInputScreen(): React.JSX.Element {
  const router = useRouter();
  const { saveResult } = useRecentResult();

  const [imageUri, setImageUri] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrFailed, setOcrFailed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [urlResults, setUrlResults] = useState<UrlAnalysisResult[]>([]);

  async function runOcr(uri: string): Promise<void> {
    setIsExtracting(true);
    setExtractedText('');
    setOcrFailed(false);
    setUrlResults([]);
    try {
      const text = await extractTextFromImage(uri);
      if (text) {
        setExtractedText(text);
        // Auto-scan any URLs found in the extracted text
        const urls = extractUrls(text);
        if (urls.length > 0) {
          setUrlResults(urls.map((u) => analyzeUrl(u)));
        }
      } else {
        setOcrFailed(true);
      }
    } catch {
      setOcrFailed(true);
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleTakePhoto(): Promise<void> {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Camera access needed', 'Please enable it in Settings → Privacy → Camera.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.8 });
      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        await runOcr(uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open camera. Please try again.');
    }
  }

  async function handleChooseFromLibrary(): Promise<void> {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Photos access needed', 'Please enable it in Settings → Privacy → Photos.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        await runOcr(uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo library. Please try again.');
    }
  }

  async function handleAnalyze(): Promise<void> {
    const text = extractedText.trim();
    if (!text) return;
    setIsAnalyzing(true);
    try {
      const result = analyzeScamRisk(text);
      await saveResult(result);
      router.push('/results');
    } finally {
      setIsAnalyzing(false);
    }
  }

  const canAnalyze = extractedText.trim().length > 0 && !isAnalyzing && !isExtracting;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>📷 Show a message</Text>
        <Text style={styles.subtitle}>
          Take a photo of a suspicious text, email, or letter. We'll read it and check for scams.
        </Text>

        {/* Image selection */}
        <View style={styles.photoButtons}>
          <TouchableOpacity
            style={styles.photoBtn}
            onPress={handleTakePhoto}
            disabled={isExtracting || isAnalyzing}
            accessibilityRole="button"
          >
            <Text style={styles.photoBtnIcon}>📸</Text>
            <Text style={styles.photoBtnText}>Take a photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.photoBtn, styles.photoBtnOutline]}
            onPress={handleChooseFromLibrary}
            disabled={isExtracting || isAnalyzing}
            accessibilityRole="button"
          >
            <Text style={styles.photoBtnIcon}>🖼️</Text>
            <Text style={[styles.photoBtnText, styles.photoBtnTextOutline]}>
              Choose from library
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image preview */}
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.preview}
              resizeMode="contain"
              accessibilityLabel="Selected image"
            />
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Your photo will appear here
            </Text>
          </View>
        )}

        {/* OCR status */}
        {isExtracting && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>🔍 Reading text from image…</Text>
            <Text style={styles.statusSub}>This may take up to 30 seconds</Text>
          </View>
        )}

        {/* Network warning */}
        {ocrFailed && !isExtracting && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ Could not read text automatically</Text>
            <Text style={styles.warningText}>
              This usually happens on restricted WiFi networks.{'\n'}
              Try switching to cellular data and uploading the photo again.
            </Text>
          </View>
        )}

        {/* Text found confirmation */}
        {imageUri && !isExtracting && extractedText ? (
          <View style={styles.textFoundBox}>
            <Text style={styles.textFoundLabel}>✅ Text found — ready to check</Text>
          </View>
        ) : null}

        {/* URL scan results */}
        {urlResults.length > 0 && (
          <View style={styles.urlSection}>
            <Text style={styles.urlSectionTitle}>🔗 Links Found in Image</Text>
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
                <View style={styles.urlCardHeader}>
                  <Text style={styles.urlCardIcon}>
                    {ur.riskLevel === 'Dangerous' ? '🚨' : ur.riskLevel === 'Suspicious' ? '⚠️' : '✅'}
                  </Text>
                  <Text style={[
                    styles.urlCardRisk,
                    ur.riskLevel === 'Dangerous' && { color: Colors.red },
                    ur.riskLevel === 'Suspicious' && { color: Colors.amber },
                    ur.riskLevel === 'Probably Safe' && { color: Colors.green },
                  ]}>
                    {ur.riskLevel}
                  </Text>
                </View>
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
        )}

        {/* Analyze */}
        {imageUri && !isExtracting && (
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
        )}

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
  title: { fontSize: 28, fontWeight: '800', color: Colors.darkText },
  subtitle: { fontSize: 18, color: Colors.grayText, lineHeight: 26 },
  photoButtons: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1,
    backgroundColor: Colors.deepNavy,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
    minHeight: 88,
    justifyContent: 'center',
  },
  photoBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.softBlue,
  },
  photoBtnIcon: { fontSize: 28 },
  photoBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  photoBtnTextOutline: { color: Colors.softBlue },
  previewContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.softBlue,
    backgroundColor: '#000',
  },
  preview: { width: '100%', height: 240 },
  placeholder: {
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.softBlue,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  placeholderText: { fontSize: 18, color: Colors.grayText },
  statusBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.softBlue,
  },
  statusText: { fontSize: 20, color: Colors.darkText, fontWeight: '600' },
  statusSub: { fontSize: 15, color: Colors.grayText },
  warningBox: {
    backgroundColor: '#FFF8E7',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.amber,
  },
  warningTitle: { fontSize: 18, fontWeight: '700', color: Colors.darkText },
  warningText: { fontSize: 16, color: Colors.grayText, lineHeight: 24 },
  textFoundBox: {
    backgroundColor: '#EDF7EE',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.green,
    alignItems: 'center',
  },
  textFoundLabel: { fontSize: 18, fontWeight: '600', color: Colors.darkText },
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

  // URL scan results
  urlSection: { gap: 10 },
  urlSectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.darkText },
  urlCard: {
    borderRadius: 14,
    padding: 16,
    gap: 8,
    borderWidth: 2,
  },
  urlCardDangerous: { backgroundColor: '#FDECEA', borderColor: Colors.red },
  urlCardSuspicious: { backgroundColor: '#FFF8E7', borderColor: Colors.amber },
  urlCardSafe: { backgroundColor: '#EDF7EE', borderColor: Colors.green },
  urlCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  urlCardIcon: { fontSize: 22 },
  urlCardRisk: { fontSize: 18, fontWeight: '800' },
  urlCardUrl: { fontSize: 14, color: Colors.grayText, fontFamily: 'monospace' },
  urlCardFlags: { gap: 4 },
  urlCardFlag: { fontSize: 15, color: Colors.darkText, lineHeight: 22 },
});
