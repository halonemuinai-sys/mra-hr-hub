# HR HUB — ATS Resume Automation & Talent Profiling Cockpit

Sistem otomasi rekrutmen terpadu untuk ekosistem MRA Group, mengintegrasikan pembacaan CV otomatis berbasis kriteria ATS, dual-intake engine via Excel Template Master, kalkulasi skor kecocokan algoritma berbobot, visualisasi Radar DNA kandidat, serta dashboard eksekutif dan CMS terstandar korporat GLC & Winner Sport.

---

## 🏗️ Arsitektur Sistem

| Komponen | Jalur Direktori | Port Lokal | Teknologi Utama |
|---|---|---|---|
| **Frontend Web** | `frontend/` | `http://localhost:3006` | Next.js 15+ (App Router), TypeScript, Tailwind CSS v4, Lucide React, Framer Motion, Recharts |
| **Backend REST API** | `backend/` | `http://localhost:5006` | Node.js, Express.js, Prisma ORM, Multer, ExcelJS, pdf-parse, mammoth |
| **Database** | PostgreSQL | Port `6543` / `5432` | PostgreSQL (Supabase / Proxmox VM) via Prisma Client |
| **Process Manager** | Root | Multi-Service | PM2 (`ecosystem.config.js`) |

---

## 🚀 Fitur Unggulan

### 1. Dual-Channel Intake Engine
- **Mode 1 - Otomasi CV ATS (PDF/DOCX):** Pelamar cukup drag-and-drop file resume. Sistem mengekstrak nama, kontak, ringkasan, keahlian, dan riwayat kerja secara instan dalam < 2 detik.
- **Mode 2 - Master Excel Template (.xlsx):** Format resmi 5-sheet (*Panduan, Data Utama, Pengalaman, Pendidikan, Matriks Keahlian*) yang menjamin zero-error parsing dan memungkinkan HR mengimpor hingga 500 kandidat sekaligus (*Bulk Ingestion*).

### 2. Smart Profiling & Dynamic Database Grouping
- **Kalkulasi Skor Kecocokan ATS (0 - 100%):** Berbobot *Must-Have Skills (45%)*, *Lama Pengalaman (35%)*, dan *Pendidikan (20%)*.
- **Candidate DNA Radar Chart (5 Sumbu):** Menilai Keahlian Teknis, Durasi Pengalaman, Kesesuaian Pendidikan, Stabilitas Karir, dan Kecocokan Lowongan.
- **Dynamic Grouping:** Pengelompokan instan berdasarkan *Job Family* (IT, Retail, Corporate, Creative), *Senioritas* (Entry, Mid, Senior, Lead), dan *Tagging* (`#TopTier`, `#ImmediateHire`, `#KeyTalent`).

### 3. Dual Interface
- **Public Career Portal (`/`):** Tampilan karir interaktif untuk pencarian lowongan kerja, form lamar cepat dual-mode, dan pelacakan status mandiri (`/status`).
- **HR Recruiter CMS Cockpit (`/admin`):** Dashboard KPI eksekutif, tabel database kandidat berpola *Filter & Proses Data*, slide-over drawer profiling kandidat, dan pusat bulk ingestion Excel.

---

## 🛠️ Panduan Menjalankan Sistem

### A. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
node scripts/seed.js
npm run dev
# Backend berjalan di http://localhost:5006
```

### B. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend berjalan di http://localhost:3006
```

### C. Menjalankan di Server (PM2)
```bash
# Dari root direktori:
pm2 start ecosystem.config.js
pm2 save
```
