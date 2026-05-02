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
  id: string;
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
