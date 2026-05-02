/**
 * OCR service using OCR.space free API.
 * NOTE: Requires internet access. Will not work on restricted networks
 * (e.g. hackathon WiFi that blocks outbound API calls).
 * Switch to cellular data if OCR times out.
 *
 * Requirements: 3.4, 3.8
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

const OCR_API_KEY = 'K81940498488957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';
const TIMEOUT_MS = 30000; // 30s — generous for slow connections

export async function extractTextFromImage(imageUri: string): Promise<string> {
  if (!imageUri) return '';

  try {
    console.log('[OCR] Compressing image...');

    // Compress aggressively — target ~60KB base64
    const compressed = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 800 } }],
      { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
    );

    const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
      encoding: 'base64',
    });
    console.log('[OCR] Compressed size:', base64.length, 'chars');

    // If still large, compress harder
    let finalBase64 = base64;
    if (base64.length > 150000) {
      const compressed2 = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 500 } }],
        { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG }
      );
      finalBase64 = await FileSystem.readAsStringAsync(compressed2.uri, {
        encoding: 'base64',
      });
      console.log('[OCR] Re-compressed size:', finalBase64.length, 'chars');
    }

    const base64Image = `data:image/jpeg;base64,${finalBase64}`;

    const formData = new FormData();
    formData.append('base64Image', base64Image);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    console.log('[OCR] Sending to API...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('[OCR] Timed out — try switching to cellular data');
    }, TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(OCR_API_URL, {
        method: 'POST',
        headers: { apikey: OCR_API_KEY },
        body: formData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log('[OCR] Response status:', response.status);

    if (!response.ok) {
      console.warn('[OCR] API error:', response.status);
      return '';
    }

    const data = await response.json() as {
      ParsedResults?: Array<{ ParsedText: string }>;
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string | string[];
    };

    if (data.IsErroredOnProcessing) {
      console.warn('[OCR] Processing error:', data.ErrorMessage);
      return '';
    }

    const text = data.ParsedResults?.[0]?.ParsedText ?? '';
    console.log('[OCR] Extracted:', text.slice(0, 150));
    return text.trim();

  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[OCR] Timed out — network may be blocking API calls');
    } else {
      console.warn('[OCR] Failed:', err);
    }
    return '';
  }
}
