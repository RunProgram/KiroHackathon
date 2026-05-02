# Requirements Document

## Introduction

This feature enhances TrustPause's scam detection capabilities in two focused areas:

1. **Family impersonation detection**: When the Analysis_Engine detects that a caller or message is impersonating a family member (e.g., "grandparent scam"), it performs deeper analysis to surface specific red flags unique to that pattern — such as urgency to send money, requests for secrecy, and the absence of personally identifying details. 
2. **Contextual suggestions**: The Results screen gains a new "Suggestions" section that surfaces proactive, situation-specific advice tailored to the detected scam type and risk level — going beyond the existing "What to do now" list to give the user concrete next steps they can act on immediately (e.g., "Call your grandson on the number saved in your phone", "Ask them what your dog's name is").

Both enhancements operate entirely on-device, require no network connection, and follow the app's existing accessibility and UX standards.

## Glossary

- **Analysis_Engine**: The rules-based scam detection module (`analyzeScamRisk`) in `lib/analyzeScamRisk.ts`
- **AnalysisResult**: The structured output of the Analysis_Engine, as defined in `types/index.ts`
- **Family_Impersonation**: A scam pattern where the caller or message claims to be a family member (son, daughter, grandchild, nephew, niece, etc.) in distress, typically to solicit money

- **Suggestion**: A single, actionable piece of advice tailored to the detected scam type and risk level, displayed in the Results screen
- **Suggestions_Section**: A new section on the Results screen that displays the list of Suggestions from the AnalysisResult
- **Red_Flag**: A specific scam indicator detected in user input, as defined in `types/index.ts`
- **Risk_Level**: One of three values — High Risk, Be Careful, or Probably Safe — assigned by the Analysis_Engine
- **Trusted_Contact**: A family member or caregiver saved locally by the user, identified by name, phone number, and relationship
- **Results_Screen**: The screen in `app/results.tsx` that displays the AnalysisResult after analysis
- **App**: The TrustPause Expo/React Native mobile application

---

## Requirements

### Requirement 1: Family Impersonation Red Flag Detection

**User Story:** As an elderly user, I want the app to recognize when someone is pretending to be my family member, so that I am warned before I send money or share information.

#### Acceptance Criteria

1. WHEN the input text contains language consistent with a family member claiming to be in distress (e.g., "it's me, your grandson", "your son has been arrested", "I'm in the hospital"), THE Analysis_Engine SHALL detect the `impersonation_family` Red_Flag.
2. WHEN the input text contains a claim of family identity combined with a request for money or gift cards, THE Analysis_Engine SHALL detect both the `impersonation_family` Red_Flag and the relevant money-related Red_Flag (`money_transfer` or `gift_card`).
3. WHEN the input text contains a claim of family identity combined with a secrecy request (e.g., "don't tell mom"), THE Analysis_Engine SHALL detect both the `impersonation_family` Red_Flag and the `secrecy` Red_Flag.
4. WHEN the input text contains a claim of family identity combined with urgency language, THE Analysis_Engine SHALL detect both the `impersonation_family` Red_Flag and the `urgency` Red_Flag.
5. THE Analysis_Engine SHALL assign a Risk_Level of "High Risk" when `impersonation_family` is detected alongside any one of: `money_transfer`, `gift_card`, `urgency`, or `secrecy`.
6. WHEN `impersonation_family` is detected, THE Analysis_Engine SHALL set the `scamType` field to `grandparent_scam`.

---

---

### Requirement 3: Contextual Suggestions Generation

**User Story:** As an elderly user, I want the app to give me specific, actionable advice based on what kind of scam was detected, so that I know exactly what to do in my situation.

#### Acceptance Criteria

