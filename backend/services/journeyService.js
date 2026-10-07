/**
 * Recruitment journey of one application: from CV received to hired (and after) — built from the
 * application, its ApplicationActivity log and its StageRequests. Pure (no DB) so it can be unit-tested.
 *
 * Stage visits: the application starts in APPLIED at appliedAt; every STAGE_CHANGE closes the current
 * visit and opens the next one. Other activities are attached to the visit they happened in;
 * after-hire actions (registration, announcement, Talenta, release) go to `afterHire`.
 */

const DAY = 86400000;
const FUNNEL = ['APPLIED', 'ATS_SCREENED', 'SHORTLISTED', 'INTERVIEW_HR', 'INTERVIEW_USER', 'OFFERING', 'HIRED'];
const AFTER_HIRE = new Set(['EMPLOYEE_REGISTERED', 'EMPLOYEE_ANNOUNCED', 'HIRE_RELEASED', 'HIRE_RESTORED', 'TALENTA_SYNCED', 'TALENTA_SYNC_FAILED']);

const days = (from, to) => (from && to ? Math.max(0, (new Date(to) - new Date(from)) / DAY) : null);
const round1 = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);

/**
 * @param {object} p
 * @param {object} p.application  { appliedAt, status, ... }
 * @param {object[]} p.activities ApplicationActivity rows (any order) with actor { id, name }
 * @param {object[]} [p.requests] StageRequest rows with requestedBy / decidedBy
 * @param {object} [p.employee]   Employee record (joinDate)
 * @param {Date} [p.now]
 */
function buildJourney({ application, activities = [], requests = [], employee = null, now = new Date() }) {
  // Same timestamp (written in one transaction): keep the logical order
  const rank = (a) => (a.action === 'EMPLOYEE_ANNOUNCED' ? 2 : a.action === 'EMPLOYEE_REGISTERED' ? 1 : 0);
  const acts = [...activities].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || rank(a) - rank(b));
  const moves = acts.filter((a) => a.action === 'STAGE_CHANGE');

  // Stage visits
  const stages = [];
  let current = { status: 'APPLIED', enteredAt: application.appliedAt, by: null, data: null, note: null, events: [] };
  moves.forEach((m) => {
    current.leftAt = m.createdAt;
    stages.push(current);
    current = { status: m.toStatus, enteredAt: m.createdAt, by: m.actor ? m.actor.name : null, data: m.stageData || null, note: m.note || null, fromStatus: m.fromStatus, events: [] };
  });
  current.leftAt = null;
  stages.push(current);

  // Attach non-move activities to the visit they happened in
  const afterHire = [];
  acts.forEach((a) => {
    if (a.action === 'STAGE_CHANGE') return;
    if (AFTER_HIRE.has(a.action)) return afterHire.push(a);
    const t = new Date(a.createdAt).getTime();
    const visit = [...stages].reverse().find((s) => new Date(s.enteredAt).getTime() <= t) || stages[0];
    visit.events.push(a);
  });

  const hiredAt = (() => {
    const m = [...moves].reverse().find((x) => x.toStatus === 'HIRED');
    return m ? m.createdAt : null;
  })();

  stages.forEach((s, i) => {
    const end = s.leftAt || (s.status === 'HIRED' ? null : now);
    s.days = s.status === 'HIRED' ? null : round1(days(s.enteredAt, end));
    s.current = i === stages.length - 1;
    // Moving to an earlier funnel stage
    const from = FUNNEL.indexOf(s.fromStatus);
    const to = FUNNEL.indexOf(s.status);
    s.backward = from >= 0 && to >= 0 && to < from;
  });

  const claim = acts.find((a) => a.action === 'CLAIM' || a.action === 'ASSIGN');
  const firstOf = (status) => moves.find((m) => m.toStatus === status);
  const interviews = moves.filter((m) => m.toStatus === 'INTERVIEW_HR' || m.toStatus === 'INTERVIEW_USER');
  const people = new Set(acts.filter((a) => a.actor).map((a) => a.actor.id));
  requests.forEach((r) => {
    if (r.requestedBy) people.add(r.requestedBy.id);
    if (r.decidedBy) people.add(r.decidedBy.id);
  });

  const timed = stages.filter((s) => s.days !== null && !s.current);
  const slowest = timed.reduce((max, s) => (!max || s.days > max.days ? s : max), null);
  const decided = requests.filter((r) => r.decidedAt);
  const offer = firstOf('OFFERING');
  const hireMove = [...moves].reverse().find((x) => x.toStatus === 'HIRED');

  const approvals = requests
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((r) => ({
      id: r.id,
      toStatus: r.toStatus,
      reason: r.approvalReason,
      status: r.status,
      requestedBy: r.requestedBy ? r.requestedBy.name : null,
      decidedBy: r.decidedBy ? r.decidedBy.name : null,
      createdAt: r.createdAt,
      decidedAt: r.decidedAt,
      decisionNote: r.decisionNote,
      waitDays: round1(days(r.createdAt, r.decidedAt || now))
    }));

  const joinDate = (employee && employee.joinDate) || (hireMove && hireMove.stageData && hireMove.stageData.joinDate) || null;

  return {
    stages: stages.map(({ fromStatus, ...s }) => s),
    afterHire,
    approvals,
    milestones: {
      applied: application.appliedAt,
      claimed: claim ? claim.createdAt : null,
      firstInterview: interviews[0] ? interviews[0].createdAt : null,
      offering: offer ? offer.createdAt : null,
      hired: hiredAt,
      joinDate
    },
    metrics: {
      timeToHireDays: round1(days(application.appliedAt, hiredAt)),
      timeToClaimDays: round1(days(application.appliedAt, claim && claim.createdAt)),
      timeToInterviewDays: round1(days(application.appliedAt, interviews[0] && interviews[0].createdAt)),
      offerToHireDays: round1(days(offer && offer.createdAt, hiredAt)),
      hireToJoinDays: joinDate && hiredAt ? Math.round((new Date(joinDate) - new Date(hiredAt)) / DAY) : null,
      stageCount: stages.length,
      interviewCount: interviews.length,
      backMoves: stages.filter((s) => s.backward).length,
      peopleInvolved: people.size,
      approvalCount: requests.length,
      approvalWaitDays: decided.length ? round1(decided.reduce((n, r) => n + days(r.createdAt, r.decidedAt), 0)) : null,
      slowestStage: slowest ? { status: slowest.status, days: slowest.days } : null,
      offerSalary: offer && offer.stageData && offer.stageData.offerSalary ? Number(offer.stageData.offerSalary) : null
    }
  };
}

module.exports = { buildJourney };
