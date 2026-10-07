/**
 * Stage gate rules — single source of truth for what a stage move requires.
 *
 * Each target stage declares:
 *   fields:  form inputs required when moving FORWARD into the stage
 *            (pre-filled / skipped when the value already exists on the application)
 *   checks:  (ctx) => array of { type: 'block' | 'warn' | 'approval', message, ... }
 *
 * A move is "direct" when it needs no input and no approval; otherwise the
 * Pipeline opens the validation form. Evaluation lives in services/stageGateService.js.
 */

const FUNNEL = ['APPLIED', 'ATS_SCREENED', 'SHORTLISTED', 'INTERVIEW_HR', 'INTERVIEW_USER', 'OFFERING', 'HIRED'];
const CLOSED = ['HIRED', 'REJECTED', 'TALENT_POOL'];

const LOW_ATS_THRESHOLD = 60;
const MIN_HR_RATING_FOR_USER_INTERVIEW = 3;

const REASON_FIELD = { key: 'reason', label: 'Reason', type: 'textarea', required: true };

const STAGE_RULES = {
  ATS_SCREENED: {
    fields: [],
    checks: ({ app }) =>
      (app.atsScore || 0) < LOW_ATS_THRESHOLD
        ? [{
            type: 'warn',
            message: `ATS score ${Math.round(app.atsScore || 0)}% is below ${LOW_ATS_THRESHOLD}%. Add a justification to continue.`,
            requireField: { key: 'reason', label: 'Justification', type: 'textarea', required: true }
          }]
        : []
  },

  SHORTLISTED: {
    fields: [
      { key: 'rating', label: 'Initial rating', type: 'rating', required: true, fromApp: 'scorecardRating' }
    ],
    checks: () => []
  },

  INTERVIEW_HR: {
    fields: [
      { key: 'interviewAt', label: 'Interview date & time', type: 'datetime', required: true },
      { key: 'interviewer', label: 'HR interviewer', type: 'text', required: true },
      { key: 'interviewMode', label: 'Mode', type: 'select', required: true, options: ['Online', 'Onsite'] }
    ],
    checks: () => []
  },

  INTERVIEW_USER: {
    fields: [
      { key: 'rating', label: 'HR interview rating', type: 'rating', required: true, fromApp: 'scorecardRating' },
      {
        key: 'recommendation',
        label: 'HR recommendation',
        type: 'select',
        required: true,
        options: ['Proceed', 'Hold']
      },
      { key: 'interviewAt', label: 'User interview date & time', type: 'datetime', required: true },
      { key: 'hiringManager', label: 'Hiring manager / user interviewer', type: 'text', required: true }
    ],
    checks: ({ data, app }) => {
      const out = [];
      const rating = Number(data.rating ?? app.scorecardRating ?? 0);
      if (rating && rating < MIN_HR_RATING_FOR_USER_INTERVIEW) {
        out.push({ type: 'block', message: `HR rating must be at least ${MIN_HR_RATING_FOR_USER_INTERVIEW} to schedule the user interview.` });
      }
      if (data.recommendation && data.recommendation !== 'Proceed') {
        out.push({ type: 'block', message: 'HR recommendation must be "Proceed" to move to the user interview.' });
      }
      return out;
    }
  },

  OFFERING: {
    fields: [
      { key: 'hmFeedback', label: 'Hiring manager feedback', type: 'textarea', required: true },
      { key: 'offerSalary', label: 'Offered monthly salary (IDR)', type: 'currency', required: true },
      { key: 'startDate', label: 'Proposed start date', type: 'date', required: true }
    ],
    checks: ({ data, app }) => {
      const salary = Number(data.offerSalary || 0);
      const budget = app.job && app.job.salaryMax != null ? Number(app.job.salaryMax) : null;
      if (salary && budget && salary > budget) {
        return [{
          type: 'approval',
          permission: 'approval.offer',
          message: `Offer of IDR ${salary.toLocaleString('id-ID')} exceeds the job budget (max IDR ${budget.toLocaleString('id-ID')}). A TA Lead must approve it.`
        }];
      }
      return [];
    }
  },

  HIRED: {
    fields: [
      { key: 'offerSigned', label: 'Offer letter signed by the candidate', type: 'checkbox', required: true },
      { key: 'joinDate', label: 'Confirmed join date', type: 'date', required: true }
    ],
    checks: () => [{
      type: 'approval',
      permission: 'approval.hire',
      message: 'The Hiring Manager must confirm the hire.'
    }]
  },

  REJECTED: {
    fields: [REASON_FIELD],
    checks: () => []
  },

  TALENT_POOL: { fields: [], checks: () => [] },
  APPLIED: { fields: [], checks: () => [] }
};

/** Rules that depend on direction rather than the target stage */
function directionChecks({ fromStatus, toStatus, canMoveAny }) {
  const from = FUNNEL.indexOf(fromStatus);
  const to = FUNNEL.indexOf(toStatus);
  const out = [];

  if (CLOSED.includes(fromStatus) && fromStatus !== 'HIRED' && to >= 0) {
    out.push({ type: 'warn', message: 'Re-opening an archived candidate.', requireField: { ...REASON_FIELD, label: 'Reason for re-opening' } });
  } else if (from >= 0 && to >= 0 && to < from) {
    out.push({ type: 'warn', message: 'Moving the candidate back to an earlier stage.', requireField: { ...REASON_FIELD, label: 'Reason for moving back' } });
  } else if (from >= 0 && to > from + 1) {
    if (!canMoveAny) {
      out.push({ type: 'block', message: 'Skipping stages is only allowed for a TA Lead.' });
    } else {
      out.push({ type: 'warn', message: `Skipping ${to - from - 1} stage(s).`, requireField: { ...REASON_FIELD, label: 'Reason for skipping stages' } });
    }
  }
  return out;
}

module.exports = { FUNNEL, CLOSED, STAGE_RULES, directionChecks };
