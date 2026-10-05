import { stageLabel } from '@/components/pipeline/stages';
import { shortName } from '@/components/pipeline/ownership';

/** "3,5 jam" / "2,1 hari" — claim speed is measured in hours */
export function formatHours(h: number | null | undefined) {
  if (h === null || h === undefined) return '—';
  if (h < 24) return `${h.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jam`;
  return `${(h / 24).toLocaleString('id-ID', { maximumFractionDigits: 1 })} hari`;
}

export function formatRelative(date?: string | null) {
  if (!date) return 'Belum ada aktivitas';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'kemarin' : `${days} hari lalu`;
}

/** Human sentence for an ApplicationActivity row */
export function describeActivity(a: any) {
  const who = shortName(a.actor?.name) || 'Sistem';
  const cand = a.application?.candidate?.fullName || 'kandidat';
  switch (a.action) {
    case 'CLAIM':
      return { who, text: `mengambil ${cand}` };
    case 'RELEASE':
      return { who, text: `melepas ${cand} ke antrean` };
    case 'ASSIGN':
      return { who, text: `menugaskan ${cand} ke ${shortName(a.toRecruiter?.name) || 'recruiter'}` };
    case 'STAGE_CHANGE':
      return { who, text: `memindahkan ${cand}: ${stageLabel(a.fromStatus)} → ${stageLabel(a.toStatus)}` };
    case 'APPROVAL_REQUESTED':
      return { who, text: `meminta approval ${cand} → ${stageLabel(a.toStatus)}` };
    case 'APPROVAL_APPROVED':
      return { who, text: `menyetujui ${cand} → ${stageLabel(a.toStatus)}` };
    case 'APPROVAL_REJECTED':
      return { who, text: `menolak approval ${cand} → ${stageLabel(a.toStatus)}` };
    case 'PROFILE_RESUBMITTED':
      return { who: cand, text: 'mengirim ulang lamaran (profil tersimpan tidak diubah)' };
    case 'APPROVAL_CANCELLED':
      return { who, text: `membatalkan approval ${cand} → ${stageLabel(a.toStatus)}` };
    default:
      return { who, text: `${a.action} ${cand}` };
  }
}
