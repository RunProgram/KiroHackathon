/**
 * Mock audio transcription service.
 *
 * In the MVP, this returns a realistic pre-written transcript for any
 * non-empty audio URI. It can be swapped for a real speech-to-text
 * implementation (e.g., expo-speech-recognition or a cloud API) without
 * changing any call sites.
 *
 * Requirements: 2.4, 2.8
 */

const MOCK_TRANSCRIPT =
  "I just got a call from someone saying they were from my bank. " +
  "They said there was suspicious activity on my account and I needed to " +
  "verify my information immediately. They asked me for my account number " +
  "and a verification code that was sent to my phone.";

/**
 * Transcribes an audio recording identified by `audioUri`.
 *
 * @param audioUri - The local URI of the recorded audio file.
 * @returns A promise that resolves to the transcript string, or an empty
 *          string if `audioUri` is empty (indicating no recording was made).
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!audioUri) {
    return "";
  }
  return MOCK_TRANSCRIPT;
}
