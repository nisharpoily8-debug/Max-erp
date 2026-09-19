import React, { useState } from 'react';
import {
  X,
  PackagePlus,
  Barcode,
  Tag,
  DollarSign,
  Layers,
  Building,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Hash,
  Scale,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { Product } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (product: Product) => void;
}

const COMMON_CATEGORIES = [
  'Corrugated Boxes',
  'Packaging Tapes',
  'Protective Films',
  'Bubble & Cushioning',
  'Strapping & Edge',
  'Industrial Containers',
  'Shipping Envelopes',
  'Labels & Marking',
];

const COMMON_UNITS = ['pcs', 'box', 'roll', 'pack', 'kg', 'meter', 'set', 'pallet'];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated,
}) => {
  const { products, warehouses, addProduct } = useErp();

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState(COMMON_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [unit, setUnit] = useState('pcs');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('5.00');
  const [sellingPrice, setSellingPrice] = useState<string>('8.50');
  const [taxRatePercent, setTaxRatePercent] = useState<string>('8.25');
  const [minStockLevel, setMinStockLevel] = useState<string>('20');
  const [costingMethod, setCostingMethod] = useState<'FIFO' | 'Weighted Average' | 'Standard'>('FIFO');

  // Initial stock quantities by warehouse
  const [warehouseStock, setWarehouseStock] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    warehouses.forEach((w) => {
      initial[w.id] = '0';
    });
    return initial;
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  if (!isOpen) return null;

  // Auto-generate unique SKU Code
  const handleGenerateSku = () => {
    const catCode = (isCustomCategory ? customCategory : category)
      .replace(/[^a-zA-Z]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'ITM';
    const rand = Math.floor(1000 + Math.random() * 9000);
    const generated = `${catCode}-${rand}`;
    setCode(generated);
    if (errors.code) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.code;
        return next;
      });
    }
  };

  // Auto-generate standard EAN/UPC barcode
  const handleGenerateBarcode = () => {
    const prefix = '793'; // 3-digit mock company prefix
    const rand = Math.floor(100000000 + Math.random() * 900000000);
    setBarcode(`${prefix}${rand}`);
    if (errors.barcode) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.barcode;
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Product name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Product name must be at least 2 characters';
    }

    if (!code.trim()) {
      errs.code = 'Product SKU / Code is required';
    } else {
      const isDuplicate = products.some(
        (p) => p.code.trim().toLowerCase() === code.trim().toLowerCase()
      );
      if (isDuplicate) {
        errs.code = `SKU "${code}" is already in use by another product`;
      }
    }

    const buyPriceNum = parseFloat(purchasePrice);
    if (isNaN(buyPriceNum) || buyPriceNum < 0) {
      errs.purchasePrice = 'Purchase price must be a valid positive number';
    }

    const sellPriceNum = parseFloat(sellingPrice);
    if (isNaN(sellPriceNum) || sellPriceNum < 0) {
      errs.sellingPrice = 'Selling price must be a valid positive number';
    }

    const taxNum = parseFloat(taxRatePercent);
    if (isNaN(taxNum) || taxNum < 0 || taxNum > 100) {
      errs.taxRatePercent = 'Tax rate must be between 0% and 100%';
    }

    const minStockNum = parseInt(minStockLevel, 10);
    if (isNaN(minStockNum) || minStockNum < 0) {
      errs.minStockLevel = 'Minimum stock level must be 0 or higher';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const finalCategory = isCustomCategory ? customCategory.trim() || 'General' : category;
    const finalBarcode = barcode.trim() || `793${Math.floor(100000000 + Math.random() * 900000000)}`;

    const initialStockMap: Record<string, number> = {};
    Object.entries(warehouseStock).forEach(([whId, qtyStr]) => {
      const parsed = parseInt(qtyStr, 10);
      if (!isNaN(parsed) && parsed > 0) {
        initialStockMap[whId] = parsed;
      }
    });

    const newProd = addProduct(
      {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category: finalCategory,
        unit: unit.trim() || 'pcs',
        barcode: finalBarcode,
        description: description.trim() || `${finalCategory} - standard packaging stock item`,
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        taxRatePercent: parseFloat(taxRatePercent) || 0,
        minStockLevel: parseInt(minStockLevel, 10) || 0,
        costingMethod,
      },
      initialStockMap
    );

    setSuccessNotice(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onProductCreated) {
        onProductCreated(newProd);
      }
      onClose();
    }, 900);
  };

  // Calculations for preview badge
  const numBuy = parseFloat(purchasePrice) || 0;
  const numSell = parseFloat(sellingPrice) || 0;
  const profitMargin = numSell - numBuy;
  const marginPercent = numSell > 0 ? ((profitMargin / numSell) * 100).toFixed(1) : '0';

  const totalOpeningUnits = Object.values(warehouseStock).reduce((sum, val) => {
    const parsed = parseInt(val, 10);
    return sum + (isNaN(parsed) || parsed < 0 ? 0 : parsed);
  }, 0);
  const totalOpeningValuation = totalOpeningUnits * numBuy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-stone-900 text-stone-100 rounded-3xl shadow-2xl border border-stone-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-xs">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">Add New Product Master</h2>
              <p className="text-xs text-stone-400">
                Manually register inventory item, SKU, pricing & opening stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Item Identification */}
          <div className="space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
              1. Product Identification
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.name;
                        return n;
                      });
                    }
                  }}
                  placeholder="e.g., Heavy-Duty Double Wall Box 18x14x12"
                  className={`w-full bg-stone-950 border rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-hidden ${
                    errors.name
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-stone-800 focus:border-emerald-500'
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>

              {/* SKU / Code with Auto Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-300">
                    Product Code / SKU <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
                  >
                    <Sparkles className="w-2.5 h-2.5" /> Auto-Gen
                  </button>
                </div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    if (errors.code) {
                      setErrors((prev) => {
                        const n = { ...prev };
                        delete n.code;
                        return n;
                      });
                    }
                  }}
                  placeholder="e.g., BOX-1814-DW"
                  className={`w-full bg-stone-950 border rounded-xl px-3.5 py-2 text-xs text-stone-100 font-mono placeholder-stone-600 focus:outline-hidden ${
                    errors.code
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-stone-800 focus:border-emerald-500'
                  }`}
                />
                {errors.code && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.code}
                  </p>
                )}
              </div>

              {/* Barcode / UPC */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-300">Barcode / EAN-13</label>
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
                  >
                    <Barcode className="w-2.5 h-2.5" /> Auto-Gen
                  </button>
                </div>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g., 793849102419"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 font-mono placeholder-stone-600 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Category</label>
                {isCustomCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Custom category name..."
                      className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-hidden focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(false)}
                      className="px-2.5 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs"
                    >
                      Preset
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-hidden focus:border-emerald-500"
                    >
                      {COMMON_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCustomCategory(true)}
                      className="px-2.5 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs"
                    >
                      + Custom
                    </button>
                  </div>
                )}
              </div>

              {/* Unit of Measure */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Unit of Measure (UoM)
                </label>
                <div className="flex gap-2">
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-hidden focus:border-emerald-500 font-medium"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u} (Pieces/Units)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Description & Specifications
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Material specs, burst strength, dimensions, weight capacity..."
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 placeholder-stone-600 focus:outline-hidden focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing, Tax & Inventory Costing */}
          <div className="space-y-4 pt-2 border-t border-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                2. Pricing, Tax & Valuation
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                Spread: ${profitMargin.toFixed(2)} ({marginPercent}% Margin)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Purchase / Cost Price */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Purchase Cost ($) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                {errors.purchasePrice && (
                  <p className="text-[10px] text-red-400 mt-1">{errors.purchasePrice}</p>
                )}
              </div>

              {/* Selling Price */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Selling Price ($) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                {errors.sellingPrice && (
                  <p className="text-[10px] text-red-400 mt-1">{errors.sellingPrice}</p>
                )}
              </div>

              {/* Tax Rate % */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Sales Tax Rate %
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="100"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-emerald-500"
                />
                {errors.taxRatePercent && (
                  <p className="text-[10px] text-red-400 mt-1">{errors.taxRatePercent}</p>
                )}
              </div>

              {/* Min Stock Level */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Reorder Min Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(e.target.value)}
                  placeholder="e.g., 25"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Costing Method */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Inventory Costing Method
                </label>
                <div className="flex gap-2">
                  {(['FIFO', 'Weighted Average', 'Standard'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCostingMethod(m)}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                        costingMethod === m
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Initial Opening Stock Levels */}
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                3. Opening Stock on Hand (Optional)
              </span>
              <span className="text-xs text-stone-400">
                Total Opening: <strong className="text-stone-200 font-mono">{totalOpeningUnits} {unit}</strong>{' '}
                (${totalOpeningValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })})
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Input existing inventory quantity per warehouse. Opening stock entries generate matching ledger movements and audit logs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {warehouses.map((wh) => (
                <div
                  key={wh.id}
                  className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-200">{wh.name}</span>
                    <span className="text-[10px] font-mono text-stone-500">{wh.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={warehouseStock[wh.id] || '0'}
                      onChange={(e) =>
                        setWarehouseStock((prev) => ({
                          ...prev,
                          [wh.id]: e.target.value,
                        }))
                      }
                      className="w-full bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5 text-xs text-stone-100 font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                    <span className="text-xs font-mono text-stone-400 shrink-0">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-emerald-950 disabled:opacity-50"
            >
              {successNotice ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Product Registered!
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4" /> Save & Register Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
