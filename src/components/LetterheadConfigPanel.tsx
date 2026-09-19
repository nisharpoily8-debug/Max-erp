import React, { useRef, useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Sparkles,
  Layout,
  Maximize2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Company, LetterheadConfig, LetterheadPreset, LetterheadLayout } from '../types';
import { LetterheadLogo } from './LetterheadLogo';

interface LetterheadConfigPanelProps {
  company: Company;
  config: LetterheadConfig;
  onChange: (updates: Partial<LetterheadConfig>) => void;
  onSaveAsDefault: () => void;
}

export const LetterheadConfigPanel: React.FC<LetterheadConfigPanelProps> = ({
  company,
  config,
  onChange,
  onSaveAsDefault,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  // File upload handler converting image to data URL
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
        onChange({
          showLogo: true,
          logoType: 'custom',
          logoUrl: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomLogo = () => {
    onChange({
      logoType: 'preset',
      logoUrl: undefined,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    onSaveAsDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const presets: { id: LetterheadPreset; name: string; desc: string }[] = [
    { id: 'diamond', name: 'Maxerp Prism', desc: 'Modern geometric emerald hex' },
    { id: 'apex', name: 'Apex Shield', desc: 'Corporate crest with dual chevrons' },
    { id: 'cube', name: 'Tech Cube', desc: 'Isometric architectural 3D cube' },
    { id: 'leaf', name: 'Eco Crest', desc: 'Organic sustainability emblem' },
    { id: 'monogram', name: 'Monogram', desc: 'Dynamic initial lettermark' },
  ];

  const layouts: { id: LetterheadLayout; name: string }[] = [
    { id: 'split', name: 'Split (Standard)' },
    { id: 'centered', name: 'Centered Executive' },
    { id: 'minimal', name: 'Minimalist' },
  ];

  const sizes: { height: number; label: string }[] = [
    { height: 36, label: 'Compact' },
    { height: 48, label: 'Standard' },
    { height: 64, label: 'Large' },
  ];

  return (
    <div className="p-4 bg-stone-900 border-b border-stone-800 text-stone-200 text-xs space-y-4 print:hidden animate-in fade-in duration-200">
      {/* Top row: Title and Master Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-stone-100">Document Letterhead & Logo Options</span>
          <span className="text-[10px] text-stone-400">
            Customize header branding for PDF export and printing
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.showLogo}
              onChange={(e) => onChange({ showLogo: e.target.checked })}
              className="w-4 h-4 rounded-sm bg-stone-950 border-stone-700 text-emerald-600 focus:ring-0"
            />
            <span className="font-semibold text-stone-200">Show Logo on Document</span>
          </label>

          <button
            onClick={handleSave}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition shadow-sm shadow-emerald-950"
          >
            {savedNotice ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" /> Save as Default
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      {config.showLogo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* 1. Custom Upload & Current Logo Preview */}
          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
              1. Custom Logo Upload
            </span>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-900 border border-stone-800 rounded-lg flex items-center justify-center shrink-0 min-w-[56px] min-h-[56px]">
                <LetterheadLogo
                  config={config}
                  companyName={company.name}
                  size={40}
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
                  className="w-full px-2.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-lg font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload Image</span>
                </button>

                {config.logoType === 'custom' && config.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomLogo}
                    className="w-full px-2 py-1 text-red-400 hover:text-red-300 text-[10px] flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove Custom Logo
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-stone-500">Supports PNG, SVG, JPG, WebP transparent logos</p>
          </div>

          {/* 2. Vector Logo Presets */}
          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
              2. Or Select Brand Preset
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((p) => {
                const isSelected = config.logoType === 'preset' && config.presetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        logoType: 'preset',
                        presetId: p.id,
                      })
                    }
                    className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                      <LetterheadLogo
                        config={{ ...config, logoType: 'preset', presetId: p.id, showLogo: true }}
                        companyName={company.name}
                        size={22}
                      />
                    </div>
                    <div className="truncate min-w-0">
                      <div className="text-[11px] truncate">{p.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Sizing & Layout */}
          <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
              3. Letterhead Layout & Sizing
            </span>

            {/* Logo Sizing */}
            <div>
              <span className="text-[10px] text-stone-400 block mb-1">Logo Height</span>
              <div className="flex gap-1.5">
                {sizes.map((s) => (
                  <button
                    key={s.height}
                    type="button"
                    onClick={() => onChange({ logoHeight: s.height })}
                    className={`flex-1 py-1 rounded-md text-[11px] font-medium transition ${
                      (config.logoHeight || 48) === s.height
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {s.label} ({s.height}px)
                  </button>
                ))}
              </div>
            </div>

            {/* Layout options */}
            <div>
              <span className="text-[10px] text-stone-400 block mb-1">Layout Header Style</span>
              <div className="flex gap-1">
                {layouts.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onChange({ layout: l.id })}
                    className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-medium truncate transition ${
                      (config.layout || 'split') === l.id
                        ? 'bg-stone-800 text-emerald-400 border border-emerald-500/40 font-bold'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
