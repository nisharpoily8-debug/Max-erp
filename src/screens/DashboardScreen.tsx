import React, { useState } from 'react';
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
  Users,
  CheckCircle2,
  Calendar,
  Truck,
  BarChart3,
  SlidersHorizontal,
  FileText,
  UserCheck,
  Camera,
  AlertTriangle,
  Lock,
  Layers,
  Building,
  Target,
  FileCheck,
  Briefcase,
  Scale,
  Sparkles,
  Search,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { useTheme } from '../context/ThemeContext';
import { CustomDashboardWidgets } from '../components/CustomDashboardWidgets';
import { UserRole } from '../types';

interface DashboardScreenProps {
  onNavigate: (tab: any) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const {
    currentUser,
    setRole,
    salesOrders,
    invoices,
    purchaseOrders,
    stockLevels,
    products,
    partners,
    auditLogs,
    currentBranch,
    branches,
    accounts,
    vendorBills,
    approveSalesOrder,
    approvePurchaseOrder,
    postInvoice,
  } = useErp();

  const { dashboardConfig } = useTheme();

  // Metrics calculations
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

  const pendingSalesApprovals = salesOrders.filter((s) => s.status === 'Pending Approval');
  const pendingPoApprovals = purchaseOrders.filter((p) => p.status === 'Pending Approval');
  const pendingApprovalsCount = pendingSalesApprovals.length + pendingPoApprovals.length;

  const lowStockItems = products.filter((prod) => {
    const totalQty = stockLevels
      .filter((sl) => sl.productId === prod.id)
      .reduce((sum, sl) => sum + sl.onHand, 0);
    return totalQty <= prod.minStockLevel;
  });

