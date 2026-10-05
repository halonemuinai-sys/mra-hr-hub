'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  DollarSign,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowDown,
  X,
  FileText,
  Clock,
  Send,
  User,
  Mail,
  Phone,
  Layers,
  Award,
  Zap,
  Check,
  RefreshCw,
  Tag,
  Download,
  Filter,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  Users,
  ShoppingBag,
  Coffee,
  Radio,
  Laptop,
  ChevronDown,
  Eye,
  GraduationCap
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { api } from '@/lib/api';
import HeroSearchBar from '@/components/public/HeroSearchBar';
import JobDetailModal from '@/components/public/JobDetailModal';

const MRA_SIGNATURE_BRANDS = [
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

const CATEGORY_TABS = [
  { id: 'ALL', name: 'Semua Lowongan', icon: Briefcase, defaultCount: 51 },
  { id: 'RETAIL', name: 'Retail & Fashion', icon: ShoppingBag, defaultCount: 18 },
  { id: 'FNB', name: 'Food & Beverage', icon: Coffee, defaultCount: 10 },
  { id: 'MEDIA', name: 'Media & Radio', icon: Radio, defaultCount: 8 },
  { id: 'CORP', name: 'Corporate & Technology', icon: Laptop, defaultCount: 7 },
];

export default function PublicCareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('ALL');

  // Modal states
  const [viewingJob, setViewingJob] = useState<any | null>(null);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [applyMode, setApplyMode] = useState<'ATS' | 'TEMPLATE'>('ATS');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [parsingCv, setParsingCv] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any | null>(null);

  // Parsed Form fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    headline: '',
    totalExperienceYrs: 1,
    expectedSalary: '',
    availability: 'IMMEDIATE',
    profileSummary: '',
    skills: [] as string[]
  });

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.getJobs({ activeOnly: true });
      if (res.success && res.data) {
        setJobs(res.data);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const matchPillar = (j: any, pillarId: string) => {
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

  const pillarCounts: Record<string, number> = {
    ALL: jobs.length || 51,
    RETAIL: jobs.filter((j) => matchPillar(j, 'RETAIL')).length || 18,
    FNB: jobs.filter((j) => matchPillar(j, 'FNB')).length || 10,
    MEDIA: jobs.filter((j) => matchPillar(j, 'MEDIA')).length || 8,
    CORP: jobs.filter((j) => matchPillar(j, 'CORP')).length || 7,
  };

  const getJobPillarBadge = (j: any) => {
    const div = (j.division || '').toLowerCase();
    const dept = (j.department || '').toLowerCase();
    const title = (j.title || '').toLowerCase();

    if (div.includes('retail') || dept.includes('retail') || title.includes('luxury') || title.includes('bvlgari')) {
      return { label: 'Retail & Fashion', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (div.includes('food') || dept.includes('food') || title.includes('fnb') || title.includes('haagen') || title.includes('jamba') || title.includes('restaurant')) {
      return { label: 'Food & Beverage', color: 'bg-orange-50 text-orange-800 border-orange-200' };
    }
    if (div.includes('radio') || dept.includes('radio') || title.includes('hard rock') || title.includes('broadcast') || div.includes('media') || dept.includes('editorial')) {
      return { label: 'Media & Radio', color: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
    return { label: 'Corporate & Technology', color: 'bg-blue-50 text-blue-800 border-blue-200' };
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      !searchQuery ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.mustHaveSkills || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLocation =
      !selectedLocation || (j.location || '').toLowerCase().includes(selectedLocation.toLowerCase());
    const matchesDivision = !selectedDivision || j.division === selectedDivision;
    const matchesPillar = matchPillar(j, selectedPillar);

    return matchesSearch && matchesLocation && matchesDivision && matchesPillar;
  });

  // Handle CV file upload & ATS parsing with simulated high-tech scanning steps
  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCvFile(file);
    setParsingCv(true);
    setScanStep('Membaca dokumen dan struktur teks...');

    try {
      setTimeout(() => setScanStep('Mengekstrak kontak dan identitas pelamar...'), 400);
      setTimeout(() => setScanStep('Menjalankan algoritma taksonomi keahlian ATS...'), 900);

      const fd = new FormData();
      fd.append('resume', file);
      const res = await api.parseResume(fd);

      if (res.success && res.data) {
        const d = res.data;
        const newAutoFilled = new Set<string>();
        if (d.fullName) newAutoFilled.add('fullName');
        if (d.email) newAutoFilled.add('email');
        if (d.phone) newAutoFilled.add('phone');
        if (d.headline) newAutoFilled.add('headline');
        if (d.totalExperienceYrs) newAutoFilled.add('totalExperienceYrs');
        if (d.profileSummary) newAutoFilled.add('profileSummary');
        if (d.skills && d.skills.length > 0) newAutoFilled.add('skills');

        setAutoFilledFields(newAutoFilled);

        setFormData((prev) => ({
          ...prev,
          fullName: d.fullName || prev.fullName,
          email: d.email || prev.email,
          phone: d.phone || prev.phone,
          headline: d.headline || prev.headline,
          totalExperienceYrs: d.totalExperienceYrs || prev.totalExperienceYrs,
          profileSummary: d.profileSummary || prev.profileSummary,
          skills: (d.skills || []).map((s: any) => (typeof s === 'string' ? s : s.skillName))
        }));

        setScanStep('Ekstraksi selesai dengan sukses!');
      }
    } catch (err: any) {
      alert('Gagal mengekstrak CV: ' + err.message);
    } finally {
      setTimeout(() => {
        setParsingCv(false);
        setScanStep('');
      }, 600);
    }
  };

  // Submit ATS Application
  const handleAtsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      alert('Nama lengkap dan email wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        jobId: selectedJob?.id,
        intakeSource: 'ATS_RESUME_UPLOAD',
        skills: formData.skills.map((s) => ({ skillName: s, category: 'TECHNICAL', proficiency: 'INTERMEDIATE' }))
      };

      const res = await api.applyCandidate(payload);
      if (res.success) {
        setSubmitSuccess(res.data);
      }
    } catch (err: any) {
      alert('Gagal mengirim lamaran: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Template Application
  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateFile) {
      alert('Silakan pilih file Excel template yang telah diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('template', templateFile);
      if (selectedJob?.id) fd.append('jobId', selectedJob.id);

      const res = await api.applyWithTemplate(fd);
      if (res.success) {
        setSubmitSuccess({
          message: res.message,
          totalCount: res.savedCount
        });
      }
    } catch (err: any) {
      alert('Gagal mengunggah template: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetModal = () => {
    setSelectedJob(null);
    setCvFile(null);
    setTemplateFile(null);
    setSubmitSuccess(null);
    setAutoFilledFields(new Set());
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      headline: '',
      totalExperienceYrs: 1,
      expectedSalary: '',
      availability: 'IMMEDIATE',
      profileSummary: '',
      skills: []
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* 1. HERO BANNER SECTION (Matching MRA Group Portal Reference) */}
      <section className="relative overflow-visible z-20 bg-gradient-to-b from-slate-50/80 via-blue-50/15 to-white pt-8 pb-14 lg:pt-12 lg:pb-20 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column (58%): Header Typography & Search Cockpit */}
            <div className="lg:col-span-7 space-y-6 z-20 relative">
              <div className="text-xs font-black tracking-widest text-slate-400 uppercase">
                BERKARIR DI MRA GROUP
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-slate-900 leading-[1.12]">
                Bertumbuh Bersama <br />
                <span className="text-blue-600">Membangun Masa Depan</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                Jadilah bagian dari ekosistem bisnis terkemuka di Indonesia. Temukan peluang karir yang sesuai dengan passion dan keahlian Anda.
              </p>

              {/* Enhanced Hero Search Bar with Headless UI Combobox & Popular Tags */}
              <HeroSearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                onSearchSubmit={() => {
                  const el = document.getElementById('lowongan');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                totalJobsCount={jobs.length}
              />
            </div>

            {/* Right Column (42%): MRA Group Corporate Headquarters */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-950/10 border border-slate-200/90 group h-[380px] sm:h-[460px] lg:h-[490px]">
                <img
                  src="/mra_building_hero.jpg"
                  alt="MRA Group Headquarters - Corporate Office Jakarta"
                  className="w-full h-full object-cover object-[center_35%] group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent pointer-events-none" />
                
                {/* Official Building Caption Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/80 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 leading-tight">Wisma MRA</p>
                      <p className="text-[10px] text-slate-500 font-medium">Head Office — Jl. TB Simatupang, Jakarta</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80">
                    MRA Group
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. BRAND SHOWCASE SECTION ("BRAND KAMI") - Infinite Animated Carousel */}
      <section id="brand-kami" className="py-8 sm:py-10 bg-white border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
                BRAND KAMI
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 hidden sm:inline-block">
                17 Portofolio Resmi MRA Group
              </span>
            </div>
            <a
              href="#lowongan"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              <span>Lihat Semua Karir Brand</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Infinite Animated Brand Carousel Track with Gradient Edge Masking */}
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] py-2">
          <motion.div
            className="flex items-center gap-6 sm:gap-8 w-max"
            animate={{
              x: ['0%', '-50%'],
            }}
            transition={{
              ease: 'linear',
              duration: 35,
              repeat: Infinity,
            }}
          >
            {/* Duplicated list for seamless infinite loop */}
            {[...MRA_SIGNATURE_BRANDS, ...MRA_SIGNATURE_BRANDS].map((brand, idx) => (
              <div
                key={`${brand.name}-${idx}`}
                className="h-16 sm:h-20 min-w-[130px] sm:min-w-[160px] px-5 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex items-center justify-center group shrink-0"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="max-h-9 sm:max-h-11 w-auto max-w-[120px] object-contain group-hover:scale-110 transition-transform duration-300 filter drop-shadow-xs"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>



      {/* 4. CATEGORY FILTER TABS & JOB LISTINGS SECTION */}
      <section id="lowongan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-16">
        {/* Category Pill Tabs matching reference design */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none mb-8">
          {CATEGORY_TABS.map((tab) => {
            const isAct = selectedPillar === tab.id;
            const Icon = tab.icon;
            const count = tab.defaultCount;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedPillar(tab.id)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2.5 shrink-0 border cursor-pointer ${
                  isAct
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isAct ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.name}</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ml-1 ${
                    isAct ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section Title & Active Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Lowongan Terbuka
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Menampilkan {filteredJobs.length} posisi strategis aktif dengan kriteria penilaian ATS otomatis
            </p>
          </div>

          {(selectedPillar !== 'ALL' || selectedLocation || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedPillar('ALL');
                setSelectedLocation('');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Semua Filter
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-64" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Tidak ada lowongan yang cocok</h3>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setViewingJob(job)}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400 p-6 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none" />

                {(() => {
                  const pillarBadge = getJobPillarBadge(job);
                  return (
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${pillarBadge.color}`}
                          >
                            {pillarBadge.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {job.department}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                          {job.employmentType}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-500" />
                        {job.division}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Min. {job.minExperience} Thn
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 font-medium text-[11px]">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          {job.minEducation || 'S1'}
                        </span>
                      </div>

                      {job.salaryMin && (
                        <div className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {formatRupiah(job.salaryMin)} - {formatRupiah(job.salaryMax)} / bln
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Skills badges */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(job.mustHaveSkills || []).slice(0, 3).map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors"
                          >
                            {s}
                          </span>
                        ))}
                        {(job.mustHaveSkills || []).length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500">
                            +{(job.mustHaveSkills || []).length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingJob(job);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-blue-700 border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lihat Detail</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedJob(job);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Lamar Cepat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* JOB DETAIL MODAL FOR CANDIDATE INFORMATION */}
      {viewingJob && (
        <JobDetailModal
          job={viewingJob}
          onClose={() => setViewingJob(null)}
          onApplyNow={(j) => setSelectedJob(j)}
        />
      )}

      {/* QUICK APPLY MODAL WITH PROFESSIONAL ANIMATIONS & HIGH-TECH SCANNER */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={resetModal}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 z-10 flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white flex items-start justify-between border-b border-slate-800/80 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      Portal Lamaran ATS
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {selectedJob.employmentType}
                    </span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-white">{selectedJob.title}</h3>
                  <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    {selectedJob.division} • {selectedJob.location}
                  </p>
                </div>
                <button
                  onClick={resetModal}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              {submitSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 text-center space-y-5 my-auto"
                >
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping opacity-75" />
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-2xl font-black text-slate-900">Lamaran Berhasil Didaftarkan!</h4>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                      Profil Anda telah berhasil dipindai oleh sistem ATS dan dikelompokkan ke dalam database rekrutmen.
                    </p>
                  </div>

                  {submitSuccess.atsScore && (
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs font-bold text-blue-900 shadow-xs">
                      <Award className="w-4 h-4 text-blue-600" />
                      Skor Kecocokan ATS: <span className="text-sm font-black text-blue-700">{submitSuccess.atsScore}%</span>
                    </div>
                  )}

                  <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      onClick={resetModal}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Selesai & Lihat Lowongan Lain
                    </button>
                    <a
                      href="/status"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
                    >
                      Lacak Status Lamaran
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  {/* Animated Tab Switcher */}
                  <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setApplyMode('ATS')}
                      className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        applyMode === 'ATS'
                          ? 'bg-white text-blue-600 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                      }`}
                    >
                      <UploadCloud className="w-4 h-4" />
                      Mode 1: Upload CV ATS (Auto-Fill)
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyMode('TEMPLATE')}
                      className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        applyMode === 'TEMPLATE'
                          ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Mode 2: Template Excel (.xlsx)
                    </button>
                  </div>

                  {/* Form Body: Mode ATS */}
                  {applyMode === 'ATS' ? (
                    <form onSubmit={handleAtsSubmit} className="p-4 sm:p-6 space-y-5">
                      {/* High-Tech CV Scanner Dropzone */}
                      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-b from-blue-50/60 to-indigo-50/30 p-5 text-center transition-all hover:border-blue-500 hover:bg-blue-50/80 group">
                        {/* Laser Scan Beam Animation */}
                        {parsingCv && (
                          <motion.div
                            initial={{ top: '0%' }}
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] z-20 pointer-events-none"
                          />
                        )}

                        <input
                          type="file"
                          id="cv-upload"
                          accept=".pdf,.docx,.doc"
                          onChange={handleCvChange}
                          className="hidden"
                        />
                        <label htmlFor="cv-upload" className="cursor-pointer block relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center mx-auto mb-2 shadow-sm border border-blue-100 group-hover:scale-105 transition-transform">
                            {parsingCv ? (
                              <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
                            ) : (
                              <UploadCloud className="w-6 h-6 text-blue-600" />
                            )}
                          </div>

                          <span className="text-xs font-bold text-slate-800 block">
                            {cvFile ? cvFile.name : 'Pilih atau Seret Dokumen CV (PDF / DOCX)'}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Algoritma parser ATS akan otomatis membaca identitas, kontak, dan keahlian Anda
                          </p>

                          {parsingCv && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="mt-3 py-1.5 px-3 bg-white/90 backdrop-blur-xs rounded-xl border border-cyan-200 text-xs font-bold text-cyan-700 inline-flex items-center gap-2 shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
                              {scanStep}
                            </motion.div>
                          )}

                          {autoFilledFields.size > 0 && !parsingCv && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full inline-flex items-center gap-1 border border-emerald-200"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {autoFilledFields.size} Kolom Berhasil Terisi Otomatis dari CV
                            </motion.div>
                          )}
                        </label>
                      </div>

                      {/* Professional Elevated Form Inputs */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                          <span>Informasi Kandidat</span>
                          <span className="text-[11px] text-slate-400 font-normal">Tinjau atau lengkapi data Anda</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          {/* Nama Lengkap */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                Nama Lengkap *
                              </span>
                              {autoFilledFields.has('fullName') && (
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  ATS Auto-filled
                                </span>
                              )}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Nama lengkap Anda..."
                              value={formData.fullName}
                              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                autoFilledFields.has('fullName') ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                              }`}
                            />
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                Alamat Email *
                              </span>
                              {autoFilledFields.has('email') && (
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  ATS Auto-filled
                                </span>
                              )}
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="email@anda.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                autoFilledFields.has('email') ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                              }`}
                            />
                          </div>

                          {/* No WhatsApp */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                No WhatsApp / Telepon *
                              </span>
                              {autoFilledFields.has('phone') && (
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  ATS Auto-filled
                                </span>
                              )}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="08xxxxxxxxxx"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                autoFilledFields.has('phone') ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'
                              }`}
                            />
                          </div>

                          {/* Total Pengalaman */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                                Total Pengalaman (Tahun)
                              </span>
                              {autoFilledFields.has('totalExperienceYrs') && (
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Estimasi ATS
                                </span>
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={formData.totalExperienceYrs}
                              onChange={(e) => setFormData({ ...formData, totalExperienceYrs: parseFloat(e.target.value) || 0 })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                          </div>

                          {/* Ekspektasi Gaji */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                              Ekspektasi Gaji (Rp)
                            </label>
                            <input
                              type="number"
                              placeholder="Contoh: 15000000"
                              value={formData.expectedSalary}
                              onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-slate-400"
                            />
                          </div>

                          {/* Status Ketersediaan */}
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              Status Ketersediaan
                            </label>
                            <select
                              value={formData.availability}
                              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                            >
                              <option value="IMMEDIATE">Siap Bekerja Segera (Immediate)</option>
                              <option value="ONE_MONTH_NOTICE">Notice 1 Bulan</option>
                              <option value="OPEN_OFFERS">Terbuka untuk Peluang</option>
                            </select>
                          </div>

                          {/* Ringkasan Profil Singkat */}
                          <div className="sm:col-span-2">
                            <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                Ringkasan Profil Singkat
                              </span>
                              {autoFilledFields.has('profileSummary') && (
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  Terekstrak Otomatis
                                </span>
                              )}
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Ceritakan ringkasan pengalaman dan keunggulan profesional Anda..."
                              value={formData.profileSummary}
                              onChange={(e) => setFormData({ ...formData, profileSummary: e.target.value })}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* Extracted Skills Tags with Micro-animation */}
                        {formData.skills.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-blue-600" />
                                Keahlian Terekstrak ATS ({formData.skills.length})
                              </span>
                              <span className="text-[10px] font-semibold text-blue-700">
                                Cocok dengan Kriteria Lowongan
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {formData.skills.map((s, idx) => (
                                <motion.span
                                  key={idx}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: idx * 0.03 }}
                                  className="px-2.5 py-1 text-xs font-semibold bg-white text-blue-700 rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  {s}
                                </motion.span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Modal Footer Buttons */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={resetModal}
                          className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          Batal
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={submitting}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                          {submitting ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Mengirim Lamaran...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Kirim Lamaran Sekarang
                            </>
                          )}
                        </motion.button>
                      </div>
                    </form>
                  ) : (
                    /* Mode Template Upload */
                    <form onSubmit={handleTemplateSubmit} className="p-4 sm:p-6 space-y-5">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-emerald-950">Template Excel Simpel (1 Sheet Saja)</p>
                          <p className="text-emerald-800 mt-0.5 leading-relaxed">
                            Cukup isi 1 baris per kandidat pada sheet <strong>Data Pelamar</strong>. Lengkap dengan kontak, pendidikan, dan keahlian tanpa perlu pindah-pindah sheet.
                          </p>
                          <a
                            href="http://localhost:5006/api/templates/download"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] shadow-xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Unduh Template Excel 1-Sheet (.xlsx)
                          </a>
                        </div>
                      </div>

                      <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/40 rounded-2xl p-8 text-center hover:bg-emerald-50/80 transition-colors">
                        <input
                          type="file"
                          id="template-upload"
                          accept=".xlsx"
                          onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <label htmlFor="template-upload" className="cursor-pointer block">
                          <div className="w-12 h-12 rounded-2xl bg-white text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-xs border border-emerald-100">
                            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                          </div>
                          <span className="text-xs font-bold text-emerald-950 block">
                            {templateFile ? templateFile.name : 'Pilih File Template Excel yang Telah Diisi (.xlsx)'}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Sistem akan otomatis mengekstrak data profil, riwayat kerja, dan menghitung skor ATS
                          </p>
                        </label>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={resetModal}
                          className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                          Batal
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={submitting || !templateFile}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          {submitting ? 'Memvalidasi & Mengimpor...' : 'Unggah & Kirim Template'}
                        </motion.button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
