import React, { useState, useRef } from 'react';
import {
  X,
  Building,
  Sparkles,
  Upload,
  Check,
  CheckCircle2,
  Trash2,
  FileText,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { LetterheadConfig, LetterheadPreset, LetterheadLayout } from '../types';
import { LetterheadLogo } from './LetterheadLogo';
import { LetterheadHeader } from './LetterheadHeader';

interface CompanyLetterheadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyLetterheadModal: React.FC<CompanyLetterheadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { company, updateCompany, updateLetterhead } = useErp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // Form states
  const [name, setName] = useState(company.name);
  const [legalName, setLegalName] = useState(company.legalName);
  const [taxRegistrationNumber, setTaxRegistrationNumber] = useState(company.taxRegistrationNumber);
  const [address, setAddress] = useState(company.address);
  const [phone, setPhone] = useState(company.phone);
  const [email, setEmail] = useState(company.email);
  const [website, setWebsite] = useState(company.website);

  // Letterhead states
  const [letterhead, setLetterhead] = useState<LetterheadConfig>(
    company.letterhead || {
      showLogo: true,
      logoType: 'preset',
      presetId: 'diamond',
      logoHeight: 48,
      layout: 'split',
      showCompanyDetails: true,
      tagline: 'Enterprise Resource & Operations Platform',
      accentColor: '#059669',
    }
  );

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLetterhead((prev) => ({
          ...prev,
          showLogo: true,
          logoType: 'custom',
          logoUrl: dataUrl,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLetterhead((prev) => ({
      ...prev,
      logoType: 'preset',
      logoUrl: undefined,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveAll = () => {
    updateCompany({
      name,
      legalName,
      taxRegistrationNumber,
      address,
      phone,
      email,
      website,
    });
    updateLetterhead(letterhead);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1200);
  };

  const presets: { id: LetterheadPreset; name: string }[] = [
    { id: 'diamond', name: 'Maxerp Prism' },
    { id: 'apex', name: 'Apex Shield' },
    { id: 'cube', name: 'Tech Cube' },
    { id: 'leaf', name: 'Eco Crest' },
    { id: 'monogram', name: 'Monogram' },
  ];

  const layouts: { id: LetterheadLayout; name: string }[] = [
    { id: 'split', name: 'Split (Standard)' },
    { id: 'centered', name: 'Centered Executive' },
    { id: 'minimal', name: 'Minimalist' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-stone-900 text-stone-100 rounded-3xl shadow-2xl border border-stone-800 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Company Brand & Document Letterhead
              </h2>
              <p className="text-xs text-stone-400">
                Configure logo, legal entity info, and header formatting for quotations and invoices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 1. Logo Options Section */}
          <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Logo Settings
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={letterhead.showLogo}
                  onChange={(e) =>
                    setLetterhead((prev) => ({ ...prev, showLogo: e.target.checked }))
                  }
                  className="w-4 h-4 rounded bg-stone-900 border-stone-700 text-emerald-600 focus:ring-0"
                />
                <span className="text-xs font-semibold text-stone-300">Show Logo on Documents</span>
              </label>
            </div>

            {letterhead.showLogo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Custom Upload */}
                <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-2.5">
                  <span className="text-[11px] font-semibold text-stone-300 block">
                    Upload Custom Image Logo
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-center shrink-0 min-w-[50px] min-h-[50px]">
                      <LetterheadLogo
                        config={letterhead}
                        companyName={name}
                        size={38}
                      />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-2.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Choose File</span>
                      </button>

                      {letterhead.logoType === 'custom' && letterhead.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="w-full text-red-400 hover:text-red-300 text-[10px] flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Custom Logo
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-500">
                    PNG with transparency or SVG recommended.
                  </p>
                </div>

                {/* Vector Presets */}
                <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-2">
                  <span className="text-[11px] font-semibold text-stone-300 block">
                    Or Choose Brand Preset
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {presets.map((p) => {
                      const isSelected =
                        letterhead.logoType === 'preset' && letterhead.presetId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setLetterhead((prev) => ({
                              ...prev,
                              logoType: 'preset',
                              presetId: p.id,
                            }))
                          }
                          className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 transition ${
                            isSelected
                              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 font-semibold'
                              : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                          }`}
                        >
                          <LetterheadLogo
                            config={{ ...letterhead, logoType: 'preset', presetId: p.id, showLogo: true }}
                            companyName={name}
                            size={18}
                          />
                          <span className="text-[11px] truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Layout and Height */}
            {letterhead.showLogo && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-stone-800/80">
                <div>
                  <span className="text-[11px] text-stone-400 block mb-1">Header Layout Style</span>
                  <div className="flex gap-1">
                    {layouts.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLetterhead((prev) => ({ ...prev, layout: l.id }))}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium truncate transition ${
                          (letterhead.layout || 'split') === l.id
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-stone-400 block mb-1">Document Tagline / Subtitle</span>
                  <input
                    type="text"
                    value={letterhead.tagline || ''}
                    onChange={(e) =>
                      setLetterhead((prev) => ({ ...prev, tagline: e.target.value }))
                    }
                    placeholder="e.g. Enterprise Resource & Operations Platform"
                    className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Company Information Section */}
          <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
              Company Legal & Contact Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Company Trade Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Legal Registered Entity</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Tax / VAT Registration ID</label>
                <input
                  type="text"
                  value={taxRegistrationNumber}
                  onChange={(e) => setTaxRegistrationNumber(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Business Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-stone-400 block mb-1">Registered Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Website URL</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Live Letterhead Preview */}
          <div className="p-4 bg-white text-stone-900 rounded-2xl border border-stone-300 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Live Letterhead Sample Preview
            </span>
            <LetterheadHeader
              company={{
                ...company,
                name,
                legalName,
                taxRegistrationNumber,
                address,
                phone,
                email,
                website,
              }}
              config={letterhead}
              documentTitle="TAX INVOICE / QUOTATION"
              documentNumber="DOC-2026-0001"
              dateLabel="Date"
              dateValue="2026-09-19"
              secondaryDateLabel="Valid Until"
              secondaryDateValue="2026-10-19"
              statusBadge={{ label: 'SAMPLE' }}
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950 border-t border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-emerald-950"
          >
            {savedNotice ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Changes Saved!
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Save Company & Letterhead
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
