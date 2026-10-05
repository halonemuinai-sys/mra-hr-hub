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
node scripts/seedPipelineSamples.js          # 50 demo candidates across the pipeline (@sample.hrhub.test)
node scripts/seedPipelineSamples.js --clean  # remove only the demo candidates
node scripts/seedJobSamples.js               # top up to 25 jobs with sample postings (slug prefix `sample-`)
node scripts/seedJobSamples.js --clean       # remove only the sample jobs (cascades to their applications)
node scripts/generate_sample_cvs.js --batch 2 # 12 sample resumes (.pdf + .txt) → sample_cv_ats/batch_02 (not in DB; for upload tests)
```

### Database Schema Changes (⚠️ never `prisma db push`)
The DB URL has no `schema` param and the Supabase instance is shared with other apps (e.g. `helpdesk` schema), so `db push` is unsafe. Generate additive SQL and apply it explicitly:
```powershell
cd "d:\MRA Project\HR HUB\backend"
npx prisma migrate diff --from-schema <old.prisma> --to-schema prisma/schema.prisma --script > prisma/sql/<date>_<name>.sql
npx prisma db execute --file prisma/sql/<date>_<name>.sql
npx prisma generate
```
SQL migrations live in `backend/prisma/sql/` (run in filename order):
- `2026-10-04_ta_ownership.sql` — `JobApplication.assignedRecruiterId/assignedAt/stageChangedAt` + `ApplicationActivity`
- `2026-10-04_user_active.sql` — `User.isActive`
- `2026-10-04_stage_gate.sql` — `ApplicationActivity.stageData` + `StageRequest` (approvals)

### Health Check Endpoints
- **Backend Health**: `curl http://localhost:5006/api/health`
- **Frontend Portal**: `http://localhost:3006`
- **CMS Login**: `http://localhost:3006/admin/login`
- **Recruiter Cockpit**: `http://localhost:3006/admin/candidates`
- **Pipeline Pelamar**: `http://localhost:3006/admin/pipeline`
- **Kinerja Tim TA**: `http://localhost:3006/admin/team`
- **User & Hak Akses**: `http://localhost:3006/admin/users`

---

## 2. Authentication & Test Credentials

The backend uses **bcryptjs + JWT (JSON Web Tokens)** with a 7-day expiration. The frontend auto-injects `Authorization: Bearer <token>` from `localStorage.getItem('hr_hub_token')`.

`requireAuth` re-reads the user's **current role and `isActive` from the DB on every request** (the JWT only identifies the user), so role changes and deactivation apply immediately.

### Active Seeded Accounts:
| Role | Email | Password | Display Name |
| :--- | :--- | :--- | :--- |
| **SUPERADMIN** | `admin@mragroup.co.id` | `Password123!` | Budi Hartono (HR Director) |
| **RECRUITER** | `recruiter@mragroup.co.id` | `Password123!` | Siti Rahma (Senior Talent Acquisition) |
| **RECRUITER** | `ta.dewi@mragroup.co.id` | `Password123!` | Dewi Lestari (Talent Acquisition) |
| **RECRUITER** | `ta.rizky@mragroup.co.id` | `Password123!` | Rizky Pratama (Talent Acquisition) |
| **HIRING_MANAGER** | `hiring.manager@mragroup.co.id` | `Password123!` | Hendrawan (Retail Division Manager) |

### Roles & Permissions (RBAC)
Fixed roles (Prisma enum `Role`); permissions are defined in **one file**: `backend/config/permissions.js`. The resolved list is sent as `user.permissions` from `/api/auth/login` and `/api/auth/me`; the frontend checks it with `can(user, 'perm')` from `frontend/src/lib/permissions.tsx` (user comes from `useCurrentUser()`, provided by the admin layout).

| Permission | SUPERADMIN | HR_ADMIN (TA Lead) | RECRUITER (TA) | HIRING_MANAGER |
| :--- | :-: | :-: | :-: | :-: |
| `dashboard.view`, `pipeline.view`, `candidate.view`, `candidate.evaluate` | ✓ | ✓ | ✓ | ✓ |
| `pipeline.claim`, `pipeline.move.own`, `candidate.import` | ✓ | ✓ | ✓ | – |
| `pipeline.move.any`, `pipeline.assign`, `candidate.delete`, `jobs.manage` | ✓ | ✓ | – | – |
| `team.monitor`, `approval.offer` | ✓ | ✓ | – | – |
| `approval.hire` | ✓ | – | – | ✓ |
| `users.manage` | ✓ | – | – | – |

