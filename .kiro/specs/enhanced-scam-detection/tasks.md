# Implementation Plan: Enhanced Scam Detection

## Overview

Additive changes across four existing files: two new pure functions and a return-value fix in `lib/analyzeScamRisk.ts`, two new string keys in `constants/strings.ts`, two new conditional `SectionCard` blocks in `app/results.tsx`, and new unit, property-based, and UI tests. No new files, no new components, no network calls.

## Tasks

- [x] 1. Add `buildSuggestions` to `lib/analyzeScamRisk.ts`
  - Implement `buildSuggestions(flags: RedFlag[], riskLevel: RiskLevel): string[]` as a pure exported function
  - Evaluate flags in order: `impersonation_family`, `gift_card`, `urgency`, `remote_access_request`, `otp_request`/`password_request`, then risk-level branches (`High Risk`, `Probably Safe`), then the always-present fallback
  - Accumulate matching suggestion strings into an array, then slice to a maximum of 6 items
  - Ensure the fallback item ("If something feels wrong…") guarantees the minimum of 2 items is always met
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [x] 1.1 Write unit tests for `buildSuggestions`
    - One test per flag: verify the correct suggestion string appears when that flag is present
    - Test `High Risk` branch: trusted-contact suggestion present
    - Test `Probably Safe` branch: reassurance suggestion present
    - Test empty flags: at least 2 suggestions returned
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_


- [x] 3. Enhance `buildSafeResponseScript` for the `impersonation_family` branch
  - Replace the existing single-string return for `impersonation_family` with a two-branch conditional:
    - Base case (no `urgency` co-occurrence): script states user will call back on the number they already have and will not send money or take action
    - Urgency co-occurrence case: script opens by acknowledging the urgency claim, then states the user will hang up and call back on the known number before sending money
  - _Requirements: 6.1, 6.2, 6.3_

  - [x] 3.1 Write unit tests for the enhanced `buildSafeResponseScript`
    - Test `impersonation_family` alone: script contains "number I already have" and does not commit to sending money
    - Test `impersonation_family` + `urgency`: script contains urgency-acknowledgement phrase and call-back language
    - _Requirements: 6.1, 6.3_

- [x] 4. Fix `analyzeScamRisk` return statement to include new fields
  - Add `suggestions: buildSuggestions(detectedFlags, riskLevel)` to the return object
  - Add `verificationQuestions: buildVerificationQuestions(detectedFlags)` to the return object
  - Confirm TypeScript compilation passes with no errors on `lib/analyzeScamRisk.ts`
  - _Requirements: 7.1, 7.2, 7.4_

  - [x] 4.1 Write end-to-end unit test for grandparent scam scenario
    - Call `analyzeScamRisk` with a realistic grandparent-scam input (e.g., "Grandma, it's me, your grandson. I've been arrested and need you to buy gift cards urgently. Don't tell mom.")
    - Assert `scamType === 'grandparent_scam'`
    - Assert `riskLevel === 'High Risk'`
    - Assert `redFlags` contains `impersonation_family`, `gift_card`, `urgency`, `secrecy`
    - Assert `suggestions.length >= 2`
    - Assert `verificationQuestions.length === 4`
    - Assert `safeResponseScript` contains urgency-acknowledgement language
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 3.1, 6.3, 7.1_

- [x] 5. Checkpoint — verify logic layer before touching UI
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Add `suggestions` and `questionsToAsk` keys to `constants/strings.ts`
  - Add `suggestions: 'Suggestions'` to the `sectionHeadings` object
  - Add `questionsToAsk: 'Questions to ask'` to the `sectionHeadings` object
  - _Requirements: 4.1, 5.1 (implicit — section titles must exist before Results screen renders them)_

