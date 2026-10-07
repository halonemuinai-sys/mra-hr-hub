/**
 * Career portal reference data and job → business-pillar classification.
 * Pillar badge colors stay inside the 5-color corporate palette.
 */
import {
  Briefcase,
  ShoppingBag,
  Coffee,
  Radio,
  Laptop
} from 'lucide-react';

export const MRA_SIGNATURE_BRANDS = [
  { name: 'BVLGARI', logo: '/brands/brand_01_bvlgari.png', pillar: 'Retail & Fashion' },
  { name: 'OMEGA', logo: '/brands/brand_02_omega.png', pillar: 'Retail & Fashion' },
  { name: 'Art Jakarta', logo: '/brands/brand_03_artjakarta.png', pillar: 'Media & Arts' },
  { name: 'Chronologie', logo: '/brands/brand_04_chronologie.png', pillar: 'Retail & Fashion' },
  { name: 'Jamba Juice', logo: '/brands/brand_05_jamba.png', pillar: 'Food & Beverage' },
  { name: 'Häagen-Dazs', logo: '/brands/brand_06_haagendazs.png', pillar: 'Food & Beverage' },
  { name: 'Atmos', logo: '/brands/brand_07_atmos.png', pillar: 'Retail & Fashion' },
  { name: "Harper's Bazaar", logo: '/brands/brand_08_bazaar.png', pillar: 'Media & Radio' },
  { name: 'Cosmopolitan', logo: '/brands/brand_09_cosmopolitan.png', pillar: 'Media & Radio' },
  { name: 'Her World', logo: '/brands/brand_10_herworld.png', pillar: 'Media & Radio' },
  { name: 'Mother & Beyond', logo: '/brands/brand_11_motherandbeyond.png', pillar: 'Media & Radio' },
  { name: 'CASA', logo: '/brands/brand_12_casa.png', pillar: 'Media & Radio' },
  { name: 'Iswara', logo: '/brands/brand_13_iswara.png', pillar: 'Media & Radio' },
  { name: 'TRL', logo: '/brands/brand_14_trl.png', pillar: 'Media & Radio' },
  { name: 'Parentalk', logo: '/brands/brand_15_parentalk.png', pillar: 'Media & Radio' },
  { name: 'Hard Rock FM', logo: '/brands/brand_16_hardrock.png', pillar: 'Media & Radio' },
  { name: 'MRA Media', logo: '/brands/brand_17_mramu.png', pillar: 'Corporate & Media' },
];

export const CATEGORY_TABS = [
  { id: 'ALL', name: 'Semua Lowongan', icon: Briefcase },
  { id: 'RETAIL', name: 'Retail & Fashion', icon: ShoppingBag },
  { id: 'FNB', name: 'Food & Beverage', icon: Coffee },
  { id: 'MEDIA', name: 'Media & Radio', icon: Radio },
  { id: 'CORP', name: 'Corporate & Technology', icon: Laptop },
];

export const matchPillar = (j: any, pillarId: string) => {
  if (pillarId === 'ALL') return true;
  const div = (j.division || '').toLowerCase();
  const dept = (j.department || '').toLowerCase();
  const title = (j.title || '').toLowerCase();

  if (pillarId === 'RETAIL' || pillarId === 'LUXURY') {
    return (
      div.includes('retail') ||
      dept.includes('retail') ||
      title.includes('luxury') ||
      title.includes('store') ||
      title.includes('fashion') ||
      title.includes('bvlgari')
    );
  }
  if (pillarId === 'FNB') {
    return (
      div.includes('food') ||
      dept.includes('food') ||
      title.includes('fnb') ||
      title.includes('restaurant') ||
      title.includes('haagen') ||
      title.includes('jamba') ||
      title.includes('beverage')
    );
  }
  if (pillarId === 'MEDIA' || pillarId === 'RADIO') {
    return (
      div.includes('radio') ||
      dept.includes('radio') ||
      div.includes('media') ||
      dept.includes('media') ||
      dept.includes('editorial') ||
      title.includes('broadcast') ||
      title.includes('hard rock') ||
      title.includes('editor') ||
      title.includes('bazaar') ||
      title.includes('cosmo')
    );
  }
  if (pillarId === 'CORP') {
    return (
      div.includes('corporate') ||
      div.includes('holding') ||
      dept.includes('technology') ||
      dept.includes('legal') ||
      dept.includes('digital')
    );
  }
  return true;
};

export const getJobPillarBadge = (j: any) => {
  const div = (j.division || '').toLowerCase();
  const dept = (j.department || '').toLowerCase();
  const title = (j.title || '').toLowerCase();

  if (div.includes('retail') || dept.includes('retail') || title.includes('luxury') || title.includes('bvlgari')) {
    return { label: 'Retail & Fashion', color: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
  if (div.includes('food') || dept.includes('food') || title.includes('fnb') || title.includes('haagen') || title.includes('jamba') || title.includes('restaurant')) {
    return { label: 'Food & Beverage', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  }
  if (div.includes('radio') || dept.includes('radio') || title.includes('hard rock') || title.includes('broadcast') || div.includes('media') || dept.includes('editorial')) {
    return { label: 'Media & Radio', color: 'bg-slate-100 text-slate-800 border-slate-300' };
  }
  return { label: 'Corporate & Technology', color: 'bg-blue-50 text-blue-800 border-blue-200' };
};
