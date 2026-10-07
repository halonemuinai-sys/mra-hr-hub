import { formatRupiah } from './utils';

type Salary = {
  salaryMin?: number | string | null;
  salaryMax?: number | string | null;
  salaryVisibility?: string;
};

export const hasPublicSalary = (job: Salary) =>
  job.salaryVisibility === 'PUBLIC' && (job.salaryMin != null || job.salaryMax != null);

export function salaryRange(job: Salary) {
  if (job.salaryMin != null && job.salaryMax != null) {
    return `${formatRupiah(Number(job.salaryMin))} – ${formatRupiah(Number(job.salaryMax))}`;
  }
  if (job.salaryMin != null) return `From ${formatRupiah(Number(job.salaryMin))}`;
  if (job.salaryMax != null) return `Up to ${formatRupiah(Number(job.salaryMax))}`;
  return 'No salary range';
}

export function publicSalaryLabel(job: Salary) {
  if (job.salaryVisibility === 'CONFIDENTIAL') return 'Salary confidential';
  return hasPublicSalary(job) ? `${salaryRange(job)} / month` : 'Salary not specified';
}

export function internalSalaryLabel(job: Salary) {
  if (job.salaryVisibility === 'UNSPECIFIED') return 'No salary range';
  const range = salaryRange(job);
  return job.salaryVisibility === 'CONFIDENTIAL' ? `Confidential · ${range}` : range;
}
