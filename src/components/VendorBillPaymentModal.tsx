import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Building, Calendar, CheckCircle2 } from 'lucide-react';
import { VendorBill, ChartOfAccount } from '../types';
import { useErp } from '../context/ErpContext';

interface VendorBillPaymentModalProps {
  bill: VendorBill | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bill: VendorBill, amount: number, method: 'Bank Transfer' | 'Cash' | 'Credit Card' | 'Cheque', accountId: string) => void;
}

export const VendorBillPaymentModal: React.FC<VendorBillPaymentModalProps> = ({
  bill,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { accounts } = useErp();
  const bankAccounts = accounts.filter(
    (a) => a.category === 'Asset' && (a.code.startsWith('10') || a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('cash'))
  );

  const [paymentAmount, setPaymentAmount] = useState<number>(bill?.balanceDue || 0);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cash' | 'Credit Card' | 'Cheque'>('Bank Transfer');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    bankAccounts[0]?.id || accounts[0]?.id || 'acc-1010'
  );

  // Sync state if bill changes
  React.useEffect(() => {
    if (bill) {
      setPaymentAmount(bill.balanceDue);
    }
  }, [bill]);

  if (!isOpen || !bill) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    onConfirm(bill, paymentAmount, paymentMethod, selectedAccountId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-100">Record Vendor Bill Payment</h3>
              <p className="text-[11px] text-stone-400">Bill: {bill.billNumber} • {bill.vendorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-stone-400 block mb-1">Outstanding Balance</label>
            <div className="p-2.5 bg-stone-950 border border-stone-800 rounded-xl text-amber-400 font-mono font-bold text-sm">
              ${bill.balanceDue.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="text-stone-400 block mb-1">Payment Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={bill.balanceDue}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-100 font-mono focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="text-stone-400 block mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200"
            >
              <option value="Bank Transfer">Bank Transfer (ACH / Wire)</option>
              <option value="Cash">Petty Cash</option>
              <option value="Credit Card">Corporate Credit Card</option>
              <option value="Cheque">Vendor Check</option>
            </select>
          </div>

          <div>
            <label className="text-stone-400 block mb-1">Disbursement Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200"
            >
              {(bankAccounts.length > 0 ? bankAccounts : accounts).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} (${a.currentBalance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-md"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
