import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Camera,
  Eye,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Building,
  Calendar,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { VendorBill } from '../types';

interface VendorBillsListProps {
  bills: VendorBill[];
  onOpenScanner: () => void;
  onViewDetail: (bill: VendorBill) => void;
  onRecordPayment: (bill: VendorBill) => void;
  onViewAudit: (bill: VendorBill) => void;
}

export const VendorBillsList: React.FC<VendorBillsListProps> = ({
  bills,
  onOpenScanner,
  onViewDetail,
  onRecordPayment,
  onViewAudit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Posted' | 'Paid' | 'Partially Paid'>('All');

  // Metrics
  const totalBilled = useMemo(() => bills.reduce((sum, b) => sum + b.totalAmount, 0), [bills]);
  const totalOutstanding = useMemo(() => bills.reduce((sum, b) => sum + b.balanceDue, 0), [bills]);
  const scannedDocsCount = useMemo(
    () => bills.filter((b) => b.scannedFileName || b.ocrExtracted).length,
    [bills]
  );
  const unpaidCount = useMemo(() => bills.filter((b) => b.balanceDue > 0).length, [bills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (statusFilter !== 'All' && bill.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = bill.billNumber.toLowerCase().includes(q);
        const matchesVendor = bill.vendorName.toLowerCase().includes(q);
        const matchesFile = bill.scannedFileName?.toLowerCase().includes(q) || false;
        const matchesLines = bill.lines.some(
          (l) => l.productName.toLowerCase().includes(q) || l.productCode.toLowerCase().includes(q)
        );
        if (!matchesNumber && !matchesVendor && !matchesFile && !matchesLines) return false;
      }
      return true;
    });
  }, [bills, statusFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* 1. Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-stone-900 border border-stone-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-medium">Total Billed</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base font-bold text-stone-100 font-mono">
            ${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-stone-400">{bills.length} Invoices Ingested</div>
        </div>

        <div className="p-3 bg-stone-900 border border-stone-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-medium">Outstanding A/P</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base font-bold text-amber-400 font-mono">
            ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-amber-400/80">{unpaidCount} Bills Pending Settlement</div>
        </div>

        <div className="p-3 bg-stone-900 border border-stone-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-medium">Scanned Documents</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <FileCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base font-bold text-purple-300 font-mono">
            {scannedDocsCount} Files
          </div>
          <div className="text-[10px] text-purple-400/80">99.4% OCR Confidence</div>
        </div>

        <div
          onClick={onOpenScanner}
          className="p-3 bg-gradient-to-br from-emerald-950/60 to-stone-900 border border-emerald-500/30 rounded-2xl space-y-1 cursor-pointer hover:border-emerald-500/60 transition group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span className="font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              Quick Ingestion
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500 text-stone-950 group-hover:scale-105 transition">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xs font-bold text-stone-100 group-hover:text-emerald-300 transition">
            Scan New Bill (PDF / JPEG)
          </div>
          <div className="text-[10px] text-emerald-400/70">Auto-update stock & GL</div>
        </div>
      </div>

      {/* 2. Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2 bg-stone-900 border border-stone-800 rounded-2xl text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
          <input
            type="text"
            placeholder="Search by bill #, vendor, or file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['All', 'Posted', 'Partially Paid', 'Paid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Bills Cards List */}
      {filteredBills.length === 0 ? (
        <div className="p-8 bg-stone-900 border border-stone-800 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-200">No vendor bills match your filter</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Scan paper invoices or upload PDFs and JPEGs to ingest bills automatically.
            </p>
          </div>
          <button
            onClick={onOpenScanner}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-md transition"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Bill Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBills.map((bill) => {
            const isPaid = bill.status === 'Paid';
            const isPartiallyPaid = bill.status === 'Partially Paid';
            const isPosted = bill.status === 'Posted';

            const fileTypeBadgeColor =
              bill.scannedFileType === 'pdf'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-sky-500/20 text-sky-300 border-sky-500/30';

            return (
              <div
                key={bill.id}
                className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 shadow-xs hover:border-stone-750 transition"
              >
                {/* Top Row: Identification and Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm font-mono text-stone-100">
                        {bill.billNumber}
                      </span>
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

                      {/* Scanned Document Badge */}
                      {bill.scannedFileName && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-mono flex items-center gap-1 ${fileTypeBadgeColor}`}
                          title={`Attached scanned document: ${bill.scannedFileName}`}
                        >
                          <FileCheck className="w-3 h-3" />
                          <span>
                            {bill.scannedFileType?.toUpperCase() || 'SCAN'} (OCR {bill.ocrConfidence || 99}%)
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-stone-400 flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-200">{bill.vendorName}</span>
                      <span>•</span>
                      <span>Billed: {bill.billDate}</span>
                      <span>•</span>
                      <span>Due: {bill.dueDate}</span>
                    </div>
                  </div>

                  {/* Right side amount */}
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-base text-stone-100">
                      ${bill.totalAmount.toFixed(2)}
                    </div>
                    <div
                      className={`text-[11px] font-mono font-semibold ${
                        bill.balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {bill.balanceDue > 0 ? `Due: $${bill.balanceDue.toFixed(2)}` : 'Fully Paid'}
                    </div>
                  </div>
                </div>

                {/* Scanned file name info & lines count */}
                <div className="p-2 bg-stone-950/70 border border-stone-850 rounded-xl flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate text-stone-300 text-[11px]">
                      {bill.scannedFileName || 'Scanned optical document'}
                    </span>
                    {bill.scannedFileSize && (
                      <span className="text-[10px] text-stone-500">({bill.scannedFileSize})</span>
                    )}
                  </div>

                  <span className="text-[11px] font-medium text-stone-400 shrink-0 ml-2">
                    {bill.lines.length} {bill.lines.length === 1 ? 'line item' : 'line items'}
                  </span>
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-800 text-xs gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewDetail(bill)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 font-medium transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Scanned Bill & GL</span>
                    </button>

                    <button
                      onClick={() => onViewAudit(bill)}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-400 hover:text-stone-300 transition"
                      title="View audit trail for this bill"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span>Audit</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {bill.balanceDue > 0 ? (
                      <button
                        onClick={() => onRecordPayment(bill)}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay Bill</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
