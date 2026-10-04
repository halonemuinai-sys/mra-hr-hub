const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const OUTPUT_DIR = path.join(__dirname, '../../sample_cv_ats');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const SAMPLES = [
  {
    fileName: '01_Senior_Frontend_Developer_Budi_Pratama',
    fullName: 'Budi Pratama, S.Kom.',
    roleTitle: 'Senior Frontend Developer',
    email: 'budi.pratama@mra.co.id',
    phone: '+6281234567890',
    location: 'Jakarta Selatan, Indonesia',
    linkedin: 'linkedin.com/in/budipratama-dev',
    summary: 'Senior Frontend Developer dengan 5+ tahun pengalaman merancang dan mengoptimalkan arsitektur web berskala besar menggunakan React, Next.js, TypeScript, dan Tailwind CSS. Berpengalaman memimpin tim engineering, mengintegrasikan REST API & microservices, serta meningkatkan performa aplikasi (Core Web Vitals) hingga 45%. Terbiasa bekerja dengan metodologi Agile CI/CD dan containerization Docker.',
    skills: [
      'React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'REST API',
      'JavaScript', 'Node.js', 'PostgreSQL', 'Docker', 'Git',
      'CI/CD', 'GraphQL', 'State Management', 'HTML', 'CSS'
    ],
    experiences: [
      {
        role: 'Senior Frontend Developer',
        company: 'PT Digital Solusi Nusantara — Jakarta',
        period: '2022 - Sekarang (2 Tahun)',
        bullets: [
          'Memimpin pengembangan web portal enterprise berbasis Next.js 14, TypeScript, dan Tailwind CSS dengan 200k+ MAU.',
          'Mengimplementasikan arsitektur modular komponen UI dan REST API integration yang menurunkan response time sebesar 35%.',
          'Menerapkan automated testing dan CI/CD pipeline menggunakan Git & Docker untuk mempercepat deployment cycle.'
        ]
      },
      {
        role: 'Frontend Web Developer',
        company: 'PT Kreasi Inovasi Media — Jakarta Selatan',
        period: '2019 - 2022 (3 Tahun)',
        bullets: [
          'Membangun 15+ aplikasi web interaktif responsif menggunakan React, Redux, dan modern CSS.',
          'Berkolaborasi erat dengan tim UI/UX dan backend developer untuk standardisasi design system korporat.',
          'Mengoptimalkan database query PostgreSQL dan caching Redis pada server integration.'
        ]
      }
    ],
    education: {
      degree: 'Sarjana Komputer (S1) Teknik Informatika',
      institution: 'Universitas Indonesia (UI) — Depok',
      year: '2015 - 2019 (IPK: 3.75 / 4.00)'
    }
  },
  {
    fileName: '02_Luxury_Store_Operations_Manager_Jessica_Tanuwidjaja',
    fullName: 'Jessica Tanuwidjaja, S.E.',
    roleTitle: 'Store Operations Manager (Luxury Retail)',
    email: 'jessica.tanuwidjaja@gmail.com',
    phone: '+6281898765432',
    location: 'Jakarta Pusat, Indonesia',
    linkedin: 'linkedin.com/in/jessicatan-luxuryretail',
    summary: 'Luxury Retail Store Operations Manager berdedikasi tinggi dengan 6+ tahun rekam jejak memimpin operasional butik perhiasan dan high-end fashion di Plaza Indonesia & Pacific Place. Ahli dalam clienteling VVIP, manajemen inventaris bernilai tinggi, visual merchandising berstandar global, dan peningkatan omset ritel (KPI Retail). Terbukti melampaui target sales tahunan hingga 128%.',
    skills: [
      'Store Operations', 'Customer Service', 'POS System', 'Inventory Management',
      'Sales Strategy', 'Luxury Retail', 'Clienteling', 'Visual Merchandising',
      'Stock Opname', 'KPI Retail', 'CRM', 'Staff Leadership'
    ],
    experiences: [
      {
        role: 'Store Operations Manager',
        company: 'Maison Haute Luxury Boutique — Plaza Indonesia',
        period: '2021 - Sekarang (3 Tahun)',
        bullets: [
          'Memimpin penuh operasional harian butik mewah dengan mengawasi 14 VVIP Sales Advisors dan kasir.',
          'Mengelola akurasi stok opname inventaris senilai Rp 45 Miliar dengan tingkat variansi 0.00%.',
          'Mengembangkan program clienteling eksklusif yang meningkatkan repeat order pelanggan VVIP sebesar 40% YoY.'
        ]
      },
      {
        role: 'Assistant Boutique Manager & VIP Clienteling',
        company: 'Prestige Fashion Retail Group — Jakarta Pusat',
        period: '2018 - 2021 (3 Tahun)',
        bullets: [
          'Bertanggung jawab atas pencapaian target sales bulanan toko ritel dengan rata-rata realisasi 115%.',
          'Mengoperasikan POS System dan rekonsiliasi pembayaran harian (split payment, kartu kredit, transfer perbankan).',
          'Melatih 20+ store crew baru dalam standar pelayanan prima dan etika luxury retail hospitality.'
        ]
      }
    ],
    education: {
      degree: 'Sarjana Ekonomi (S1) Manajemen Bisnis',
      institution: 'Universitas Katolik Indonesia Atma Jaya — Jakarta',
      year: '2014 - 2018 (IPK: 3.68 / 4.00)'
    }
  },
  {
    fileName: '03_Radio_Program_Producer_Dimas_Kurniawan',
    fullName: 'Dimas Kurniawan, S.I.Kom.',
    roleTitle: 'Radio Program Producer & Music Director',
    email: 'dimas.kurniawan.media@gmail.com',
    phone: '+6281311223344',
    location: 'Jakarta Selatan, Indonesia',
    linkedin: 'linkedin.com/in/dimaskurniawan-broadcast',
    summary: 'Creative Radio Program Producer & Music Director berpengalaman 4+ tahun mengelola siaran live, kurasi playlist musik tangga lagu, serta aktivasi kampanye brand komersial di stasiun radio komersial terkemuka Jakarta. Menguasai software audio engineering (Pro Tools, Adobe Audition) dan penulisan naskah radio (Scriptwriting). Sukses menaikkan rating program prime-time sebesar 32%.',
    skills: [
      'Radio Broadcasting', 'Audio Production', 'Music Curation', 'Scriptwriting',
      'Creative Content', 'Podcast Production', 'Voice Over', 'Adobe Audition',
      'Social Media Strategy', 'Broadcast Automation', 'Sponsor Activation'
    ],
    experiences: [
      {
        role: 'Radio Program Producer',
        company: 'Suara Gaya Nusantara FM — Jakarta Selatan',
        period: '2022 - Sekarang (2 Tahun)',
        bullets: [
          'Memproduseri program siaran prime-time harian (Morning Show) dengan rata-rata 350.000 pendengar aktif.',
          'Menulis naskah kreatif siaran, talkshow interaktif narasumber artis/tokoh, dan sandiwara komersial.',
          'Mengorkestrasi siaran luar studio (Outside Broadcast) dan aktivasi off-air festival musik.'
        ]
      },
      {
        role: 'Associate Music Director & Audio Engineer',
        company: 'Mega Wave Broadcasting — Jakarta',
        period: '2020 - 2022 (2 Tahun)',
        bullets: [
          'Mengkurasi rotasi playlist musik harian (Top 40 & Alternative) sesuai demografi segmen pendengar muda.',
          'Mengedit jingle, promo station, dan iklan komersial menggunakan Adobe Audition dengan standar broadcast EBU.',
          'Mengembangkan konten podcast tematik yang meraih 50.000+ pendengar bulanan di Spotify & YouTube.'
        ]
      }
    ],
    education: {
      degree: 'Sarjana Ilmu Komunikasi (S1) Penyiaran & Media',
      institution: 'Universitas Bina Nusantara (BINUS) — Jakarta',
      year: '2016 - 2020 (IPK: 3.60 / 4.00)'
    }
  },
  {
    fileName: '04_Restaurant_Operations_Manager_Rian_Hidayat',
    fullName: 'Rian Hidayat, S.Tr.Par.',
    roleTitle: 'Restaurant & F&B Operations Manager',
    email: 'rian.hidayat.fnb@yahoo.com',
    phone: '+6285678901234',
    location: 'Tangerang Selatan, Banten',
    linkedin: 'linkedin.com/in/rianhidayat-fnbops',
    summary: 'Operasional Manager F&B profesional dengan pengalaman 4+ tahun memimpin multi-outlet cafe, gerai es krim premium, dan restoran cepat saji waralaba internasional. Mahir dalam pengendalian biaya makanan (Food Costing), audit standar sanitasi internasional (HACCP), pengelolaan inventaris bahan baku, serta manajemen P&L outlet. Berhasil menekan food waste hingga 12% dan mempertahankan audit kebersihan 98%.',
    skills: [
      'F&B Management', 'Food Costing', 'HACCP', 'Store Operations',
      'Customer Service', 'Inventory Management', 'POS OMEGA', 'P&L Outlet',
      'Staff Training', 'Audit Kebersihan', 'Vendor Relations'
    ],
    experiences: [
      {
        role: 'Restaurant Operations Manager',
        company: 'Artisan Gelato & Cafe Group — Jakarta & Tangerang',
        period: '2022 - Sekarang (2 Tahun)',
        bullets: [
          'Bertanggung jawab atas operasional 3 outlet cafe premium dengan mengawasi 28 barista dan crew.',
          'Menerapkan SOP kontrol food cost ketat yang sukses menurunkan cost of goods sold (COGS) dari 34% ke 29%.',
          'Memastikan kepatuhan standar sanitasi HACCP dan sertifikasi halal MUI di seluruh cabang operasional.'
        ]
      },
      {
        role: 'Assistant Outlet Manager',
        company: 'Global Franchise Bakery & Cafe — Tangerang',
        period: '2020 - 2022 (2 Tahun)',
        bullets: [
          'Mengelola stok opname bahan baku harian/mingguan dan rekonsiliasi kasir melalui sistem POS OMEGA.',
          'Memberikan pelatihan service excellence kepada 15 crew kasir dan barista untuk menjamin kepuasan tamu.',
          'Menyusun jadwal shift kerja karyawan dan evaluasi kinerja bulanan (KPI Karyawan).'
        ]
      }
    ],
    education: {
      degree: 'Sarjana Terapan Pariwisata (D4/S1) Manajemen Tata Hidang',
      institution: 'Politeknik Pariwisata NHI — Bandung',
      year: '2016 - 2020 (IPK: 3.55 / 4.00)'
    }
  },
  {
    fileName: '05_Legal_Compliance_Specialist_Nadia_Larasati',
    fullName: 'Nadia Larasati, S.H.',
    roleTitle: 'Legal & Corporate Compliance Specialist',
    email: 'nadia.larasati.legal@lawyer.com',
    phone: '+6281122334455',
    location: 'Jakarta Selatan, Indonesia',
    linkedin: 'linkedin.com/in/nadialarasati-legal',
    summary: 'Spesialis Hukum Korporasi & Kepatuhan (Legal & Compliance Specialist) dengan 3+ tahun pengalaman di holding ritel & consumer goods. Mahir dalam legal drafting, peninjauan kontrak komersial (Contract Review), kepatuhan regulasi ketenagakerjaan dan perizinan OSS RBA, penyusunan SOP internal, serta mitigasi risiko hukum bisnis. Terbukti menyelesaikan 250+ review perjanjian kerja sama vendor dan sewa properti tanpa sengketa hukum.',
    skills: [
      'Legal Drafting', 'Contract Review', 'Compliance', 'General Affairs',
      'SOP', 'Litigasi', 'OSS Perizinan', 'Corporate Governance',
      'Hukum Ketenagakerjaan', 'Risk Management', 'Legal Audit'
    ],
    experiences: [
      {
        role: 'Corporate Legal & Compliance Officer',
        company: 'PT Global Retail Mandiri (Holding) — Jakarta',
        period: '2022 - Sekarang (2 Tahun)',
        bullets: [
          'Meninjau dan menyusun 150+ kontrak bisnis per tahun (perjanjian sewa mal, distribusi, keagenan, NDA, dan vendor SLA).',
          'Mengurus perizinan berusaha berbasis risiko melalui OSS RBA (NIB, Izin Lokasi, Sertifikat Standar).',
          'Menyusun Standard Operating Procedure (SOP) tata kelola kepatuhan internal dan audit perlindungan data.'
        ]
      },
      {
        role: 'Junior Legal Associate',
        company: 'Darmawan & Rekan Law Firm — Jakarta Selatan',
        period: '2021 - 2022 (1 Tahun)',
        bullets: [
          'Melakukan riset hukum perdata dan bisnis komersial serta menyiapkan berkas legal opinion bagi klien korporat.',
          'Mendampingi proses perizinan ketenagakerjaan (PP, PKWT/PKWTT) dan mediasi bipartit hubungan industrial.',
          'Mendokumentasikan arsip akta korporat, keputusan sirkuler pemegang saham (RUPS), dan notariil.'
        ]
      }
    ],
    education: {
      degree: 'Sarjana Hukum (S1) Hukum Bisnis & Perdata',
      institution: 'Universitas Padjadjaran (UNPAD) — Bandung',
      year: '2017 - 2021 (IPK: 3.72 / 4.00)'
    }
  }
];

