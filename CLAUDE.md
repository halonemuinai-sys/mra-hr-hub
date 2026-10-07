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
node scripts/seedPipelineSamples.js          # 50 demo candidates across the pipeline (@sample.hrhub.test), incl. 5 multi-job applicants, 1 duplicate profile, 2 pending approvals
node scripts/seedPipelineSamples.js --clean  # remove only the demo candidates
node scripts/seedJobSamples.js               # top up to 25 jobs with sample postings (slug prefix `sample-`)
node scripts/seedJobSamples.js --clean       # remove only the sample jobs (cascades to their applications)
node scripts/generate_sample_cvs.js --batch 2 # 12 sample resumes (.pdf + .txt) → sample_cv_ats/batch_02 (not in DB; for upload tests)
```

### Tests (Node built-in runner, no extra deps)
```powershell
cd "d:\MRA Project\HR HUB\backend"
npm test           # unit: stage gate, permissions, job input, intake normalization, CV parser (no DB)
npm run test:api   # API: auth, RBAC, data-leak and validation checks against the real DB — read-only by design
```
- API tests boot `api/app.js` on a random port (`api/index.js` only calls `listen`). Keep them read-only: assert refusals/validation errors or read data; never create or move real records. Write-path flows (stage gate, approvals) were verified manually on `@sample.hrhub.test` data — re-seed after such runs.

### Lint & Production Build
```powershell
cd "d:\MRA Project\HR HUB\frontend"
npm run lint                                   # ESLint (next/core-web-vitals + next/typescript), must be 0 errors
$env:NEXT_DIST_DIR=".next-build"; npx next build  # production build next to a running `npm run dev`
```
- `next.config.ts` no longer ignores type or lint errors — they fail `next build`. Restore `next-env.d.ts` (`git checkout frontend/next-env.d.ts`) after an isolated build; Next rewrites it to the build folder.
- CI (`.github/workflows/ci.yml`) runs backend unit tests and frontend lint + build on every push / PR to `main`. API tests need the real DB and stay local.

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
- `2026-10-07_job_hiring_manager.sql` — `JobPosting.hiringManagerId`

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
- Public (no auth): `GET /api/jobs*`, `POST /api/candidates/apply`, `GET /api/candidates/status?email=`, `/api/ats/*`, `GET /api/templates/download`, `POST /api/templates/apply` (career portal intake). `POST /api/templates/upload` (bulk import) requires `candidate.import`.
- **Candidate intake** (`services/candidateIntakeService.js`) is the single write path for new applicants. Public intake **never overwrites an existing candidate** (matched by email): the stored profile is kept, the application is still recorded, and the submitted data is logged as a `PROFILE_RESUBMITTED` activity. Only the admin bulk import may update profiles. The public template apply accepts exactly one applicant row (the template's built-in example rows are ignored).
- JWT settings live in `backend/config/jwt.js`; the server refuses to start without a `JWT_SECRET` of ≥32 characters (no fallback secret in code).

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
- `app/(public)/page.tsx` only holds jobs + filter state; sections live in `components/public/careers/`: `HeroSection`, `BrandShowcase`, `JobListings` (pillar tabs use real counts), `QuickApplyModal` (owns the apply form, CV scan + `resumeToken`, template upload), `careersData.ts` (brands, tabs, `matchPillar`, pillar badge colors).
- Hero banner with Wisma MRA architectural building and 3D MRA GROUP logo.
- `HeroSearchBar.tsx`: Accessible `@headlessui/react` Listbox dropdown for 6 MRA work locations with unit icons, instant clear (✕) button, and popular search tags.
- Marquee carousel with authentic 17 MRA brand logos (BVLGARI, OMEGA, Häagen-Dazs, Hard Rock FM, Harper's Bazaar, etc.).
- Business pillar tabs (*Retail, F&B, Media & Radio, Corporate*).
- Interactive Job Cards with **"Lihat Detail"** and **"Lamar Cepat"** dual actions.
- `JobDetailModal.tsx`: Comprehensive modal showing full job description, 4-grid key metrics, requirements checklist, ATS skills badges, employee benefits, share link, and direct apply trigger.

### C. Recruiter Candidate Cockpit (`/admin/candidates`)
- `CandidateDetailDrawer.tsx`: Executive slide-over drawer with candidate monogram avatar, 4-grid summary, radar chart with vertex dots and **5-pillar score progress bars**, ATS keyword match analysis, connected work experience timeline, and recruiter scorecard action panel with quick tags.
- `StageHistory.tsx` (inside the drawer): timeline of the application's activity log (`GET /api/candidates/applications/:id/activity`) with stage-gate form data (interview schedule, interviewer, offer salary, start/join date, HM feedback, reasons, approvals, re-submissions) and an upcoming-interview banner. The drawer is a wrapper + content component so hooks never run after an early return.
- `ApplicationHistory.tsx` (inside the drawer): every application of the person (`GET /api/candidates/:id/applications`, scoped for Hiring Managers) and possible duplicate profiles (`GET /api/candidates/:id/duplicates`, TA only — same phone on the last 9 digits or same name without titles; `controllers/candidateInsightController.js`). Pipeline cards show "+n job" when the candidate also applied elsewhere (`otherApplications` on `/pipeline`).

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
- `GET /api/team/performance?days=7|30|90` (`controllers/teamController.js`): per recruiter — workload vs capacity (`CAPACITY = 15`), stage mix, stale/critical, SLA % (active candidates moved within 7 days), avg days in stage, period outcomes (claims, moves, forward-move rate, interviews, offerings, hired/rejected, hire rate, claim speed), previous-period outcomes, activity sparkline series (daily ≤14 days, else weekly), oldest stalled candidates. Team totals carry % deltas only when the previous period has ≥5 events.
- `GET /api/team/rebalance`: suggested reassignments — stalled candidates of over-fair-share recruiters plus the unassigned queue waiting ≥2 days go to the least-loaded RECRUITER/HR_ADMIN (cards awaiting approval are never moved). Applied from the UI through `POST /api/candidates/applications/assign` (`pipeline.assign`).
- `GET /api/team/activity?recruiterId=&action=moves|ownership|approvals`.
- UI (`frontend/src/components/team/*`): KPI tiles, highlights (most productive / fastest claim / needs help), `WorkloadChart` (stacked by stage vs capacity line), `RebalancePanel`, sortable `Leaderboard` with CSV export, filtered activity feed, `MemberDetailDrawer` (vs team average, trend, stalled list).
- Period metrics come from `ApplicationActivity`, so history starts when the ownership migration was applied.

### G. Recruitment Dashboard (`/admin`) & Reminder Bell
- `GET /api/stats/dashboard?weeks=8|12|26` (`controllers/dashboardController.js`): KPIs with 30-day deltas, weekly trend (applications / hired / rejected), funnel conversion based on the furthest stage each application **reached** (from the activity log), ATS score distribution, stage aging (avg days in stage vs 7-day line), top jobs, talent mix.
- UI split into `frontend/src/components/dashboard/*` (recharts). Chart colors live in `chartTheme.ts` — corporate steps validated for CVD/contrast (`#2563eb`, `#059669`, `#d97706`); slate is neutral only. Every multi-series chart has a legend or direct labels.
- `GET /api/reminders` (`controllers/reminderController.js`): per-user action items computed live (approvals to decide, stalled candidates, unassigned queue, interviews in 48h, decided requests, new applicants for leads). Shown in the header bell (`components/notifications/NotificationBell.tsx`, polls every 60s) and the dashboard Action Center. "Seen" state is per viewer in localStorage.
- Reminder links deep-link into the Pipeline: `?view=approvals`, `?filter=stale`, `?scope=unassigned|me|all`.
- **Recruitment report** (`GET /api/reports/recruitment.xlsx?from=&to=`, `team.monitor`, max 1 year, default = current month; `controllers/reportController.js`): sheets Ringkasan, Per Lowongan, Per Recruiter, Diterima, Pelamar. Dashboard "Unduh Laporan" menu with month / 30 / 90-day presets.

### H. Kelola Lowongan ATS (`/admin/jobs`, `jobs.manage`)
- Card grid with search + Aktif/Ditutup filter. Clicking a card opens `JobDetailDrawer` (`GET /api/jobs/:id/manage`: job incl. closed ones, applicants per stage, top candidates, "Lihat di Pipeline" → `/admin/pipeline?jobId=`). `JobFormModal` handles create and edit (keyword chips, salary range, requirements, open/closed).
- `jobController.sanitizeJobInput` whitelists writable fields (no id/slug/timestamps), dedupes keywords, validates salaryMin ≤ salaryMax.
- Public `GET /api/jobs/:id` returns active jobs only and **never** includes applicants.
- Jobs with applicants cannot be deleted (cascade would wipe their applications) — close them instead.
- **Hiring Manager per job** (`JobPosting.hiringManagerId`, chosen in the job form from `GET /api/jobs/hiring-managers`; only active `HIRING_MANAGER` users are accepted). `services/hiringManagerScope.js` limits a Hiring Manager to their jobs **plus jobs without an assigned HM** in: pipeline, candidate list/detail, activity log, transition preview, hire approvals (list + decide) and reminders. Other roles are unrestricted.
- UI: `frontend/src/components/jobs/*`.

### I. Dual-Intake ATS & Template Ingestion
- `backend/services/atsParserService.js`: PDF/DOCX/TXT resume parser (`POST /api/ats/parse-cv`). Splits the CV into sections (summary / skills / experience / education); skills = taxonomy hits **plus** the CV's own skills section; the real experience text is kept on `experiences[0].description`; education year ranges are not counted as work experience. Always passes pdf.js a standalone `Uint8Array` (small Node Buffers share a pool and broke parsing at random).
- ATS score (`services/profilingService.js`): `0.55 × skills + 0.30 × experience + 0.15 × education`. Skills = 80% must-have ratio + 20% nice-to-have ratio. Matching lives in `services/keywordMatcher.js`: whole-word/phrase matching after normalization (no substring hits such as "sql" in "postgresql"), a synonym table (F&B ↔ food and beverage, Excel ↔ Microsoft Excel, manajemen ↔ management, …) and a 0.75 partial match when the keyword's core is present without generic words ("Team Leadership" ≈ "Leadership"). Extend `SYNONYMS` / `GENERIC` there.
- `tests/unit/atsScoring.test.js` guards the separation on the batch-2 sample CVs (strong ≥ 80, weak < 65). Stored scores are computed at intake, so existing applications keep their old score until re-applied/imported.
- **Original CV files** (`services/resumeStorage.js`, stored in `backend/uploads/resumes/` — git-ignored, **back this folder up on the server**). `POST /api/ats/parse-cv` keeps the upload as a temp file and returns `resumeToken` (file type checked by magic bytes; unclaimed temps expire after 24h). `POST /api/candidates/apply` with `resumeToken` moves it to permanent storage and sets `Candidate.rawResumePath` (tokens are single-use; an existing candidate only gets a file if they had none, and the resubmission is logged). `GET /api/candidates/:id/resume` streams it (`candidate.view`, Hiring Manager scope); the drawer's "Lihat CV asli" button opens it. Deleting a candidate deletes the file.
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
│   │   ├── jwt.js            # JWT secret (required, no fallback) & expiry
│   │   ├── permissions.js    # RBAC: roles, permission catalog, role → permissions
│   │   └── stageRules.js     # Stage gate: fields, checks, approvals per stage
│   ├── controllers/
│   │   ├── authController.js # Login, getMe, logout (returns permissions)
│   │   ├── assignmentController.js # Claim / release / assign, activity log, move guard
│   │   ├── userController.js # User management (users.manage)
│   │   ├── teamController.js # TA performance & activity feed (team.monitor)
│   │   ├── dashboardController.js # Dashboard analytics (/api/stats/dashboard)
│   │   ├── reminderController.js  # Per-user action reminders (/api/reminders)
│   │   ├── reportController.js    # Recruitment report workbook (/api/reports/recruitment.xlsx)
│   │   ├── jobController.js  # Jobs: public list/detail, admin manage view, sanitized create/update
│   │   ├── pipelineController.js   # Board listing + bulk moves (gate-aware)
│   │   ├── transitionController.js # Single move: preview / execute / request approval
│   │   ├── approvalController.js   # List / decide / withdraw stage approvals
│   │   ├── atsController.js
│   │   ├── candidateController.js
│   │   └── templateController.js
│   ├── middlewares/
│   │   └── authMiddleware.js # requireAuth (DB-backed), requireRole, requirePermission
│   ├── prisma/
│   │   ├── schema.prisma     # User, JobPosting, Candidate, JobApplication, ApplicationActivity
│   │   └── sql/              # Additive SQL migrations (apply with prisma db execute)
│   ├── routes/
│   │   ├── authRoutes.js     # /api/auth endpoints
│   │   ├── candidateRoutes.js # /api/candidates (+ pipeline, claim/assign, public status)
│   │   ├── teamRoutes.js     # /api/team (performance, rebalance, activity)
│   │   └── userRoutes.js     # /api/users (+ access-matrix)
│   ├── services/
│   │   ├── keywordMatcher.js # ATS keyword matching (normalize, synonyms, partial cores)
│   │   ├── candidateIntakeService.js # Apply / template intake (no overwrite of existing profiles)
│   │   ├── hiringManagerScope.js # Limits Hiring Managers to their own jobs
│   │   ├── resumeStorage.js  # Original CV files: temp token → permanent file, safe resolve
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
│       │   ├── dashboard/    # KPI tiles, trend, funnel, aging, histogram, top jobs, Action Center
│       │   ├── jobs/         # JobCard, JobDetailDrawer, JobFormModal, SkillTagInput
│       │   ├── notifications/ # NotificationBell, ReminderList, useReminders
│       │   ├── team/         # Leaderboard, WorkloadChart, RebalancePanel, TeamHighlights, MemberDetailDrawer, ActivityFeed
│       │   ├── users/        # AccessMatrix, UserFormModal
│       │   └── public/       # HeroSearchBar & JobDetailModal; careers/ = portal sections + QuickApplyModal
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
