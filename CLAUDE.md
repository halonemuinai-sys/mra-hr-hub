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
- `npm run dev` uses **Turbopack** (`next dev --turbopack`): a page compiles in ~1–2 s on first visit instead of 8–14 s with webpack. The very first request after starting the server compiles the shared admin layout once (can take ~40 s). `next build` is unchanged.

### Seed Database Users & Master Data
```powershell
cd "d:\MRA Project\HR HUB\backend"
node scripts/seedUsers.js
node scripts/seedCompanies.js               # 21 PTs of MRA Group (idempotent, matched by name; codes editable in the Companies menu)
node scripts/seedPipelineSamples.js          # 50 demo candidates across the pipeline (@sample.hrhub.test), incl. 5 multi-job applicants, 1 duplicate profile, 2 pending approvals
node scripts/seedPipelineSamples.js --clean  # remove only the demo candidates
node scripts/seedInterviewSamples.js         # demo interview schedules for sample candidates (this/next week, 2 awaiting outcome, 1 clash, 2 unscheduled); --clean removes them
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
- `2026-10-07_employees.sql` — `Employee` + `EmploymentStatus` enum, `JobApplication.releasedAt`
- `2026-10-07_employee_talenta.sql` — `Employee.talentaData/Status/Mode/UserId/EmployeeId/SyncedAt/Error`
- `2026-10-07_companies.sql` — `Company` (PT) + `JobPosting.companyId` / `Employee.companyId`, seeds PT Mugi Rekso Abadi (`MRA`). Tables are schema-qualified (`public.`) because the shared DB also has a `helpdesk."Company"` table.
- `2026-10-08_manpower_requests.sql` — `ManpowerRequest` (schema-qualified, links to `User`, `Company`, `JobPosting`)
- `2026-10-08_onboarding.sql` — `OnboardingTask` + `Employee.probationEndDate` (schema-qualified)
- `2026-10-08_offer_letters.sql` — `OfferLetter` (schema-qualified, links to `JobApplication`, `Company`, `User`)

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
| `employee.manage` (own hires for TA) | ✓ | ✓ | ✓ | – |
| `employee.view` | ✓ | ✓ | ✓ | ✓ |
| `employee.sync` (payroll data + send to Talenta) | ✓ | ✓ | – | – |
| `approval.hire` | ✓ | – | – | ✓ |
| `manpower.view` | ✓ | ✓ | ✓ | ✓ |
| `manpower.request` | ✓ | ✓ | – | ✓ |
| `manpower.approve` | ✓ | ✓ | – | – |
| `users.manage`, `company.manage` | ✓ | – | – | – |

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
- Kanban of `JobApplication`s (`GET /api/candidates/pipeline`). The page orchestrates data, moves and ownership actions; UI lives in `frontend/src/components/pipeline/*` (`PipelineHeader`, `FunnelStrip`, `PipelineBoard` → `PipelineColumn` / `PipelineCard`, toolbar, bulk bar, `usePipelineSelection`).
- **PIC ownership**: each application has `assignedRecruiterId`. Tabs *Milik Saya / Belum Diambil / Semua Tim*. Recruiters **claim** from the queue (atomic, race-safe) and move only their own cards (moving an unassigned card auto-claims). TA Lead assigns/releases anyone and sees a team workload strip.
- Bulk select + bulk move, reject-reason modal (appended to `recruiterNotes`), toast with undo, stale indicators (≥7d / ≥14d since `stageChangedAt`).
- Columns render 20 cards then "Show more" (`PAGE_SIZE` in `PipelineBoard.tsx`); counts, avg ATS, select-all and Shift-range still cover the whole column.
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
- `GET /api/team/activity?recruiterId=&action=moves|ownership|approvals|hires&from=&to=&jobId=&search=&before=&limit=&counts=1` — keyset paging (`before` = returned `nextCursor`), `counts=1` adds per-group totals for the same filters.
- **Team Activity Log** (`/admin/activity`, `team.monitor`): the full feed on its own page (moved off the performance page to keep it light) — period / member / job / candidate filters, type chips with counts, day groups, *Load more*, CSV export of the loaded rows.
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

### J. Karyawan Baru & Pengumuman (after the hire)
- **Hired cards** show *Register employee* and *Release* (`canHandleHire`: `employee.manage` + own card, or `pipeline.move.any`). Registering creates an `Employee` (own copy of name/contact/placement — survives deleting the candidate/job; `employeeNo` unique, suggested `MRA-<year>-0001`) and sets `JobApplication.releasedAt`. Release only sets `releasedAt` (undo / restore while not registered).
- Released applications are hidden from the board (`listPipeline` filters `releasedAt: null`) and the stage gate blocks any further move. They still count as HIRED in dashboard, team and report metrics.
- `/admin/employees` (`employee.view`; Hiring Managers scoped to their jobs): tabs *Awaiting Registration* (HIRED without employee) / *Registered*, edit, announce, Excel export for HRIS. `/admin/announcements` (`dashboard.view`): "Welcome Aboard" board without contact details; also a dashboard widget and reminders (`hires-to-register`, `new-colleagues`).
- Activity actions: `EMPLOYEE_REGISTERED`, `EMPLOYEE_ANNOUNCED`, `HIRE_RELEASED`, `HIRE_RESTORED`.
- **Recruitment Journey** (Journey button / employee name on the *Registered* tab): `GET /api/employees/:id/journey` (`employee.view`, Hiring Manager scope) → `services/journeyService.js` `buildJourney` (pure, unit-tested) turns the activity log + stage requests into stage visits with durations and the events of each visit, after-hire actions, approvals and metrics (applied → hired, time to claim / first interview, offer → hire, hire → join, back moves, people involved, slowest stage). UI: `components/employees/journey/*`; activity labels shared with `StageHistory` via `components/candidates/activityFormat.tsx`.
- Backend: `controllers/employeeController.js`, `routes/employeeRoutes.js` (`/api/employees`), `routes/announcementRoutes.js` (`/api/announcements`), validation in `services/employeeInput.js` (unit-tested). UI: `components/employees/*`, `components/announcements/AnnouncementCard.tsx`, `components/dashboard/NewColleagues.tsx`.

### L. Companies (PT) of MRA Group
- `Company` master (`/admin/companies`, `company.manage` = Super Admin): code, legal name, NPWP, address, default Talenta branch, active flag. Never deleted — deactivate instead (existing jobs/employees keep it). `GET /api/companies` is open to every CMS user (form options / filters); `controllers/companyController.js`, validation `services/companyInput.js`.
- Every **job** has a PT (`JobPosting.companyId`; required on create once an active company exists, shown as a code chip on job cards; not shown on the public portal). **Employees** inherit the job's PT at registration and can change it (form, table chip, filter, Excel export column, Journey header). The PT's `talentaBranch` is the first default for the Talenta *Branch* field (one Talenta account for the whole group).
- PT filter (`?companyId=<id>` or `none` = no PT set) on the pipeline, employees, dashboard (`/api/stats/dashboard` also returns `byCompany` → *Per Company (PT)* card) and the recruitment report (new *Per PT* sheet + PT column on job / hires / applicant sheets).

### P. Onboarding (`/admin/onboarding`, `employee.view`; Hiring Managers scoped to their jobs)
- Every registered employee gets a checklist from **`config/onboardingTasks.js`** (the only place to change the standard tasks): phases *Before day one / Day one / First week / First month / Probation*, owner teams HR / IT / GA / Manager / Payroll, due date = join date + offset (probation tasks count from the probation end and only exist for `PROBATION` hires). Created inside `registerEmployee`; employees registered earlier get it with *Start onboarding*. Probation end defaults to join + 3 months (`Employee.probationEndDate`); changing it moves the open probation tasks.
- Rules in `services/onboardingRules.js` (pure, unit-tested): `buildChecklist`, `progressOf` (done / total excluding skipped, overdue, next task, NOT_STARTED / IN_PROGRESS / COMPLETED), `canUpdateTask` — `employee.manage` (HR & TA) may tick, skip, re-date, add and remove tasks; **Hiring Managers may tick / comment only the Manager tasks**.
- `GET /api/onboarding?status=&filter=overdue|probation&companyId=&search=` (list + summary), `GET /:employeeId`, `POST /:employeeId/start`, `POST /:employeeId/tasks`, `PATCH /:employeeId/probation`, `PATCH /tasks/:taskId`, `DELETE /tasks/:taskId` (`controllers/onboardingController.js`).
- Reminders: overdue onboarding tasks (HMs: their Manager tasks) and probation ending within 14 days. UI: `app/admin/onboarding/page.tsx`, `components/onboarding/*`.

### R. Talent Pool Matching (`/admin/talent-pool`, `pipeline.claim` = TA team; not for Hiring Managers)
- Ranks **existing candidates** against an open job with the same ATS engine as intake (`calculateAtsMatchScore`, computed live on the stored profile). Rules in `services/talentPoolMatcher.js` (pure, unit-tested): segments `TALENT_POOL` (parked in another job's Talent Pool) → `SILVER_MEDALIST` (rejected after reaching Interview HR or later, from the stage-change history) → `PAST_APPLICANT` (rejected early) → `ACTIVE` (still in another pipeline, only on request). Excluded: people who already applied to the job and hires (application HIRED or an `Employee`). Rejections < 90 days are flagged.
- `GET /api/talent-pool/jobs` (open jobs + match / strong ≥75 counts, pool size), `GET /jobs/:jobId?minScore=&segments=&search=` (ranked matches with sub-scores, matched / missing keywords, application history), `GET /candidates` (the pool with each person's 3 best open jobs), `POST /jobs/:jobId/add` `{ candidateIds (1–50), claim }` → new `Applied` application with the recalculated score, optionally assigned to the requester (`CLAIM` logged), activity **`TALENT_POOL_ADDED`** (`stageData.source = 'TALENT_POOL'`). Closed jobs refuse additions. `controllers/talentPoolController.js`.
- Reminder `talent-pool-matches`: jobs opened in the last 14 days with talent-pool / silver-medalist matches scoring 80+ (computed with a 5-minute cache). Job drawer link *Find in talent pool* (`?jobId=`).
- Scoring loads every candidate profile per request — fine for thousands of candidates; add caching or a stored match table if the database grows much larger.
- UI: `app/admin/talent-pool/page.tsx` (tabs *Match a job* / *Talent pool*, min-score and segment filters, multi-select bulk bar with *Assign to me*), `components/talentPool/*` (`MatchCard`, `PoolList`, `talentPoolFormat.ts`).

### Q. Offer Letter Generator (`/admin/offers`, `pipeline.view`; Hiring Managers scoped to their jobs, read-only)
- Surat Penawaran Kerja for candidates in **Offering**: the *Ready for an offer letter* panel lists Offering applications without an open letter (DRAFT / SENT / ACCEPTED). Only the candidate's PIC or a TA Lead (`pipeline.move.any`) writes, sends or records answers (`canManageOffer`).
- Prefill (`GET /api/offers/prefill/:applicationId?language=id|en`): candidate + job data, **salary and start date from the Offering stage-gate data**, valid until today + 7 (never after the start date), 3-month probation (Full-time) / 12-month contract (Contract), HM as *reporting to*, author as signatory. The issuing PT defaults to the job's PT and is required.
- Rules in `services/offerLetter/offerRules.js` (pure, unit-tested): `sanitizeOffer` (money accepts `8.500.000`, allowances `[{label, amount}]`, valid until ≤ start, probation 0–6, contract length required for Contract), `nextLetterNo` → `001/OL-<PT code>/HR/<Roman month>/<year>` (sequence per PT per year, retried on a unique clash), `displayStatus` (SENT past `validUntil` → **EXPIRED**), `actionsFor`.
- One document model for preview and PDF: `offerDocument.js` `buildOfferDocument` (Indonesian default / English: PKWTT/PKWT wording, pay table + total when there are allowances, benefits, PPh 21 / validity / regulation paragraphs, acceptance block) → rendered by the editor's live preview (`POST /api/offers/preview`) and by `offerPdf.js` (pdfkit, A4, letterhead with the MRA logo, PT name, address, NPWP).
- Flow: `POST /api/offers` (draft; 409 while another letter is open) → `PATCH /:id` (drafts only) → `POST /:id/send` → `POST /:id/respond` (`ACCEPTED` | `DECLINED`, decline needs a note) or `POST /:id/cancel`; `GET /:id/pdf`. Status changes are guarded by the expected current status (no double sends). Accepting does **not** move the candidate — TA still moves them to Hired through the stage gate.
- Activity actions `OFFER_LETTER_CREATED`, `OFFER_LETTER_SENT`, `OFFER_ACCEPTED`, `OFFER_DECLINED`, `OFFER_LETTER_CANCELLED` (Team Activity Log group *Offer letters*). Reminders: Offering candidates without a letter, sent letters expiring within 2 days, expired letters without an answer.
- UI: `app/admin/offers/page.tsx`, `components/offers/*` (`OfferEditorModal` form + live preview + language toggle, `OfferDrawer` with PDF / edit / mark as sent / copy message / Email / WhatsApp / record answer / cancel, `OfferPreview`, `offerFormat.ts`). Backend: `controllers/offerController.js`, `routes/offerRoutes.js`.

### O. Interview Calendar (`/admin/interviews`, `pipeline.view`; Hiring Managers scoped to their jobs)
- Events come from the activity log (`services/interviewService.js`, pure, unit-tested): each visit to Interview HR / User is one interview; its schedule is the stage-gate data of the move into the stage (`interviewAt`, `interviewer` / `hiringManager`, `interviewMode`) overridden by later **`INTERVIEW_SCHEDULED`** activities in the same visit (reschedules). Status: `UPCOMING`, `AWAITING_OUTCOME` (time passed, still in the stage), `COMPLETED` (left after the interview, `outcome` = next stage), `CANCELLED` (left before it), `UNSCHEDULED` (in the stage without a date). Interviews are blocked for 60 min; the same interviewer (case/space-insensitive) in an overlapping open slot = **clash**.
- `GET /api/interviews?from=&to=&companyId=&jobId=&stage=&interviewer=&mine=1` → events in the window, unscheduled list, summary (today, this week, awaiting outcome, clashes, interviewer load this week), interviewer names. `POST /api/interviews/:applicationId/schedule` (PIC or TA Lead, current interview stage only) writes an `INTERVIEW_SCHEDULED` activity. Times are datetime-local strings (WIB) parsed in the server's local time zone.
- UI (`components/interviews/*`): Week (time grid 08–19, lanes for overlaps, now-line), Month, Agenda; filters PT / stage / interviewer / mine; side panel *Not scheduled yet* (Schedule button) and interviewer load; detail modal with Google Calendar link, `.ics` download, WhatsApp invite to the candidate (`wa.me`, 08… → 628…), copy invite text, reschedule. The 48h interview reminder uses the same service (so reschedules count).

### N. Manpower Requests (`/admin/manpower`)
- Flow: a Hiring Manager (or TA Lead) submits a request (`manpower.request`) → a TA Lead or the Super Admin approves / rejects it (`manpower.approve`; rejecting needs a note; nobody approves their own request except the Super Admin) → TA opens it as a job posting (`jobs.manage`) → progress = hired / headcount of that job.
- Request: PT (required), position, department, division, location, employment type, headcount (1–50), reason `REPLACEMENT` (+ who is replaced) / `ADDITIONAL` / `NEW_POSITION`, justification, priority (`URGENT` flag), target start date, monthly salary budget, min. education / experience, key skills. Numbered `MPR-<year>-0001`. Status `PENDING` → `APPROVED` / `REJECTED`; requester or approver can withdraw (`CANCELLED`) while pending or approved without a job; only pending requests can be edited.
- Visibility: TA team and approvers see every request; Hiring Managers only their own. Rules live in `services/manpowerRules.js` (pure, unit-tested); endpoints in `controllers/manpowerController.js` (`/api/manpower`).
- Opening the job: the drawer's *Open job posting* opens `JobFormModal` prefilled (`jobPrefill`: title, PT, division, location, type, budget as **confidential** salary range, skills as must-have keywords, requester as Hiring Manager). `POST /api/jobs` with `manpowerRequestId` creates the job and links it in one transaction (one job per request; 409 otherwise). Job detail shows "From MPR-…".
- Reminders: approvals waiting (urgent = critical), approved requests without a job (TA Lead), requester's decided requests (3 days).
- UI: `frontend/src/app/admin/manpower/page.tsx`, `components/manpower/*` (`ManpowerFormModal`, `ManpowerDetailDrawer`, `manpowerFormat.ts`).
- **User guide** (Indonesian, with screenshots): `docs/guides/manpower-request/README.md`. End-user guides live in `docs/guides/<feature>/` (`README.md` + `images/`), indexed in `docs/README.md`; update the screenshots when the screens change.

### M. Hide Identity Mode (screenshots / demos)
- Header toggle **Hide identity** (`components/privacy/IdentityToggle.tsx`), shortcut **Ctrl+Shift+H** on any page (admin, login, public portal), or `?hideIdentity=1|0` in the URL. Stored per browser in `localStorage.hr_hub_hide_identity`.
- `components/privacy/IdentityMask.tsx` (mounted in the root layout) rewrites rendered text, option labels, `title`/`placeholder`/`alt`/`aria-label` and the tab title through `lib/identityMask.ts` (pure rules): `PT …` → `PT Perusahaan XX` (stable 2-letter pseudonym per name), brand names → `Brand XX`, `MRA` / Mugi Rekso Abadi → `Contoso`, `mragroup.co.id` → `contoso.co.id`, the head-office street → a generic one. `globals.css` blurs the MRA logo, building photo and brand logos (`html.hide-identity`). Display only — data and form values are never changed; turning it off restores the original text. Add new brand names to `BRANDS` in `identityMask.ts`; wrap anything that must stay unmasked in `data-identity-keep`.

### K. Talenta (Mekari HRIS) Integration
- Registered employees are sent to Talenta with **Add Employee** (`POST /v2/talenta/v3/employee`, docs: https://documenter.getpostman.com/view/12246328/UVR5qp6v). HR (`employee.sync`) fills personal, placement, payroll/tax, BPJS and bank data in the *Talenta* drawer on `/admin/employees`, saves a draft, then sends.
- Config in `backend/.env` (see `.env.example`, read by `config/talenta.js`): `TALENTA_MODE=off|mock|sandbox|production` (default **mock** in development, **off** when `NODE_ENV=production`), `TALENTA_HMAC_USERNAME`, `TALENTA_HMAC_SECRET` (HMAC client from Mekari Developer Center, requested by the Talenta company owner), `TALENTA_COMPANY_ID` (default `me`).
- **mock** = local simulator (`services/talenta/talentaMock.js`): master data + Add Employee with Talenta-style errors (`{ message, errors[] }`, duplicate email / employee_id, unknown branch/organization/position/level). Nothing leaves the server; records sent in mock are flagged `talentaMode = 'mock'` and can be sent again once sandbox/production is configured (a record counts as sent only for the mode it went to).
- Modules: `talentaHmac.js` (signature = base64 HMAC-SHA256 of `date: <RFC1123>` + newline + `<METHOD> <path> HTTP/1.1`), `talentaClient.js` (signed fetch, 20s timeout, `TalentaError`), `talentaMasterData.js` (branches / organizations / job positions / job levels / employment statuses, 10-min cache), `talentaEmployeePayload.js` (pure: `FIELDS` definitions shared with the form, defaults incl. offer salary from the Offering stage data, validation, masking). Endpoints in `controllers/talentaController.js` (`/api/talenta/*`). UI: `components/employees/talenta/*`.
- Branch / organization / job position / job level must match Talenta master names exactly — the form offers them as dropdowns from the live master data. Sends are claimed atomically (`SENDING`) so double clicks never create two employees. `talentaData` (salary, KTP, NPWP, bank) is never returned by the general employee endpoints.
- Activity actions: `TALENTA_SYNCED`, `TALENTA_SYNC_FAILED`. Changes after a successful send are made in Talenta directly (no PATCH sync yet).

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
│   │   ├── employeeController.js  # Register hires as employees, release from board, announcements
│   │   ├── talentaController.js   # Talenta HRIS sync (payroll data, master data, send)
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
│   │   ├── talenta/          # Talenta HMAC client, simulator, master data, Add Employee payload
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
│       │       ├── employees/ # Karyawan Baru (register, announce, export)
│       │       ├── announcements/ # Selamat Bergabung board
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
│       │   ├── employees/    # EmployeeFormModal, PendingHiresTable, EmployeeTable, AnnounceModal
│       │   ├── announcements/ # AnnouncementCard
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
