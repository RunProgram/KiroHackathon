/**
 * Scam risk analysis engine.
 *
 * Uses a weighted, multi-signal approach:
 *  1. Pattern matching against known red-flag categories (with per-flag weights)
 *  2. Co-occurrence bonuses when high-signal flag pairs appear together
 *  3. Confidence scoring based on match density relative to text length
 *  4. Scam-type classification from the dominant impersonation signal
 *
 * Risk thresholds (weighted score):
 *   ≥ 6  → High Risk
 *   ≥ 2  → Be Careful
 *   < 2  → Probably Safe
 */

import type { AnalysisResult, RedFlag, RiskLevel, ScamType } from '../types';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type RedFlagRule = {
  flag: RedFlag;
  /** How much this flag contributes to the risk score (1 = baseline). */
  weight: number;
  patterns: RegExp[];
};

// ---------------------------------------------------------------------------
// Rule definitions — ordered roughly by severity
// ---------------------------------------------------------------------------

export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    flag: 'urgency',
    patterns: [
      /act now/i,
      /immediately/i,
      /\burgent\b/i,
      /right away/i,
      /limited time/i,
      /expires today/i,
      /within 24 hours/i,
      /don't wait/i,
      /do not wait/i,
      /time is running out/i,
      /last chance/i,
      /deadline/i,
      /as soon as possible/i,
      /\basap\b/i,
      // Natural language additions
      /right now/i,
      /today only/i,
      /must.*today/i,
      /need.*now/i,
      /hurry/i,
      /quick(ly)?/i,
      /fast/i,
      /no time/i,
      /running out/i,
    ],
  },
  {
    flag: 'secrecy',
    patterns: [
      /don'?t tell/i,
      /keep this secret/i,
      /don'?t mention/i,
      /between us/i,
      /no one else/i,
      /keep it between/i,
      /don'?t share/i,
      /don'?t let anyone know/i,
      /keep quiet/i,
      /confidential/i,
      /don'?t discuss/i,
      /don'?t talk to/i,
      /don'?t contact/i,
      /only talk to me/i,
      /just between/i,
    ],
  },
  {
    flag: 'money_transfer',
    patterns: [
      /wire transfer/i,
      /send money/i,
      /transfer funds/i,
      /bank transfer/i,
      /western union/i,
      /money gram/i,
      /moneygram/i,
      /zelle/i,
      /venmo/i,
      /cash app/i,
      /cashapp/i,
      /cryptocurrency/i,
      /bitcoin/i,
      /crypto/i,
      /send.*funds/i,
      /transfer.*account/i,
      // Natural language additions
      /need.*money/i,
      /send.*\$\d/i,
      /\$\d+.*send/i,
      /pay.*now/i,
      /payment.*required/i,
      /owe.*money/i,
      /money.*owe/i,
    ],
  },
  {
    flag: 'gift_card',
    weight: 3,
    patterns: [
      /gift card/i,
      /itunes card/i,
      /google play card/i,
      /amazon gift/i,
      /buy.*card/i,
      /prepaid card/i,
      /steam card/i,
      /target gift/i,
      /walmart gift/i,
      /ebay gift/i,
      /scratch.*card/i,
    ],
  },
  {
    flag: 'money_transfer',
    weight: 3,
    patterns: [
      /wire transfer/i,
      /send money/i,
      /transfer funds/i,
      /bank transfer/i,
      /western union/i,
      /money ?gram/i,
      /\bzelle\b/i,
      /\bvenmo\b/i,
      /cash ?app/i,
      /cryptocurrency/i,
      /\bbitcoin\b/i,
      /\bcrypto\b/i,
      /send.*funds/i,
      /transfer.*account/i,
    ],
  },
  {
    flag: 'remote_access_request',
    weight: 3,
    patterns: [
      /remote access/i,
      /remote.*desktop/i,
      /teamviewer/i,
      /anydesk/i,
      /logmein/i,
      /screen.*shar/i,
      /shar.*screen/i,
      /take control.*computer/i,
      /access.*computer/i,
      /install.*software/i,
      /download.*program/i,
      /allow.*access/i,
    ],
  },

  // ── Medium-high: credential harvesting ───────────────────────────────────
  {
    flag: 'otp_request',
    weight: 2.5,
    patterns: [
      /one.?time.?password/i,
      /\botp\b/i,
      /verification code/i,
      /security code/i,
      /confirm.*code/i,
      /code.*sent to/i,
      /text.*code/i,
      /sms.*code/i,
      /6.?digit code/i,
      /authentication code/i,
      /pin.*sent/i,
    ],
  },
  {
    flag: 'password_request',
    weight: 2.5,
    patterns: [
      /your password/i,
      /enter.*password/i,
      /provide.*password/i,
      /share.*password/i,
      /give.*password/i,
      /account.*password/i,
      /login.*credentials/i,
      /username.*password/i,
      /sign.?in.*details/i,
    ],
  },
  {
    flag: 'ssn_medicare_request',
    weight: 2.5,
    patterns: [
      /social security/i,
      /\bssn\b/i,
      /medicare number/i,
      /medicaid number/i,
      /social security number/i,
      /your.*medicare/i,
      /insurance.*number/i,
      /beneficiary.*number/i,
      /member.*id/i,
    ],
  },

  // ── Medium: impersonation ─────────────────────────────────────────────────
  {
    flag: 'impersonation_bank',
    weight: 2,
    patterns: [
      /\bbank\b.*calling/i,
      /calling.*\bbank\b/i,
      /fraud.*department/i,
      /bank.*fraud/i,
      /your.*bank.*account/i,
      /suspicious.*transaction/i,
      /unauthorized.*transaction/i,
      /account.*compromised/i,
      /bank.*security/i,
      /financial.*institution/i,
      /chase bank/i,
      /bank of america/i,
      /wells fargo/i,
      /citibank/i,
      /i'?m.*with.*bank/i,
      /i'?m.*from.*bank/i,
      /this is.*bank/i,
      /calling from.*bank/i,
      /\bbank\b.*need/i,
      /need.*\bbank\b/i,
      /\bbank\b.*want/i,
      /from.*\bbank\b/i,
      /\bbank\b.*call/i,
      /\bbank\b.*account/i,
      /account.*number/i,
      /routing.*number/i,
    ],
  },
  {
    flag: 'impersonation_amazon',
    weight: 2,
    patterns: [
      /amazon.*order/i,
      /order.*amazon/i,
      /amazon.*delivery/i,
      /amazon.*package/i,
      /amazon.*account/i,
      /amazon.*prime/i,
      /amazon.*customer service/i,
      /amazon.*refund/i,
      /package.*delivered/i,
      /delivery.*failed/i,
      /undelivered.*package/i,
      // Natural language — "I'm from Amazon", "I'm with Amazon", "This is Amazon"
      /i'?m.*with amazon/i,
      /i'?m.*from amazon/i,
      /this is amazon/i,
      /calling from amazon/i,
      /amazon.*calling/i,
      /sophia.*amazon/i,
      /amazon.*representative/i,
      /amazon.*support/i,
      /amazon.*team/i,
      /amazon.*department/i,
    ],
  },
  {
    flag: 'impersonation_medicare',
    weight: 2,
    patterns: [
      /medicare.*calling/i,
      /calling.*medicare/i,
      /medicare.*card/i,
      /new.*medicare/i,
      /medicare.*benefit/i,
      /medicare.*representative/i,
      /medicare.*update/i,
      /medicaid.*calling/i,
      /health.*insurance.*representative/i,
      /i'?m.*with.*medicare/i,
      /i'?m.*from.*medicare/i,
      /this is.*medicare/i,
    ],
  },
  {
    flag: 'impersonation_irs',
    weight: 2,
    patterns: [
      /\birs\b/i,
      /internal revenue/i,
      /tax.*owed/i,
      /owe.*taxes/i,
      /back taxes/i,
      /tax.*debt/i,
      /tax.*warrant/i,
      /tax.*arrest/i,
      /tax.*penalty/i,
      /tax.*refund/i,
      /federal.*tax/i,
      /i'?m.*with.*irs/i,
      /i'?m.*from.*irs/i,
      /this is.*irs/i,
      /calling from.*irs/i,
    ],
  },
  {
    flag: 'impersonation_government',
    weight: 2,
    patterns: [
      /social security administration/i,
      /\bssa\b.*calling/i,
      /government.*agency/i,
      /federal.*agent/i,
      /department of.*justice/i,
      /\bdoj\b/i,
      /homeland security/i,
      /\bdhs\b/i,
      /fbi.*calling/i,
      /calling.*fbi/i,
      /government.*official/i,
      /federal.*bureau/i,
      /i'?m.*with.*government/i,
      /i'?m.*from.*government/i,
      /i'?m.*with.*federal/i,
      /i'?m.*from.*federal/i,
      /i'?m.*with.*social security/i,
      /i'?m.*from.*social security/i,
    ],
  },
  {
    flag: 'impersonation_family',
    weight: 2,
    patterns: [
      /it'?s.*your (son|daughter|grandson|granddaughter|grandchild|child|nephew|niece)/i,
      /your (son|daughter|grandson|granddaughter|grandchild|child|nephew|niece).*(arrested|accident|hospital|trouble|jail)/i,
      /grandm[ao].*it'?s me/i,
      /grandp[ao].*it'?s me/i,
      /it'?s me.*grandm[ao]/i,
      /it'?s me.*grandp[ao]/i,
      /family.*emergency/i,
      /relative.*arrested/i,
    ],
  },
  {
    flag: 'impersonation_police',
    weight: 2,
    patterns: [
      /police.*calling/i,
      /calling.*police/i,
      /officer.*calling/i,
      /detective.*calling/i,
      /sheriff.*calling/i,
      /law enforcement/i,
      /warrant.*arrest/i,
      /arrest.*warrant/i,
      /police.*department/i,
      /local.*police/i,
    ],
  },

  // ── Lower-severity: psychological manipulation ────────────────────────────
  {
    flag: 'urgency',
    weight: 1.5,
    patterns: [
      /act now/i,
      /immediately/i,
      /\burgent(ly)?\b/i,
      /right away/i,
      /limited time/i,
      /expires today/i,
      /within 24 hours/i,
      /don'?t wait/i,
      /do not wait/i,
      /time is running out/i,
      /last chance/i,
      /\bdeadline\b/i,
      /as soon as possible/i,
      /\basap\b/i,
    ],
  },
  {
    flag: 'secrecy',
    weight: 1.5,
    patterns: [
      /don'?t tell/i,
      /keep this secret/i,
      /don'?t mention/i,
      /between us/i,
      /no one else/i,
      /keep it between/i,
      /don'?t share/i,
      /don'?t let anyone know/i,
      /keep quiet/i,
      /\bconfidential\b/i,
      /don'?t discuss/i,
    ],
  },
];