1. THE Analysis_Engine SHALL populate the `suggestions` field of the AnalysisResult with at least two Suggestions for every analysis result, regardless of Risk_Level.
2. WHEN Risk_Level is "High Risk", THE Analysis_Engine SHALL include at least one Suggestion that advises the user to contact their Trusted_Contact before taking any action.
3. WHEN `impersonation_family` is detected, THE Analysis_Engine SHALL include a Suggestion to call the family member back on a number the user already knows (not the number that called them).
4. WHEN `gift_card` is detected, THE Analysis_Engine SHALL include a Suggestion explicitly stating that no legitimate organization ever asks for payment by gift card.
5. WHEN `urgency` is detected, THE Analysis_Engine SHALL include a Suggestion reminding the user that artificial urgency is a common scam tactic and that it is safe to take time to verify.
6. WHEN `remote_access_request` is detected, THE Analysis_Engine SHALL include a Suggestion advising the user to close the call and not install any software.
7. WHEN `otp_request` or `password_request` is detected, THE Analysis_Engine SHALL include a Suggestion stating that no legitimate company will ever ask for a password or one-time code over the phone.
8. WHEN Risk_Level is "Probably Safe", THE Analysis_Engine SHALL include at least one Suggestion that reassures the user while still encouraging caution.
9. THE Analysis_Engine SHALL write all Suggestions in plain, calm language free of technical jargon, consistent with the app's accessibility standards.

---

### Requirement 4: Suggestions Section on Results Screen

**User Story:** As an elderly user, I want to see tailored suggestions on the results screen, so that I have clear, specific guidance right where I need it.

#### Acceptance Criteria

1. THE Results_Screen SHALL display a "Suggestions" section that renders the `suggestions` array from the AnalysisResult.
2. WHEN the `suggestions` array is non-empty, THE Results_Screen SHALL display each Suggestion as a bullet item within the Suggestions_Section.
3. THE Results_Screen SHALL position the Suggestions_Section after the "What not to do" section and before the safe response script section.
4. WHEN the `suggestions` array is empty, THE Results_Screen SHALL NOT render the Suggestions_Section.
5. THE Results_Screen SHALL apply the same visual style to the Suggestions_Section as the other SectionCard sections on the screen.

---


### Requirement 6: Updated Safe Response Script for Family Impersonation

**User Story:** As an elderly user, I want a specific script to read to someone pretending to be my family member, so that I can safely end the conversation without being pressured.

#### Acceptance Criteria

1. WHEN `impersonation_family` is detected, THE Analysis_Engine SHALL set the `safeResponseScript` to a script that: (a) does not confirm or deny the caller's claimed identity, (b) states the user will call back on a known number, and (c) does not commit to sending money or taking any action.
2. THE Analysis_Engine SHALL write the safe response script for family impersonation in first-person, calm language that an elderly user can read aloud without feeling confrontational.
3. IF `impersonation_family` is detected alongside `urgency`, THEN THE Analysis_Engine SHALL include a phrase in the safe response script that acknowledges the urgency claim without acting on it (e.g., "I understand you say it's urgent, but I need to verify who I'm speaking with first.").

---

### Requirement 7: Backward Compatibility and Data Integrity

**User Story:** As a developer, I want the enhanced analysis output to be fully backward compatible with the existing app, so that no existing screens or components break.

#### Acceptance Criteria

1. THE Analysis_Engine SHALL always populate both `suggestions` and `verificationQuestions` fields in every AnalysisResult, using empty arrays when no content applies.
2. THE AnalysisResult type in `types/index.ts` SHALL define `suggestions` as `string[]` and `verificationQuestions` as `string[]`.
3. WHEN `impersonation_family` is not detected, THE Analysis_Engine SHALL return an empty array for `verificationQuestions`, preserving existing behavior for all other scam types.
4. THE Analysis_Engine SHALL continue to return all existing fields (`riskLevel`, `scamType`, `redFlags`, `doNow`, `doNotDo`, `safeResponseScript`, `caregiverRecommended`, `analyzedAt`, `inputSummary`) unchanged for all non-family-impersonation inputs.
5. THE App SHALL continue to pass all existing tests after the enhanced detection logic is added.
