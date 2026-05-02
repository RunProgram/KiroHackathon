/**
 * OCR service using OCR.space free API.
 * Works in Expo Go without a native build.
 *
 * Requirements: 3.4, 3.8
 */

import * as FileSystem from 'expo-file-system/legacy';

// Free OCR.space API key (public demo key — rate limited but works for demos)
const OCR_API_KEY = 'K81940498488957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

/**
 * Extracts text from an image using OCR.space API.
 * Falls back to empty string on any error.
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  if (!imageUri) return '';

  try {
    // Convert local file URI to base64 for upload
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Determine mime type from URI extension
    const ext = imageUri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const base64Image = `data:${mimeType};base64,${base64}`;

    const formData = new FormData();
    formData.append('base64Image', base64Image);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is better for screenshots

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      headers: {
        apikey: OCR_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      console.warn('[OCR] API error:', response.status);
      return '';
    }

    const data = await response.json() as {
      ParsedResults?: Array<{ ParsedText: string }>;
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string;
    };

    if (data.IsErroredOnProcessing) {
      console.warn('[OCR] Processing error:', data.ErrorMessage);
      return '';
    }

    const text = data.ParsedResults?.[0]?.ParsedText ?? '';
    console.log('[OCR] Extracted:', text.slice(0, 100));
    return text.trim();
  } catch (err) {
    console.warn('[OCR] Failed:', err);
    return '';
  }
}
