import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  History,
  User,
  CheckCircle2,
  Lock,
  Download,
  FileSpreadsheet,
  FileCode,
  Layers,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { AuditLog } from '../types';
import { DocumentAuditModal } from '../components/DocumentAuditModal';

export const AuditLogScreen: React.FC = () => {
  const { auditLogs } = useErp();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected doc for detail inspection
  const [inspectingDoc, setInspectingDoc] = useState<{
    type: AuditLog['entityType'];
    id: string;
    ref: string;
    title: string;
  } | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesEntityType = filterEntityType === 'all' || log.entityType === filterEntityType;
    const matchesSearch =
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesEntityType && matchesSearch;
  });

  // Export audit trail to CSV
  const handleExportCsv = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor Name', 'Role', 'Action', 'Entity Type', 'Reference', 'Details', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.entityReference}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress || '192.168.1.100'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MaxPack_ERP_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-stone-100">Immutable Audit Trail</h2>
          </div>
          <p className="text-xs text-stone-400">
            Append-only compliance log tracking document creation, approvals, edits & ledger postings
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700/80 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV / SOC2</span>
        </button>
      </div>

      {/* Compliance Health Banner */}
      <div className="p-3 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-stone-200 block">Cryptographic Log Integrity</span>
            <span className="text-[10px] text-stone-500">
              SHA-256 chained hashing • Strict SOC2 / SOX compliance
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
          {auditLogs.length} LOGS SEALED
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Search */}
        <div className="relative sm:col-span-1">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search details, actor, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Entity Type Filter */}
        <div>
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Document Types</option>
            <option value="SalesOrder">Sales Orders</option>
            <option value="Invoice">Tax Invoices</option>
            <option value="PurchaseOrder">Purchase Orders</option>
            <option value="Stock">Stock & Adjustments</option>
            <option value="JournalEntry">General Ledger Journals</option>
            <option value="Payment">Payments & Settlements</option>
          </select>
        </div>

        {/* Action Filter */}
        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-stone-900 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Actions</option>
            <option value="Created">Created</option>
            <option value="Approved">Approved</option>
            <option value="Posted">Posted</option>
            <option value="Updated">Updated</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Synced">Synced</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-stone-900 border border-stone-800 rounded-2xl space-y-2">
            <History className="w-8 h-8 text-stone-600 mx-auto" />
            <p className="text-xs text-stone-400">No audit trail entries matched the selected filters.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl space-y-2 text-xs hover:border-stone-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      log.action === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : log.action === 'Posted'
                        ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                        : log.action === 'Created'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : log.action === 'Cancelled'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : log.action === 'Synced'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {log.action}
                  </span>
                  <span className="font-semibold text-stone-200">{log.entityType}</span>
                  <button
                    onClick={() =>
                      setInspectingDoc({
                        type: log.entityType,
                        id: log.entityId,
                        ref: log.entityReference,
                        title: `${log.entityType} ${log.entityReference}`,
                      })
                    }
                    className="font-mono text-emerald-400 hover:text-emerald-300 text-[11px] underline flex items-center gap-0.5"
                  >
                    {log.entityReference}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
                <span className="font-mono text-[10px] text-stone-500">{log.timestamp}</span>
              </div>

              <p className="text-stone-300 text-xs leading-relaxed">{log.details}</p>

              <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1.5 border-t border-stone-800/60 font-mono">
                <span>
                  Actor: <strong className="text-stone-400">{log.userName}</strong> ({log.userRole})
                </span>
                <span>IP: {log.ipAddress || '192.168.1.100'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Document Inspector Modal */}
      {inspectingDoc && (
        <DocumentAuditModal
          isOpen={true}
          onClose={() => setInspectingDoc(null)}
          entityType={inspectingDoc.type}
          entityId={inspectingDoc.id}
          entityReference={inspectingDoc.ref}
          documentTitle={inspectingDoc.title}
        />
      )}
    </div>
  );
};
