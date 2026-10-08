// Builds docs/HR-HUB-Panduan-Pengguna.docx from docs/guides/*/README.md (+ an introduction chapter).
// Usage (in docs/tools): npm install, then npm run build. See docs/tools/README.md.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ShadingType,
  BorderStyle, ImageRun, PageBreak, TableOfContents, Header, Footer, PageNumber, LevelFormat, TabStopType
} = require('docx');

const ROOT = path.resolve(__dirname, '../..');
const GUIDES = path.join(ROOT, 'docs/guides');
const OUT = path.join(ROOT, 'docs/HR-HUB-Panduan-Pengguna.docx');

const SLATE = '0F172A';
const MUTED = '64748B';
const BLUE = '2563EB';
const LINE = 'CBD5E1';
const FONT = 'Calibri';
const PAGE_W = 11906; // A4
const MARGIN = 1134; // 2 cm
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9638 DXA
const IMG_W = 600; // px

const CHAPTERS = [
  { key: 'intro', title: 'Pendahuluan' },
  { key: 'dashboard', title: 'Recruitment Dashboard' },
  { key: 'manpower-request', title: 'Manpower Request' },
  { key: 'job-management', title: 'Manage ATS Jobs' },
  { key: 'applicant-pipeline', title: 'Applicant Pipeline' },
  { key: 'candidate-database', title: 'Database & Profiles' },
  { key: 'talent-pool', title: 'Talent Pool Matching' },
  { key: 'interview-calendar', title: 'Interview Calendar' },
  { key: 'offer-letters', title: 'Offer Letters' },
  { key: 'new-employees', title: 'New Employees' },
  { key: 'onboarding', title: 'Onboarding' }
];
const chapterNo = Object.fromEntries(CHAPTERS.map((c, i) => [c.key, i + 1]));