// ---------------------------------------------------------------------------
// Co-occurrence bonuses
// When two high-signal flags appear together the risk is multiplicatively worse.
// Each pair adds a bonus to the weighted score.
// ---------------------------------------------------------------------------

type FlagPair = [RedFlag, RedFlag];

const CO_OCCURRENCE_BONUSES: Array<{ pair: FlagPair; bonus: number }> = [
  { pair: ['urgency', 'gift_card'], bonus: 2 },
  { pair: ['urgency', 'money_transfer'], bonus: 2 },
  { pair: ['urgency', 'otp_request'], bonus: 2 },
  { pair: ['urgency', 'secrecy'], bonus: 3 },
  { pair: ['secrecy', 'money_transfer'], bonus: 2 },
  { pair: ['secrecy', 'gift_card'], bonus: 2 },
  { pair: ['impersonation_bank', 'otp_request'], bonus: 2 },
  { pair: ['impersonation_bank', 'urgency'], bonus: 1.5 },
  { pair: ['impersonation_irs', 'urgency'], bonus: 2 },
  { pair: ['impersonation_government', 'urgency'], bonus: 2 },
  { pair: ['impersonation_family', 'money_transfer'], bonus: 3 },
  { pair: ['impersonation_family', 'gift_card'], bonus: 3 },
  { pair: ['impersonation_family', 'urgency'], bonus: 3 },
  { pair: ['impersonation_family', 'secrecy'], bonus: 3 },
  { pair: ['remote_access_request', 'impersonation_bank'], bonus: 2 },
  { pair: ['remote_access_request', 'impersonation_amazon'], bonus: 2 },
];

