import React, { useState } from 'react';
import {
  X,
  Package,
  Barcode,
  Tag,
  DollarSign,
  Layers,
  Building,
  TrendingUp,
  SlidersHorizontal,
  ShieldCheck,
  Calendar,
  Truck,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Receipt,
  Printer,
  QrCode,
} from 'lucide-react';
import { Product, Warehouse, StockLevel, PurchaseOrder, StockMovement } from '../types';
import { ProductPriceTrendChart } from './ProductPriceTrendChart';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  warehouses: Warehouse[];
  stockLevels: StockLevel[];
  purchaseOrders?: PurchaseOrder[];
  stockMovements?: StockMovement[];
  onOpenAdjust?: (productId: string, warehouseId?: string) => void;
  onOpenPrintLabel?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  warehouses,
  stockLevels,
  purchaseOrders = [],
  stockMovements = [],
  onOpenAdjust,
  onOpenPrintLabel,
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'stock' | 'specs'>('trends');

  if (!isOpen || !product) return null;

  const prodLevels = stockLevels.filter((sl) => sl.productId === product.id);
  const totalOnHand = prodLevels.reduce((acc, curr) => acc + curr.onHand, 0);
  const totalReserved = prodLevels.reduce((acc, curr) => acc + curr.reserved, 0);
  const totalAvailable = Math.max(0, totalOnHand - totalReserved);
  const isLowStock = totalOnHand <= product.minStockLevel;
  const valuation = totalOnHand * product.purchasePrice;
  const margin = product.sellingPrice - product.purchasePrice;
  const marginPct =
    product.sellingPrice > 0
      ? ((margin / product.sellingPrice) * 100).toFixed(1)
      : '0';

  // Filter movements for this product
  const relevantMovements = stockMovements
    .filter((m) => m.productId === product.id)
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-stone-900 text-stone-100 rounded-3xl shadow-2xl border border-stone-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-100">{product.name}</h2>
                {isLowStock && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-800 font-bold">
                    Low Stock
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-400 font-mono mt-0.5">
                <span className="text-emerald-400 font-semibold">{product.code}</span>
                <span>•</span>
                <span>Barcode: {product.barcode}</span>
                <span>•</span>
                <span>{product.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPrintLabel && (
              <button
                type="button"
                onClick={() => {
                  onOpenPrintLabel(product);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                title="Print Barcode & QR Label for this product"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Label</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-stone-800 px-6 bg-stone-950/40 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('trends')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'trends'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cost Trends & Fluctuation</span>
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'stock'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Warehouse Distribution ({totalOnHand} {product.unit})</span>
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'specs'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Pricing & Master Specs</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">
                Active Purchase Cost
              </span>
              <span className="text-base font-bold font-mono text-stone-100">
                ${product.purchasePrice.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">
                Selling Price
              </span>
              <span className="text-base font-bold font-mono text-emerald-400">
                ${product.sellingPrice.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">
                Gross Margin
              </span>
              <span className="text-base font-bold font-mono text-emerald-400">
                ${margin.toFixed(2)} ({marginPct}%)
              </span>
            </div>
            <div className="p-3 bg-stone-950 rounded-2xl border border-stone-800">
              <span className="text-[10px] text-stone-500 block uppercase font-semibold">
                Inventory Valuation
              </span>
              <span className="text-base font-bold font-mono text-stone-200">
                ${valuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* TAB 1: Cost Trends & Line Chart */}
          {activeTab === 'trends' && (
            <div className="space-y-4">
              {/* The Recharts Purchase Price Trend Chart */}
              <ProductPriceTrendChart
                product={product}
                purchaseOrders={purchaseOrders}
                stockMovements={stockMovements}
                height={200}
              />

              {/* Vendor Fluctuations Insight Note */}
              <div className="p-3.5 bg-stone-950 rounded-2xl border border-stone-800 text-xs text-stone-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-stone-200">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cost Volatility & Procurement Strategy</span>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Vendor purchase prices reflect recorded purchase orders, goods receipts, and master standard costs. Use this trend to detect supplier inflation, negotiate bulk quantity tiers, or adjust retail selling prices to preserve target margins.
                </p>
              </div>

              {/* Recent Receipt / Cost Events */}
              {relevantMovements.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                    Recent Stock Cost Events
                  </span>
                  <div className="bg-stone-950 border border-stone-800 rounded-2xl divide-y divide-stone-800 text-xs">
                    {relevantMovements.map((m) => (
                      <div key={m.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-200">
                              {m.movementType} ({m.quantity > 0 ? `+${m.quantity}` : m.quantity}{' '}
                              {product.unit})
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">
                              {m.referenceDocId}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500 block">
                            {m.warehouseName} • {m.timestamp}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-stone-200 block">
                            ${m.unitCost.toFixed(2)} / {product.unit}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            By {m.performedBy}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Warehouse Stock Breakdown */}
          {activeTab === 'stock' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300">
                  Stock on Hand by Facility
                </span>
                {onOpenAdjust && (
                  <button
                    onClick={() => {
                      onOpenAdjust(product.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Adjust Stock</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {warehouses.map((wh) => {
                  const sl = prodLevels.find((l) => l.warehouseId === wh.id);
                  const onHand = sl?.onHand || 0;
                  const reserved = sl?.reserved || 0;
                  const available = Math.max(0, onHand - reserved);

                  return (
                    <div
                      key={wh.id}
                      className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-200 text-xs">{wh.name}</span>
                        <span className="text-[10px] font-mono text-stone-500">{wh.code}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-stone-900">
                        <div>
                          <span className="text-[10px] text-stone-500 block">On Hand</span>
                          <span className="font-bold font-mono text-stone-200">
                            {onHand} {product.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 block">Reserved</span>
                          <span className="font-bold font-mono text-amber-400">
                            {reserved} {product.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 block">Available</span>
                          <span className="font-bold font-mono text-emerald-400">
                            {available} {product.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Pricing & Master Specs */}
          {activeTab === 'specs' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-3">
                <h4 className="font-bold text-stone-200">Catalog & Accounting Parameters</h4>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-semibold">
                      Category
                    </span>
                    <span className="text-stone-200 font-medium">{product.category}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-semibold">
                      Unit of Measure
                    </span>
                    <span className="text-stone-200 font-medium">{product.unit}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-semibold">
                      Costing Method
                    </span>
                    <span className="text-emerald-400 font-semibold font-mono">
                      {product.costingMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-semibold">
                      Sales Tax Rate
                    </span>
                    <span className="text-stone-200 font-mono">{product.taxRatePercent}%</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-semibold">
                      Reorder Threshold
                    </span>
                    <span className="text-stone-200 font-mono">
                      {product.minStockLevel} {product.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[10px] uppercase font-semibold">
                      Barcode Format
                    </span>
                    <span className="text-stone-200 font-mono">{product.barcode} (EAN-13)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-1.5">
                <span className="text-stone-500 block text-[10px] uppercase font-semibold">
                  Product Description / Specifications
                </span>
                <p className="text-stone-300 leading-relaxed">
                  {product.description || 'Standard catalog stock item.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-stone-800 bg-stone-950/60 text-xs">
          <span className="text-stone-500">
            Product ID: <span className="font-mono text-stone-400">{product.id}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-xl font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
