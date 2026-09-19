import React, { useState } from 'react';
import {
  Receipt,
  FileCheck,
  CreditCard,
  Printer,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  X,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { Invoice } from '../types';
import { InvoicePdfModal } from '../components/InvoicePdfModal';
import { DocumentAuditModal } from '../components/DocumentAuditModal';
import { ShieldCheck } from 'lucide-react';

export const InvoicesScreen: React.FC = () => {
  const {
    invoices,
    currentUser,
    accounts,
    postInvoice,
    recordPayment,
  } = useErp();

  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState<Invoice | null>(null);
  const [selectedInvoiceForAudit, setSelectedInvoiceForAudit] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Credit Card' | 'Cheque'>('Bank Transfer');
  const [selectedAccountId, setSelectedAccountId] = useState('acc-1010');

  const canPost = currentUser.role === 'Accountant' || currentUser.role === 'Administrator' || currentUser.role === 'Manager';

  const handleOpenPayment = (inv: Invoice) => {
    setPaymentTargetInvoice(inv);
    setPaymentAmount(inv.balanceDue);
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!paymentTargetInvoice || paymentAmount <= 0) return;

    recordPayment({
      date: new Date().toISOString().split('T')[0],
      type: 'Customer Receipt',
      partnerId: paymentTargetInvoice.partnerId,
      partnerName: paymentTargetInvoice.partnerName,
      amount: paymentAmount,
      paymentMethod,
      bankAccountId: selectedAccountId,
      invoiceId: paymentTargetInvoice.id,
      referenceNotes: `Settlement for invoice ${paymentTargetInvoice.invoiceNumber}`,
    });

    setIsPaymentModalOpen(false);
    setPaymentTargetInvoice(null);
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-stone-100">Invoices & Receivables</h2>
        <p className="text-xs text-stone-400">
          Tax invoicing, payment collections, and automated General Ledger postings
        </p>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {invoices.map((inv) => {
          const isOverdue = inv.status === 'Overdue';
          const isPaid = inv.status === 'Paid';
          const isDraft = inv.status === 'Draft';
          const isPosted = inv.status === 'Posted';

          return (
            <div
              key={inv.id}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3"
            >
              {/* Row 1 */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-mono text-stone-100">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isOverdue
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isDraft
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-stone-300 mt-1">{inv.partnerName}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                    <span>Issued: {inv.issueDate}</span>
                    <span>•</span>
                    <span className={isOverdue ? 'text-red-400 font-semibold' : ''}>
                      Due: {inv.dueDate}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-sm font-mono text-stone-100">
                    ${inv.totalAmount.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    Due:{' '}
                    <strong className="font-mono text-emerald-400">
                      ${inv.balanceDue.toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Status Note or Journal Entry ID */}
              {inv.journalEntryId && (
                <div className="text-[10px] text-stone-500 font-mono flex items-center gap-1.5 bg-stone-950/60 px-2 py-1 rounded-lg">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Posted to General Ledger via Balanced Journal Entry</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-800/80 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedInvoiceForPdf(inv)}
                    className="flex items-center gap-1 text-xs text-stone-300 hover:text-white font-medium py-1"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Tax PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoiceForAudit(inv)}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 text-stone-300 font-mono transition"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Audit</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  {/* Post to GL button for Draft invoices */}
                  {isDraft && canPost && (
                    <button
                      onClick={() => postInvoice(inv.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <FileCheck className="w-3.5 h-3.5" /> Post to GL
                    </button>
                  )}

                  {/* Record Payment Button */}
                  {!isPaid && !isDraft && (
                    <button
                      onClick={() => handleOpenPayment(inv)}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Record Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Recording Modal */}
      {isPaymentModalOpen && paymentTargetInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">Record Customer Payment</h3>
                <p className="text-xs text-stone-400">{paymentTargetInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-stone-400 block mb-1">Customer</span>
                <p className="font-semibold text-stone-200">{paymentTargetInvoice.partnerName}</p>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Receipt Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  max={paymentTargetInvoice.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-sm font-mono text-stone-100 font-semibold"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Remaining balance due: ${paymentTargetInvoice.balanceDue.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200"
                >
                  <option value="Bank Transfer">Bank Wire / ACH Transfer</option>
                  <option value="Credit Card">Corporate Credit Card</option>
                  <option value="Cash">Cash Receipt</option>
                  <option value="Cheque">Company Cheque</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Deposit To Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200"
                >
                  {accounts
                    .filter((a) => a.category === 'Asset' && (a.code.startsWith('1010') || a.code.startsWith('1020')))
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name} (${acc.currentBalance.toFixed(2)})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Post Payment & Settle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Modal */}
      <InvoicePdfModal
        invoice={selectedInvoiceForPdf}
        isOpen={!!selectedInvoiceForPdf}
        onClose={() => setSelectedInvoiceForPdf(null)}
      />

      {/* Document Audit Modal */}
      {selectedInvoiceForAudit && (
        <DocumentAuditModal
          isOpen={true}
          onClose={() => setSelectedInvoiceForAudit(null)}
          entityType="Invoice"
          entityId={selectedInvoiceForAudit.id}
          entityReference={selectedInvoiceForAudit.invoiceNumber}
          documentTitle={`Tax Invoice ${selectedInvoiceForAudit.invoiceNumber} (${selectedInvoiceForAudit.partnerName})`}
        />
      )}
    </div>
  );
};
