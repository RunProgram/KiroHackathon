# Design Document: Enhanced Scam Detection

## Overview

This feature extends TrustPause's on-device scam detection engine in two focused, additive ways:

1. **Improved family impersonation handling** — the `impersonation_family` red flag already exists; this feature enhances the `buildSafeResponseScript` branch for that flag and adds a new `buildVerificationQuestions` function that surfaces personal verification questions the user can ask the caller.
2. **Contextual suggestions** — a new `buildSuggestions` function produces a `suggestions` array tailored to the detected flags and risk level. A new "Suggestions" section on the Results screen renders this array.

All logic runs entirely on-device. No network calls, no new files, no new components. Every change is additive within existing files.

---

## Architecture

The feature touches four existing files:

```
lib/analyzeScamRisk.ts      ← two new pure functions + enhanced script builder + return value fix
constants/strings.ts        ← two new sectionHeadings keys
app/results.tsx             ← two new conditional SectionCard blocks
types/index.ts              ← no changes (suggestions and verificationQuestions already defined)
```

Data flow is unchanged: `analyzeScamRisk(inputText)` → `AnalysisResult` → Results screen. The two new fields (`suggestions`, `verificationQuestions`) follow the same path as all existing fields.

```mermaid
flowchart LR
    A[User Input] --> B[analyzeScamRisk]
    B --> C{Pattern Matching\n& Scoring}
    C --> D[buildDoNow]
    C --> E[buildDoNotDo]
    C --> F[buildSafeResponseScript\n(enhanced)]
    C --> G[buildSuggestions\n(new)]
    C --> H[buildVerificationQuestions\n(new)]
    D & E & F & G & H --> I[AnalysisResult]
    I --> J[Results Screen]
    J --> K[Suggestions SectionCard\n(new)]
    J --> L[Verification Questions SectionCard\n(new, conditional)]
```

---

## Components and Interfaces

### `buildSuggestions(flags: RedFlag[], riskLevel: RiskLevel): string[]`

Pure function added to `lib/analyzeScamRisk.ts`. Produces a `string[]` of actionable, plain-language suggestions. Always returns at least two items.

**Logic (evaluated in order, items accumulated):**

| Condition | Suggestion added |
|---|---|
| `impersonation_family` in flags | "Call your family member back on the number saved in your phone — not the number that just called you." |
| `gift_card` in flags | "No legitimate organization — not the government, not a bank, not a utility — ever asks for payment by gift card." |
| `urgency` in flags | "Scammers create urgency on purpose to stop you from thinking clearly. It is always safe to take time to verify." |
| `remote_access_request` in flags | "Close the call and do not install any software. Legitimate companies do not need remote access to your device." |
| `otp_request` or `password_request` in flags | "No legitimate company will ever ask for your password or a one-time code over the phone." |
| `riskLevel === 'High Risk'` | "Before doing anything else, call your trusted contact and tell them what happened." |
| `riskLevel === 'Probably Safe'` | "This looks okay, but it is always fine to hang up and call back on a number you find yourself." |
| Always (fallback to reach minimum of 2) | "If something feels wrong, trust that feeling. Hang up and talk to someone you trust." |

The function slices to a reasonable maximum (6 items) to keep the screen readable.

**Rationale:** A pure function with no side effects makes this trivially testable with property-based tests and keeps the analysis engine deterministic.

---

### `buildVerificationQuestions(flags: RedFlag[]): string[]`

Pure function added to `lib/analyzeScamRisk.ts`. Returns at least three personal verification questions when `impersonation_family` is detected; returns an empty array otherwise.

**Questions returned when `impersonation_family` is detected:**

1. "What is the name of our family pet?"
2. "What was the name of the street you grew up on?"
3. "What is our family's special word that only we know?"
4. "What did we do together last time we saw each other?"

**Rationale:** These are questions only a genuine family member could answer. They are phrased in first-person so the user can read them directly to the caller. Returning an empty array for all other scam types preserves backward compatibility and keeps the Results screen uncluttered.

---

### `buildSafeResponseScript` — enhanced `impersonation_family` branch

The existing function already has an `impersonation_family` branch. It is enhanced to handle the `urgency` co-occurrence case:

**Before:**
```
"I need to hang up and call my family member directly to make sure they are safe. I will not send any money until I speak with them myself."
```

**After (base case — impersonation_family without urgency):**
```
"I need to hang up and call my family member directly on the number I already have for them. I will not send any money or take any action until I have spoken with them myself."
```

