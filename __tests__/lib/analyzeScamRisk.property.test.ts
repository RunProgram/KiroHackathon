import * as fc from 'fast-check';
import { analyzeScamRisk } from '../../lib/analyzeScamRisk';
import { DEMO_SCENARIOS } from '../../lib/demoScenarios';
import { DEMO_SCENARIOS } from '../../lib/demoScenarios';

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
