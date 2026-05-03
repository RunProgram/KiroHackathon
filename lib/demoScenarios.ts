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
    description: 'Someone pretending to be your grandchild says they need bail money urgently.',
    scenarioText:
      "Grandma, it's me! I'm in trouble — I was in a car accident and I'm in jail. " +
      "Don't tell mom and dad. I need you to buy gift cards right away to pay for bail. " +
      'Please hurry, this is urgent and I need the card numbers immediately.',
    scamType: 'grandparent_scam',
  },
  {
    id: 'medicare-government',
    title: 'Medicare Card Renewal',
    description: 'A caller claims to be from Medicare and asks for your Social Security number.',
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
    description: 'A message says your Amazon account will be suspended unless you call immediately.',
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
    description: 'A caller says your computer is compromised and needs remote access to fix it.',
    scenarioText:
      'This is Microsoft technical support. Your computer has been compromised and we ' +
      'need remote access to fix it immediately. Please download our software right away ' +
      'and allow us to access your computer. Do not tell anyone about this — act now ' +
      'before your personal data is stolen.',
    scamType: 'tech_support',
  },
  {
    id: 'irs-tax',
    title: 'IRS Tax Warrant',
    description: 'A caller says you owe back taxes and will be arrested unless you pay immediately.',
    scenarioText:
      'This is the IRS. You owe $4,500 in back taxes and there is a warrant for your arrest. ' +
      'You must pay immediately using gift cards or wire transfer to avoid being arrested today. ' +
      'Do not contact your lawyer or accountant — this must be resolved right now or officers ' +
      'will be sent to your home.',
    scamType: 'irs_tax',
  },
  {
    id: 'usps-delivery',
    title: 'USPS Delivery Notice',
    description: 'A text says your USPS package is held and you need to pay a fee to release it.',
    scenarioText:
      'USPS: Your package is being held at the distribution center due to an unpaid shipping fee of $1.99. ' +
      'Click here to pay and schedule delivery: http://usps-delivery-update.top/pay ' +
      'Your package will be returned to sender if not claimed within 24 hours.',
    scamType: 'amazon_delivery',
  },
  {
    id: 'lottery-prize',
    title: 'Lottery Winner',
    description: 'An email says you won a prize and need to pay a fee to claim it.',
    scenarioText:
      'Congratulations! You have been selected as the winner of our $500,000 sweepstakes prize! ' +
      'To claim your winnings, you must pay a processing fee of $250 via wire transfer immediately. ' +
      'This is a limited time offer — you must act now or your prize will be forfeited. ' +
      'Do not share this with anyone as it is confidential.',
    scamType: 'lottery_prize',
  },
  {
    id: 'romance-scam',
    title: 'Online Romance',
    description: 'Someone you met online needs money for a flight to visit you.',
    scenarioText:
      'I love you so much and I want to come see you. But I am stuck overseas and I need money ' +
      'for a plane ticket. Can you send $2,000 via Western Union? I promise I will pay you back ' +
      'when I arrive. Please hurry — the flight leaves tomorrow and I need the money now. ' +
      "Don't tell your family about this, they won't understand our love.",
    scamType: 'romance_scam',
  },
  {
    id: 'tech-refund',
    title: 'Geek Squad Refund',
    description: 'An email says you are owed a refund and they need remote access to process it.',
    scenarioText:
      'Your Geek Squad subscription has been cancelled. You are owed a refund of $399.99. ' +
      'To process your refund, we need to connect to your computer remotely. Please call us ' +
      'immediately and download our remote access software. We accidentally refunded $3,999.99 ' +
      'to your account — you must send back the difference via gift cards right away.',
    scamType: 'tech_support',
  },
];
