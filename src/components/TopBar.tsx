import React, { useState } from 'react';
import {
  Building2,
  Wifi,
  WifiOff,
  Search,
  Shield,
  Code2,
  ChevronDown,
  UserCheck,
  Check,
  Trash2,
  Sparkles,
  Palette,
  Sliders,
  Smartphone,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import { LetterheadLogo } from './LetterheadLogo';

interface TopBarProps {
  onOpenSearch: () => void;
  onOpenSync: () => void;
  onOpenArchitecture: () => void;
  onOpenCleanData?: () => void;
  onOpenLetterhead?: () => void;
  onOpenApkModal?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSearch,
  onOpenSync,
  onOpenArchitecture,
  onOpenCleanData,
  onOpenLetterhead,
  onOpenApkModal,
}) => {
  const {
    company,
    branches,
    currentBranch,
    setCurrentBranch,
    currentUser,
    setRole,
    isOnline,
    offlineQueue,
  } = useErp();

  const { themePalette, openCustomizer } = useTheme();

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const roles: UserRole[] = [
    'Administrator',
    'Manager',
    'Accountant',
    'Salesperson',
    'Purchase Officer',
    'Warehouse User',
    'Viewer',
  ];

  return (
    <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 px-4 py-2.5">
      <div className="flex items-center justify-between gap-2">
        {/* Left: Brand & Branch Picker */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenLetterhead}
            className="group relative cursor-pointer"
            title="Configure Company Brand Logo & Letterhead"
          >
            <div className="w-8 h-8 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center overflow-hidden shadow-md group-hover:border-emerald-500/50 transition">
              <LetterheadLogo
                config={
                  company.letterhead || {
                    showLogo: true,
                    logoType: 'preset',
                    presetId: 'diamond',
                    logoHeight: 48,
                    layout: 'split',
                    showCompanyDetails: true,
                  }
                }
                companyName={company.name}
                size={24}
              />
            </div>
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-tight text-stone-100">
                {company.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-800 text-emerald-400 font-mono">
                v2.4
              </span>
            </div>

            {/* Branch Selector */}
            <div className="relative">
              <button
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 transition"
              >
                <Building2 className="w-3 h-3 text-stone-500" />
                <span className="truncate max-w-[120px] sm:max-w-xs">{currentBranch.name}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {branchDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-stone-900 border border-stone-800 rounded-2xl p-1.5 shadow-2xl z-40 text-xs">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-stone-500">
                    Select Operating Branch
                  </div>
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setCurrentBranch(b);
                        setBranchDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition text-left ${
                        currentBranch.id === b.id
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                          : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      {currentBranch.id === b.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}

                  {onOpenLetterhead && (
                    <div className="mt-1 pt-1 border-t border-stone-800">
                      <button
                        onClick={() => {
                          setBranchDropdownOpen(false);
                          onOpenLetterhead();
                        }}
                        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition text-left font-medium"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Logo & Letterhead Setup</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions, Sync, Role Switcher, Architecture */}
        <div className="flex items-center gap-1.5">
          {/* Themes & Dashboard Customizer */}
          <button
            onClick={() => openCustomizer('theme')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700/70 rounded-xl text-xs font-semibold transition group shadow-xs"
            title="Themes, Colorful Icons & Dashboard Customizer"
          >
            <div
              className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0 transition-transform group-hover:scale-110"
              style={{ backgroundColor: themePalette.previewColor }}
            />
            <Palette className="w-3.5 h-3.5 text-stone-300 group-hover:text-white" />
            <span className="hidden sm:inline">Theme</span>
          </button>

          {/* Logo & Letterhead Quick Button */}
          {onOpenLetterhead && (
            <button
              onClick={onOpenLetterhead}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition"
              title="Customize Letterhead Logo for Quotations & Invoices"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Logo & Letterhead</span>
            </button>
          )}

          {/* APK & Android Export Modal Trigger */}
          {onOpenApkModal && (
            <button
              onClick={onOpenApkModal}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition shadow-sm"
              title="Export Android APK & Capacitor native project"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export APK</span>
            </button>
          )}

          {/* Architecture / Spec Modal Trigger */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition"
            title="View Android Compose Architecture, PostgreSQL DDL & REST APIs"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Arch & Specs</span>
          </button>

          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 transition"
            title="Global Search (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Clean Data Action Trigger */}
          {onOpenCleanData && (
            <button
              onClick={onOpenCleanData}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-red-500/20 text-stone-400 hover:text-red-400 transition"
              title="Clean All Data (Production Reset)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Sync & Offline Status */}
          <button
            onClick={onOpenSync}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium border transition ${
              isOnline
                ? 'bg-stone-950 text-stone-300 border-stone-800 hover:border-emerald-500/40'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/40'
            }`}
            title="Android Offline Sync Manager"
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
            {offlineQueue.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 text-[10px] font-bold flex items-center justify-center">
                {offlineQueue.length}
              </span>
            )}
          </button>

          {/* Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 hover:bg-stone-750 border border-stone-700/60 rounded-xl text-xs text-stone-200 transition"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold max-w-[80px] sm:max-w-[110px] truncate">
                {currentUser.role}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-stone-900 border border-stone-800 rounded-2xl p-1.5 shadow-2xl z-40 text-xs">
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-stone-500 border-b border-stone-800">
                  Switch Active Role (RBAC Simulation)
                </div>
                <div className="py-1">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left ${
                        currentUser.role === r
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                          : 'text-stone-300 hover:bg-stone-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">{r}</div>
                        <div className="text-[10px] text-stone-500">
                          {r === 'Administrator' && 'Unlimited approval & system controls'}
                          {r === 'Manager' && 'Approval limit: $100,000'}
                          {r === 'Accountant' && 'General ledger, tax & invoice posting'}
                          {r === 'Salesperson' && 'Quotations & customer orders'}
                          {r === 'Purchase Officer' && 'RFQs & vendor procurement'}
                          {r === 'Warehouse User' && 'Goods receipt, scans & stock counts'}
                          {r === 'Viewer' && 'Read-only access & compliance auditor'}
                        </div>
                      </div>
                      {currentUser.role === r && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
