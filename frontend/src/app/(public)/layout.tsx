'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Briefcase, FileSpreadsheet, Search, ShieldCheck, Menu, X, ArrowRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TEMPLATE_DOWNLOAD_URL } from '@/lib/api';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar matching MRA Group Portal design */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* MRA GROUP Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/brands/mra_logo.png"
                alt="MRA GROUP"
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link
              href="/"
              className="text-slate-900 relative py-2 font-bold transition-colors after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-blue-600 after:rounded-full"
            >
              Karir
            </Link>
            <a href="#brand-kami" className="hover:text-blue-600 transition-colors py-2">
              Brand & Unit Bisnis
            </a>
          </nav>

          {/* Right Action Button: Masuk */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/status"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-all border border-slate-300 shadow-2xs hover:border-slate-400 active:scale-95"
            >
              <User className="w-4 h-4 text-slate-600" />
              <span>Masuk</span>
            </Link>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/status"
              className="p-2 rounded-xl text-slate-700 border border-slate-200 text-xs font-bold"
            >
              <User className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-red-500" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-2 shadow-lg overflow-hidden"
            >
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span>Jelajahi Lowongan Kerja</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                href="/status"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Lacak Status Lamaran Mandiri</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <a
                href={TEMPLATE_DOWNLOAD_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50/60 border border-emerald-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Unduh Master Template (.xlsx)</span>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">Download</span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Public Content */}
      <main className="flex-1 bg-slate-50">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 HR HUB Automation System. Decoupled Architecture by MRA Group.</p>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/" className="hover:text-blue-600">Karir</Link>
            <Link href="/status" className="hover:text-blue-600">Lacak Status Lamaran</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
