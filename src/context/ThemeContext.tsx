import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeColor =
  | 'emerald'
  | 'sapphire'
  | 'amethyst'
  | 'amber'
  | 'cyan'
  | 'rose'
  | 'titanium';

export type ThemeMode = 'dark' | 'midnight' | 'light';

export type IconStyle = 'vivid' | 'pastel' | 'gradient';

export type DashboardPreset = 'executive' | 'operations' | 'finance' | 'sales' | 'minimalist' | 'custom';

export type LayoutDensity = 'compact' | 'standard' | 'comfortable';

export type KpiMetricId =
  | 'revenue'
  | 'margin'
  | 'cash'
  | 'receivables'
  | 'payables'
  | 'low_stock'
  | 'inventory_val'
  | 'approvals'
  | 'customers'
  | 'vendors'
  | 'orders_count'
  | 'po_spend';

export interface DashboardVisibleWidgets {
  kpiCards: boolean;
  salesTarget: boolean;
  quickActions: boolean;
  roleFocus: boolean;
  revenueChart: boolean;
  cashFlow: boolean;
  lowStockAlerts: boolean;
  pendingApprovals: boolean;
  recentActivity: boolean;
  categoryBreakdown: boolean;
}

export interface DashboardConfig {
  preset: DashboardPreset;
  density: LayoutDensity;
  visibleWidgets: DashboardVisibleWidgets;
  selectedKpis: KpiMetricId[];
  monthlyTarget: number;
}

export interface ThemeColorsDefinition {
  id: ThemeColor;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  accentText: string;
  cardBorderHover: string;
  ring: string;
  gradientFrom: string;
  activeNavBg: string;
  activeNavText: string;
  previewColor: string;
}

export const THEME_PALETTES: Record<ThemeColor, ThemeColorsDefinition> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Forest',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/20',
    primaryBg: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-500',
    primaryText: 'text-white',
    accentText: 'text-emerald-400',
    cardBorderHover: 'hover:border-emerald-500/40',
    ring: 'focus:ring-emerald-500',
    gradientFrom: 'from-emerald-950/60',
    activeNavBg: 'bg-emerald-600',
    activeNavText: 'text-white',
    previewColor: '#10b981',
  },
  sapphire: {
    id: 'sapphire',
    name: 'Cyber Sapphire',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/20',
    primaryBg: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-500',
    primaryText: 'text-white',
    accentText: 'text-blue-400',
    cardBorderHover: 'hover:border-blue-500/40',
    ring: 'focus:ring-blue-500',
    gradientFrom: 'from-blue-950/60',
    activeNavBg: 'bg-blue-600',
    activeNavText: 'text-white',
    previewColor: '#3b82f6',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Royal Amethyst',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-400',
    badgeBorder: 'border-purple-500/20',
    primaryBg: 'bg-purple-600',
    primaryHover: 'hover:bg-purple-500',
    primaryText: 'text-white',
    accentText: 'text-purple-400',
    cardBorderHover: 'hover:border-purple-500/40',
    ring: 'focus:ring-purple-500',
    gradientFrom: 'from-purple-950/60',
    activeNavBg: 'bg-purple-600',
    activeNavText: 'text-white',
    previewColor: '#a855f7',
  },
  amber: {
    id: 'amber',
    name: 'Sunset Amber',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/20',
    primaryBg: 'bg-amber-600',
    primaryHover: 'hover:bg-amber-500',
    primaryText: 'text-stone-950',
    accentText: 'text-amber-400',
    cardBorderHover: 'hover:border-amber-500/40',
    ring: 'focus:ring-amber-500',
    gradientFrom: 'from-amber-950/60',
    activeNavBg: 'bg-amber-600',
    activeNavText: 'text-stone-950',
    previewColor: '#f59e0b',
  },
  cyan: {
    id: 'cyan',
    name: 'Oceanic Cyan',
    badgeBg: 'bg-cyan-500/10',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/20',
    primaryBg: 'bg-cyan-600',
    primaryHover: 'hover:bg-cyan-500',
    primaryText: 'text-stone-950',
    accentText: 'text-cyan-400',
    cardBorderHover: 'hover:border-cyan-500/40',
    ring: 'focus:ring-cyan-500',
    gradientFrom: 'from-cyan-950/60',
    activeNavBg: 'bg-cyan-600',
    activeNavText: 'text-stone-950',
    previewColor: '#06b6d4',
  },
  rose: {
    id: 'rose',
    name: 'Ruby Rose',
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/20',
    primaryBg: 'bg-rose-600',
    primaryHover: 'hover:bg-rose-500',
    primaryText: 'text-white',
    accentText: 'text-rose-400',
    cardBorderHover: 'hover:border-rose-500/40',
    ring: 'focus:ring-rose-500',
    gradientFrom: 'from-rose-950/60',
    activeNavBg: 'bg-rose-600',
    activeNavText: 'text-white',
    previewColor: '#f43f5e',
  },
  titanium: {
    id: 'titanium',
    name: 'Titanium Slate',
    badgeBg: 'bg-stone-500/10',
    badgeText: 'text-stone-300',
    badgeBorder: 'border-stone-500/20',
    primaryBg: 'bg-stone-100',
    primaryHover: 'hover:bg-white',
    primaryText: 'text-stone-950',
    accentText: 'text-stone-200',
    cardBorderHover: 'hover:border-stone-500/40',
    ring: 'focus:ring-stone-400',
    gradientFrom: 'from-stone-900',
    activeNavBg: 'bg-stone-200',
    activeNavText: 'text-stone-900',
    previewColor: '#78716c',
  },
};

