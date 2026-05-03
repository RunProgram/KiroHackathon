import { analyzeScamRisk, buildSuggestions, buildVerificationQuestions, buildSafeResponseScript } from '../../lib/analyzeScamRisk';

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
  // inputSummary uses generateSubjectLine (smart subject lines)
  // -------------------------------------------------------------------------
  it('sets inputSummary to a cleaned phrase for a long input with no scam signals', () => {
    const longInput = 'a'.repeat(200);
    const result = analyzeScamRisk(longInput);
    // No scam signals → falls back to extractCleanPhrase, which truncates at 100 chars + ellipsis
    expect(result.inputSummary).toBe('a'.repeat(100) + '...');
  });

  it('sets inputSummary to the cleaned phrase for short input with no scam signals', () => {
    const shortInput = 'hello world';
    const result = analyzeScamRisk(shortInput);
    // No scam signals, short text → extractCleanPhrase returns the text as-is
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

  // -------------------------------------------------------------------------
  // Grandparent scam scenario — end-to-end field validation
  // Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 3.1, 6.3, 7.1
  // -------------------------------------------------------------------------
  it('grandparent scam scenario: all expected fields populated correctly', () => {
    const input = "Grandma, it's me, your grandson. I've been arrested and need you to buy gift cards urgently. Don't tell mom.";
    const result = analyzeScamRisk(input);
    expect(result.scamType).toBe('grandparent_scam');
    expect(result.riskLevel).toBe('High Risk');
    expect(result.redFlags).toContain('impersonation_family');
    expect(result.redFlags).toContain('gift_card');
    expect(result.redFlags).toContain('urgency');
    expect(result.redFlags).toContain('secrecy');
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
    expect(result.verificationQuestions.length).toBe(4);
    expect(result.safeResponseScript.toLowerCase()).toContain("you say it's urgent");
  });
});

// ---------------------------------------------------------------------------
// Unit tests for buildSuggestions
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
// ---------------------------------------------------------------------------

describe('buildSuggestions — unit tests', () => {
  // -------------------------------------------------------------------------
  // Per-flag suggestion tests
  // -------------------------------------------------------------------------

  it('impersonation_family → suggestion contains "number saved in your phone"', () => {
    const suggestions = buildSuggestions(['impersonation_family'], 'Be Careful');
    expect(suggestions.some((s) => s.includes('number saved in your phone'))).toBe(true);
  });

  it('gift_card → suggestion contains gift card / no legitimate organization language', () => {
    const suggestions = buildSuggestions(['gift_card'], 'Be Careful');
    expect(
      suggestions.some(
        (s) => s.toLowerCase().includes('no legitimate organization') || s.toLowerCase().includes('gift card')
      )
    ).toBe(true);
  });

  it('urgency → suggestion contains "urgency on purpose" / urgency tactic language', () => {
    const suggestions = buildSuggestions(['urgency'], 'Be Careful');
    expect(suggestions.some((s) => s.includes('urgency on purpose'))).toBe(true);
  });

  it('remote_access_request → suggestion contains "do not install any software"', () => {
    const suggestions = buildSuggestions(['remote_access_request'], 'Be Careful');
    expect(suggestions.some((s) => s.toLowerCase().includes('do not install any software'))).toBe(true);
  });

  it('otp_request → suggestion contains "one-time code"', () => {
    const suggestions = buildSuggestions(['otp_request'], 'Be Careful');
    expect(suggestions.some((s) => s.toLowerCase().includes('one-time code'))).toBe(true);
  });

  it('password_request → suggestion contains "one-time code" (same suggestion as otp_request)', () => {
    const suggestions = buildSuggestions(['password_request'], 'Be Careful');
    expect(suggestions.some((s) => s.toLowerCase().includes('one-time code'))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Risk-level branch tests
  // -------------------------------------------------------------------------

  it('High Risk → trusted-contact suggestion present (contains "trusted contact")', () => {
    const suggestions = buildSuggestions([], 'High Risk');
    expect(suggestions.some((s) => s.toLowerCase().includes('trusted contact'))).toBe(true);
  });

  it('Probably Safe → reassurance suggestion present (contains "looks okay")', () => {
    const suggestions = buildSuggestions([], 'Probably Safe');
    expect(suggestions.some((s) => s.toLowerCase().includes('looks okay'))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Empty flags — minimum 2 suggestions
  // -------------------------------------------------------------------------

  it('empty flags → at least 2 suggestions returned', () => {
    // High Risk always adds the trusted-contact item plus the fallback item
    const suggestions = buildSuggestions([], 'High Risk');
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
  });

  it('empty flags with Probably Safe → at least 2 suggestions returned', () => {
    const suggestions = buildSuggestions([], 'Probably Safe');
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Unit tests for buildSafeResponseScript — enhanced impersonation_family branch
// Requirements: 6.1, 6.3
// ---------------------------------------------------------------------------

describe('buildSafeResponseScript — impersonation_family branch', () => {
  // -------------------------------------------------------------------------
  // Base case: impersonation_family without urgency
  // Requirement 6.1: script states user will call back on a known number and
  // does not commit to sending money or taking any action.
  // -------------------------------------------------------------------------
  it('impersonation_family alone: script contains "number I already have"', () => {
    const script = buildSafeResponseScript(['impersonation_family']);
    expect(script).toContain('number I already have');
  });

  it('impersonation_family alone: script does not commit to sending money', () => {
    const script = buildSafeResponseScript(['impersonation_family']);
    // The script should say it will NOT send money, not that it will
    expect(script.toLowerCase()).toContain('will not send any money');
  });

  it('impersonation_family alone: script states user will not take any action', () => {
    const script = buildSafeResponseScript(['impersonation_family']);
    expect(script.toLowerCase()).toContain('take any action');
  });

  // -------------------------------------------------------------------------
  // Urgency co-occurrence case: impersonation_family + urgency
  // Requirement 6.3: script acknowledges urgency claim without acting on it.
  // -------------------------------------------------------------------------
  it('impersonation_family + urgency: script acknowledges urgency claim', () => {
    const script = buildSafeResponseScript(['impersonation_family', 'urgency']);
    expect(script.toLowerCase()).toContain("you say it's urgent");
  });

  it('impersonation_family + urgency: script contains call-back language', () => {
    const script = buildSafeResponseScript(['impersonation_family', 'urgency']);
    expect(script).toContain('number I already have');
  });

  it('impersonation_family + urgency: script does not commit to sending money', () => {
    const script = buildSafeResponseScript(['impersonation_family', 'urgency']);
    expect(script.toLowerCase()).toContain('will not send any money');
  });

  // -------------------------------------------------------------------------
  // Verify the two branches return different scripts
  // -------------------------------------------------------------------------
  it('urgency co-occurrence returns a different script than the base case', () => {
    const baseScript = buildSafeResponseScript(['impersonation_family']);
    const urgencyScript = buildSafeResponseScript(['impersonation_family', 'urgency']);
    expect(baseScript).not.toBe(urgencyScript);
  });
});
