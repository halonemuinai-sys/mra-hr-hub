/**
 * Checks the SMTP settings and optionally sends one test e-mail.
 *   node scripts/sendTestMail.js                 → verify the SMTP login only (nothing is sent)
 *   node scripts/sendTestMail.js you@company.com → verify, then send a test e-mail (uses MAIL_MODE; set MAIL_MODE=smtp to really send)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
const cfg = require('../config/mail');
const { verifySmtp, sendMail } = require('../services/mail/mailer');
const T = require('../services/mail/templates');

(async () => {
  console.log(`Mode: ${cfg.mode} · SMTP ${cfg.smtp.host}:${cfg.smtp.port} · from "${cfg.fromName}" <${cfg.from}>${cfg.redirectTo ? ` · redirect → ${cfg.redirectTo}` : ''}`);
  const v = await verifySmtp();
  console.log(v.ok ? '✓ SMTP login OK' : `✗ SMTP login failed: ${v.reason}`);
  const to = process.argv[2];
  if (!to) return;
  const msg = T.applicationReceived({ name: 'Tes Email', jobTitle: 'Contoh Posisi (tes)', company: 'MRA Group', statusUrl: `${cfg.portalUrl}/status` });
  const r = await sendMail({ to, ...msg, subject: `[HR HUB test] ${msg.subject}` });
  console.log(`Result: ${r.status}${r.reason ? ` — ${r.reason}` : ''}${r.file ? ` → ${r.file}` : ''}`);
})();
