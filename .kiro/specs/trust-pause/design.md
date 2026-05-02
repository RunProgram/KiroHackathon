# Design Document: TrustPause

## Overview

TrustPause is a voice-first, mobile anti-scam safety app built with Expo and React Native, targeting elderly users with low tech comfort. The app's core value proposition is answering one urgent question in real time: "Am I being tricked right now?"

The MVP is entirely on-device — no backend, no accounts, no network calls for core functionality. A rules-based analysis engine evaluates user-provided text (from voice transcription or photo OCR) against a curated set of known scam patterns and returns a structured result with a risk level, red flags, recommended actions, and a safe response script.

The design prioritizes:
- **Accessibility first**: giant touch targets (≥72px), minimum 18sp body text, 4.5:1 contrast ratio, calm language
- **Simplicity**: maximum 3 primary interactive elements per screen, no jargon
- **Reliability**: fully offline-capable, no external dependencies for core analysis
- **Demability**: runs cleanly in Expo Go with mock-friendly service abstractions

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Expo / React Native                   │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  Expo Router │   │ Global State │   │  AsyncStorage  │  │
│  │  (app/ dir)  │   │  (Context /  │   │  Persistence   │  │
│  │              │   │   Zustand)   │   │                │  │
│  └──────┬───────┘   └──────┬───────┘   └───────┬────────┘  │
│         │                  │                   │            │
│  ┌──────▼───────────────────▼───────────────────▼────────┐  │
│  │                     Screen Layer                       │  │
│  │  Home | VoiceInput | PhotoInput | Results |            │  │
│  │  TrustedContactSetup | DemoScenarios                   │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────▼────────────────────────────┐  │
│  │                   Service Layer (lib/)                  │  │
│  │  transcribeAudio() | extractTextFromImage() |           │  │
│  │  analyzeScamRisk()                                      │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────▼────────────────────────────┐  │
│  │              Device APIs (Expo SDK)                     │  │
│  │  expo-audio | expo-image-picker | expo-speech |         │  │
│  │  Linking (phone calls)                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Architecture

Expo Router uses a file-based routing system under `app/`. All screens are top-level routes (no nested tabs for MVP simplicity).

```
app/
  _layout.tsx          ← Root layout, SafeAreaProvider, global context
  index.tsx            ← Home screen
  voice-input.tsx      ← Voice Input screen
  photo-input.tsx      ← Photo Input screen
  results.tsx          ← Results screen
  trusted-contact.tsx  ← Trusted Contact Setup screen
  demo-scenarios.tsx   ← Demo Scenarios screen
```

### State Management

React Context is used for lightweight global state. Two contexts are sufficient for MVP:

- **AppContext**: holds `trustedContact`, `recentResult`, and their setters; backed by AsyncStorage
- No Zustand dependency needed for this scope — React Context avoids an extra dependency

### Data Flow

```
User Input (Voice / Photo / Demo)
        │
        ▼
Service Layer (transcribeAudio / extractTextFromImage)
        │
        ▼ plain text string
analyzeScamRisk(text) → AnalysisResult
        │
        ▼
Results Screen (display + TTS)
        │
        ▼
AsyncStorage.setItem('recentResult', JSON.stringify(result))
```

---

## Components and Interfaces

### Folder Structure

```
app/                    ← Expo Router screens
components/
  PrimaryActionButton.tsx
  SecondaryActionButton.tsx
  DangerActionButton.tsx
  RiskBadge.tsx
  ResultCard.tsx
  LargeMicButton.tsx
  TrustedContactCard.tsx
  SectionCard.tsx
  ScenarioCard.tsx
hooks/
  useAppContext.ts      ← typed hook for AppContext
  useTrustedContact.ts  ← load/save trusted contact via AsyncStorage
  useRecentResult.ts    ← load/save recent result via AsyncStorage
lib/
  analyzeScamRisk.ts    ← rules-based analysis engine
  transcribeAudio.ts    ← audio transcription service (mock for MVP)
  extractTextFromImage.ts ← OCR service (mock for MVP)
  storage.ts            ← AsyncStorage helpers
constants/
  colors.ts             ← color palette constants
  typography.ts         ← font size constants
  strings.ts            ← all user-facing strings (no inline copy)
types/
  index.ts              ← all shared types
assets/
  fonts/
  images/
```

### Reusable Component Interfaces

