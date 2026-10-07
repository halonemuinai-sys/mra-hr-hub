'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, Building2, ExternalLink } from 'lucide-react';

interface Brand {
  name: string;
  category: string;
  logo: string;
  tagline: string;
}

const BRANDS_ROW_1: Brand[] = [
  { name: 'BVLGARI', category: 'Luxury Retail', logo: '/brands/brand_01_bvlgari.png', tagline: 'Italian Luxury Jewelry & Watches' },
  { name: 'OMEGA', category: 'Luxury Retail', logo: '/brands/brand_02_omega.png', tagline: 'Swiss Precision Haute Horlogerie' },
  { name: 'Häagen-Dazs', category: 'Food & Beverage', logo: '/brands/brand_06_haagendazs.png', tagline: 'Super-Premium Ice Cream Cafes' },
  { name: 'Jamba Juice', category: 'Food & Beverage', logo: '/brands/brand_05_jamba.png', tagline: 'Wholesome Blended Smoothies' },
  { name: 'Atmos', category: 'Fashion & Streetwear', logo: '/brands/brand_07_atmos.png', tagline: 'Tokyo Sneaker & Apparel Boutique' },
  { name: 'Chronologie', category: 'Luxury Timepieces', logo: '/brands/brand_04_chronologie.png', tagline: 'Luxury Multi-brand Watches' },
  { name: 'Art Jakarta', category: 'Art & Exhibitions', logo: '/brands/brand_03_artjakarta.png', tagline: 'Southeast Asia Contemporary Art Fair' },
  { name: 'Iswara', category: 'Lifestyle', logo: '/brands/brand_13_iswara.png', tagline: 'Boutique Lifestyle Experience' },
];

const BRANDS_ROW_2: Brand[] = [
  { name: "Harper's Bazaar", category: 'Print & Digital Media', logo: '/brands/brand_08_bazaar.png', tagline: "The World's Leading Fashion Magazine" },
  { name: 'Cosmopolitan', category: 'Print & Digital Media', logo: '/brands/brand_09_cosmopolitan.png', tagline: 'Premier Lifestyle & Culture Media' },
  { name: 'Hard Rock FM', category: 'Broadcast Radio', logo: '/brands/brand_16_hardrock.png', tagline: 'Indonesia 1st Lifestyle & Music Radio' },
  { name: 'Her World', category: 'Print & Digital Media', logo: '/brands/brand_10_herworld.png', tagline: 'Empowering Modern Women Media' },
  { name: 'Mother & Beyond', category: 'Parenting Media', logo: '/brands/brand_11_motherandbeyond.png', tagline: 'Trusted Parenting & Family Guide' },
  { name: 'CASA Indonesia', category: 'Architecture & Living', logo: '/brands/brand_12_casa.png', tagline: 'Interior Design & Architecture Authority' },
  { name: 'Parentalk', category: 'Digital Community', logo: '/brands/brand_15_parentalk.png', tagline: 'Digital Platform for Millennial Parents' },
  { name: 'TRL', category: 'Digital Media', logo: '/brands/brand_14_trl.png', tagline: 'Trend & Pop-Culture Hub' },
  { name: 'MRAMU', category: 'Creative Network', logo: '/brands/brand_17_mramu.png', tagline: 'MRA Media Integrated Ecosystem' },
];

export interface CorporatePillar {
  id: string;
  name: string;
  badge: string;
}

export const CORPORATE_PILLARS: CorporatePillar[] = [
  { id: 'ALL', name: 'Semua Bidang Karir', badge: 'All Openings' },
  { id: 'LUXURY', name: 'Luxury Retail & Fashion', badge: 'BVLGARI / OMEGA' },
  { id: 'FNB', name: 'Food & Beverage Franchises', badge: 'Häagen-Dazs / Jamba' },
  { id: 'RADIO', name: 'National Broadcast Radio', badge: 'Hard Rock FM' },
  { id: 'MEDIA', name: 'High-End Print & Digital Media', badge: 'Bazaar / Cosmo' },
  { id: 'CORP', name: 'Corporate & Technology', badge: 'Shared Service' },
];

