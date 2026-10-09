/**
 * E-mails to applicants (Indonesian) — HTML in the HR HUB palette + plain-text version, and an .ics invite.
 * Pure (no DB, no SMTP), unit-tested.
 */

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function layout({ kicker, title, body, cta }) {
  const button = cta
    ? `<p style="margin:28px 0 8px 0;text-align:center;"><a href="${esc(cta.url)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;">${esc(cta.label)}</a></p>`
    : '';
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f8fafc;">
<div style="font-family:${FONT};max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
  <div style="height:6px;background:#2563eb;"></div>
  <div style="padding:28px 32px 8px 32px;">
    <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#2563eb;">${esc(kicker)}</p>
    <h1 style="margin:0;font-size:22px;line-height:1.3;color:#0f172a;">${esc(title)}</h1>
  </div>
  <div style="padding:16px 32px 28px 32px;font-size:14px;line-height:1.65;color:#334155;">
    ${body}
    ${button}
  </div>
  <div style="border-top:1px solid #e2e8f0;padding:18px 32px;font-size:11px;line-height:1.6;color:#64748b;text-align:center;">
    <p style="margin:0 0 2px 0;font-weight:700;color:#0f172a;font-size:12px;">MRA Group · Human Resources</p>
    <p style="margin:0;">Email ini dikirim otomatis oleh sistem rekrutmen MRA Group. Mohon tidak membalas langsung ke alamat ini.</p>
  </div>
</div></body></html>`;
}

const rows = (pairs) =>
  `<table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">${pairs
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;width:38%;vertical-align:top;">${esc(k)}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:600;">${esc(v)}</td></tr>`
    )
    .join('')}</table>`;
const textRows = (pairs) => pairs.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || 'Pelamar';

const STAGE_LABEL = { INTERVIEW_HR: 'Interview HR', INTERVIEW_USER: 'Interview User' };

/** "Jumat, 9 Oktober 2026 pukul 09.00 WIB" from a datetime-local string (already WIB) */
function formatWib(at) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(at || ''));
  if (!m) return String(at || '');
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const day = d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return `${day} pukul ${m[4]}.${m[5]} WIB`;
}

function applicationReceived({ name, jobTitle, company, statusUrl }) {
  const subject = `Lamaran Anda telah kami terima — ${jobTitle}`;
  const body = `
    <p style="margin:0 0 12px 0;">Halo <strong>${esc(firstName(name))}</strong>,</p>
    <p style="margin:0 0 12px 0;">Terima kasih telah melamar di MRA Group. Lamaran Anda untuk posisi <strong>${esc(jobTitle)}</strong>${company ? ` di ${esc(company)}` : ''} sudah kami terima dan akan ditinjau oleh tim rekrutmen.</p>
    <p style="margin:0 0 12px 0;">Jika profil Anda sesuai, kami akan menghubungi Anda melalui email atau WhatsApp untuk tahap selanjutnya. Anda dapat memantau perkembangan lamaran kapan saja dengan email ini.</p>`;
  return {
    subject,
    html: layout({ kicker: 'Lamaran diterima', title: 'Terima kasih atas lamaran Anda', body, cta: statusUrl && { label: 'Lacak Status Lamaran', url: statusUrl } }),
    text: `Halo ${firstName(name)},\n\nTerima kasih telah melamar di MRA Group. Lamaran Anda untuk posisi ${jobTitle}${company ? ` di ${company}` : ''} sudah kami terima dan akan ditinjau oleh tim rekrutmen.\n\nLacak status lamaran: ${statusUrl || '-'}\n\nMRA Group · Human Resources`
  };
}

