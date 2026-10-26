import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { AuditLog } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  History,
  Download,
  Search,
  Filter,
  ShieldCheck,
  User,
  Clock,
  Terminal
} from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['auditLogsList', actionFilter, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (roleFilter) params.append('actor_role', roleFilter);
      const res = await api.get(`/audit-logs?${params.toString()}`);
      return res.data;
    },
  });

  const handleExportCSV = () => {
    window.open(`${api.defaults.baseURL}/audit-logs/export-csv`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Regulatory Compliance</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Immutable Audit Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Regulatory Audit Trail & Event Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tamper-proof backend log of authentication events, CSV uploads, student modifications, and verification lookups.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by action name (e.g. LOGIN, CSV_SUBMISSION, VERIFICATION)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-hidden"
        >
          <option value="">All Actor Roles</option>
          <option value="aicte_admin">AICTE Admin</option>
          <option value="institution_admin">Institution Admin</option>
          <option value="verifier">Authorized Verifier</option>
          <option value="auditor">Auditor</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Sanitized Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : (logs || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No audit records found matching the filter.
                  </td>
                </tr>
              ) : (
                (logs || []).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {log.actor_name || 'System Actor'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 10)})` : ''}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={log.outcome} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-mono text-[11px] text-slate-500">
                      {log.metadata_json || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
