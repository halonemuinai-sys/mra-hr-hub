# CLAUDE.md — MRA HR HUB Developer & Handover Guide

> **Project**: MRA HR HUB (ATS Automation, Candidate DNA Profiling, & Corporate Careers Engine)  
> **Client / Organization**: PT Mugi Rekso Abadi (MRA Group) — IT Shared Service  
> **Workspace**: `d:\MRA Project\HR HUB`  
> **Target Ports**: Frontend on `3006`, Backend on `5006`

---

## 1. Quick Start Commands

### Start Backend Server (`localhost:5006`)
```powershell
cd "d:\MRA Project\HR HUB\backend"
node api/index.js
```

### Start Frontend Server (`localhost:3006`)
```powershell
cd "d:\MRA Project\HR HUB\frontend"
npm run dev
```

### Seed Database Users & Master Data
```powershell
cd "d:\MRA Project\HR HUB\backend"
node scripts/seedUsers.js
```

### Health Check Endpoints
- **Backend Health**: `curl http://localhost:5006/api/health`
- **Frontend Portal**: `http://localhost:3006`
- **CMS Login**: `http://localhost:3006/admin/login`
- **Recruiter Cockpit**: `http://localhost:3006/admin/candidates`

---

## 2. Authentication & Test Credentials

The backend uses **bcryptjs + JWT (JSON Web Tokens)** with a 7-day expiration. The frontend auto-injects `Authorization: Bearer <token>` from `localStorage.getItem('hr_hub_token')`.

### Active Seeded Accounts:
| Role | Email | Password | Display Name |
| :--- | :--- | :--- | :--- |
| **SUPERADMIN** | `admin@mragroup.co.id` | `Password123!` | Budi Hartono (HR Director) |
| **RECRUITER** | `recruiter@mragroup.co.id` | `Password123!` | Siti Rahma (Senior Talent Acquisition) |
| **HIRING_MANAGER** | `hiring.manager@mragroup.co.id` | `Password123!` | Hendrawan (Retail Division Manager) |

---

## 3. Strict Design Guidelines & 5-Color Corporate Palette

The user requires **strict color consistency (4–5 colors maximum)** across all admin and candidate cockpit screens:

1. **Deep Obsidian Slate (`#0f172a` / `#1e293b`)**: Headers, primary dark text, structural dark badges.
2. **Pure White & Slate Neutrals (`#ffffff` / `#f8fafc` / `#e2e8f0` / `#64748b`)**: Card surfaces, light dividers, secondary text.
3. **MRA Sapphire Blue (`#2563eb` / `#1d4ed8` / `#eff6ff`)**: Primary brand accent, primary CTA buttons, timeline nodes, radar polygon, active links.
4. **Success Emerald Green (`#10b981` / `#059669` / `#ecfdf5`)**: Top ATS Match (≥85%), matched keywords (`✓ Matched`), transparent salary banner.
5. **Warm Amber / Gold (`#f59e0b` / `#d97706` / `#fffbeb`)**: 1–5 star ratings, notice period tags, "Paling dicari" sparkle chips.

> ⛔ **MANDATORY RULE**: **ZERO PURPLE**. Do NOT introduce `purple-*`, `violet-*`, or purple-leaning `indigo-*`. Keep icons, badges, graduation caps, and status indicators strictly within the 5 corporate colors above.

---

## 4. Key Architecture & Completed Modules

### A. CMS Login (`/admin/login` — 1:1 Match with GLC Apps)
- Located at: `frontend/src/app/admin/login/page.tsx`
- Modeled directly after `D:\Private Project\GLC Apps\frontend\src\components\pages\LoginPage.jsx`.
- Split-screen design (52% left graphic panel with SVG circuit traces, 22 floating particles, floating Donut Chart & Checklist mockup widgets, authentic `mra_logo.png`; 48% right panel with clean login form, one-click demo credentials, and diagonal shine animation button).