// Helper: Generate Clean ATS-Friendly Text (.txt)
function generateTxt(s) {
  let content = `${s.fullName}\n`;
  content += `${s.roleTitle}\n`;
  content += `${s.email} | ${s.phone} | ${s.location} | ${s.linkedin}\n\n`;

  content += `PROFESSIONAL SUMMARY\n`;
  content += `--------------------\n`;
  content += `${s.summary}\n\n`;

  content += `CORE COMPETENCIES & SKILLS\n`;
  content += `--------------------------\n`;
  content += `${s.skills.join(', ')}\n\n`;

  content += `WORK EXPERIENCE\n`;
  content += `---------------\n`;
  s.experiences.forEach(exp => {
    content += `${exp.role}\n`;
    content += `${exp.company} | ${exp.period}\n`;
    exp.bullets.forEach(b => {
      content += `- ${b}\n`;
    });
    content += `\n`;
  });

  content += `EDUCATION\n`;
  content += `---------\n`;
  content += `${s.education.degree}\n`;
  content += `${s.education.institution} (${s.education.year})\n\n`;

  return content;
}

// Helper: Generate Clean Single-Column ATS-Friendly PDF (.pdf)
function generatePdf(s, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 45, right: 45 }
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Header: Name & Role Title
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f172a').text(s.fullName, { align: 'left' });
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2563eb').text(s.roleTitle, { align: 'left' });
    doc.moveDown(0.3);

    // Contact info
    doc.fontSize(9).font('Helvetica').fillColor('#475569')
      .text(`${s.email}   |   ${s.phone}   |   ${s.location}   |   ${s.linkedin}`);
    doc.moveDown(0.8);

    // Divider Line
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.8);

    // Section 1: Summary
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('PROFESSIONAL SUMMARY');
    doc.strokeColor('#2563eb').lineWidth(1.5).moveTo(45, doc.y + 2).lineTo(180, doc.y + 2).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(s.summary, { align: 'justify', lineGap: 2 });
    doc.moveDown(0.9);

    // Section 2: Core Skills
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('CORE COMPETENCIES & SKILLS');
    doc.strokeColor('#2563eb').lineWidth(1.5).moveTo(45, doc.y + 2).lineTo(220, doc.y + 2).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9.5).font('Helvetica').fillColor('#334155').text(s.skills.join('  •  '), { lineGap: 3 });
    doc.moveDown(0.9);

    // Section 3: Work Experience
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('PROFESSIONAL WORK EXPERIENCE');
    doc.strokeColor('#2563eb').lineWidth(1.5).moveTo(45, doc.y + 2).lineTo(230, doc.y + 2).stroke();
    doc.moveDown(0.5);

    s.experiences.forEach(exp => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(exp.role);
      doc.fontSize(9).font('Helvetica-Oblique').fillColor('#64748b').text(`${exp.company}   (${exp.period})`);
      doc.moveDown(0.3);

      exp.bullets.forEach(b => {
        doc.fontSize(9).font('Helvetica').fillColor('#334155').text(`•  ${b}`, {
          indent: 8,
          lineGap: 2
        });
      });
      doc.moveDown(0.6);
    });

    // Section 4: Education
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('EDUCATION & QUALIFICATION');
    doc.strokeColor('#2563eb').lineWidth(1.5).moveTo(45, doc.y + 2).lineTo(210, doc.y + 2).stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(s.education.degree);
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text(`${s.education.institution} (${s.education.year})`);

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function main() {
  console.log(`Generating 5 ATS-friendly sample resumes in ${OUTPUT_DIR}...`);

  for (const s of SAMPLES) {
    // 1. Write TXT file
    const txtPath = path.join(OUTPUT_DIR, `${s.fileName}.txt`);
    fs.writeFileSync(txtPath, generateTxt(s), 'utf-8');
    console.log(`✓ Created TXT: ${path.basename(txtPath)}`);

    // 2. Write PDF file
    const pdfPath = path.join(OUTPUT_DIR, `${s.fileName}.pdf`);
    await generatePdf(s, pdfPath);
    console.log(`✓ Created PDF: ${path.basename(pdfPath)}`);
  }

  console.log('\nAll 5 ATS sample resumes generated successfully!');
}

main().catch(err => {
  console.error('Error generating sample resumes:', err);
});
