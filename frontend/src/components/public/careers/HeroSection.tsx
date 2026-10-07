'use client';

import React from 'react';
import {
  Building2
} from 'lucide-react';
import HeroSearchBar from '@/components/public/HeroSearchBar';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedLocation: string;
  onLocationChange: (l: string) => void;
  totalJobsCount: number;
}

/** Hero banner: headline, search cockpit and the Wisma MRA headquarters photo */
export default function HeroSection({ searchQuery, onSearchChange, selectedLocation, onLocationChange, totalJobsCount }: Props) {
  return (
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
                onSearchChange={onSearchChange}
                selectedLocation={selectedLocation}
                onLocationChange={onLocationChange}
                onSearchSubmit={() => {
                  const el = document.getElementById('lowongan');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                totalJobsCount={totalJobsCount}
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
  );
}
