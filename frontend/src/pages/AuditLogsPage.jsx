import React, { useState, useEffect } from 'react';
import {
  History,
  Download,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Globe,
  Terminal,
  FileText,
  User,
} from 'lucide-react';
import { auditApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, roleFilter, outcomeFilter, search]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter !== 'all') params.action = actionFilter;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (outcomeFilter !== 'all') params.outcome = outcomeFilter;
      if (search) params.search = search;

      const res = await auditApi.getLogs(params);
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await auditApi.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `securemed_audit_trail_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="sm">Module 4</Badge>
            <Badge variant="crypto" size="sm">Immutable Ledger</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Security & Access Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident access log capturing all authentication, encryption, viewing, and consent events.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
        >
          <Download className="h-4 w-4" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor name, email, action, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="USER_LOGIN_SUCCESS">Login Success</option>
            <option value="USER_LOGIN_FAILED">Login Failed</option>
            <option value="RECORD_UPLOAD">Record Upload</option>
            <option value="RECORD_VIEW">Record View</option>
            <option value="RECORD_DOWNLOAD">Record Download</option>
            <option value="RECORD_INTEGRITY_VERIFIED">Integrity Verified</option>
            <option value="RECORD_TAMPER_SIMULATION">Tamper Simulation</option>
            <option value="CONSENT_GRANTED">Consent Granted</option>
            <option value="CONSENT_REVOKED">Consent Revoked</option>
            <option value="ACCESS_DENIED_UNAUTHORIZED">Access Denied</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
            <option value="anonymous">Anonymous</option>
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success</option>
            <option value="denied">Denied</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <LoadingSkeleton type="table" count={5} />
      ) : logs.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
          No audit entries matching the current filter parameters.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px] font-sans">
                <tr>
                  <th className="px-6 py-4">Timestamp (UTC)</th>
                  <th className="px-6 py-4">Security Action</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Outcome</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/60 transition cursor-pointer"
                  >
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-slate-900">{log.action}</span>
                    </td>
                    <td className="px-6 py-3.5 font-sans">
                      <p className="font-semibold text-slate-900">{log.actorName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{log.actorEmail}</span>
                    </td>
                    <td className="px-6 py-3.5 font-sans">
                      <Badge
                        variant={
                          log.actorRole === 'patient'
                            ? 'cyan'
                            : log.actorRole === 'doctor'
                            ? 'primary'
                            : 'purple'
                        }
                        size="sm"
                      >
                        {log.actorRole.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 font-sans">
                      <Badge
                        variant={
                          log.outcome === 'success'
                            ? 'success'
                            : log.outcome === 'denied'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {log.outcome.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right font-sans text-slate-500 max-w-xs truncate">
                      {log.details || 'Inspect'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Cryptographic Record"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-900 text-slate-300 space-y-2 border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">EVENT ID:</span>
                <span className="text-teal-400 font-bold">{selectedLog._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ACTION:</span>
                <span className="text-white font-bold">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">OUTCOME:</span>
                <span
                  className={
                    selectedLog.outcome === 'success'
                      ? 'text-emerald-400 font-bold'
                      : 'text-rose-400 font-bold'
                  }
                >
                  {selectedLog.outcome.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TIMESTAMP:</span>
                <span className="text-slate-200">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-500">Actor:</span>
                <span className="font-semibold text-slate-900">
                  {selectedLog.actorName} ({selectedLog.actorRole})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-700">{selectedLog.actorEmail || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Client IP Address:</span>
                <span className="font-mono text-slate-700">{selectedLog.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security Severity:</span>
                <span className="capitalize font-semibold text-slate-800">
                  {selectedLog.securitySeverity}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-slate-500 block mb-1">Details & Rationale:</span>
                <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-[11px]">
                  {selectedLog.details || 'No additional parameters.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
