/**
 * Batch 2 — 12 ATS sample resumes for the sample job postings (seedJobSamples.js).
 * Fit varies on purpose so ATS scoring can be compared:
 *   STRONG = matches the must-have skills and experience
 *   MEDIUM = partial skill match or slightly under-experienced
 *   WEAK   = career switcher / under-qualified
 * `target` and `fit` are only used for the generator's index file.
 */
module.exports = [
  {
    fileName: '06_Backend_Engineer_Andre_Wijaya',
    target: 'Backend Engineer (Node.js)',
    fit: 'STRONG',
    fullName: 'Andre Wijaya, S.Kom.',
    roleTitle: 'Backend Engineer (Node.js)',
    email: 'andre.wijaya.dev@gmail.com',
    phone: '+6281311223344',
    location: 'Jakarta Selatan, Indonesia',
    linkedin: 'linkedin.com/in/andrewijaya-backend',
    summary: 'Backend Engineer dengan 5 tahun pengalaman membangun REST API dan microservices berbasis Node.js, Express, PostgreSQL, dan Prisma. Terbiasa merancang skema database, caching Redis, serta deployment Docker dengan CI/CD di AWS. Fokus pada performa, keamanan, dan kode yang mudah dirawat.',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'Prisma', 'REST API', 'TypeScript', 'Redis', 'Docker', 'AWS', 'CI/CD', 'Git', 'Microservices', 'Problem Solving'],
    experiences: [
      {
        role: 'Backend Engineer',
        company: 'PT Kasir Pintar Indonesia — Jakarta',
        period: '2022 - Sekarang',
        bullets: [
          'Merancang 40+ endpoint REST API Node.js/Express dengan Prisma ORM untuk 1.200 merchant aktif.',
          'Menurunkan latensi rata-rata API sebesar 38% melalui indexing PostgreSQL dan caching Redis.',
          'Menyusun pipeline CI/CD dan containerization Docker untuk deployment ke AWS ECS.'
        ]
      },
      {
        role: 'Junior Backend Developer',
        company: 'PT Solusi Data Prima — Tangerang',
        period: '2020 - 2022',
        bullets: [
          'Mengembangkan microservices pembayaran dan integrasi webhook pihak ketiga.',
          'Menulis unit test dan dokumentasi API (OpenAPI) bersama tim QA.'
        ]
      }
    ],
    education: {
      degree: 'Sarjana Komputer (S1) Ilmu Komputer',
      institution: 'Universitas Bina Nusantara — Jakarta',
      year: '2016 - 2020 (IPK: 3.61 / 4.00)'
    }
  },
  {
    fileName: '07_Backend_Engineer_Sinta_Maharani',
    target: 'Backend Engineer (Node.js)',
    fit: 'MEDIUM',
    fullName: 'Sinta Maharani, S.T.',
    roleTitle: 'Web Developer (PHP / Laravel)',
    email: 'sinta.maharani.web@yahoo.com',
    phone: '+6285722113344',
    location: 'Bandung, Indonesia',
    linkedin: 'linkedin.com/in/sintamaharani',
    summary: 'Web Developer dengan 3 tahun pengalaman utama di PHP Laravel dan MySQL, serta mulai menggunakan Node.js untuk layanan internal. Terbiasa membangun REST API, panel admin, dan integrasi payment gateway. Sedang memperdalam PostgreSQL dan arsitektur microservices.',
    skills: ['PHP', 'Laravel', 'MySQL', 'REST API', 'JavaScript', 'Node.js', 'Git', 'HTML', 'CSS', 'Teamwork'],
    experiences: [
      {
        role: 'Web Developer',
        company: 'PT Karya Digital Bandung — Bandung',
        period: '2022 - Sekarang',
        bullets: [
          'Membangun aplikasi inventory dan e-commerce berbasis Laravel + MySQL untuk 6 klien UMKM.',
          'Membuat layanan notifikasi kecil berbasis Node.js untuk antrean email.'
        ]
      },
      {
        role: 'Web Developer Intern',
        company: 'CV Kreatif Kode — Bandung',
        period: '2021 - 2022',
        bullets: ['Membantu pengembangan landing page dan integrasi REST API sederhana.']
      }
    ],
    education: {
      degree: 'Sarjana Teknik (S1) Teknik Informatika',
      institution: 'Universitas Pasundan — Bandung',
      year: '2017 - 2021 (IPK: 3.34 / 4.00)'
    }
  },
  {
    fileName: '08_Boutique_Sales_Advisor_Clarissa_Halim',
    target: 'Boutique Sales Advisor (BVLGARI)',
    fit: 'STRONG',
    fullName: 'Clarissa Halim, S.E.',
    roleTitle: 'Senior Sales Associate (Luxury Jewelry)',
    email: 'clarissa.halim.lux@gmail.com',
    phone: '+6281299887711',
    location: 'Jakarta Pusat, Indonesia',
    linkedin: 'linkedin.com/in/clarissahalim',
    summary: 'Senior Sales Associate dengan 4 tahun pengalaman di butik perhiasan dan jam tangan mewah. Ahli clienteling untuk nasabah VIC, menjaga hubungan jangka panjang melalui CRM, dan konsisten melampaui target penjualan bulanan. Fasih berbahasa Inggris dan Mandarin percakapan.',
    skills: ['Clienteling', 'Luxury Retail', 'Sales Strategy', 'Customer Service', 'CRM', 'Upselling', 'Product Presentation', 'POS System', 'Communication', 'Negotiation'],
    experiences: [
      {
        role: 'Senior Sales Associate',
        company: 'Maison Joaillerie Butik — Pacific Place, Jakarta',
        period: '2022 - Sekarang',
        bullets: [
          'Mencapai 128% target penjualan tahunan 2025 melalui program clienteling nasabah VIC.',
          'Mengelola 300+ profil pelanggan di CRM dan private viewing koleksi musiman.'
        ]
      },
      {
        role: 'Sales Associate',
        company: 'Butik Jam Tangan Swiss — Plaza Senayan, Jakarta',
        period: '2020 - 2022',
        bullets: ['Melayani pelanggan premium, product presentation, dan transaksi POS harian.']
      }
    ],
    education: {
      degree: 'Sarjana Ekonomi (S1) Manajemen Pemasaran',
      institution: 'Universitas Trisakti — Jakarta',
      year: '2016 - 2020 (IPK: 3.48 / 4.00)'
    }
  },
  {
    fileName: '09_Retail_Area_Manager_I_Gede_Putra',
    target: 'Retail Area Manager (Bali)',
    fit: 'STRONG',
    fullName: 'I Gede Putra Mahendra, S.E., M.M.',
    roleTitle: 'Retail Area Manager',
    email: 'gede.putra.retail@outlook.com',
    phone: '+6281338445566',
    location: 'Denpasar, Bali',
    linkedin: 'linkedin.com/in/gedeputra-retail',
    summary: 'Retail Area Manager dengan 9 tahun pengalaman memimpin 7 toko fashion dan duty-free di Bali. Bertanggung jawab atas P&L analysis, store operations, inventory management, dan pengembangan tim. Berhasil menaikkan sales per square meter 22% dalam dua tahun.',
    skills: ['Store Operations', 'Retail Management', 'P&L Analysis', 'Inventory Management', 'Stock Opname', 'KPI Retail', 'Visual Merchandising', 'Leadership', 'Budgeting', 'Microsoft Excel'],
    experiences: [
      {
        role: 'Area Manager — Bali Region',
        company: 'PT Duty Free Nusantara — Bali',
        period: '2020 - Sekarang',
        bullets: [
          'Memimpin 7 toko dan 65 staf, mengelola P&L regional senilai Rp 48 miliar per tahun.',
          'Menurunkan selisih stock opname dari 1,8% menjadi 0,4% melalui SOP inventory baru.'
        ]
      },
      {
        role: 'Store Manager',
        company: 'PT Fashion Retail Indonesia — Kuta, Bali',
        period: '2016 - 2020',
        bullets: ['Mengelola operasional toko flagship, visual merchandising, dan KPI retail harian.']
      }
    ],
    education: {
      degree: 'Magister Manajemen (S2) Manajemen Ritel',
      institution: 'Universitas Udayana — Denpasar',
      year: '2014 - 2016'
    }
  },
  {
    fileName: '10_Visual_Merchandiser_Nabila_Putri',
    target: 'Visual Merchandiser (Luxury Fashion)',
    fit: 'MEDIUM',
    fullName: 'Nabila Putri Ardianti, S.Ds.',
    roleTitle: 'Junior Visual Merchandiser',
    email: 'nabila.ardianti.vm@gmail.com',
    phone: '+6287788990011',
    location: 'Jakarta Barat, Indonesia',
    linkedin: 'linkedin.com/in/nabilaardianti',
    summary: 'Junior Visual Merchandiser dengan 2 tahun pengalaman menata window display dan floor layout di department store. Menguasai Adobe Illustrator dan Adobe Photoshop untuk planogram, serta memahami brand guidelines fashion. Belum memiliki pengalaman langsung di segmen luxury.',
    skills: ['Visual Merchandising', 'Adobe Illustrator', 'Adobe Photoshop', 'Merchandising', 'Product Presentation', 'Canva', 'Teamwork'],
    experiences: [
      {
        role: 'Junior Visual Merchandiser',
        company: 'PT Department Store Raya — Jakarta Barat',
        period: '2024 - Sekarang',
        bullets: [
          'Menyusun planogram mingguan untuk 3 lantai fashion dan aksesoris.',
          'Membantu instalasi window display kampanye musiman Lebaran dan akhir tahun.'
        ]
      }
    ],
    education: {
      degree: 'Sarjana Desain (S1) Desain Interior',
      institution: 'Universitas Tarumanagara — Jakarta',
      year: '2019 - 2023 (IPK: 3.52 / 4.00)'
    }
  },
  {
    fileName: '11_FnB_Area_Manager_Hendra_Saputra',
    target: 'F&B Area Manager (East Java)',
    fit: 'STRONG',
    fullName: 'Hendra Saputra, S.Tr.Par.',
    roleTitle: 'F&B Area Manager',
    email: 'hendra.saputra.fnb@gmail.com',
    phone: '+6281233445577',
    location: 'Surabaya, Jawa Timur',
    linkedin: 'linkedin.com/in/hendrasaputra-fnb',
    summary: 'F&B Area Manager dengan 7 tahun pengalaman mengelola jaringan kafe dan dessert franchise di Jawa Timur. Kuat di food costing, P&L analysis, standar HACCP, dan pengembangan supervisor outlet. Membuka 5 outlet baru dalam 3 tahun terakhir.',
    skills: ['Store Operations', 'P&L Analysis', 'Budgeting', 'Inventory Management', 'SOP', 'Leadership', 'Customer Service', 'KPI', 'Microsoft Excel'],
    experiences: [
      {
        role: 'Area Manager — Jawa Timur',
        company: 'PT Rasa Manis Franchise — Surabaya',
        period: '2021 - Sekarang',
        bullets: [
          'Mengawasi 9 outlet F&B, food costing 28% dan HACCP compliance di seluruh outlet.',
          'Membuka 5 outlet baru di Surabaya, Malang, dan Sidoarjo sesuai anggaran.'
        ]
      },
      {
        role: 'Outlet Manager',
        company: 'PT Kopi Kita Nusantara — Surabaya',
        period: '2018 - 2021',
        bullets: ['Mengelola operasional outlet, jadwal shift, dan pelatihan barista.']
      }
    ],
    education: {
      degree: 'Sarjana Terapan (S1) Manajemen Tata Hidang',
      institution: 'Politeknik Pariwisata NHI — Bandung',
      year: '2014 - 2018'
    }
  },
  {
    fileName: '12_Barista_Lead_Rina_Oktaviani',
    target: 'Barista Lead (Jamba Juice)',
    fit: 'WEAK',
    fullName: 'Rina Oktaviani',
    roleTitle: 'Crew Kafe',
    email: 'rina.oktaviani02@gmail.com',
    phone: '+6289655443322',
    location: 'Sidoarjo, Jawa Timur',
    linkedin: '-',
    summary: 'Lulusan SMK Tata Boga dengan pengalaman kerja paruh waktu sebagai crew kafe selama kurang dari setahun. Bersemangat belajar menjadi barista profesional, ramah, dan siap bekerja shift.',
    skills: ['Customer Service', 'Cashiering', 'Teamwork', 'Communication'],
    experiences: [
      {
        role: 'Crew Kafe (Paruh Waktu)',
        company: 'Kedai Teh Segar — Sidoarjo',
        period: '2025 - Sekarang',
        bullets: ['Melayani pesanan, kasir, dan menjaga kebersihan area bar.']
      }
    ],
    education: {
      degree: 'SMK Tata Boga',
      institution: 'SMK Negeri 2 Sidoarjo',
      year: '2022 - 2025'
    }
  },
  {
    fileName: '13_Food_Safety_Quality_Officer_Yohana_Sitompul',
    target: 'Food Safety & Quality Officer',
    fit: 'STRONG',
    fullName: 'Yohana Sitompul, S.TP.',
    roleTitle: 'Quality Assurance Officer (Food Safety)',
    email: 'yohana.sitompul.qa@gmail.com',
    phone: '+6281377889900',
    location: 'Tangerang, Banten',
    linkedin: 'linkedin.com/in/yohanasitompul',
    summary: 'QA Officer dengan 4 tahun pengalaman di pabrik makanan beku dan central kitchen. Menerapkan HACCP, ISO 22000, dan sertifikasi halal; menyusun SOP serta menjalankan audit internal dan audit pemasok.',
    skills: ['SOP', 'Audit', 'Compliance', 'Microsoft Excel', 'Analytical Thinking', 'Communication'],
    experiences: [
      {
        role: 'Quality Assurance Officer',
        company: 'PT Pangan Beku Sejahtera — Tangerang',
        period: '2022 - Sekarang',
        bullets: [
          'Memimpin implementasi HACCP dan food safety plan untuk 3 lini produksi.',
          'Menurunkan temuan non-conformity audit eksternal dari 14 menjadi 3 dalam setahun.'
        ]
      },
      {
        role: 'QC Staff',
        company: 'PT Central Kitchen Prima — Jakarta',
        period: '2020 - 2022',
        bullets: ['Pemeriksaan bahan baku, pencatatan suhu, dan verifikasi kebersihan area produksi.']
      }
    ],
    education: {
      degree: 'Sarjana Teknologi Pertanian (S1) Teknologi Pangan',
      institution: 'Institut Pertanian Bogor (IPB) — Bogor',
      year: '2016 - 2020 (IPK: 3.58 / 4.00)'
    }
  },
  {
    fileName: '14_Social_Media_Specialist_Kevin_Gunawan',
    target: 'Social Media Specialist (Cosmopolitan)',
    fit: 'STRONG',
    fullName: 'Kevin Gunawan, S.I.Kom.',
    roleTitle: 'Social Media Specialist',
    email: 'kevin.gunawan.social@gmail.com',
    phone: '+6281944556677',
    location: 'Jakarta Selatan, Indonesia',
    linkedin: 'linkedin.com/in/kevingunawan',
    summary: 'Social Media Specialist dengan 3 tahun pengalaman mengelola akun lifestyle dan beauty dengan total 1,2 juta followers. Kuat di content strategy, copywriting, dan social media management lintas Instagram, TikTok, dan X, termasuk pelaporan performa mingguan.',
    skills: ['Social Media Management', 'Content Strategy', 'Copywriting', 'Canva', 'Adobe Photoshop', 'Video Editing', 'Google Sheets', 'Analytical Thinking'],
    experiences: [
      {
        role: 'Social Media Specialist',
        company: 'PT Media Gaya Hidup — Jakarta Selatan',
        period: '2023 - Sekarang',
        bullets: [
          'Meningkatkan engagement rate Instagram dari 2,1% menjadi 4,6% dalam 9 bulan.',
          'Menyusun content calendar bulanan dan copywriting kampanye brand kecantikan.'
        ]
      },
      {
        role: 'Content Writer',
        company: 'Portal Berita Muda — Jakarta',
        period: '2022 - 2023',
        bullets: ['Menulis 20+ artikel lifestyle per minggu dan caption media sosial.']
      }
    ],
    education: {
      degree: 'Sarjana Ilmu Komunikasi (S1) Jurnalistik',
      institution: 'Universitas Multimedia Nusantara — Tangerang',
      year: '2018 - 2022 (IPK: 3.55 / 4.00)'
    }
  },
  {
    fileName: '15_Video_Producer_Fadli_Ramadhan',
    target: 'Video Producer (Digital Media)',
    fit: 'MEDIUM',
    fullName: 'Fadli Ramadhan',
    roleTitle: 'Freelance Video Editor',
    email: 'fadli.ramadhan.video@gmail.com',
    phone: '+6282155667788',
    location: 'Depok, Jawa Barat',
    linkedin: 'linkedin.com/in/fadliramadhan',
    summary: 'Video editor lepas dengan 2 tahun pengalaman mengedit konten YouTube dan iklan pendek. Menguasai Premiere Pro dan After Effects; pengalaman storyboarding dan produksi lapangan masih terbatas.',
    skills: ['Video Editing', 'Premiere Pro', 'After Effects', 'Adobe Photoshop', 'Creative Direction', 'Time Management'],
    experiences: [
      {
        role: 'Freelance Video Editor',
        company: 'Proyek Lepas (YouTube & Brand Lokal) — Depok',
        period: '2024 - Sekarang',
        bullets: [
          'Mengedit 80+ video YouTube dan 30 iklan pendek untuk brand lokal.',
          'Membuat motion graphic sederhana dan color grading.'
        ]
      }
    ],
    education: {
      degree: 'Diploma (D3) Broadcasting',
      institution: 'Politeknik Negeri Jakarta — Depok',
      year: '2020 - 2023'
    }
  },
  {
    fileName: '16_HR_Business_Partner_Maya_Anggraini',
    target: 'HR Business Partner',
    fit: 'STRONG',
    fullName: 'Maya Anggraini, S.Psi., M.Psi.',
    roleTitle: 'HR Business Partner',
    email: 'maya.anggraini.hrbp@gmail.com',
    phone: '+6281211009988',
    location: 'Jakarta Selatan, Indonesia',
    linkedin: 'linkedin.com/in/mayaanggraini-hr',
    summary: 'HR Business Partner dengan 7 tahun pengalaman mendampingi unit bisnis retail dan media. Kuat di employee relations, talent acquisition, performance appraisal, serta implementasi HRIS. Memahami UU Ketenagakerjaan, payroll, dan BPJS.',
    skills: ['Employee Relations', 'Talent Acquisition', 'Performance Appraisal', 'HRIS', 'Payroll', 'BPJS', 'KPI', 'Communication', 'Negotiation', 'Problem Solving'],
    experiences: [
      {
        role: 'HR Business Partner',
        company: 'PT Retail Gaya Nusantara — Jakarta',
        period: '2021 - Sekarang',
        bullets: [
          'Mendampingi 4 unit bisnis (1.100 karyawan) untuk employee relations dan workforce planning.',
          'Memimpin implementasi HRIS dan siklus performance appraisal berbasis KPI.'
        ]
      },
      {
        role: 'HR Generalist',
        company: 'PT Media Kreasi Bangsa — Jakarta',
        period: '2018 - 2021',
        bullets: ['Mengelola talent acquisition, payroll, BPJS, dan penyelesaian hubungan industrial.']
      }
    ],
    education: {
      degree: 'Magister Psikologi (S2) Psikologi Industri & Organisasi',
      institution: 'Universitas Indonesia (UI) — Depok',
      year: '2016 - 2018'
    }
  },
  {
    fileName: '17_Finance_Tax_Officer_Bagus_Firmansyah',
    target: 'Finance & Tax Officer',
    fit: 'WEAK',
    fullName: 'Bagus Firmansyah, S.E.',
    roleTitle: 'Sales Executive',
    email: 'bagus.firmansyah.sales@yahoo.com',
    phone: '+6285311224455',
    location: 'Bekasi, Jawa Barat',
    linkedin: 'linkedin.com/in/bagusfirmansyah',
    summary: 'Sales Executive dengan 3 tahun pengalaman B2B di distributor alat kantor yang ingin beralih karier ke bidang keuangan. Terbiasa dengan Microsoft Excel untuk laporan penjualan; belum memiliki pengalaman perpajakan maupun brevet.',
    skills: ['Microsoft Excel', 'CRM', 'Negotiation', 'Sales Strategy', 'Communication'],
    experiences: [
      {
        role: 'Sales Executive',
        company: 'PT Distribusi Alat Kantor — Bekasi',
        period: '2022 - Sekarang',
        bullets: [
          'Mengelola 60 akun korporat dan membuat laporan penjualan bulanan di Excel.',
          'Bernegosiasi kontrak pengadaan tahunan dengan bagian procurement klien.'
        ]
      }
    ],
    education: {
      degree: 'Sarjana Ekonomi (S1) Manajemen',
      institution: 'Universitas Islam 45 — Bekasi',
      year: '2017 - 2021 (IPK: 3.12 / 4.00)'
    }
  }
];