- Backend guard: `requirePermission('perm')` (`middlewares/authMiddleware.js`). Sidebar items and the admin route guard in `admin/layout.tsx` are keyed by permission.
- To change who can do what, edit `ROLE_PERMISSIONS` in `permissions.js` — nothing else.
- Public (no auth): `GET /api/jobs*`, `POST /api/candidates/apply`, `GET /api/candidates/status?email=`, `/api/ats/*`, `/api/templates/*` (career portal intake).

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

### D. Pipeline Pelamar (`/admin/pipeline`) — TA Ownership
- Kanban of `JobApplication`s (`GET /api/candidates/pipeline`). UI split into `frontend/src/components/pipeline/*`.
- **PIC ownership**: each application has `assignedRecruiterId`. Tabs *Milik Saya / Belum Diambil / Semua Tim*. Recruiters **claim** from the queue (atomic, race-safe) and move only their own cards (moving an unassigned card auto-claims). TA Lead assigns/releases anyone and sees a team workload strip.
- Bulk select + bulk move, reject-reason modal (appended to `recruiterNotes`), toast with undo, stale indicators (≥7d / ≥14d since `stageChangedAt`).
- Every claim/release/assign/stage change is logged to `ApplicationActivity` (`GET /api/candidates/applications/:id/activity`).
- Ownership rules: `backend/controllers/assignmentController.js` (`resolveMovePermission`) ↔ `frontend/src/components/pipeline/ownership.ts`.

### D2. Stage Gate & Approvals (Pipeline)
Every stage change goes through the gate: rules in `backend/config/stageRules.js`, evaluation in `services/stageGateService.js` (pure), execution in `services/stageMoveService.js` (`applyStageChange` — the only place that changes `JobApplication.status`).
- **Direct** moves (no input needed) apply immediately with undo. **Validated** moves open `TransitionModal` with server-defined fields; values are stored in `ApplicationActivity.stageData`.
- Rules: low ATS (<60) needs justification · Shortlisted needs a rating · Interview HR needs schedule/interviewer/mode · Interview User needs HR rating ≥3 + "Proceed" + schedule · Offering needs HM feedback, salary, start date — **salary above `JobPosting.salaryMax` → TA Lead approval** (`approval.offer`) · Hired needs signed offer + join date → **Hiring Manager confirmation** (`approval.hire`) · Rejected/moving back/re-opening need a reason · skipping stages is TA Lead only (with reason). A requester who holds the approval permission is applied directly.
- Approvals create a `StageRequest` (PENDING); the card shows "Awaiting approval" and is locked. Decide/withdraw in the Pipeline **Approvals** drawer (`GET /api/candidates/approvals`, `POST /approvals/:id/decide|cancel`). Rejecting a request requires a note.
- Bulk moves only apply direct moves; gated ones are returned as `needsReview`. The candidate drawer status change only accepts direct moves.
- Endpoints: `GET|POST /api/candidates/applications/:id/transition` (`controllers/transitionController.js`), board/bulk in `controllers/pipelineController.js`, approvals in `controllers/approvalController.js`. UI: `components/pipeline/transition/*`, `components/pipeline/approvals/*`.

### E. User & Hak Akses (`/admin/users`, `users.manage`)
- Create users, change role, activate/deactivate (deactivation returns their active candidates to the queue), reset password, read-only access matrix tab.
- Safeguards: no self-deactivation / self role change; at least one active SUPERADMIN must remain. Users are never deleted.

### F. Kinerja Tim TA (`/admin/team`, `team.monitor`)
- Monitoring for Super Admin / TA Lead: `GET /api/team/performance?days=7|30|90` and `GET /api/team/activity?recruiterId=` (`backend/controllers/teamController.js`).
- Per recruiter: candidates held now + stage mix, stale (≥7d), avg days in stage, and for the period: claims, stage moves, forward moves, offerings, hired/rejected, hire rate, claim speed (applied → claimed), last activity. Row click opens a detail drawer with the recruiter's activity timeline.
- Period metrics come from `ApplicationActivity`, so history starts when the ownership migration was applied.
- UI: `frontend/src/app/admin/team/page.tsx` + `frontend/src/components/team/*`.

