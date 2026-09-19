import React, { useState } from 'react';
import { Search, X, Package, Users, FileText, ShoppingCart, Receipt, Hash } from 'lucide-react';
import { useErp } from '../context/ErpContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { partners, products, salesOrders, invoices, accounts } = useErp();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredPartners = q
    ? partners.filter((p) => p.name.toLowerCase().includes(q) || p.taxNumber.toLowerCase().includes(q))
    : [];

  const filteredProducts = q
    ? products.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.barcode.includes(q))
    : [];

  const filteredOrders = q
    ? salesOrders.filter((s) => s.orderNumber.toLowerCase().includes(q) || s.partnerName.toLowerCase().includes(q))
    : [];

  const filteredInvoices = q
    ? invoices.filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.partnerName.toLowerCase().includes(q))
    : [];

  const filteredAccounts = q
    ? accounts.filter((a) => a.name.toLowerCase().includes(q) || a.code.includes(q))
    : [];

  const totalMatches =
    filteredPartners.length +
    filteredProducts.length +
    filteredOrders.length +
    filteredInvoices.length +
    filteredAccounts.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-4 pt-16">
      <div className="w-full max-w-xl bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-stone-800 bg-stone-950/80">
          <Search className="w-5 h-5 text-stone-400 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search partners, products, invoices, orders, accounts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-stone-400 hover:text-stone-200 mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700"
          >
            Esc
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="py-8 text-center text-xs text-stone-500">
              Type to search globally across all Maxerp connected records...
            </div>
          )}

          {query && totalMatches === 0 && (
            <div className="py-8 text-center text-xs text-stone-400">
              No ERP records found matching "{query}"
            </div>
          )}

          {filteredPartners.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
                Customers & Vendors ({filteredPartners.length})
              </span>
              <div className="space-y-1.5">
                {filteredPartners.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate('partners');
                      onClose();
                    }}
                    className="p-2.5 bg-stone-950 hover:bg-stone-800 rounded-xl cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-sky-400" />
                      <div>
                        <p className="text-xs font-semibold text-stone-200">{p.name}</p>
                        <p className="text-[10px] text-stone-400">
                          {p.type.toUpperCase()} • Balance: ${p.currentBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
                Products & Inventory ({filteredProducts.length})
              </span>
              <div className="space-y-1.5">
                {filteredProducts.map((pr) => (
                  <div
                    key={pr.id}
                    onClick={() => {
                      onNavigate('inventory');
                      onClose();
                    }}
                    className="p-2.5 bg-stone-950 hover:bg-stone-800 rounded-xl cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="text-xs font-semibold text-stone-200">{pr.name}</p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          {pr.code} • ${pr.sellingPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredOrders.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
                Sales Orders ({filteredOrders.length})
              </span>
              <div className="space-y-1.5">
                {filteredOrders.map((so) => (
                  <div
                    key={so.id}
                    onClick={() => {
                      onNavigate('sales');
                      onClose();
                    }}
                    className="p-2.5 bg-stone-950 hover:bg-stone-800 rounded-xl cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShoppingCart className="w-4 h-4 text-indigo-400" />
                      <div>
                        <p className="text-xs font-semibold text-stone-200">{so.orderNumber}</p>
                        <p className="text-[10px] text-stone-400">
                          {so.partnerName} • ${so.totalAmount.toFixed(2)} ({so.status})
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredInvoices.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
                Invoices ({filteredInvoices.length})
              </span>
              <div className="space-y-1.5">
                {filteredInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onNavigate('invoices');
                      onClose();
                    }}
                    className="p-2.5 bg-stone-950 hover:bg-stone-800 rounded-xl cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Receipt className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-xs font-semibold text-stone-200">{inv.invoiceNumber}</p>
                        <p className="text-[10px] text-stone-400">
                          {inv.partnerName} • ${inv.totalAmount.toFixed(2)} ({inv.status})
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredAccounts.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
                Chart of Accounts ({filteredAccounts.length})
              </span>
              <div className="space-y-1.5">
                {filteredAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => {
                      onNavigate('accounting');
                      onClose();
                    }}
                    className="p-2.5 bg-stone-950 hover:bg-stone-800 rounded-xl cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <Hash className="w-4 h-4 text-rose-400" />
                      <div>
                        <p className="text-xs font-semibold text-stone-200">
                          {acc.code} - {acc.name}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {acc.category} • Balance: ${acc.currentBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
