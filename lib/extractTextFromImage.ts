/**
 * Mock OCR (optical character recognition) service.
 *
 * In the MVP, this returns a realistic pre-written extracted text string for
 * any non-empty image URI. It can be swapped for a real OCR implementation
 * (e.g., Google Cloud Vision, AWS Textract, or an on-device ML model) without
 * changing any call sites.
 *
 * Requirements: 3.4, 3.8
 */

const MOCK_EXTRACTED_TEXT =
  "URGENT: Your Amazon account has been compromised. " +
  "Call 1-800-555-0123 immediately to verify your account and prevent " +
  "unauthorized charges. Failure to act within 24 hours will result in " +
  "permanent account suspension.";

/**
 * Extracts text from an image identified by `imageUri`.
 *
 * @param imageUri - The local URI of the image file (photo or screenshot).
 * @returns A promise that resolves to the extracted text string, or an empty
 *          string if `imageUri` is empty (indicating no image was provided).
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  if (!imageUri) {
    return "";
  }
  return MOCK_EXTRACTED_TEXT;
}
