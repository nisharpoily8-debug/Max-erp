import React from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Package,
  ShoppingCart,
  Receipt,
  Truck,
  Users,
  Building2,
  CheckCircle2,
  Calendar,
  BarChart3,
  SlidersHorizontal,
  Sparkles,
  Palette,
  Target,
  Layers,
  ChevronRight,
  Activity,
  Scan,
  BookOpenCheck,
  Check,
  Camera,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { useTheme, KpiMetricId } from '../context/ThemeContext';
import { NavTab } from './Navigation';

interface CustomDashboardWidgetsProps {
  onNavigate: (tab: NavTab) => void;
}

export const CustomDashboardWidgets: React.FC<CustomDashboardWidgetsProps> = ({ onNavigate }) => {
  const {
    salesOrders,
    invoices,
    purchaseOrders,
    stockLevels,
    products,
    partners,
    auditLogs,
    accounts,
    vendorBills,
    branches,
    approveSalesOrder,
    approvePurchaseOrder,
  } = useErp();

  const {
    themePalette,
    colorfulIcons,
    iconStyle,
    dashboardConfig,
    openCustomizer,
  } = useTheme();

  // Financial calculations
  const totalSales = salesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalReceivables = invoices
    .filter((i) => i.status !== 'Paid' && i.status !== 'Cancelled')
    .reduce((sum, i) => sum + i.balanceDue, 0);

  const totalPayables = vendorBills
    .filter((b) => b.status !== 'Paid')
    .reduce((sum, b) => sum + b.balanceDue, 0);

  const cashPosition = accounts
    .filter((a) => a.category === 'Asset' && (a.code === '1010' || a.code === '1020'))
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const totalInventoryValuation = products.reduce((total, prod) => {
    const qty = stockLevels
      .filter((sl) => sl.productId === prod.id)
      .reduce((s, sl) => s + sl.onHand, 0);
    return total + qty * prod.purchasePrice;
  }, 0);

  const totalPoSpend = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  const pendingSalesApprovals = salesOrders.filter((s) => s.status === 'Pending Approval');
  const pendingPoApprovals = purchaseOrders.filter((p) => p.status === 'Pending Approval');
  const pendingApprovalsCount = pendingSalesApprovals.length + pendingPoApprovals.length;

  const lowStockItems = products.filter((prod) => {
    const totalQty = stockLevels
      .filter((sl) => sl.productId === prod.id)
      .reduce((sum, sl) => sum + sl.onHand, 0);
    return totalQty <= prod.minStockLevel;
  });

  const customerCount = partners.filter((p) => p.type === 'customer' || p.type === 'both').length;
  const vendorCount = partners.filter((p) => p.type === 'vendor' || p.type === 'both').length;

  // Monthly Sales Target calculations
  const monthlyTarget = dashboardConfig.monthlyTarget || 150000;
  const targetPercent = Math.min(100, Math.round((totalSales / monthlyTarget) * 100));
  const remainingToGoal = Math.max(0, monthlyTarget - totalSales);

  // Helper for colorful icon container classes
  const getIconWrapperClass = (colorClass: string) => {
    if (!colorfulIcons) {
      return 'bg-stone-800 text-stone-300 border border-stone-700/60';
    }
    if (iconStyle === 'pastel') {
      switch (colorClass) {
        case 'emerald': return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';
        case 'sky': return 'bg-sky-500/10 text-sky-300 border border-sky-500/20';
        case 'teal': return 'bg-teal-500/10 text-teal-300 border border-teal-500/20';
        case 'cyan': return 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20';
        case 'amber': return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
        case 'purple': return 'bg-purple-500/10 text-purple-300 border border-purple-500/20';
        case 'rose': return 'bg-rose-500/10 text-rose-300 border border-rose-500/20';
        case 'lime': return 'bg-lime-500/10 text-lime-300 border border-lime-500/20';
        case 'yellow': return 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20';
        case 'fuchsia': return 'bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20';
        case 'indigo': return 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20';
        default: return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';
      }
    }
    if (iconStyle === 'gradient') {
      switch (colorClass) {
        case 'emerald': return 'bg-gradient-to-br from-emerald-500/30 to-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs';
        case 'sky': return 'bg-gradient-to-br from-sky-500/30 to-sky-950 text-sky-300 border border-sky-500/40 shadow-xs';
        case 'teal': return 'bg-gradient-to-br from-teal-500/30 to-teal-950 text-teal-300 border border-teal-500/40 shadow-xs';
        case 'cyan': return 'bg-gradient-to-br from-cyan-500/30 to-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-xs';
        case 'amber': return 'bg-gradient-to-br from-amber-500/30 to-amber-950 text-amber-300 border border-amber-500/40 shadow-xs';
        case 'purple': return 'bg-gradient-to-br from-purple-500/30 to-purple-950 text-purple-300 border border-purple-500/40 shadow-xs';
        case 'rose': return 'bg-gradient-to-br from-rose-500/30 to-rose-950 text-rose-300 border border-rose-500/40 shadow-xs';
        case 'lime': return 'bg-gradient-to-br from-lime-500/30 to-lime-950 text-lime-300 border border-lime-500/40 shadow-xs';
        case 'yellow': return 'bg-gradient-to-br from-yellow-500/30 to-yellow-950 text-yellow-300 border border-yellow-500/40 shadow-xs';
        case 'fuchsia': return 'bg-gradient-to-br from-fuchsia-500/30 to-fuchsia-950 text-fuchsia-300 border border-fuchsia-500/40 shadow-xs';
        case 'indigo': return 'bg-gradient-to-br from-indigo-500/30 to-indigo-950 text-indigo-300 border border-indigo-500/40 shadow-xs';
        default: return 'bg-gradient-to-br from-emerald-500/30 to-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-xs';
      }
    }
    // Vivid default
    switch (colorClass) {
      case 'emerald': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs';
      case 'sky': return 'bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-xs';
      case 'teal': return 'bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-xs';
      case 'cyan': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-xs';
      case 'amber': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-xs';
      case 'purple': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-xs';
      case 'rose': return 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-xs';
      case 'lime': return 'bg-lime-500/20 text-lime-400 border border-lime-500/30 shadow-xs';
      case 'yellow': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-xs';
      case 'fuchsia': return 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 shadow-xs';
      case 'indigo': return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-xs';
      default: return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs';
    }
  };

  // Rendering a single KPI card based on ID
  const renderKpiCard = (kpiId: KpiMetricId) => {
    switch (kpiId) {
      case 'revenue':
        return (
          <div
            key="revenue"
            onClick={() => onNavigate('sales')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">Total Revenue</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('emerald')}`}>
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono tracking-tight">
              ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>+14.2% MoM</span>
            </div>
          </div>
        );

      case 'margin':
        return (
          <div
            key="margin"
            onClick={() => onNavigate('accounting')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-teal-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">Operating Margin</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('teal')}`}>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono">44.8%</div>
            <div className="text-[10px] text-teal-400 mt-1">EBITDA Healthy</div>
          </div>
        );

      case 'cash':
        return (
          <div
            key="cash"
            onClick={() => onNavigate('accounting')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-lime-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">Cash & Bank</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('lime')}`}>
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono tracking-tight">
              ${cashPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-lime-400 mt-1">Instant Liquidity</div>
          </div>
        );

      case 'receivables':
        return (
          <div
            key="receivables"
            onClick={() => onNavigate('invoices')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-cyan-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">A/R Receivables</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('cyan')}`}>
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono tracking-tight">
              ${totalReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-cyan-400 mt-1">Due from Clients</div>
          </div>
        );

      case 'payables':
        return (
          <div
            key="payables"
            onClick={() => onNavigate('purchasing')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-rose-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">A/P Payables</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('rose')}`}>
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono tracking-tight">
              ${totalPayables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-rose-400 mt-1">Supplier Bills</div>
          </div>
        );

      case 'low_stock':
        return (
          <div
            key="low_stock"
            onClick={() => onNavigate('inventory')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-amber-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">Low Stock Alert</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('amber')}`}>
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono">
              {lowStockItems.length} Products
            </div>
            <div className="text-[10px] text-amber-400 mt-1">
              {lowStockItems.length > 0 ? 'Requires Purchase RFQ' : 'All levels optimum'}
            </div>
          </div>
        );

      case 'inventory_val':
        return (
          <div
            key="inventory_val"
            onClick={() => onNavigate('inventory')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-purple-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">Inventory Valuation</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('purple')}`}>
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono tracking-tight">
              ${totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-purple-400 mt-1">Asset Book Value</div>
          </div>
        );

      case 'approvals':
        return (
          <div
            key="approvals"
            onClick={() => onNavigate('sales')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-yellow-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">Pending Approvals</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('yellow')}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono">
              {pendingApprovalsCount} Items
            </div>
            <div className="text-[10px] text-yellow-400 mt-1">Action Required</div>
          </div>
        );

      case 'customers':
        return (
          <div
            key="customers"
            onClick={() => onNavigate('customers')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-fuchsia-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">Active Customers</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('fuchsia')}`}>
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono">
              {customerCount} Accounts
            </div>
            <div className="text-[10px] text-fuchsia-400 mt-1">Registered Clients</div>
          </div>
        );

      case 'vendors':
        return (
          <div
            key="vendors"
            onClick={() => onNavigate('vendors')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-sky-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">Supplier Network</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('sky')}`}>
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono">
              {vendorCount} Vendors
            </div>
            <div className="text-[10px] text-sky-400 mt-1">Qualified Suppliers</div>
          </div>
        );

      case 'orders_count':
        return (
          <div
            key="orders_count"
            onClick={() => onNavigate('sales')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-sky-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">Sales Orders Total</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('sky')}`}>
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono">
              {salesOrders.length} Orders
            </div>
            <div className="text-[10px] text-sky-400 mt-1">Recorded Orders</div>
          </div>
        );

      case 'po_spend':
        return (
          <div
            key="po_spend"
            onClick={() => onNavigate('purchasing')}
            className="p-3 sm:p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-amber-500/40 transition group"
          >
            <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
              <span className="font-medium truncate">Purchase Outlay</span>
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('amber')}`}>
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-stone-100 font-mono tracking-tight">
              ${totalPoSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-amber-400 mt-1">Total Procurement</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 0. CUSTOM DASHBOARD CONTROL BAR */}
      {/* ========================================================================= */}
      <div className="p-2.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-xs"
            style={{ backgroundColor: themePalette.previewColor }}
          />
          <span className="font-semibold text-stone-200">
            {themePalette.name} Theme
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 border border-stone-700 capitalize font-mono">
            {dashboardConfig.preset} Preset
          </span>
          {colorfulIcons && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <Sparkles className="w-2.5 h-2.5" />
              Colorful Icons ON
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openCustomizer('dashboard')}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-xl font-medium transition border border-stone-700/60"
            title="Rearrange widgets and select custom metrics"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Customise Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => openCustomizer('theme')}
            className="p-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl transition border border-stone-700/60"
            title="Change Theme & Colorful Icons"
          >
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CUSTOM KPI METRIC CARDS */}
      {/* ========================================================================= */}
      {dashboardConfig.visibleWidgets.kpiCards && (
        <div
          className={`grid gap-2.5 ${
            dashboardConfig.density === 'compact'
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
              : dashboardConfig.density === 'comfortable'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-3'
          }`}
        >
          {dashboardConfig.selectedKpis.map((kpiId) => renderKpiCard(kpiId))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CUSTOM MONTHLY SALES TARGET PROGRESS GOAL */}
      {/* ========================================================================= */}
      {dashboardConfig.visibleWidgets.salesTarget && (
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('amber')}`}>
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-stone-200 uppercase tracking-wider">
                  Monthly Sales Revenue Goal
                </h3>
                <span className="text-[11px] text-stone-400">
                  Target: <strong>${monthlyTarget.toLocaleString()}</strong>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {targetPercent}%
              </span>
              <span className="text-[10px] text-stone-400 block">Achieved</span>
            </div>
          </div>

          <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700 shadow-sm shadow-emerald-950"
              style={{ width: `${targetPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5">
            <span>
              Achieved: <strong className="text-stone-200">${totalSales.toLocaleString()}</strong>
            </span>
            <span>
              Remaining Gap: <strong className="text-stone-200">${remainingToGoal.toLocaleString()}</strong>
            </span>
            <button
              onClick={() => openCustomizer('dashboard')}
              className="text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Adjust Goal
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COLORFUL QUICK ACTIONS GRID */}
      {/* ========================================================================= */}
      {dashboardConfig.visibleWidgets.quickActions && (
        <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Fast Workflow Shortcuts
            </span>
            <span className="text-[10px] text-stone-500">1-Click Direct Launch</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="p-2.5 bg-stone-950/70 hover:bg-stone-850 border border-stone-800 hover:border-sky-500/40 rounded-xl text-left transition flex items-center gap-2 group"
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${getIconWrapperClass('sky')}`}>
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="font-semibold text-stone-200 group-hover:text-white truncate">
                  New Order
                </div>
                <div className="text-[10px] text-stone-500">Sales Quote</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('purchasing')}
              className="p-2.5 bg-stone-950/70 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/40 rounded-xl text-left transition flex items-center gap-2 group"
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${getIconWrapperClass('amber')}`}>
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="font-semibold text-stone-200 group-hover:text-white truncate">
                  Create PO
                </div>
                <div className="text-[10px] text-stone-500">Procure Goods</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('purchasing')}
              className="p-2.5 bg-stone-950/70 hover:bg-stone-850 border border-stone-800 hover:border-emerald-500/40 rounded-xl text-left transition flex items-center gap-2 group"
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${getIconWrapperClass('emerald')}`}>
                <Camera className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="font-semibold text-stone-200 group-hover:text-white truncate">
                  Scan Bill
                </div>
                <div className="text-[10px] text-emerald-400">PDF/JPEG OCR</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('invoices')}
              className="p-2.5 bg-stone-950/70 hover:bg-stone-850 border border-stone-800 hover:border-cyan-500/40 rounded-xl text-left transition flex items-center gap-2 group"
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${getIconWrapperClass('cyan')}`}>
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="font-semibold text-stone-200 group-hover:text-white truncate">
                  Invoices
                </div>
                <div className="text-[10px] text-stone-500">Post & Bill</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="p-2.5 bg-stone-950/70 hover:bg-stone-850 border border-stone-800 hover:border-purple-500/40 rounded-xl text-left transition flex items-center gap-2 group"
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${getIconWrapperClass('purple')}`}>
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="font-semibold text-stone-200 group-hover:text-white truncate">
                  Stock Counts
                </div>
                <div className="text-[10px] text-stone-500">Scan & Adjust</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CASH FLOW & WORKING CAPITAL HEALTH WIDGET */}
      {/* ========================================================================= */}
      {dashboardConfig.visibleWidgets.cashFlow && (
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('lime')}`}>
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-stone-200 uppercase tracking-wider">
                  Liquidity & Working Capital Health
                </h3>
                <span className="text-[11px] text-stone-400">
                  Solvency and short-term capital coverage
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-400 font-mono font-bold">
              Solvent
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-500 block mb-0.5">Liquid Cash</span>
              <span className="font-mono font-bold text-stone-200 text-xs sm:text-sm">
                ${cashPosition.toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-500 block mb-0.5">A/R vs A/P Net</span>
              <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                +${(totalReceivables - totalPayables).toLocaleString()}
              </span>
            </div>
            <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800">
              <span className="text-[10px] text-stone-500 block mb-0.5">Working Capital</span>
              <span className="font-mono font-bold text-stone-200 text-xs sm:text-sm">
                ${(cashPosition + totalReceivables - totalPayables).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PRODUCT CATEGORY CATALOG BREAKDOWN */}
      {/* ========================================================================= */}
      {dashboardConfig.visibleWidgets.categoryBreakdown && (
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-xl ${getIconWrapperClass('purple')}`}>
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-stone-200 uppercase tracking-wider">
                Catalog Category Distribution
              </h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
            >
              View Inventory
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {['Electronics', 'Industrial', 'Raw Materials', 'Office'].map((cat, idx) => {
              const catProducts = products.filter((p) => p.category === cat);
              const catCount = catProducts.length;
              const catValuation = catProducts.reduce((sum, p) => {
                const onHand = stockLevels
                  .filter((sl) => sl.productId === p.id)
                  .reduce((s, sl) => s + sl.onHand, 0);
                return sum + onHand * p.purchasePrice;
              }, 0);

              const colorPaletteKey = idx === 0 ? 'sky' : idx === 1 ? 'amber' : idx === 2 ? 'teal' : 'fuchsia';

              return (
                <div key={cat} className="p-2.5 bg-stone-950 rounded-xl border border-stone-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-200">{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${getIconWrapperClass(colorPaletteKey)}`}>
                      {catCount} SKUs
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-stone-400">
                    ${catValuation.toLocaleString()} val
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
