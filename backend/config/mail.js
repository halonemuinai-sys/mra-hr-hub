/**
 * Outgoing e-mail (SMTP via nodemailer) — same SMTP setup as the MRA Helpdesk (Turbify / Yahoo Business, port 465 SSL).
 *
 * MAIL_MODE
 *   off   nothing is sent
 *   log   (default in development) e-mails are written to backend/mail-outbox/*.html and the console — nothing leaves the server
 *   smtp  (default in production when SMTP_USER is set) send through SMTP_HOST
 * MAIL_REDIRECT_TO  optional: deliver every e-mail to this address instead (testing with real SMTP)
 */
const isProd = process.env.NODE_ENV === 'production';
const hasSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
const MODES = ['off', 'log', 'smtp'];

const requested = String(process.env.MAIL_MODE || '').toLowerCase();
const mode = MODES.includes(requested) ? requested : isProd ? (hasSmtp ? 'smtp' : 'off') : 'log';
const port = parseInt(process.env.SMTP_PORT || '465', 10);

module.exports = {
  mode: mode === 'smtp' && !hasSmtp ? 'off' : mode,
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.bizmail.yahoo.com',
    port,
    secure: port === 465,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@localhost',
  fromName: process.env.MAIL_FROM_NAME || 'MRA Group Recruitment',
  redirectTo: (process.env.MAIL_REDIRECT_TO || '').trim(),
  // Public career portal (links in e-mails to applicants)
  portalUrl: (process.env.PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:3006').replace(/\/+$/, ''),
  // Automatic e-mails to applicants (application received, interview invitations)
  notifyApplicants: String(process.env.MAIL_NOTIFY_APPLICANTS || 'true').toLowerCase() !== 'false',
  label: { off: 'Off', log: 'Log only (development)', smtp: 'SMTP' }[mode === 'smtp' && !hasSmtp ? 'off' : mode]
};
