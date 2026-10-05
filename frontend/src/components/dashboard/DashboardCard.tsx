import React from 'react';

/** Shared card shell for dashboard panels */
export default function DashboardCard({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = ''
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col ${className}`}>
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-blue-600" />}
            {title}
          </h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="flex-1 min-h-0">{children}</div>
    </section>
  );
}
