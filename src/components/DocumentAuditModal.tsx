import React from 'react';
import { ShieldCheck, X, Clock, User, CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { AuditLog } from '../types';

interface DocumentAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: AuditLog['entityType'];
  entityId: string;
  entityReference: string;
  documentTitle?: string;
}

export const DocumentAuditModal: React.FC<DocumentAuditModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityReference,
  documentTitle,
}) => {
  const { auditLogs } = useErp();

  if (!isOpen) return null;

  // Filter audit logs for this specific document
  const documentLogs = auditLogs.filter(
    (log) =>
      log.entityId === entityId ||
      log.entityReference.toLowerCase() === entityReference.toLowerCase() ||
      log.details.includes(entityReference)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-stone-100">Document Audit Trail</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-emerald-400 font-mono font-semibold">
                  {entityReference}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {documentTitle || `${entityType} Immutable Lifecycle History`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-stone-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {documentLogs.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Clock className="w-8 h-8 text-stone-600 mx-auto" />
              <p className="text-xs text-stone-400">No specific historical audit records found for this ID.</p>
              <p className="text-[11px] text-stone-500">
                Actions on newly generated documents are immediately recorded in the tamper-proof ledger.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-800">
              {documentLogs.map((log, index) => {
                const isLatest = index === 0;
                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node */}
                    <div
                      className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        log.action === 'Approved'
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                          : log.action === 'Posted'
                          ? 'bg-teal-950 border-teal-500 text-teal-400'
                          : log.action === 'Created'
                          ? 'bg-sky-950 border-sky-500 text-sky-400'
                          : log.action === 'Cancelled'
                          ? 'bg-red-950 border-red-500 text-red-400'
                          : 'bg-stone-900 border-stone-600 text-stone-300'
                      }`}
                    >
                      {log.action[0]}
                    </div>

                    {/* Card */}
                    <div
                      className={`p-3.5 rounded-2xl border transition ${
                        isLatest
                          ? 'bg-stone-950 border-emerald-500/40 shadow-sm'
                          : 'bg-stone-950/70 border-stone-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                              log.action === 'Approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : log.action === 'Posted'
                                ? 'bg-teal-500/20 text-teal-300'
                                : log.action === 'Created'
                                ? 'bg-sky-500/20 text-sky-300'
                                : log.action === 'Cancelled'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-stone-800 text-stone-300'
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="text-xs font-semibold text-stone-200">
                            by {log.userName}
                          </span>
                          <span className="text-[10px] text-stone-400">({log.userRole})</span>
                        </div>
                        <span className="font-mono text-[10px] text-stone-500 shrink-0">
                          {log.timestamp}
                        </span>
                      </div>

                      <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                        {log.details}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-2 mt-2 border-t border-stone-800/60">
                        <span>IP: {log.ipAddress || '192.168.1.100'}</span>
                        <span className="text-stone-400">Log ID: {log.id}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-800 bg-stone-950/50 flex items-center justify-between text-xs text-stone-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Cryptographically sealed & immutable
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
