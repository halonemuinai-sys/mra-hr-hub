'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight
} from 'lucide-react';
import { MRA_SIGNATURE_BRANDS } from './careersData';

/** "Brand Kami" — infinite marquee of the 17 MRA brand logos */
export default function BrandShowcase() {
  return (
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
  );
}