### B. Public Career Portal (`/`)
- Hero banner with Wisma MRA architectural building and 3D MRA GROUP logo.
- `HeroSearchBar.tsx`: Accessible `@headlessui/react` Listbox dropdown for 6 MRA work locations with unit icons, instant clear (✕) button, and popular search tags.
- Marquee carousel with authentic 17 MRA brand logos (BVLGARI, OMEGA, Häagen-Dazs, Hard Rock FM, Harper's Bazaar, etc.).
- Business pillar tabs (*Retail, F&B, Media & Radio, Corporate*).
- Interactive Job Cards with **"Lihat Detail"** and **"Lamar Cepat"** dual actions.
- `JobDetailModal.tsx`: Comprehensive modal showing full job description, 4-grid key metrics, requirements checklist, ATS skills badges, employee benefits, share link, and direct apply trigger.

### C. Recruiter Candidate Cockpit (`/admin/candidates`)
- `CandidateDetailDrawer.tsx`: Executive slide-over drawer with candidate monogram avatar, 4-grid summary, radar chart with vertex dots and **5-pillar score progress bars**, ATS keyword match analysis, connected work experience timeline, and recruiter scorecard action panel with quick tags.

### D. Dual-Intake ATS & Template Ingestion
- `backend/services/atsParserService.js`: Multi-format PDF/DOCX/TXT resume heuristic parsing engine (`POST /api/ats/parse-cv`).
- `backend/services/excelTemplateService.js`: Single-sheet standardized Excel template (*Data Pelamar*) with bulk ingestion and preview mode.

---

## 5. File Structure Reference

```text
d:\MRA Project\HR HUB
├── backend/
│   ├── api/
│   │   ├── index.js          # Express server entry point (port 5006)
│   │   └── db.js             # PrismaPg connection pooler client (hr_hub schema)
│   ├── controllers/
│   │   ├── authController.js # Login, getMe, logout
│   │   ├── atsController.js
│   │   ├── candidateController.js
│   │   ├── jobController.js
│   │   └── templateController.js
│   ├── middlewares/
│   │   └── authMiddleware.js # requireAuth & requireRole
│   ├── prisma/
│   │   └── schema.prisma     # User, JobPosting, Candidate, Application
│   ├── routes/
│   │   └── authRoutes.js     # /api/auth endpoints
│   └── scripts/
│       └── seedUsers.js      # Seed admin & recruiter credentials
├── frontend/
│   ├── public/
│   │   ├── mra_logo.png      # Official authentic MRA Group logo
│   │   ├── mra_building_hero.jpg
│   │   └── brands/           # 17 MRA signature brand logos
│   └── src/
│       ├── app/
│       │   ├── (public)/     # Public careers portal (page.tsx, layout.tsx)
│       │   │   └── jobs/[id] # Dedicated job permalink page
│       │   └── admin/        # CMS dashboard (layout.tsx with Auth Guard)
│       │       ├── login/    # GLC-style split-screen login page
│       │       ├── candidates/ # Candidate profiling cockpit
│       │       ├── jobs/     # Job management
│       │       └── templates/# Excel ingestion
│       ├── components/
│       │   ├── candidates/   # CandidateDetailDrawer & CandidateRadarChart
│       │   └── public/       # HeroSearchBar & JobDetailModal
│       └── lib/
│           ├── api.ts        # API client with auto JWT Bearer injection
│           └── utils.ts      # Score & status badge formatters (Zero Purple)
```

---

## 6. Handover Directives for Claude in VS Code

1. **Authentication Check**: All `/admin/*` routes (except `/admin/login`) are protected by the Auth Guard in `frontend/src/app/admin/layout.tsx`. If testing admin pages, log in first or use `localStorage.setItem('hr_hub_token', '<valid_token>')`.
2. **Database Schema**: The PostgreSQL database runs on Supabase under search_path `hr_hub,public`. Always use connection pooler port `6543` for runtime queries.
3. **Styling Consistency**: Follow the 5-color palette (Slate, White, Sapphire Blue, Emerald, Warm Amber). Never introduce purple colors.
4. **Git Remote**: `https://github.com/halonemuinai-sys/mra-hr-hub.git`.
