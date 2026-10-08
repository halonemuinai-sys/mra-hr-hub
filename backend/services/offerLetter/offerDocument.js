/**
 * Offer letter content — one document model used by the live preview (frontend) and the PDF (offerPdf.js),
 * so both always say the same thing. Pure; Indonesian (default) and English.
 */

const T = {
  id: {
    title: 'SURAT PENAWARAN KERJA',
    no: 'Nomor',
    subject: (p) => `Perihal: Penawaran Kerja sebagai ${p}`,
    to: 'Kepada Yth.',
    greet: (n) => `Dengan hormat, Saudara/i ${n},`,
    intro: (pt) =>
      `Berdasarkan hasil proses seleksi yang telah Saudara/i ikuti, dengan senang hati kami dari ${pt} menawarkan posisi dengan ketentuan sebagai berikut:`,
    position: 'Jabatan',
    department: 'Departemen',
    location: 'Lokasi kerja',
    status: 'Status kepegawaian',
    start: 'Tanggal mulai bekerja',
    reporting: 'Atasan langsung',
    hours: 'Jam kerja',
    salary: 'Gaji pokok per bulan',
    total: 'Total penghasilan tetap per bulan (bruto)',
    type: {
      'Full-time': (p) => `Karyawan tetap (PKWTT)${p ? ` dengan masa percobaan ${p} bulan` : ''}`,
      Contract: (_, c) => `Karyawan kontrak (PKWT) selama ${c} bulan`,
      Internship: () => 'Program magang',
      'Part-time': () => 'Karyawan paruh waktu'
    },
    benefits: 'Fasilitas dan tunjangan lainnya:',
    additional: 'Ketentuan tambahan:',
    tax: 'Seluruh penghasilan di atas merupakan penghasilan bruto dan dikenakan PPh 21 sesuai ketentuan yang berlaku.',
    validity: (d) =>
      `Penawaran ini berlaku sampai dengan tanggal ${d}. Apabila Saudara/i menyetujui penawaran ini, mohon menandatangani pernyataan persetujuan di bawah dan mengirimkannya kembali kepada kami sebelum tanggal tersebut.`,
    regulation: 'Hal-hal yang belum diatur dalam surat ini mengacu pada Perjanjian Kerja, Peraturan Perusahaan, dan peraturan perundang-undangan yang berlaku.',
    closing: 'Kami menantikan kehadiran Saudara/i sebagai bagian dari keluarga besar MRA Group.',
    regards: 'Hormat kami,',
    acceptTitle: 'PERNYATAAN PERSETUJUAN',
    acceptText: (pt) => `Saya yang bertanda tangan di bawah ini menyatakan menerima penawaran kerja dari ${pt} sesuai ketentuan dalam surat ini.`,
    name: 'Nama',
    signature: 'Tanda tangan',
    date: 'Tanggal',
    place: 'Jakarta',
    locale: 'id-ID'
  },
  en: {
    title: 'OFFER OF EMPLOYMENT',
    no: 'Ref.',
    subject: (p) => `Subject: Offer of Employment — ${p}`,
    to: 'To',
    greet: (n) => `Dear ${n},`,
    intro: (pt) => `Following the selection process, ${pt} is pleased to offer you the following position:`,
    position: 'Position',
    department: 'Department',
    location: 'Work location',
    status: 'Employment status',
    start: 'Start date',
    reporting: 'Reporting to',
    hours: 'Working hours',
    salary: 'Monthly base salary',
    total: 'Total fixed monthly income (gross)',
    type: {
      'Full-time': (p) => `Permanent employee (PKWTT)${p ? ` with a ${p}-month probation period` : ''}`,
      Contract: (_, c) => `Fixed-term employee (PKWT) for ${c} months`,
      Internship: () => 'Internship programme',
      'Part-time': () => 'Part-time employee'
    },
    benefits: 'Other benefits:',
    additional: 'Additional terms:',
    tax: 'All amounts above are gross and subject to income tax (PPh 21) under the applicable regulations.',
    validity: (d) => `This offer is valid until ${d}. If you accept it, please sign the acceptance below and return it to us before that date.`,
    regulation: 'Matters not covered by this letter follow the Employment Agreement, the Company Regulations and the applicable laws.',
    closing: 'We look forward to welcoming you to MRA Group.',
    regards: 'Yours sincerely,',
    acceptTitle: 'ACCEPTANCE',
    acceptText: (pt) => `I, the undersigned, accept the offer of employment from ${pt} under the terms of this letter.`,
    name: 'Name',
    signature: 'Signature',
    date: 'Date',
    place: 'Jakarta',
    locale: 'en-GB'
  }
};

const idr = (n) => `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;
const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

/**
 * @param {object} letter   OfferLetter fields (dates as Date or YYYY-MM-DD, amounts as numbers)
 * @param {object} company  { name, address, npwp } or null
 * @param {Date}   [issued] letter date (default: createdAt / today)
 */
function buildOfferDocument(letter, company, issued) {
  const t = T[letter.language] || T.id;
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(t.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—');
  const pt = (company && company.name) || 'MRA Group';
  const allowances = (Array.isArray(letter.allowances) ? letter.allowances : []).filter((a) => a && a.label);
  const salary = Number(letter.baseSalary) || 0;
  const total = salary + allowances.reduce((n, a) => n + (Number(a.amount) || 0), 0);
  const typeText = (t.type[letter.employmentType] || t.type['Full-time'])(letter.probationMonths, letter.contractMonths);
  const date = issued || letter.createdAt || new Date();

  const terms = [
    [t.position, letter.positionTitle],
    letter.department ? [t.department, letter.department] : null,
    [t.location, letter.workLocation],
    [t.status, typeText],
    [t.start, fmt(letter.startDate)],
    letter.reportingTo ? [t.reporting, letter.reportingTo] : null,
    letter.workingHours ? [t.hours, letter.workingHours] : null
  ].filter(Boolean).map(([label, value]) => ({ label, value }));

  const pay = [{ label: t.salary, value: idr(salary) }, ...allowances.map((a) => ({ label: a.label, value: idr(a.amount) }))];

  return {
    language: letter.language === 'en' ? 'en' : 'id',
    letterhead: { name: pt, address: (company && company.address) || '', npwp: (company && company.npwp) || '' },
    title: t.title,
    reference: { label: t.no, value: letter.letterNo || '(draft)' },
    placeDate: `${t.place}, ${new Date(date).toLocaleDateString(t.locale, { day: 'numeric', month: 'long', year: 'numeric' })}`,
    recipient: { heading: t.to, name: letter.candidateName, lines: [letter.candidateAddress, letter.candidateEmail].filter(Boolean) },
    subject: t.subject(letter.positionTitle),
    greeting: t.greet(letter.candidateName),
    intro: t.intro(pt),
    terms,
    pay,
    total: allowances.length ? { label: t.total, value: idr(total) } : null,
    benefits: { heading: t.benefits, items: lines(letter.benefits) },
    additional: { heading: t.additional, items: lines(letter.additionalTerms) },
    paragraphs: [t.tax, t.validity(fmt(letter.validUntil)), t.regulation, t.closing],
    signoff: { regards: t.regards, company: pt, name: letter.signatoryName, title: letter.signatoryTitle },
    acceptance: { title: t.acceptTitle, text: t.acceptText(pt), fields: [t.name, t.signature, t.date], name: letter.candidateName }
  };
}

module.exports = { buildOfferDocument, idr };
