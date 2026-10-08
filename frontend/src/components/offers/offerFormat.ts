/** Offer letter labels and helpers (mirror of backend/services/offerLetter/offerRules.js) */

export const OFFER_STATUS_META: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  SENT: { label: 'Sent', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  EXPIRED: { label: 'Expired', cls: 'bg-amber-50 text-amber-800 border-amber-300' },
  ACCEPTED: { label: 'Accepted', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DECLINED: { label: 'Declined', cls: 'bg-slate-900 text-white border-slate-900' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-white text-slate-400 border-slate-200 line-through' }
};

export const OFFER_TABS = [
  { key: '', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SENT', label: 'Sent' },
  { key: 'EXPIRED', label: 'Expired' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'DECLINED', label: 'Declined' },
  { key: 'CANCELLED', label: 'Cancelled' }
];

export const EMPLOYMENT_TYPES = ['Full-time', 'Contract', 'Internship', 'Part-time'];

export const idr = (n: number | string | null | undefined) => `Rp ${Math.round(Number(n) || 0).toLocaleString('id-ID')}`;

/** Date-only values are stored at UTC midnight */
export const fmtDay = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

export const toDay = (d?: string | null) => (d ? String(d).slice(0, 10) : '');

/** Days from today (local) to a date-only value; negative = past */
export function daysUntil(d?: string | null): number | null {
  if (!d) return null;
  const t = new Date();
  const today = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((new Date(d).getTime() - today) / 86400000);
}

export const shortName = (n?: string | null) => String(n || '').replace(/\s*\(.*\)\s*$/, '');

/** Editable fields of a letter, as strings for the form */
export type OfferValues = {
  language: 'id' | 'en';
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateAddress: string;
  positionTitle: string;
  department: string;
  workLocation: string;
  employmentType: string;
  startDate: string;
  validUntil: string;
  baseSalary: string;
  allowances: { label: string; amount: string }[];
  benefits: string;
  probationMonths: string;
  contractMonths: string;
  workingHours: string;
  reportingTo: string;
  signatoryName: string;
  signatoryTitle: string;
  additionalTerms: string;
};

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export function toValues(src: Record<string, any>): OfferValues {
  return {
    language: src.language === 'en' ? 'en' : 'id',
    candidateName: str(src.candidateName),
    candidateEmail: str(src.candidateEmail),
    candidatePhone: str(src.candidatePhone),
    candidateAddress: str(src.candidateAddress),
    positionTitle: str(src.positionTitle),
    department: str(src.department),
    workLocation: str(src.workLocation),
    employmentType: str(src.employmentType) || 'Full-time',
    startDate: toDay(src.startDate),
    validUntil: toDay(src.validUntil),
    baseSalary: src.baseSalary ? String(Math.round(Number(src.baseSalary))) : '',
    allowances: (Array.isArray(src.allowances) ? src.allowances : []).map((a: any) => ({ label: str(a.label), amount: a.amount ? String(Math.round(Number(a.amount))) : '' })),
    benefits: str(src.benefits),
    probationMonths: str(src.probationMonths),
    contractMonths: str(src.contractMonths),
    workingHours: str(src.workingHours),
    reportingTo: str(src.reportingTo),
    signatoryName: str(src.signatoryName),
    signatoryTitle: str(src.signatoryTitle),
    additionalTerms: str(src.additionalTerms)
  };
}

/** Short message for email / WhatsApp when sending the PDF */
export function shareMessage(letter: any): string {
  const first = String(letter.candidateName || '').split(' ')[0];
  const pt = letter.company?.name || 'MRA Group';
  if (letter.language === 'en') {
    return `Dear ${first},\n\nCongratulations! Please find attached our offer of employment for the position of ${letter.positionTitle} at ${pt} (ref. ${letter.letterNo}).\n\nThe offer is valid until ${fmtDay(letter.validUntil)}. If you accept, kindly sign the acceptance section and send it back to us.\n\nBest regards,\n${letter.signatoryName}\n${letter.signatoryTitle}`;
  }
  return `Yth. ${first},\n\nSelamat! Terlampir surat penawaran kerja untuk posisi ${letter.positionTitle} di ${pt} (No. ${letter.letterNo}).\n\nPenawaran berlaku sampai ${new Date(letter.validUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}. Apabila Saudara/i menerima penawaran ini, mohon menandatangani bagian Pernyataan Persetujuan dan mengirimkannya kembali kepada kami.\n\nSalam,\n${letter.signatoryName}\n${letter.signatoryTitle}`;
}
