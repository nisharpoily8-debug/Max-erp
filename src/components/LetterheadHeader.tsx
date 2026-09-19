import React from 'react';
import { Company, LetterheadConfig } from '../types';
import { LetterheadLogo } from './LetterheadLogo';

interface LetterheadHeaderProps {
  company: Company;
  config: LetterheadConfig;
  documentTitle: string;
  documentNumber: string;
  dateLabel?: string;
  dateValue: string;
  secondaryDateLabel?: string;
  secondaryDateValue?: string;
  statusBadge?: {
    label: string;
    variant?: 'emerald' | 'amber' | 'sky' | 'rose' | 'stone';
  };
}

export const LetterheadHeader: React.FC<LetterheadHeaderProps> = ({
  company,
  config,
  documentTitle,
  documentNumber,
  dateLabel = 'Date',
  dateValue,
  secondaryDateLabel,
  secondaryDateValue,
  statusBadge,
}) => {
  const layout = config.layout || 'split';

  if (layout === 'centered') {
    return (
      <div className="border-b-2 border-stone-800 pb-6 mb-6">
        {/* Centered Logo & Company Brand */}
        <div className="flex flex-col items-center text-center space-y-2 mb-4">
          {config.showLogo && (
            <div className="mb-1">
              <LetterheadLogo
                config={config}
                companyName={company.name}
                size={config.logoHeight || 52}
              />
            </div>
          )}
          <h1 className="text-2xl font-black tracking-tight text-stone-900 uppercase">
            {company.name}
          </h1>
          {config.tagline && (
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-widest -mt-1">
              {config.tagline}
            </p>
          )}

          {config.showCompanyDetails && (
            <div className="text-xs text-stone-500 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 max-w-xl">
              <span>{company.address}</span>
              <span>•</span>
              <span>Tax/VAT ID: <strong className="text-stone-700 font-mono">{company.taxRegistrationNumber}</strong></span>
              <span>•</span>
              <span>Tel: {company.phone}</span>
              <span>•</span>
              <span>{company.email}</span>
              {company.website && (
                <>
                  <span>•</span>
                  <span>{company.website}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Document Title Banner */}
        <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tight text-stone-900 font-mono">
              {documentTitle}
            </span>
            <span className="text-base font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {documentNumber}
            </span>
            {statusBadge && (
              <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold uppercase bg-stone-100 text-stone-700">
                {statusBadge.label}
              </span>
            )}
          </div>

          <div className="text-right text-xs text-stone-600 flex items-center gap-4">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                {dateLabel}
              </span>
              <span className="font-mono font-medium text-stone-800">{dateValue}</span>
            </div>
            {secondaryDateLabel && secondaryDateValue && (
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-semibold">
                  {secondaryDateLabel}
                </span>
                <span className="font-mono font-medium text-stone-800">{secondaryDateValue}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <div className="border-b border-stone-300 pb-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.showLogo && (
              <LetterheadLogo
                config={config}
                companyName={company.name}
                size={Math.min(config.logoHeight || 40, 44)}
              />
            )}
            <div>
              <h1 className="text-lg font-bold text-stone-900 tracking-tight leading-tight">
                {company.name}
              </h1>
              {config.showCompanyDetails && (
                <p className="text-[11px] text-stone-500">
                  Tax ID: <span className="font-mono text-stone-700">{company.taxRegistrationNumber}</span> • {company.phone} • {company.email}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-base font-black font-mono tracking-tight text-stone-900 uppercase">
                {documentTitle}
              </span>
              {statusBadge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-mono font-semibold">
                  {statusBadge.label}
                </span>
              )}
            </div>
            <p className="text-sm font-bold font-mono text-emerald-700">{documentNumber}</p>
            <p className="text-[11px] text-stone-500">
              {dateLabel}: <span className="font-medium text-stone-800 font-mono">{dateValue}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default 'split' layout
  return (
    <div className="flex justify-between items-start border-b-2 border-stone-200 pb-6 mb-6">
      {/* Left: Logo & Company Identity */}
      <div className="space-y-1.5 max-w-sm">
        <div className="flex items-center gap-3 mb-1">
          {config.showLogo && (
            <div className="shrink-0">
              <LetterheadLogo
                config={config}
                companyName={company.name}
                size={config.logoHeight || 48}
              />
            </div>
          )}
          <div>
            <h1 className="text-xl font-black tracking-tight text-stone-900 leading-tight">
              {company.name}
            </h1>
            {config.tagline && (
              <p className="text-[11px] font-medium text-emerald-700 tracking-wide uppercase">
                {config.tagline}
              </p>
            )}
          </div>
        </div>

        {config.showCompanyDetails && (
          <div className="text-xs text-stone-500 space-y-0.5 leading-relaxed pt-1">
            <p>{company.address}</p>
            <p className="font-mono text-[11px]">
              Tax/VAT ID: <span className="text-stone-800 font-semibold">{company.taxRegistrationNumber}</span>
            </p>
            <p className="text-[11px]">
              Phone: {company.phone} • Email: {company.email}
            </p>
            {company.website && (
              <p className="text-[11px] text-stone-400">{company.website}</p>
            )}
          </div>
        )}
      </div>

      {/* Right: Document Title, Number & Key Dates */}
      <div className="text-right space-y-1">
        <div className="flex items-center justify-end gap-2">
          <span className="text-2xl font-black text-stone-900 font-mono tracking-tight uppercase">
            {documentTitle}
          </span>
        </div>
        <p className="text-base font-bold font-mono text-emerald-700 bg-emerald-50 inline-block px-2.5 py-0.5 rounded-md border border-emerald-200">
          {documentNumber}
        </p>

        {statusBadge && (
          <div className="pt-1">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase bg-stone-100 text-stone-700 border border-stone-200">
              {statusBadge.label}
            </span>
          </div>
        )}

        <div className="pt-2 text-xs text-stone-500 space-y-0.5">
          <p>
            {dateLabel}: <span className="font-semibold text-stone-800 font-mono">{dateValue}</span>
          </p>
          {secondaryDateLabel && secondaryDateValue && (
            <p>
              {secondaryDateLabel}:{' '}
              <span className="font-semibold text-stone-800 font-mono">{secondaryDateValue}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
