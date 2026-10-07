/**
 * Talenta API client: HMAC-signed requests (sandbox / production) or the local simulator (mock).
 * Errors are thrown as TalentaError { message, errors[], status }.
 */
const { talentaConfig } = require('../../config/talenta');
const { signRequest } = require('./talentaHmac');
const mock = require('./talentaMock');

const TIMEOUT_MS = 20000;

class TalentaError extends Error {
  constructor(message, { errors = [], status = 502 } = {}) {
    super(message);
    this.name = 'TalentaError';
    this.errors = errors;
    this.status = status;
  }
}

async function talentaRequest(method, path, body, cfg = talentaConfig()) {
  if (cfg.mode === 'off') throw new TalentaError('Integrasi Talenta belum diaktifkan (TALENTA_MODE=off).', { status: 503 });
  if (!cfg.ready) throw new TalentaError(`Kredensial Talenta belum diisi: ${cfg.missing.join(', ')}.`, { status: 503 });

  if (cfg.mode === 'mock') {
    try {
      return await mock.handle(method, path, body);
    } catch (err) {
      const b = err.body || {};
      throw new TalentaError(b.errors?.[0] || err.message, { errors: b.errors || [err.message], status: err.status || 400 });
    }
  }

  const headers = { ...signRequest({ method, path, username: cfg.username, secret: cfg.secret }), Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(cfg.baseUrl + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch (err) {
    throw new TalentaError(`Tidak dapat menghubungi Talenta: ${err.message}`, { status: 504 });
  }

  let json = null;
  try {
    json = await res.json();
  } catch {}
  if (!res.ok) {
    const errors = Array.isArray(json?.errors) ? json.errors.map(String) : [];
    const message = errors[0] || json?.message || `Talenta HTTP ${res.status}`;
    throw new TalentaError(res.status === 401 ? 'Talenta menolak kredensial HMAC (401). Cek username/secret & scope.' : message, {
      errors,
      status: res.status >= 500 ? 502 : res.status
    });
  }
  return json;
}

module.exports = { TalentaError, talentaRequest };
