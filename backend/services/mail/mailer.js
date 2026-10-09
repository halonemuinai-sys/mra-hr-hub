/**
 * Sends one e-mail according to config/mail.js. Never throws: returns
 * { status: 'sent' | 'logged' | 'skipped' | 'failed', to, messageId?, reason? }.
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const cfg = require('../../config/mail');

const OUTBOX = path.join(__dirname, '../../mail-outbox');
// Addresses that can never receive mail (sample / demo data)
const UNDELIVERABLE = /@([a-z0-9-]+\.)*(test|example|invalid|local|localhost)$|@example\.(com|org|net)$/i;

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: cfg.smtp.host,
      port: cfg.smtp.port,
      secure: cfg.smtp.secure,
      auth: { user: cfg.smtp.user, pass: cfg.smtp.pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000
    });
  }
  return transporter;
}

/** Pure: who actually receives the mail (redirect for testing, refuse demo addresses) */
function resolveRecipient(to, { redirectTo = '' } = {}) {
  const addr = String(to || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return { skip: 'No valid e-mail address.' };
  if (redirectTo) return { to: redirectTo, redirectedFrom: addr };
  if (UNDELIVERABLE.test(addr)) return { skip: `Sample address (${addr}) — not delivered.` };
  return { to: addr };
}

function writeOutbox({ to, subject, html, attachments }) {
  try {
    fs.mkdirSync(OUTBOX, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const base = path.join(OUTBOX, `${stamp}_${String(subject).replace(/[^\w-]+/g, '_').slice(0, 60)}`);
    const head = `<!-- To: ${to} | Subject: ${subject} | Attachments: ${(attachments || []).map((a) => a.filename).join(', ') || '-'} -->\n`;
    fs.writeFileSync(`${base}.html`, head + html);
    (attachments || []).forEach((a) => a.content && fs.writeFileSync(`${base}__${a.filename}`, a.content));
    return `${base}.html`;
  } catch (err) {
    return null;
  }
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string, replyTo?: string, attachments?: object[] }} msg
 */
async function sendMail(msg) {
  if (cfg.mode === 'off') return { status: 'skipped', to: msg.to, reason: 'E-mail is turned off (MAIL_MODE=off or SMTP not configured).' };
  const r = resolveRecipient(msg.to, cfg);
  if (r.skip) return { status: 'skipped', to: msg.to, reason: r.skip };
  const subject = r.redirectedFrom ? `[TEST → ${r.redirectedFrom}] ${msg.subject}` : msg.subject;

  if (cfg.mode === 'log') {
    const file = writeOutbox({ ...msg, to: r.to, subject });
    console.log(`✉️  [mail:log] To: ${r.to} | ${subject}${file ? ` → ${path.relative(process.cwd(), file)}` : ''}`);
    return { status: 'logged', to: r.to, file };
  }

  try {
    const info = await getTransporter().sendMail({
      from: `${cfg.fromName} <${cfg.from}>`,
      to: r.to,
      subject,
      html: msg.html,
      text: msg.text,
      replyTo: msg.replyTo || undefined,
      attachments: msg.attachments
    });
    return { status: 'sent', to: r.to, messageId: info.messageId };
  } catch (err) {
    console.error('✉️  [mail] SMTP error:', err.message);
    return { status: 'failed', to: r.to, reason: err.message };
  }
}

/** Checks the SMTP login without sending anything */
async function verifySmtp() {
  if (!cfg.smtp.user || !cfg.smtp.pass) return { ok: false, reason: 'SMTP_USER / SMTP_PASS not set.' };
  try {
    await getTransporter().verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

module.exports = { sendMail, verifySmtp, resolveRecipient, UNDELIVERABLE };
