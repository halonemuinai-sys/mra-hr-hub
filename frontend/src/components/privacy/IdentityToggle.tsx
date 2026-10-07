'use client';

import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { IDENTITY_EVENT, isIdentityHidden, setIdentityHidden } from '@/lib/identityMask';

/** Header switch for "hide identity" mode (screenshots / demos). Shortcut: Ctrl+Shift+H */
export default function IdentityToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isIdentityHidden());
    const onEvent = (e: Event) => setOn(!!(e as CustomEvent).detail);
    window.addEventListener(IDENTITY_EVENT, onEvent);
    return () => window.removeEventListener(IDENTITY_EVENT, onEvent);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setIdentityHidden(!on)}
      aria-pressed={on}
      data-identity-keep
      title={on ? 'Identity hidden — company, PT and brand names are masked on screen (Ctrl+Shift+H)' : 'Hide company identity for screenshots (Ctrl+Shift+H)'}
      className={`h-9 px-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
        on ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      }`}
    >
      {on ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      <span className="hidden md:inline">{on ? 'Identity hidden' : 'Hide identity'}</span>
    </button>
  );
}