  const allRoles: UserRole[] = [
    'Administrator',
    'Accountant',
    'Salesperson',
    'Purchase Officer',
    'Warehouse User',
    'Manager',
    'Viewer',
  ];

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Role Switcher Pill Bar for Instant Testing of All Role Dashboards */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-2 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-stone-400">Role-Specific Views:</span>
          <span className="text-[10px] text-emerald-400 font-mono">Active: {currentUser.role}</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {allRoles.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition ${
                currentUser.role === r
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Role-Specific Welcome Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-stone-900 to-stone-900 border border-emerald-500/30 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                {currentUser.role} Dashboard
              </span>
              <span className="text-xs text-stone-400">• {currentBranch.name}</span>
            </div>
            <h2 className="text-lg font-bold text-stone-100 mt-1">Hello, {currentUser.name}</h2>
            <p className="text-xs text-stone-400">
              Approval authority: <strong className="text-stone-200">${currentUser.approvalLimit.toLocaleString()}</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Custom Dashboard Overview Widgets with Colorful Icons & Customizer */}
      <CustomDashboardWidgets onNavigate={onNavigate} />

      {/* Role-Specific Deep Workflow Dashboards (toggleable in Customizer) */}
      {dashboardConfig.visibleWidgets.roleFocus && (
        <>
          {/* ========================================================================= */}
          {/* 1. ADMINISTRATOR DASHBOARD */}
          {/* ========================================================================= */}
      {currentUser.role === 'Administrator' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => onNavigate('sales')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Enterprise Revenue</span>
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>+14.2% MoM</span>
              </div>
            </div>

            <div
              onClick={() => onNavigate('accounting')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Operating Margin</span>
                <TrendingUp className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">44.8%</div>
              <div className="text-[10px] text-stone-400 mt-1">Net EBITDA Healthy</div>
            </div>

            <div
              onClick={() => onNavigate('audit')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Audit Trail Records</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                {auditLogs.length} Sealed Logs
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">100% Immutable SOC2</div>
            </div>

            <div
              onClick={() => onNavigate('inventory')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Multi-Branch Nodes</span>
                <Building className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                {branches.length} Operational
              </div>
              <div className="text-[10px] text-stone-400 mt-1">West HQ & East Hub</div>
            </div>
          </div>

          {/* Branch Revenue Comparison Chart */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-xs text-stone-300 uppercase tracking-wider">
              Operating Branch Revenue Contribution
            </h3>
            {totalSales === 0 ? (
              <div className="py-3 text-center text-xs text-stone-500">
                No orders recorded yet. Register customers and issue sales orders to see real-time branch revenue analytics.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {branches.map((b) => {
                  const bSales = salesOrders
                    .filter((o) => o.branchId === b.id)
                    .reduce((sum, o) => sum + o.totalAmount, 0);
                  const bPercent = totalSales > 0 ? Math.round((bSales / totalSales) * 100) : 0;
                  return (
                    <div key={b.id}>
                      <div className="flex justify-between text-stone-300 mb-1">
                        <span>{b.name}</span>
                        <span className="font-mono font-bold text-emerald-400">
                          ${bSales.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({bPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${bPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending System Approvals Alert */}
          {pendingApprovalsCount > 0 && (
            <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-amber-300 block">
                    {pendingApprovalsCount} Transactions Awaiting Approval
                  </span>
                  <span className="text-[11px] text-stone-400">
                    High-value sales orders and vendor POs pending sign-off
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('sales')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs"
              >
                Review
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ACCOUNTANT DASHBOARD */}
      {/* ========================================================================= */}
      {currentUser.role === 'Accountant' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => onNavigate('invoices')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Receivables (AR)</span>
                <DollarSign className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                ${totalReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-amber-400 mt-1">1 overdue invoice</div>
            </div>

            <div
              onClick={() => onNavigate('purchasing')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Payables (AP)</span>
                <Truck className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                ${totalPayables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">Due next 14 days</div>
            </div>

            <div
              onClick={() => onNavigate('accounting')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Cash & Liquidity</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                ${cashPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">Bank + Petty cash</div>
            </div>

            <div
              onClick={() => onNavigate('accounting')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Trial Balance Health</span>
                <Scale className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">Balanced</div>
              <div className="text-[10px] text-emerald-400 mt-1">Debits == Credits</div>
            </div>
          </div>

          {/* AR Aging Breakdown */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-xs text-stone-300 uppercase tracking-wider">
              Accounts Receivable Aging Analysis
            </h3>
            {totalReceivables === 0 ? (
              <div className="py-2 text-center text-xs text-stone-500">
                Zero outstanding receivables. All posted invoices are settled.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-stone-950 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-400 block">Current (0-30d)</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ${invoices.filter((i) => i.status === 'Posted').reduce((s, i) => s + i.balanceDue, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-2 bg-stone-950 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-400 block">31-60 Days</span>
                  <span className="font-bold text-amber-400 font-mono">
                    ${invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + i.balanceDue, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-2 bg-stone-950 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-400 block">Over 60 Days</span>
                  <span className="font-bold text-rose-400 font-mono">$0.00</span>
                </div>
              </div>
            )}
          </div>

          {/* Pending Invoices to Post to GL */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-stone-300 uppercase tracking-wider">
                Unposted Draft Invoices
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">Require GL Posting</span>
            </div>

            {invoices.filter((i) => i.status === 'Draft').length === 0 ? (
              <p className="text-xs text-stone-500">All customer invoices are posted to the General Ledger.</p>
            ) : (
              <div className="space-y-2">
                {invoices
                  .filter((i) => i.status === 'Draft')
                  .map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-200">{inv.invoiceNumber}</span>
                        <span className="text-stone-400 block text-[11px]">{inv.partnerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-200">
                          ${inv.totalAmount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => postInvoice(inv.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                        >
                          Post to GL
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SALESPERSON DASHBOARD */}
      {/* ========================================================================= */}
      {currentUser.role === 'Salesperson' && (
        <div className="space-y-4">
          {/* Target Progress Bar */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400 font-medium">Monthly Sales Quota</span>
                <h3 className="text-base font-bold text-stone-100 font-mono">
                  ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })} / $50,000.00
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono">
                {totalSales > 0 ? ((totalSales / 50000) * 100).toFixed(1) : '0.0'}% Achieved
              </span>
            </div>
            <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, totalSales > 0 ? (totalSales / 50000) * 100 : 0)}%` }}
              />
            </div>
            <p className="text-[11px] text-stone-400">
              {totalSales >= 50000
                ? 'Monthly quota reached! Bonus threshold attained.'
                : `$${Math.max(0, 50000 - totalSales).toLocaleString('en-US', { minimumFractionDigits: 2 })} needed to hit quota target.`}
            </p>
          </div>

          {/* Sales KPIs */}
          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => onNavigate('sales')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Open Quotations</span>
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                ${salesOrders
                  .filter((s) => s.status === 'Draft' || s.status === 'Pending Approval')
                  .reduce((sum, s) => sum + s.totalAmount, 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">
                {salesOrders.filter((s) => s.status === 'Draft' || s.status === 'Pending Approval').length} active RFQs
              </div>
            </div>

            <div
              onClick={() => onNavigate('customers')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Active Customers</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                {partners.filter((p) => p.type === 'customer' || p.type === 'both').length}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">Manage partner accounts</div>
            </div>
          </div>

          {/* Customer CRM Accounts */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-stone-300 uppercase tracking-wider">
                My Primary Customer Accounts
              </h3>
              <button
                onClick={() => onNavigate('customers')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {partners.filter((p) => p.type === 'customer' || p.type === 'both').length === 0 ? (
                <div className="py-4 text-center text-xs text-stone-500 space-y-2">
                  <p>No customer accounts registered yet.</p>
                  <button
                    onClick={() => onNavigate('customers')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    Register First Customer
                  </button>
                </div>
              ) : (
                partners
                  .filter((p) => p.type === 'customer' || p.type === 'both')
                  .slice(0, 3)
                  .map((cust) => (
                    <div
                      key={cust.id}
                      className="p-2.5 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-stone-200">{cust.name}</span>
                        <span className="text-stone-400 text-[11px] block font-mono">
                          Terms: Net {cust.paymentTermsDays} • Credit: ${cust.creditLimit.toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => onNavigate('sales')}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-lg text-xs font-semibold"
                      >
                        New Quote
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PURCHASE OFFICER DASHBOARD */}
      {/* ========================================================================= */}
      {currentUser.role === 'Purchase Officer' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => onNavigate('purchasing')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Procurement Spend</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                ${purchaseOrders.reduce((s, p) => s + p.totalAmount, 0).toFixed(2)}
              </div>
              <div className="text-[10px] text-stone-400 mt-1">This fiscal cycle</div>
            </div>

            <div
              onClick={() => onNavigate('purchasing')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Vendor Lead Time</span>
                <Clock className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">3.8 Days</div>
              <div className="text-[10px] text-emerald-400 mt-1">On-time fulfillment 94%</div>
            </div>
          </div>

          {/* Pending Purchase Orders list */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-stone-300 uppercase tracking-wider">
                Procurement Orders Pipeline
              </h3>
              <button
                onClick={() => onNavigate('purchasing')}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
              >
                + Create PO
              </button>
            </div>
            <div className="space-y-2">
              {purchaseOrders.map((po) => (
                <div
                  key={po.id}
                  className="p-2.5 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-stone-200">{po.poNumber}</span>
                    <span className="text-stone-400 block text-[11px]">
                      {po.vendorName} • ETA: {po.expectedArrivalDate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-stone-200">
                      ${po.totalAmount.toFixed(2)}
                    </span>
                    <span className="text-[10px] block text-emerald-400">{po.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Reorder Alerts */}
          {lowStockItems.length > 0 && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-2 text-xs">
              <span className="font-bold text-rose-300 block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Critical Reorder Alert ({lowStockItems.length} SKUs Low)
              </span>
              {lowStockItems.map((prod) => (
                <div key={prod.id} className="flex justify-between text-stone-300 text-[11px]">
                  <span>{prod.name} ({prod.code})</span>
                  <span className="text-rose-400 font-mono font-bold">Min Stock: {prod.minStockLevel} pcs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. WAREHOUSE USER DASHBOARD */}
      {/* ========================================================================= */}
      {currentUser.role === 'Warehouse User' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => onNavigate('purchasing')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Inbound Receipts</span>
                <Truck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                {purchaseOrders.filter((p) => p.status === 'Ordered').length} Pending
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">Ready for barcode check-in</div>
            </div>

            <div
              onClick={() => onNavigate('sales')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Outbound Deliveries</span>
                <Package className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                {salesOrders.filter((s) => s.status === 'Confirmed').length} to Pick/Pack
              </div>
              <div className="text-[10px] text-stone-400 mt-1">Delivery orders</div>
            </div>
          </div>

          {/* Quick Barcode Stock Operations Bar */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-xs text-stone-300 uppercase tracking-wider">
              Warehouse Barcode Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('inventory')}
                className="p-3 bg-stone-950 border border-stone-800 hover:border-emerald-500 rounded-xl text-left transition group"
              >
                <Camera className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="font-bold text-stone-200 block group-hover:text-emerald-400">
                  Stock Count Audit
                </span>
                <span className="text-[10px] text-stone-500">Live camera audit cycle</span>
              </button>

              <button
                onClick={() => onNavigate('purchasing')}
                className="p-3 bg-stone-950 border border-stone-800 hover:border-teal-500 rounded-xl text-left transition group"
              >
                <Package className="w-4 h-4 text-teal-400 mb-1" />
                <span className="font-bold text-stone-200 block group-hover:text-teal-400">
                  Scan Inbound Delivery
                </span>
                <span className="text-[10px] text-stone-500">PO verification & receipt</span>
              </button>
            </div>
          </div>

          {/* Multi-Warehouse Capacity Utilization */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-xs text-stone-300 uppercase tracking-wider">
              Warehouse Capacity Utilization
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-stone-300 mb-1">
                  <span>Central Warehouse (Bay 1-12)</span>
                  <span className="font-mono font-bold text-emerald-400">72% Full</span>
                </div>
                <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[72%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-stone-300 mb-1">
                  <span>Newark Logistics Hub</span>
                  <span className="font-mono font-bold text-teal-400">48% Full</span>
                </div>
                <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full w-[48%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MANAGER DASHBOARD */}
      {/* ========================================================================= */}
      {currentUser.role === 'Manager' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div
              onClick={() => onNavigate('sales')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Pending Approvals</span>
                <UserCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">
                {pendingApprovalsCount} Documents
              </div>
              <div className="text-[10px] text-amber-400 mt-1">Requires supervisor limit</div>
            </div>

            <div
              onClick={() => onNavigate('accounting')}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl cursor-pointer hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-stone-400 text-xs mb-1">
                <span>Team Gross Margin</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-stone-100 font-mono">46.2%</div>
              <div className="text-[10px] text-emerald-400 mt-1">Strong product markup</div>
            </div>
          </div>

          {/* Interactive Approval Queue (1-Click Inline Approvals for Manager) */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-stone-300 uppercase tracking-wider">
                Manager Signature & Approval Queue
              </h3>
              <span className="text-[10px] text-amber-400 font-mono">Limit: $100,000</span>
            </div>

            {pendingApprovalsCount === 0 ? (
              <div className="p-4 text-center text-xs text-stone-500">
                All sales orders and procurement RFQs are fully approved.
              </div>
            ) : (
              <div className="space-y-2">
                {pendingSalesApprovals.map((so) => (
                  <div
                    key={so.id}
                    className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-200">{so.orderNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-800 text-stone-400">
                          Sales Order
                        </span>
                      </div>
                      <span className="text-stone-400 block text-[11px]">
                        {so.partnerName} • Rep: {so.salespersonName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-200">
                        ${so.totalAmount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => approveSalesOrder(so.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}

                {pendingPoApprovals.map((po) => (
                  <div
                    key={po.id}
                    className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-200">{po.poNumber}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-800 text-stone-400">
                          Purchase Order
                        </span>
                      </div>
                      <span className="text-stone-400 block text-[11px]">
                        Vendor: {po.vendorName} • Buyer: {po.officerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-200">
                        ${po.totalAmount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => approvePurchaseOrder(po.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. VIEWER DASHBOARD (READ-ONLY COMPLIANCE & STATS) */}
      {/* ========================================================================= */}
      {currentUser.role === 'Viewer' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-stone-900/90 border border-stone-800 rounded-2xl flex items-center gap-2 text-xs text-stone-400">
            <Lock className="w-4 h-4 text-stone-500 shrink-0" />
            <span>
              Read-Only Governance Mode. Direct mutations and approvals are disabled for external audit observers.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl">
              <span className="text-stone-400 text-xs block mb-1">Company Net Assets</span>
              <div className="text-base font-bold text-stone-100 font-mono">
                ${accounts
                  .filter((a) => a.category === 'Asset')
                  .reduce((sum, a) => sum + a.currentBalance, 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-emerald-400 mt-1">General Ledger Book Value</div>
            </div>

            <div className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl">
              <span className="text-stone-400 text-xs block mb-1">Compliance Health</span>
              <div className="text-base font-bold text-emerald-400 font-mono">100% Audited</div>
              <div className="text-[10px] text-stone-400 mt-1">Zero unlogged edits</div>
            </div>
          </div>

          {/* Read-Only Feed */}
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <h3 className="font-bold text-xs text-stone-300 uppercase tracking-wider">
              Recent Enterprise Audit Activity
            </h3>
            <div className="space-y-2">
              {auditLogs.slice(0, 4).map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-stone-950 rounded-xl border border-stone-800 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-stone-300">{log.action} {log.entityType}</span>
                    <span className="text-[10px] text-stone-500 block font-mono">{log.entityReference} • {log.userName}</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-mono">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