const INTRO = `# Pendahuluan

**HR HUB · MRA Group** — untuk seluruh pengguna CMS HR HUB

## Tentang HR HUB

HR HUB adalah sistem rekrutmen terpadu MRA Group. Seluruh proses mencari dan menerima karyawan baru dikerjakan di satu tempat: mulai dari permintaan tambahan orang, lowongan di portal karier, penyaringan CV otomatis (ATS), interview, surat penawaran, sampai karyawan baru selesai onboarding dan datanya dikirim ke Talenta.

Manfaat utama bagi tim:

- **Satu sumber data.** Semua pelamar, jadwal, keputusan, dan dokumen tersimpan di HR HUB, bukan tersebar di email, chat, dan spreadsheet.
- **Penyaringan otomatis.** Setiap CV dinilai terhadap kriteria lowongan (skor ATS 0–100), sehingga kandidat terbaik terlihat lebih dulu.
- **Proses yang terkendali.** Setiap tahap punya syarat (jadwal interview, gaji yang disetujui, konfirmasi Hiring Manager), dan setiap perubahan tercatat siapa yang melakukannya dan kapan.
- **Pengingat otomatis.** Lonceng di kanan atas memberi tahu apa yang perlu Anda kerjakan hari ini.

## Masuk ke HR HUB

1. Buka alamat CMS HR HUB yang diberikan tim IT, lalu halaman **/admin/login**.
2. Masukkan email kantor (\`@mragroup.co.id\`) dan kata sandi Anda, lalu klik **Masuk**.
3. Setelah masuk, menu di sisi kiri menyesuaikan dengan peran Anda. Menu yang tidak sesuai hak akses Anda tidak ditampilkan.

> Lupa kata sandi atau perlu akses tambahan? Hubungi Super Admin (HR Director). Akun tidak pernah dihapus, hanya dinonaktifkan, dan perubahan peran langsung berlaku.

Bagian layar yang selalu tersedia:

| Bagian | Fungsi |
|---|---|
| **Menu kiri** | Dikelompokkan menjadi *Recruitment*, *People*, dan *Administration*. Tombol di pojok kiri atas memperkecil menu. |
| **Lonceng 🔔** | Pengingat tugas Anda (persetujuan, kandidat tertahan, interview, offer letter, dan lainnya). Angka oranye = pengingat yang belum dilihat. |
| **Hide identity** | Menyamarkan nama PT, brand, dan logo MRA di layar untuk keperluan presentasi atau screenshot. Data tidak berubah. |
| **Download Master Template (.xlsx)** | Template Excel untuk input pelamar secara massal. |
| **Log out** | Keluar dari HR HUB. |

## Peran & hak akses

| Peran | Untuk siapa | Yang bisa dilakukan |
|---|---|---|
| **Super Admin** | HR Director | Semua menu, termasuk pengguna, data PT, dan konfirmasi hire. |
| **TA Lead** | Kepala tim Talent Acquisition | Mengelola lowongan, membagi kandidat ke Recruiter, menyetujui gaji di atas budget dan manpower request, memantau kinerja tim, mengirim data ke Talenta. |
| **Recruiter (TA)** | Tim Talent Acquisition | Mengambil kandidat dari antrean, memproses kandidat miliknya, menjadwalkan interview, membuat offer letter, mendaftarkan karyawan baru miliknya. |
| **Hiring Manager** | Atasan unit / user | Melihat kandidat untuk lowongannya, mengajukan manpower request, mengonfirmasi hire, mengerjakan tugas onboarding bagian Manager. |

> Hiring Manager hanya melihat data lowongan yang ditugaskan kepadanya, ditambah lowongan yang belum memiliki Hiring Manager.

## Alur rekrutmen dari awal sampai akhir

\`\`\`
 1 Manpower Request ─▶ 2 Lowongan dibuka ─▶ 3 Pelamar masuk ─▶ 4 Pipeline seleksi
   (Hiring Manager)      (Manage ATS Jobs)    (portal / CV /      (Claim, ATS Screened,
                                               template Excel)     Shortlisted, Interview)
                                                     ▲                     │
                          Talent Pool Matching ──────┘                     ▼
                          (kandidat lama yang cocok)        5 Interview Calendar
                                                                           │
 8 Onboarding ◀── 7 New Employees ◀── 6 Hired ◀── Offer Letter ◀── Offering
   (checklist)     (register,          (konfirmasi    (PDF, kirim,
                    announce, Talenta)  Hiring Manager) jawaban)
\`\`\`

| Langkah | Menu | Bab |
|---|---|---|
| Hiring Manager meminta tambahan orang, TA Lead menyetujui | Manpower Requests | Bab ${chapterNo['manpower-request']} |
| Lowongan dibuat beserta kriteria ATS dan tayang di portal karier | Manage ATS Jobs | Bab ${chapterNo['job-management']} |
| Kandidat lama yang cocok dimasukkan ke lowongan baru | Talent Pool Matching | Bab ${chapterNo['talent-pool']} |
| Pelamar diproses tahap demi tahap oleh Recruiter | Applicant Pipeline | Bab ${chapterNo['applicant-pipeline']} |
| Profil dan riwayat kandidat diperiksa | Database & Profiles | Bab ${chapterNo['candidate-database']} |
| Interview HR dan interview user dijadwalkan | Interview Calendar | Bab ${chapterNo['interview-calendar']} |
| Surat penawaran dibuat dan dikirim | Offer Letters | Bab ${chapterNo['offer-letters']} |
| Kandidat diterima didaftarkan sebagai karyawan dan dikirim ke Talenta | New Employees | Bab ${chapterNo['new-employees']} |
| Checklist hari pertama sampai masa percobaan | Onboarding | Bab ${chapterNo.onboarding} |
| Pantauan menyeluruh dan laporan | Recruitment Dashboard | Bab ${chapterNo.dashboard} |

## Istilah penting

| Istilah | Arti |
|---|---|
| **ATS score** | Skor 0–100 kecocokan kandidat dengan lowongan: 55% keahlian (kata kunci), 30% pengalaman, 15% pendidikan. Hijau ≥85 *Top Match*, biru 70–84 *Qualified*, oranye <70 *Needs Review*. |
| **PIC** | Recruiter penanggung jawab satu kandidat. Hanya PIC (atau TA Lead) yang memproses kandidat tersebut. |
| **Claim** | Mengambil kandidat dari antrean tanpa PIC sehingga menjadi milik Anda. |
| **Stage gate** | Syarat yang harus diisi saat memindahkan kandidat ke tahap tertentu (misalnya jadwal interview atau gaji). |
| **Stalled** | Kandidat yang tidak berpindah tahap selama 7 hari atau lebih (kritis setelah 14 hari). |
| **Approval** | Persetujuan yang dibutuhkan sebelum perpindahan tahap diterapkan: gaji di atas budget (TA Lead) dan hire (Hiring Manager). |
| **Talent Pool** | Tempat menyimpan kandidat bagus yang belum cocok dengan lowongan saat ini, untuk lowongan berikutnya. |
| **Silver medalist** | Kandidat yang ditolak setelah sampai tahap interview atau lebih. |
| **PT** | Badan hukum di lingkungan MRA Group yang merekrut dan mengontrak karyawan. |
| **Probation** | Masa percobaan karyawan baru, standar 3 bulan. |
| **Talenta** | Sistem HRIS / payroll (Mekari Talenta) tempat data karyawan baru dikirim. |

## Cara membaca panduan ini

- Setiap bab membahas satu menu dan bisa dibaca terpisah. Bab dimulai dengan untuk siapa menu itu, lalu langkah-langkahnya dengan screenshot.
- Tulisan **tebal** menunjukkan nama tombol, menu, atau isian di layar. Tanda \\* pada tabel isian berarti wajib diisi.
- Kotak bergaris biru berisi catatan atau tips penting.
- Screenshot diambil dari data contoh. Nama kandidat dan angka di layar Anda akan berbeda.
`;

