// Interview calendar helpers: labels, colours, date maths, calendar invites (.ics / Google) and WhatsApp text

export type InterviewEvent = {
  id: string;
  applicationId: string;
  stage: 'INTERVIEW_HR' | 'INTERVIEW_USER';
  status: 'UPCOMING' | 'AWAITING_OUTCOME' | 'COMPLETED' | 'CANCELLED' | 'UNSCHEDULED';
  outcome?: string | null;
  start?: string;
  end?: string;
  interviewAt?: string | null;
  interviewer?: string | null;
  mode?: string | null;
  location?: string | null;
  note?: string | null;
  conflict?: boolean;
  rescheduled?: number;
  current: boolean;
  candidate: { id: string; fullName: string; headline?: string; email?: string; phone?: string };
  job: { id: string; title: string; company?: { code: string; name: string } | null };
  pic?: { id: string; name: string } | null;
  scheduledBy?: { id: string; name: string } | null;
  actions: { schedule: boolean };
};

export const STAGE_META: Record<string, { label: string; short: string; solid: string; soft: string; dot: string }> = {
  INTERVIEW_HR: { label: 'HR Interview', short: 'HR', solid: 'bg-blue-600 border-blue-700 text-white', soft: 'bg-blue-50 border-blue-200 text-blue-800', dot: 'bg-blue-600' },
  INTERVIEW_USER: { label: 'User Interview', short: 'User', solid: 'bg-emerald-600 border-emerald-700 text-white', soft: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-600' }
};

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  UPCOMING: { label: 'Upcoming', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  AWAITING_OUTCOME: { label: 'Awaiting outcome', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-400 border-slate-200' },
  UNSCHEDULED: { label: 'Not scheduled', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
};

/** Card colours on the calendar: open interviews in the stage colour, past ones muted */
export function eventTone(e: InterviewEvent) {
  const s = STAGE_META[e.stage] || STAGE_META.INTERVIEW_HR;
  if (e.status === 'UPCOMING') return `${s.soft} ${e.stage === 'INTERVIEW_USER' ? 'border-l-emerald-500' : 'border-l-blue-500'}`;
  if (e.status === 'AWAITING_OUTCOME') return 'bg-amber-50 border-amber-400 text-amber-900';
  if (e.status === 'CANCELLED') return 'bg-white border-slate-200 text-slate-400 line-through';
  return 'bg-slate-100 border-slate-200 text-slate-600';
}

// ---- Dates (local time) ----
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const startOfWeek = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7)); // Monday
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
export const fmtDay = (d: Date, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) => d.toLocaleDateString('en-GB', opts);
export const fmtDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/** Value for <input type="datetime-local"> from an ISO time */
export const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// ---- Invites ----
const shortName = (n?: string | null) => String(n || '').replace(/\s*\(.*\)\s*$/, '');
const utcStamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

export function inviteTitle(e: InterviewEvent) {
  return `${STAGE_META[e.stage]?.label || 'Interview'}: ${e.candidate.fullName} — ${e.job.title}`;
}

export function inviteDetails(e: InterviewEvent) {
  return [
    `Candidate: ${e.candidate.fullName}${e.candidate.headline ? ` (${e.candidate.headline})` : ''}`,
    `Position: ${e.job.title}${e.job.company ? ` · ${e.job.company.name}` : ''}`,
    e.interviewer ? `Interviewer: ${e.interviewer}` : '',
    e.mode ? `Mode: ${e.mode}${e.location ? ` — ${e.location}` : ''}` : '',
    e.pic ? `TA PIC: ${shortName(e.pic.name)}` : '',
    e.note ? `Note: ${e.note}` : '',
    'Scheduled in MRA HR HUB'
  ]
    .filter(Boolean)
    .join('\n');
}

/** .ics file content (works with Outlook, Google Calendar, Apple Calendar) */
export function buildIcs(e: InterviewEvent) {
  if (!e.start || !e.end) return '';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MRA HR HUB//Interview Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.id}@hrhub`,
    `DTSTAMP:${utcStamp(new Date().toISOString())}`,
    `DTSTART:${utcStamp(e.start)}`,
    `DTEND:${utcStamp(e.end)}`,
    `SUMMARY:${icsEscape(inviteTitle(e))}`,
    `DESCRIPTION:${icsEscape(inviteDetails(e))}`,
    e.location ? `LOCATION:${icsEscape(e.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .filter(Boolean)
    .join('\r\n');
}

export function googleCalendarUrl(e: InterviewEvent) {
  if (!e.start || !e.end) return '';
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: inviteTitle(e),
    dates: `${utcStamp(e.start)}/${utcStamp(e.end)}`,
    details: inviteDetails(e),
    ...(e.location ? { location: e.location } : {})
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Message to the candidate (WhatsApp / e-mail) */
export function candidateInvite(e: InterviewEvent) {
  const when = e.start ? new Date(e.start) : null;
  const date = when ? when.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const time = when ? when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  const first = e.candidate.fullName.split(' ')[0];
  const where = e.mode === 'Onsite' ? `in person${e.location ? ` at ${e.location}` : ''}` : `online${e.location ? ` via ${e.location}` : ''}`;
  return (
    `Dear ${first},\n\n` +
    `Thank you for applying for the ${e.job.title} position${e.job.company ? ` at ${e.job.company.name}` : ''}. ` +
    `We would like to invite you to the ${(STAGE_META[e.stage]?.label || 'interview').toLowerCase()} on ${date} at ${time} WIB, ${where}` +
    `${e.interviewer ? `, with ${e.interviewer}` : ''}.\n\n` +
    `Please reply to confirm your attendance.\n\n` +
    `Best regards,\n${shortName(e.pic?.name) || 'Talent Acquisition'}\nTalent Acquisition — MRA Group`
  );
}

/** wa.me link with the invite text (Indonesian numbers 08… → 628…) */
export function whatsappUrl(e: InterviewEvent) {
  const digits = String(e.candidate.phone || '').replace(/\D/g, '');
  if (!digits) return '';
  const intl = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(candidateInvite(e))}`;
}

export function downloadIcs(e: InterviewEvent) {
  const blob = new Blob([buildIcs(e)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-${e.candidate.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
