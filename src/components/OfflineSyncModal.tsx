import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { useErp } from '../context/ErpContext';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    isOnline,
    setIsOnline,
    offlineQueue,
    isSyncing,
    syncOfflineQueue,
    resolveConflict,
  } = useErp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm">Android Sync Engine</h3>
              <p className="text-xs text-stone-400">Offline Room DB & Conflict Resolution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-stone-200 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Network Toggle Banner */}
          <div className="flex items-center justify-between p-3.5 bg-stone-950 rounded-2xl border border-stone-800">
            <div>
              <span className="text-xs font-semibold text-stone-200 block">Simulate Network Connectivity</span>
              <p className="text-[11px] text-stone-400">
                {isOnline
                  ? 'Device is online. Operations commit immediately to PostgreSQL.'
                  : 'Device is offline. Entries queued in local encrypted Room DB.'}
              </p>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                isOnline
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-amber-600/20 text-amber-400 border border-amber-500/40 hover:bg-amber-600/30'
              }`}
            >
              {isOnline ? 'Connected' : 'Offline'}
            </button>
          </div>

          {/* Pending Queue Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-300">
                Pending Offline Queue ({offlineQueue.length})
              </span>
              {isOnline && offlineQueue.length > 0 && (
                <button
                  onClick={syncOfflineQueue}
                  disabled={isSyncing}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
            </div>

            {offlineQueue.length === 0 ? (
              <div className="p-4 bg-stone-950/50 border border-stone-800/80 rounded-2xl text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-medium text-stone-300">Local Cache Fully Synchronized</p>
                <p className="text-[11px] text-stone-500">All local mutations have verified parity with the backend.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {offlineQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-200">{item.action}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                            item.status === 'conflict'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {item.payload.orderNumber || item.payload.invoiceNumber || item.id}
                      </p>
                    </div>

                    {item.status === 'conflict' && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => resolveConflict(item.id, 'client_wins')}
                          className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-[10px] font-medium"
                        >
                          Client Wins
                        </button>
                        <button
                          onClick={() => resolveConflict(item.id, 'server_wins')}
                          className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700/50 rounded-lg text-[10px] font-medium"
                        >
                          Server Wins
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conflict Resolution Rules Explained */}
          <div className="p-3.5 bg-stone-950/60 border border-stone-800 rounded-2xl space-y-1.5 text-xs text-stone-400">
            <div className="flex items-center gap-1.5 font-medium text-stone-300 text-xs">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Offline Architecture Specs</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li><strong>Local Storage:</strong> Encrypted SQLite via SQLCipher & Room ORM.</li>
              <li><strong>Background Worker:</strong> Android WorkManager with exponential backoff.</li>
              <li><strong>Vector Clocks:</strong> Deterministic document revision counters (e.g., rev_4).</li>
              <li><strong>Financial Transactions:</strong> Server verifies ledger idempotency keys before posting.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