function computeCoOccurrenceBonus(flags: RedFlag[]): number {
  const flagSet = new Set(flags);
  let bonus = 0;
  for (const { pair, bonus: b } of CO_OCCURRENCE_BONUSES) {
    if (flagSet.has(pair[0]) && flagSet.has(pair[1])) {
      bonus += b;
    }
  }
  return bonus;
}

// ---------------------------------------------------------------------------
// ScamType detection — first impersonation flag wins
// ---------------------------------------------------------------------------

const IMPERSONATION_TO_SCAM_TYPE: Partial<Record<RedFlag, ScamType>> = {
  impersonation_bank: 'bank_impersonation',
  impersonation_amazon: 'amazon_delivery',
  impersonation_medicare: 'medicare_government',
  impersonation_irs: 'irs_tax',
  impersonation_government: 'medicare_government',
  impersonation_family: 'grandparent_scam',
  impersonation_police: 'bank_impersonation',
};

function detectScamType(flags: RedFlag[]): ScamType {
  for (const flag of flags) {
    const mapped = IMPERSONATION_TO_SCAM_TYPE[flag];
    if (mapped !== undefined) return mapped;
  }
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Contextual advice builders
// ---------------------------------------------------------------------------

function buildDoNow(flags: RedFlag[]): string[] {
  const items: string[] = [];

  // Only recommend hanging up if there are actual red flags
  if (flags.length > 0) {
    items.push('Hang up or stop responding');
  }

  if (flags.includes('urgency')) {
    items.push('Take a breath — real emergencies allow time to verify');
  }

  if (flags.includes('gift_card')) {
    items.push('Do not buy any gift cards');
  }

  if (
    flags.includes('impersonation_family') ||
    flags.includes('impersonation_bank') ||
    flags.includes('impersonation_irs') ||
    flags.includes('impersonation_government') ||
    flags.includes('impersonation_medicare') ||
    flags.includes('impersonation_amazon') ||
    flags.includes('impersonation_police')
  ) {
    items.push('Call the real organization using a number from their official website');
  }

  if (flags.includes('remote_access_request')) {
    items.push('Do not allow anyone to access your computer remotely');
  }

  if (flags.includes('money_transfer')) {
    items.push('Do not send any money or transfer any funds');
  }

  if (flags.length === 0) {
    // Probably Safe — reassuring, cautious guidance
    items.push('You can continue, but stay alert');
    items.push('Never share personal information or passwords');
    items.push('If anything feels off, trust your instincts and hang up');
  } else if (items.length < 4) {
    // Still room — add trusted person advice
    items.push('Call a trusted family member or friend to talk it over');
  }

  return items.slice(0, 4);
}

function buildDoNotDo(flags: RedFlag[]): string[] {
  const items: string[] = [];

  items.push('Do not share personal information');

  if (flags.includes('gift_card')) {
    items.push('Do not give gift card numbers to anyone over the phone');
  }

  if (flags.includes('otp_request') || flags.includes('password_request')) {
    items.push('Do not share passwords, PINs, or verification codes');
  }

  if (flags.includes('ssn_medicare_request')) {
    items.push('Do not give out your Social Security or Medicare number');
  }

  if (flags.includes('remote_access_request')) {
    items.push('Do not let anyone install software on your device');
  }

  if (flags.includes('money_transfer')) {
    items.push('Do not wire money or send cryptocurrency');
  }

  if (flags.includes('secrecy')) {
    items.push('Do not keep this call secret from family');
  }

  return items.slice(0, 3);
}

export function buildSafeResponseScript(flags: RedFlag[]): string {
  if (flags.length === 0) {
    return 'I need to verify this. I will call you back on a number I find myself.';
  }

  if (flags.includes('impersonation_family')) {
    if (flags.includes('urgency')) {
      return "I understand you say it's urgent, but I need to verify who I'm speaking with first. I am going to hang up and call my family member directly on the number I already have. I will not send any money until I have confirmed this with them.";
    }
    return 'I need to hang up and call my family member directly on the number I already have for them. I will not send any money or take any action until I have spoken with them myself.';
  }

  if (flags.includes('impersonation_irs') || flags.includes('impersonation_government')) {
    return 'I do not discuss financial matters over the phone. If this is real, please send me something in writing. I will call the official number myself to verify.';
  }

  if (flags.includes('impersonation_bank')) {
    return 'I need to hang up and call my bank directly using the number on the back of my card. I will not share any account information over this call.';
  }

  if (flags.includes('gift_card') || flags.includes('money_transfer')) {
    return 'I do not send money or buy gift cards for people I cannot verify. I need to speak with a family member before doing anything.';
  }

  return 'I need to verify this. I will call you back on a number I find myself.';
}

// ---------------------------------------------------------------------------
// Suggestions builder
// ---------------------------------------------------------------------------

export function buildSuggestions(flags: RedFlag[], riskLevel: RiskLevel): string[] {
  const items: string[] = [];

  if (flags.includes('impersonation_family')) {
    items.push(
      'Call your family member back on the number saved in your phone — not the number that just called you.'
    );
  }

  if (flags.includes('gift_card')) {
    items.push(
      'No legitimate organization — not the government, not a bank, not a utility — ever asks for payment by gift card.'
    );
  }

  if (flags.includes('urgency')) {
    items.push(
      'Scammers create urgency on purpose to stop you from thinking clearly. It is always safe to take time to verify.'
    );
  }

  if (flags.includes('remote_access_request')) {
    items.push(
      'Close the call and do not install any software. Legitimate companies do not need remote access to your device.'
    );
  }

  if (flags.includes('otp_request') || flags.includes('password_request')) {
    items.push(
      'No legitimate company will ever ask for your password or a one-time code over the phone.'
    );
  }

  if (riskLevel === 'High Risk') {
    items.push('Before doing anything else, call your trusted contact and tell them what happened.');
  }

  if (riskLevel === 'Probably Safe') {
    items.push(
      'This looks okay, but it is always fine to hang up and call back on a number you find yourself.'
    );
  }

  // Fallback — always added to guarantee a minimum of 2 items
  items.push('If something feels wrong, trust that feeling. Hang up and talk to someone you trust.');

  return items.slice(0, 6);
}

// ---------------------------------------------------------------------------
// Verification questions builder
// ---------------------------------------------------------------------------

export function buildVerificationQuestions(flags: RedFlag[]): string[] {
  if (!flags.includes('impersonation_family')) {
    return [];
  }

  return [
    'What is the name of our family pet?',
    'What was the name of the street you grew up on?',
    "What is our family's special word that only we know?",
    'What did we do together last time we saw each other?',
  ];
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

export function analyzeScamRisk(inputText: string): AnalysisResult {
  const detectedFlags: RedFlag[] = [];
  let weightedScore = 0;

  if (inputText.length > 0) {
    for (const rule of RED_FLAG_RULES) {
      const matched = rule.patterns.some((pattern) => pattern.test(inputText));
      if (matched) {
        detectedFlags.push(rule.flag);
        weightedScore += rule.weight;
      }
    }

    // Apply co-occurrence bonuses
    weightedScore += computeCoOccurrenceBonus(detectedFlags);
  }

  // Risk level thresholds based on weighted score
  let riskLevel: RiskLevel;
  if (weightedScore >= 6) {
    riskLevel = 'High Risk';
  } else if (weightedScore >= 2) {
    riskLevel = 'Be Careful';
  } else {
    riskLevel = 'Probably Safe';
  }

  const caregiverRecommended = riskLevel === 'High Risk';
  const scamType = detectScamType(detectedFlags);
  const doNow = buildDoNow(detectedFlags);
  const doNotDo = buildDoNotDo(detectedFlags);
  const safeResponseScript = buildSafeResponseScript(detectedFlags);
  const suggestions = buildSuggestions(detectedFlags, riskLevel);
  const verificationQuestions = buildVerificationQuestions(detectedFlags);

  return {
    riskLevel,
    scamType,
    redFlags: detectedFlags,
    doNow,
    doNotDo,
    safeResponseScript,
    suggestions,
    verificationQuestions,
    caregiverRecommended,
    analyzedAt: new Date().toISOString(),
    inputSummary: inputText.slice(0, 100),
  };
}
