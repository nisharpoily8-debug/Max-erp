import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle,
  FileText,
  Clock,
  Filter,
  DollarSign,
  UserCheck,
  ArrowRight,
  X,
  Trash2,
  Tag,
  Camera,
  Barcode,
  ShieldCheck,
  Package,
  Printer,
  ClipboardList,
  Truck,
  MapPin,
  Search,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { SalesOrder, OrderLineItem, Product, DeliveryNote, SameDateBatchPickingList } from '../types';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { DocumentAuditModal } from '../components/DocumentAuditModal';
import { PrintableDocumentModal } from '../components/PrintableDocumentModal';
import { SameDatePickingListModal } from '../components/SameDatePickingListModal';
import { DeliveryNoteModal } from '../components/DeliveryNoteModal';

export const SalesScreen: React.FC = () => {
  const {
    salesOrders,
    deliveryNotes,
    updateDeliveryNoteStatus,
    partners,
    products,
    currentUser,
    currentBranch,
    createSalesOrder,
    approveSalesOrder,
    convertOrderToInvoice,
  } = useErp();

  const [activeTab, setActiveTab] = useState<'orders' | 'delivery_notes' | 'catalog'>('orders');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const customers = partners.filter((p) => p.type === 'customer' || p.type === 'both');
  const [selectedPartnerId, setSelectedPartnerId] = useState(customers[0]?.id || partners[0]?.id || '');
  const [orderLines, setOrderLines] = useState<
    { productId: string; quantity: number; discountPercent: number }[]
  >([]);
  const [notes, setNotes] = useState('');

  // Barcode Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerPurpose, setScannerPurpose] = useState<'order' | 'catalog'>('order');

  // Document Audit Trail Modal State
  const [auditModalOrder, setAuditModalOrder] = useState<SalesOrder | null>(null);
  const [auditModalDeliveryNote, setAuditModalDeliveryNote] = useState<DeliveryNote | null>(null);
  const [selectedOrderForPdf, setSelectedOrderForPdf] = useState<SalesOrder | null>(null);

  // Picking list & Delivery Note modals
  const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);
  const [isDeliveryNoteModalOpen, setIsDeliveryNoteModalOpen] = useState(false);
  const [selectedOrderForDn, setSelectedOrderForDn] = useState<SalesOrder | null>(null);
  const [selectedDnForModal, setSelectedDnForModal] = useState<DeliveryNote | null>(null);
  const [selectedDnForPdf, setSelectedDnForPdf] = useState<DeliveryNote | null>(null);
  const [selectedBatchForPdf, setSelectedBatchForPdf] = useState<SameDateBatchPickingList | null>(null);

  // Delivery Notes search & filter
  const [dnSearchTerm, setDnSearchTerm] = useState('');
  const [dnStatusFilter, setDnStatusFilter] = useState<'all' | 'Ready for Dispatch' | 'Dispatched' | 'Delivered'>('all');

  // Handle add line
  const handleAddLine = (productId?: string) => {
    const id = productId || products[0]?.id || '';
    setOrderLines((prev) => [...prev, { productId: id, quantity: 1, discountPercent: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    setOrderLines((prev) => prev.filter((_, i) => i !== idx));
  };

  // Pre-fill / increment line from camera barcode scan
  const handleBarcodeScanned = (product: Product) => {
    if (scannerPurpose === 'order') {
      setOrderLines((prev) => {
        const existingIdx = prev.findIndex((l) => l.productId === product.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx].quantity += 1;
          return updated;
        }
        return [...prev, { productId: product.id, quantity: 1, discountPercent: 0 }];
      });
      setIsScannerOpen(false);
    }
  };

  // Submit Order
  const handleSaveOrder = () => {
    const partner = partners.find((p) => p.id === selectedPartnerId);
    if (!partner) return;

    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    const validLines: OrderLineItem[] = [];
    for (let idx = 0; idx < orderLines.length; idx++) {
      const line = orderLines[idx];
      const prod = products.find((p) => p.id === line.productId);
      if (!prod) continue;

      const basePrice = prod.sellingPrice * line.quantity;
      const lineDisc = basePrice * (line.discountPercent / 100);
      const afterDisc = basePrice - lineDisc;
      const lineTax = afterDisc * (prod.taxRatePercent / 100);

      subtotal += basePrice;
      discountAmount += lineDisc;
      taxAmount += lineTax;

      validLines.push({
        id: `sol-${Date.now()}-${idx}`,
        productId: prod.id,
        productName: prod.name,
        productCode: prod.code,
        quantity: line.quantity,
        unitPrice: prod.sellingPrice,
        discountPercent: line.discountPercent,
        taxPercent: prod.taxRatePercent,
        lineTotal: afterDisc + lineTax,
      });
    }

    if (validLines.length === 0) return;

    const lines = validLines;

    const totalAmount = subtotal - discountAmount + taxAmount;
    const requiresApproval = totalAmount > currentUser.approvalLimit || discountAmount > 200;

    createSalesOrder({
      partnerId: partner.id,
      partnerName: partner.name,
      branchId: currentBranch.id,
      salespersonId: currentUser.id,
      salespersonName: currentUser.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: requiresApproval ? 'Pending Approval' : 'Confirmed',
      lines,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      notes,
      requiresApproval,
      approvedBy: requiresApproval ? undefined : currentUser.name,
      approvalDate: requiresApproval ? undefined : new Date().toISOString().replace('T', ' ').substring(0, 16),
    });

    setIsCreateModalOpen(false);
    setOrderLines([{ productId: products[0]?.id || '', quantity: 1, discountPercent: 0 }]);
    setNotes('');
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-stone-100">Sales & Dispatch Operations</h2>
          <p className="text-xs text-stone-400">Order lifecycle, same-date picking lists & goods delivery notes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPickingModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-900/60 to-emerald-900/60 hover:from-teal-850 hover:to-emerald-850 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold shadow-xs transition"
            title="Generate picking list for same-date orders"
          >
            <ClipboardList className="w-4 h-4 text-teal-400" />
            <span>Same-Date Picking List</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-800 text-xs">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'orders' ? 'bg-stone-800 text-stone-100 shadow-xs font-semibold' : 'text-stone-400'
          }`}
        >
          Sales Orders ({salesOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('delivery_notes')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'delivery_notes' ? 'bg-stone-800 text-teal-300 shadow-xs font-semibold' : 'text-stone-400'
          }`}
        >
          Delivery Notes ({deliveryNotes.length})
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition ${
            activeTab === 'catalog' ? 'bg-stone-800 text-stone-100 shadow-xs font-semibold' : 'text-stone-400'
          }`}
        >
          Price Book & Catalog ({products.length})
        </button>
      </div>

      {/* Orders List */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {salesOrders.map((order) => {
            const isPending = order.status === 'Pending Approval';
            const isConfirmed = order.status === 'Confirmed';
            const canApprove =
              (currentUser.role === 'Manager' || currentUser.role === 'Administrator') &&
              isPending &&
              order.totalAmount <= currentUser.approvalLimit;

            return (
              <div
                key={order.id}
                className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 shadow-xs"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm font-mono text-stone-100">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          order.status === 'Confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : order.status === 'Pending Approval'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-stone-300 mt-1">
                      {order.partnerName}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Rep: {order.salespersonName} • {order.orderDate}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-stone-100">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-stone-500 block">
                      Tax: ${order.taxAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Line items preview */}
                <div className="bg-stone-950/60 rounded-xl p-2.5 divide-y divide-stone-800/80 text-xs">
                  {order.lines.map((line) => (
                    <div key={line.id} className="py-1 flex items-center justify-between text-stone-300">
                      <div>
                        <span>{line.quantity}x {line.productName}</span>
                        <span className="text-[10px] text-stone-500 block font-mono">
                          SKU: {line.productCode} • ${line.unitPrice.toFixed(2)} ea
                        </span>
                      </div>
                      <span className="font-mono text-stone-400">${line.lineTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions & Audit Button */}
                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrderForPdf(order)}
                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-stone-850 hover:bg-stone-800 text-emerald-400 border border-emerald-500/30 font-mono transition"
                      title="Print / PDF Quotation with Company Letterhead & Logo"
                    >
                      <Printer className="w-3 h-3" />
                      Quote PDF
                    </button>

                    <button
                      onClick={() => setAuditModalOrder(order)}
                      className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 text-stone-300 font-mono transition"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Audit Trail
                    </button>

                    <div className="text-[11px] text-stone-400">
                      {order.approvedBy ? (
                        <span className="text-emerald-400">Approved by {order.approvedBy}</span>
                      ) : (
                        <span className="text-amber-400">Requires manager approval</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canApprove && (
                      <button
                        onClick={() => approveSalesOrder(order.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}

                    {isConfirmed && !order.invoiceId && (
                      <button
                        onClick={() => convertOrderToInvoice(order.id)}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <FileText className="w-3.5 h-3.5" /> Create Invoice
                      </button>
                    )}

                    {order.invoiceId && (
                      <span className="text-[11px] font-mono text-sky-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Invoiced
                      </span>
                    )}

                    {/* Delivery Note Action */}
                    {(() => {
                      const linkedDn = deliveryNotes.find((dn) => dn.salesOrderId === order.id);
                      if (linkedDn) {
                        return (
                          <button
                            onClick={() => {
                              setSelectedDnForModal(linkedDn);
                              setSelectedOrderForDn(order);
                              setIsDeliveryNoteModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-teal-950/50 hover:bg-teal-900/60 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition"
                            title="Inspect Goods Delivery Note"
                          >
                            <Truck className="w-3.5 h-3.5 text-teal-400" />
                            <span>{linkedDn.deliveryNoteNumber}</span>
                          </button>
                        );
                      } else if (isConfirmed || order.status === 'Delivered') {
                        return (
                          <button
                            onClick={() => {
                              setSelectedDnForModal(null);
                              setSelectedOrderForDn(order);
                              setIsDeliveryNoteModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700/80 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                            title="Generate Goods Delivery Note"
                          >
                            <Truck className="w-3.5 h-3.5 text-teal-400" />
                            <span>Delivery Note</span>
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery Notes Tab View */}
      {activeTab === 'delivery_notes' && (
        <div className="space-y-3">
          {/* Search, Filter & Quick Wave Picking Action */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search delivery notes, customer, SO #, tracking..."
                  value={dnSearchTerm}
                  onChange={(e) => setDnSearchTerm(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPickingModalOpen(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-900/40 to-emerald-900/40 hover:from-teal-900/60 hover:to-emerald-900/60 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-teal-400" />
                  <span>Wave Pick Same-Date Orders</span>
                </button>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-stone-800/80 text-xs">
              <span className="text-stone-500 text-[11px] mr-1">Status:</span>
              {(['all', 'Ready for Dispatch', 'Dispatched', 'Delivered'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setDnStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg transition text-xs ${
                    dnStatusFilter === st
                      ? 'bg-teal-600 text-white font-semibold shadow-xs'
                      : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                  }`}
                >
                  {st === 'all' ? 'All Notes' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Notes List */}
          {deliveryNotes
            .filter((dn) => {
              if (dnStatusFilter !== 'all' && dn.status !== dnStatusFilter) return false;
              if (dnSearchTerm.trim()) {
                const term = dnSearchTerm.toLowerCase();
                return (
                  dn.deliveryNoteNumber.toLowerCase().includes(term) ||
                  dn.salesOrderNumber.toLowerCase().includes(term) ||
                  dn.customerName.toLowerCase().includes(term) ||
                  (dn.carrierName && dn.carrierName.toLowerCase().includes(term)) ||
                  (dn.trackingNumber && dn.trackingNumber.toLowerCase().includes(term)) ||
                  (dn.deliveryAddress && dn.deliveryAddress.toLowerCase().includes(term))
                );
              }
              return true;
            })
            .map((note) => {
              const so = salesOrders.find((o) => o.id === note.salesOrderId);
              return (
                <div
                  key={note.id}
                  className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 shadow-xs hover:border-stone-750 transition"
                >
                  {/* Delivery Note Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-400 text-sm">
                          {note.deliveryNoteNumber}
                        </span>
                        <span className="text-xs text-stone-400 font-mono">
                          (Ref: {note.salesOrderNumber})
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            note.status === 'Delivered'
                              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                              : note.status === 'Dispatched'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {note.status}
                        </span>
                      </div>
                      <div className="text-xs text-stone-200 font-semibold mt-0.5">
                        {note.customerName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDnForPdf(note)}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-teal-300 border border-teal-500/30 font-mono transition"
                        title="Print official delivery note with logo and letterhead"
                      >
                        <Printer className="w-3.5 h-3.5 text-teal-400" />
                        <span>Print Note</span>
                      </button>

                      <button
                        onClick={() => setAuditModalDeliveryNote(note)}
                        className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
                        title="View Delivery Note Audit Trail"
                      >
                        <ShieldCheck className="w-4 h-4 text-teal-400" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDnForModal(note);
                          setSelectedOrderForDn(so || null);
                          setIsDeliveryNoteModalOpen(true);
                        }}
                        className="px-3 py-1 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-lg text-xs font-semibold transition"
                      >
                        Manage
                      </button>
                    </div>
                  </div>

                  {/* Logistics & Address Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-950/40 p-3 rounded-xl border border-stone-850">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-stone-300 font-medium">
                        <Truck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>{note.carrierName}</span>
                        {note.trackingNumber && (
                          <span className="font-mono text-stone-400 text-[11px]">
                            • Waybill: {note.trackingNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 pl-5">
                        Driver: {note.driverName || 'Designated Driver'} ({note.vehicleNumber || 'VAN'}) • {note.totalPackages || 1} Packages ({note.totalWeightKg || 0} kg)
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5 text-stone-300">
                        <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-stone-300 line-clamp-1">{note.deliveryAddress}</span>
                      </div>
                      <p className="text-[11px] text-stone-400 pl-5 font-mono">
                        Dispatch: {note.dispatchDate} • Expected: {note.expectedDeliveryDate}
                      </p>
                    </div>
                  </div>

                  {/* Dispatched Line Items Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">
                      Dispatched Consignment
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {note.lines.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between bg-stone-950/60 px-2.5 py-1.5 rounded-lg border border-stone-850 text-xs"
                        >
                          <div className="truncate mr-2">
                            <span className="font-mono text-stone-400 text-[10px] block">{l.productCode}</span>
                            <span className="text-stone-200 text-[11px] font-medium truncate block">
                              {l.productName}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-teal-400 text-xs shrink-0">
                            {l.dispatchedQuantity} pcs
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recipient Proof of Delivery Notice */}
                  {note.status === 'Delivered' && (
                    <div className="p-2.5 bg-teal-950/30 border border-teal-500/20 rounded-xl text-xs text-teal-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
                        <span>
                          Delivered & Signed by <span className="font-semibold">{note.receivedBy || 'Staff'}</span> on {note.receivedDate || note.actualDeliveryDate}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] bg-teal-500/20 px-2 py-0.5 rounded-md text-teal-300">
                        POD Verified
                      </span>
                    </div>
                  )}

                  {/* Quick Action Transitions */}
                  {note.status === 'Ready for Dispatch' && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => updateDeliveryNoteStatus(note.id, 'Dispatched')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Mark as Dispatched</span>
                      </button>
                    </div>
                  )}
                  {note.status === 'Dispatched' && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedDnForModal(note);
                          setSelectedOrderForDn(so || null);
                          setIsDeliveryNoteModalOpen(true);
                        }}
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Record Recipient POD & Delivery</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Catalog View */}
      {activeTab === 'catalog' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-stone-900 border border-stone-800 rounded-2xl">
            <span className="text-xs text-stone-300">Quick Barcode Scanner & Price Verification</span>
            <button
              onClick={() => {
                setScannerPurpose('catalog');
                setIsScannerOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Item</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-200">{p.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-800 text-stone-400 font-mono">
                      {p.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Category: {p.category} • Costing: {p.costingMethod}
                  </p>
                  <p className="text-[10px] text-stone-500 font-mono">Barcode: {p.barcode}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm font-mono text-emerald-400">
                    ${p.sellingPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-500 block">Cost: ${p.purchasePrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Order Modal with Camera Barcode Scanner */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Create Sales Order / Quotation</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select Customer */}
            <div>
              <label className="text-xs text-stone-400 block mb-1 font-medium">Customer</label>
              {customers.length === 0 ? (
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                  No customers registered yet. Please go to the <strong>Customers</strong> tab to add your first customer.
                </div>
              ) : (
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Terms: Net {c.paymentTermsDays})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Order Lines Header with Barcode Scanner */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-stone-400 font-medium">Order Line Items</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setScannerPurpose('order');
                      setIsScannerOpen(true);
                    }}
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
                  No products in catalog yet. Please go to the <strong>Inventory</strong> tab to add products.
                </div>
              ) : orderLines.length === 0 ? (
                <div className="p-3 text-center text-xs text-stone-500 bg-stone-950/50 rounded-xl border border-stone-800">
                  Click "+ Add Line" or "Scan Barcode" to add items to this order.
                </div>
              ) : null}

              {orderLines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-stone-950 rounded-xl border border-stone-800 text-xs"
                >
                  <select
                    value={line.productId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setOrderLines((prev) =>
                        prev.map((l, i) => (i === idx ? { ...l, productId: newId } : l))
                      );
                    }}
                    className="flex-1 bg-stone-900 border border-stone-800 rounded-lg p-1.5 text-xs text-stone-200"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.sellingPrice.toFixed(2)})
                      </option>
                    ))}
                  </select>

                  <div className="w-16">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => {
                        const q = parseInt(e.target.value) || 1;
                        setOrderLines((prev) =>
                          prev.map((l, i) => (i === idx ? { ...l, quantity: q } : l))
                        );
                      }}
                      className="w-full bg-stone-900 border border-stone-800 rounded-lg p-1.5 text-xs text-stone-200 text-center font-mono"
                    />
                  </div>

                  <div className="w-16">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={line.discountPercent}
                      placeholder="Disc%"
                      onChange={(e) => {
                        const d = parseFloat(e.target.value) || 0;
                        setOrderLines((prev) =>
                          prev.map((l, i) => (i === idx ? { ...l, discountPercent: d } : l))
                        );
                      }}
                      className="w-full bg-stone-900 border border-stone-800 rounded-lg p-1.5 text-xs text-stone-200 text-center font-mono"
                    />
                  </div>

                  {orderLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-1.5 text-stone-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-stone-400 block mb-1">Customer / Delivery Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shipping instructions, freight terms, or special discount rationale..."
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
                onClick={handleSaveOrder}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Create Sales Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner for Order creation & catalog lookup */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title={scannerPurpose === 'order' ? 'Scan Product for Sales Order' : 'Catalog Price Checker'}
        subtitle="Point camera at product SKU barcode"
        mode={scannerPurpose === 'order' ? 'delivery' : 'lookup'}
        onProductFound={(product) => handleBarcodeScanned(product)}
      />

      {/* Document Lifecycle Audit Trail Modal for Sales Order */}
      {auditModalOrder && (
        <DocumentAuditModal
          isOpen={true}
          onClose={() => setAuditModalOrder(null)}
          entityType="SalesOrder"
          entityId={auditModalOrder.id}
          entityReference={auditModalOrder.orderNumber}
          documentTitle={`Sales Order ${auditModalOrder.orderNumber} (${auditModalOrder.partnerName})`}
        />
      )}

      {/* Document Lifecycle Audit Trail Modal for Delivery Note */}
      {auditModalDeliveryNote && (
        <DocumentAuditModal
          isOpen={true}
          onClose={() => setAuditModalDeliveryNote(null)}
          entityType="DeliveryNote"
          entityId={auditModalDeliveryNote.id}
          entityReference={auditModalDeliveryNote.deliveryNoteNumber}
          documentTitle={`Delivery Note ${auditModalDeliveryNote.deliveryNoteNumber} (${auditModalDeliveryNote.customerName})`}
        />
      )}

      {/* Same-Date Batch Picking List Modal */}
      <SameDatePickingListModal
        isOpen={isPickingModalOpen}
        onClose={() => setIsPickingModalOpen(false)}
        onOpenDeliveryNoteModal={(so: SalesOrder) => {
          setSelectedOrderForDn(so);
          const matchedDn = deliveryNotes.find((dn) => dn.salesOrderId === so.id);
          setSelectedDnForModal(matchedDn || null);
          setIsDeliveryNoteModalOpen(true);
        }}
        onPrintPickingList={(batch: SameDateBatchPickingList) => {
          setSelectedBatchForPdf(batch);
        }}
      />

      {/* Delivery Note Modal (Inspect, Create, Dispatch, POD Signature) */}
      <DeliveryNoteModal
        isOpen={isDeliveryNoteModalOpen}
        onClose={() => {
          setIsDeliveryNoteModalOpen(false);
          setSelectedDnForModal(null);
          setSelectedOrderForDn(null);
        }}
        salesOrder={selectedOrderForDn || undefined}
        existingDeliveryNote={selectedDnForModal || undefined}
        onPrintDeliveryNote={(dn: DeliveryNote) => {
          setSelectedDnForPdf(dn);
        }}
        onViewAuditTrail={(dn: DeliveryNote) => {
          setAuditModalDeliveryNote(dn);
        }}
      />

      {/* Quotation / Sales Order Printable Document Modal */}
      <PrintableDocumentModal
        isOpen={!!selectedOrderForPdf}
        onClose={() => setSelectedOrderForPdf(null)}
        documentType="quotation"
        salesOrder={selectedOrderForPdf}
      />

      {/* Official Goods Delivery Note Printable Document Modal */}
      <PrintableDocumentModal
        isOpen={!!selectedDnForPdf}
        onClose={() => setSelectedDnForPdf(null)}
        documentType="delivery_note"
        deliveryNote={selectedDnForPdf}
      />

      {/* Consolidated Batch Picking List Printable Document Modal */}
      <PrintableDocumentModal
        isOpen={!!selectedBatchForPdf}
        onClose={() => setSelectedBatchForPdf(null)}
        documentType="picking_list"
        pickingList={selectedBatchForPdf}
      />
    </div>
  );
};
