/**
 * URL safety analysis engine — fully local, no APIs.
 *
 * Checks URLs against known scam patterns, suspicious TLD lists,
 * homograph attacks, URL shorteners, and structural red flags.
 */

export type UrlRiskLevel = 'Dangerous' | 'Suspicious' | 'Probably Safe';

export interface UrlAnalysisResult {
  url: string;
  riskLevel: UrlRiskLevel;
  flags: string[];
  domain: string;
  advice: string[];
}

// Known dangerous TLDs commonly used in scams
const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.club', '.work', '.buzz', '.tk', '.ml', '.ga', '.cf',
  '.gq', '.icu', '.cam', '.rest', '.monster', '.click', '.link', '.info',
  '.biz', '.online', '.site', '.store', '.fun', '.space', '.pw', '.cc',
  '.ws', '.su', '.ru', '.cn',
];

// URL shorteners that hide the real destination
const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
  'buff.ly', 'adf.ly', 'bl.ink', 'lnkd.in', 'db.tt', 'qr.ae',
  'rebrand.ly', 'shorturl.at', 'cutt.ly', 'rb.gy', 'v.gd',
  'tiny.cc', 'short.io', 'clck.ru',
];

// Brands commonly impersonated in phishing
const IMPERSONATED_BRANDS = [
  { brand: 'paypal', legit: ['paypal.com'] },
  { brand: 'apple', legit: ['apple.com', 'icloud.com'] },
  { brand: 'amazon', legit: ['amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de'] },
  { brand: 'google', legit: ['google.com', 'googleapis.com', 'google.co'] },
  { brand: 'microsoft', legit: ['microsoft.com', 'live.com', 'outlook.com', 'office.com'] },
  { brand: 'netflix', legit: ['netflix.com'] },
  { brand: 'facebook', legit: ['facebook.com', 'fb.com'] },
  { brand: 'instagram', legit: ['instagram.com'] },
  { brand: 'chase', legit: ['chase.com'] },
  { brand: 'wellsfargo', legit: ['wellsfargo.com'] },
  { brand: 'bankofamerica', legit: ['bankofamerica.com'] },
  { brand: 'usps', legit: ['usps.com'] },
  { brand: 'fedex', legit: ['fedex.com'] },
  { brand: 'ups', legit: ['ups.com'] },
  { brand: 'irs', legit: ['irs.gov'] },
  { brand: 'medicare', legit: ['medicare.gov'] },
  { brand: 'walmart', legit: ['walmart.com'] },
  { brand: 'costco', legit: ['costco.com'] },
  { brand: 'target', legit: ['target.com'] },
  { brand: 'venmo', legit: ['venmo.com'] },
  { brand: 'zelle', legit: ['zellepay.com'] },
  { brand: 'cashapp', legit: ['cash.app'] },
  { brand: 'whatsapp', legit: ['whatsapp.com'] },
  { brand: 'telegram', legit: ['telegram.org'] },
];

// Suspicious URL path keywords
const SUSPICIOUS_PATHS = [
  /login/i, /signin/i, /sign-in/i, /verify/i, /confirm/i, /secure/i,
  /update/i, /account/i, /password/i, /billing/i, /payment/i,
  /suspend/i, /locked/i, /unusual/i, /alert/i, /urgent/i,
  /claim/i, /prize/i, /winner/i, /reward/i, /gift/i, /free/i,
  /offer/i, /deal/i, /limited/i, /expire/i,
];

