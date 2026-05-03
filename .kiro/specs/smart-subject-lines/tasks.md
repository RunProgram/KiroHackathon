# Implementation Plan: Smart Subject Lines

## Overview

Replace the naive `inputText.slice(0, 100)` truncation in `analyzeScamRisk` with an intelligent `generateSubjectLine` function that uses scam detection results (`scamType`, `redFlags`, `riskLevel`) to produce meaningful, descriptive subject lines. The implementation creates two pure functions (`generateSubjectLine` and `extractCleanPhrase`) in a new module, integrates them into the existing analysis engine, and updates affected tests.

## Tasks

- [x] 1. Create `generateSubjectLine` module with core types and label mappings
  - [x] 1.1 Create `lib/generateSubjectLine.ts` with `SubjectLineInput` interface, `SCAM_TYPE_LABELS` record, and `ACTION_LABELS` partial record
    - Define `SubjectLineInput` interface with `inputText`, `scamType`, `redFlags`, and `riskLevel` fields
    - Define `SCAM_TYPE_LABELS: Record<ScamType, string>` mapping all 9 `ScamType` values to human-readable labels (empty string for `unknown`)
    - Define `ACTION_LABELS: Partial<Record<RedFlag, string>>` mapping 8 red flags to action descriptor strings
    - Export all types and constants
    - _Requirements: 1.1, 1.2, 7.1, 7.2_

  - [x] 1.2 Implement `extractCleanPhrase` helper function in `lib/generateSubjectLine.ts`
    - Return `"Empty message"` when input is empty or whitespace-only
    - Strip leading OCR noise (digits, symbols, whitespace) via regex
    - Replace newlines with spaces and collapse consecutive whitespace
    - Fall back to original text (with whitespace normalized) if cleaning removes all content
    - Extract first sentence if a sentence boundary is found within 100 characters
    - Truncate at last word boundary before 100 characters and append ellipsis when no sentence boundary is found
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2_

  - [x] 1.3 Implement `generateSubjectLine` function in `lib/generateSubjectLine.ts`
    - Look up entity descriptor from `SCAM_TYPE_LABELS` using `scamType`, defaulting to empty string for unknown keys
    - Collect up to 2 action descriptors from `ACTION_LABELS` based on `redFlags` order
    - Combine entity and actions with em dash separator when both are present
    - Prefix with `"Suspicious message"` when scam type is unknown but action flags exist
    - Fall back to `extractCleanPhrase` when no entity or action descriptors are available
    - Enforce 120-character max length, truncating to 117 characters plus ellipsis when exceeded
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Test `generateSubjectLine` and `extractCleanPhrase`
  - [x] 2.1 Write unit tests for `generateSubjectLine` and `extractCleanPhrase` in `__tests__/lib/generateSubjectLine.test.ts`
    - Test known scam type with action flags produces `"{entity} — {action1}, {action2}"` format
    - Test known scam type without action flags produces just the entity label
    - Test unknown scam type with action flags produces `"Suspicious message — ..."` prefix
    - Test unknown scam type without flags falls back to cleaned text extraction
    - Test empty and whitespace-only input returns `"Empty message"`
    - Test OCR noise stripping (leading numbers, symbols, newlines)
    - Test sentence boundary extraction within 100 characters
    - Test word boundary truncation with ellipsis for long text without sentence boundaries
    - Test 120-character max length enforcement with truncation to 117 + ellipsis
    - Test that more than 2 action flags only includes the first 2
    - Test fallback when OCR stripping removes all content
    - Test unknown `scamType` key falls back to empty entity (treated as unknown)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 7.2_

  - [x] 2.2 Write property test: non-empty output (Property 1) in `__tests__/lib/generateSubjectLine.property.test.ts`
    - **Property 1: Non-empty output**
    - Generate random `SubjectLineInput` values using fast-check arbitraries for `ScamType`, `RedFlag[]`, `RiskLevel`, and `string`
    - Assert `generateSubjectLine(input).length > 0` for all inputs
    - **Validates: Requirements 3.1**

  - [x] 2.3 Write property test: max length (Property 2) in `__tests__/lib/generateSubjectLine.property.test.ts`
    - **Property 2: Max length**
    - Assert `generateSubjectLine(input).length <= 120` for all inputs
    - **Validates: Requirements 3.2**

  - [x] 2.4 Write property test: no newlines (Property 3) in `__tests__/lib/generateSubjectLine.property.test.ts`
    - **Property 3: No newlines**
    - Assert `generateSubjectLine(input).indexOf('\n') === -1` for all inputs
    - **Validates: Requirements 3.4**

  - [x] 2.5 Write property test: scam type presence (Property 4) in `__tests__/lib/generateSubjectLine.property.test.ts`
    - **Property 4: Scam type presence**
    - For inputs where `scamType !== 'unknown'`, assert the output contains `SCAM_TYPE_LABELS[input.scamType]`
    - **Validates: Requirements 1.1**

  - [x] 2.6 Write property test: suspicious fallback (Property 5) in `__tests__/lib/generateSubjectLine.property.test.ts`
    - **Property 5: Suspicious fallback**
    - For inputs where `scamType === 'unknown'` and at least one red flag has an action label, assert output starts with `"Suspicious message"`
    - **Validates: Requirements 1.4**

  - [x] 2.7 Write property test: empty input handling (Property 6) in `__tests__/lib/generateSubjectLine.property.test.ts`
    - **Property 6: Empty input handling**
    - For inputs where `inputText.trim() === ''`, `scamType === 'unknown'`, and `redFlags` is empty, assert output equals `"Empty message"`
    - **Validates: Requirements 4.1**

  - [x] 2.8 Write property test: deterministic (Property 7) in `__tests__/lib/generateSubjectLine.property.test.ts`
    - **Property 7: Deterministic**
    - Assert calling `generateSubjectLine` twice with the same input produces identical output
    - **Validates: Requirements 3.5**

  - [x] 2.9 Write property test: action limit (Property 8) in `__tests__/lib/generateSubjectLine.property.test.ts`
    - **Property 8: Action limit**
    - Assert the output contains at most 2 action descriptors from `ACTION_LABELS` values
    - **Validates: Requirements 1.2**

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Integrate `generateSubjectLine` into `analyzeScamRisk`
  - [x] 4.1 Replace `inputSummary: inputText.slice(0, 100)` in `lib/analyzeScamRisk.ts` with a call to `generateSubjectLine`
    - Import `generateSubjectLine` from `./generateSubjectLine`
    - Pass `{ inputText, scamType, redFlags: uniqueFlags, riskLevel }` to `generateSubjectLine`
    - Assign the return value to `inputSummary` in the returned `AnalysisResult`
    - _Requirements: 5.1, 5.2_

  - [x] 4.2 Update existing tests in `__tests__/lib/analyzeScamRisk.test.ts` that assert on `inputSummary` truncation behavior
    - Update the test `'sets inputSummary to the first 100 characters of the input'` to assert the new subject line behavior (e.g., for a 200-char `'a'` string with no scam signals, `inputSummary` should be a cleaned phrase, not a raw slice)
    - Update the test `'sets inputSummary to the full input when input is shorter than 100 chars'` to assert the new behavior
    - Verify the grandparent scam scenario test still passes (it does not assert on `inputSummary` directly)
    - _Requirements: 5.1, 6.1, 6.2, 6.3_

- [x] 5. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- Display components (`ResultCard`, `index.tsx`, `results.tsx`) require no code changes — they already read `inputSummary` from `AnalysisResult` (Requirements 6.1, 6.2, 6.3)
