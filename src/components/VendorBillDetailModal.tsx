import React, { useState } from 'react';
import {
  X,
  FileText,
  Building,
  Calendar,
  DollarSign,
  Package,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { VendorBill, Partner } from '../types';
import { useErp } from '../context/ErpContext';

interface VendorBillDetailModalProps {
  bill: VendorBill | null;
  onClose: () => void;
  onRecordPayment?: (bill: VendorBill) => void;
}

export const VendorBillDetailModal: React.FC<VendorBillDetailModalProps> = ({
  bill,
  onClose,
  onRecordPayment,
}) => {
  const { partners, warehouses, journalEntries, purchaseOrders } = useErp();
  const [activeView, setActiveView] = useState<'details' | 'document'>('details');

  if (!bill) return null;

  const vendor = partners.find((p) => p.id === bill.vendorId);
  const warehouse = warehouses.find((w) => w.id === bill.warehouseId) || warehouses[0];
  const linkedJe = bill.journalEntryId
    ? journalEntries.find((je) => je.id === bill.journalEntryId)
    : undefined;
  const linkedPo = bill.purchaseOrderId
    ? purchaseOrders.find((p) => p.id === bill.purchaseOrderId)
    : undefined;

  const isPaid = bill.status === 'Paid';
  const isPartiallyPaid = bill.status === 'Partially Paid';
  const isPosted = bill.status === 'Posted';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-stone-100">{bill.billNumber}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isPaid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isPartiallyPaid
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}
                >
                  {bill.status}
                </span>
                {bill.ocrExtracted && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    Scanned {bill.scannedFileType?.toUpperCase() || 'OCR'} ({bill.ocrConfidence || 99}%)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400">
                Vendor: <span className="text-stone-200 font-medium">{bill.vendorName}</span> • Date: {bill.billDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-4 pt-3 pb-1 border-b border-stone-800/80 flex items-center gap-2 bg-stone-950/40">
          <button
            onClick={() => setActiveView('details')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition ${
              activeView === 'details'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Bill Summary & GL Posting
          </button>
          <button
            onClick={() => setActiveView('document')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeView === 'document'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Scanned Document ({bill.scannedFileType?.toUpperCase() || 'Attachment'})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeView === 'details' ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Total Bill Amount</div>
                  <div className="text-sm font-bold text-stone-100 font-mono">
                    ${bill.totalAmount.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Balance Due</div>
                  <div
                    className={`text-sm font-bold font-mono ${
                      bill.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    ${bill.balanceDue.toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Due Date</div>
                  <div className="text-xs font-semibold text-stone-300">{bill.dueDate}</div>
                </div>
                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl space-y-1">
                  <div className="text-[10px] text-stone-500 uppercase font-bold">Warehouse</div>
                  <div className="text-xs font-semibold text-stone-300 truncate">{warehouse.name}</div>
                </div>
              </div>

              {/* Linked PO & General Ledger Details */}
              <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    Double-Entry General Ledger Status:
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">
                    {linkedJe ? linkedJe.entryNumber : 'Posted'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-400 pt-1 border-t border-stone-800/60">
                  <div>
                    Debit: <span className="text-stone-200 font-mono">1200 Merchandise Inventory Asset</span> (${bill.subtotal.toFixed(2)})
                  </div>
                  <div>
                    Credit: <span className="text-stone-200 font-mono">2000 Accounts Payable (Trade)</span> (${bill.totalAmount.toFixed(2)})
                  </div>
                  {linkedPo && (
                    <div className="sm:col-span-2">
                      Linked Purchase Order:{' '}
                      <span className="text-sky-300 font-mono font-semibold">{linkedPo.poNumber}</span> (3-Way Matching Verified)
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-200">Purchased Line Items</h4>
                <div className="bg-stone-950/70 border border-stone-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-800 bg-stone-900/50 text-[10px] text-stone-400 uppercase">
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Tax</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {bill.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="p-2.5">
                            <div className="font-medium text-stone-200">{line.productName}</div>
                            <div className="text-[10px] font-mono text-stone-500">{line.productCode}</div>
                          </td>
                          <td className="p-2.5 text-center font-mono text-stone-200">{line.quantity}</td>
                          <td className="p-2.5 text-right font-mono text-stone-300">${line.unitPrice.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-mono text-stone-400">{line.taxPercent}%</td>
                          <td className="p-2.5 text-right font-mono font-bold text-stone-100">
                            ${line.lineTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotals */}
                <div className="flex justify-end p-2 text-xs">
                  <div className="w-56 space-y-1">
                    <div className="flex justify-between text-stone-400">
                      <span>Subtotal:</span>
                      <span className="font-mono text-stone-200">${bill.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>Tax Amount:</span>
                      <span className="font-mono text-stone-200">${bill.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-stone-100 pt-1 border-t border-stone-800">
                      <span>Grand Total:</span>
                      <span className="font-mono text-emerald-400">${bill.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Document Attachment View */
            <div className="space-y-3">
              <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-medium text-stone-200">{bill.scannedFileName || `${bill.billNumber}_Scanned.pdf`}</span>
                    <span className="text-[10px] text-stone-500 ml-2">
                      ({bill.scannedFileType?.toUpperCase() || 'PDF'} • {bill.scannedFileSize || 'Document Archive'})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-mono">
                  OCR Verified
                </span>
              </div>

              {/* Simulated Document Canvas Sheet */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-6 min-h-[360px] flex flex-col justify-between shadow-inner">
                {bill.scannedFileUrl ? (
                  <div className="flex items-center justify-center">
                    <img
                      src={bill.scannedFileUrl}
                      alt="Scanned Bill"
                      className="max-h-[340px] rounded-xl object-contain border border-stone-800 shadow-md"
                    />
                  </div>
                ) : (
                  <div className="space-y-6 font-mono text-xs">
                    {/* Simulated High-Res Invoice Header */}
                    <div className="flex items-start justify-between border-b border-stone-800 pb-4">
                      <div>
                        <div className="text-base font-bold text-stone-100">{bill.vendorName}</div>
                        <div className="text-[10px] text-stone-400 mt-1">
                          100 Technology Plaza, Suite 400 • Vendor ID: {bill.vendorId}
                        </div>
                        <div className="text-[10px] text-stone-500">Tax ID / VAT: US-94819022</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-400">VENDOR TAX INVOICE</div>
                        <div className="text-[11px] text-stone-300 mt-1 font-bold">INV: {bill.billNumber}</div>
                        <div className="text-[10px] text-stone-400">Date: {bill.billDate}</div>
                        <div className="text-[10px] text-stone-400">Due: {bill.dueDate}</div>
                      </div>
                    </div>

                    {/* Bill To */}
                    <div className="text-[11px] text-stone-300">
                      <span className="text-stone-500 text-[10px] uppercase block">Billed To:</span>
                      Maxerp Corp. • Main Warehouse ({warehouse.name})
                    </div>

                    {/* Items table */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-12 text-[10px] text-stone-500 border-b border-stone-800 pb-1 uppercase">
                        <div className="col-span-6">Description</div>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-2 text-right">Price</div>
                        <div className="col-span-2 text-right">Total</div>
                      </div>
                      {bill.lines.map((l) => (
                        <div key={l.id} className="grid grid-cols-12 text-[11px] py-1 border-b border-stone-850">
                          <div className="col-span-6 text-stone-200">
                            {l.productName} <span className="text-stone-500 text-[10px]">({l.productCode})</span>
                          </div>
                          <div className="col-span-2 text-center text-stone-300">{l.quantity}</div>
                          <div className="col-span-2 text-right text-stone-300">${l.unitPrice.toFixed(2)}</div>
                          <div className="col-span-2 text-right text-emerald-400 font-bold">
                            ${l.lineTotal.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end pt-2">
                      <div className="w-48 text-right space-y-1 text-[11px]">
                        <div className="text-stone-400">Subtotal: ${bill.subtotal.toFixed(2)}</div>
                        <div className="text-stone-400">Tax (8.25%): ${bill.taxAmount.toFixed(2)}</div>
                        <div className="text-sm font-bold text-emerald-400 border-t border-stone-800 pt-1">
                          Total Due: ${bill.totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Optical Stamp Footer */}
                    <div className="pt-4 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-500">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Maxerp Optical Scanner: Verified Authentic & Validated</span>
                      </div>
                      <div>Archive Ref: MAX-DOC-{bill.id}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="text-xs text-stone-400">
            Current balance owed: <span className="font-mono font-bold text-stone-200">${bill.balanceDue.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            {bill.balanceDue > 0 && onRecordPayment && (
              <button
                onClick={() => {
                  onClose();
                  onRecordPayment(bill);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition"
              >
                Record Vendor Payment
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
