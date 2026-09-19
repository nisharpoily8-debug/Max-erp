import React, { useState } from 'react';
import {
  Printer,
  X,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  FileText,
  Calendar,
  CreditCard,
  User,
  Building,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import {
  Invoice,
  SalesOrder,
  PurchaseOrder,
  LetterheadConfig,
  DeliveryNote,
  SameDateBatchPickingList,
} from '../types';
import { LetterheadHeader } from './LetterheadHeader';
import { LetterheadConfigPanel } from './LetterheadConfigPanel';

export type PrintableDocType =
  | 'invoice'
  | 'quotation'
  | 'purchase_order'
  | 'delivery_note'
  | 'picking_list';

interface PrintableDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: PrintableDocType;
  invoice?: Invoice | null;
  salesOrder?: SalesOrder | null;
  purchaseOrder?: PurchaseOrder | null;
  deliveryNote?: DeliveryNote | null;
  pickingList?: SameDateBatchPickingList | null;
}

export const PrintableDocumentModal: React.FC<PrintableDocumentModalProps> = ({
  isOpen,
  onClose,
  documentType,
  invoice,
  salesOrder,
  purchaseOrder,
  deliveryNote,
  pickingList,
}) => {
  const { company, updateLetterhead, partners } = useErp();

  // Local state for letterhead options so user can experiment live before printing or saving as default
  const defaultLetterhead: LetterheadConfig = company.letterhead || {
    showLogo: true,
    logoType: 'preset',
    presetId: 'diamond',
    logoHeight: 48,
    layout: 'split',
    showCompanyDetails: true,
    tagline: 'Enterprise Resource & Operations Platform',
    accentColor: '#059669',
  };

  const [activeConfig, setActiveConfig] = useState<LetterheadConfig>(defaultLetterhead);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Sync if company updates
  React.useEffect(() => {
    if (company.letterhead) {
      setActiveConfig(company.letterhead);
    }
  }, [company.letterhead]);

  if (!isOpen) return null;

  const handleConfigChange = (updates: Partial<LetterheadConfig>) => {
    setActiveConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveAsDefault = () => {
    updateLetterhead(activeConfig);
  };

  // Resolve document specifics
  let docTitle = 'DOCUMENT';
  let docNumber = '';
  let dateLabel = 'Date';
  let dateValue = '';
  let secondaryDateLabel: string | undefined;
  let secondaryDateValue: string | undefined;
  let statusBadgeLabel = '';
  let partnerName = '';
  let partnerDetails = '';
  let lines: {
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    taxPercent: number;
    discountPercent?: number;
    lineTotal: number;
  }[] = [];
  let subtotal = 0;
  let taxAmount = 0;
  let discountAmount = 0;
  let totalAmount = 0;
  let docId = '';
  let notes = '';

  if (documentType === 'invoice' && invoice) {
    docTitle = 'TAX INVOICE';
    docNumber = invoice.invoiceNumber;
    dateLabel = 'Issue Date';
    dateValue = invoice.issueDate;
    secondaryDateLabel = 'Due Date';
    secondaryDateValue = invoice.dueDate;
    statusBadgeLabel = invoice.status;
    partnerName = invoice.partnerName;
    lines = invoice.lines;
    subtotal = invoice.subtotal;
    taxAmount = invoice.taxAmount;
    discountAmount = invoice.discountAmount;
    totalAmount = invoice.totalAmount;
    docId = invoice.id;
    notes = invoice.notes || 'Payment due within invoice terms. Please quote invoice number on all remittances.';

    const p = partners.find((pt) => pt.id === invoice.partnerId);
    if (p) {
      partnerDetails = `${p.billingAddress} • Tax ID: ${p.taxNumber || 'N/A'} • Terms: Net ${p.paymentTermsDays}`;
    }
  } else if (documentType === 'quotation' && salesOrder) {
    docTitle = 'COMMERCIAL QUOTATION';
    docNumber = salesOrder.orderNumber;
    dateLabel = 'Quote Date';
    dateValue = salesOrder.orderDate;
    secondaryDateLabel = 'Valid Until';
    secondaryDateValue = salesOrder.expectedDeliveryDate;
    statusBadgeLabel = salesOrder.status === 'Draft' ? 'QUOTATION' : salesOrder.status;
    partnerName = salesOrder.partnerName;
    lines = salesOrder.lines;
    subtotal = salesOrder.subtotal;
    taxAmount = salesOrder.taxAmount;
    discountAmount = salesOrder.discountAmount;
    totalAmount = salesOrder.totalAmount;
    docId = salesOrder.id;
    notes =
      salesOrder.notes ||
      'This quotation is valid for 30 calendar days from issue date. Subject to standard supply and warranty terms.';

    const p = partners.find((pt) => pt.id === salesOrder.partnerId);
    if (p) {
      partnerDetails = `${p.billingAddress} • Tax ID: ${p.taxNumber || 'N/A'} • Payment Terms: Net ${p.paymentTermsDays}`;
    }
  } else if (documentType === 'purchase_order' && purchaseOrder) {
    docTitle = 'OFFICIAL PURCHASE ORDER';
    docNumber = purchaseOrder.poNumber;
    dateLabel = 'Order Date';
    dateValue = purchaseOrder.orderDate;
    secondaryDateLabel = 'Required Delivery';
    secondaryDateValue = purchaseOrder.expectedArrivalDate;
    statusBadgeLabel = purchaseOrder.status;
    partnerName = purchaseOrder.vendorName;
    lines = purchaseOrder.lines;
    subtotal = purchaseOrder.subtotal;
    taxAmount = purchaseOrder.taxAmount;
    discountAmount = 0;
    totalAmount = purchaseOrder.totalAmount;
    docId = purchaseOrder.id;
    notes =
      purchaseOrder.notes ||
      'Please acknowledge receipt and confirm shipment ETA. Deliver with itemized packing slip quoting PO number.';

    const p = partners.find((pt) => pt.id === purchaseOrder.vendorId);
    if (p) {
      partnerDetails = `${p.billingAddress} • Tax/Registration: ${p.taxNumber || 'N/A'} • Terms: Net ${p.paymentTermsDays}`;
    }
  } else if (documentType === 'delivery_note' && deliveryNote) {
    docTitle = 'GOODS DISPATCH NOTE / DELIVERY NOTE';
    docNumber = deliveryNote.deliveryNoteNumber;
    dateLabel = 'Dispatch Date';
    dateValue = deliveryNote.dispatchDate;
    secondaryDateLabel = 'Expected Delivery';
    secondaryDateValue = deliveryNote.expectedDeliveryDate;
    statusBadgeLabel = deliveryNote.status;
    partnerName = deliveryNote.customerName;
    partnerDetails = `Shipping Destination: ${deliveryNote.deliveryAddress} • Carrier: ${deliveryNote.carrierName} ${deliveryNote.trackingNumber ? `(Tracking: ${deliveryNote.trackingNumber})` : ''} • Driver: ${deliveryNote.driverName || 'Designated Driver'} (${deliveryNote.vehicleNumber || 'Van'}) • Total Packages: ${deliveryNote.totalPackages || 1} • Total Weight: ${deliveryNote.totalWeightKg || 0} kg`;
    docId = deliveryNote.id;
    notes =
      deliveryNote.specialInstructions ||
      'Please inspect all packages upon arrival. Any damage or discrepancy must be recorded on this proof of delivery before driver release.';
  } else if (documentType === 'picking_list' && pickingList) {
    docTitle = 'BATCH PICKING LIST (SAME DATE DISPATCH)';
    docNumber = `PICK-${pickingList.date.replace(/-/g, '')}`;
    dateLabel = 'Fulfillment Date';
    dateValue = pickingList.date;
    secondaryDateLabel = 'Batched Orders';
    secondaryDateValue = `${pickingList.totalOrders} Orders (${pickingList.orderNumbers.join(', ')})`;
    statusBadgeLabel = pickingList.status;
    partnerName = `Consolidated Dispatch Wave (${pickingList.totalOrders} Orders)`;
    partnerDetails = `Sales Orders Included: ${pickingList.orderNumbers.join(', ')} • Total Units to Gather: ${pickingList.totalUnitsToPick} items • Picker: ${pickingList.pickerName || 'Warehouse Dispatch Team'}`;
    docId = `wave-${pickingList.date}`;
    notes =
      'Warehouse Wave Instructions: Gather products systematically by aisle & bin. Verify item code and barcode prior to placing into staging carts.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white text-stone-900 rounded-3xl shadow-2xl overflow-hidden my-6 border border-stone-300">
        {/* Actions Bar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-3 bg-stone-900 text-stone-100 border-b border-stone-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
              {docTitle} PREVIEW
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-medium">
              {docNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Letterhead Options Panel */}
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                isConfigOpen
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Logo & Letterhead</span>
            </button>

            {/* Print / Save to PDF */}
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expandable Letterhead and Logo Configuration Drawer */}
        {isConfigOpen && (
          <LetterheadConfigPanel
            company={company}
            config={activeConfig}
            onChange={handleConfigChange}
            onSaveAsDefault={handleSaveAsDefault}
          />
        )}

        {/* Printable Document Body (A4 Style Sheet) */}
        <div className="p-8 sm:p-10 space-y-6 bg-white text-stone-900 printable-document">
          {/* Reusable Letterhead with Logo & Company Identification */}
          <LetterheadHeader
            company={company}
            config={activeConfig}
            documentTitle={docTitle}
            documentNumber={docNumber}
            dateLabel={dateLabel}
            dateValue={dateValue}
            secondaryDateLabel={secondaryDateLabel}
            secondaryDateValue={secondaryDateValue}
            statusBadge={{ label: statusBadgeLabel }}
          />

          {/* Party Cards (Bill To / Vendor / Shipping) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                {documentType === 'purchase_order' ? 'Vendor / Supplier' : 'Recipient / Billed To'}
              </span>
              <h3 className="text-sm font-bold text-stone-900">{partnerName}</h3>
              {partnerDetails && (
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{partnerDetails}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                {documentType === 'purchase_order' ? 'Delivery Destination' : 'Payment Destination & Terms'}
              </span>
              {documentType === 'purchase_order' ? (
                <div className="text-xs text-stone-700 space-y-0.5">
                  <p className="font-semibold text-stone-800">{company.name} Central Receiving</p>
                  <p className="text-stone-500">{company.address}</p>
                  <p className="text-stone-500">Dock Hours: 08:00 - 17:00 PST</p>
                </div>
              ) : (
                <div className="text-xs text-stone-700 space-y-0.5">
                  <p className="font-semibold text-stone-800">Commercial Operations Account</p>
                  <p className="text-stone-500 font-mono text-[11px]">JPMorgan Chase • Route: 021000021</p>
                  <p className="text-stone-500 font-mono text-[11px]">Account No: 9482-1049-2041</p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          {documentType === 'delivery_note' && deliveryNote ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-stone-300 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Item & Description</th>
                    <th className="py-2.5 text-right">Ordered Qty</th>
                    <th className="py-2.5 text-right">Dispatched Qty</th>
                    <th className="py-2.5 text-right">Backorder Qty</th>
                    <th className="py-2.5">Lot / Serial #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {deliveryNote.lines.map((line, idx) => (
                    <tr key={idx} className="text-stone-800">
                      <td className="py-3">
                        <p className="font-bold text-stone-900">{line.productName}</p>
                        <p className="text-[11px] text-stone-500 font-mono">{line.productCode}</p>
                      </td>
                      <td className="py-3 text-right font-medium text-stone-600">{line.orderedQuantity} {line.unitOfMeasure || 'pcs'}</td>
                      <td className="py-3 text-right font-mono font-bold text-stone-900">{line.dispatchedQuantity} {line.unitOfMeasure || 'pcs'}</td>
                      <td className="py-3 text-right font-mono text-stone-400">{line.backorderQuantity}</td>
                      <td className="py-3 font-mono text-[11px] text-stone-600">{line.serialOrLotNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : documentType === 'picking_list' && pickingList ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-stone-300 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 w-12 text-center">Check</th>
                    <th className="py-2.5">Aisle & Location</th>
                    <th className="py-2.5">SKU & Item Name</th>
                    <th className="py-2.5 text-right">Pick Qty</th>
                    <th className="py-2.5">Allocated Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {pickingList.items.map((item, idx) => (
                    <tr key={idx} className="text-stone-800">
                      <td className="py-3 text-center">
                        <div className="w-5 h-5 border-2 border-stone-400 rounded-sm mx-auto flex items-center justify-center font-bold text-emerald-700">
                          {item.isPicked ? '✓' : ''}
                        </div>
                      </td>
                      <td className="py-3 font-mono font-semibold text-teal-800 text-[11px]">
                        {item.binLocation || 'Aisle A-01'}
                      </td>
                      <td className="py-3">
                        <p className="font-bold text-stone-900">{item.productName}</p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          {item.productCode} {item.barcode ? `• Barcode: ${item.barcode}` : ''}
                        </p>
                      </td>
                      <td className="py-3 text-right font-mono font-extrabold text-stone-900 text-sm">
                        {item.totalRequiredQuantity}
                      </td>
                      <td className="py-3 text-[11px] text-stone-600">
                        {item.associatedOrders.map((ao) => `${ao.orderNumber} (${ao.quantity}x)`).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-stone-300 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Item & Description</th>
                    <th className="py-2.5 text-right">Qty</th>
                    <th className="py-2.5 text-right">Unit Price</th>
                    {discountAmount > 0 && <th className="py-2.5 text-right">Discount</th>}
                    <th className="py-2.5 text-right">Tax Rate</th>
                    <th className="py-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="text-stone-800">
                      <td className="py-3">
                        <p className="font-bold text-stone-900">{line.productName}</p>
                        <p className="text-[11px] text-stone-500 font-mono">{line.productCode}</p>
                      </td>
                      <td className="py-3 text-right font-medium">{line.quantity}</td>
                      <td className="py-3 text-right font-mono">${line.unitPrice.toFixed(2)}</td>
                      {discountAmount > 0 && (
                        <td className="py-3 text-right font-mono text-amber-700">
                          {line.discountPercent ? `${line.discountPercent}%` : '-'}
                        </td>
                      )}
                      <td className="py-3 text-right font-mono">{line.taxPercent}%</td>
                      <td className="py-3 text-right font-mono font-bold text-stone-900">
                        ${line.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financial Summary OR Logistics & Signatures */}
          {documentType === 'delivery_note' && deliveryNote ? (
            <div className="border-t-2 border-stone-200 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-xs text-stone-600">
                  <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">
                    Waybill & Dispatch Summary
                  </span>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1 text-stone-700">
                    <p><span className="font-semibold">Logistics Carrier:</span> {deliveryNote.carrierName}</p>
                    <p><span className="font-semibold">Tracking Waybill:</span> {deliveryNote.trackingNumber || 'N/A'}</p>
                    <p><span className="font-semibold">Driver / Vehicle:</span> {deliveryNote.driverName || 'Designated Driver'} ({deliveryNote.vehicleNumber || 'Van'})</p>
                    <p><span className="font-semibold">Consignment:</span> {deliveryNote.totalPackages || 1} Packages • {deliveryNote.totalWeightKg || 0} kg gross</p>
                    <p className="text-stone-500 text-[11px] pt-1 italic">{notes}</p>
                  </div>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider block">
                    Proof of Delivery (POD) Customer Acknowledgment
                  </span>
                  <p className="text-[11px] text-stone-600 leading-tight">
                    Received the listed consignment in apparent good order and condition.
                  </p>
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="flex justify-between border-b border-stone-300 pb-1">
                      <span className="text-stone-500">Received By (Print Name):</span>
                      <span className="font-semibold text-stone-900">{deliveryNote.receivedBy || '_____________________'}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-300 pb-1">
                      <span className="text-stone-500">Authorized Signature:</span>
                      <span className="font-mono text-stone-400">{deliveryNote.signatureReceived ? '[DIGITALLY SIGNED & VERIFIED]' : '_____________________'}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-300 pb-1">
                      <span className="text-stone-500">Date & Delivery Time:</span>
                      <span className="text-stone-800">{deliveryNote.receivedDate || '_____ / _____ / 2026'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : documentType === 'picking_list' && pickingList ? (
            <div className="border-t-2 border-stone-200 pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 text-xs text-stone-600">
                  <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">
                    Wave Fulfillment Summary
                  </span>
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1 text-stone-700">
                    <p><span className="font-semibold">Fulfillment Date:</span> {pickingList.date}</p>
                    <p><span className="font-semibold">Batched Orders:</span> {pickingList.totalOrders} Sales Orders</p>
                    <p><span className="font-semibold">Distinct Items:</span> {pickingList.items.length} SKUs</p>
                    <p><span className="font-semibold">Total Unit Count:</span> {pickingList.totalUnitsToPick} items</p>
                  </div>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 text-xs">
                  <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider block">
                    Warehouse Inspection & Quality Sign-Off
                  </span>
                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between border-b border-stone-300 pb-1">
                      <span className="text-stone-500">Wave Picker Name:</span>
                      <span className="font-semibold text-stone-900">{pickingList.pickerName || 'Warehouse Staff'}</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-300 pb-1">
                      <span className="text-stone-500">Picker Signature:</span>
                      <span className="text-stone-400">_____________________</span>
                    </div>
                    <div className="flex justify-between border-b border-stone-300 pb-1">
                      <span className="text-stone-500">Quality Checker Sign-off:</span>
                      <span className="text-stone-400">_____________________</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t-2 border-stone-200 pt-4 flex flex-col sm:flex-row justify-between gap-6">
              {/* Left: Notes & Bank / Terms */}
              <div className="flex-1 space-y-2 text-xs text-stone-600">
                <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">
                  Commercial Notes & Terms
                </span>
                <p className="text-[11px] leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-700">
                  {notes}
                </p>

                {documentType === 'quotation' && (
                  <div className="pt-6 grid grid-cols-2 gap-4">
                    <div className="border-t border-stone-300 pt-1 text-[10px] text-stone-400">
                      <span>Authorized Representative Signature</span>
                    </div>
                    <div className="border-t border-stone-300 pt-1 text-[10px] text-stone-400">
                      <span>Customer Acceptance Signature & Date</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Numbers */}
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Discount Applied:</span>
                    <span className="font-mono font-semibold">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Estimated Sales / Value Tax:</span>
                  <span className="font-mono font-semibold">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-stone-900 border-t-2 border-stone-800 pt-2">
                  <span>Total Amount:</span>
                  <span className="font-mono text-emerald-800">${totalAmount.toFixed(2)}</span>
                </div>

                {documentType === 'invoice' && invoice && (
                  <>
                    <div className="flex justify-between text-xs text-stone-500 pt-1">
                      <span>Paid to Date:</span>
                      <span className="font-mono">${invoice.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-stone-900 bg-stone-100 p-2.5 rounded-xl border border-stone-200">
                      <span>Net Balance Due:</span>
                      <span className="font-mono text-emerald-700">${invoice.balanceDue.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer Security Stamp */}
          <div className="border-t border-stone-200 pt-4 flex flex-wrap items-center justify-between text-[10px] text-stone-500 gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Generated via Maxerp • Immutable Ledger Hash Verified • Standard GAAP & IFRS Compliant
              </span>
            </div>
            <div className="font-mono text-stone-400">Doc ID: {docId}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
