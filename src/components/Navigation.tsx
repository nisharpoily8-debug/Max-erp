import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Truck,
  Package,
  BookOpenCheck,
  BarChart3,
  Users,
  Building2,
  ShieldCheck,
  MoreHorizontal,
  X,
  Palette,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { useTheme } from '../context/ThemeContext';

export type NavTab =
  | 'dashboard'
  | 'sales'
  | 'customers'
  | 'vendors'
  | 'invoices'
  | 'purchasing'
  | 'inventory'
  | 'accounting'
  | 'reports'
  | 'partners'
  | 'audit';

export const TAB_COLORS: Record<NavTab, { text: string; bg: string; border: string }> = {
  dashboard: { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  customers: { text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/30' },
  vendors: { text: 'text-teal-400', bg: 'bg-teal-500/20', border: 'border-teal-500/30' },
  sales: { text: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/30' },
  invoices: { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
  purchasing: { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  inventory: { text: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  accounting: { text: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500/30' },
  reports: { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/30' },
  partners: { text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20', border: 'border-fuchsia-500/30' },
  audit: { text: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
};

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  layout: 'bottom' | 'rail';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  layout,
}) => {
  const { salesOrders, invoices, purchaseOrders, stockLevels, products, partners } = useErp();
  const { themePalette, colorfulIcons, openCustomizer } = useTheme();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Calculate notification badges
  const pendingOrders = salesOrders.filter((s) => s.status === 'Pending Approval').length;
  const overdueInvoices = invoices.filter((i) => i.status === 'Overdue').length;
  const pendingPurchases = purchaseOrders.filter((p) => p.status === 'Pending Approval').length;
  const customerCount = partners.filter((p) => p.type === 'customer' || p.type === 'both').length;
  const vendorCount = partners.filter((p) => p.type === 'vendor' || p.type === 'both').length;

  // Low stock badge
  const lowStockCount = products.filter((prod) => {
    const totalQty = stockLevels
      .filter((sl) => sl.productId === prod.id)
      .reduce((sum, sl) => sum + sl.onHand, 0);
    return totalQty <= prod.minStockLevel;
  }).length;

  const railNavItems = [
    { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'customers' as NavTab, label: 'Customers', icon: Users, badge: customerCount },
    { id: 'vendors' as NavTab, label: 'Vendors', icon: Building2, badge: vendorCount },
    { id: 'sales' as NavTab, label: 'Sales', icon: ShoppingCart, badge: pendingOrders },
    { id: 'invoices' as NavTab, label: 'Invoices', icon: Receipt, badge: overdueInvoices },
    { id: 'purchasing' as NavTab, label: 'Purchases', icon: Truck, badge: pendingPurchases },
    { id: 'inventory' as NavTab, label: 'Inventory', icon: Package, badge: lowStockCount },
    { id: 'accounting' as NavTab, label: 'Ledger', icon: BookOpenCheck },
    { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
    { id: 'audit' as NavTab, label: 'Audit Trail', icon: ShieldCheck },
  ];

  // Mobile Bottom Main Tabs (4 primary + More)
  const mobilePrimaryTabs = [
    { id: 'dashboard' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'customers' as NavTab, label: 'Customers', icon: Users },
    { id: 'vendors' as NavTab, label: 'Vendors', icon: Building2 },
    { id: 'sales' as NavTab, label: 'Sales', icon: ShoppingCart, badge: pendingOrders },
  ];

  const mobileExtraTabs = [
    { id: 'invoices' as NavTab, label: 'Invoices & Billing', icon: Receipt, badge: overdueInvoices },
    { id: 'purchasing' as NavTab, label: 'Purchase Orders', icon: Truck, badge: pendingPurchases },
    { id: 'inventory' as NavTab, label: 'Inventory & Barcode', icon: Package, badge: lowStockCount },
    { id: 'accounting' as NavTab, label: 'Double-Entry Ledger', icon: BookOpenCheck },
    { id: 'reports' as NavTab, label: 'Financial Reports', icon: BarChart3 },
    { id: 'partners' as NavTab, label: 'All Partners Directory', icon: Users },
    { id: 'audit' as NavTab, label: 'Audit Logs', icon: ShieldCheck },
  ];

  if (layout === 'rail') {
    return (
      <aside className="w-20 md:w-56 shrink-0 bg-stone-900 border-r border-stone-800 flex flex-col py-4 px-2 select-none">
        <div className="hidden md:block px-3 pb-3 mb-2 border-b border-stone-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
            Maxerp Modules
          </span>
        </div>
        <div className="space-y-1 flex-1 overflow-y-auto pr-0.5">
          {railNavItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = activeTab === item.id;
            const color = TAB_COLORS[item.id] || { text: 'text-stone-400', bg: 'bg-stone-800', border: 'border-stone-700' };

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-2xl transition text-xs font-semibold group relative ${
                  isCurrent
                    ? `${themePalette.activeNavBg} ${themePalette.activeNavText} shadow-md shadow-stone-950/50`
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/80'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition shrink-0 ${
                    isCurrent
                      ? 'bg-white/20 text-inherit'
                      : colorfulIcons
                      ? `${color.bg} ${color.text} border ${color.border}`
                      : 'bg-stone-800 text-stone-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="hidden md:inline truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isCurrent ? 'bg-white/30 text-inherit' : 'bg-stone-800 text-stone-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Theme & Customizer Quick Shortcut in Rail */}
        <div className="pt-2 mt-2 border-t border-stone-800/80">
          <button
            onClick={() => openCustomizer('theme')}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 transition group"
            title="Customize Themes & Colorful Icons"
          >
            <div
              className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border border-stone-700/60 shadow-xs"
              style={{ backgroundColor: themePalette.previewColor }}
            >
              <Palette className="w-3 h-3 text-stone-950 font-bold" />
            </div>
            <span className="hidden md:inline text-[11px] font-semibold">Themes & Icons</span>
          </button>
        </div>
      </aside>
    );
  }

  const isMoreActive = mobileExtraTabs.some((t) => t.id === activeTab);

  // Mobile Bottom Navigation Bar (Material 3 style)
  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 py-1.5 px-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobilePrimaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const color = TAB_COLORS[item.id] || { text: 'text-stone-400', bg: 'bg-stone-800', border: 'border-stone-700' };

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center justify-center flex-1 py-1 relative group"
              >
                <div
                  className={`px-3 py-1 rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? `${themePalette.badgeBg} ${themePalette.badgeText} ring-1 ${themePalette.badgeBorder}`
                      : colorfulIcons
                      ? `${color.bg} ${color.text}`
                      : 'text-stone-400 group-hover:text-stone-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 tracking-tight transition ${
                    isActive ? `font-semibold ${themePalette.accentText}` : 'text-stone-400'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More menu trigger */}
          <button
            onClick={() => setIsMoreSheetOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1"
          >
            <div
              className={`px-3 py-1 rounded-xl transition ${
                isMoreActive
                  ? `${themePalette.badgeBg} ${themePalette.badgeText} font-bold`
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </div>
            <span
              className={`text-[10px] mt-0.5 transition ${
                isMoreActive ? `font-semibold ${themePalette.accentText}` : 'text-stone-400'
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile More Sheet */}
      {isMoreSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setIsMoreSheetOpen(false)}
        >
          <div
            className="w-full max-w-md bg-stone-900 border-t border-stone-800 rounded-t-3xl p-5 pb-8 space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div>
                <h3 className="text-sm font-bold text-stone-100">All ERP Modules</h3>
                <p className="text-xs text-stone-400">Select a workflow to open</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    openCustomizer('theme');
                  }}
                  className="p-1.5 rounded-xl bg-stone-800 text-stone-300 hover:text-white"
                  title="Customize Theme & Icons"
                >
                  <Palette className="w-4 h-4 text-emerald-400" />
                </button>
                <button
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {mobileExtraTabs.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                const color = TAB_COLORS[item.id] || { text: 'text-stone-400', bg: 'bg-stone-800', border: 'border-stone-700' };

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMoreSheetOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left transition ${
                      isSelected
                        ? `${themePalette.badgeBg} ${themePalette.badgeBorder} ${themePalette.badgeText} font-semibold`
                        : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-xl shrink-0 ${
                        colorfulIcons
                          ? `${color.bg} ${color.text} border ${color.border}`
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