**After (urgency co-occurrence case):**
```
"I understand you say it's urgent, but I need to verify who I'm speaking with first. I am going to hang up and call my family member directly on the number I already have. I will not send any money until I have confirmed this with them."
```

**Rationale:** The urgency branch directly addresses Requirement 6.3 and gives the user a script that acknowledges the pressure without capitulating to it.

---

### `analyzeScamRisk` — return value fix

The function currently omits `suggestions` and `verificationQuestions` from its return object, causing a TypeScript error. The fix adds both fields to the return statement:

```typescript
return {
  // ... existing fields ...
  suggestions: buildSuggestions(detectedFlags, riskLevel),
  verificationQuestions: buildVerificationQuestions(detectedFlags),
};
```

---

### Results Screen — two new SectionCard blocks

Two new conditional sections are inserted in `app/results.tsx`, positioned after "What not to do" and before "What to say":

```tsx
{/* Section: Suggestions */}
{result.suggestions.length > 0 && (
  <SectionCard title={Strings.sectionHeadings.suggestions}>
    {result.suggestions.map((item, index) => (
      <Text key={index} style={styles.bulletText}>
        {'• '}
        {item}
      </Text>
    ))}
  </SectionCard>
)}

{/* Section: Questions to ask */}
{result.verificationQuestions.length > 0 && (
  <SectionCard title={Strings.sectionHeadings.questionsToAsk}>
    {result.verificationQuestions.map((item, index) => (
      <Text key={index} style={styles.bulletText}>
        {'• '}
        {item}
      </Text>
    ))}
  </SectionCard>
)}
```

Both sections reuse `SectionCard` and `styles.bulletText` exactly as the existing sections do. No new styles needed.

---

### `constants/strings.ts` — two new keys

```typescript
sectionHeadings: {
  // ... existing keys ...
  suggestions: 'Suggestions',
  questionsToAsk: 'Questions to ask',
},
```

---

## Data Models

No changes to `types/index.ts`. The `AnalysisResult` interface already defines:

```typescript
suggestions: string[];            // Proactive tips tailored to the situation
verificationQuestions: string[];  // Questions to ask to verify the caller's identity
```

The two new builder functions produce values that satisfy these types. The engine always populates both fields — empty arrays serve as the safe default when no content applies.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: suggestions array always has at least two items

*For any* string input, `analyzeScamRisk` SHALL return a `suggestions` array with length ≥ 2.

**Validates: Requirements 3.1, 7.1**

---

### Property 2: verificationQuestions biconditional on impersonation_family

*For any* string input, `verificationQuestions` is non-empty if and only if `impersonation_family` is present in `redFlags`. Equivalently: when `impersonation_family` is absent, `verificationQuestions` is empty; when `impersonation_family` is present, `verificationQuestions.length >= 3`.

**Validates: Requirements 7.1, 7.3**

---

### Property 3: impersonation_family suggestion — call back on known number

*For any* string input where `impersonation_family` is in `redFlags`, at least one item in `suggestions` SHALL contain language about calling the family member back on a number the user already knows (not the number that called them).

**Validates: Requirements 3.3**

---

### Property 4: gift_card suggestion — no legitimate organization uses gift cards

*For any* string input where `gift_card` is in `redFlags`, at least one item in `suggestions` SHALL contain language stating that no legitimate organization asks for payment by gift card.

**Validates: Requirements 3.4**

---

### Property 5: urgency suggestion — urgency is a tactic

*For any* string input where `urgency` is in `redFlags`, at least one item in `suggestions` SHALL contain language reminding the user that urgency is a deliberate scam tactic.

**Validates: Requirements 3.5**

---

### Property 6: High Risk suggestion — contact trusted person

*For any* string input where `riskLevel === 'High Risk'`, at least one item in `suggestions` SHALL contain language advising the user to contact their trusted contact before taking any action.

**Validates: Requirements 3.2**

---

### Property 7: impersonation_family scamType mapping

*For any* string input where `impersonation_family` is in `redFlags`, `scamType` SHALL equal `'grandparent_scam'`.

**Validates: Requirements 1.6**

---

### Property 8: impersonation_family safe response script content

*For any* string input where `impersonation_family` is in `redFlags`, `safeResponseScript` SHALL contain language about calling back on a known number and SHALL NOT commit to sending money. Additionally, when `urgency` is also in `redFlags`, the script SHALL contain language acknowledging the urgency claim without acting on it.

