const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveRecipient } = require('../../services/mail/mailer');
const T = require('../../services/mail/templates');

test('recipients: demo / sample addresses are never mailed, redirect wins for testing', () => {
  assert.deepEqual(resolveRecipient('rina@gmail.com'), { to: 'rina@gmail.com' });
  assert.ok(resolveRecipient('intan.siregar12@sample.hrhub.test').skip);
  assert.ok(resolveRecipient('citra@example.com').skip);
  assert.ok(resolveRecipient('nobody@localhost').skip);
  assert.ok(resolveRecipient('').skip);
  assert.ok(resolveRecipient('not-an-email').skip);
  assert.deepEqual(resolveRecipient('intan@sample.hrhub.test', { redirectTo: 'qa@mraretail.co.id' }), { to: 'qa@mraretail.co.id', redirectedFrom: 'intan@sample.hrhub.test' });
});

test('application received e-mail: first name, job, status link, HTML escaped', () => {
  const m = T.applicationReceived({ name: 'Rina <b>Oktaviani</b>', jobTitle: 'Barista Lead & Crew', company: 'PT Mugi Rekso Abadi', statusUrl: 'https://karier.example/status' });
  assert.match(m.subject, /Lamaran Anda telah kami terima — Barista Lead & Crew/);
  assert.match(m.html, /Halo <strong>Rina<\/strong>/);
  assert.ok(m.html.includes('Barista Lead &amp; Crew'));
  assert.ok(!m.html.includes('<b>Oktaviani</b>'));
  assert.ok(m.html.includes('href="https://karier.example/status"'));
  assert.match(m.text, /Lacak status lamaran: https:\/\/karier\.example\/status/);
});

test('interview invitation and reschedule wording with WIB time', () => {
  const base = { name: 'Intan Siregar', jobTitle: 'Watch Specialist', stage: 'INTERVIEW_HR', interviewAt: '2026-10-09T09:00', interviewer: 'Siti Rahma', mode: 'Online', location: 'https://meet.google.com/abc' };
  const inv = T.interviewInvitation(base);
  assert.equal(inv.subject, 'Undangan Interview HR — Watch Specialist');
  assert.ok(inv.html.includes('Jumat, 9 Oktober 2026 pukul 09.00 WIB'));
  assert.ok(inv.html.includes('Link / media'));
  const re = T.interviewInvitation({ ...base, stage: 'INTERVIEW_USER', reschedule: true, mode: 'Onsite', location: 'Wisma MRA Lt. 6' });
  assert.equal(re.subject, 'Perubahan jadwal Interview User — Watch Specialist');
  assert.ok(re.html.includes('Tatap muka (onsite)'));
  assert.ok(re.html.includes('Lokasi'));
});

test('.ics invite: WIB converted to UTC, 60 minutes, special characters escaped', () => {
  const ics = T.buildIcs({ uid: 'app-1', interviewAt: '2026-10-09T09:00', summary: 'Interview HR — Barista, Lead; MRA', location: 'Wisma MRA' });
  assert.match(ics, /DTSTART:20261009T020000Z/);
  assert.match(ics, /DTEND:20261009T030000Z/);
  assert.match(ics, /SUMMARY:Interview HR — Barista\\, Lead\\; MRA/);
  assert.ok(ics.includes('\r\n'));
  assert.equal(T.buildIcs({ uid: 'x', interviewAt: 'besok' }), null);
});

test('offer letter e-mail mentions number, validity and signatory', () => {
  const m = T.offerLetter({ name: 'Citra Permata', jobTitle: 'Store Manager', company: 'PT Mugi Rekso Abadi', letterNo: '001/OL-MRA/HR/X/2026', validUntil: new Date('2026-10-15T00:00:00Z'), signatoryName: 'Budi Hartono', signatoryTitle: 'Human Resources' });
  assert.equal(m.subject, 'Surat Penawaran Kerja — Store Manager (001/OL-MRA/HR/X/2026)');
  assert.ok(m.html.includes('15 Oktober 2026'));
  assert.ok(m.html.includes('Budi Hartono'));
});
