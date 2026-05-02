import type { AnalysisResult, RedFlag, RiskLevel, ScamType } from '../types';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type RedFlagRule = {
  flag: RedFlag;
  patterns: RegExp[];
};

// ---------------------------------------------------------------------------
// Rule definitions
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
    ],
  },
  {
    flag: 'gift_card',
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
      /card number/i,
      /scratch.*card/i,
    ],
  },
  {
    flag: 'otp_request',
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
  {
    flag: 'remote_access_request',
    patterns: [
      /remote access/i,
      /remote.*desktop/i,
      /teamviewer/i,
      /anydesk/i,
      /logmein/i,
      /screen.*share/i,
      /share.*screen/i,
      /take control.*computer/i,
      /access.*computer/i,
      /install.*software/i,
      /download.*program/i,
      /allow.*access/i,
    ],
  },
  {
    flag: 'impersonation_bank',
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
    ],
  },
  {
    flag: 'impersonation_amazon',
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
    ],
  },
  {
    flag: 'impersonation_medicare',
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
    ],
  },
  {
    flag: 'impersonation_irs',
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
    ],
  },
  {
    flag: 'impersonation_government',
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
    ],
  },
  {
    flag: 'impersonation_family',
    patterns: [
      /it'?s.*your (son|daughter|grandson|granddaughter|grandchild|child|nephew|niece)/i,
      /your (son|daughter|grandson|granddaughter|grandchild|child|nephew|niece).*arrested/i,
      /your (son|daughter|grandson|granddaughter|grandchild|child|nephew|niece).*accident/i,
      /your (son|daughter|grandson|granddaughter|grandchild|child|nephew|niece).*hospital/i,
      /your (son|daughter|grandson|granddaughter|grandchild|child|nephew|niece).*trouble/i,
      /your (son|daughter|grandson|granddaughter|grandchild|child|nephew|niece).*jail/i,
      /grandma.*it'?s me/i,
      /grandpa.*it'?s me/i,
      /it'?s me.*grandma/i,
      /it'?s me.*grandpa/i,
      /family.*emergency/i,
      /relative.*arrested/i,
    ],
  },
  {
    flag: 'impersonation_police',
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
];

// ---------------------------------------------------------------------------
// ScamType detection from impersonation flags
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
    if (mapped !== undefined) {
      return mapped;
    }
  }
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Contextual advice builders
// ---------------------------------------------------------------------------

function buildDoNow(flags: RedFlag[]): string[] {
  const items: string[] = [];

  // Always first
  items.push('Hang up or stop responding');

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

  // Always include "call a trusted person" if we have room and haven't hit 4 yet
  if (items.length < 4) {
    items.push('Call a trusted family member or friend to talk it over');
  }

  // Enforce 2–4 items
  return items.slice(0, 4);
}

function buildDoNotDo(flags: RedFlag[]): string[] {
  const items: string[] = [];

  // Always include this
  items.push('Do not share personal information');

  if (flags.includes('gift_card')) {
    items.push('Do not give gift card numbers to anyone over the phone');
  }

  if (
    flags.includes('otp_request') ||
    flags.includes('password_request')
  ) {
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

  // Enforce 1–3 items
  return items.slice(0, 3);
}

function buildSafeResponseScript(flags: RedFlag[]): string {
  if (flags.length === 0) {
    return 'I need to verify this. I will call you back on a number I find myself.';
  }

  if (flags.includes('impersonation_family')) {
    return 'I need to hang up and call my family member directly to make sure they are safe. I will not send any money until I speak with them myself.';
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
// Main analysis function
// ---------------------------------------------------------------------------

export function analyzeScamRisk(inputText: string): AnalysisResult {
  const detectedFlags: RedFlag[] = [];

  if (inputText.length > 0) {
    for (const rule of RED_FLAG_RULES) {
      const matched = rule.patterns.some((pattern) => pattern.test(inputText));
      if (matched) {
        detectedFlags.push(rule.flag);
      }
    }
  }

  const flagCount = detectedFlags.length;

  let riskLevel: RiskLevel;
  if (flagCount >= 2) {
    riskLevel = 'High Risk';
  } else if (flagCount === 1) {
    riskLevel = 'Be Careful';
  } else {
    riskLevel = 'Probably Safe';
  }

  const caregiverRecommended = riskLevel === 'High Risk';
  const scamType = detectScamType(detectedFlags);
  const doNow = buildDoNow(detectedFlags);
  const doNotDo = buildDoNotDo(detectedFlags);
  const safeResponseScript = buildSafeResponseScript(detectedFlags);

  return {
    riskLevel,
    scamType,
    redFlags: detectedFlags,
    doNow,
    doNotDo,
    safeResponseScript,
    caregiverRecommended,
    analyzedAt: new Date().toISOString(),
    inputSummary: inputText.slice(0, 100),
  };
}
