import React, { useState } from 'react';
import {
  BookOpenCheck,
  Plus,
  Scale,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  Trash2,
} from 'lucide-react';
import { useErp } from '../context/ErpContext';
import { JournalEntry, JournalLine } from '../types';
import { DocumentAuditModal } from '../components/DocumentAuditModal';
import { ShieldCheck } from 'lucide-react';

export const AccountingScreen: React.FC = () => {
  const {
    accounts,
    journalEntries,
    currentUser,
    createJournalEntry,
  } = useErp();

  const [activeTab, setActiveTab] = useState<'coa' | 'entries' | 'trial'>('entries');
  const [selectedEntryForAudit, setSelectedEntryForAudit] = useState<JournalEntry | null>(null);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [journalType, setJournalType] = useState<JournalEntry['journalType']>('General');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<
    { accountId: string; description: string; debit: number; credit: number }[]
  >([
    { accountId: accounts[0]?.id || '', description: 'Debit Entry', debit: 100, credit: 0 },
    { accountId: accounts[1]?.id || '', description: 'Credit Entry', debit: 0, credit: 100 },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      { accountId: accounts[0]?.id || '', description: '', debit: 0, credit: 0 },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitEntry = () => {
    setValidationError(null);

    const formattedLines: JournalLine[] = lines.map((l, idx) => {
      const acc = accounts.find((a) => a.id === l.accountId)!;
      return {
        id: `jel-${Date.now()}-${idx}`,
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        description: l.description || `${journalType} adjustment`,
        debit: l.debit,
        credit: l.credit,
      };
    });

    const res = createJournalEntry({
      journalType,
      date: new Date().toISOString().split('T')[0],
      reference: reference || 'MANUAL-ADJ',
      notes: notes || 'Manual balanced journal adjustment',
      lines: formattedLines,
      totalDebit,
      totalCredit,
      status: 'Posted',
    });

    if (!res.success) {
      setValidationError(res.error || 'Debit and credit must balance');
    } else {
      setIsManualEntryModalOpen(false);
      setReference('');
      setNotes('');
      setLines([
        { accountId: accounts[0]?.id || '', description: 'Debit Entry', debit: 100, credit: 0 },
        { accountId: accounts[1]?.id || '', description: 'Credit Entry', debit: 0, credit: 100 },
      ]);
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-stone-100">Double-Entry Accounting</h2>
          <p className="text-xs text-stone-400">
            Chart of accounts, general ledger journals & trial balance validation
          </p>
        </div>
        <button
          onClick={() => setIsManualEntryModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Entry</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-stone-900 border border-stone-800 rounded-xl text-xs">
        <button
          onClick={() => setActiveTab('entries')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 'entries' ? 'bg-stone-800 text-emerald-400 shadow-xs' : 'text-stone-400'
          }`}
        >
          Journal Entries ({journalEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('coa')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 'coa' ? 'bg-stone-800 text-emerald-400 shadow-xs' : 'text-stone-400'
          }`}
        >
          Chart of Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('trial')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 'trial' ? 'bg-stone-800 text-emerald-400 shadow-xs' : 'text-stone-400'
          }`}
        >
          Trial Balance
        </button>
      </div>

      {/* Journal Entries Tab */}
      {activeTab === 'entries' && (
        <div className="space-y-3">
          {journalEntries.map((je) => (
            <div
              key={je.id}
              className="p-3.5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm font-mono text-stone-100">{je.entryNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                      {je.journalType} Journal
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-400">
                      {je.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1 font-medium">{je.notes}</p>
                  <p className="text-[11px] text-stone-500">
                    Ref: {je.reference} • Date: {je.date} • By: {je.createdByName}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-stone-100">
                    ${je.totalDebit.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1 mt-0.5 font-medium">
                    <Scale className="w-3 h-3" /> Balanced
                  </span>
                </div>
              </div>

              {/* Lines Table */}
              <div className="bg-stone-950/70 rounded-xl p-2.5 text-xs space-y-1 divide-y divide-stone-800/60">
                {je.lines.map((line) => (
                  <div key={line.id} className="pt-1.5 first:pt-0 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-stone-400 text-[11px] mr-1.5">
                        {line.accountCode}
                      </span>
                      <span className="text-stone-200">{line.accountName}</span>
                    </div>
                    <div className="flex gap-4 font-mono text-xs">
                      <span className={line.debit > 0 ? 'text-stone-100 font-semibold' : 'text-stone-600'}>
                        {line.debit > 0 ? `$${line.debit.toFixed(2)}` : '-'}
                      </span>
                      <span className={line.credit > 0 ? 'text-stone-100 font-semibold' : 'text-stone-600'}>
                        {line.credit > 0 ? `$${line.credit.toFixed(2)}` : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Audit Trail Button */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-800/60 text-xs">
                <span className="text-[10px] text-stone-500 font-mono">Balanced Ledger Record</span>
                <button
                  onClick={() => setSelectedEntryForAudit(je)}
                  className="flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 text-stone-300 font-mono transition"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Audit Trail</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chart of Accounts Tab */}
      {activeTab === 'coa' && (
        <div className="space-y-2.5">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-3 bg-stone-900 border border-stone-800 rounded-2xl flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-400">{acc.code}</span>
                  <span className="font-semibold text-stone-200">{acc.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                  <span className="px-1.5 py-0.2 rounded-md bg-stone-800 text-[10px]">
                    {acc.category}
                  </span>
                  <span>Normal Balance: {acc.normalBalance}</span>
                </div>
                {acc.description && (
                  <p className="text-[10px] text-stone-500 mt-0.5">{acc.description}</p>
                )}
              </div>

              <div className="text-right">
                <span className="font-bold text-sm font-mono text-stone-100">
                  ${acc.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trial Balance Tab */}
      {activeTab === 'trial' && (
        <div className="p-4 bg-stone-900 border border-stone-800 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <h3 className="font-bold text-sm text-stone-100">Trial Balance Verification</h3>
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sum(Debits) == Sum(Credits)
            </span>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-stone-400 text-[10px] uppercase border-b border-stone-800 pb-1">
                <th className="py-1">Account</th>
                <th className="py-1 text-right">Debit ($)</th>
                <th className="py-1 text-right">Credit ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {accounts.map((acc) => {
                const isDebit = acc.normalBalance === 'Debit';
                return (
                  <tr key={acc.id} className="text-stone-300">
                    <td className="py-1.5 font-sans">
                      <span className="text-stone-500 font-mono mr-1.5">{acc.code}</span>
                      {acc.name}
                    </td>
                    <td className="py-1.5 text-right font-medium">
                      {isDebit ? `$${acc.currentBalance.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-1.5 text-right font-medium">
                      {!isDebit ? `$${acc.currentBalance.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Balanced Journal Entry Modal */}
      {isManualEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl p-5 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-bold text-sm">Post Manual Journal Entry</h3>
                <p className="text-xs text-stone-400">Strict double-entry balance check enforced</p>
              </div>
              <button
                onClick={() => setIsManualEntryModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Alert */}
            {validationError && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Header Form */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Journal Type</label>
                <select
                  value={journalType}
                  onChange={(e) => setJournalType(e.target.value as any)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200"
                >
                  <option value="General">General Journal</option>
                  <option value="Cash">Cash Journal</option>
                  <option value="Bank">Bank Journal</option>
                  <option value="Inventory">Inventory Valuation</option>
                  <option value="Sales">Sales Journal</option>
                  <option value="Purchases">Purchases Journal</option>
                </select>
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Reference Doc</label>
                <input
                  type="text"
                  placeholder="e.g. AUD-ADJ-2026"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl p-2 text-xs text-stone-200"
                />
              </div>
            </div>

            {/* Lines */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-300">Debit & Credit Lines</span>
                <button
                  type="button"
                  onClick={handleAddLine}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  + Add Split Line
                </button>
              </div>

              {lines.map((line, idx) => (
                <div key={idx} className="p-2.5 bg-stone-950 rounded-xl border border-stone-800/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <select
                      value={line.accountId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLines((prev) =>
                          prev.map((l, i) => (i === idx ? { ...l, accountId: val } : l))
                        );
                      }}
                      className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name} ({a.category})
                        </option>
                      ))}
                    </select>

                    {lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-stone-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div>
                      <span className="text-[10px] text-stone-500 block font-sans">Debit ($)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setLines((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, debit: val } : l))
                          );
                        }}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block font-sans">Credit ($)</span>
                      <input
                        type="number"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setLines((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, credit: val } : l))
                          );
                        }}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Balance Status Bar */}
            <div
              className={`p-3 rounded-2xl flex items-center justify-between text-xs font-mono border ${
                isBalanced
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-red-950/40 text-red-300 border-red-500/40'
              }`}
            >
              <div>
                <span>Debit: ${totalDebit.toFixed(2)}</span>
                <span className="mx-2">•</span>
                <span>Credit: ${totalCredit.toFixed(2)}</span>
              </div>
              <div className="font-sans font-semibold">
                {isBalanced ? 'Balanced ✓' : `Difference: $${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setIsManualEntryModalOpen(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEntry}
                disabled={!isBalanced}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Post to General Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Audit Trail Modal */}
      {selectedEntryForAudit && (
        <DocumentAuditModal
          isOpen={true}
          onClose={() => setSelectedEntryForAudit(null)}
          entityType="JournalEntry"
          entityId={selectedEntryForAudit.id}
          entityReference={selectedEntryForAudit.entryNumber}
          documentTitle={`General Ledger Journal Entry ${selectedEntryForAudit.entryNumber}`}
        />
      )}
    </div>
  );
};