```typescript
// PrimaryActionButton — large navy button, primary CTA
interface PrimaryActionButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}

// SecondaryActionButton — outlined soft-blue button
interface SecondaryActionButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

// DangerActionButton — soft-red button for emergency/call actions
interface DangerActionButtonProps {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

// RiskBadge — color-coded pill showing risk level
interface RiskBadgeProps {
  riskLevel: RiskLevel;
}

// ResultCard — summary card shown on home screen for recent result
interface ResultCardProps {
  result: AnalysisResult;
  onPress?: () => void;
}

// LargeMicButton — oversized microphone button with animated state
interface LargeMicButtonProps {
  isRecording: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

// TrustedContactCard — displays saved contact name and relationship
interface TrustedContactCardProps {
  contact: TrustedContact;
  onEdit: () => void;
}

// SectionCard — labeled card container for results sections
interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

// ScenarioCard — tappable card for a demo scenario
interface ScenarioCardProps {
  scenario: DemoScenario;
  onPress: (scenario: DemoScenario) => void;
}
```

### Service Interfaces

```typescript
// lib/transcribeAudio.ts
export async function transcribeAudio(audioUri: string): Promise<string>;

// lib/extractTextFromImage.ts
export async function extractTextFromImage(imageUri: string): Promise<string>;

// lib/analyzeScamRisk.ts
export function analyzeScamRisk(inputText: string): AnalysisResult;
```

All three service functions are designed to be mockable — the MVP implementations use local mock data or simple heuristics, and can be swapped for real ML/OCR services without changing call sites.

### Screen Navigation Contracts

Each screen receives navigation via Expo Router's `useRouter()` hook. Results screen receives the analysis result via router params or global context (context preferred to avoid serialization issues with complex objects).

---

## Data Models

### Core Types (`types/index.ts`)

```typescript
export type RiskLevel = 'High Risk' | 'Be Careful' | 'Probably Safe';

export type RedFlag =
  | 'urgency'
  | 'secrecy'
  | 'money_transfer'
  | 'gift_card'
  | 'otp_request'
  | 'password_request'
  | 'ssn_medicare_request'
  | 'remote_access_request'
  | 'impersonation_bank'
  | 'impersonation_amazon'
  | 'impersonation_medicare'
  | 'impersonation_irs'
  | 'impersonation_government'
  | 'impersonation_family'
  | 'impersonation_police';

export type ScamType =
  | 'bank_impersonation'
  | 'grandparent_scam'
  | 'medicare_government'
  | 'amazon_delivery'
  | 'tech_support'
  | 'irs_tax'
  | 'lottery_prize'
  | 'romance_scam'
  | 'unknown';

export interface AnalysisResult {
  riskLevel: RiskLevel;
  scamType: ScamType;
  redFlags: RedFlag[];
  doNow: string[];          // 2–4 plain-language recommended actions
  doNotDo: string[];        // 1–3 plain-language actions to avoid
  safeResponseScript: string;
  caregiverRecommended: boolean;
  analyzedAt: string;       // ISO timestamp
  inputSummary: string;     // first 100 chars of input, for display
}

export interface TrustedContact {
  name: string;
  phoneNumber: string;
  relationship: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;     // one-sentence summary shown on card
  scenarioText: string;    // full text submitted to analyzeScamRisk
  scamType: ScamType;
}
```

### AsyncStorage Keys

```typescript
// constants/storage.ts
export const STORAGE_KEYS = {
  TRUSTED_CONTACT: 'trustpause:trusted_contact',
  RECENT_RESULT: 'trustpause:recent_result',
} as const;
```

### Analysis Engine Internal Model

The rules-based engine uses a keyword/pattern map. Each `RedFlag` maps to an array of trigger phrases:

```typescript
// lib/analyzeScamRisk.ts (internal)
type RedFlagRule = {
  flag: RedFlag;
  patterns: RegExp[];
};

const RED_FLAG_RULES: RedFlagRule[] = [
  {
    flag: 'urgency',
    patterns: [
      /act now/i, /immediately/i, /urgent/i, /right away/i,
      /limited time/i, /expires today/i, /within 24 hours/i,
    ],
  },
  {
    flag: 'secrecy',
    patterns: [
      /don't tell/i, /keep this secret/i, /don't mention/i,
      /between us/i, /no one else/i,
    ],
  },
  {
    flag: 'gift_card',
    patterns: [
      /gift card/i, /itunes card/i, /google play card/i,
      /amazon gift/i, /buy.*card/i,
    ],
  },
  // ... (full rule set in implementation)
];
```