**Validates: Requirements 6.1, 6.3**

---

### Property 9: High Risk when impersonation_family co-occurs with escalating flags

*For any* string input where `impersonation_family` is in `redFlags` alongside any one of `money_transfer`, `gift_card`, `urgency`, or `secrecy`, `riskLevel` SHALL equal `'High Risk'`.

**Validates: Requirements 1.5**

---

### Property 10: Backward compatibility — existing fields unaffected

*For any* string input, all existing `AnalysisResult` fields (`riskLevel`, `scamType`, `redFlags`, `doNow`, `doNotDo`, `safeResponseScript`, `caregiverRecommended`, `analyzedAt`, `inputSummary`) SHALL continue to satisfy the invariants established by the existing property test suite (Properties 1–8 in `analyzeScamRisk.property.test.ts`).

**Validates: Requirements 7.4, 7.5**

---

## Error Handling

All new logic is pure and synchronous — no async operations, no I/O, no external calls. Error handling is therefore minimal:

- **Empty input**: `buildSuggestions` and `buildVerificationQuestions` receive an empty `flags` array. `buildSuggestions` falls through to the fallback items and returns ≥ 2 suggestions. `buildVerificationQuestions` returns `[]`. This is the existing behavior for empty input.
- **Unknown flags**: The functions use `Array.prototype.includes` checks. An unrecognized flag value simply produces no match and no suggestion for that branch — the fallback ensures the minimum count is still met.
- **Results screen with empty arrays**: Both new `SectionCard` blocks are guarded by `array.length > 0` checks, so they are never rendered with empty content.

---

## Testing Strategy

### Unit tests (`__tests__/lib/analyzeScamRisk.test.ts`)

Add example-based tests for:
- `buildSuggestions` with each flag combination (one test per flag)
- `buildVerificationQuestions` with and without `impersonation_family`
- `buildSafeResponseScript` for the enhanced `impersonation_family` branch (base case and urgency co-occurrence)
- `analyzeScamRisk` end-to-end with a grandparent scam input, verifying all new fields are populated

### Property-based tests (`__tests__/lib/analyzeScamRisk.property.test.ts`)

The project uses **fast-check** (already installed). Add the following property tests, each running a minimum of **100 iterations**:

| Test | Property | Tag |
|---|---|---|
| Property 1 | suggestions.length ≥ 2 for any input | `Feature: enhanced-scam-detection, Property 1: suggestions always ≥ 2` |
| Property 2 | verificationQuestions biconditional on impersonation_family | `Feature: enhanced-scam-detection, Property 2: verificationQuestions biconditional` |
| Property 3 | impersonation_family → call-back suggestion present | `Feature: enhanced-scam-detection, Property 3: call-back suggestion` |
| Property 4 | gift_card → gift card suggestion present | `Feature: enhanced-scam-detection, Property 4: gift card suggestion` |
| Property 5 | urgency → urgency-tactic suggestion present | `Feature: enhanced-scam-detection, Property 5: urgency suggestion` |
| Property 6 | High Risk → trusted contact suggestion present | `Feature: enhanced-scam-detection, Property 6: high risk suggestion` |
| Property 7 | impersonation_family → scamType === grandparent_scam | `Feature: enhanced-scam-detection, Property 7: scamType mapping` |
| Property 8 | impersonation_family → script content invariants | `Feature: enhanced-scam-detection, Property 8: safe response script` |
| Property 9 | impersonation_family + escalating flag → High Risk | `Feature: enhanced-scam-detection, Property 9: high risk co-occurrence` |

**Generator strategy for flag-conditioned properties:** Rather than relying on random strings to accidentally trigger patterns, use `fc.constantFrom(...phrases)` to pick from known trigger phrases, then concatenate with `fc.string()` for noise. This ensures the flag is reliably triggered while still exercising varied inputs.

### UI tests (`__tests__/components/`)

Add example-based tests for the Results screen:
- Renders Suggestions section when `suggestions` is non-empty
- Does not render Suggestions section when `suggestions` is empty
- Renders verification questions section when `verificationQuestions` is non-empty
- Does not render verification questions section when `verificationQuestions` is empty
- Section order: "What not to do" appears before Suggestions, Suggestions before "What to say"

### Regression

Run the full existing test suite (`npm test`) after implementation. All existing tests must continue to pass (Requirement 7.5).
