'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import JobDetailModal from '@/components/public/JobDetailModal';
import HeroSection from '@/components/public/careers/HeroSection';
import BrandShowcase from '@/components/public/careers/BrandShowcase';
import JobListings from '@/components/public/careers/JobListings';
import QuickApplyModal from '@/components/public/careers/QuickApplyModal';
import { CATEGORY_TABS, matchPillar } from '@/components/public/careers/careersData';

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

  // Real job counts per business pillar (tab badges)
  const pillarCounts: Record<string, number> = Object.fromEntries(
    CATEGORY_TABS.map((t) => [t.id, jobs.filter((j) => matchPillar(j, t.id)).length])
  );

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

  return (
    <div className="min-h-screen bg-slate-50/50">
      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        totalJobsCount={jobs.length}
      />

      <BrandShowcase />

      <JobListings
        loading={loading}
        jobs={filteredJobs}
        pillarCounts={pillarCounts}
        selectedPillar={selectedPillar}
        onPillarChange={setSelectedPillar}
        hasActiveFilters={selectedPillar !== 'ALL' || !!selectedLocation || !!searchQuery}
        onResetFilters={() => {
          setSelectedPillar('ALL');
          setSelectedLocation('');
          setSearchQuery('');
        }}
        onView={setViewingJob}
        onApply={setSelectedJob}
      />

      {/* JOB DETAIL MODAL FOR CANDIDATE INFORMATION */}
      {viewingJob && (
        <JobDetailModal
          job={viewingJob}
          onClose={() => setViewingJob(null)}
          onApplyNow={(j) => setSelectedJob(j)}
        />
      )}

      <QuickApplyModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
