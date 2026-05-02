# Tasks

## 1. Exploratory Bug Condition Checking
- [x] 1.1 Write exploratory test verifying Speech.speak() is called without `language` option on unfixed code
- [x] 1.2 Write exploratory test verifying onError callback does not show Alert on unfixed code
- [x] 1.3 Write exploratory test verifying transcribeAudio returns hardcoded mock transcript on unfixed code
- [x] 1.4 Run exploratory tests to confirm bug conditions and root cause analysis

## 2. Fix Bug 1 - Read Aloud Not Producing Audio
- [x] 2.1 Add `language: 'en-US'` option to `Speech.speak()` call in `handleSpeakToggle` in `app/results.tsx`
- [x] 2.2 Add user-facing error handling: show `Alert.alert` in the `onError` callback with a message explaining TTS failed
- [x] 2.3 Add guard against empty text: check constructed text is non-empty before calling `Speech.speak()`, show alert if empty

## 3. Fix Bug 2 - Remove Hardcoded Mock Transcript
- [x] 3.1 Delete `lib/transcribeAudio.ts` entirely
- [x] 3.2 Verify no imports or references to `lib/transcribeAudio` exist in the codebase

## 4. Fix Checking Tests
- [x] 4.1 Write test verifying `Speech.speak()` is called with `language: 'en-US'` after fix
- [x] 4.2 Write test verifying `Alert.alert` is called when `onError` fires after fix
- [x] 4.3 Write test verifying empty text guard prevents `Speech.speak()` call and shows alert
- [x] 4.4 Write test verifying `lib/transcribeAudio.ts` does not exist after fix

## 5. Preservation Checking Tests
- [x] 5.1 Write test verifying speech stop behavior is preserved (pressing "Read aloud" while speaking calls `Speech.stop()`)
- [x] 5.2 Write test verifying cleanup effect calls `Speech.stop()` on unmount
- [x] 5.3 Write test verifying text construction from AnalysisResult is unchanged (headline + red flags + doNow + safeResponseScript)
- [x] 5.4 Write property-based test generating random AnalysisResult objects and verifying constructed text is always non-empty

## 6. Run All Tests and Verify
- [x] 6.1 Run fix checking tests and confirm all pass
- [x] 6.2 Run preservation checking tests and confirm all pass
- [x] 6.3 Run existing test suite to confirm no regressions
