import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { useErp } from '../context/ErpContext';

interface CleanDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CleanDataModal: React.FC<CleanDataModalProps> = ({ isOpen, onClose }) => {
  const {
    salesOrders,
    invoices,
    purchaseOrders,
    vendorBills,
    payments,
    partners,
    products,
    journalEntries,
    cleanAllData,
  } = useErp();

  const [includeMasterData, setIncludeMasterData] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const totalTransactions =
    salesOrders.length +
    invoices.length +
    purchaseOrders.length +
    vendorBills.length +
    payments.length +
    journalEntries.length;

  const handleExecuteClean = () => {
    cleanAllData({ includeMasterData });
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-100">Clean All Data & Production Reset</h3>
              <p className="text-[11px] text-stone-400">Purge demo records and initialize pristine state</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-stone-100">System Cleaned Successfully</h4>
            <p className="text-xs text-stone-400">All data has been reset to pristine production slate.</p>
          </div>
        ) : (
          <>
            {/* Current State Summary */}
            <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-2xl space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Current Database Footprint
              </span>
              <div className="grid grid-cols-2 gap-2 text-stone-300">
                <div className="flex justify-between border-b border-stone-800/60 pb-1">
                  <span className="text-stone-400">Sales Orders:</span>
                  <span className="font-mono font-semibold">{salesOrders.length}</span>
                </div>
                <div className="flex justify-between border-b border-stone-800/60 pb-1">
                  <span className="text-stone-400">Invoices:</span>
                  <span className="font-mono font-semibold">{invoices.length}</span>
                </div>
                <div className="flex justify-between border-b border-stone-800/60 pb-1">
                  <span className="text-stone-400">Purchase Orders:</span>
                  <span className="font-mono font-semibold">{purchaseOrders.length}</span>
                </div>
                <div className="flex justify-between border-b border-stone-800/60 pb-1">
                  <span className="text-stone-400">Journal Entries:</span>
                  <span className="font-mono font-semibold">{journalEntries.length}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-stone-400">Partners (Cust/Vend):</span>
                  <span className="font-mono font-semibold">{partners.length}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-stone-400">Products Catalog:</span>
                  <span className="font-mono font-semibold">{products.length}</span>
                </div>
              </div>
            </div>

            {/* Warning description */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">Production Transition Notice</p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Executing this clean slate action will wipe transactions, journal entries, invoice records, and reset chart of accounts balances to zero. An immutable audit log entry will document the reset.
                </p>
              </div>
            </div>

            {/* Checkbox option */}
            <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer select-none px-1">
              <input
                type="checkbox"
                checked={includeMasterData}
                onChange={(e) => setIncludeMasterData(e.target.checked)}
                className="w-4 h-4 rounded-sm bg-stone-950 border-stone-700 text-red-600 focus:ring-0"
              />
              <span>Also purge custom partners and product catalog definitions</span>
            </label>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteClean}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-950 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Execute Clean Slate</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
