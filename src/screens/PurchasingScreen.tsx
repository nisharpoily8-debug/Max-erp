import React, { useState } from 'react';
import {
  Truck,
  Plus,
  PackageCheck,
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
  X,
  Trash2,
  UserCheck,
  Camera,
  Barcode,
  ShieldCheck,
  Building,
  AlertCircle,
  Printer,
  Scale,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { PurchaseOrder, OrderLineItem, Product, VendorBill } from '../types';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { DocumentAuditModal } from '../components/DocumentAuditModal';
import { PrintableDocumentModal } from '../components/PrintableDocumentModal';
import { VendorCostComparisonModal } from '../components/VendorCostComparisonModal';
import { PurchaseBillScannerModal } from '../components/PurchaseBillScannerModal';
import { VendorBillDetailModal } from '../components/VendorBillDetailModal';
import { VendorBillsList } from '../components/VendorBillsList';
import { VendorBillPaymentModal } from '../components/VendorBillPaymentModal';

export const PurchasingScreen: React.FC = () => {
  const {
    purchaseOrders,
    partners,
    products,
    warehouses,
    stockLevels,
    currentUser,
    currentBranch,
    createPurchaseOrder,
    approvePurchaseOrder,
    receiveGoods,
    vendorBills,
    recordPayment,
    accounts,
  } = useErp();

  // Active Tab: POs vs Vendor Bills & Scanned Invoices
  const [activePurchasingTab, setActivePurchasingTab] = useState<'po' | 'bills'>('po');

  // Purchase Bill Scanner State
  const [isBillScannerOpen, setIsBillScannerOpen] = useState(false);
  const [billScannerPoId, setBillScannerPoId] = useState<string | undefined>(undefined);
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<VendorBill | null>(null);
  const [paymentBillTarget, setPaymentBillTarget] = useState<VendorBill | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(
    partners.find((p) => p.type === 'vendor' || p.type === 'both')?.id || ''
  );
  const [poLines, setPoLines] = useState<
    { productId: string; quantity: number; customUnitPrice?: number }[]
  >([{ productId: products[0]?.id || '', quantity: 10 }]);
  const [notes, setNotes] = useState('');

  // Vendor Cost Comparison Modal State
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [comparisonProductId, setComparisonProductId] = useState<string | undefined>(undefined);

  // Barcode Scanner in PO Creation
  const [isPoScannerOpen, setIsPoScannerOpen] = useState(false);

  // Goods Receipt Modal State
  const [receivingPo, setReceivingPo] = useState<PurchaseOrder | null>(null);
  const [receiptWarehouseId, setReceiptWarehouseId] = useState(warehouses[0]?.id || '');
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);

  // Document Audit Modal State
  const [auditModalDoc, setAuditModalDoc] = useState<{
    id: string;
    ref: string;
    title: string;
    entityType?: 'PurchaseOrder' | 'VendorBill';
  } | null>(null);
  const [selectedPoForPdf, setSelectedPoForPdf] = useState<PurchaseOrder | null>(null);

  const vendors = partners.filter((p) => p.type === 'vendor' || p.type === 'both');

  const handleOpenComparison = (productId?: string) => {
    setComparisonProductId(productId || products[0]?.id);
    setIsComparisonModalOpen(true);
  };

  const handleSelectDeal = (
    vendorId: string,
    productId: string,
    unitPrice: number,
    suggestedQty: number
  ) => {
    setSelectedVendorId(vendorId);
    setPoLines([
      {
        productId,
        quantity: suggestedQty > 0 ? suggestedQty : 10,
        customUnitPrice: unitPrice,
      },
    ]);
    setIsCreateModalOpen(true);
  };

  const handleAddLine = (productId?: string) => {
    const id = productId || products[0]?.id || '';
    const prod = products.find((p) => p.id === id);
    setPoLines((prev) => [
      ...prev,
      { productId: id, quantity: 10, customUnitPrice: prod?.purchasePrice },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setPoLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRecordBillPayment = (bill: VendorBill) => {
    setPaymentBillTarget(bill);
  };

  const handleConfirmBillPayment = (
    bill: VendorBill,
    amount: number,
    method: 'Bank Transfer' | 'Cash' | 'Credit Card' | 'Cheque',
    accountId: string
  ) => {
    recordPayment({
      date: new Date().toISOString().split('T')[0],
      type: 'Vendor Payment',
      partnerId: bill.vendorId,
      partnerName: bill.vendorName,
      amount,
      paymentMethod: method,
      bankAccountId: accountId,
      billId: bill.id,
      referenceNotes: `Settlement for Vendor Bill ${bill.billNumber} (${bill.vendorName})`,
    });
  };

  const handleViewBillAudit = (bill: VendorBill) => {
    setAuditModalDoc({
      id: bill.id,
      ref: bill.billNumber,
      title: `Vendor Bill ${bill.billNumber} (${bill.vendorName})`,
    });
  };

  const handleBillCreated = (newBill: VendorBill) => {
    setActivePurchasingTab('bills');
    setSelectedBillForDetail(newBill);
  };

  // Pre-fill from scanned barcode during PO creation
  const handleProductScannedForPo = (product: Product) => {
    setPoLines((prev) => {
      const existing = prev.findIndex((l) => l.productId === product.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing].quantity += 5;
        return copy;
      }
      return [
        ...prev,
        { productId: product.id, quantity: 10, customUnitPrice: product.purchasePrice },
      ];
    });
    setIsPoScannerOpen(false);
  };

  const handleSavePO = () => {
    const vendor = vendors.find((v) => v.id === selectedVendorId);
    if (!vendor) return;

    let subtotal = 0;
    const validLines: OrderLineItem[] = [];
    for (let idx = 0; idx < poLines.length; idx++) {
      const line = poLines[idx];
      const prod = products.find((p) => p.id === line.productId);
      if (!prod) continue;
      const unitPrice =
        line.customUnitPrice !== undefined ? line.customUnitPrice : prod.purchasePrice;
      const cost = unitPrice * line.quantity;
      subtotal += cost;
      validLines.push({
        id: `pol-${Date.now()}-${idx}`,
        productId: prod.id,
        productName: prod.name,
        productCode: prod.code,
        quantity: line.quantity,
        unitPrice,
        discountPercent: 0,
        taxPercent: 0,
        lineTotal: cost,
      });
    }

    if (validLines.length === 0) return;
    const lines = validLines;

    const requiresApproval = subtotal > currentUser.approvalLimit;

    createPurchaseOrder({
      vendorId: vendor.id,
      vendorName: vendor.name,
      branchId: currentBranch.id,
      officerId: currentUser.id,
      officerName: currentUser.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedArrivalDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: requiresApproval ? 'Pending Approval' : 'Ordered',
      lines,
      subtotal,
      taxAmount: 0,
      totalAmount: subtotal,
      requiresApproval,
      approvedBy: requiresApproval ? undefined : currentUser.name,
      notes,
    });

    setIsCreateModalOpen(false);
    setPoLines([{ productId: products[0]?.id || '', quantity: 10 }]);
    setNotes('');
  };

  // Open Interactive Goods Receipt Dialog
  const handleStartReceive = (po: PurchaseOrder) => {
    setReceivingPo(po);
    setReceiptWarehouseId(warehouses[0]?.id || '');
    // Initialise received quantities with expected quantities
    const initialMap: Record<string, number> = {};
    po.lines.forEach((line) => {
      initialMap[line.productId] = line.quantity;
    });
    setReceivedQuantities(initialMap);
  };

  // Process scanned barcode during goods receipt
  const handleGoodsReceiptScan = (product: Product) => {
    if (!receivingPo) return;
    const isPartOfPo = receivingPo.lines.some((l) => l.productId === product.id);
    if (isPartOfPo) {
      setReceivedQuantities((prev) => ({
        ...prev,
        [product.id]: (prev[product.id] || 0) + 1,
      }));
    }
  };

  const handleConfirmGoodsReceipt = () => {
    if (!receivingPo) return;
    receiveGoods(receivingPo.id, receiptWarehouseId);
    setReceivingPo(null);
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-100">Purchasing & Payables</h2>
          <p className="text-xs text-stone-400">
            Vendor procurement, camera bill scanner, price comparisons & audit trails
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setBillScannerPoId(undefined);
              setIsBillScannerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition"
            title="Scan paper bill or upload PDF / JPEG invoice"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Bill (PDF/JPEG)</span>
          </button>
          <button
            onClick={() => handleOpenComparison()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700/80 rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>Compare Vendor Deals</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New PO</span>
          </button>
        </div>
      </div>

      {/* Subtabs: Purchase Orders vs Vendor Bills & Scanned Invoices */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-1">
        <button
          onClick={() => setActivePurchasingTab('po')}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activePurchasingTab === 'po'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Purchase Orders</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
            {purchaseOrders.length}
          </span>
        </button>
        <button
          onClick={() => setActivePurchasingTab('bills')}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activePurchasingTab === 'bills'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Vendor Bills & Scanned Invoices</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
            {vendorBills.length}
          </span>
        </button>
      </div>

      {activePurchasingTab === 'bills' ? (
        <VendorBillsList
          bills={vendorBills}
          onOpenScanner={() => {
            setBillScannerPoId(undefined);
            setIsBillScannerOpen(true);
          }}
          onViewDetail={(b) => setSelectedBillForDetail(b)}
          onRecordPayment={(b) => handleRecordBillPayment(b)}
          onViewAudit={(b) => handleViewBillAudit(b)}
        />
      ) : (
        /* PO List */
        <div className="space-y-3">
        {purchaseOrders.map((po) => {
          const isPending = po.status === 'Pending Approval';
          const isOrdered = po.status === 'Ordered';
          const isReceived = po.status === 'Goods Received';

          const canApprove =
            (currentUser.role === 'Manager' || currentUser.role === 'Administrator') &&
            isPending &&
            po.totalAmount <= currentUser.approvalLimit;

          const canReceive =
            (isOrdered || isPending) &&
            (currentUser.role === 'Warehouse User' ||
              currentUser.role === 'Manager' ||
              currentUser.role === 'Administrator');

          return (
            <div
              key={po.id}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 shadow-xs"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-mono text-stone-100">{po.poNumber}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isReceived
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isPending
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-stone-300 mt-1">{po.vendorName}</h3>
                  <p className="text-[11px] text-stone-500">
                    Buyer: {po.officerName} • Order Date: {po.orderDate}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-stone-100">
                    ${po.totalAmount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-500 block">
                    ETA: {po.expectedArrivalDate}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="bg-stone-950/60 rounded-xl p-2.5 divide-y divide-stone-800/80 text-xs">
                {po.lines.map((line) => (
                  <div key={line.id} className="py-1 flex items-center justify-between text-stone-300">
                    <div>
                      <span className="font-medium">{line.quantity} pcs {line.productName}</span>
                      <span className="text-[10px] text-stone-500 block font-mono">SKU: {line.productCode}</span>
                    </div>
                    <span className="font-mono text-stone-400">${line.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Actions & Audit Button */}
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[11px] text-stone-400">
                  <button
                    onClick={() => setSelectedPoForPdf(po)}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-stone-850 hover:bg-stone-800 text-teal-400 border border-teal-500/30 font-mono transition"
                    title="Print / PDF Official Purchase Order"
                  >
                    <Printer className="w-3 h-3" />
                    PO PDF
                  </button>

                  <button
                    onClick={() => {
                      const firstItem = po.lines[0];
                      handleOpenComparison(firstItem?.productId);
                    }}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-stone-850 hover:bg-stone-800 text-sky-400 border border-sky-500/30 font-mono transition"
                    title="Compare historical vendor costs for products in this PO"
                  >
                    <Scale className="w-3 h-3" />
                    Vendor Deals
                  </button>

                  <button
                    onClick={() =>
                      setAuditModalDoc({
                        id: po.id,
                        ref: po.poNumber,
                        title: `Purchase Order ${po.poNumber} (${po.vendorName})`,
                      })
                    }
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 text-stone-300 font-mono transition"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Audit Trail
                  </button>

                  {po.approvedBy ? (
                    <span className="text-emerald-400">Approved by {po.approvedBy}</span>
                  ) : (
                    <span className="text-amber-400">Requires PO approval</span>
                  )}
                </div>

                <div className="flex gap-2">
                  {canApprove && (
                    <button
                      onClick={() => approvePurchaseOrder(po.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}

                  {canReceive && (
                    <button
                      onClick={() => handleStartReceive(po)}
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                    >
                      <PackageCheck className="w-3.5 h-3.5" /> Receive Stock
                    </button>
                  )}

                  {isReceived && (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Stock Ingested
                    </span>
                  )}

                  {/* Quick Scan Bill for this PO */}
                  {(isOrdered || isReceived) && (
                    <button
                      onClick={() => {
                        setBillScannerPoId(po.id);
                        setIsBillScannerOpen(true);
                      }}
                      className="px-2.5 py-1 bg-stone-850 hover:bg-stone-800 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                      title="Scan incoming vendor bill/invoice for this PO"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scan Bill</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Create PO Modal with Camera Barcode Scanner */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Create Purchase Order (RFQ)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vendor Select */}
            <div>
              <label className="text-xs text-stone-400 block mb-1 font-medium">Vendor</label>
              {vendors.length === 0 ? (
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  No vendors registered yet. Please go to the <strong>Vendors</strong> tab to register a supplier.
                </div>
              ) : (
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Credit: ${v.creditLimit.toLocaleString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Lines Header with Scan Barcode button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-stone-400 font-medium">Ordered Products</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPoScannerOpen(true)}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-stone-800 hover:bg-stone-750 text-emerald-400 border border-stone-700/60 rounded-lg font-medium transition"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Scan Barcode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddLine()}
                    disabled={products.length === 0}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 disabled:opacity-40"
                  >
                    + Add Line
                  </button>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  No products in catalog yet. Please go to the <strong>Inventory</strong> tab to add products first.
                </div>
              ) : poLines.length === 0 ? (
                <div className="p-3 text-center text-xs text-stone-500 bg-stone-950/50 rounded-xl border border-stone-800">
                  Click "+ Add Line" or "Scan Barcode" to add items to this purchase order.
                </div>
              ) : null}

              {/* Prompt to compare vendor prices */}
              <div className="p-2 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-stone-300">
                  <Scale className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px]">Compare historical vendor deals & bulk volume discounts</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenComparison(poLines[0]?.productId)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
                >
                  <span>Open Comparator</span>
                  <Scale className="w-3 h-3" />
                </button>
              </div>

              {poLines.map((line, idx) => {
                const prod = products.find((p) => p.id === line.productId);
                const currentPrice =
                  line.customUnitPrice !== undefined
                    ? line.customUnitPrice
                    : prod?.purchasePrice || 0;
                const lineTotal = currentPrice * line.quantity;

                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-stone-950 rounded-xl border border-stone-800 text-xs space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <select
                        value={line.productId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          const newProd = products.find((p) => p.id === newId);
                          setPoLines((prev) =>
                            prev.map((l, i) =>
                              i === idx
                                ? {
                                    ...l,
                                    productId: newId,
                                    customUnitPrice: newProd?.purchasePrice,
                                  }
                                : l
                            )
                          );
                        }}
                        className="flex-1 bg-stone-900 border border-stone-800 rounded-lg p-1.5 text-xs text-stone-200"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleOpenComparison(line.productId)}
                        className="flex items-center gap-1 text-[10px] px-2 py-1.5 bg-stone-900 hover:bg-stone-800 text-emerald-400 border border-stone-700/70 rounded-lg font-medium transition shrink-0"
                        title="Compare vendor deals for this product"
                      >
                        <Scale className="w-3 h-3" />
                        <span>Compare</span>
                      </button>

                      {poLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1.5 text-stone-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-850">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-stone-400">Qty:</span>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => {
                            const q = parseInt(e.target.value) || 1;
                            setPoLines((prev) =>
                              prev.map((l, i) => (i === idx ? { ...l, quantity: q } : l))
                            );
                          }}
                          className="w-16 bg-stone-900 border border-stone-800 rounded-lg p-1 text-xs text-stone-200 text-center font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-stone-400">Unit Price:</span>
                        <div className="relative">
                          <span className="absolute left-1.5 top-1 text-stone-500 text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={currentPrice}
                            onChange={(e) => {
                              const p = parseFloat(e.target.value) || 0;
                              setPoLines((prev) =>
                                prev.map((l, i) =>
                                  i === idx ? { ...l, customUnitPrice: p } : l
                                )
                              );
                            }}
                            className="w-20 bg-stone-900 border border-stone-800 rounded-lg py-1 pl-4 pr-1 text-xs text-stone-200 text-right font-mono"
                          />
                        </div>
                      </div>

                      <div className="text-right font-mono font-bold text-stone-200 text-xs">
                        ${lineTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-stone-400 block mb-1">Procurement Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, shipping instructions, or delivery bay..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200 resize-none h-16"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePO}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Submit Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Goods Receipt Modal with Camera Barcode Verification */}
      {receivingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="font-bold text-sm">Goods Receipt & Stock Ingestion</h3>
                  <p className="text-[11px] text-stone-400 font-mono">{receivingPo.poNumber} • {receivingPo.vendorName}</p>
                </div>
              </div>
              <button
                onClick={() => setReceivingPo(null)}
                className="p-1 text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Warehouse Selector */}
            <div>
              <label className="text-xs text-stone-400 block mb-1 font-medium">Destination Warehouse</label>
              <select
                value={receiptWarehouseId}
                onChange={(e) => setReceiptWarehouseId(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Camera Barcode Scanner Action for Inbound Delivery */}
            <div className="p-3 bg-teal-950/40 border border-teal-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-teal-200 block">Scan Incoming Products</span>
                <span className="text-[10px] text-teal-300/70">
                  Scan parcel barcodes with camera to validate items against PO
                </span>
              </div>
              <button
                onClick={() => setIsReceiptScannerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Barcode</span>
              </button>
            </div>

            {/* Itemized Verification List */}
            <div className="space-y-2">
              <label className="text-xs text-stone-400 font-medium">PO Line Items to Ingest:</label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {receivingPo.lines.map((line) => {
                  const prod = products.find((p) => p.id === line.productId);
                  const receivedQty = receivedQuantities[line.productId] ?? line.quantity;
                  const isFullyReceived = receivedQty >= line.quantity;

                  return (
                    <div
                      key={line.id}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between text-xs ${
                        isFullyReceived
                          ? 'bg-emerald-950/30 border-emerald-500/40'
                          : 'bg-stone-950 border-stone-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-200">{line.productName}</span>
                          {isFullyReceived && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Validated
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                          SKU: {line.productCode} • Barcode: {prod?.barcode}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          Ordered: {line.quantity} pcs
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <label className="text-[10px] text-stone-400 block">Received Qty</label>
                          <input
                            type="number"
                            min={0}
                            value={receivedQty}
                            onChange={(e) =>
                              setReceivedQuantities({
                                ...receivedQuantities,
                                [line.productId]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-16 bg-stone-900 border border-stone-700 rounded-lg p-1 text-center font-mono font-bold text-emerald-400 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setReceivingPo(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmGoodsReceipt}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Goods Ingestion</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO Barcode Scanner Modal (for adding lines) */}
      <BarcodeScannerModal
        isOpen={isPoScannerOpen}
        onClose={() => setIsPoScannerOpen(false)}
        title="Add Product to Purchase Order"
        subtitle="Point camera at product SKU barcode to add to RFQ"
        mode="receive"
        onProductFound={(product) => handleProductScannedForPo(product)}
      />

      {/* Goods Receipt Scanner Modal (with strict validation against PO) */}
      {receivingPo && (
        <BarcodeScannerModal
          isOpen={isReceiptScannerOpen}
          onClose={() => setIsReceiptScannerOpen(false)}
          title="Verify Goods Receipt Barcode"
          subtitle={`Validate parcels for ${receivingPo.poNumber}`}
          mode="receive"
          allowedProductIds={receivingPo.lines.map((l) => l.productId)}
          onProductFound={(product) => handleGoodsReceiptScan(product)}
        />
      )}

      {/* Document Lifecycle Audit Trail Modal */}
      {auditModalDoc && (
        <DocumentAuditModal
          isOpen={true}
          onClose={() => setAuditModalDoc(null)}
          entityType={auditModalDoc.entityType || 'PurchaseOrder'}
          entityId={auditModalDoc.id}
          entityReference={auditModalDoc.ref}
          documentTitle={auditModalDoc.title}
        />
      )}

      {/* Official Purchase Order Printable Document Modal with Letterhead & Logo */}
      <PrintableDocumentModal
        isOpen={!!selectedPoForPdf}
        onClose={() => setSelectedPoForPdf(null)}
        documentType="purchase_order"
        purchaseOrder={selectedPoForPdf}
      />

      {/* Historical Vendor Cost Comparison & Best Deal Finder Modal */}
      <VendorCostComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        products={products}
        purchaseOrders={purchaseOrders}
        partners={partners}
        stockLevels={stockLevels}
        initialProductId={comparisonProductId}
        onSelectDeal={handleSelectDeal}
      />

      {/* Purchase Bill Scanner Modal (Camera / PDF / JPEG / OCR) */}
      <PurchaseBillScannerModal
        isOpen={isBillScannerOpen}
        onClose={() => setIsBillScannerOpen(false)}
        preSelectedPoId={billScannerPoId}
        onBillCreated={handleBillCreated}
      />

      {/* Vendor Bill Detail & Scanned Document Viewer Modal */}
      <VendorBillDetailModal
        bill={selectedBillForDetail}
        onClose={() => setSelectedBillForDetail(null)}
        onRecordPayment={handleRecordBillPayment}
      />

      {/* Vendor Bill Payment Modal */}
      <VendorBillPaymentModal
        bill={paymentBillTarget}
        isOpen={!!paymentBillTarget}
        onClose={() => setPaymentBillTarget(null)}
        onConfirm={handleConfirmBillPayment}
      />
    </div>
  );
};
