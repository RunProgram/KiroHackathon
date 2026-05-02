import { analyzeScamRisk } from '../../lib/analyzeScamRisk';

// ---------------------------------------------------------------------------
// Unit tests for analyzeScamRisk — concrete examples
// Requirements: 4.1–4.11
// ---------------------------------------------------------------------------

describe('analyzeScamRisk — unit tests', () => {
  // -------------------------------------------------------------------------
  // Gift card detection
  // -------------------------------------------------------------------------
  it('detects gift_card red flag when input contains "buy a gift card"', () => {
    const result = analyzeScamRisk('buy a gift card');
    expect(result.redFlags).toContain('gift_card');
  });

  // -------------------------------------------------------------------------
  // Urgency + secrecy → High Risk + caregiverRecommended
  // -------------------------------------------------------------------------
  it('returns High Risk and caregiverRecommended:true for urgency + secrecy phrases', () => {
    const result = analyzeScamRisk("Act now and don't tell anyone");
    expect(result.riskLevel).toBe('High Risk');
    expect(result.caregiverRecommended).toBe(true);
    expect(result.redFlags).toContain('urgency');
    expect(result.redFlags).toContain('secrecy');
  });

  // -------------------------------------------------------------------------
  // Empty string → Probably Safe, no red flags
  // -------------------------------------------------------------------------
  it('returns Probably Safe with empty redFlags for an empty string input', () => {
    const result = analyzeScamRisk('');
    expect(result.riskLevel).toBe('Probably Safe');
    expect(result.redFlags).toEqual([]);
    expect(result.caregiverRecommended).toBe(false);
  });

  // -------------------------------------------------------------------------
  // IRS impersonation → scamType irs_tax
  // -------------------------------------------------------------------------
  it('sets scamType to irs_tax when input contains "This is the IRS calling"', () => {
    const result = analyzeScamRisk('This is the IRS calling');
    expect(result.scamType).toBe('irs_tax');
  });

  // -------------------------------------------------------------------------
  // doNow and doNotDo length invariants hold for concrete inputs
  // -------------------------------------------------------------------------
  it('always returns 2–4 doNow items', () => {
    const inputs = [
      '',
      'buy a gift card',
      "Act now and don't tell anyone",
      'This is the IRS calling, you owe back taxes',
    ];
    for (const input of inputs) {
      const result = analyzeScamRisk(input);
      expect(result.doNow.length).toBeGreaterThanOrEqual(2);
      expect(result.doNow.length).toBeLessThanOrEqual(4);
    }
  });

  it('always returns 1–3 doNotDo items', () => {
    const inputs = [
      '',
      'buy a gift card',
      "Act now and don't tell anyone",
      'This is the IRS calling, you owe back taxes',
    ];
    for (const input of inputs) {
      const result = analyzeScamRisk(input);
      expect(result.doNotDo.length).toBeGreaterThanOrEqual(1);
      expect(result.doNotDo.length).toBeLessThanOrEqual(3);
    }
  });

  // -------------------------------------------------------------------------
  // safeResponseScript is always non-empty
  // -------------------------------------------------------------------------
  it('always returns a non-empty safeResponseScript', () => {
    const inputs = ['', 'buy a gift card', "Act now and don't tell anyone"];
    for (const input of inputs) {
      const result = analyzeScamRisk(input);
      expect(result.safeResponseScript.length).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // inputSummary is first 100 chars of input
  // -------------------------------------------------------------------------
  it('sets inputSummary to the first 100 characters of the input', () => {
    const longInput = 'a'.repeat(200);
    const result = analyzeScamRisk(longInput);
    expect(result.inputSummary).toBe('a'.repeat(100));
  });

  it('sets inputSummary to the full input when input is shorter than 100 chars', () => {
    const shortInput = 'hello world';
    const result = analyzeScamRisk(shortInput);
    expect(result.inputSummary).toBe('hello world');
  });

  // -------------------------------------------------------------------------
  // analyzedAt is a valid ISO timestamp
  // -------------------------------------------------------------------------
  it('sets analyzedAt to a valid ISO timestamp string', () => {
    const result = analyzeScamRisk('test');
    expect(() => new Date(result.analyzedAt)).not.toThrow();
    expect(new Date(result.analyzedAt).toISOString()).toBe(result.analyzedAt);
  });
});
