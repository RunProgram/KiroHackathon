# Requirements Document

## Introduction

TrustPause is a voice-first, mobile anti-scam safety app built with Expo and React Native, designed specifically for elderly users with low tech comfort. The app answers one urgent question: "Am I being tricked right now?" Users can speak what happened, photograph a suspicious message, or call a trusted contact. A rules-based analysis engine evaluates the input for known scam patterns and presents a clear risk level, warning signs, and recommended next steps — all in calm, accessible language with giant touch targets and high-contrast visuals.

## Glossary

- **App**: The TrustPause Expo/React Native mobile application
- **Analysis_Engine**: The rules-based scam detection module (`analyzeScamRisk`)
- **AnalysisResult**: The structured output of the Analysis_Engine containing riskLevel, scamType, redFlags, doNow, doNotDo, safeResponseScript, and caregiverRecommended
- **Trusted_Contact**: A family member or caregiver saved locally by the user, identified by name, phone number, and relationship
- **Risk_Level**: One of three values — High Risk, Be Careful, or Probably Safe — assigned by the Analysis_Engine
- **Red_Flag**: A specific scam indicator detected in user input (e.g., urgency, secrecy, gift card request)
- **Safe_Response_Script**: A short, plain-language script the user can read aloud to the suspected scammer
- **Voice_Input**: Audio recorded by the user describing a suspicious situation
- **Photo_Input**: An image (photo or screenshot) of a suspicious message, email, or text
- **TTS**: Text-to-speech playback powered by expo-speech
- **Demo_Scenario**: A pre-written example of a known scam type used for user education and testing
- **OCR**: Optical character recognition used to extract text from Photo_Input for analysis

---

## Requirements

### Requirement 1: Home Screen Navigation

**User Story:** As an elderly user, I want a single, uncluttered home screen with giant buttons, so that I can immediately take action without confusion.

#### Acceptance Criteria

1. THE App SHALL display a primary action button labeled "Tell me what happened" that navigates to the Voice Input screen.
2. THE App SHALL display a secondary action button labeled "Show a message or photo" that navigates to the Photo Input screen.
3. THE App SHALL display an emergency action button labeled "Call my trusted person" that initiates a phone call to the saved Trusted_Contact.
4. THE App SHALL display a reassuring subtitle on the home screen (e.g., "You're safe. Let's check together.").
5. WHEN a previous AnalysisResult exists in local storage, THE App SHALL display a summary card of the most recent result on the home screen.
6. IF no Trusted_Contact has been saved, THEN THE App SHALL display a prompt on the home screen directing the user to set up a Trusted_Contact.
7. THE App SHALL render all home screen touch targets with a minimum height of 72 logical pixels.

---

### Requirement 2: Voice Input and Transcription

**User Story:** As an elderly user, I want to speak what happened in my own words, so that I don't have to type anything.

#### Acceptance Criteria

1. THE App SHALL display a large microphone button on the Voice Input screen that starts audio recording when tapped.
2. WHEN recording is active, THE App SHALL display a visual indicator showing the listening state.
3. WHEN the user taps the microphone button a second time, THE App SHALL stop recording.
4. WHEN recording stops, THE App SHALL display a transcript preview of the spoken audio.
5. THE App SHALL provide an "Analyze" button that submits the transcript to the Analysis_Engine.
6. THE App SHALL provide a "Cancel" button that discards the recording and returns to the home screen.
7. IF the recording produces no detectable speech, THEN THE App SHALL display a message prompting the user to try again.
8. THE App SHALL use expo-audio for all audio recording operations.

---

### Requirement 3: Photo and Screenshot Input

**User Story:** As an elderly user, I want to photograph or upload a suspicious message, so that the app can check it for me.

#### Acceptance Criteria

1. THE App SHALL display a button to take a new photo using the device camera on the Photo Input screen.
2. THE App SHALL display a button to choose an existing image from the device photo library on the Photo Input screen.
3. WHEN an image is selected or captured, THE App SHALL display a preview of the image.
4. THE App SHALL extract text from the image using OCR before submitting to the Analysis_Engine.
5. THE App SHALL provide an "Analyze" button that submits the extracted text to the Analysis_Engine.
6. THE App SHALL provide a "Cancel" button that discards the image and returns to the home screen.
7. IF the image contains no extractable text, THEN THE App SHALL inform the user and prompt them to describe the situation using voice input instead.
8. THE App SHALL use expo-image-picker for all camera and library access operations.

---

### Requirement 4: Scam Analysis Engine

**User Story:** As an elderly user, I want the app to check my situation for warning signs, so that I can know if I'm being tricked.

#### Acceptance Criteria

1. THE Analysis_Engine SHALL accept a plain-text string as input and return an AnalysisResult.
2. THE Analysis_Engine SHALL assign a Risk_Level of "High Risk" when two or more Red_Flags are detected in the input.
3. THE Analysis_Engine SHALL assign a Risk_Level of "Be Careful" when exactly one Red_Flag is detected in the input.
4. THE Analysis_Engine SHALL assign a Risk_Level of "Probably Safe" when no Red_Flags are detected in the input.
5. THE Analysis_Engine SHALL detect the following Red_Flags: urgency language, secrecy requests, money transfer requests, gift card requests, bank verification code or OTP requests, password requests, Social Security or Medicare number requests, remote computer access requests, and impersonation of a bank, Amazon, Medicare, IRS, government agency, family member, or police.
6. THE Analysis_Engine SHALL populate the doNow field of the AnalysisResult with a list of 2–4 plain-language recommended actions.
7. THE Analysis_Engine SHALL populate the doNotDo field of the AnalysisResult with a list of 1–3 plain-language actions to avoid.
8. THE Analysis_Engine SHALL populate the safeResponseScript field with a short script the user can read to the suspected scammer.
9. WHEN impersonation of a known entity is detected, THE Analysis_Engine SHALL identify the impersonated entity in the scamType field.
10. THE Analysis_Engine SHALL set caregiverRecommended to true when Risk_Level is "High Risk".
11. THE Analysis_Engine SHALL operate entirely on-device without requiring a network connection.

