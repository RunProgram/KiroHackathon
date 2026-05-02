# Voice and Speech Bugfix Design

## Overview

The TrustPause app has two speech-related bugs. First, the "Read aloud" button on the results screen calls `Speech.speak()` from `expo-speech` but produces no audio — the call fails silently with no user feedback. Second, `lib/transcribeAudio.ts` contains a hardcoded `MOCK_TRANSCRIPT` that always returns a fake bank scam transcript for any non-empty audio URI. Although the voice input screen currently bypasses this file (using `expo-speech-recognition` directly), the mock's existence is a maintenance hazard and the user wants it removed entirely.

The fix strategy is: (1) ensure `Speech.speak()` is called correctly with a valid, non-empty text string and proper `language` option so the TTS engine can produce audio, and add error handling that resets button state and alerts the user on failure; (2) delete the hardcoded mock transcript file entirely.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — either pressing "Read aloud" on the results screen (Bug 1) or the existence of the hardcoded mock transcript file (Bug 2)
- **Property (P)**: The desired behavior — audible speech output with proper error handling (Bug 1), and no hardcoded transcript responses in the codebase (Bug 2)
- **Preservation**: Existing behaviors that must remain unchanged — speech stop/toggle, screen cleanup, voice input recording, manual text entry, example prompts, and scam analysis flow
- **handleSpeakToggle**: The async function in `app/results.tsx` that constructs text from the analysis result and calls `Speech.speak()`
- **transcribeAudio**: The function in `lib/transcribeAudio.ts` that currently returns a hardcoded mock transcript
- **ExpoSpeechRecognitionModule**: The real-time speech-to-text module from `expo-speech-recognition` used in `app/voice-input.tsx`

## Bug Details

### Bug Condition

The bug manifests in two scenarios:

**Bug 1**: When the user presses "Read aloud" on the results screen, `Speech.speak()` is called but produces no audio. The button toggles to "speaking" state but nothing is heard. The `onError` callback silently resets state without informing the user.

**Bug 2**: When `lib/transcribeAudio.ts` exists in the codebase, it contains a hardcoded `MOCK_TRANSCRIPT` string that returns a pre-written bank scam transcript for any non-empty audio URI, regardless of actual audio content.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: 'read_aloud' | 'transcribe', context: AppState }
  OUTPUT: boolean
  
  IF input.action == 'read_aloud' THEN
    RETURN input.context.resultsScreen.isVisible
           AND input.context.resultsScreen.recentResult != null
           AND NOT audioIsProduced(Speech.speak(constructedText))
  END IF
  
  IF input.action == 'transcribe' THEN
    RETURN fileExists('lib/transcribeAudio.ts')
           AND fileContains('lib/transcribeAudio.ts', 'MOCK_TRANSCRIPT')
  END IF
  
  RETURN false
