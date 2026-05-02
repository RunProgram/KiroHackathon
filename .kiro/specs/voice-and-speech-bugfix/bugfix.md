# Bugfix Requirements Document

## Introduction

The TrustPause app has two speech-related bugs that degrade the user experience. First, the "Read aloud" button on the results screen (`app/results.tsx`) does not produce audio output when pressed — the `expo-speech` `Speech.speak()` call fails silently, leaving the user without an audio summary of the scam analysis. Second, the "Tap to speak" microphone button on the voice input screen (`app/voice-input.tsx`) is undermined by a mock transcription service (`lib/transcribeAudio.ts`) that contains a hardcoded `MOCK_TRANSCRIPT` string. Although the voice input screen currently uses `expo-speech-recognition` directly and does not import the mock, the mock file's existence poses a maintenance risk and the user wants it removed to ensure no hardcoded responses can interfere with real speech recognition.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user presses the "Read aloud" button on the results screen THEN the system does not produce any audible speech output despite calling `Speech.speak()` with constructed text

1.2 WHEN the user presses the "Read aloud" button and `Speech.speak()` fails silently THEN the system provides no error feedback to the user, and the button state toggles to "speaking" without any audio being produced

1.3 WHEN the `lib/transcribeAudio.ts` module exists in the codebase THEN the system contains a hardcoded `MOCK_TRANSCRIPT` string that returns a pre-written bank scam transcript for any non-empty audio URI input

1.4 WHEN any future code path calls `transcribeAudio()` with a valid audio URI THEN the system returns the hardcoded mock transcript instead of real transcribed speech

### Expected Behavior (Correct)

2.1 WHEN the user presses the "Read aloud" button on the results screen THEN the system SHALL audibly speak the analysis results text (headline, warning signs, action items, and safe response script) using `expo-speech`

2.2 WHEN `Speech.speak()` encounters an error THEN the system SHALL inform the user that text-to-speech failed and reset the button state appropriately

2.3 WHEN the hardcoded mock transcription service is removed from the codebase THEN the system SHALL NOT contain any hardcoded transcript responses in `lib/transcribeAudio.ts` or any replacement thereof

2.4 WHEN the user presses the "Tap to speak" microphone button on the voice input screen THEN the system SHALL use `expo-speech-recognition` for real-time speech-to-text without any hardcoded fallback responses interfering with the flow

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user presses "Read aloud" and speech is already playing THEN the system SHALL CONTINUE TO stop the current speech and reset the button to its default state

3.2 WHEN the user navigates away from the results screen while speech is playing THEN the system SHALL CONTINUE TO stop speech playback via the cleanup effect

3.3 WHEN the user presses the "Tap to speak" button on the voice input screen THEN the system SHALL CONTINUE TO request microphone permissions, start `ExpoSpeechRecognitionModule`, and display real-time transcription results in the text input

3.4 WHEN the user types text manually in the voice input screen text box THEN the system SHALL CONTINUE TO accept typed input and allow scam analysis without requiring speech input

3.5 WHEN the user taps an example prompt on the voice input screen THEN the system SHALL CONTINUE TO populate the text input with the example text

3.6 WHEN the user presses "Check for scam" on the voice input screen THEN the system SHALL CONTINUE TO analyze the text using `analyzeScamRisk()`, save the result, and navigate to the results screen
