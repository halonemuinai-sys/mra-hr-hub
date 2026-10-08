'use client';

import React from 'react';

/** Document model from backend/services/offerLetter/offerDocument.js — same content as the PDF */
export type OfferDocument = {
  language: 'id' | 'en';
  letterhead: { name: string; address: string; npwp: string };
  title: string;
  reference: { label: string; value: string };
  placeDate: string;
  recipient: { heading: string; name: string; lines: string[] };
  subject: string;
  greeting: string;
  intro: string;
  terms: { label: string; value: string }[];
  pay: { label: string; value: string }[];
  total: { label: string; value: string } | null;
  benefits: { heading: string; items: string[] };
  additional: { heading: string; items: string[] };
  paragraphs: string[];
  signoff: { regards: string; company: string; name: string; title: string };
  acceptance: { title: string; text: string; fields: string[]; name: string };
};

/** The letter on an A4-like sheet (preview of the PDF) */
export default function OfferPreview({ doc }: { doc: OfferDocument }) {
  const Row = ({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) => (
    <tr className="border-b border-slate-200">
      <td className="py-1 pl-1.5 pr-3 align-top text-slate-500 w-[38%]">{label}</td>
      <td className={`py-1 pr-1.5 align-top text-slate-900 ${bold ? 'font-bold' : ''}`}>{value}</td>
    </tr>
  );
  const Bullets = ({ block }: { block: { heading: string; items: string[] } }) =>
    block.items.length ? (
      <div className="mt-3">
        <p className="font-bold text-slate-900">{block.heading}</p>
        <ul className="mt-1 space-y-0.5 pl-2">
          {block.items.map((it, i) => (
            <li key={i}>•&nbsp;&nbsp;{it}</li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <div className="bg-white shadow-md border border-slate-200 mx-auto w-full max-w-[640px] aspect-auto px-9 py-8 text-[10.5px] leading-[1.55] text-slate-800 font-[Helvetica,Arial,sans-serif]">
      <div className="flex items-start gap-3 pb-2.5 border-b-2 border-blue-600">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mra_logo.png" alt="MRA Group" className="h-9 w-auto object-contain" />
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-slate-900 leading-tight">{doc.letterhead.name}</p>
          {doc.letterhead.address && <p className="text-[8.5px] text-slate-500 leading-snug">{doc.letterhead.address}</p>}
          {doc.letterhead.npwp && <p className="text-[8.5px] text-slate-500">NPWP {doc.letterhead.npwp}</p>}
        </div>
      </div>

      <div className="flex justify-between gap-4 mt-4">
        <p>
          {doc.reference.label}: <span className={doc.reference.value === '(draft)' ? 'text-amber-700 font-semibold' : ''}>{doc.reference.value}</span>
        </p>
        <p className="text-right">{doc.placeDate}</p>
      </div>
      <div className="mt-3">
        <p>{doc.recipient.heading}</p>
        <p className="font-bold text-slate-900">{doc.recipient.name || '—'}</p>
        {doc.recipient.lines.map((l, i) => (
          <p key={i} className="text-slate-500">
            {l}
          </p>
        ))}
      </div>

      <p className="text-center font-bold text-[12.5px] text-slate-900 mt-4 tracking-wide">{doc.title}</p>
      <p className="text-center font-bold text-slate-900">{doc.subject}</p>

      <p className="mt-3">{doc.greeting}</p>
      <p className="mt-1.5 text-justify">{doc.intro}</p>

      <table className="w-full mt-2 border-collapse">
        <tbody>
          {doc.terms.map((r) => (
            <Row key={r.label} {...r} />
          ))}
          {doc.pay.map((r, i) => (
            <Row key={r.label + i} {...r} bold={i === 0} />
          ))}
          {doc.total && <Row {...doc.total} bold />}
        </tbody>
      </table>

      <Bullets block={doc.benefits} />
      <Bullets block={doc.additional} />

      <div className="mt-3 space-y-1.5 text-justify">
        {doc.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-4">
        <p>{doc.signoff.regards}</p>
        <p className="font-bold text-slate-900">{doc.signoff.company}</p>
        <div className="h-10" />
        <p className="font-bold text-slate-900">{doc.signoff.name || '—'}</p>
        <p className="text-slate-500">{doc.signoff.title}</p>
      </div>

      <div className="mt-5 border border-slate-200 p-3">
        <p className="font-bold text-slate-900">{doc.acceptance.title}</p>
        <p className="mt-1">{doc.acceptance.text}</p>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {doc.acceptance.fields.map((f, i) => (
            <div key={f}>
              <p className="h-4 text-slate-900">{i === 0 ? doc.acceptance.name : ''}</p>
              <div className="border-t border-slate-400 mt-1" />
              <p className="text-[8.5px] text-slate-500 mt-0.5">{f}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