const DEFAULT_WIDGETS: DashboardVisibleWidgets = {
  kpiCards: true,
  salesTarget: true,
  quickActions: true,
  roleFocus: true,
  revenueChart: true,
  cashFlow: true,
  lowStockAlerts: true,
  pendingApprovals: true,
  recentActivity: true,
  categoryBreakdown: true,
};

const DEFAULT_KPIS: KpiMetricId[] = [
  'revenue',
  'margin',
  'cash',
  'receivables',
  'payables',
  'low_stock',
];

interface ThemeContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  themePalette: ThemeColorsDefinition;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colorfulIcons: boolean;
  setColorfulIcons: (enabled: boolean) => void;
  iconStyle: IconStyle;
  setIconStyle: (style: IconStyle) => void;
  dashboardConfig: DashboardConfig;
  toggleWidget: (widgetKey: keyof DashboardVisibleWidgets) => void;
  setSelectedKpis: (kpis: KpiMetricId[]) => void;
  setMonthlyTarget: (target: number) => void;
  setLayoutDensity: (density: LayoutDensity) => void;
  applyPreset: (preset: DashboardPreset) => void;
  resetDashboardConfig: () => void;
  isCustomizerOpen: boolean;
  setIsCustomizerOpen: (open: boolean) => void;
  customizerTab: 'theme' | 'dashboard';
  setCustomizerTab: (tab: 'theme' | 'dashboard') => void;
  openCustomizer: (initialTab?: 'theme' | 'dashboard') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_THEME = 'nexa_erp_theme_color';
