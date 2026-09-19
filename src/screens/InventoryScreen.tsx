import React, { useState } from 'react';
import {
  Package,
  Barcode,
  Layers,
  SlidersHorizontal,
  Plus,
  Minus,
  AlertTriangle,
  History,
  Building,
  CheckCircle2,
  X,
  Camera,
  ClipboardList,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Search,
  PackagePlus,
  Trash2,
  Tag,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronUp,
  Printer,
  QrCode,
  Truck,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { DocumentAuditModal } from '../components/DocumentAuditModal';
import { AddProductModal } from '../components/AddProductModal';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ProductPriceTrendChart } from '../components/ProductPriceTrendChart';
import { ProductBarcodeLabelModal } from '../components/ProductBarcodeLabelModal';
import { SameDatePickingListModal } from '../components/SameDatePickingListModal';
import { DeliveryNoteModal } from '../components/DeliveryNoteModal';
import { PrintableDocumentModal } from '../components/PrintableDocumentModal';
import { Product, StockCountItem, DeliveryNote, SameDateBatchPickingList, SalesOrder } from '../types';

export const InventoryScreen: React.FC = () => {
  const {
    products,
    warehouses,
    stockLevels,
    stockMovements,
    purchaseOrders,
    salesOrders,
    deliveryNotes,
    currentBranch,
    adjustStock,
    deleteProduct,
  } = useErp();

  const [activeTab, setActiveTab] = useState<'levels' | 'movements' | 'count'>('levels');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerContext, setScannerContext] = useState<'inspect' | 'adjust' | 'count'>('inspect');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Picking & Delivery Note Modals
  const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);
  const [isDeliveryNoteModalOpen, setIsDeliveryNoteModalOpen] = useState(false);
  const [selectedDnForModal, setSelectedDnForModal] = useState<DeliveryNote | null>(null);
  const [selectedBatchForPdf, setSelectedBatchForPdf] = useState<SameDateBatchPickingList | null>(null);
  const [selectedDnForPdf, setSelectedDnForPdf] = useState<DeliveryNote | null>(null);

  // Label Printing Modal
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [labelModalProduct, setLabelModalProduct] = useState<Product | null>(null);

  // Product Details & Price Trend Modal
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);
  const [expandedTrendProductId, setExpandedTrendProductId] = useState<string | null>(null);

  // Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouses[0]?.id || '');
  const [deltaQty, setDeltaQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Physical Stock Audit Variance');

  // Physical Stock Count Cycle State
  const [countWarehouseId, setCountWarehouseId] = useState(warehouses[0]?.id || '');
  const [countItems, setCountItems] = useState<Record<string, number>>({});
  const [countCommitted, setCountCommitted] = useState(false);

  // Document Audit Modal
  const [auditModalMovement, setAuditModalMovement] = useState<{
    id: string;
    ref: string;
    title: string;
  } | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentWarehouseLevel = stockLevels.find(
    (sl) => sl.productId === selectedProductId && sl.warehouseId === selectedWarehouseId
  );

  const handleOpenAdjust = (prodId?: string, whId?: string) => {
    if (prodId) setSelectedProductId(prodId);
    if (whId) setSelectedWarehouseId(whId);
    setIsAdjustmentModalOpen(true);
  };

  const handleConfirmAdjust = () => {
    if (deltaQty === 0) return;
    adjustStock(selectedProductId, selectedWarehouseId, deltaQty, adjustReason);
    setIsAdjustmentModalOpen(false);
    setDeltaQty(0);
  };

  // Barcode scanned callback handler
  const handleProductScanned = (product: Product) => {
    if (scannerContext === 'inspect') {
      setIsScannerOpen(false);
      setSelectedDetailProduct(product);
    } else if (scannerContext === 'adjust') {
      setSelectedProductId(product.id);
      setIsScannerOpen(false);
      setIsAdjustmentModalOpen(true);
    } else if (scannerContext === 'count') {
      // Increment physical stock count for this SKU
      setCountItems((prev) => ({
        ...prev,
        [product.id]: (prev[product.id] || 0) + 1,
      }));
    }
  };

  // Build stock count items array with live variance calculations
  const stockCountRows: StockCountItem[] = products.map((prod) => {
    const sl = stockLevels.find(
      (s) => s.productId === prod.id && s.warehouseId === countWarehouseId
    );
    const expectedOnHand = sl ? sl.onHand : 0;
    const countedQuantity = countItems[prod.id] !== undefined ? countItems[prod.id] : expectedOnHand;
    const variance = countedQuantity - expectedOnHand;

    return {
      productId: prod.id,
      productName: prod.name,
      productCode: prod.code,
      barcode: prod.barcode,
      unit: prod.unit,
      expectedOnHand,
      countedQuantity,
      variance,
    };
  });

  // Post Physical Stock Count Reconciliations
  const handleCommitStockCount = () => {
    stockCountRows.forEach((row) => {
      if (row.variance !== 0) {
        adjustStock(
          row.productId,
          countWarehouseId,
          row.variance,
          `Stock Count Audit Reconciliation (${row.variance > 0 ? '+' : ''}${row.variance} ${row.unit})`
        );
      }
    });
    setCountCommitted(true);
    setTimeout(() => setCountCommitted(false), 4000);
  };

  // Filtered products calculation
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || prod.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header with Add Product, Camera Scan & Adjust CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-100">Inventory & Warehouses</h2>
          <p className="text-xs text-stone-400">Barcode stock management, physical audits & manual product master entry</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPickingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-900/60 to-emerald-900/60 hover:from-teal-850 hover:to-emerald-850 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold shadow-xs transition"
            title="Generate picking list for same-date orders"
          >
            <ClipboardList className="w-3.5 h-3.5 text-teal-400" />
            <span>Same-Date Picking List</span>
          </button>
          <button
            onClick={() => setIsAddProductOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 transition cursor-pointer"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>+ Add Product</span>
          </button>
          <button
            onClick={() => {
              setScannerContext('inspect');
              setIsScannerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 border border-stone-700/80 text-emerald-400 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Barcode</span>
          </button>
          <button
            onClick={() => {
              setLabelModalProduct(null);
              setIsLabelModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 border border-stone-700/80 text-emerald-400 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Generate & print QR and barcode labels"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Labels</span>
          </button>
          <button
            onClick={() => handleOpenAdjust()}
            className="flex items-center gap-1 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 border border-stone-700/80 text-stone-200 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust</span>
          </button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex p-1 bg-stone-900 border border-stone-800 rounded-xl text-xs">
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 'levels' ? 'bg-stone-800 text-emerald-400 shadow-xs' : 'text-stone-400'
          }`}
        >
          Stock on Hand ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('count')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 'count' ? 'bg-stone-800 text-emerald-400 shadow-xs' : 'text-stone-400'
          }`}
        >
          Stock Count Audit
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 'movements' ? 'bg-stone-800 text-emerald-400 shadow-xs' : 'text-stone-400'
          }`}
        >
          Ledger ({stockMovements.length})
        </button>
      </div>

      {/* 1. Stock Levels View */}
      {activeTab === 'levels' && (
        <div className="space-y-3">
          {/* Search & Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by SKU, name, barcode, or category..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-8 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-stone-500 hover:text-stone-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {categories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                      categoryFilter === cat
                        ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-800/80 border border-stone-700/50 text-stone-400 flex items-center justify-center mx-auto shadow-inner">
                <Package className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-200">
                  {products.length === 0 ? 'No Products in Catalog' : 'No Matching Products'}
                </h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                  {products.length === 0
                    ? 'Manually input your products, configure SKU codes, unit purchase/selling prices, tax rates, and warehouse opening stock.'
                    : `No product matching "${searchQuery}". Try a different keyword or reset filters.`}
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-1">
                {products.length === 0 ? (
                  <button
                    onClick={() => setIsAddProductOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <PackagePlus className="w-4 h-4" />
                    <span>+ Add First Product</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('All');
                    }}
                    className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs rounded-xl"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const levels = stockLevels.filter((sl) => sl.productId === prod.id);
              const totalOnHand = levels.reduce((s, sl) => s + sl.onHand, 0);
              const totalReserved = levels.reduce((s, sl) => s + sl.reserved, 0);
              const available = Math.max(0, totalOnHand - totalReserved);
              const isLowStock = totalOnHand <= prod.minStockLevel;
              const valuation = totalOnHand * prod.purchasePrice;
              const margin = prod.sellingPrice - prod.purchasePrice;
              const marginPct =
                prod.sellingPrice > 0
                  ? ((margin / prod.sellingPrice) * 100).toFixed(0)
                  : '0';

              return (
                <div
                  key={prod.id}
                  className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 shadow-xs hover:border-stone-700/80 transition"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailProduct(prod)}
                          className="font-bold text-sm text-stone-100 hover:text-emerald-400 transition text-left cursor-pointer flex items-center gap-1.5 group"
                        >
                          <span>{prod.name}</span>
                          <Eye className="w-3.5 h-3.5 text-stone-500 group-hover:text-emerald-400 transition" />
                        </button>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 border border-stone-700 font-medium">
                          {prod.category}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-bold">
                            Low Stock (≤{prod.minStockLevel})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono mt-1 flex-wrap">
                        <span className="text-emerald-400/90 font-semibold">{prod.code}</span>
                        <span>•</span>
                        <span>Barcode: {prod.barcode}</span>
                        <span>•</span>
                        <span>UoM: {prod.unit}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        {totalOnHand} {prod.unit}
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        Val: ${valuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Financial Metrics Strip & Trend Toggle */}
                  <div className="flex items-center justify-between text-[11px] px-3 py-1.5 bg-stone-950 rounded-xl border border-stone-800/80 text-stone-400 font-mono flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span>
                        Cost: <strong className="text-stone-200">${prod.purchasePrice.toFixed(2)}</strong>
                      </span>
                      <span>
                        Sell: <strong className="text-stone-200">${prod.sellingPrice.toFixed(2)}</strong>
                      </span>
                      <span className="text-emerald-400">
                        Margin: {marginPct}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                      <span>Tax: {prod.taxRatePercent}%</span>
                      <span>•</span>
                      <span>{prod.costingMethod}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTrendProductId(
                            expandedTrendProductId === prod.id ? null : prod.id
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-sans font-semibold transition cursor-pointer ${
                          expandedTrendProductId === prod.id
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
                        }`}
                        title="Toggle mini-line chart for purchase price trend"
                      >
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        <span>Trend</span>
                        {expandedTrendProductId === prod.id ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLabelModalProduct(prod);
                          setIsLabelModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-emerald-400 font-sans font-semibold transition cursor-pointer"
                        title="Print QR & barcode label for this product"
                      >
                        <QrCode className="w-3 h-3 text-emerald-400" />
                        <span>Label</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDetailProduct(prod)}
                        className="px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 text-stone-300 font-sans font-semibold transition cursor-pointer"
                        title="Open full product details & vendor cost trends"
                      >
                        Details
                      </button>
                      {deleteProduct && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete product master item "${prod.name}"?`)) {
                              deleteProduct(prod.id);
                            }
                          }}
                          className="text-stone-600 hover:text-red-400 transition ml-1 p-0.5"
                          title="Delete product"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Mini-Line Chart when toggled */}
                  {expandedTrendProductId === prod.id && (
                    <div className="animate-in fade-in zoom-in-98 duration-200">
                      <ProductPriceTrendChart
                        product={prod}
                        purchaseOrders={purchaseOrders}
                        stockMovements={stockMovements}
                        height={130}
                        compact={true}
                      />
                    </div>
                  )}

                  {/* Warehouse breakdown pills */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {warehouses.map((wh) => {
                      const l = levels.find((sl) => sl.warehouseId === wh.id);
                      const onHand = l?.onHand || 0;
                      return (
                        <div
                          key={wh.id}
                          className="bg-stone-950 p-2 rounded-xl border border-stone-800 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-stone-400 text-[10px] block">{wh.name}</span>
                            <span className="font-semibold text-stone-200">
                              {onHand} {prod.unit}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedProductId(prod.id);
                              setSelectedWarehouseId(wh.id);
                              setIsAdjustmentModalOpen(true);
                            }}
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 bg-stone-900 rounded-lg hover:bg-stone-800 transition"
                          >
                            Adjust
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. Physical Stock Count Cycle Mode */}
      {activeTab === 'count' && (
        <div className="space-y-4">
          <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                  Physical Stock Audit Session
                </h3>
                <p className="text-xs text-stone-400">
                  Scan physical barcodes with camera to increment count and detect variances
                </p>
              </div>

              <select
                value={countWarehouseId}
                onChange={(e) => setCountWarehouseId(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 font-medium"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Camera Count Action */}
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-200 font-semibold">
                  Continuous Barcode Scanner Mode
                </span>
              </div>
              <button
                onClick={() => {
                  setScannerContext('count');
                  setIsScannerOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                Start Camera Scan
              </button>
            </div>

            {countCommitted && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Physical count reconciliation posted successfully to immutable ledger!
              </div>
            )}
          </div>

          {/* Real-Time Variance Table */}
          <div className="space-y-2">
            {stockCountRows.map((row) => {
              const hasVariance = row.variance !== 0;
              const isSurplus = row.variance > 0;
              const isShortage = row.variance < 0;

              return (
                <div
                  key={row.productId}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between text-xs ${
                    hasVariance
                      ? isSurplus
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-red-950/30 border-red-500/40'
                      : 'bg-stone-900 border-stone-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-200">{row.productName}</span>
                      <span className="text-[10px] font-mono text-stone-400">({row.productCode})</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-1">
                      <span>Expected: <strong className="text-stone-300">{row.expectedOnHand}</strong> {row.unit}</span>
                      <span>•</span>
                      <span>Counted: <strong className="text-emerald-400">{row.countedQuantity}</strong> {row.unit}</span>
                      <span>•</span>
                      <span
                        className={`font-semibold font-mono ${
                          row.variance === 0
                            ? 'text-stone-400'
                            : isSurplus
                            ? 'text-amber-400'
                            : 'text-red-400'
                        }`}
                      >
                        Variance: {row.variance > 0 ? `+${row.variance}` : row.variance} {row.unit}
                      </span>
                    </div>
                  </div>

                  {/* Manual Quick Counter Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setCountItems((prev) => ({
                          ...prev,
                          [row.productId]: Math.max(0, (prev[row.productId] ?? row.expectedOnHand) - 1),
                        }))
                      }
                      className="w-7 h-7 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg flex items-center justify-center"
                    >
                      -1
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={row.countedQuantity}
                      onChange={(e) =>
                        setCountItems((prev) => ({
                          ...prev,
                          [row.productId]: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-14 bg-stone-950 border border-stone-700 rounded-lg p-1 text-center font-mono font-bold text-stone-200 text-xs"
                    />
                    <button
                      onClick={() =>
                        setCountItems((prev) => ({
                          ...prev,
                          [row.productId]: (prev[row.productId] ?? row.expectedOnHand) + 1,
                        }))
                      }
                      className="w-7 h-7 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg flex items-center justify-center"
                    >
                      +1
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Commit Reconciliations */}
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between">
            <span className="text-xs text-stone-400">
              Posting writes stock adjustments and updates immutable audit log.
            </span>
            <button
              onClick={handleCommitStockCount}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Post Count Reconciliations</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Movement Ledger View */}
      {activeTab === 'movements' && (
        <div className="space-y-2.5">
          {stockMovements.map((sm) => (
            <div
              key={sm.id}
              className="p-3 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-200">{sm.productName}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      sm.movementType === 'Receipt'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : sm.movementType === 'Delivery'
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {sm.movementType}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {sm.warehouseName} • By {sm.performedBy}
                </p>
                <p className="text-[10px] text-stone-500 font-mono">
                  Ref: {sm.referenceDocType} ({sm.referenceDocId}) • {sm.timestamp}
                </p>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <span
                  className={`text-sm font-bold font-mono ${
                    sm.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {sm.quantity > 0 ? `+${sm.quantity}` : sm.quantity} pcs
                </span>
                <button
                  onClick={() =>
                    setAuditModalMovement({
                      id: sm.id,
                      ref: sm.referenceDocId,
                      title: `Stock Movement (${sm.movementType} - ${sm.productName})`,
                    })
                  }
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-stone-800 text-stone-400 hover:text-stone-200 font-mono"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Audit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Adjustment Modal with Camera Barcode Scanner */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Adjust Stock Inventory</h3>
              </div>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scan Product with Camera */}
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-300 font-medium block">Scan Barcode to Select SKU</span>
                <span className="text-[10px] text-stone-500">Auto-fills product and checks warehouse levels</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setScannerContext('adjust');
                  setIsScannerOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-emerald-400 rounded-xl text-xs font-semibold"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan</span>
              </button>
            </div>

            {/* Product Selector */}
            <div>
              <label className="text-xs text-stone-400 block mb-1">Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Selector */}
            <div>
              <label className="text-xs text-stone-400 block mb-1">Warehouse Location</label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Stock vs New Stock Display */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-stone-950 rounded-2xl border border-stone-800 text-xs">
              <div>
                <span className="text-[10px] text-stone-500 block">Current On-Hand</span>
                <span className="font-bold text-stone-200 font-mono text-sm">
                  {currentWarehouseLevel?.onHand || 0} {selectedProduct?.unit}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">Resulting Stock</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {(currentWarehouseLevel?.onHand || 0) + deltaQty} {selectedProduct?.unit}
                </span>
              </div>
            </div>

            {/* Quantity Change Delta */}
            <div>
              <label className="text-xs text-stone-400 block mb-1">
                Adjustment Delta (+ / - quantity)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeltaQty((d) => d - 1)}
                  className="w-9 h-9 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold text-sm flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="number"
                  value={deltaQty}
                  onChange={(e) => setDeltaQty(parseInt(e.target.value) || 0)}
                  className="flex-1 bg-stone-950 border border-stone-800 rounded-xl p-2 text-center text-xs font-mono font-bold text-stone-200"
                />
                <button
                  type="button"
                  onClick={() => setDeltaQty((d) => d + 1)}
                  className="w-9 h-9 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold text-sm flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-xs text-stone-400 block mb-1">Audit Log Reason</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdjust}
                disabled={deltaQty === 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Post Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title={
          scannerContext === 'count'
            ? 'Stock Count Cycle Barcode Scanner'
            : scannerContext === 'adjust'
            ? 'Scan SKU to Adjust'
            : 'Inventory Barcode Inspection'
        }
        subtitle="Point camera at product SKU barcode"
        mode={scannerContext === 'count' ? 'count' : scannerContext === 'adjust' ? 'adjust' : 'lookup'}
        onProductFound={(product) => handleProductScanned(product)}
      />

      {/* Add Product Master Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onProductCreated={(newProd) => {
          setSelectedProductId(newProd.id);
        }}
      />

      {/* Product Detail & Vendor Cost Fluctuation Modal */}
      <ProductDetailModal
        isOpen={!!selectedDetailProduct}
        onClose={() => setSelectedDetailProduct(null)}
        product={selectedDetailProduct}
        warehouses={warehouses}
        stockLevels={stockLevels}
        purchaseOrders={purchaseOrders}
        stockMovements={stockMovements}
        onOpenAdjust={(prodId, whId) => handleOpenAdjust(prodId, whId)}
        onOpenPrintLabel={(prod) => {
          setSelectedDetailProduct(null);
          setLabelModalProduct(prod);
          setIsLabelModalOpen(true);
        }}
      />

      {/* Printable QR & Barcode Label Generator Modal */}
      <ProductBarcodeLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        initialProduct={labelModalProduct}
        products={products}
        warehouses={warehouses}
      />

      {/* Movement Audit Modal */}
      {auditModalMovement && (
        <DocumentAuditModal
          isOpen={true}
          onClose={() => setAuditModalMovement(null)}
          entityType="Stock"
          entityId={auditModalMovement.id}
          entityReference={auditModalMovement.ref}
          documentTitle={auditModalMovement.title}
        />
      )}

      {/* Same-Date Batch Picking List Modal */}
      <SameDatePickingListModal
        isOpen={isPickingModalOpen}
        onClose={() => setIsPickingModalOpen(false)}
        onOpenDeliveryNoteModal={(so: SalesOrder) => {
          const matchedDn = deliveryNotes.find((dn) => dn.salesOrderId === so.id);
          setSelectedDnForModal(matchedDn || null);
          setIsDeliveryNoteModalOpen(true);
        }}
        onPrintPickingList={(batch: SameDateBatchPickingList) => {
          setSelectedBatchForPdf(batch);
        }}
      />

      {/* Delivery Note Modal */}
      <DeliveryNoteModal
        isOpen={isDeliveryNoteModalOpen}
        onClose={() => {
          setIsDeliveryNoteModalOpen(false);
          setSelectedDnForModal(null);
        }}
        existingDeliveryNote={selectedDnForModal || undefined}
        onPrintDeliveryNote={(dn: DeliveryNote) => {
          setSelectedDnForPdf(dn);
        }}
      />

      {/* Printable Delivery Note Modal */}
      <PrintableDocumentModal
        isOpen={!!selectedDnForPdf}
        onClose={() => setSelectedDnForPdf(null)}
        documentType="delivery_note"
        deliveryNote={selectedDnForPdf}
      />

      {/* Printable Picking List Modal */}
      <PrintableDocumentModal
        isOpen={!!selectedBatchForPdf}
        onClose={() => setSelectedBatchForPdf(null)}
        documentType="picking_list"
        pickingList={selectedBatchForPdf}
      />
    </div>
  );
};
