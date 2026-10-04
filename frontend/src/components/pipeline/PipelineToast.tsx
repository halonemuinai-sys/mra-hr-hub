'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Undo2, X } from 'lucide-react';

export type ToastState = {
  id: number;
  tone: 'success' | 'error';
  message: string;
  onUndo?: () => void;
};

interface Props {
  toast: ToastState;
  onDismiss: () => void;
}

export default function PipelineToast({ toast, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, toast.onUndo ? 7000 : 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.onUndo, onDismiss]);

  const Icon = toast.tone === 'success' ? CheckCircle2 : AlertTriangle;

  return (
    <motion.div
      key={toast.id}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="fixed top-4 right-4 z-[60] max-w-sm"
      role="status"
    >
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 flex items-center gap-3 text-xs">
        <Icon className={`w-4 h-4 shrink-0 ${toast.tone === 'success' ? 'text-emerald-600' : 'text-amber-600'}`} />
        <span className="font-semibold text-slate-800">{toast.message}</span>
        {toast.onUndo && (
          <button
            type="button"
            onClick={() => {
              toast.onUndo?.();
              onDismiss();
            }}
            className="ml-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold flex items-center gap-1 shrink-0"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Batalkan
          </button>
        )}
        <button type="button" onClick={onDismiss} className="text-slate-400 hover:text-slate-700 shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