// ---------- inline markdown → runs ----------
function runs(text, base = {}) {
  const out = [];
  // links → their text
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
    const g = /\.\.\/([a-z-]+)\/README\.md/.exec(href);
    if (g && chapterNo[g[1]]) return `${label} (Bab ${chapterNo[g[1]]})`;
    return label;
  });
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith('**')) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else if (t.startsWith('`')) out.push(new TextRun({ text: t.slice(1, -1), font: 'Consolas', size: 18, color: '1E3A8A', ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: LINE };
function table(rows) {
  const cols = rows[0].length;
  // width by content length (header + body), bounded
  const len = Array.from({ length: cols }, (_, i) => Math.max(...rows.map((r) => (r[i] || '').replace(/\*|`/g, '').length)));
  const weight = len.map((l) => Math.min(Math.max(l, 4), 60));
  const sum = weight.reduce((a, b) => a + b, 0);
  let widths = weight.map((w) => Math.floor((w / sum) * CONTENT_W));
  widths = widths.map((w) => Math.max(w, 900));
  const scale = CONTENT_W / widths.reduce((a, b) => a + b, 0);
  widths = widths.map((w) => Math.floor(w * scale));
  widths[widths.length - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  const narrow = (i) => len[i] <= 3; // ✓ / – columns
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, ri) =>
      new TableRow({
        tableHeader: ri === 0,
        cantSplit: true,
        children: r.map((c, ci) =>
          new TableCell({
            width: { size: widths[ci], type: WidthType.DXA },
            shading: ri === 0 ? { type: ShadingType.CLEAR, fill: '1E293B', color: 'auto' } : ri % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F8FAFC', color: 'auto' } : undefined,
            borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: ri > 0 && narrow(ci) ? AlignmentType.CENTER : AlignmentType.LEFT,
                spacing: { before: 0, after: 0 },
                children: runs(c, ri === 0 ? { bold: true, color: 'FFFFFF', size: 19 } : { size: 19 })
              })
            ]
          })
        )
      })
    )
  });
}

let numberInstance = 0;
let figure = 0;
function convert(md, chapter, dir) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let section = 0;
  let skipToc = false;
  let i = 0;
  let listInstance = null;
  figure = 0;
  const para = (children, opts = {}) => new Paragraph({ children, spacing: { after: 120, line: 276 }, ...opts });

  while (i < lines.length) {
    let line = lines[i];
    if (skipToc) {
      if (/^## /.test(line) || /^---/.test(line)) skipToc = false;
      else { i++; continue; }
    }
    // a numbered list continues across blank lines and its nested bullets
    if (!/^\s*\d+\.\s/.test(line) && !/^\s+[-*] /.test(line) && line.trim() !== '') listInstance = null;

    if (/^# /.test(line)) {
      out.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun(`${chapter}. ${chapterTitle(chapter)}`)] }));
      i++;
      continue;
    }
    if (/^## /.test(line)) {
      const title = line.slice(3).replace(/^\d+\.\s*/, '').trim();
      if (/^Daftar isi$/i.test(title)) { skipToc = true; i++; continue; }
      section += 1;
      out.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`${chapter}.${section}  ${title}`)] }));
      i++;
      continue;
    }
    if (/^### /.test(line)) {
      out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(line.slice(4).replace(/^\d+(\.\d+)*\s*/, '').trim())] }));
      i++;
      continue;
    }
    if (/^---\s*$/.test(line) || /^\s*$/.test(line)) { i++; continue; }

    // audience line
    if (/^\*\*HR HUB · MRA Group\*\* — /.test(line)) {
      out.push(para(runs(line.replace(/^\*\*HR HUB · MRA Group\*\* — /, 'Pengguna: '), { italics: true, color: MUTED }), { spacing: { after: 200 } }));
      i++;
      continue;
    }
    // menu path line
    if (/^Menu: /.test(line)) {
      out.push(new Paragraph({
        spacing: { before: 60, after: 200 },
        shading: { type: ShadingType.CLEAR, fill: 'EFF6FF', color: 'auto' },
        border: { left: { style: BorderStyle.SINGLE, size: 18, color: BLUE, space: 6 } },
        children: runs(line, { size: 20 })
      }));
      i++;
      continue;
    }
    // image
    const img = /^!\[([^\]]*)\]\(([^)]+)\)/.exec(line);
    if (img) {
      const file = path.join(dir, img[2]);
      if (fs.existsSync(file)) {
        const buf = fs.readFileSync(file);
        const w = buf.readUInt32BE(16);
        const h = buf.readUInt32BE(20);
        figure += 1;
        out.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          keepNext: true,
          spacing: { before: 120, after: 60 },
          children: [new ImageRun({ type: 'png', data: buf, transformation: { width: IMG_W, height: Math.round((IMG_W * h) / w) }, altText: { title: img[1], description: img[1], name: path.basename(file) } })]
        }));
        out.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `Gambar ${chapter}.${figure} — ${img[1]}`, italics: true, size: 18, color: MUTED })] }));
      }
      i++;
      continue;
    }
    // table
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      out.push(table(rows));
      out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      continue;
    }
    // code block (flow diagrams)
    if (/^```/.test(line)) {
      i++;
      const block = [];
      while (i < lines.length && !/^```/.test(lines[i])) block.push(lines[i++]);
      i++;
      block.forEach((b, bi) =>
        out.push(new Paragraph({
          spacing: { before: 0, after: 0, line: 240 },
          shading: { type: ShadingType.CLEAR, fill: 'F8FAFC', color: 'auto' },
          keepLines: true,
          keepNext: bi < block.length - 1,
          children: [new TextRun({ text: b || ' ', font: 'Consolas', size: 15, color: SLATE })]
        }))
      );
      out.push(new Paragraph({ spacing: { after: 160 }, children: [] }));
      continue;
    }
    // blockquote (may span several lines)
    if (/^>/.test(line)) {
      const parts = [];
      while (i < lines.length && /^>/.test(lines[i])) {
        const t = lines[i].replace(/^>\s?/, '');
        if (t.trim()) parts.push(t);
        i++;
      }
      parts.forEach((t, pi) =>
        out.push(new Paragraph({
          spacing: { before: pi === 0 ? 120 : 40, after: pi === parts.length - 1 ? 200 : 40 },
          shading: { type: ShadingType.CLEAR, fill: 'EFF6FF', color: 'auto' },
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: BLUE, space: 8 } },
          indent: { left: 120, right: 120 },
          children: runs(t, { size: 20 })
        }))
      );
      continue;
    }
    // bullets (2-space nesting)
    const b = /^(\s*)[-*] (.*)$/.exec(line);
    if (b) {
      const level = Math.min(Math.floor(b[1].length / 2), 2);
      out.push(new Paragraph({ numbering: { reference: 'bullets', level }, spacing: { after: 60, line: 276 }, children: runs(b[2]) }));
      i++;
      continue;
    }
    const n = /^(\s*)(\d+)\. (.*)$/.exec(line);
    if (n) {
      if (listInstance === null) listInstance = ++numberInstance;
      out.push(new Paragraph({ numbering: { reference: 'numbers', level: 0, instance: listInstance }, spacing: { after: 60, line: 276 }, children: runs(n[3]) }));
      i++;
      // keep the same list across indented continuation lines
      continue;
    }
    // FAQ question lines are bold paragraphs already; plain paragraph
    out.push(para(runs(line.trim())));
    i++;
  }
  return out;
}
const chapterTitle = (no) => CHAPTERS[no - 1].title;

// ---------- cover ----------
const logo = fs.readFileSync(path.join(ROOT, 'frontend/public/mra_logo.png'));
const lw = logo.readUInt32BE(16);
const lh = logo.readUInt32BE(20);
const cover = [
  new Paragraph({ spacing: { before: 2400, after: 600 }, children: [new ImageRun({ type: 'png', data: logo, transformation: { width: 180, height: Math.round((180 * lh) / lw) }, altText: { title: 'MRA Group', description: 'Logo MRA Group', name: 'logo' } })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'PANDUAN PENGGUNA', bold: true, size: 24, color: BLUE, characterSpacing: 40 })] }),
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'HR HUB', bold: true, size: 72, color: SLATE })] }),
  new Paragraph({
    spacing: { after: 600 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: BLUE, space: 12 } },
    children: [new TextRun({ text: 'Sistem Rekrutmen, ATS & Onboarding MRA Group', size: 32, color: '334155' })]
  }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Untuk: ', bold: true, size: 22, color: SLATE }), new TextRun({ text: 'HR Director, TA Lead, Recruiter (Talent Acquisition), dan Hiring Manager', size: 22, color: '334155' })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Cakupan: ', bold: true, size: 22, color: SLATE }), new TextRun({ text: '10 menu utama, dari Manpower Request sampai Onboarding', size: 22, color: '334155' })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Versi: ', bold: true, size: 22, color: SLATE }), new TextRun({ text: '1.0 · Oktober 2026', size: 22, color: '334155' })] }),
  new Paragraph({ spacing: { before: 2400 }, children: [new TextRun({ text: 'PT Mugi Rekso Abadi · IT Shared Service', size: 20, color: MUTED })] }),
  new Paragraph({ children: [new TextRun({ text: 'Dokumen internal. Screenshot menggunakan data contoh.', size: 18, italics: true, color: MUTED })] })
];

const tocPage = [
  new Paragraph({ pageBreakBefore: true, spacing: { after: 240 }, children: [new TextRun({ text: 'Daftar Isi', bold: true, size: 36, color: SLATE })] }),
  new TableOfContents('Daftar Isi', { hyperlink: true, headingStyleRange: '1-2' })
];

// ---------- chapters ----------
const body = [];
CHAPTERS.forEach((c, idx) => {
  const no = idx + 1;
  if (c.key === 'intro') body.push(...convert(INTRO, no, GUIDES));
  else {
    const dir = path.join(GUIDES, c.key);
    body.push(...convert(fs.readFileSync(path.join(dir, 'README.md'), 'utf8'), no, dir));
  }
});

const doc = new Document({
  creator: 'HR HUB · MRA Group',
  title: 'Panduan Pengguna HR HUB',
  description: 'Panduan pengguna menu utama HR HUB MRA Group',
  styles: {
    default: { document: { run: { font: FONT, size: 21, color: '1E293B' } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 40, bold: true, color: SLATE, font: FONT }, paragraph: { spacing: { before: 0, after: 240 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 8 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 28, bold: true, color: BLUE, font: FONT }, paragraph: { spacing: { before: 360, after: 140 }, outlineLevel: 1, keepNext: true } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: SLATE, font: FONT }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2, keepNext: true } }
    ]
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [0, 1, 2].map((level) => ({ level, format: LevelFormat.BULLET, text: ['•', '◦', '▪'][level], alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360 + level * 360, hanging: 260 } } } }))
      },
      {
        reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }]
      }
    ]
  },
  sections: [
    {
      properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } }, titlePage: true },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
            tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
            children: [new TextRun({ text: 'Panduan Pengguna HR HUB', size: 16, color: MUTED }), new TextRun({ text: '\tMRA Group', size: 16, color: MUTED })]
          })]
        }),
        first: new Header({ children: [new Paragraph({ children: [] })] })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Halaman ', PageNumber.CURRENT, ' dari ', PageNumber.TOTAL_PAGES], size: 16, color: MUTED })] })]
        }),
        first: new Footer({ children: [new Paragraph({ children: [] })] })
      },
      children: [...cover, ...tocPage, ...body]
    }
  ]
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log('written', OUT, (buf.length / 1048576).toFixed(1) + ' MB');
});
