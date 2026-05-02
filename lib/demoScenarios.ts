/**
 * demoScenarios — pre-written example scam scenarios for user education.
 *
 * Each scenario's scenarioText is crafted to trigger ≥2 red flags so the
 * analysis engine always returns "High Risk" (never "Probably Safe").
 *
 * Requirements: 7.1, 7.2
 */

import { DemoScenario } from '../types';

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'bank-impersonation',
    title: 'Bank Fraud Alert',
    description: 'A caller claims to be from your bank and demands your account details immediately.',
    scenarioText:
      "This is your bank calling. We've detected suspicious activity on your account. " +
      'You must verify your account number and PIN immediately or your account will be ' +
      'frozen within 24 hours. Do not tell anyone about this call — it is a confidential ' +
      'security matter.',
    scamType: 'bank_impersonation',
  },
  {
    id: 'grandparent-scam',
    title: 'Grandparent Emergency',
    description: 'Someone pretending to be your grandchild says they are in trouble and need money right away.',
    scenarioText:
      "Grandma, it's me! I'm in trouble — I was in a car accident and I'm in jail. " +
      "Don't tell mom and dad. I need you to buy gift cards right away to pay for bail. " +
      'Please hurry, this is urgent and I need the card numbers immediately.',
    scamType: 'grandparent_scam',
  },
  {
    id: 'medicare-government',
    title: 'Medicare Card Renewal',
    description: 'A caller claims to be from Medicare and asks for your Medicare and Social Security numbers.',
    scenarioText:
      'This is Medicare calling. Your Medicare card is expiring and we need to verify ' +
      'your Medicare number and Social Security number immediately to send you a new card. ' +
      'You must act now or your benefits will be suspended. Do not share this call with ' +
      'anyone else — this is a confidential government matter.',
    scamType: 'medicare_government',
  },
  {
    id: 'amazon-delivery',
    title: 'Amazon Account Suspended',
    description: 'A message says your Amazon account has been flagged and will be suspended unless you call immediately.',
    scenarioText:
      'Your Amazon order has been flagged for suspicious activity. Call us immediately ' +
      'to verify your account or your account will be suspended within 24 hours. ' +
      'We need your verification code and account password to restore access right away. ' +
      'Do not tell anyone about this security alert.',
    scamType: 'amazon_delivery',
  },
  {
    id: 'tech-support',
    title: 'Microsoft Tech Support',
    description: 'A caller claims to be from Microsoft and says your computer is compromised and needs remote access.',
    scenarioText:
      'This is Microsoft technical support. Your computer has been compromised and we ' +
      'need remote access to fix it immediately. Please download our software right away ' +
      'and allow us to access your computer. Do not tell anyone about this — act now ' +
      'before your personal data is stolen.',
    scamType: 'tech_support',
  },
];
