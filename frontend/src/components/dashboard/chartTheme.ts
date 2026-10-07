/**
 * Chart colors — corporate palette steps validated with the dataviz palette checker
 * (lightness, chroma, CVD, contrast ≥3:1 on white). Emerald↔amber sit in the CVD
 * floor band, so every series also carries a legend or direct label.
 * Slate is neutral only (gridlines, "other"), never a series color.
 */
export const CHART = {
  blue: '#2563eb',
  blueSoft: '#dbeafe',
  emerald: '#059669',
  amber: '#d97706',
  slate: '#94a3b8',
  grid: '#e2e8f0',
  axis: '#64748b',
  ink: '#0f172a'
};

export const axisTick = { fontSize: 10, fill: CHART.axis };

export const SCORE_BAND = {
  top: { label: 'Top Match (≥85)', color: CHART.emerald },
  qualified: { label: 'Qualified (70–84)', color: CHART.blue },
  review: { label: 'Needs Review (<70)', color: CHART.amber }
} as const;

export const STAGE_NAME: Record<string, string> = {
  APPLIED: 'Applied',
  ATS_SCREENED: 'ATS Screened',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_HR: 'HR Interview',
  INTERVIEW_USER: 'Hiring Manager Interview',
  OFFERING: 'Offer',
  HIRED: 'Hired'
};

export const fmtWeek = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