function interviewInvitation({ name, jobTitle, stage, interviewAt, interviewer, mode, location, note, reschedule, statusUrl }) {
  const stageLabel = STAGE_LABEL[stage] || 'Interview';
  const when = formatWib(interviewAt);
  const subject = `${reschedule ? 'Perubahan jadwal' : 'Undangan'} ${stageLabel} — ${jobTitle}`;
  const modeText = mode === 'Online' ? 'Online' : mode === 'Onsite' ? 'Tatap muka (onsite)' : '';
  const pairs = [
    ['Posisi', jobTitle],
    ['Tahap', stageLabel],
    ['Waktu', when],
    ['Mode', modeText],
    [mode === 'Online' ? 'Link / media' : 'Lokasi', location],
    ['Pewawancara', interviewer],
    ['Catatan', note]
  ];
  const intro = reschedule
    ? `Jadwal <strong>${esc(stageLabel)}</strong> Anda untuk posisi <strong>${esc(jobTitle)}</strong> mengalami perubahan. Berikut jadwal terbaru:`
    : `Selamat! Anda kami undang mengikuti <strong>${esc(stageLabel)}</strong> untuk posisi <strong>${esc(jobTitle)}</strong> dengan rincian berikut:`;
  const body = `
    <p style="margin:0 0 12px 0;">Halo <strong>${esc(firstName(name))}</strong>,</p>
    <p style="margin:0;">${intro}</p>
    ${rows(pairs)}
    <p style="margin:0 0 12px 0;">Undangan kalender (.ics) terlampir agar mudah disimpan di kalender Anda. Mohon hadir 10 menit lebih awal${mode === 'Online' ? ' dan pastikan koneksi internet stabil' : ''}.</p>
    <p style="margin:0;">Jika berhalangan, mohon kabari tim rekrutmen yang menghubungi Anda sesegera mungkin.</p>`;
  return {
    subject,
    html: layout({ kicker: reschedule ? 'Perubahan jadwal' : 'Undangan interview', title: `${stageLabel} — ${jobTitle}`, body, cta: statusUrl && { label: 'Lacak Status Lamaran', url: statusUrl } }),
    text: `Halo ${firstName(name)},\n\n${reschedule ? 'Jadwal interview Anda berubah.' : `Anda diundang mengikuti ${stageLabel}.`}\n\n${textRows(pairs)}\n\nMRA Group · Human Resources`
  };
}

function offerLetter({ name, jobTitle, company, letterNo, validUntil, signatoryName, signatoryTitle }) {
  const subject = `Surat Penawaran Kerja — ${jobTitle}${letterNo ? ` (${letterNo})` : ''}`;
  const valid = validUntil
    ? new Date(validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : '';
  const body = `
    <p style="margin:0 0 12px 0;">Halo <strong>${esc(firstName(name))}</strong>,</p>
    <p style="margin:0 0 12px 0;">Selamat! Bersama email ini kami lampirkan <strong>surat penawaran kerja</strong> untuk posisi <strong>${esc(jobTitle)}</strong>${company ? ` di ${esc(company)}` : ''}${letterNo ? ` (No. ${esc(letterNo)})` : ''}.</p>
    ${valid ? `<p style="margin:0 0 12px 0;">Penawaran ini berlaku sampai <strong>${esc(valid)}</strong>. Apabila Anda menerima penawaran ini, mohon tandatangani bagian <em>Pernyataan Persetujuan</em> pada surat dan kirimkan kembali kepada kami sebelum tanggal tersebut.</p>` : ''}
    <p style="margin:0 0 12px 0;">Jika ada pertanyaan mengenai isi penawaran, silakan hubungi tim rekrutmen kami.</p>
    <p style="margin:16px 0 0 0;">Salam,<br><strong>${esc(signatoryName || 'Human Resources')}</strong><br><span style="color:#64748b;">${esc(signatoryTitle || '')}</span></p>`;
  return {
    subject,
    html: layout({ kicker: 'Penawaran kerja', title: `Selamat, ${firstName(name)}!`, body }),
    text: `Halo ${firstName(name)},\n\nTerlampir surat penawaran kerja untuk posisi ${jobTitle}${company ? ` di ${company}` : ''}${letterNo ? ` (No. ${letterNo})` : ''}.${valid ? `\nPenawaran berlaku sampai ${valid}. Mohon tandatangani Pernyataan Persetujuan dan kirimkan kembali sebelum tanggal tersebut.` : ''}\n\nSalam,\n${signatoryName || 'Human Resources'}\n${signatoryTitle || ''}`
  };
}

/** iCalendar invite; interviewAt is a WIB datetime-local string */
function buildIcs({ uid, interviewAt, durationMin = 60, summary, description, location }) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(interviewAt || ''));
  if (!m) return null;
  // WIB = UTC+7
  const start = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 7, +m[5]));
  const end = new Date(start.getTime() + durationMin * 60000);
  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const fold = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MRA Group//HR HUB//ID',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@hrhub.mragroup`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${fold(summary)}`,
    description ? `DESCRIPTION:${fold(description)}` : null,
    location ? `LOCATION:${fold(location)}` : null,
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .filter(Boolean)
    .join('\r\n');
}

module.exports = { applicationReceived, interviewInvitation, offerLetter, buildIcs, formatWib, esc };
