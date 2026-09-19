import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Barcode,
  QrCode,
  Download,
  Copy,
  Layers,
  Settings2,
  CheckCircle2,
  Tag,
  Package,
  Sparkles,
  Sliders,
  FileSpreadsheet,
} from 'lucide-react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Product, Warehouse } from '../types';
import { useErp } from '../context/ErpContext';

interface ProductBarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
  products: Product[];
  warehouses: Warehouse[];
}

export type LabelType = 'barcode' | 'qr' | 'both';
export type LabelSizePreset = 'bin-tag' | 'retail-tag' | 'compact-strip' | 'shipping-carton' | 'avery-5160';

interface LabelPresetConfig {
  name: string;
  dimensions: string;
  widthMm: number;
  heightMm: number;
  description: string;
}

const PRESET_CONFIGS: Record<LabelSizePreset, LabelPresetConfig> = {
  'bin-tag': {
    name: 'Warehouse Bin Tag',
    dimensions: '3" × 2" (76mm × 51mm)',
    widthMm: 76,
    heightMm: 51,
    description: 'Racks, shelves, storage totes, and inventory bins',
  },
  'retail-tag': {
    name: 'Retail Price Label',
    dimensions: '2" × 1.25" (50mm × 32mm)',
    widthMm: 50,
    heightMm: 32,
    description: 'Product packaging, hang tags, and customer shelves',
  },
  'compact-strip': {
    name: 'Compact Shelf Strip',
    dimensions: '1.5" × 1" (38mm × 25mm)',
    widthMm: 38,
    heightMm: 25,
    description: 'Small parts drawers, slim shelf channels, and vials',
  },
  'shipping-carton': {
    name: 'Logistics Carton Tag',
    dimensions: '4" × 3" (102mm × 76mm)',
    widthMm: 102,
    heightMm: 76,
    description: 'Outer cartons, master cartons, and pallet loads',
  },
  'avery-5160': {
    name: 'Avery 5160 Standard Sheet',
    dimensions: '2.625" × 1" (30 labels/page)',
    widthMm: 66.7,
    heightMm: 25.4,
    description: 'Letter-sized 3-column adhesive sticker sheet',
  },
};