END FUNCTION
```

### Examples

- **Bug 1, Example 1**: User analyzes "Someone called from my bank" → results screen shows "Be Careful" → user presses "Read aloud" → button changes to "⏹ Stop" but no audio plays → expected: audible speech of the headline, warning signs, and safe response script
- **Bug 1, Example 2**: User analyzes a high-risk scam text → presses "Read aloud" → `Speech.speak()` is called with a long text string → no audio output → `onDone` never fires, button stays in "speaking" state indefinitely if `onError` also doesn't fire
- **Bug 1, Example 3**: User presses "Read aloud" and `Speech.speak()` encounters a platform error → `onError` fires → button resets but user receives no explanation of why speech failed
- **Bug 2, Example 1**: Any code calling `transcribeAudio("file:///audio/recording.m4a")` receives the hardcoded bank scam transcript instead of actual transcription → expected: the function should not exist or should perform real transcription

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Pressing "Read aloud" while speech is already playing must continue to stop playback and reset button state
- Navigating away from the results screen while speech is playing must continue to stop speech via the cleanup effect
- The "Tap to speak" microphone button on voice input must continue to request permissions, start `ExpoSpeechRecognitionModule`, and display real-time transcription
- Manual text entry in the voice input text box must continue to work without requiring speech input
- Tapping example prompts on the voice input screen must continue to populate the text input
- The "Check for scam" button must continue to analyze text, save results, and navigate to results

**Scope:**
All inputs that do NOT involve the "Read aloud" button press or the `transcribeAudio` module should be completely unaffected by this fix. This includes:
- Mouse/touch interactions with all other buttons on the results screen
- The entire voice input recording flow (uses `expo-speech-recognition`, not `expo-speech`)
- Navigation between screens
- Scam analysis logic in `lib/analyzeScamRisk.ts`
- Trusted contact calling functionality

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Missing `language` option in Speech.speak()**: The `expo-speech` API on some platforms requires an explicit `language` parameter (e.g., `'en-US'`) to select a TTS voice. Without it, the engine may fail to find a suitable voice and produce no output. The current code only passes `rate`, `onDone`, `onStopped`, and `onError` — no `language` is specified.

2. **Silent error swallowing**: The `onError` callback in `handleSpeakToggle` only calls `setIsSpeaking(false)` without alerting the user or logging the error. If `Speech.speak()` fails (e.g., no voice available, text empty on edge case), the user gets no feedback.

3. **Potential empty text edge case**: If `recentResult` has empty arrays for `doNow` or an empty `safeResponseScript`, the constructed text could be malformed or very short, potentially causing TTS issues on some platforms.

4. **Mock transcript file existence**: `lib/transcribeAudio.ts` was created as an MVP placeholder and was never removed. It contains a hardcoded string that bypasses any real transcription logic.

## Correctness Properties

Property 1: Bug Condition - Read Aloud Produces Audio

_For any_ results screen state where `recentResult` is non-null and the user presses "Read aloud", the fixed `handleSpeakToggle` function SHALL call `Speech.speak()` with a non-empty text string and a `language` option, and SHALL alert the user if the speech engine reports an error.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition - No Hardcoded Mock Transcript

_For any_ state of the codebase after the fix is applied, the file `lib/transcribeAudio.ts` SHALL NOT exist, and no file in the `lib/` directory SHALL contain a hardcoded `MOCK_TRANSCRIPT` constant or return a pre-written transcript string.

**Validates: Requirements 2.3, 2.4**

Property 3: Preservation - Speech Toggle and Cleanup Behavior

_For any_ interaction where the user presses "Read aloud" while speech is already playing, or navigates away from the results screen during playback, the fixed code SHALL produce the same stop/cleanup behavior as the original code, preserving the toggle-off and unmount cleanup semantics.

**Validates: Requirements 3.1, 3.2**

Property 4: Preservation - Voice Input Screen Behavior

_For any_ interaction on the voice input screen (microphone press, manual typing, example prompt tap, "Check for scam" press), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing voice input and analysis functionality.

**Validates: Requirements 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `app/results.tsx`

**Function**: `handleSpeakToggle`

**Specific Changes**:
1. **Add `language` option**: Pass `language: 'en-US'` to `Speech.speak()` options to ensure the TTS engine selects an appropriate voice on all platforms.

2. **Add user-facing error handling**: In the `onError` callback, show an `Alert` informing the user that text-to-speech failed, in addition to resetting `isSpeaking` state.

3. **Guard against empty text**: Add a check that the constructed `text` string is non-empty before calling `Speech.speak()`. If empty, show an alert and don't toggle state.

4. **Add `onStart` callback** (optional): Set `isSpeaking` to true only after `onStart` fires rather than optimistically, to avoid showing "Stop" when speech hasn't actually started. However, this may introduce a perceived delay — keep the optimistic approach but ensure error handling covers the failure case.

---

**File**: `lib/transcribeAudio.ts`

**Action**: Delete the entire file.

**Rationale**: The voice input screen (`app/voice-input.tsx`) uses `expo-speech-recognition` directly and does not import `transcribeAudio`. No other file in the codebase imports it. The file is dead code containing a hardcoded mock that could mislead future developers.

---

**Verification**: After deletion, confirm no import references to `lib/transcribeAudio` exist anywhere in the codebase.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that mock `expo-speech` and verify `handleSpeakToggle` calls `Speech.speak()` with correct parameters. Run these tests on the UNFIXED code to observe what parameters are actually passed.

**Test Cases**:
1. **Missing language option test**: Verify that `Speech.speak()` is called without a `language` option (will demonstrate the bug condition on unfixed code)
2. **Silent error test**: Trigger the `onError` callback and verify no user-facing alert is shown (will demonstrate silent failure on unfixed code)
3. **Mock transcript test**: Import `transcribeAudio` and call it with a valid URI — verify it returns the hardcoded string (will demonstrate Bug 2 on unfixed code)
4. **Empty text edge case**: Construct a result with empty arrays and verify what text string is passed to `Speech.speak()`

**Expected Counterexamples**:
- `Speech.speak()` is called without `language` parameter
- `onError` callback only resets state without user notification
- `transcribeAudio("any-uri")` returns hardcoded bank scam text

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  IF input.action == 'read_aloud' THEN
    result := handleSpeakToggle_fixed(input)
    ASSERT Speech.speak was called with non-empty text
    ASSERT Speech.speak options include language: 'en-US'
    ASSERT on error, Alert.alert is called with failure message
  END IF
  
  IF input.action == 'transcribe' THEN
    ASSERT NOT fileExists('lib/transcribeAudio.ts')
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleSpeakToggle_original(input) behavior = handleSpeakToggle_fixed(input) behavior
  // Specifically:
  // - Stop behavior when isSpeaking is true remains identical
  // - Cleanup effect on unmount remains identical
  // - Voice input screen behavior is completely unchanged
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (various AnalysisResult configurations)
- It catches edge cases that manual unit tests might miss (empty red flags, long text, special characters)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for speech stop/toggle and voice input interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Speech stop preservation**: Verify that pressing "Read aloud" while `isSpeaking` is true calls `Speech.stop()` and resets state — same as before
2. **Cleanup effect preservation**: Verify that the useEffect cleanup calls `Speech.stop()` on unmount — same as before
3. **Voice input flow preservation**: Verify that the entire voice input screen flow (mic press, text entry, example taps, analyze) works identically
4. **Text construction preservation**: Verify that the text string passed to `Speech.speak()` is constructed identically from the AnalysisResult fields (headline + red flags + doNow + safeResponseScript)

### Unit Tests

- Test that `handleSpeakToggle` calls `Speech.speak()` with `language: 'en-US'` option
- Test that `handleSpeakToggle` shows an Alert when `onError` fires
- Test that `handleSpeakToggle` guards against empty constructed text
- Test that pressing "Read aloud" while speaking calls `Speech.stop()` and resets state
- Test that `lib/transcribeAudio.ts` no longer exists after the fix

### Property-Based Tests

- Generate random `AnalysisResult` objects (varying riskLevel, redFlags, doNow, safeResponseScript) and verify the constructed text is always non-empty and well-formed
- Generate random `AnalysisResult` objects and verify `Speech.speak()` is always called with `language` option
- Generate random sequences of speak/stop toggles and verify state consistency

### Integration Tests

- Test full flow: analyze text → navigate to results → press "Read aloud" → verify Speech.speak called with correct text and options
- Test error flow: analyze text → press "Read aloud" → Speech.speak triggers onError → verify Alert shown and state reset
- Test navigation cleanup: press "Read aloud" → navigate back → verify Speech.stop() called