function extractDomain(url: string): string {
  try {
    let cleaned = url.trim();
    if (!cleaned.match(/^https?:\/\//i)) {
      cleaned = 'https://' + cleaned;
    }
    const parsed = new URL(cleaned);
    return parsed.hostname.toLowerCase();
  } catch {
    // Fallback: extract domain manually
    const match = url.match(/(?:https?:\/\/)?([^\/\s:?#]+)/i);
    return match ? match[1].toLowerCase() : url.toLowerCase();
  }
}

function hasHomographChars(domain: string): boolean {
  // Check for non-ASCII characters that look like Latin letters (IDN homograph attack)
  // eslint-disable-next-line no-control-regex
  return /[^\x00-\x7F]/.test(domain) || /xn--/.test(domain);
}

function hasExcessiveSubdomains(domain: string): boolean {
  const parts = domain.split('.');
  return parts.length > 3;
}

function hasIPAddress(url: string): boolean {
  return /(?:https?:\/\/)?(\d{1,3}\.){3}\d{1,3}/.test(url);
}

function hasSuspiciousPort(url: string): boolean {
  const match = url.match(/:(\d+)/);
  if (!match) return false;
  const port = parseInt(match[1], 10);
  return port !== 80 && port !== 443 && port > 0;
}

export function analyzeUrl(rawUrl: string): UrlAnalysisResult {
  const flags: string[] = [];
  let score = 0;
  const domain = extractDomain(rawUrl);

  // 1. Check for IP address instead of domain
  if (hasIPAddress(rawUrl)) {
    flags.push('Uses an IP address instead of a domain name');
    score += 4;
  }

  // 2. Check for suspicious TLD
  const tld = '.' + domain.split('.').slice(-1)[0];
  const tldWithDot = domain.includes('.') ? '.' + domain.split('.').pop() : '';
  if (SUSPICIOUS_TLDS.includes(tld) || SUSPICIOUS_TLDS.includes(tldWithDot)) {
    flags.push(`Uses suspicious domain extension (${tld})`);
    score += 3;
  }

  // 3. Check for URL shortener
  if (URL_SHORTENERS.some((s) => domain === s || domain.endsWith('.' + s))) {
    flags.push('Uses a URL shortener that hides the real destination');
    score += 3;
  }

  // 4. Check for brand impersonation
  for (const { brand, legit } of IMPERSONATED_BRANDS) {
    const domainContainsBrand = domain.includes(brand);
    const isLegit = legit.some((l) => domain === l || domain.endsWith('.' + l));
    if (domainContainsBrand && !isLegit) {
      flags.push(`Contains "${brand}" but is NOT the real ${brand} website`);
      score += 5;
    }
  }

  // 5. Check for homograph/IDN attack
  if (hasHomographChars(domain)) {
    flags.push('Contains characters designed to look like a different website');
    score += 4;
  }

  // 6. Check for excessive subdomains
  if (hasExcessiveSubdomains(domain)) {
    flags.push('Has an unusually complex domain structure');
    score += 2;
  }

  // 7. Check for suspicious port
  if (hasSuspiciousPort(rawUrl)) {
    flags.push('Uses an unusual port number');
    score += 2;
  }

  // 8. Check for HTTP (not HTTPS)
  if (rawUrl.match(/^http:\/\//i) && !rawUrl.match(/^https:\/\//i)) {
    flags.push('Uses insecure HTTP instead of HTTPS');
    score += 2;
  }

  // 9. Check for suspicious path keywords
  const matchedPaths = SUSPICIOUS_PATHS.filter((p) => p.test(rawUrl));
  if (matchedPaths.length >= 2) {
    flags.push('URL path contains multiple suspicious keywords (login, verify, account, etc.)');
    score += 2;
  } else if (matchedPaths.length === 1) {
    flags.push('URL path contains a suspicious keyword');
    score += 1;
  }

  // 10. Check for very long URL (common in phishing)
  if (rawUrl.length > 100) {
    flags.push('Unusually long URL — often used to hide the real destination');
    score += 1;
  }

  // 11. Check for @ symbol (credential stuffing in URL)
  if (rawUrl.includes('@')) {
    flags.push('Contains @ symbol — may redirect to a different site than shown');
    score += 4;
  }

  // 12. Check for double extensions or misleading file names
  if (/\.(exe|zip|scr|bat|cmd|msi|apk|dmg|pkg)/i.test(rawUrl)) {
    flags.push('Links to a downloadable file — could contain malware');
    score += 4;
  }

  // Determine risk level
  let riskLevel: UrlRiskLevel;
  if (score >= 4) {
    riskLevel = 'Dangerous';
  } else if (score >= 2 || flags.length > 0) {
    riskLevel = 'Suspicious';
  } else {
    riskLevel = 'Probably Safe';
  }

  // Build advice
  const advice: string[] = [];
  if (riskLevel === 'Dangerous') {
    advice.push('Do NOT click this link or enter any information');
    advice.push('Delete the message containing this link');
    advice.push('If you already clicked it, change your passwords immediately');
    advice.push('Report this to the organization being impersonated');
  } else if (riskLevel === 'Suspicious') {
    advice.push('Be cautious — do not enter personal information');
    advice.push('Verify the URL by going directly to the official website');
    advice.push('When in doubt, contact the company directly using a known number');
  } else {
    advice.push('This URL appears safe, but always be cautious');
    advice.push('Never enter passwords on sites you reached through a link');
    advice.push('When in doubt, navigate to the website directly');
  }

  return { url: rawUrl, riskLevel, flags, domain, advice };
}
