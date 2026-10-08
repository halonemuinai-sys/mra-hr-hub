import { stageLabel } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';

/** "3,5 hr" / "2,1 days" — claim speed is measured in hours */
export function formatHours(h: number | null | undefined) {
  if (h === null || h === undefined) return '—';
  if (h < 24) return `${h.toLocaleString('en-GB', { maximumFractionDigits: 1 })} hr`;
  return `${(h / 24).toLocaleString('en-GB', { maximumFractionDigits: 1 })} days`;
}

export function formatRelative(date?: string | null) {
  if (!date) return 'No activity yet';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/** Human sentence for an ApplicationActivity row */
export function describeActivity(a: any) {
  const who = shortName(a.actor?.name) || 'System';
  const cand = a.application?.candidate?.fullName || 'candidate';
  switch (a.action) {
    case 'CLAIM':
      return { who, text: `claimed ${cand}` };
    case 'RELEASE':
      return { who, text: `released ${cand} to the queue` };
    case 'ASSIGN':
      return { who, text: `assigned ${cand} to ${shortName(a.toRecruiter?.name) || 'recruiter'}` };
    case 'STAGE_CHANGE':
      return { who, text: `moved ${cand}: ${stageLabel(a.fromStatus)} → ${stageLabel(a.toStatus)}` };
    case 'APPROVAL_REQUESTED':
      return { who, text: `requested approval for ${cand} → ${stageLabel(a.toStatus)}` };
    case 'APPROVAL_APPROVED':
      return { who, text: `approved ${cand} → ${stageLabel(a.toStatus)}` };
    case 'APPROVAL_REJECTED':
      return { who, text: `rejected approval for ${cand} → ${stageLabel(a.toStatus)}` };
    case 'PROFILE_RESUBMITTED':
      return { who: cand, text: 'resubmitted an application (stored profile unchanged)' };
    case 'APPROVAL_CANCELLED':
      return { who, text: `cancelled approval for ${cand} → ${stageLabel(a.toStatus)}` };
    case 'EMPLOYEE_REGISTERED':
      return { who, text: `registered ${cand} as an employee${a.note ? ` (${a.note})` : ''}` };
    case 'EMPLOYEE_ANNOUNCED':
      return { who, text: `announced ${cand} as a new employee` };
    case 'HIRE_RELEASED':
      return { who, text: `released ${cand} from the pipeline` };
    case 'TALENTA_SYNCED':
      return { who, text: `sent ${cand} to Talenta (${a.note || ''})` };
    case 'TALENTA_SYNC_FAILED':
      return { who, text: `failed to send ${cand} to Talenta: ${a.note || ''}` };
    case 'INTERVIEW_SCHEDULED':
      return { who, text: `scheduled the ${stageLabel(a.toStatus)} of ${cand}` };
    case 'HIRE_RESTORED':
      return { who, text: `restored ${cand} to the pipeline` };
    default:
      return { who, text: `${a.action} ${cand}` };
  }
}