### G. Dual-Intake ATS & Template Ingestion
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
│   ├── config/
│   │   ├── permissions.js    # RBAC: roles, permission catalog, role → permissions
│   │   └── stageRules.js     # Stage gate: fields, checks, approvals per stage
│   ├── controllers/
│   │   ├── authController.js # Login, getMe, logout (returns permissions)
│   │   ├── assignmentController.js # Claim / release / assign, activity log, move guard
│   │   ├── userController.js # User management (users.manage)
│   │   ├── teamController.js # TA performance & activity feed (team.monitor)
│   │   ├── pipelineController.js   # Board listing + bulk moves (gate-aware)
│   │   ├── transitionController.js # Single move: preview / execute / request approval
│   │   ├── approvalController.js   # List / decide / withdraw stage approvals
│   │   ├── atsController.js
│   │   ├── candidateController.js
│   │   ├── jobController.js
│   │   └── templateController.js
│   ├── middlewares/
│   │   └── authMiddleware.js # requireAuth (DB-backed), requireRole, requirePermission
│   ├── prisma/
│   │   ├── schema.prisma     # User, JobPosting, Candidate, JobApplication, ApplicationActivity
│   │   └── sql/              # Additive SQL migrations (apply with prisma db execute)
│   ├── routes/
│   │   ├── authRoutes.js     # /api/auth endpoints
│   │   ├── candidateRoutes.js # /api/candidates (+ pipeline, claim/assign, public status)
│   │   ├── teamRoutes.js     # /api/team (performance, activity)
│   │   └── userRoutes.js     # /api/users (+ access-matrix)
│   ├── services/
│   │   ├── stageGateService.js # Evaluate a stage move (pure)
│   │   └── stageMoveService.js # applyStageChange — the single write path for stage changes
│   └── scripts/
│       ├── seedUsers.js      # Seed admin & recruiter credentials
│       └── seedPipelineSamples.js # 50 demo candidates + 2 pending approvals
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
│       │       ├── pipeline/ # Kanban pipeline with TA ownership
│       │       ├── team/     # Kinerja Tim TA (Super Admin / TA Lead)
│       │       ├── users/    # User & Hak Akses (Super Admin)
│       │       ├── candidates/ # Candidate profiling cockpit
│       │       ├── jobs/     # Job management
│       │       └── templates/# Excel ingestion
│       ├── components/
│       │   ├── candidates/   # CandidateDetailDrawer & CandidateRadarChart
│       │   ├── pipeline/     # Board, column, card, toolbar, bulk bar, ownership rules
│       │   │   ├── transition/ # TransitionModal + StageField (gate form)
│       │   │   └── approvals/  # ApprovalsDrawer + useApprovals hook
│       │   ├── team/         # StageMixBar, ActivityFeed, MemberDetailDrawer
│       │   ├── users/        # AccessMatrix, UserFormModal
│       │   └── public/       # HeroSearchBar & JobDetailModal
│       └── lib/
│           ├── api.ts        # API client with auto JWT Bearer injection
│           ├── permissions.tsx # can(), useCurrentUser(), role labels
│           └── utils.ts      # Score & status badge formatters (Zero Purple)
```

---

## 6. Handover Directives for Claude in VS Code

1. **Authentication Check**: All `/admin/*` routes (except `/admin/login`) are protected by the Auth Guard in `frontend/src/app/admin/layout.tsx`, which also blocks pages the user's role lacks permission for. If testing admin pages, log in first or use `localStorage.setItem('hr_hub_token', '<valid_token>')`.
2. **Database Schema**: The PostgreSQL database runs on Supabase. HR HUB tables actually live in the **`public`** schema (not `hr_hub`, despite the `search_path` option in the URL), and the instance is shared with other apps. Use connection pooler port `6543` for runtime queries; `DIRECT_URL` (5432) is used by the Prisma CLI. Never run `prisma db push` — see *Database Schema Changes* above.
3. **Permissions**: Gate new endpoints with `requirePermission(...)` and new UI with `can(user, ...)`; add new permission keys to `backend/config/permissions.js` and to the `Permission` type in `frontend/src/lib/permissions.tsx`.
4. **Styling Consistency**: Follow the 5-color palette (Slate, White, Sapphire Blue, Emerald, Warm Amber). Never introduce purple colors.
5. **Git Remote**: `https://github.com/halonemuinai-sys/mra-hr-hub.git`.
