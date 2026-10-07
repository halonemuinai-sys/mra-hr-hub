/**
 * Original resume files on local disk (backend/uploads/resumes, git-ignored).
 *
 * Flow: the public parse step stores the upload as a temp file and returns an unguessable
 * token; the apply step "claims" the token, moving the file to permanent storage and
 * recording its relative path on Candidate.rawResumePath. Unclaimed temp files expire.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '../uploads');
const STORE_DIR = path.join(ROOT, 'resumes');
const TMP_DIR = path.join(STORE_DIR, 'tmp');
const TEMP_TTL_MS = 24 * 3600 * 1000;
const TOKEN_RE = /^[0-9a-f-]{36}$/;

const MIME = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain; charset=utf-8'
};

/** File type from content (magic bytes), not just the name — returns an extension or null */
function detectExtension(buffer, originalName = '') {
  const ext = path.extname(originalName).toLowerCase();
  const head = buffer.subarray(0, 8);
  if (head.subarray(0, 4).toString('latin1') === '%PDF') return '.pdf';
  if (head[0] === 0x50 && head[1] === 0x4b && ext === '.docx') return '.docx'; // zip container
  if (head.toString('hex').startsWith('d0cf11e0') && ext === '.doc') return '.doc'; // OLE2
  if (ext === '.txt' && !buffer.subarray(0, 4096).includes(0)) return '.txt';
  return null;
}

function ensureDirs() {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

/** Remove temp uploads older than the TTL (best effort) */
function cleanupTemp(now = Date.now()) {
  try {
    for (const f of fs.readdirSync(TMP_DIR)) {
      const p = path.join(TMP_DIR, f);
      if (now - fs.statSync(p).mtimeMs > TEMP_TTL_MS) fs.rmSync(p, { force: true });
    }
  } catch {
    // directory may not exist yet
  }
}

/**
 * Store an upload temporarily.
 * @returns {string|null} token, or null when the file type is not an accepted resume
 */
function saveTemp(buffer, originalName) {
  const ext = detectExtension(buffer, originalName);
  if (!ext) return null;
  ensureDirs();
  cleanupTemp();
  const token = crypto.randomUUID();
  fs.writeFileSync(path.join(TMP_DIR, token + ext), buffer);
  fs.writeFileSync(path.join(TMP_DIR, token + '.json'), JSON.stringify({ originalName: path.basename(originalName || ''), ext }));
  return token;
}

/**
 * Move a temp upload to permanent storage.
 * @returns {string|null} path relative to uploads/ (stored on Candidate.rawResumePath)
 */
function claimTemp(token) {
  if (typeof token !== 'string' || !TOKEN_RE.test(token)) return null;
  const metaPath = path.join(TMP_DIR, token + '.json');
  if (!fs.existsSync(metaPath)) return null;
  const { ext } = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const tmpFile = path.join(TMP_DIR, token + ext);
  if (!fs.existsSync(tmpFile)) return null;
  const fileName = `${crypto.randomUUID()}${ext}`;
  fs.renameSync(tmpFile, path.join(STORE_DIR, fileName));
  fs.rmSync(metaPath, { force: true });
  return `resumes/${fileName}`;
}

/** Absolute path of a stored resume, or null (blocks path traversal) */
function resolveStored(relPath) {
  if (!relPath || typeof relPath !== 'string') return null;
  const abs = path.resolve(ROOT, relPath);
  if (!abs.startsWith(STORE_DIR + path.sep) || abs.startsWith(TMP_DIR)) return null;
  return fs.existsSync(abs) ? abs : null;
}

function removeStored(relPath) {
  const abs = resolveStored(relPath);
  if (abs) fs.rmSync(abs, { force: true });
}

const mimeOf = (absPath) => MIME[path.extname(absPath).toLowerCase()] || 'application/octet-stream';

module.exports = { detectExtension, saveTemp, claimTemp, resolveStored, removeStored, mimeOf, STORE_DIR, TMP_DIR };
