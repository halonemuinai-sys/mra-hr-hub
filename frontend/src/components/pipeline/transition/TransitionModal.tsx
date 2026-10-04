'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, AlertTriangle, ShieldCheck, Ban, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { stageLabel, REJECT_REASONS } from '../stages';
import StageField, { GateField } from './StageField';

export type TransitionPreview = {
  fromStatus: string;
  toStatus: string;
  direct: boolean;
  fields: GateField[];
  warnings: string[];
  blocks: string[];
  approval: { permission: string; message: string } | null;
  candidate: { id: string; fullName: string };
  job: { title: string };
};

interface Props {
  applicationId: string;
  preview: TransitionPreview;
  onClose: () => void;
  onDone: (result: { pending: boolean; message: string }) => void;
}

/** Validation form for a gated stage move (fields, warnings, blocks and approval notice come from the server) */
export default function TransitionModal({ applicationId, preview, onClose, onDone }: Props) {
  const [values, setValues] = useState<Record<string, any>>(() =>
    Object.fromEntries(preview.fields.map((f) => [f.key, f.value ?? '']))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const blocked = preview.blocks.length > 0;
  const missing = preview.fields.filter((f) => f.required && (values[f.key] === '' || values[f.key] == null || values[f.key] === false));

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.executeTransition(applicationId, { toStatus: preview.toStatus, data: values });
      onDone({ pending: !!res.pending, message: res.message });
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header: from → to */}
        <div className="p-5 border-b border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stage move requirements</p>
          <h3 className="text-sm font-bold text-slate-900 mt-0.5">{preview.candidate.fullName}</h3>
          <p className="text-[11px] text-slate-500">{preview.job.title}</p>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold">
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{stageLabel(preview.fromStatus)}</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <span className="px-2 py-1 rounded-lg bg-blue-600 text-white">{stageLabel(preview.toStatus)}</span>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {preview.blocks.map((b) => (
            <div key={b} className="flex gap-2 p-3 rounded-xl bg-slate-900 text-white text-xs">
              <Ban className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{b}</span>
            </div>
          ))}

          {preview.warnings.map((w) => (
            <div key={w} className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{w}</span>
            </div>
          ))}

          {!blocked &&
            preview.fields.map((f) => (
              <StageField
                key={f.key}
                field={f}
                value={values[f.key]}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                suggestions={f.key === 'reason' && preview.toStatus === 'REJECTED' ? REJECT_REASONS : undefined}
              />
            ))}

          {/* Approval is decided server-side from the submitted values (e.g. offer vs. budget) */}
          {!blocked && preview.approval && (
            <div className="flex gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{preview.approval.message} The candidate stays in the current stage until it is approved.</span>
            </div>
          )}
          {!blocked && preview.toStatus === 'OFFERING' && !preview.approval && (
            <p className="text-[11px] text-slate-500">
              Offers above the job&apos;s salary budget are sent to a TA Lead for approval automatically.
            </p>
          )}

          {error && (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {blocked ? 'Close' : 'Cancel'}
          </button>
          {!blocked && (
            <button
              type="button"
              onClick={submit}
              disabled={saving || missing.length > 0}
              title={missing.length ? `Complete: ${missing.map((m) => m.label).join(', ')}` : undefined}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {preview.approval ? 'Submit for approval' : `Move to ${stageLabel(preview.toStatus)}`}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
