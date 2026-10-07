export const DIVISIONS = [
  'MRA Corporate / Shared Service',
  'GLC MRA Holding',
  'MRA Retail (BVLGARI / Mogems)',
  'MRA Retail (OMEGA / Chronologie)',
  'Food & Beverage Franchises',
  'MRA Media (Harper’s Bazaar / Cosmopolitan)',
  'High-End Print & Digital Media',
  'National Broadcast Radio'
];

export const EMPLOYMENT_TYPES = ['Full-time', 'Contract', 'Internship', 'Part-time'];

export const EDUCATION_LEVELS = ['SMA/SMK', 'D3', 'D3 / S1', 'S1', 'S2'];

export type JobForm = {
  title: string;
  department: string;
  division: string;
  location: string;
  employmentType: string;
  minExperience: number;
  minEducation: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  requirements: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  isActive: boolean;
  hiringManagerId: string;
};

export const EMPTY_JOB: JobForm = {
  title: '',
  department: '',
  division: DIVISIONS[0],
  location: 'Jakarta Selatan',
  employmentType: 'Full-time',
  minExperience: 2,
  minEducation: 'S1',
  salaryMin: '',
  salaryMax: '',
  description: '',
  requirements: '',
  mustHaveSkills: [],
  niceToHaveSkills: [],
  isActive: true,
  hiringManagerId: ''
};

/** Map an API job to the form shape */
export function toForm(job: any): JobForm {
  return {
    title: job.title || '',
    department: job.department || '',
    division: job.division || DIVISIONS[0],
    location: job.location || '',
    employmentType: job.employmentType || 'Full-time',
    minExperience: job.minExperience ?? 0,
    minEducation: job.minEducation || 'S1',
    salaryMin: job.salaryMin != null ? String(Number(job.salaryMin)) : '',
    salaryMax: job.salaryMax != null ? String(Number(job.salaryMax)) : '',
    description: job.description || '',
    requirements: job.requirements || '',
    mustHaveSkills: job.mustHaveSkills || [],
    niceToHaveSkills: job.niceToHaveSkills || [],
    isActive: job.isActive !== false,
    hiringManagerId: job.hiringManagerId || ''
  };
}
