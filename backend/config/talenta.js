/**
 * Talenta (Mekari HRIS) integration settings — read from .env:
 *
 *   TALENTA_MODE            off | mock | sandbox | production
 *                           default: mock in development, off when NODE_ENV=production
 *   TALENTA_HMAC_USERNAME   HMAC client from Mekari Developer Center (sandbox or production)
 *   TALENTA_HMAC_SECRET
 *   TALENTA_COMPANY_ID      Talenta company id for the company/* master-data endpoints (default "me")
 *
 * mock = local simulator (services/talenta/talentaMock.js) — nothing leaves this server.
 */

const MODES = ['off', 'mock', 'sandbox', 'production'];

const BASE_URLS = {
  sandbox: 'https://sandbox-api.mekari.com',
  production: 'https://api.mekari.com'
};

const MODE_LABELS = {
  off: 'Off',
  mock: 'Simulation (local)',
  sandbox: 'Talenta Sandbox',
  production: 'Talenta Production'
};

function talentaConfig(env = process.env) {
  const username = (env.TALENTA_HMAC_USERNAME || '').trim();
  const secret = (env.TALENTA_HMAC_SECRET || '').trim();
  let mode = (env.TALENTA_MODE || '').trim().toLowerCase();
  if (!MODES.includes(mode)) mode = env.NODE_ENV === 'production' ? 'off' : 'mock';

  const needsCredentials = mode === 'sandbox' || mode === 'production';
  const missing = needsCredentials ? ['TALENTA_HMAC_USERNAME', 'TALENTA_HMAC_SECRET'].filter((k) => !(env[k] || '').trim()) : [];

  return {
    mode,
    label: MODE_LABELS[mode],
    baseUrl: BASE_URLS[mode] || null,
    username,
    secret,
    companyId: (env.TALENTA_COMPANY_ID || 'me').trim(),
    missing,
    ready: mode !== 'off' && missing.length === 0
  };
}

module.exports = { MODES, talentaConfig };