export const ProductBarcodeLabelModal: React.FC<ProductBarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  initialProduct,
  products,
  warehouses,
}) => {
  const { company, stockLevels } = useErp();

  // Selected product(s)
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || products[0]?.id || ''
  );
  const [labelMode, setLabelMode] = useState<'single' | 'batch'>('single');
  const [batchCategoryFilter, setBatchCategoryFilter] = useState<string>('all');

  // Label formatting
  const [labelType, setLabelType] = useState<LabelType>('both');
  const [preset, setPreset] = useState<LabelSizePreset>('bin-tag');
  const [copies, setCopies] = useState<number>(1);

  // Content customizer toggles
  const [showCompany, setShowCompany] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showUom, setShowUom] = useState(true);
  const [showDate, setShowDate] = useState(false);
  const [customSubtitle, setCustomSubtitle] = useState('');

  // QR Code data URLs cache
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});

  // SVG references for JsBarcode
  const barcodeRefs = useRef<Map<string, SVGSVGElement>>(new Map());

  // Update initial product when modal opens
  useEffect(() => {
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [initialProduct, products]);

  // Target product list
  const activeProducts = React.useMemo(() => {
    if (labelMode === 'single') {
      const prod = products.find((p) => p.id === selectedProductId);
      return prod ? [prod] : [];
    } else {
      if (batchCategoryFilter === 'all') return products;
      return products.filter((p) => p.category === batchCategoryFilter);
    }
  }, [labelMode, selectedProductId, batchCategoryFilter, products]);

  // Generate QR Codes
  useEffect(() => {
    if (!isOpen) return;

    activeProducts.forEach((prod) => {
      const qrPayload = JSON.stringify({
        sku: prod.code,
        name: prod.name,
        barcode: prod.barcode,
        price: prod.sellingPrice,
        category: prod.category,
      });

      QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 200,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => {
          setQrCodeDataUrls((prev) => ({ ...prev, [prod.id]: url }));
        })
        .catch((err) => {
          console.error('QR code generation error:', err);
        });
    });
  }, [isOpen, activeProducts]);

  // Render Barcodes via JsBarcode
  useEffect(() => {
    if (!isOpen || (labelType !== 'barcode' && labelType !== 'both')) return;

    // Small delay to ensure SVG elements are mounted
    const timer = setTimeout(() => {
      activeProducts.forEach((prod) => {
        const svgEl = barcodeRefs.current.get(prod.id);
        if (svgEl) {
          try {
            JsBarcode(svgEl, prod.barcode || prod.code, {
              format: 'CODE128',
              lineColor: '#000000',
              width: preset === 'compact-strip' ? 1.4 : 1.8,
              height: preset === 'compact-strip' ? 24 : preset === 'bin-tag' ? 44 : 34,
              displayValue: true,
              fontSize: 10,
              font: 'monospace',
              textMargin: 2,
              margin: 4,
              background: '#ffffff',
            });
          } catch (e) {
            console.warn(`JsBarcode fallback for ${prod.barcode}:`, e);
          }
        }
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, activeProducts, labelType, preset, copies]);

  if (!isOpen) return null;

  const currentSelectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Calculate total stock on hand for selected product to offer "match stock" copy count
  const currentTotalStock = currentSelectedProduct
    ? stockLevels
        .filter((sl) => sl.productId === currentSelectedProduct.id)
        .reduce((sum, sl) => sum + sl.onHand, 0)
    : 0;

  // Handle browser print
  const handlePrint = () => {
    window.print();
  };

  // Generate label items list based on copies
  const allLabelItems: Product[] = [];
  activeProducts.forEach((prod) => {
    const count = labelMode === 'single' ? copies : 1;
    for (let i = 0; i < count; i++) {
      allLabelItems.push(prod);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs">
      {/* Dynamic Print CSS injected to format clean printable sheets */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #nexa-printable-labels, #nexa-printable-labels * {
            visibility: visible;
          }
          #nexa-printable-labels {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
            color: black !important;
          }
          @page {
            margin: 8mm;
            size: auto;
          }
          .print-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-stone-100">
        {/* Modal Top Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <span>Print QR & Barcode Labels</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono">
                  Thermal & Laser Ready
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                Generate high-contrast scannable labels for warehouse bins, shelves & retail packaging
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {allLabelItems.length} {allLabelItems.length === 1 ? 'Label' : 'Labels'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Body - 2 Columns (Controls on Left, Live Preview on Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-stone-800">
          {/* Controls Column (5 cols) */}
          <div className="md:col-span-5 p-4 space-y-4 bg-stone-950/30 text-xs">
            {/* Scope Switcher */}
            <div>
              <label className="text-stone-400 font-semibold block mb-1.5">Label Print Scope</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLabelMode('single')}
                  className={`py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    labelMode === 'single'
                      ? 'bg-stone-800 text-emerald-400 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Single Product
                </button>
                <button
                  type="button"
                  onClick={() => setLabelMode('batch')}
                  className={`py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    labelMode === 'batch'
                      ? 'bg-stone-800 text-emerald-400 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Catalog Batch ({products.length})
                </button>
              </div>
            </div>

            {/* Product Selector (when in single mode) */}
            {labelMode === 'single' ? (
              <div>
                <label className="text-stone-400 font-semibold block mb-1.5">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-hidden focus:border-emerald-500 font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) - ${p.sellingPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-stone-400 font-semibold block mb-1.5">Filter by Category</label>
                <select
                  value={batchCategoryFilter}
                  onChange={(e) => setBatchCategoryFilter(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="all">All Categories ({products.length} SKUs)</option>
                  {Array.from(new Set(products.map((p) => p.category))).map((c) => (
                    <option key={c} value={c}>
                      {c} ({products.filter((p) => p.category === c).length} SKUs)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Symbology Type Selector */}
            <div>
              <label className="text-stone-400 font-semibold block mb-1.5">Symbology Format</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLabelType('both')}
                  className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                    labelType === 'both'
                      ? 'bg-stone-800 text-emerald-400 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Dual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLabelType('barcode')}
                  className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                    labelType === 'barcode'
                      ? 'bg-stone-800 text-emerald-400 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Barcode className="w-3 h-3" />
                  <span>Barcode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLabelType('qr')}
                  className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                    labelType === 'qr'
                      ? 'bg-stone-800 text-emerald-400 shadow-xs'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <QrCode className="w-3 h-3" />
                  <span>QR Code</span>
                </button>
              </div>
            </div>

            {/* Label Size & Layout Preset */}
            <div>
              <label className="text-stone-400 font-semibold block mb-1.5">Label Size / Form Factor</label>
              <div className="space-y-1.5">
                {(Object.keys(PRESET_CONFIGS) as LabelSizePreset[]).map((key) => {
                  const cfg = PRESET_CONFIGS[key];
                  const isSelected = preset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPreset(key)}
                      className={`w-full text-left p-2 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-stone-850 border-emerald-500/50 text-stone-100'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-stone-200 text-xs">
                          {cfg.name}
                        </span>
                        <span className="text-[10px] text-stone-500 block">
                          {cfg.dimensions} • {cfg.description}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Copies Count (Single Mode) */}
            {labelMode === 'single' && (
              <div className="p-3 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-stone-400 font-semibold">Print Quantity / Copies</label>
                  <span className="font-bold font-mono text-emerald-400">{copies} copies</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={copies}
                    onChange={(e) => setCopies(Number(e.target.value))}
                    className="flex-1 accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
                    className="w-14 bg-stone-950 border border-stone-800 rounded-lg px-2 py-1 text-center font-mono text-xs text-stone-200"
                  />
                </div>
                {currentTotalStock > 0 && (
                  <button
                    type="button"
                    onClick={() => setCopies(currentTotalStock)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <span>Match current on-hand inventory ({currentTotalStock} units)</span>
                  </button>
                )}
              </div>
            )}

            {/* Label Elements Customizer Toggles */}
            <div className="p-3 bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
              <span className="text-stone-400 font-semibold block text-xs">Included Elements</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={showCompany}
                    onChange={(e) => setShowCompany(e.target.checked)}
                    className="rounded-xs accent-emerald-500"
                  />
                  <span>Company Header</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="rounded-xs accent-emerald-500"
                  />
                  <span>Selling Price ($)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={showSku}
                    onChange={(e) => setShowSku(e.target.checked)}
                    className="rounded-xs accent-emerald-500"
                  />
                  <span>SKU / Item Code</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={showCategory}
                    onChange={(e) => setShowCategory(e.target.checked)}
                    className="rounded-xs accent-emerald-500"
                  />
                  <span>Category Tag</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={showUom}
                    onChange={(e) => setShowUom(e.target.checked)}
                    className="rounded-xs accent-emerald-500"
                  />
                  <span>Unit of Measure</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={showDate}
                    onChange={(e) => setShowDate(e.target.checked)}
                    className="rounded-xs accent-emerald-500"
                  />
                  <span>Date / Batch Timestamp</span>
                </label>
              </div>

              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Optional custom text (e.g., Bin A-12, Fragile)"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-[11px] text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Column (7 cols) */}
          <div className="md:col-span-7 p-4 bg-stone-950 flex flex-col space-y-3 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="font-bold text-stone-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Sheet Print Preview ({allLabelItems.length} total stickers)</span>
              </span>
              <span className="text-[11px] font-mono text-stone-500">
                {PRESET_CONFIGS[preset].dimensions}
              </span>
            </div>

            {/* Scrollable Preview Canvas Container */}
            <div className="flex-1 overflow-y-auto p-4 bg-stone-900/60 border border-stone-800 rounded-2xl flex flex-col items-center">
              {/* PRINTABLE CONTAINER (This ID is targeted by the @media print rules) */}
              <div
                id="nexa-printable-labels"
                className={`w-full max-w-full gap-3 justify-center ${
                  preset === 'avery-5160'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'flex flex-wrap'
                }`}
              >
                {allLabelItems.map((prod, index) => {
                  const qrUrl = qrCodeDataUrls[prod.id];
                  const uniqueKey = `${prod.id}-${index}`;

                  return (
                    <div
                      key={uniqueKey}
                      className={`print-avoid-break bg-white text-black rounded-lg border border-stone-300 shadow-md p-2.5 flex flex-col justify-between overflow-hidden ${
                        preset === 'bin-tag'
                          ? 'w-[280px] min-h-[175px]'
                          : preset === 'retail-tag'
                          ? 'w-[240px] min-h-[145px]'
                          : preset === 'compact-strip'
                          ? 'w-[210px] min-h-[110px]'
                          : preset === 'shipping-carton'
                          ? 'w-[340px] min-h-[220px]'
                          : 'w-full min-h-[115px]'
                      }`}
                    >
                      {/* Label Top Bar */}
                      <div>
                        {showCompany && (
                          <div className="flex items-center justify-between border-b border-black/15 pb-1 mb-1.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-black">
                              {company.name}
                            </span>
                            <span className="text-[8px] font-mono font-semibold text-stone-600">
                              {showDate ? new Date().toLocaleDateString() : 'INVENTORY ASSET'}
                            </span>
                          </div>
                        )}

                        {/* Product Title & Category */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="leading-tight">
                            <span className="font-extrabold text-xs text-black block tracking-tight">
                              {prod.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-stone-700 mt-0.5">
                              {showSku && <span className="font-bold">{prod.code}</span>}
                              {showSku && showCategory && <span>•</span>}
                              {showCategory && <span>{prod.category}</span>}
                              {showUom && <span>({prod.unit})</span>}
                            </div>
                          </div>

                          {showPrice && (
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black font-mono text-black">
                                ${prod.sellingPrice.toFixed(2)}
                              </span>
                              <span className="text-[7px] block uppercase text-stone-600 font-bold">
                                MSRP/Unit
                              </span>
                            </div>
                          )}
                        </div>

                        {customSubtitle && (
                          <div className="mt-1 text-[8px] font-bold text-stone-800 bg-stone-100 px-1 py-0.5 rounded-sm inline-block">
                            {customSubtitle}
                          </div>
                        )}
                      </div>

                      {/* Barcode & QR Code Center Section */}
                      <div className="my-1.5 flex items-center justify-between gap-2">
                        {/* Linear Barcode */}
                        {(labelType === 'barcode' || labelType === 'both') && (
                          <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                            <svg
                              ref={(el) => {
                                if (el) barcodeRefs.current.set(prod.id, el);
                              }}
                              className="max-w-full h-auto"
                            />
                          </div>
                        )}

                        {/* 2D QR Code */}
                        {(labelType === 'qr' || labelType === 'both') && (
                          <div className="shrink-0 flex flex-col items-center">
                            {qrUrl ? (
                              <img
                                src={qrUrl}
                                alt={`QR Code for ${prod.code}`}
                                className={`object-contain rounded-xs border border-stone-200 ${
                                  preset === 'compact-strip'
                                    ? 'w-12 h-12'
                                    : preset === 'bin-tag'
                                    ? 'w-16 h-16'
                                    : preset === 'shipping-carton'
                                    ? 'w-20 h-20'
                                    : 'w-14 h-14'
                                }`}
                              />
                            ) : (
                              <div className="w-14 h-14 bg-stone-100 flex items-center justify-center text-[8px] text-stone-400">
                                QR
                              </div>
                            )}
                            <span className="text-[7px] font-mono text-stone-500 mt-0.5 font-bold">
                              SCAN SKU
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Label Bottom Footer */}
                      <div className="pt-1 border-t border-black/10 flex items-center justify-between text-[8px] font-mono text-stone-600">
                        <span>Barcode: {prod.barcode}</span>
                        <span>{prod.costingMethod}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-2.5 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  High-contrast black & white vectors optimized for Zebra, Dymo, Brother, and standard laser printers.
                </span>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-950/40 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Labels</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
