import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Copy, 
  Check, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { DatabaseStatus } from '../types';

interface SystemDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DatabaseStatus | null;
  onRefreshStatus: () => void;
}

export const SystemDiagnosticsModal: React.FC<SystemDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus,
}) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [copiedDockerCmd, setCopiedDockerCmd] = useState(false);
  const [activeTab, setActiveTab] = useState<'exasol' | 'audit'>('exasol');

  useEffect(() => {
    if (isOpen) {
      api.getAuditLogs().then(setAuditLogs).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dockerCommand = 'docker run --name exasol-mindbridge -p 8563:8563 -p 25826:25826 --detach --privileged exasol/docker-db:latest';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(dockerCommand);
    setCopiedDockerCmd(true);
    setTimeout(() => setCopiedDockerCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close diagnostics modal"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Exasol Personal & System Diagnostics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Database Adapter Inspection & Compliance Audit Trail
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 border-b border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('exasol')}
            className={`pb-2 text-xs font-bold border-b-2 transition-smooth ${
              activeTab === 'exasol'
                ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Exasol Engine & Schema
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2 text-xs font-bold border-b-2 transition-smooth ${
              activeTab === 'audit'
                ? 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>

        {activeTab === 'exasol' && (
          <div className="mt-6 space-y-6">
            
            {/* Status Card */}
            <div className={`p-4 rounded-xl border ${
              status?.is_mock
                ? 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
                : 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {status?.is_mock ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-sm">
                      Active Adapter: {status?.adapter_name}
                    </span>
                    <div className="text-xs opacity-90 mt-0.5">
                      {status?.is_mock
                        ? 'Running on Explicit Mock Exasol Adapter. All transactions operate in-memory with seeded development cohorts.'
                        : 'Connected to live Exasol Personal Database via pyexasol WebSocket.'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onRefreshStatus}
                  className="rounded-lg border border-slate-300 p-2 hover:bg-white/50 text-xs font-semibold"
                  title="Re-check Exasol connection"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Connection Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="text-slate-400">Host & Port</span>
                <div className="font-mono font-bold text-slate-800 dark:text-white mt-1">
                  {status?.host}:{status?.port}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="text-slate-400">Schema</span>
                <div className="font-mono font-bold text-slate-800 dark:text-white mt-1">
                  {status?.schema_name}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="text-slate-400">Active Participants</span>
                <div className="font-mono font-bold text-slate-800 dark:text-white mt-1">
                  {status?.active_participants_count} Profiles
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                <span className="text-slate-400">Task Results</span>
                <div className="font-mono font-bold text-slate-800 dark:text-white mt-1">
                  {status?.total_task_results_count} Rows
                </div>
              </div>
            </div>

            {/* Docker Instructions */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 space-y-2 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <Terminal className="w-4 h-4" /> Start Exasol Personal Locally (Docker)
                </div>
                <button
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  {copiedDockerCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDockerCmd ? 'Copied' : 'Copy Command'}
                </button>
              </div>

              <pre className="overflow-x-auto text-xs font-mono text-emerald-400 bg-black/40 p-2.5 rounded-lg">
                {dockerCommand}
              </pre>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                When Docker Desktop is running, execute the above command. Once Exasol starts on port 8563, restart the backend or click Refresh to immediately switch from the Explicit Mock Adapter to live Exasol Personal.
              </p>
            </div>

          </div>
        )}

        {activeTab === 'audit' && (
          <div className="mt-6 space-y-4">
            <div className="text-xs text-slate-500">
              Immutable audit records stored in the Exasol <code>AUDIT_LOGS</code> table for HIPAA & GDPR compliance.
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Action</th>
                    <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">User ID</th>
                    <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Resource</th>
                    <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-sky-600">{log.action}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">{log.user_id}</td>
                      <td className="p-2.5 text-slate-500">{log.resource_type}:{log.resource_id}</td>
                      <td className="p-2.5 text-slate-400">{log.timestamp?.replace('T', ' ').slice(0, 19)}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
