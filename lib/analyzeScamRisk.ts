/**
 * Scam risk analysis engine — v2 (tightened detection).
 *
 * Philosophy: err on the side of caution. If someone is asking this app
 * whether something is a scam, they already feel uneasy. We should validate
 * that instinct rather than dismiss it.
 *
 * Scoring approach:
 *  1. Each rule has an explicit weight (no undefined defaults)
 *  2. Any impersonation of an authority = automatic "Be Careful" minimum
 *  3. Any request for money/credentials = automatic "Be Careful" minimum
 *  4. Lowered thresholds: ≥4 High Risk, ≥1 Be Careful
 *  5. Broader pattern matching with natural language variants
 *  6. Sentiment signals: threats, fear, flattery, isolation
 *  7. Single-flag escalation: some flags alone are enough for High Risk
 */

import type { AnalysisResult, RedFlag, RiskLevel, ScamType } from '../types';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type RedFlagRule = {
  flag: RedFlag;
  weight: number;
  patterns: RegExp[];
};

// ---------------------------------------------------------------------------
// Rule definitions — comprehensive pattern matching
// ---------------------------------------------------------------------------

export const RED_FLAG_RULES: RedFlagRule[] = [
  // ── CRITICAL: These alone can indicate a scam ─────────────────────────────
  {
    flag: 'gift_card',
    weight: 4,
    patterns: [
      /gift\s*card/i,
      /itunes\s*card/i,
      /google\s*play\s*card/i,
      /amazon\s*gift/i,
      /buy\s*(me\s+)?a?\s*card/i,
      /prepaid\s*card/i,
      /steam\s*card/i,
      /target\s*gift/i,
      /walmart\s*gift/i,
      /ebay\s*gift/i,
      /scratch.*card.*number/i,
      /read.*card.*number/i,
      /card.*code/i,
    ],
  },
  {
    flag: 'remote_access_request',
    weight: 4,
    patterns: [
      /remote\s*access/i,
      /remote.*desktop/i,
      /teamviewer/i,
      /anydesk/i,
      /logmein/i,
      /screen.*shar/i,
      /shar.*screen/i,
      /take\s*control.*computer/i,
      /access.*computer/i,
      /install.*software/i,
      /download.*program/i,
      /allow.*access/i,
      /let\s*me\s*(in|access|connect)/i,
      /connect\s*to\s*your/i,
      /remote.*connect/i,
    ],
  },

  // ── HIGH: Money and credential requests ───────────────────────────────────
  {
    flag: 'money_transfer',
    weight: 3,
    patterns: [
      /wire\s*transfer/i,
      /send\s*(me\s+)?money/i,
      /transfer\s*funds/i,
      /bank\s*transfer/i,
      /western\s*union/i,
      /money\s*gram/i,
      /moneygram/i,
      /\bzelle\b/i,
      /\bvenmo\b/i,
      /cash\s*app/i,
      /cashapp/i,
      /cryptocurrency/i,
      /\bbitcoin\b/i,
      /\bcrypto\b/i,
      /send.*funds/i,
      /transfer.*account/i,
      /need.*money/i,
      /send.*\$\d/i,
      /\$\d+.*send/i,
      /pay\s*(me\s+)?now/i,
      /payment.*required/i,
      /owe.*money/i,
      /money.*owe/i,
      /pay\s*(a\s+)?fine/i,
      /pay\s*(a\s+)?fee/i,
      /pay\s*(a\s+)?penalty/i,
      /deposit.*money/i,
      /\bpay\s+up\b/i,
      /settle.*payment/i,
      /outstanding.*balance/i,
      /overdue.*payment/i,
    ],
  },
  {
    flag: 'otp_request',
    weight: 3,
    patterns: [
      /one.?time.?password/i,
      /\botp\b/i,
      /verification\s*code/i,
      /security\s*code/i,
      /confirm.*code/i,
      /code.*sent\s*to/i,
      /text.*code/i,
      /sms.*code/i,
      /6.?digit\s*code/i,
      /authentication\s*code/i,
      /pin.*sent/i,
      /read\s*(me\s+)?the\s*code/i,
      /what('s|\s+is)\s*the\s*code/i,
      /give\s*me\s*the\s*code/i,
      /tell\s*me\s*the\s*code/i,
      /code\s*(I|we)\s*sent/i,
    ],
  },
  {
    flag: 'password_request',
    weight: 3,
    patterns: [
      /your\s*password/i,
      /enter.*password/i,
      /provide.*password/i,
      /share.*password/i,
      /give.*password/i,
      /account.*password/i,
      /login.*credentials/i,
      /username.*password/i,
      /sign.?in.*details/i,
      /what('s|\s+is)\s*your\s*password/i,
      /tell\s*me\s*your\s*password/i,
      /need\s*your\s*password/i,
      /confirm\s*your\s*password/i,
    ],
  },
  {
    flag: 'ssn_medicare_request',
    weight: 3,
    patterns: [
      /social\s*security/i,
      /\bssn\b/i,
      /medicare\s*number/i,
      /medicaid\s*number/i,
      /social\s*security\s*number/i,
      /your.*medicare/i,
      /insurance.*number/i,
      /beneficiary.*number/i,
      /member.*id/i,
      /last\s*four\s*(digits|numbers)/i,
      /date\s*of\s*birth/i,
      /mother'?s?\s*maiden/i,
      /verify\s*your\s*identity/i,
      /confirm\s*your\s*identity/i,
    ],
  },

  // ── MEDIUM-HIGH: Impersonation ────────────────────────────────────────────
  {
    flag: 'impersonation_bank',
    weight: 2.5,
    patterns: [
      /\bbank\b/i,
      /fraud\s*department/i,
      /suspicious.*transaction/i,
      /unauthorized.*transaction/i,
      /account.*compromised/i,
      /bank.*security/i,
      /financial\s*institution/i,
      /chase/i,
      /bank\s*of\s*america/i,
      /wells\s*fargo/i,
      /citibank/i,
      /capital\s*one/i,
      /credit\s*union/i,
      /account.*number/i,
      /routing.*number/i,
      /debit\s*card/i,
      /credit\s*card.*compromised/i,
      /suspicious\s*activity/i,
      /frozen.*account/i,
      /account.*frozen/i,
      /account.*locked/i,
      /locked.*account/i,
      /account.*suspended/i,
    ],
  },
  {
    flag: 'impersonation_amazon',
    weight: 2.5,
    patterns: [
      /amazon/i,
      /\busps\b/i,
      /\bfedex\b/i,
      /\bups\b.*delivery/i,
      /\bups\b.*package/i,
      /united\s*parcel/i,
      /postal\s*service/i,
      /package.*delivered/i,
      /delivery.*failed/i,
      /undelivered.*package/i,
      /order.*flagged/i,
      /flagged.*order/i,
      /order.*suspicious/i,
      /unauthorized.*purchase/i,
      /unauthorized.*order/i,
      /prime.*membership/i,
      /prime.*renewal/i,
      /refund.*order/i,
      /tracking\s*(number|info|update)/i,
      /delivery\s*(attempt|notice|update|fee)/i,
      /package\s*(held|waiting|pending|returned)/i,
      /reschedule\s*delivery/i,
      /shipping\s*(fee|charge|label|update)/i,
      /customs\s*(fee|charge|clearance)/i,
      /click\s*(here|link|below)\s*to\s*(track|confirm|verify|schedule|update)/i,
    ],
  },
  {
    flag: 'impersonation_medicare',
    weight: 2.5,
    patterns: [
      /medicare/i,
      /medicaid/i,
      /health\s*insurance.*representative/i,
      /new.*medicare\s*card/i,
      /medicare.*benefit/i,
      /medicare.*update/i,
      /medicare.*expir/i,
      /medicare.*renew/i,
      /eligible.*benefit/i,
      /health.*benefit/i,
    ],
  },
  {
    flag: 'impersonation_irs',
    weight: 2.5,
    patterns: [
      /\birs\b/i,
      /internal\s*revenue/i,
      /tax.*owed/i,
      /owe.*tax/i,
      /back\s*taxes/i,
      /tax.*debt/i,
      /tax.*warrant/i,
      /tax.*arrest/i,
      /tax.*penalty/i,
      /tax.*refund/i,
      /federal.*tax/i,
      /tax.*lien/i,
      /tax.*audit/i,
      /tax.*fraud/i,
      /\btaxes\b.*\bpay\b/i,
      /\bpay\b.*\btaxes\b/i,
      /arrested.*tax/i,
      /jail.*tax/i,
    ],
  },
  {
    flag: 'impersonation_government',
    weight: 2.5,
    patterns: [
      /social\s*security\s*administration/i,
      /\bssa\b/i,
      /government.*agency/i,
      /federal.*agent/i,
      /department\s*of.*justice/i,
      /\bdoj\b/i,
      /homeland\s*security/i,
      /\bdhs\b/i,
      /\bfbi\b/i,
      /\bdea\b/i,
      /government.*official/i,
      /federal.*bureau/i,
      /\bmarshals?\b/i,
      /court\s*order/i,
      /legal\s*action/i,
      /lawsuit/i,
      /subpoena/i,
    ],
  },
  {
    flag: 'impersonation_family',
    weight: 2.5,
    patterns: [
      /it'?s\s*your\s*(son|daughter|grandson|granddaughter|grandchild|child|nephew|niece|brother|sister)/i,
      /your\s*(son|daughter|grandson|granddaughter|grandchild|child|nephew|niece).*(arrested|accident|hospital|trouble|jail|hurt|emergency)/i,
      /grandm[ao]/i,
      /grandp[ao]/i,
      /it'?s\s*me/i,
      /family.*emergency/i,
      /relative.*arrested/i,
      /family\s*member.*(arrested|accident|hospital|trouble|jail|hurt)/i,
      /loved\s*one.*(arrested|accident|hospital|trouble|jail|hurt)/i,
      /bail\s*money/i,
      /in\s*jail/i,
      /been\s*arrested/i,
      /in\s*the\s*hospital/i,
      /had\s*an\s*accident/i,
    ],
  },
  {
    flag: 'impersonation_police',
    weight: 2.5,
    patterns: [
      /police/i,
      /officer/i,
      /detective/i,
      /sheriff/i,
      /law\s*enforcement/i,
      /warrant.*arrest/i,
      /arrest.*warrant/i,
      /under\s*investigation/i,
      /criminal.*charge/i,
      /felony/i,
      /misdemeanor/i,
    ],
  },

  // ── MEDIUM: Psychological manipulation ────────────────────────────────────
  {
    flag: 'urgency',
    weight: 2,
    patterns: [
      /act\s*now/i,
      /immediately/i,
      /\burgent(ly)?\b/i,
      /right\s*away/i,
      /limited\s*time/i,
      /expires?\s*today/i,
      /within\s*\d+\s*(hours?|minutes?)/i,
      /don'?t\s*wait/i,
      /do\s*not\s*wait/i,
      /time\s*is\s*running\s*out/i,
      /last\s*chance/i,
      /\bdeadline\b/i,
      /as\s*soon\s*as\s*possible/i,
      /\basap\b/i,
      /right\s*now/i,
      /today\s*only/i,
      /must.*today/i,
      /need.*now/i,
      /\bhurry\b/i,
      /no\s*time/i,
      /running\s*out/i,
      /before\s*it'?s?\s*too\s*late/i,
      /don'?t\s*delay/i,
      /time\s*sensitive/i,
      /expir(e|es|ing)/i,
      /suspend/i,
      /cancel/i,
      /shut\s*down/i,
      /close\s*your\s*account/i,
      /will\s*be\s*(arrested|prosecuted|charged)/i,
      /going\s*to\s*(arrest|prosecute|charge)/i,
      /if\s*you\s*don'?t/i,
      /unless\s*you/i,
      /or\s*else/i,
      /consequences/i,
    ],
  },
  {
    flag: 'secrecy',
    weight: 2,
    patterns: [
      /don'?t\s*tell/i,
      /keep\s*(this|it)\s*secret/i,
      /don'?t\s*mention/i,
      /between\s*us/i,
      /no\s*one\s*else/i,
      /keep\s*it\s*between/i,
      /don'?t\s*share/i,
      /don'?t\s*let\s*anyone\s*know/i,
      /keep\s*quiet/i,
      /\bconfidential\b/i,
      /don'?t\s*discuss/i,
      /don'?t\s*talk\s*to/i,
      /don'?t\s*contact/i,
      /only\s*talk\s*to\s*me/i,
      /just\s*between/i,
      /don'?t\s*hang\s*up/i,
      /stay\s*on\s*the\s*(line|phone)/i,
      /don'?t\s*call\s*(anyone|the\s*police|your\s*bank)/i,
    ],
  },

  // ── MEDIUM-HIGH: Tech support, lottery, romance, delivery ─────────────────
  {
    flag: 'impersonation_tech_support',
    weight: 3,
    patterns: [
      /tech\s*support/i,
      /technical\s*support/i,
      /microsoft\s*(support|technician|engineer)/i,
      /apple\s*(support|technician|engineer)/i,
      /your\s*computer\s*(has|is|was)\s*(a\s*)?(virus|infected|hacked|compromised)/i,
      /virus\s*(on|in)\s*your/i,
      /malware\s*(on|in)\s*your/i,
      /hacker.*(your|access)/i,
      /your.*(device|computer|laptop|phone)\s*(has been|is|was)\s*(hacked|compromised)/i,
      /geek\s*squad/i,
      /norton\s*(support|renewal|subscription)/i,
      /mcafee\s*(support|renewal|subscription)/i,
      /antivirus\s*(renewal|expir|subscription)/i,
      /windows\s*(defender|security)\s*(alert|warning)/i,
      /pop.?up.*(warning|alert|virus)/i,
      /call\s*this\s*number.*(fix|remove|clean)/i,
      /refund.*(tech|support|subscription|norton|mcafee|geek)/i,
    ],
  },
  {
    flag: 'lottery_prize_scam',
    weight: 3,
    patterns: [
      /you('ve|\s+have)\s*(won|been\s*selected)/i,
      /congratulations.*win/i,
      /winner.*prize/i,
      /prize.*winner/i,
      /lottery/i,
      /sweepstakes/i,
      /jackpot/i,
      /claim\s*(your|the)\s*(prize|reward|winnings|money)/i,
      /free\s*(gift|prize|reward|vacation|trip|cruise|iphone|ipad|macbook)/i,
      /selected\s*(for|as)\s*(a\s*)?(winner|recipient|prize)/i,
      /\$\d+[,.]?\d*\s*(prize|reward|winnings|cash)/i,
      /million\s*dollar/i,
      /cash\s*prize/i,
      /reward\s*program/i,
      /exclusive\s*offer/i,
      /special\s*promotion/i,
      /you\s*qualify/i,
      /pre.?approved/i,
      /guaranteed\s*(approval|win|prize)/i,
    ],
  },
  {
    flag: 'romance_scam',
    weight: 3,
    patterns: [
      /send\s*money.*love/i,
      /love.*send\s*money/i,
      /need\s*money.*(visit|come\s*see|travel|flight|ticket)/i,
      /stuck\s*(in|at)\s*(a\s*)?(country|airport|hospital|overseas)/i,
      /military.*(deployed|overseas|stationed).*money/i,
      /inheritance.*(claim|release|transfer).*fee/i,
      /customs\s*(fee|charge|duty)/i,
      /can'?t\s*access\s*(my|the)\s*(money|funds|account)/i,
      /oil\s*rig/i,
      /deployed\s*overseas/i,
      /send.*western\s*union.*love/i,
      /met\s*(online|on\s*a\s*dating)/i,
      /never\s*met\s*(in\s*person|face\s*to\s*face)/i,
    ],
  },
];

// ---------------------------------------------------------------------------
// Co-occurrence bonuses — amplify risk when multiple signals combine
// ---------------------------------------------------------------------------

type FlagPair = [RedFlag, RedFlag];

const CO_OCCURRENCE_BONUSES: Array<{ pair: FlagPair; bonus: number }> = [
  { pair: ['urgency', 'gift_card'], bonus: 3 },
  { pair: ['urgency', 'money_transfer'], bonus: 3 },
  { pair: ['urgency', 'otp_request'], bonus: 3 },
  { pair: ['urgency', 'secrecy'], bonus: 3 },
  { pair: ['urgency', 'password_request'], bonus: 3 },
  { pair: ['secrecy', 'money_transfer'], bonus: 3 },
  { pair: ['secrecy', 'gift_card'], bonus: 3 },
  { pair: ['impersonation_bank', 'otp_request'], bonus: 3 },
  { pair: ['impersonation_bank', 'urgency'], bonus: 2 },
  { pair: ['impersonation_bank', 'money_transfer'], bonus: 3 },
  { pair: ['impersonation_bank', 'password_request'], bonus: 3 },
  { pair: ['impersonation_irs', 'urgency'], bonus: 3 },
  { pair: ['impersonation_irs', 'money_transfer'], bonus: 3 },
  { pair: ['impersonation_government', 'urgency'], bonus: 3 },
  { pair: ['impersonation_government', 'money_transfer'], bonus: 3 },
  { pair: ['impersonation_family', 'money_transfer'], bonus: 4 },
  { pair: ['impersonation_family', 'gift_card'], bonus: 4 },
  { pair: ['impersonation_family', 'urgency'], bonus: 3 },
  { pair: ['impersonation_family', 'secrecy'], bonus: 4 },
  { pair: ['remote_access_request', 'impersonation_bank'], bonus: 3 },
  { pair: ['remote_access_request', 'impersonation_amazon'], bonus: 3 },
  { pair: ['remote_access_request', 'urgency'], bonus: 3 },
  { pair: ['impersonation_amazon', 'urgency'], bonus: 2 },
  { pair: ['impersonation_amazon', 'money_transfer'], bonus: 3 },
  { pair: ['impersonation_medicare', 'ssn_medicare_request'], bonus: 4 },
  { pair: ['impersonation_police', 'money_transfer'], bonus: 4 },
  { pair: ['impersonation_police', 'urgency'], bonus: 3 },
  { pair: ['impersonation_tech_support', 'remote_access_request'], bonus: 4 },
  { pair: ['impersonation_tech_support', 'money_transfer'], bonus: 4 },
  { pair: ['impersonation_tech_support', 'urgency'], bonus: 3 },
  { pair: ['impersonation_tech_support', 'gift_card'], bonus: 4 },
  { pair: ['lottery_prize_scam', 'money_transfer'], bonus: 4 },
  { pair: ['lottery_prize_scam', 'urgency'], bonus: 3 },
  { pair: ['romance_scam', 'money_transfer'], bonus: 4 },
  { pair: ['romance_scam', 'secrecy'], bonus: 4 },
  { pair: ['romance_scam', 'urgency'], bonus: 3 },
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
// ScamType detection
// ---------------------------------------------------------------------------

const IMPERSONATION_TO_SCAM_TYPE: Partial<Record<RedFlag, ScamType>> = {
  impersonation_bank: 'bank_impersonation',
  impersonation_amazon: 'amazon_delivery',
  impersonation_medicare: 'medicare_government',
  impersonation_irs: 'irs_tax',
  impersonation_government: 'medicare_government',
  impersonation_family: 'grandparent_scam',
  impersonation_police: 'bank_impersonation',
  impersonation_tech_support: 'tech_support',
  lottery_prize_scam: 'lottery_prize',
  romance_scam: 'romance_scam',
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

  if (flags.length > 0) {
    items.push('Hang up or stop responding right now');
  }

  if (flags.includes('urgency')) {
    items.push('Take a breath — real emergencies allow time to verify');
  }

  if (flags.includes('gift_card')) {
    items.push('Do NOT buy any gift cards — no real company asks for these');
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
    items.push('Do NOT allow anyone to access your computer remotely');
  }

  if (flags.includes('money_transfer')) {
    items.push('Do NOT send any money or transfer any funds');
  }

  if (flags.length === 0) {
    items.push('You can continue, but stay alert');
    items.push('Never share personal information or passwords');
    items.push('If anything feels off, trust your instincts and hang up');
  } else if (items.length < 4) {
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
// Flags that are so dangerous they alone warrant High Risk
// ---------------------------------------------------------------------------

const AUTO_HIGH_RISK_FLAGS: RedFlag[] = [
  'gift_card',
  'remote_access_request',
  'money_transfer',
  'otp_request',
  'password_request',
  'ssn_medicare_request',
  'impersonation_tech_support',
  'lottery_prize_scam',
  'romance_scam',
];

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

  // Deduplicate flags
  const uniqueFlags: RedFlag[] = [...new Set(detectedFlags)];

  // ── Risk level determination ──────────────────────────────────────────────
  // Tightened thresholds: ≥4 High Risk, ≥1 Be Careful
  let riskLevel: RiskLevel;

  // Auto-escalate: certain flags alone are enough for High Risk
  const hasAutoHighRisk = uniqueFlags.some((f) => AUTO_HIGH_RISK_FLAGS.includes(f));

  if (weightedScore >= 3 || hasAutoHighRisk || uniqueFlags.length >= 2) {
    riskLevel = 'High Risk';
  } else if (uniqueFlags.length > 0) {
    // ANY single detected flag = at least "Be Careful"
    riskLevel = 'Be Careful';
  } else {
    riskLevel = 'Probably Safe';
  }

  const caregiverRecommended = riskLevel === 'High Risk';
  const scamType = detectScamType(uniqueFlags);
  const doNow = buildDoNow(uniqueFlags);
  const doNotDo = buildDoNotDo(uniqueFlags);
  const safeResponseScript = buildSafeResponseScript(uniqueFlags);
  const suggestions = buildSuggestions(uniqueFlags, riskLevel);
  const verificationQuestions = buildVerificationQuestions(uniqueFlags);

  return {
    riskLevel,
    scamType,
    redFlags: uniqueFlags,
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