The engine returns deterministic results for any given input string — no randomness, no network calls.

### Color Palette (`constants/colors.ts`)

```typescript
export const Colors = {
  deepNavy:    '#1E3A5F',
  softBlue:    '#4F7CAC',
  cream:       '#F7F4ED',
  green:       '#5C8A5E',
  amber:       '#D9A441',
  red:         '#C65A46',
  darkText:    '#1F2933',
  grayText:    '#5B6670',
} as const;
```

### Typography (`constants/typography.ts`)

```typescript
export const Typography = {
  bodySize:    18,
  headingSize: 24,
  captionSize: 16,
  minTouchTarget: 72,
} as const;
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Risk level is determined solely by red flag count

*For any* plain-text input string, the risk level returned by `analyzeScamRisk` SHALL be "High Risk" if and only if two or more red flags are detected, "Be Careful" if and only if exactly one red flag is detected, and "Probably Safe" if and only if zero red flags are detected.

**Validates: Requirements 4.2, 4.3, 4.4**

---

### Property 2: Red flag count consistency

*For any* plain-text input string, the length of the `redFlags` array in the returned `AnalysisResult` SHALL equal the number of distinct red flag categories detected in that input, and this count SHALL be consistent with the assigned `riskLevel`.

**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

---

### Property 3: caregiverRecommended is true if and only if risk is High Risk

*For any* plain-text input string, `caregiverRecommended` in the returned `AnalysisResult` SHALL be `true` if and only if `riskLevel` is "High Risk".

**Validates: Requirements 4.10**

---

### Property 4: doNow list length invariant

*For any* plain-text input string, the `doNow` array in the returned `AnalysisResult` SHALL contain between 2 and 4 items (inclusive).

**Validates: Requirements 4.6**

---

### Property 5: doNotDo list length invariant

*For any* plain-text input string, the `doNotDo` array in the returned `AnalysisResult` SHALL contain between 1 and 3 items (inclusive).

**Validates: Requirements 4.7**

---

### Property 6: safeResponseScript is always non-empty

*For any* plain-text input string, the `safeResponseScript` field in the returned `AnalysisResult` SHALL be a non-empty string.

**Validates: Requirements 4.8**

---

### Property 7: Analysis result serialization round-trip

*For any* `AnalysisResult` object produced by `analyzeScamRisk`, serializing it to JSON and deserializing it SHALL produce an object that is deeply equal to the original.

**Validates: Requirements 9.4, 5.11**

---

### Property 8: TrustedContact serialization round-trip

*For any* valid `TrustedContact` object, serializing it to JSON and deserializing it SHALL produce an object that is deeply equal to the original.

**Validates: Requirements 6.2, 9.4**

---

### Property 9: Phone number validation rejects invalid formats

*For any* string that does not match a valid phone number format (e.g., not matching a standard 10-digit or E.164 pattern), the trusted contact save operation SHALL reject it and return a validation error.

**Validates: Requirements 6.4**

---

### Property 10: Demo scenario analysis produces valid results

*For any* demo scenario in the predefined scenario list, submitting its `scenarioText` to `analyzeScamRisk` SHALL return an `AnalysisResult` with a non-empty `redFlags` array and a `riskLevel` of "High Risk" or "Be Careful" (demo scenarios are known scam examples and must not return "Probably Safe").

**Validates: Requirements 7.3**

---

## Error Handling

### Audio Recording Errors

- **No speech detected**: `transcribeAudio()` returns an empty string. The Voice Input screen detects this and shows a retry prompt ("We didn't catch that — please try again").
- **Permission denied**: expo-audio permission request is handled before recording starts. If denied, the screen shows a clear message explaining that microphone access is needed and how to enable it in settings.
- **Recording failure**: Wrapped in try/catch; user sees a generic retry message.

### Photo / OCR Errors

- **Permission denied**: expo-image-picker permission handled before launch. Denied state shows settings guidance.
- **No text extracted**: `extractTextFromImage()` returns an empty string. The Photo Input screen detects this and prompts the user to describe the situation using voice instead.
- **Image too large / corrupt**: Caught in try/catch; user sees a retry prompt.

### Analysis Engine Errors

- The engine is a pure function with no I/O — it cannot throw for valid string inputs. Defensive: if input is empty string, returns a "Probably Safe" result with a note that no content was provided.
- All inputs are coerced to strings before passing to the engine.

### Phone Call Errors

- `Linking.openURL('tel:...')` can fail if the device doesn't support calls (e.g., iPad with no SIM). Wrapped in try/catch with a fallback alert showing the phone number for manual dialing.

### AsyncStorage Errors

- All reads/writes are wrapped in try/catch. Read failures fall back to `null` (treated as "no data saved"). Write failures are logged but do not crash the app — the user is not shown a storage error for non-critical persistence.

### Navigation Errors

- If the Results screen is reached without a valid `AnalysisResult` in context (e.g., deep link), it redirects to the Home screen.

---

## Testing Strategy

### Overview

The testing approach uses two complementary layers:

1. **Unit tests** — specific examples, edge cases, and error conditions for the analysis engine and utility functions
2. **Property-based tests** — universal properties verified across hundreds of generated inputs, focused on the `analyzeScamRisk` engine and serialization logic

### Property-Based Testing Library

**[fast-check](https://github.com/dubzzz/fast-check)** is the chosen PBT library for TypeScript/JavaScript. It integrates cleanly with Jest (Expo's default test runner) and supports arbitrary generators for strings, arrays, and custom types.

Each property test runs a minimum of **100 iterations**.

### Property Test Specifications

Each property test is tagged with a comment referencing the design property:

```typescript
// Feature: trust-pause, Property 1: Risk level is determined solely by red flag count
it('assigns correct risk level based on red flag count', () => {
  fc.assert(
    fc.property(fc.string(), (input) => {
      const result = analyzeScamRisk(input);
      const count = result.redFlags.length;
      if (count >= 2) expect(result.riskLevel).toBe('High Risk');
      else if (count === 1) expect(result.riskLevel).toBe('Be Careful');
      else expect(result.riskLevel).toBe('Probably Safe');
    }),
    { numRuns: 100 }
  );
});
```

Properties to implement as property-based tests:
- **Property 1**: Risk level ↔ red flag count consistency
- **Property 2**: `redFlags` array length matches risk level
- **Property 3**: `caregiverRecommended` ↔ "High Risk" equivalence
- **Property 4**: `doNow` length in [2, 4]
- **Property 5**: `doNotDo` length in [1, 3]
- **Property 6**: `safeResponseScript` always non-empty
- **Property 7**: `AnalysisResult` JSON round-trip
- **Property 8**: `TrustedContact` JSON round-trip
- **Property 9**: Phone number validation rejects invalid formats
- **Property 10**: Demo scenarios never return "Probably Safe"

### Unit Test Specifications

Unit tests cover concrete examples and edge cases:

| Test | Description |
|------|-------------|
| `analyzeScamRisk` — gift card | Input containing "buy a gift card" returns `gift_card` red flag |
| `analyzeScamRisk` — urgency + secrecy | Two flags → "High Risk" + `caregiverRecommended: true` |
| `analyzeScamRisk` — empty string | Returns "Probably Safe" with empty `redFlags` |
| `analyzeScamRisk` — impersonation | "This is the IRS" sets `scamType` to `irs_tax` |
| Phone validation — valid | "+15551234567" passes validation |
| Phone validation — invalid | "not-a-phone" fails with error message |
| AsyncStorage helpers | `saveTrustedContact` / `loadTrustedContact` round-trip |
| Home screen | Shows "set up trusted contact" prompt when no contact saved |
| Results screen | Displays caregiver recommendation when `caregiverRecommended: true` |

### Integration / Smoke Tests

- **Expo Go compatibility**: Manual smoke test — app launches and all 6 screens are reachable in Expo Go
- **TTS playback**: Manual test — "Hear this aloud" reads result summary on device
- **Phone call**: Manual test — "Call my trusted person" opens native dialer with correct number
- **Camera / library**: Manual test — image picker opens and preview renders

### Accessibility Testing

- Manual testing with iOS VoiceOver and Android TalkBack
- All interactive elements verified to have `accessibilityLabel` props
- Touch target sizes verified via layout inspection (≥72px height)
- Color contrast verified against WCAG 2.1 AA (4.5:1 minimum) using a contrast checker tool

### Test File Structure

```
__tests__/
  lib/
    analyzeScamRisk.test.ts      ← unit + property tests
    analyzeScamRisk.property.test.ts
    storage.test.ts
    transcribeAudio.test.ts
    extractTextFromImage.test.ts
  components/
    RiskBadge.test.tsx
    ResultCard.test.tsx
  hooks/
    useTrustedContact.test.ts
```