- [x] 7. Insert Suggestions and Verification Questions `SectionCard` blocks in `app/results.tsx`
  - [x] 7.1 Add Suggestions `SectionCard` after "What not to do", before "What to say"
    - Guard with `result.suggestions.length > 0`
    - Render each suggestion as a `Text` with `styles.bulletText` and `{'• '}` prefix, keyed by index
    - Use `Strings.sectionHeadings.suggestions` as the title
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 7.2 Add Verification Questions `SectionCard` after Suggestions, before "What to say"
    - Guard with `result.verificationQuestions.length > 0`
    - Render each question as a `Text` with `styles.bulletText` and `{'• '}` prefix, keyed by index
    - Use `Strings.sectionHeadings.questionsToAsk` as the title
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 7.3 Write UI tests for the Results screen new sections
    - Create `__tests__/components/ResultsScreen.test.tsx`
    - Test: renders Suggestions section when `suggestions` is non-empty
    - Test: does not render Suggestions section when `suggestions` is empty
    - Test: renders Verification Questions section when `verificationQuestions` is non-empty
    - Test: does not render Verification Questions section when `verificationQuestions` is empty
    - Test: section order — "What not to do" appears before Suggestions, Suggestions before "What to say"
    - Use `@testing-library/react-native` `render` and `queryByText`; mock `useAppContext` and `expo-router`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 8. Add property-based tests (Properties 1–9) to `__tests__/lib/analyzeScamRisk.property.test.ts`
  - Fix the duplicate `DEMO_SCENARIOS` import that already exists in the file before adding new tests
  - For flag-conditioned properties (3–9), use `fc.constantFrom(...triggerPhrases)` concatenated with `fc.string()` to reliably trigger the target flag while varying surrounding text
  - Each property test runs a minimum of 100 iterations (`numRuns: 100`)

  - [x] 8.1 Write Property 1 — `suggestions.length >= 2` for any input
    - Tag: `Feature: enhanced-scam-detection, Property 1: suggestions always ≥ 2`
    - Generator: `fc.string()`
    - Assert `result.suggestions.length >= 2`
    - _Requirements: 3.1, 7.1_

  - [x] 8.2 Write Property 2 — `verificationQuestions` biconditional on `impersonation_family`
    - Tag: `Feature: enhanced-scam-detection, Property 2: verificationQuestions biconditional`
    - Generator: `fc.string()`
    - Assert: if `impersonation_family` in `redFlags` then `verificationQuestions.length >= 3`; else `verificationQuestions.length === 0`
    - _Requirements: 7.1, 7.3_

  - [x] 8.3 Write Property 3 — `impersonation_family` → call-back suggestion present
    - Tag: `Feature: enhanced-scam-detection, Property 3: call-back suggestion`
    - Generator: `fc.constantFrom("grandma it's me", "family emergency", "it's your grandson")` concatenated with `fc.string()`
    - Assert at least one suggestion contains language about calling back on a known number
    - _Requirements: 3.3_

  - [x] 8.4 Write Property 4 — `gift_card` → gift card suggestion present
    - Tag: `Feature: enhanced-scam-detection, Property 4: gift card suggestion`
    - Generator: `fc.constantFrom("buy a gift card", "iTunes card", "Google Play card")` concatenated with `fc.string()`
    - Assert at least one suggestion contains language about no legitimate organization using gift cards
    - _Requirements: 3.4_

  - [x] 8.5 Write Property 5 — `urgency` → urgency-tactic suggestion present
    - Tag: `Feature: enhanced-scam-detection, Property 5: urgency suggestion`
    - Generator: `fc.constantFrom("act now", "immediately", "urgent")` concatenated with `fc.string()`
    - Assert at least one suggestion contains language about urgency being a deliberate tactic
    - _Requirements: 3.5_

  - [x] 8.6 Write Property 6 — `High Risk` → trusted contact suggestion present
    - Tag: `Feature: enhanced-scam-detection, Property 6: high risk suggestion`
    - Generator: `fc.constantFrom("wire transfer act now", "send money urgently don't tell anyone", "buy gift cards immediately secrecy")` concatenated with `fc.string()`
    - Filter to inputs where `riskLevel === 'High Risk'`; assert at least one suggestion contains trusted-contact language
    - _Requirements: 3.2_

  - [x] 8.7 Write Property 7 — `impersonation_family` → `scamType === 'grandparent_scam'`
    - Tag: `Feature: enhanced-scam-detection, Property 7: scamType mapping`
    - Generator: `fc.constantFrom("grandma it's me", "family emergency", "your grandson has been arrested")` concatenated with `fc.string()`
    - Assert `result.scamType === 'grandparent_scam'`
    - _Requirements: 1.6_

  - [x] 8.8 Write Property 8 — `impersonation_family` → safe response script content invariants
    - Tag: `Feature: enhanced-scam-detection, Property 8: safe response script`
    - Generator: `fc.constantFrom("grandma it's me", "family emergency")` concatenated with `fc.string()`
    - Assert script contains call-back language and does not contain "send money" as a commitment
    - For inputs that also trigger `urgency`, assert script contains urgency-acknowledgement language
    - _Requirements: 6.1, 6.3_

  - [x] 8.9 Write Property 9 — `impersonation_family` + escalating flag → `High Risk`
    - Tag: `Feature: enhanced-scam-detection, Property 9: high risk co-occurrence`
    - Generator: combine a family-impersonation phrase with one of `["wire transfer", "buy a gift card", "act now", "don't tell anyone"]`
    - Assert `result.riskLevel === 'High Risk'`
    - _Requirements: 1.5_

- [x] 9. Final checkpoint — full regression
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Properties 1–9 correspond exactly to the Correctness Properties section of the design document
- The existing property test file has a duplicate `DEMO_SCENARIOS` import and a duplicate `Property 10` describe block — fix these before adding new tests (task 8)
- All new logic is pure and synchronous; no async handling needed
- The `AnalysisResult` type in `types/index.ts` already declares `suggestions` and `verificationQuestions` — no type changes required