const STORAGE_KEY_MODE = 'nexa_erp_theme_mode';
const STORAGE_KEY_ICONS = 'nexa_erp_colorful_icons';
const STORAGE_KEY_ICON_STYLE = 'nexa_erp_icon_style';
const STORAGE_KEY_DASHBOARD = 'nexa_erp_dashboard_config_v2';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved && saved in THEME_PALETTES) return saved as ThemeColor;
    } catch {}
    return 'emerald';
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODE);
      if (saved === 'dark' || saved === 'midnight' || saved === 'light') return saved;
    } catch {}
    return 'dark';
  });

  const [colorfulIcons, setColorfulIconsState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ICONS);
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // colorful icons default true!
  });

  const [iconStyle, setIconStyleState] = useState<IconStyle>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ICON_STYLE);
      if (saved === 'vivid' || saved === 'pastel' || saved === 'gradient') return saved;
    } catch {}
    return 'vivid';
  });

  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DASHBOARD);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          preset: parsed.preset || 'executive',
          density: parsed.density || 'standard',
          visibleWidgets: { ...DEFAULT_WIDGETS, ...(parsed.visibleWidgets || {}) },
          selectedKpis: parsed.selectedKpis || DEFAULT_KPIS,
          monthlyTarget: parsed.monthlyTarget || 150000,
        };
      }
    } catch {}
    return {
      preset: 'executive',
      density: 'standard',
      visibleWidgets: { ...DEFAULT_WIDGETS },
      selectedKpis: [...DEFAULT_KPIS],
      monthlyTarget: 150000,
    };
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customizerTab, setCustomizerTab] = useState<'theme' | 'dashboard'>('theme');

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, color);
    } catch {}
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY_MODE, mode);
    } catch {}
  };

  const setColorfulIcons = (enabled: boolean) => {
    setColorfulIconsState(enabled);
    try {
      localStorage.setItem(STORAGE_KEY_ICONS, String(enabled));
    } catch {}
  };

  const setIconStyle = (style: IconStyle) => {
    setIconStyleState(style);
    try {
      localStorage.setItem(STORAGE_KEY_ICON_STYLE, style);
    } catch {}
  };

  const updateDashboardConfig = (updater: (prev: DashboardConfig) => DashboardConfig) => {
    setDashboardConfig((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY_DASHBOARD, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleWidget = (widgetKey: keyof DashboardVisibleWidgets) => {
    updateDashboardConfig((prev) => ({
      ...prev,
      preset: 'custom',
      visibleWidgets: {
        ...prev.visibleWidgets,
        [widgetKey]: !prev.visibleWidgets[widgetKey],
      },
    }));
  };

  const setSelectedKpis = (kpis: KpiMetricId[]) => {
    updateDashboardConfig((prev) => ({
      ...prev,
      preset: 'custom',
      selectedKpis: kpis,
    }));
  };

  const setMonthlyTarget = (target: number) => {
    updateDashboardConfig((prev) => ({
      ...prev,
      monthlyTarget: Math.max(0, target),
    }));
  };

  const setLayoutDensity = (density: LayoutDensity) => {
    updateDashboardConfig((prev) => ({
      ...prev,
      density,
    }));
  };

  const applyPreset = (preset: DashboardPreset) => {
    if (preset === 'executive') {
      updateDashboardConfig((prev) => ({
        ...prev,
        preset: 'executive',
        density: 'standard',
        visibleWidgets: {
          kpiCards: true,
          salesTarget: true,
          quickActions: true,
          roleFocus: true,
          revenueChart: true,
          cashFlow: true,
          lowStockAlerts: true,
          pendingApprovals: true,
          recentActivity: true,
          categoryBreakdown: true,
        },
        selectedKpis: ['revenue', 'margin', 'cash', 'receivables', 'payables', 'low_stock'],
      }));
    } else if (preset === 'operations') {
      updateDashboardConfig((prev) => ({
        ...prev,
        preset: 'operations',
        density: 'compact',
        visibleWidgets: {
          kpiCards: true,
          salesTarget: false,
          quickActions: true,
          roleFocus: true,
          revenueChart: false,
          cashFlow: false,
          lowStockAlerts: true,
          pendingApprovals: true,
          recentActivity: true,
          categoryBreakdown: true,
        },
        selectedKpis: ['low_stock', 'inventory_val', 'approvals', 'po_spend', 'vendors', 'revenue'],
      }));
    } else if (preset === 'finance') {
      updateDashboardConfig((prev) => ({
        ...prev,
        preset: 'finance',
        density: 'compact',
        visibleWidgets: {
          kpiCards: true,
          salesTarget: true,
          quickActions: true,
          roleFocus: false,
          revenueChart: true,
          cashFlow: true,
          lowStockAlerts: false,
          pendingApprovals: true,
          recentActivity: true,
          categoryBreakdown: true,
        },
        selectedKpis: ['revenue', 'margin', 'cash', 'receivables', 'payables', 'approvals'],
      }));
    } else if (preset === 'sales') {
      updateDashboardConfig((prev) => ({
        ...prev,
        preset: 'sales',
        density: 'comfortable',
        visibleWidgets: {
          kpiCards: true,
          salesTarget: true,
          quickActions: true,
          roleFocus: true,
          revenueChart: true,
          cashFlow: false,
          lowStockAlerts: false,
          pendingApprovals: true,
          recentActivity: true,
          categoryBreakdown: false,
        },
        selectedKpis: ['revenue', 'orders_count', 'customers', 'margin', 'receivables', 'approvals'],
      }));
    } else if (preset === 'minimalist') {
      updateDashboardConfig((prev) => ({
        ...prev,
        preset: 'minimalist',
        density: 'compact',
        visibleWidgets: {
          kpiCards: true,
          salesTarget: false,
          quickActions: true,
          roleFocus: false,
          revenueChart: false,
          cashFlow: false,
          lowStockAlerts: true,
          pendingApprovals: true,
          recentActivity: false,
          categoryBreakdown: false,
        },
        selectedKpis: ['revenue', 'cash', 'low_stock', 'approvals'],
      }));
    }
  };

  const resetDashboardConfig = () => {
    updateDashboardConfig(() => ({
      preset: 'executive',
      density: 'standard',
      visibleWidgets: { ...DEFAULT_WIDGETS },
      selectedKpis: [...DEFAULT_KPIS],
      monthlyTarget: 150000,
    }));
  };

  const openCustomizer = (initialTab: 'theme' | 'dashboard' = 'theme') => {
    setCustomizerTab(initialTab);
    setIsCustomizerOpen(true);
  };

  const themePalette = THEME_PALETTES[themeColor] || THEME_PALETTES.emerald;

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        setThemeColor,
        themePalette,
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
        openCustomizer,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