---

### Requirement 5: Results Screen

**User Story:** As an elderly user, I want to see a clear, calm summary of whether I'm being scammed, so that I know exactly what to do next.

#### Acceptance Criteria

1. THE App SHALL display the Risk_Level prominently at the top of the Results screen using a color-coded badge (red for High Risk, amber for Be Careful, green for Probably Safe).
2. THE App SHALL display the detected Red_Flags in a "Why this looks suspicious" section.
3. THE App SHALL display the doNow list in a "What to do now" section.
4. THE App SHALL display the doNotDo list in a "What not to do" section.
5. THE App SHALL display the safeResponseScript in a clearly labeled section.
6. THE App SHALL display a "Call my trusted person" button on the Results screen.
7. THE App SHALL display a "Hear this aloud" button that reads the AnalysisResult summary using TTS.
8. THE App SHALL display a "Start over" button that returns the user to the home screen.
9. WHEN caregiverRecommended is true, THE App SHALL display a prominent recommendation to contact the Trusted_Contact.
10. THE App SHALL use expo-speech for all TTS playback.
11. THE App SHALL persist the most recent AnalysisResult to local storage using AsyncStorage.

---

### Requirement 6: Trusted Contact Setup

**User Story:** As an elderly user or caregiver, I want to save a trusted person's phone number, so that I can call them instantly from the app.

#### Acceptance Criteria

1. THE App SHALL provide a Trusted Contact setup screen with fields for name, phone number, and relationship.
2. WHEN the user saves a Trusted_Contact, THE App SHALL persist the contact data to local storage using AsyncStorage.
3. WHEN the user taps "Call my trusted person" from any screen, THE App SHALL initiate a native phone call to the saved Trusted_Contact phone number.
4. IF the phone number field contains a value that is not a valid phone number format, THEN THE App SHALL display an inline validation error and prevent saving.
5. THE App SHALL allow the user to update the saved Trusted_Contact at any time.
6. THE App SHALL display the saved Trusted_Contact name and relationship on the Trusted Contact setup screen when a contact has already been saved.

---

### Requirement 7: Demo Scenarios

**User Story:** As an elderly user or caregiver, I want to try example scam scenarios, so that I can learn what scams look and sound like.

#### Acceptance Criteria

1. THE App SHALL provide a Demo Scenarios screen with at least five pre-written scenario cards.
2. THE App SHALL include demo scenarios covering: bank impersonation, grandparent emergency scam, fake Medicare or government agency, fake Amazon or package delivery, and tech support scam.
3. WHEN the user selects a Demo_Scenario, THE App SHALL submit the scenario text to the Analysis_Engine and navigate to the Results screen.
4. THE App SHALL label each Demo_Scenario card with a plain-language title and a one-sentence description.
5. THE App SHALL display Demo_Scenario cards with sufficient touch target size (minimum 72 logical pixels height).

---

### Requirement 8: Accessibility and UX Standards

**User Story:** As an elderly user with low tech comfort, I want the app to be easy to see, read, and tap, so that I can use it confidently without help.

#### Acceptance Criteria

1. THE App SHALL use a minimum font size of 18sp for all body text and 24sp for headings.
2. THE App SHALL maintain a color contrast ratio of at least 4.5:1 between text and background for all text elements.
3. THE App SHALL use the defined color palette: deep navy (#1E3A5F), soft blue (#4F7CAC), warm cream background (#F7F4ED), gentle green (#5C8A5E), warm amber (#D9A441), soft red (#C65A46), dark text (#1F2933), and muted gray text (#5B6670).
4. THE App SHALL limit each screen to a maximum of three primary interactive elements to reduce cognitive load.
5. THE App SHALL use calm, supportive language free of technical jargon in all user-facing text.
6. THE App SHALL be compatible with iOS and Android via Expo.
7. THE App SHALL use react-native-safe-area-context to respect device safe area insets on all screens.
8. THE App SHALL support screen reader accessibility labels on all interactive elements.

---

### Requirement 9: Application Architecture and Persistence

**User Story:** As a developer, I want a clean, maintainable codebase with local persistence, so that the app is reliable and easy to extend.

#### Acceptance Criteria

1. THE App SHALL organize source code into the directories: app/, components/, hooks/, lib/, constants/, types/, and assets/.
2. THE App SHALL use Expo Router for all screen navigation.
3. THE App SHALL use React Context or Zustand for lightweight global state management.
4. THE App SHALL store all user data (Trusted_Contact, recent AnalysisResult) exclusively in AsyncStorage with no external server calls for user data.
5. THE App SHALL be written entirely in TypeScript with no untyped any values in public interfaces.
6. THE App SHALL define all shared data structures (including AnalysisResult, Trusted_Contact, Risk_Level, Red_Flag) in the types/ directory.
