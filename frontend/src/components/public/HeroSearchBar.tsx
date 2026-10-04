'use client';

import React from 'react';
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  Transition
} from '@headlessui/react';
import {
  Search,
  MapPin,
  ChevronDown,
  ArrowRight,
  X,
  Building2,
  Globe,
  Sparkles,
  Check,
  Briefcase
} from 'lucide-react';

export interface LocationOption {
  value: string;
  label: string;
  region: string;
  icon?: any;
  tag?: string;
}

const DEFAULT_LOCATIONS: LocationOption[] = [
  {
    value: '',
    label: 'Semua Lokasi',
    region: 'Seluruh unit usaha MRA Group',
    icon: Globe,
    tag: 'Semua'
  },
  {
    value: 'Jakarta Selatan',
    label: 'Jakarta Selatan',
    region: 'Wisma MRA & Kantor Pusat',
    icon: Building2,
    tag: 'Pusat'
  },
  {
    value: 'Plaza Indonesia',
    label: 'Plaza Indonesia / Senayan',
    region: 'Boutique Luxury & Retail Store',
    icon: Sparkles,
    tag: 'Luxury'
  },
  {
    value: 'Tangerang',
    label: 'Jakarta & Tangerang',
    region: 'Operasional Wilayah Jabodetabek',
    icon: MapPin,
    tag: 'Store'
  },
  {
    value: 'Bali',
    label: 'Bali & Sekitarnya',
    region: 'Resort & Boutique Luxury Retail',
    icon: MapPin,
    tag: 'Resort'
  },
  {
    value: 'Surabaya',
    label: 'Surabaya & Jawa Timur',
    region: 'Broadcast & Retail Store',
    icon: MapPin,
    tag: 'Regional'
  }
];

const POPULAR_SEARCH_TAGS = [
  'Merchandiser',
  'Fashion Consultant',
  'Broadcast Media',
  'Digital Marketing',
  'Software Engineer',
  'Barista'
];

interface HeroSearchBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedLocation: string;
  onLocationChange: (val: string) => void;
  onSearchSubmit?: () => void;
  totalJobsCount?: number;
}

export default function HeroSearchBar({
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  onSearchSubmit,
  totalJobsCount = 51
}: HeroSearchBarProps) {
  const selectedLocationObj =
    DEFAULT_LOCATIONS.find((l) => l.value === selectedLocation) || DEFAULT_LOCATIONS[0];

  const handleClearSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSearchChange('');
  };

  const handleSelectTag = (tag: string) => {
    onSearchChange(tag);
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* 1. Main Capsule Search & Filter Cockpit */}
      <form
        onSubmit={handleSubmit}
        className="relative bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl sm:rounded-full border border-slate-200/90 shadow-xl shadow-blue-950/5 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all duration-200 flex flex-col sm:flex-row items-center gap-2"
      >
        {/* Search Input Field */}
        <div className="relative flex-1 flex items-center pl-3.5 pr-2 w-full min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mr-2.5">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari posisi, divisi, atau keahlian..."
            className="w-full py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 ml-1"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Vertical Divider (Desktop) */}
        <div className="hidden sm:block h-8 w-[1px] bg-slate-200 shrink-0 mx-1" />

        {/* Headless UI Location Listbox Dropdown */}
        <div className="relative w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-slate-100 pt-1 sm:pt-0">
          <Listbox value={selectedLocation} onChange={onLocationChange}>
            {({ open }) => (
              <>
                <ListboxButton className="w-full sm:w-44 flex items-center justify-between px-3 py-2 rounded-xl sm:rounded-full hover:bg-slate-50 transition-colors text-left focus:outline-none group cursor-pointer">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                      {selectedLocationObj.label}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 ml-1 transition-transform duration-200 ${
                      open ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </ListboxButton>

                <Transition
                  show={open}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <ListboxOptions
                    static
                    className="absolute left-0 sm:right-0 mt-2 w-full sm:w-76 max-h-72 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-1.5 z-50 focus:outline-none space-y-0.5"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100 mb-1">
                      <span>Pilih Lokasi Kerja MRA</span>
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    {DEFAULT_LOCATIONS.map((loc) => {
                      const IconComponent = loc.icon || MapPin;
                      const isSelected = loc.value === selectedLocation;

                      return (
                        <ListboxOption
                          key={loc.value}
                          value={loc.value}
                          className={({ focus }) =>
                            `flex items-start justify-between gap-2 p-2 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50/90 text-blue-900 font-semibold'
                                : focus
                                ? 'bg-slate-50 text-slate-900'
                                : 'text-slate-700'
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <div className="flex items-start gap-2 min-w-0">
                                <div
                                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                    selected
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  <IconComponent className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p
                                    className={`text-xs ${
                                      selected ? 'font-bold text-blue-900' : 'font-semibold text-slate-800'
                                    }`}
                                  >
                                    {loc.label}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    {loc.region}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                {loc.tag && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                                      selected
                                        ? 'bg-blue-200/60 text-blue-800'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {loc.tag}
                                  </span>
                                )}
                                {selected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                              </div>
                            </>
                          )}
                        </ListboxOption>
                      );
                    })}
                  </ListboxOptions>
                </Transition>
              </>
            )}
          </Listbox>
        </div>

        {/* Submit Search CTA Button */}
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl sm:rounded-full bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <span>Cari Lowongan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* 2. Popular Search Chips (Paling Dicari) */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 px-1">
        <div className="flex items-center gap-1 text-slate-500 font-semibold text-[11px] mr-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Paling dicari:</span>
        </div>
        {POPULAR_SEARCH_TAGS.map((tag, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectTag(tag)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
              searchQuery.toLowerCase() === tag.toLowerCase()
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white/90 text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 border-slate-200/80 shadow-2xs hover:border-blue-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
