import React from 'react';
import {
  Palette,
  Sliders,
  Sparkles,
  Layout,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Shield,
  DollarSign,
  ShoppingCart,
  Receipt,
  Truck,
  Package,
  BookOpenCheck,
  BarChart3,
  Users,
  Building2,
  AlertCircle,
  X,
  Target,
  Clock,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  useTheme,
  ThemeColor,
  ThemeMode,
  IconStyle,
  DashboardPreset,
  LayoutDensity,
  KpiMetricId,
  THEME_PALETTES,
} from '../context/ThemeContext';

export const ThemeAndDashboardModal: React.FC = () => {
  const {
    themeColor,
    setThemeColor,
    themeMode,
    setThemeMode,
    colorfulIcons,
    setColorfulIcons,
    iconStyle,
    setIconStyle,
    dashboardConfig,
    toggleWidget,
    setSelectedKpis,
    setMonthlyTarget,
    setLayoutDensity,
    applyPreset,
    resetDashboardConfig,
    isCustomizerOpen,
    setIsCustomizerOpen,
    customizerTab,
    setCustomizerTab,
  } = useTheme();

  if (!isCustomizerOpen) return null;

  const colorThemes: { id: ThemeColor; name: string; desc: string; color: string }[] = [
    { id: 'emerald', name: 'Emerald Forest', desc: 'Classic executive & enterprise green', color: '#10b981' },
    { id: 'sapphire', name: 'Cyber Sapphire', desc: 'High-tech electric blue & cobalt', color: '#3b82f6' },
    { id: 'amethyst', name: 'Royal Amethyst', desc: 'Deep violet, purple & magenta', color: '#a855f7' },
    { id: 'amber', name: 'Sunset Amber', desc: 'Warm gold, bronze & orange', color: '#f59e0b' },
    { id: 'cyan', name: 'Oceanic Cyan', desc: 'Aquamarine, neon cyan & teal', color: '#06b6d4' },
    { id: 'rose', name: 'Ruby Rose', desc: 'Modern crimson, scarlet & rose', color: '#f43f5e' },
    { id: 'titanium', name: 'Titanium Slate', desc: 'High-contrast monochrome neutral', color: '#78716c' },
  ];

  const modes: { id: ThemeMode; name: string; desc: string; icon: any }[] = [
    { id: 'dark', name: 'Dark Slate', desc: 'Default eye-friendly dark mode', icon: Moon },
    { id: 'midnight', name: 'OLED Midnight', desc: 'Deep black background for high contrast', icon: Shield },
    { id: 'light', name: 'Crisp Studio', desc: 'Refined high-contrast clean mode', icon: Sun },
  ];

  const iconVibrancies: { id: IconStyle; name: string; desc: string }[] = [
    { id: 'vivid', name: 'Vivid Neon Badges', desc: 'Rich, high-visibility colored background pills' },
    { id: 'pastel', name: 'Soft Pastel Duotone', desc: 'Gentle, balanced tones with subtle borders' },
    { id: 'gradient', name: 'Radial Glow Gradient', desc: 'Luminous backdrop with subtle aura' },
  ];

  const presets: { id: DashboardPreset; name: string; desc: string }[] = [
    { id: 'executive', name: 'Executive Overview', desc: 'Comprehensive C-Suite KPIs, cash & revenue' },
    { id: 'operations', name: 'Operational & Warehouse', desc: 'Inventory stock, low-stock alerts, procurement' },
    { id: 'finance', name: 'Finance & Controller', desc: 'Receivables, payables, margins & ledger flow' },
    { id: 'sales', name: 'Commercial Sales', desc: 'Sales orders, monthly goal tracker, customers' },
    { id: 'minimalist', name: 'Minimalist Fast', desc: 'Essential KPIs only, zero clutter' },
  ];

  const availableKpiOptions: { id: KpiMetricId; name: string; category: string; icon: any; color: string }[] = [
    { id: 'revenue', name: 'Total Sales Revenue', category: 'Sales', icon: ShoppingCart, color: 'text-emerald-400' },
    { id: 'margin', name: 'Operating Margin (%)', category: 'Profitability', icon: TrendingUp, color: 'text-teal-400' },
    { id: 'cash', name: 'Liquid Cash & Bank', category: 'Treasury', icon: DollarSign, color: 'text-lime-400' },
    { id: 'receivables', name: 'Accounts Receivable (A/R)', category: 'Finance', icon: Receipt, color: 'text-cyan-400' },
    { id: 'payables', name: 'Accounts Payable (A/P)', category: 'Procurement', icon: Truck, color: 'text-rose-400' },
    { id: 'low_stock', name: 'Low Stock Reorder Alerts', category: 'Inventory', icon: AlertCircle, color: 'text-amber-400' },
    { id: 'inventory_val', name: 'Total Inventory Valuation', category: 'Inventory', icon: Package, color: 'text-purple-400' },
    { id: 'approvals', name: 'Pending System Approvals', category: 'Governance', icon: Shield, color: 'text-yellow-400' },
    { id: 'customers', name: 'Active Customer Accounts', category: 'CRM', icon: Users, color: 'text-fuchsia-400' },
    { id: 'vendors', name: 'Active Supplier Accounts', category: 'Procurement', icon: Building2, color: 'text-sky-400' },
    { id: 'orders_count', name: 'Total Orders Issued', category: 'Sales', icon: Activity, color: 'text-blue-400' },
    { id: 'po_spend', name: 'Total Purchase Outlay', category: 'Procurement', icon: DollarSign, color: 'text-amber-500' },
  ];

  const widgetDefinitions: { key: keyof typeof dashboardConfig.visibleWidgets; label: string; desc: string; icon: any }[] = [
    { key: 'kpiCards', label: 'Primary KPI Cards Grid', desc: 'Selected headline business metrics', icon: Layout },
    { key: 'salesTarget', label: 'Monthly Sales Target Goal', desc: 'Visual progress towards revenue objective', icon: Target },
    { key: 'quickActions', label: 'Colorful Quick Action Buttons', desc: '1-click shortcuts for PO, Sales, Invoices & Scans', icon: Sparkles },
    { key: 'roleFocus', label: 'Role-Specific Intelligence Brief', desc: 'Tailored workflow priorities per login role', icon: Shield },
    { key: 'revenueChart', label: 'Branch Revenue Contribution', desc: 'Multi-branch performance & sales shares', icon: BarChart3 },
    { key: 'cashFlow', label: 'Cash Health & Working Capital', desc: 'Liquid assets, bank balances & solvency metrics', icon: DollarSign },
    { key: 'lowStockAlerts', label: 'Low Stock & Reorder Warnings', desc: 'Items under safety buffer with 1-click reorder', icon: Package },
    { key: 'pendingApprovals', label: 'Pending Approvals Inbox', desc: 'Actionable orders awaiting manager sign-off', icon: AlertCircle },
    { key: 'recentActivity', label: 'Live Audit Trail & Transactions', desc: 'Real-time feed of system movements', icon: Clock },
    { key: 'categoryBreakdown', label: 'Product Category Breakdown', desc: 'Catalog distribution and stock allocation', icon: Layers },
  ];

  const toggleKpiSelection = (id: KpiMetricId) => {
    const current = [...dashboardConfig.selectedKpis];
    if (current.includes(id)) {
      if (current.length <= 2) return; // keep at least 2
      setSelectedKpis(current.filter((k) => k !== id));
    } else {
      if (current.length >= 8) return; // max 8
      setSelectedKpis([...current, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-4 sm:p-6 space-y-5 my-4 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-stone-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-stone-100">
                  Themes & Dashboard Customizer
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-emerald-400 font-mono font-semibold border border-stone-700">
                  Customization Suite
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Personalize color themes, colorful module icons, KPI widgets, and custom dashboard layout.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCustomizerOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCustomizerTab('theme')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                customizerTab === 'theme'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Theme & Colorful Icons</span>
            </button>
            <button
              onClick={() => setCustomizerTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                customizerTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>Customise Dashboard</span>
            </button>
          </div>

          <button
            onClick={resetDashboardConfig}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
            title="Reset Dashboard to Default Settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-6 pr-1 flex-1">
          {/* ============================================================= */}
          {/* TAB 1: THEME & COLORFUL ICONS */}
          {/* ============================================================= */}
          {customizerTab === 'theme' && (
            <div className="space-y-6">
              {/* Color Palettes */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-emerald-400" />
                  Select Primary Accent Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {colorThemes.map((t) => {
                    const isSelected = themeColor === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setThemeColor(t.id)}
                        className={`p-3 rounded-2xl border text-left transition relative flex items-start gap-3 ${
                          isSelected
                            ? 'bg-stone-850 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                            : 'bg-stone-950/60 border-stone-800 hover:bg-stone-850/60 hover:border-stone-700'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center shadow-inner mt-0.5"
                          style={{ backgroundColor: t.color }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-stone-950 font-bold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-stone-100">{t.name}</span>
                            {isSelected && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 leading-snug mt-0.5 truncate">
                            {t.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Background Mode */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  Interface Background Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {modes.map((m) => {
                    const isSelected = themeMode === m.id;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setThemeMode(m.id)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-stone-850 border-emerald-500 ring-1 ring-emerald-500/50'
                            : 'bg-stone-950/60 border-stone-800 hover:bg-stone-850/60'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-stone-100">{m.name}</div>
                          <div className="text-[10px] text-stone-400">{m.desc}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colorful Icons Suite Controls */}
              <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-xs text-stone-100">
                        Colorful Module & KPI Icons
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400">
                      Enable distinct, vibrant colors for each module (Sales Blue, Cash Green, Invoices Cyan, Inventory Violet, Purchases Amber).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setColorfulIcons(!colorfulIcons)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      colorfulIcons ? 'bg-emerald-600' : 'bg-stone-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        colorfulIcons ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {colorfulIcons && (
                  <div className="space-y-3 pt-2 border-t border-stone-800">
                    <label className="text-[11px] font-semibold text-stone-400 block">
                      Icon Backdrop & Vibrancy Style:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {iconVibrancies.map((v) => {
                        const isSelected = iconStyle === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setIconStyle(v.id)}
                            className={`p-2.5 rounded-xl border text-left transition ${
                              isSelected
                                ? 'bg-stone-900 border-emerald-500/80 text-emerald-300'
                                : 'bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-900'
                            }`}
                          >
                            <div className="font-semibold text-xs">{v.name}</div>
                            <div className="text-[10px] text-stone-400">{v.desc}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Live colorful icons preview ribbon */}
                    <div className="p-3 bg-stone-900/80 border border-stone-800/80 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                        Live Palette Swatch Preview:
                      </span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Sales</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Revenue</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Invoices</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Truck className="w-3.5 h-3.5" />
                          <span>Purchasing</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          <Package className="w-3.5 h-3.5" />
                          <span>Inventory</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Payables</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                          <Users className="w-3.5 h-3.5" />
                          <span>Customers</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <BookOpenCheck className="w-3.5 h-3.5" />
                          <span>Ledger</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: CUSTOMISE DASHBOARD */}
          {/* ============================================================= */}
          {customizerTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Preset Layouts */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    Quick Dashboard Presets
                  </label>
                  {dashboardConfig.preset === 'custom' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                      Customized Mode Active
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {presets.map((p) => {
                    const isSelected = dashboardConfig.preset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyPreset(p.id)}
                        className={`p-3 rounded-2xl border text-left transition ${
                          isSelected
                            ? 'bg-stone-850 border-emerald-500 ring-1 ring-emerald-500/50'
                            : 'bg-stone-950/60 border-stone-800 hover:bg-stone-850/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-stone-100">{p.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layout Density & Target Objective */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-950 border border-stone-800 rounded-2xl">
                {/* Density */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-300 block">
                    Information Density
                  </label>
                  <div className="flex rounded-xl bg-stone-900 p-1 border border-stone-800 text-xs">
                    {(['compact', 'standard', 'comfortable'] as LayoutDensity[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setLayoutDensity(d)}
                        className={`flex-1 py-1 px-2 rounded-lg font-medium capitalize transition ${
                          dashboardConfig.density === d
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-stone-500 block">
                    {dashboardConfig.density === 'compact'
                      ? 'Dense grid for power users with more data visible.'
                      : dashboardConfig.density === 'comfortable'
                      ? 'Spacious layout with larger visual elements.'
                      : 'Balanced standard executive spacing.'}
                  </span>
                </div>

                {/* Monthly Sales Target Goal */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      Monthly Sales Target Goal ($)
                    </label>
                    <span className="text-[10px] font-mono text-emerald-400">
                      ${dashboardConfig.monthlyTarget.toLocaleString()}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-stone-500 text-xs font-mono">$</span>
                    <input
                      type="number"
                      step={10000}
                      min={0}
                      value={dashboardConfig.monthlyTarget}
                      onChange={(e) => setMonthlyTarget(parseFloat(e.target.value) || 0)}
                      className="w-full bg-stone-900 border border-stone-800 rounded-xl py-1.5 pl-7 pr-3 text-xs text-stone-100 font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500 block">
                    Powers the visual revenue progress indicator on the dashboard.
                  </span>
                </div>
              </div>

              {/* KPI Metrics Selection */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5 text-emerald-400" />
                    Custom KPI Cards Selection ({dashboardConfig.selectedKpis.length} Selected)
                  </label>
                  <span className="text-[11px] text-stone-400">Select 2 to 8 metrics</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {availableKpiOptions.map((kpi) => {
                    const isSelected = dashboardConfig.selectedKpis.includes(kpi.id);
                    const Icon = kpi.icon;
                    return (
                      <button
                        key={kpi.id}
                        type="button"
                        onClick={() => toggleKpiSelection(kpi.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-stone-850 border-emerald-500/80 text-stone-100'
                            : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg bg-stone-900 border border-stone-800 ${kpi.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-medium truncate">{kpi.name}</div>
                            <div className="text-[10px] text-stone-500">{kpi.category}</div>
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-2 ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'border-stone-700 bg-stone-900'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Widget Toggles */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Show or Hide Dashboard Modules
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {widgetDefinitions.map((w) => {
                    const isVisible = dashboardConfig.visibleWidgets[w.key];
                    const Icon = w.icon;
                    return (
                      <div
                        key={w.key}
                        onClick={() => toggleWidget(w.key)}
                        className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                          isVisible
                            ? 'bg-stone-900 border-stone-700 text-stone-100'
                            : 'bg-stone-950/60 border-stone-800/80 text-stone-500'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={`p-2 rounded-xl border ${
                              isVisible
                                ? 'bg-stone-800 border-stone-700 text-emerald-400'
                                : 'bg-stone-900 border-stone-800 text-stone-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs">{w.label}</div>
                            <div className="text-[10px] text-stone-400 truncate max-w-[200px]">
                              {w.desc}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isVisible ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <Eye className="w-3 h-3" />
                              <span>Visible</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-stone-500 px-2 py-0.5 rounded-lg bg-stone-900 border border-stone-800">
                              <EyeOff className="w-3 h-3" />
                              <span>Hidden</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-400">
            Preferences are automatically saved to your local session cache.
          </span>
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(false)}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-950"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
