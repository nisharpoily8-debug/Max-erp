import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
  Scale,
  DollarSign,
  PieChart,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building,
  ArrowDownToLine,
  X,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';

export const ReportsScreen: React.FC = () => {
  const {
    company,
    currentBranch,
    branches,
    accounts,
    salesOrders,
    invoices,
    purchaseOrders,
    stockLevels,
    products,
    warehouses,
    partners,
  } = useErp();

  const [selectedReportId, setSelectedReportId] = useState<string>('inventory-valuation');
  const [dateRange, setDateRange] = useState('2026-Q3');
  const [filterBranchId, setFilterBranchId] = useState('all');
  const [inventoryWarehouseFilter, setInventoryWarehouseFilter] = useState('all');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const reportCategories = [
    {
      name: 'Receivables & Payables',
      reports: [
        { id: 'ar-aging', name: 'Accounts Receivable (AR) Aging' },
        { id: 'ap-aging', name: 'Accounts Payable (AP) Aging' },
        { id: 'customer-statement', name: 'Customer Statement of Account' },
        { id: 'vendor-statement', name: 'Vendor Statement of Account' },
        { id: 'overdue-invoices', name: 'Overdue Invoices & Collections' },
      ],
    },
    {
      name: 'Financial Statements (GAAP / IFRS)',
      reports: [
        { id: 'profit-loss', name: 'Profit and Loss Statement (P&L)' },
        { id: 'balance-sheet', name: 'Standard Balance Sheet' },
        { id: 'trial-balance', name: 'Trial Balance Verification' },
        { id: 'general-ledger', name: 'General Ledger Account Detail' },
        { id: 'cash-flow', name: 'Cash Flow Summary' },
        { id: 'tax-summary', name: 'Sales Tax & VAT Liability Report' },
      ],
    },
    {
      name: 'Sales & Purchasing Operations',
      reports: [
        { id: 'sales-by-customer', name: 'Sales Performance by Customer' },
        { id: 'sales-by-product', name: 'Sales Volume by Product' },
        { id: 'purchase-by-vendor', name: 'Procurement Spend by Vendor' },
      ],
    },
    {
      name: 'Inventory & Warehousing',
      reports: [
        { id: 'inventory-valuation', name: 'Inventory Valuation (FIFO)' },
        { id: 'low-stock-reorder', name: 'Low-Stock & Reorder Report' },
        { id: 'stock-movement', name: 'Stock Movement Ledger Summary' },
      ],
    },
  ];

  // Helper for clean CSV escaping (RFC 4180)
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Dedicated Inventory Valuation & Stock List CSV Exporter
  const exportInventoryValuationCSV = (format: 'consolidated' | 'warehouse_breakdown' = 'consolidated') => {
    const lines: string[] = [];

    // Filter products based on active filters
    const activeProducts = products.filter((p) => {
      const matchesCategory =
        inventoryCategoryFilter === 'all' || p.category === inventoryCategoryFilter;
      const matchesSearch =
        !inventorySearch ||
        p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.code.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        p.barcode.toLowerCase().includes(inventorySearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Compute totals
    const totalValuation = activeProducts.reduce((sum, p) => {
      const onHand = stockLevels
        .filter(
          (sl) =>
            sl.productId === p.id &&
            (inventoryWarehouseFilter === 'all' || sl.warehouseId === inventoryWarehouseFilter)
        )
        .reduce((s, sl) => s + sl.onHand, 0);
      return sum + onHand * p.purchasePrice;
    }, 0);

    const totalUnits = activeProducts.reduce((sum, p) => {
      const onHand = stockLevels
        .filter(
          (sl) =>
            sl.productId === p.id &&
            (inventoryWarehouseFilter === 'all' || sl.warehouseId === inventoryWarehouseFilter)
        )
        .reduce((s, sl) => s + sl.onHand, 0);
      return sum + onHand;
    }, 0);

    const selectedWhName =
      inventoryWarehouseFilter === 'all'
        ? 'All Warehouses (Consolidated)'
        : warehouses.find((w) => w.id === inventoryWarehouseFilter)?.name || inventoryWarehouseFilter;

    // Metadata Header Section
    lines.push('# NEXA ERP - INVENTORY VALUATION & STOCK LIST REPORT');
    lines.push(`# Entity: ${escapeCsv(company.name)}`);
    lines.push(`# Operating Branch: ${escapeCsv(currentBranch.name)}`);
    lines.push(`# Warehouse Scope: ${escapeCsv(selectedWhName)}`);
    lines.push(`# Category Scope: ${escapeCsv(inventoryCategoryFilter === 'all' ? 'All Categories' : inventoryCategoryFilter)}`);
    lines.push(`# Export Timestamp: ${escapeCsv(new Date().toISOString())}`);
    lines.push(`# Valuation Method: FIFO / Weighted Average Standard`);
    lines.push(`# Total Catalog SKUs Exported: ${activeProducts.length}`);
    lines.push(`# Total Stock Units On Hand: ${totalUnits}`);
    lines.push(`# Total Inventory Asset Valuation (USD): $${totalValuation.toFixed(2)}`);
    lines.push('');

    if (format === 'consolidated') {
      // Build warehouse headers
      const whHeaders = warehouses.map((w) => `"${w.name} (${w.code}) On Hand"`);

      lines.push(
        [
          'SKU / Item Code',
          'Product Name',
          'Category',
          'Barcode / EAN-13',
          'Unit of Measure',
          'Costing Method',
          'Purchase Cost ($)',
          'Selling Price ($)',
          'Gross Margin (%)',
          'Min Stock Reorder Level',
          'Total On Hand Qty',
          'Reserved Qty',
          'Available Qty',
          'Total Inventory Valuation ($)',
          'Stock Status',
          ...whHeaders,
        ].join(',')
      );

      activeProducts.forEach((p) => {
        const pLevels = stockLevels.filter((sl) => sl.productId === p.id);
        const activeLevels =
          inventoryWarehouseFilter === 'all'
            ? pLevels
            : pLevels.filter((sl) => sl.warehouseId === inventoryWarehouseFilter);

        const onHand = activeLevels.reduce((s, sl) => s + sl.onHand, 0);
        const reserved = activeLevels.reduce((s, sl) => s + sl.reserved, 0);
        const available = Math.max(0, onHand - reserved);
        const val = onHand * p.purchasePrice;
        const margin =
          p.sellingPrice > 0
            ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(1)
            : '0';
        const isLow = onHand <= p.minStockLevel;
        const reorderStatus = isLow ? 'LOW STOCK - REORDER NEEDED' : 'OPTIMAL';

        const whCols = warehouses.map((w) => {
          const lvl = pLevels.find((sl) => sl.warehouseId === w.id);
          return lvl ? lvl.onHand : 0;
        });

        const row = [
          escapeCsv(p.code),
          escapeCsv(p.name),
          escapeCsv(p.category),
          escapeCsv(p.barcode),
          escapeCsv(p.unit),
          escapeCsv(p.costingMethod),
          p.purchasePrice.toFixed(2),
          p.sellingPrice.toFixed(2),
          `${margin}%`,
          p.minStockLevel,
          onHand,
          reserved,
          available,
          val.toFixed(2),
          escapeCsv(reorderStatus),
          ...whCols,
        ];
        lines.push(row.join(','));
      });
    } else {
      // Warehouse breakdown format: Each row represents product at a specific warehouse facility
      lines.push(
        [
          'Warehouse Code',
          'Warehouse Name',
          'SKU / Item Code',
          'Product Name',
          'Category',
          'Barcode',
          'Unit',
          'Costing Method',
          'Unit Purchase Cost ($)',
          'Selling Price ($)',
          'On Hand Qty',
          'Reserved Qty',
          'Available Qty',
          'Warehouse Valuation ($)',
          'Min Stock Level',
          'Reorder Status',
        ].join(',')
      );

      const targetWarehouses =
        inventoryWarehouseFilter === 'all'
          ? warehouses
          : warehouses.filter((w) => w.id === inventoryWarehouseFilter);

      targetWarehouses.forEach((wh) => {
        activeProducts.forEach((p) => {
          const sl = stockLevels.find((l) => l.productId === p.id && l.warehouseId === wh.id);
          const onHand = sl ? sl.onHand : 0;
          const reserved = sl ? sl.reserved : 0;
          const available = Math.max(0, onHand - reserved);
          const val = onHand * p.purchasePrice;
          const isLow = onHand <= p.minStockLevel;
          const reorderStatus = isLow ? 'LOW STOCK' : 'OPTIMAL';

          const row = [
            escapeCsv(wh.code),
            escapeCsv(wh.name),
            escapeCsv(p.code),
            escapeCsv(p.name),
            escapeCsv(p.category),
            escapeCsv(p.barcode),
            escapeCsv(p.unit),
            escapeCsv(p.costingMethod),
            p.purchasePrice.toFixed(2),
            p.sellingPrice.toFixed(2),
            onHand,
            reserved,
            available,
            val.toFixed(2),
            p.minStockLevel,
            escapeCsv(reorderStatus),
          ];
          lines.push(row.join(','));
        });
      });
    }

    // Trigger download via Blob
    const csvContent = lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Maxerp_Inventory_Valuation_Stock_List_${format}_${dateStr}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccessMessage(
      `Inventory Valuation & Stock List (${format === 'consolidated' ? 'Consolidated' : 'Warehouse Breakdown'}) exported as ${filename}`
    );
    setExportMenuOpen(false);
    setTimeout(() => setExportSuccessMessage(null), 5000);
  };

  // General CSV Export handler for currently selected report
  const handleExportCSV = () => {
    if (selectedReportId === 'inventory-valuation') {
      exportInventoryValuationCSV('consolidated');
      return;
    }

    if (selectedReportId === 'low-stock-reorder') {
      const lines: string[] = [];
      lines.push('# MAXERP - LOW STOCK & REORDER REPORT');
      lines.push(`# Entity: ${escapeCsv(company.name)}`);
      lines.push(`# Generated: ${escapeCsv(new Date().toISOString())}`);
      lines.push('');
      lines.push('SKU,Product Name,Category,Unit,On Hand Qty,Min Stock Level,Deficit Units,Unit Purchase Cost ($),Restock Cost Est ($)');

      products.forEach((p) => {
        const onHand = stockLevels
          .filter((sl) => sl.productId === p.id)
          .reduce((s, sl) => s + sl.onHand, 0);
        if (onHand <= p.minStockLevel) {
          const deficit = p.minStockLevel - onHand;
          const restockCost = deficit * p.purchasePrice;
          lines.push(
            [
              escapeCsv(p.code),
              escapeCsv(p.name),
              escapeCsv(p.category),
              escapeCsv(p.unit),
              onHand,
              p.minStockLevel,
              deficit,
              p.purchasePrice.toFixed(2),
              restockCost.toFixed(2),
            ].join(',')
          );
        }
      });

      const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Maxerp_Low_Stock_Reorder_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportSuccessMessage('Low-Stock & Reorder report exported as CSV!');
      setTimeout(() => setExportSuccessMessage(null), 4000);
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Report: ${selectedReportId.toUpperCase()}\n`;
    csvContent += `Entity: ${company.name}\n`;
    csvContent += `Branch: ${filterBranchId}\n`;
    csvContent += `Date: ${new Date().toISOString()}\n\n`;

    if (selectedReportId === 'ar-aging') {
      csvContent += 'Customer,Current,1-30 Days,31-60 Days,61-90 Days,90+ Days,Total Due\n';
      invoices.forEach((inv) => {
        csvContent += `"${inv.partnerName}",$0.00,$0.00,"$${inv.balanceDue.toFixed(2)}",$0.00,$0.00,"$${inv.balanceDue.toFixed(2)}"\n`;
      });
    } else {
      csvContent += 'Item,Description,Value\n';
      accounts.forEach((a) => {
        csvContent += `"${a.code}","${a.name}","$${a.currentBalance.toFixed(2)}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Maxerp_${selectedReportId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Derived inventory metrics for report
  const inventoryCategories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredInventoryProducts = products.filter((p) => {
    const matchesCategory =
      inventoryCategoryFilter === 'all' || p.category === inventoryCategoryFilter;
    const matchesSearch =
      !inventorySearch ||
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.code.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.barcode.toLowerCase().includes(inventorySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalCatalogUnits = products.reduce((sum, p) => {
    const onHand = stockLevels
      .filter(
        (sl) =>
          sl.productId === p.id &&
          (inventoryWarehouseFilter === 'all' || sl.warehouseId === inventoryWarehouseFilter)
      )
      .reduce((s, sl) => s + sl.onHand, 0);
    return sum + onHand;
  }, 0);

  const totalInventoryValuation = products.reduce((sum, p) => {
    const onHand = stockLevels
      .filter(
        (sl) =>
          sl.productId === p.id &&
          (inventoryWarehouseFilter === 'all' || sl.warehouseId === inventoryWarehouseFilter)
      )
      .reduce((s, sl) => s + sl.onHand, 0);
    return sum + onHand * p.purchasePrice;
  }, 0);

  const lowStockCount = products.filter((p) => {
    const onHand = stockLevels
      .filter((sl) => sl.productId === p.id)
      .reduce((s, sl) => s + sl.onHand, 0);
    return onHand <= p.minStockLevel;
  }).length;

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Toast Alert on Export Success */}
      {exportSuccessMessage && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl flex items-center justify-between text-xs text-emerald-200 shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
          <button
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-100">Financial & Operational Reports</h2>
          <p className="text-xs text-stone-400">Interactive analytics with CSV export & print support</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dedicated Inventory CSV Export Quick Action */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Inventory CSV</span>
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="px-2.5 py-1.5 border-b border-stone-800">
                  <span className="font-bold text-stone-200 block text-[11px]">
                    Download Inventory CSV
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    Choose export schema format
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportInventoryValuationCSV('consolidated')}
                  className="w-full text-left px-2.5 py-2 hover:bg-stone-800 rounded-xl transition flex items-start gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-stone-200 block text-[11px]">
                      Consolidated Stock List
                    </span>
                    <span className="text-[10px] text-stone-400">
                      SKU, Barcode, UoM, Cost, Margin, Valuation & Warehouse columns
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => exportInventoryValuationCSV('warehouse_breakdown')}
                  className="w-full text-left px-2.5 py-2 hover:bg-stone-800 rounded-xl transition flex items-start gap-2 cursor-pointer"
                >
                  <Building className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-stone-200 block text-[11px]">
                      By-Warehouse Breakdown
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Granular line items per warehouse facility with local valuations
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 rounded-xl text-xs font-semibold shadow-xs transition"
            title="Download CSV for current report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-stone-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Report Selector Dropdown */}
      <div>
        <label className="text-xs text-stone-400 block mb-1.5 font-medium">Select Report Type</label>
        <select
          value={selectedReportId}
          onChange={(e) => setSelectedReportId(e.target.value)}
          className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2.5 text-xs text-stone-200 font-semibold"
        >
          {reportCategories.map((cat) => (
            <optgroup key={cat.name} label={cat.name}>
              {cat.reports.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] text-stone-400 block mb-1">Fiscal Period</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200"
          >
            <option value="2026-Q3">Current Quarter (Q3 2026)</option>
            <option value="2026-YTD">Year to Date (2026)</option>
            <option value="2026-M09">September 2026</option>
            <option value="2026-Q2">Prior Quarter (Q2 2026)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-stone-400 block mb-1">Operating Branch</label>
          <select
            value={filterBranchId}
            onChange={(e) => setFilterBranchId(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200"
          >
            <option value="all">Consolidated (All Branches)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Canvas Card */}
      <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-4">
        {/* Report Header */}
        <div className="border-b border-stone-800 pb-3 flex flex-col sm:flex-row justify-between sm:items-end gap-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              {company.name}
            </span>
            <h3 className="font-bold text-sm text-stone-100">
              {reportCategories.flatMap((c) => c.reports).find((r) => r.id === selectedReportId)?.name}
            </h3>
            <p className="text-[11px] text-stone-500">
              Currency: USD ($) • Accounting Basis: Accrual • As of {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Quick inline button if currently on inventory-valuation */}
          {selectedReportId === 'inventory-valuation' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportInventoryValuationCSV('consolidated')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Valuation CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Report Content Rendering */}
        {selectedReportId === 'ar-aging' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Current (0–30)</span>
                <span className="font-mono font-bold text-emerald-400">$24,500.00</span>
              </div>
              <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">31–60 Days</span>
                <span className="font-mono font-bold text-sky-400">$8,884.40</span>
              </div>
              <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">61–90 Days</span>
                <span className="font-mono font-bold text-amber-400">$0.00</span>
              </div>
              <div className="p-2.5 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-[10px] text-stone-400 block">90+ Days</span>
                <span className="font-mono font-bold text-red-400">$3,906.00</span>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-stone-400 text-[10px] uppercase border-b border-stone-800">
                  <th className="py-2">Customer</th>
                  <th className="py-2 text-right">Invoice Ref</th>
                  <th className="py-2 text-right">Age (Days)</th>
                  <th className="py-2 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="text-stone-300">
                    <td className="py-2 font-sans font-medium text-stone-200">{inv.partnerName}</td>
                    <td className="py-2 text-right text-stone-400">{inv.invoiceNumber}</td>
                    <td className="py-2 text-right">
                      {inv.status === 'Overdue' ? (
                        <span className="text-red-400 font-bold">40 days</span>
                      ) : (
                        <span className="text-emerald-400">12 days</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-bold text-stone-100">
                      ${inv.balanceDue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReportId === 'profit-loss' && (
          <div className="space-y-3 text-xs">
            <div className="space-y-1.5 divide-y divide-stone-800/60 font-mono">
              <div className="pt-1.5 flex justify-between font-sans font-bold text-stone-200">
                <span>Total Product Sales Revenue (4000)</span>
                <span className="font-mono text-emerald-400">$94,800.00</span>
              </div>
              <div className="pt-1.5 flex justify-between font-sans font-bold text-stone-200">
                <span>Technical Support Revenue (4100)</span>
                <span className="font-mono text-emerald-400">$18,400.00</span>
              </div>
              <div className="pt-1.5 flex justify-between font-bold text-stone-100 bg-stone-950 p-2 rounded-xl">
                <span>Total Operating Revenue</span>
                <span className="text-emerald-400">$113,200.00</span>
              </div>

              <div className="pt-1.5 flex justify-between font-sans text-stone-300">
                <span>Cost of Goods Sold (5000)</span>
                <span className="text-red-400">($52,120.00)</span>
              </div>
              <div className="pt-1.5 flex justify-between font-bold text-stone-100 bg-stone-950 p-2 rounded-xl">
                <span>Gross Margin (53.9%)</span>
                <span className="text-emerald-400">$61,080.00</span>
              </div>

              <div className="pt-1.5 flex justify-between font-sans text-stone-300">
                <span>Freight & Logistics (6100)</span>
                <span className="text-red-400">($6,420.00)</span>
              </div>
              <div className="pt-1.5 flex justify-between font-sans text-stone-300">
                <span>Salaries & Admin Overhead (6200)</span>
                <span className="text-red-400">($32,500.00)</span>
              </div>

              <div className="pt-2 flex justify-between text-sm font-bold text-stone-100 bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
                <span>Net Operating Income (EBIT)</span>
                <span className="text-emerald-400">$22,160.00</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Rich Inventory Valuation & Stock List Report */}
        {selectedReportId === 'inventory-valuation' && (
          <div className="space-y-4">
            {/* KPI Summary Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800">
                <span className="text-[10px] text-stone-500 block uppercase font-semibold">
                  Total Asset Valuation
                </span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ${totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800">
                <span className="text-[10px] text-stone-500 block uppercase font-semibold">
                  Total Units in Stock
                </span>
                <span className="text-base font-bold font-mono text-stone-100">
                  {totalCatalogUnits.toLocaleString()} units
                </span>
              </div>

              <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800">
                <span className="text-[10px] text-stone-500 block uppercase font-semibold">
                  Active Catalog SKUs
                </span>
                <span className="text-base font-bold font-mono text-stone-200">
                  {products.length} items
                </span>
              </div>

              <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800">
                <span className="text-[10px] text-stone-500 block uppercase font-semibold">
                  Reorder Attention
                </span>
                <span
                  className={`text-base font-bold font-mono ${
                    lowStockCount > 0 ? 'text-red-400' : 'text-stone-400'
                  }`}
                >
                  {lowStockCount} items low
                </span>
              </div>
            </div>

            {/* Inventory Valuation Controls & CSV Export Bar */}
            <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  {/* Warehouse Selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Building className="w-3.5 h-3.5 text-stone-500" />
                    <select
                      value={inventoryWarehouseFilter}
                      onChange={(e) => setInventoryWarehouseFilter(e.target.value)}
                      className="bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200"
                    >
                      <option value="all">All Warehouses (Consolidated)</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name} ({wh.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Filter className="w-3.5 h-3.5 text-stone-500" />
                    <select
                      value={inventoryCategoryFilter}
                      onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                      className="bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-stone-200 capitalize"
                    >
                      {inventoryCategories.map((c) => (
                        <option key={c} value={c}>
                          {c === 'all' ? 'All Categories' : c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* CSV Download Options */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => exportInventoryValuationCSV('consolidated')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                    title="Export consolidated stock list with warehouse columns"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => exportInventoryValuationCSV('warehouse_breakdown')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700/80 rounded-xl text-xs font-semibold transition cursor-pointer"
                    title="Export granular rows per warehouse"
                  >
                    <Building className="w-3.5 h-3.5 text-sky-400" />
                    <span>By Warehouse</span>
                  </button>
                </div>
              </div>

              {/* Keyword Search within Report */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Filter stock list by SKU, name, or barcode..."
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
                />
                {inventorySearch && (
                  <button
                    onClick={() => setInventorySearch('')}
                    className="absolute right-2.5 top-2 text-stone-500 hover:text-stone-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Inventory Valuation Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-stone-400 text-[10px] uppercase border-b border-stone-800">
                    <th className="py-2.5">SKU / Item</th>
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5 text-right">On Hand</th>
                    <th className="py-2.5 text-right">Cost Price</th>
                    <th className="py-2.5 text-right">Selling Price</th>
                    <th className="py-2.5 text-right">Method</th>
                    <th className="py-2.5 text-right">Asset Valuation</th>
                    <th className="py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {filteredInventoryProducts.map((p) => {
                    const pLevels = stockLevels.filter((sl) => sl.productId === p.id);
                    const activeLevels =
                      inventoryWarehouseFilter === 'all'
                        ? pLevels
                        : pLevels.filter((sl) => sl.warehouseId === inventoryWarehouseFilter);

                    const onHand = activeLevels.reduce((s, sl) => s + sl.onHand, 0);
                    const reserved = activeLevels.reduce((s, sl) => s + sl.reserved, 0);
                    const available = Math.max(0, onHand - reserved);
                    const val = onHand * p.purchasePrice;
                    const isLow = onHand <= p.minStockLevel;

                    return (
                      <tr key={p.id} className="text-stone-300 hover:bg-stone-950/40 transition">
                        <td className="py-2.5 font-sans">
                          <span className="font-semibold text-stone-100 block">{p.name}</span>
                          <span className="text-[10px] font-mono text-stone-500">
                            {p.code} • Barcode: {p.barcode}
                          </span>
                        </td>
                        <td className="py-2.5 font-sans text-stone-400">
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="font-bold text-stone-100">
                            {onHand} {p.unit}
                          </span>
                          {reserved > 0 && (
                            <span className="text-[10px] text-stone-500 block">
                              ({available} avail / {reserved} res)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right text-stone-300">
                          ${p.purchasePrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right text-stone-300">
                          ${p.sellingPrice.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right text-[10px] text-stone-400 font-sans">
                          {p.costingMethod}
                        </td>
                        <td className="py-2.5 text-right font-bold text-emerald-400">
                          ${val.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center font-sans">
                          {isLow ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-bold whitespace-nowrap">
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold whitespace-nowrap">
                              Optimal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredInventoryProducts.length === 0 && (
              <div className="p-8 text-center bg-stone-950 rounded-2xl border border-stone-800 text-stone-400 text-xs">
                No inventory items match the current warehouse, category, or search filters.
              </div>
            )}
          </div>
        )}

        {/* Fallback for other reports */}
        {!['ar-aging', 'profit-loss', 'inventory-valuation'].includes(selectedReportId) && (
          <div className="space-y-3">
            <p className="text-xs text-stone-400">
              Generated real-time ledger report for <strong>{selectedReportId}</strong>:
            </p>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-stone-400 text-[10px] uppercase border-b border-stone-800">
                  <th className="py-2">Line Descriptor</th>
                  <th className="py-2 text-right">Ledger Category</th>
                  <th className="py-2 text-right">Amount ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {accounts.slice(0, 6).map((acc) => (
                  <tr key={acc.id} className="text-stone-300">
                    <td className="py-2 font-sans">{acc.code} - {acc.name}</td>
                    <td className="py-2 text-right text-stone-400">{acc.category}</td>
                    <td className="py-2 text-right font-bold text-stone-100">
                      ${acc.currentBalance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