interface BrandLogoCarouselProps {
  selectedPillar?: string;
  onSelectPillar?: (pillarId: string) => void;
  pillarCounts?: Record<string, number>;
}

export default function BrandLogoCarousel({
  selectedPillar = 'ALL',
  onSelectPillar,
  pillarCounts = {}
}: BrandLogoCarouselProps) {
  return (
    <section className="py-10 sm:py-16 bg-white border-y border-slate-200/80 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-50 via-blue-50/50 to-blue-50 rounded-full blur-3xl pointer-events-none opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200/80 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          PT MUGI REKSO ABADI (MRA GROUP)
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <div className="relative w-32 sm:w-36 h-9 sm:h-10 flex items-center justify-center">
            <Image
              src="/brands/mra_logo.png"
              alt="MRA Group Logo"
              width={140}
              height={40}
              className="object-contain"
            />
          </div>
          <span className="hidden sm:inline text-slate-300 text-xl font-light">|</span>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
            Portofolio Brand & Unit Bisnis Terkemuka
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Peluang karir lintas industri terintegrasi: Retail Mewah (Luxury Goods), Makanan & Minuman Internasional, Media Cetak & Digital Terbesar, serta Jaringan Radio Nasional.
        </p>
      </div>

      {/* Infinite Marquee Container with Left and Right Gradient Masks */}
      <div className="relative w-full overflow-hidden space-y-3 sm:space-y-4">
        {/* Left Gradient Fade Mask */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent z-20" />
        {/* Right Gradient Fade Mask */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent z-20" />

        {/* Row 1: Retail, Luxury, F&B (Slides Left) */}
        <div className="animate-marquee gap-3 sm:gap-4 flex py-1">
          {[...BRANDS_ROW_1, ...BRANDS_ROW_1].map((brand, idx) => (
            <div
              key={idx}
              className="group flex items-center gap-3 sm:gap-4 bg-white hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-300 rounded-xl sm:rounded-2xl px-4 py-2 sm:px-6 sm:py-3.5 shadow-xs hover:shadow-md transition-all duration-300 shrink-0 cursor-default"
            >
              <div className="relative w-22 sm:w-28 h-8 sm:h-11 flex items-center justify-center">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={110}
                  height={44}
                  className="max-h-7 sm:max-h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                />
              </div>
              <div className="text-left border-l border-slate-200 pl-3 hidden md:block">
                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {brand.name}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                  {brand.category}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Media, Broadcast, Lifestyle (Slides Right) */}
        <div className="animate-marquee-reverse gap-3 sm:gap-4 flex py-1">
          {[...BRANDS_ROW_2, ...BRANDS_ROW_2].map((brand, idx) => (
            <div
              key={idx}
              className="group flex items-center gap-3 sm:gap-4 bg-white hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-300 rounded-xl sm:rounded-2xl px-4 py-2 sm:px-6 sm:py-3.5 shadow-xs hover:shadow-md transition-all duration-300 shrink-0 cursor-default"
            >
              <div className="relative w-22 sm:w-28 h-8 sm:h-11 flex items-center justify-center">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={110}
                  height={44}
                  className="max-h-7 sm:max-h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                />
              </div>
              <div className="text-left border-l border-slate-200 pl-3 hidden md:block">
                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                  {brand.name}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                  {brand.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corporate Pillar Interactive Navigation Buttons (User Requested) */}
      <div className="max-w-5xl mx-auto px-4 mt-8 relative z-10">
        <div className="text-center mb-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Navigasi Cepat Lowongan Berdasarkan Pilar Bisnis MRA Group:
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          {CORPORATE_PILLARS.map((pillar) => {
            const isSelected = selectedPillar === pillar.id;
            const count = pillarCounts[pillar.id] ?? 0;
            return (
              <motion.button
                key={pillar.id}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (onSelectPillar) {
                    onSelectPillar(pillar.id);
                  }
                  const el = document.getElementById('lowongan');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`group px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20 ring-2 ring-blue-500/40'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 hover:border-blue-300 shadow-xs'
                }`}
              >
                <span className="tracking-tight">{pillar.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700'
                  }`}
                >
                  {count} Posisi
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
