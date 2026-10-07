/**
 * "Hide identity" mode: masks MRA Group names in displayed text so screens can be shared
 * (WhatsApp status, demos) without revealing the company. Pure string rules — the DOM side lives in
 * components/privacy/IdentityMask.tsx. Data is never changed; only what is rendered on screen.
 */

export const DEMO_COMPANY = 'Contoso';

/** Stable pseudonym per real name, so the same PT / brand gets the same letter on every page */
function letters(name: string) {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = String.fromCharCode(65 + (h % 26));
  const b = String.fromCharCode(65 + (Math.floor(h / 26) % 26));
  return a + b;
}

// Longest first so "Hard Rock FM" wins over "Hard Rock"
const BRANDS = [
  "Harper['’]s Bazaar", 'Mother & Beyond', 'Hard Rock FM', 'Hard Rock Cafe', 'Hard Rock', 'Jamba Juice', 'Art Jakarta',
  'H[äa]agen-Dazs', 'Cosmopolitan', 'Chronologie', 'Her World', 'Parentalk', 'BVLGARI', 'Bulgari', 'OMEGA', 'Mogems', 'Jemma',
  'Bazaar', 'Jamba', 'Atmos', 'Iswara', 'CASA', 'TRL'
];

const L = "\\p{L}\\p{N}";
const BRAND_RE = new RegExp(`(?<![${L}])(${BRANDS.join('|')})(?![${L}])`, 'giu');
// "PT" followed by capitalised words: PT Mugi Rekso Abadi, PT Radio Swara Delapan Enam, …
const PT_RE = /\bPT\.?\s+([A-Z][\p{L}&'’.-]*(?:\s+[A-Z][\p{L}&'’.-]*)*)/gu;
const MRA_RE = /(?<![\p{L}\p{N}])(MRA|Mugi Rekso Abadi)(?![\p{L}\p{N}])/gu;
const DOMAIN_RE = /mragroup\.co\.id/gi;
// Head-office street (Wisma MRA) is identifying on its own
const ADDRESS_RE = /Jl\.?\s*T\.?\s*B\.?\s*Simatupang/gi;

export function maskIdentity(text: string): string {
  if (!text || !/[A-Za-z]/.test(text)) return text;
  return text
    .replace(PT_RE, (_, name: string) => `PT Perusahaan ${letters(name)}`)
    .replace(BRAND_RE, (m: string) => `Brand ${letters(m.replace(/[’]/g, "'"))}`)
    .replace(MRA_RE, DEMO_COMPANY)
    .replace(DOMAIN_RE, `${DEMO_COMPANY.toLowerCase()}.co.id`)
    .replace(ADDRESS_RE, 'Jl. Jend. Sudirman');
}

export const IDENTITY_KEY = 'hr_hub_hide_identity';
export const IDENTITY_EVENT = 'hrhub:identity';

export function isIdentityHidden() {
  try {
    return localStorage.getItem(IDENTITY_KEY) === '1';
  } catch {
    return false;
  }
}

export function setIdentityHidden(hidden: boolean) {
  try {
    localStorage.setItem(IDENTITY_KEY, hidden ? '1' : '0');
  } catch {}
  window.dispatchEvent(new CustomEvent(IDENTITY_EVENT, { detail: hidden }));
}
