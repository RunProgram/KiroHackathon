import * as fc from 'fast-check';
import { analyzeScamRisk } from '../../lib/analyzeScamRisk';
import { DEMO_SCENARIOS } from '../../lib/demoScenarios';

// ---------------------------------------------------------------------------
// Feature: enhanced-scam-detection, Property 1: suggestions always ≥ 2
// Validates: Requirements 3.1, 7.1
// ---------------------------------------------------------------------------
describe('Feature: enhanced-scam-detection, Property 1: suggestions always ≥ 2', () => {
  it('suggestions.length >= 2 for any string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = analyzeScamRisk(input);
        expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: enhanced-scam-detection, Property 2: verificationQuestions biconditional
// Validates: Requirements 7.1, 7.3
// ---------------------------------------------------------------------------
describe('Feature: enhanced-scam-detection, Property 2: verificationQuestions biconditional', () => {
  it('verificationQuestions is non-empty iff impersonation_family is in redFlags', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = analyzeScamRisk(input);
        if (result.redFlags.includes('impersonation_family')) {
          expect(result.verificationQuestions.length).toBeGreaterThanOrEqual(3);
        } else {
          expect(result.verificationQuestions.length).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: enhanced-scam-detection, Property 3: call-back suggestion
// Validates: Requirements 3.3
// ---------------------------------------------------------------------------
describe('Feature: enhanced-scam-detection, Property 3: call-back suggestion', () => {
  it('impersonation_family → at least one suggestion contains call-back language', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom("grandma it's me", "family emergency", "it's your grandson"),
          fc.string()
        ).map(([trigger, noise]) => trigger + ' ' + noise),
        (input) => {
          const result = analyzeScamRisk(input);
          fc.pre(result.redFlags.includes('impersonation_family'));
          expect(
            result.suggestions.some((s) =>
              s.toLowerCase().includes('number saved in your phone') ||
              s.toLowerCase().includes('number you already know') ||
              s.toLowerCase().includes('call your family member back')
            )
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: enhanced-scam-detection, Property 4: gift card suggestion
// Validates: Requirements 3.4
// ---------------------------------------------------------------------------
describe('Feature: enhanced-scam-detection, Property 4: gift card suggestion', () => {
  it('gift_card → at least one suggestion contains no-legitimate-organization language', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom('buy a gift card', 'iTunes card', 'Google Play card'),
          fc.string()
        ).map(([trigger, noise]) => trigger + ' ' + noise),
        (input) => {
          const result = analyzeScamRisk(input);
          fc.pre(result.redFlags.includes('gift_card'));
          expect(
            result.suggestions.some((s) =>
              s.toLowerCase().includes('no legitimate organization') ||
              s.toLowerCase().includes('gift card')
            )
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: enhanced-scam-detection, Property 5: urgency suggestion
// Validates: Requirements 3.5
// ---------------------------------------------------------------------------
describe('Feature: enhanced-scam-detection, Property 5: urgency suggestion', () => {
  it('urgency → at least one suggestion contains urgency-tactic language', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom('act now', 'immediately', 'urgent'),
          fc.string()
        ).map(([trigger, noise]) => trigger + ' ' + noise),
        (input) => {
          const result = analyzeScamRisk(input);
          fc.pre(result.redFlags.includes('urgency'));
          expect(
            result.suggestions.some((s) =>
              s.toLowerCase().includes('urgency on purpose') ||
              s.toLowerCase().includes('urgency') ||
              s.toLowerCase().includes('take time to verify')
            )
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: enhanced-scam-detection, Property 6: high risk suggestion
// Validates: Requirements 3.2
// ---------------------------------------------------------------------------
describe('Feature: enhanced-scam-detection, Property 6: high risk suggestion', () => {
  it('High Risk → at least one suggestion contains trusted-contact language', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom(
            "wire transfer act now",
            "send money urgently don't tell anyone",
            "buy gift cards immediately secrecy"
          ),
          fc.string()
        ).map(([trigger, noise]) => trigger + ' ' + noise),
        (input) => {
          const result = analyzeScamRisk(input);
          fc.pre(result.riskLevel === 'High Risk');
          expect(
            result.suggestions.some((s) =>
              s.toLowerCase().includes('trusted contact') ||
              s.toLowerCase().includes('trusted person')
            )
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: enhanced-scam-detection, Property 7: scamType mapping
// Validates: Requirements 1.6
// ---------------------------------------------------------------------------
describe('Feature: enhanced-scam-detection, Property 7: scamType mapping', () => {
  it('impersonation_family → scamType === grandparent_scam', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom(
            "grandma it's me",
            "family emergency",
            "your grandson has been arrested"
          ),
          fc.string()
        ).map(([trigger, noise]) => trigger + ' ' + noise),
        (input) => {
          const result = analyzeScamRisk(input);
          fc.pre(result.redFlags.includes('impersonation_family'));
          expect(result.scamType).toBe('grandparent_scam');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: enhanced-scam-detection, Property 8: safe response script
// Validates: Requirements 6.1, 6.3
// ---------------------------------------------------------------------------
describe('Feature: enhanced-scam-detection, Property 8: safe response script', () => {
  it('impersonation_family → script contains call-back language and does not commit to sending money', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom("grandma it's me", "family emergency"),
          fc.string()
        ).map(([trigger, noise]) => trigger + ' ' + noise),
        (input) => {
          const result = analyzeScamRisk(input);
          fc.pre(result.redFlags.includes('impersonation_family'));
          // Script must contain call-back language
          expect(
            result.safeResponseScript.toLowerCase().includes('number i already have') ||
            result.safeResponseScript.toLowerCase().includes('call my family member')
          ).toBe(true);
          // Script must not commit to sending money (it should say "will not send")
          expect(result.safeResponseScript.toLowerCase()).not.toContain('i will send money');
          // If urgency is also detected, script must acknowledge urgency
          if (result.redFlags.includes('urgency')) {
            expect(
              result.safeResponseScript.toLowerCase().includes("you say it's urgent") ||
              result.safeResponseScript.toLowerCase().includes('urgent')
            ).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Feature: enhanced-scam-detection, Property 9: high risk co-occurrence
// Validates: Requirements 1.5
// ---------------------------------------------------------------------------
describe('Feature: enhanced-scam-detection, Property 9: high risk co-occurrence', () => {
  it('impersonation_family + escalating flag → High Risk', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom(
            "grandma it's me",
            "family emergency",
            "it's your grandson"
          ),
          fc.constantFrom(
            'wire transfer',
            'buy a gift card',
            "act now",
            "don't tell anyone"
          )
        ).map(([family, escalating]) => family + ' ' + escalating),
        (input) => {
          const result = analyzeScamRisk(input);
          expect(result.riskLevel).toBe('High Risk');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 1: Risk level is determined solely by red flag count
// Validates: Requirements 4.2, 4.3, 4.4
// ---------------------------------------------------------------------------
describe('Property 1: Risk level is determined solely by red flag count', () => {
  it('assigns correct risk level based on red flag count', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = analyzeScamRisk(input);
        const count = result.redFlags.length;
        if (count >= 2) {
          expect(result.riskLevel).toBe('High Risk');
        } else if (count === 1) {
          expect(result.riskLevel).toBe('Be Careful');
        } else {
          expect(result.riskLevel).toBe('Probably Safe');
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Red flag count consistency
// Validates: Requirements 4.2, 4.3, 4.4, 4.5
// ---------------------------------------------------------------------------
describe('Property 2: Red flag count consistency', () => {
  it('redFlags.length is consistent with riskLevel for any string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = analyzeScamRisk(input);
        const count = result.redFlags.length;

        if (result.riskLevel === 'High Risk') {
          expect(count).toBeGreaterThanOrEqual(2);
        } else if (result.riskLevel === 'Be Careful') {
          expect(count).toBe(1);
        } else {
          // 'Probably Safe'
          expect(count).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: caregiverRecommended ↔ High Risk
// Validates: Requirements 4.10
// ---------------------------------------------------------------------------
describe('Property 3: caregiverRecommended is true if and only if risk is High Risk', () => {
  it('caregiverRecommended equals (riskLevel === "High Risk") for any string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = analyzeScamRisk(input);
        expect(result.caregiverRecommended).toBe(result.riskLevel === 'High Risk');
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: doNow length invariant
// Validates: Requirements 4.6
// ---------------------------------------------------------------------------
describe('Property 4: doNow list length invariant', () => {
  it('doNow contains between 2 and 4 items for any string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = analyzeScamRisk(input);
        expect(result.doNow.length).toBeGreaterThanOrEqual(2);
        expect(result.doNow.length).toBeLessThanOrEqual(4);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: doNotDo length invariant
// Validates: Requirements 4.7
// ---------------------------------------------------------------------------
describe('Property 5: doNotDo list length invariant', () => {
  it('doNotDo contains between 1 and 3 items for any string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = analyzeScamRisk(input);
        expect(result.doNotDo.length).toBeGreaterThanOrEqual(1);
        expect(result.doNotDo.length).toBeLessThanOrEqual(3);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: safeResponseScript always non-empty
// Validates: Requirements 4.8
// ---------------------------------------------------------------------------
describe('Property 6: safeResponseScript is always non-empty', () => {
  it('safeResponseScript is a non-empty string for any string input', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = analyzeScamRisk(input);
        expect(result.safeResponseScript.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: AnalysisResult JSON round-trip
// Validates: Requirements 9.4, 5.11
// ---------------------------------------------------------------------------
describe('Property 7: AnalysisResult JSON round-trip', () => {
  it('serializing and deserializing an AnalysisResult produces a deeply equal object', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = analyzeScamRisk(input);
        const serialized = JSON.stringify(result);
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toEqual(result);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: TrustedContact JSON round-trip
// Validates: Requirements 6.2, 9.4
// ---------------------------------------------------------------------------
describe('Property 8: TrustedContact serialization round-trip', () => {
  it('serializing and deserializing a TrustedContact produces a deeply equal object', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string(),
          phoneNumber: fc.string(),
          relationship: fc.string(),
        }),
        (contact) => {
          const serialized = JSON.stringify(contact);
          const deserialized = JSON.parse(serialized);
          expect(deserialized).toEqual(contact);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Demo scenario analysis produces valid results
// Validates: Requirements 7.3
// ---------------------------------------------------------------------------
describe('Property 10: Demo scenario analysis produces valid results', () => {
  it('demo scenarios never return Probably Safe and always have red flags', () => {
    for (const scenario of DEMO_SCENARIOS) {
      const result = analyzeScamRisk(scenario.scenarioText);
      expect(result.riskLevel).not.toBe('Probably Safe');
      expect(result.redFlags.length).toBeGreaterThan(0);
    }
  });
});
