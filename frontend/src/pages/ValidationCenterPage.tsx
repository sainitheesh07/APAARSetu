import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ValidationIssue } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Clock,
  FileCheck2,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

export const ValidationCenterPage: React.FC = () => {
  const { user, isAicteAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selectedIssue, setSelectedIssue] = useState<ValidationIssue | null>(null);
  const [isResolveOpen, setIsResolveOpen] = useState(false);

  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'EXCEPTION_APPROVED' | 'REJECTED'>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const { data: issues, isLoading } = useQuery<ValidationIssue[]>({
    queryKey: ['validationIssuesList', severityFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (severityFilter) params.append('severity', severityFilter);
      if (statusFilter) params.append('resolution_status', statusFilter);
      const res = await api.get(`/validation/issues?${params.toString()}`);
      return res.data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      return await api.post(`/validation/issues/${id}/resolve`, {
        resolution_status: status,
        resolution_notes: notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validationIssuesList'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverviewStats'] });
      setIsResolveOpen(false);
      setSelectedIssue(null);
      setResolutionNotes('');
      setErrorText(null);
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.detail || 'Failed to resolve validation issue.');
    },
  });

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;
    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      setErrorText('Please provide a comprehensive regulatory explanation for this resolution.');
      return;
    }
    resolveMutation.mutate({
      id: selectedIssue.id,
      status: resolutionStatus,
      notes: resolutionNotes,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Compliance & Diagnostics</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Anomaly Review Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Data Validation & Exception Review Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit, investigate, and record authorized regulatory decisions on duplicates, missing identifiers, and intake violations.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setStatusFilter('RESOLVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === 'RESOLVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => setStatusFilter('EXCEPTION_APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === 'EXCEPTION_APPROVED'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Exceptions Granted
          </button>
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              statusFilter === ''
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Issues
          </button>
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical Only</option>
          <option value="WARNING">Warnings Only</option>
          <option value="INFO">Informational</option>
        </select>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Issue Type</th>
                <th className="py-3 px-4">Description & Evidence</th>
                <th className="py-3 px-4">Campus</th>
                <th className="py-3 px-4">Row / Snippet</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Loading validation issues...
                  </td>
                </tr>
              ) : (issues || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No validation issues found in this category.
                  </td>
                </tr>
              ) : (
                (issues || []).map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <StatusBadge status={issue.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {issue.issue_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="text-slate-800 leading-snug">{issue.description}</p>
                      {issue.resolution_notes && (
                        <div className="mt-1 p-2 bg-slate-100 rounded text-[11px] text-slate-600 border border-slate-200">
                          <strong>Resolution by {issue.reviewed_by_name || 'Admin'}:</strong> {issue.resolution_notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {issue.institution_name || 'System-wide'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {issue.row_number ? `Row ${issue.row_number}` : 'DB Record'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={issue.resolution_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {issue.resolution_status === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setSelectedIssue(issue);
                            setResolutionNotes('');
                            setErrorText(null);
                            setIsResolveOpen(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                        >
                          Review & Resolve
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(issue.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Issue Modal */}
      {selectedIssue && (
        <Modal isOpen={isResolveOpen} onClose={() => setIsResolveOpen(false)} title="Audit & Resolve Validation Issue">
          <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <StatusBadge status={selectedIssue.severity} size="sm" />
                <span className="text-slate-500 font-mono">ID: #{selectedIssue.id}</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm mt-1">{selectedIssue.issue_type.replace(/_/g, ' ')}</h4>
              <p className="text-slate-700">{selectedIssue.description}</p>
              {selectedIssue.raw_record_snippet && (
                <p className="font-mono text-[11px] text-blue-700 bg-blue-50 p-2 rounded border border-blue-200 mt-1">
                  Snippet: {selectedIssue.raw_record_snippet}
                </p>
              )}
            </div>

            {errorText && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800">
                {errorText}
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700">Resolution Decision *</label>
              <select
                value={resolutionStatus}
                onChange={(e: any) => setResolutionStatus(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              >
                <option value="RESOLVED">RESOLVED (Record Corrected or Consolidated)</option>
                {isAicteAdmin && (
                  <option value="EXCEPTION_APPROVED">EXCEPTION_APPROVED (AICTE Regulatory Exception Granted)</option>
                )}
                <option value="REJECTED">REJECTED (Candidate Ineligible / Admission Revoked)</option>
              </select>
              {!isAicteAdmin && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Note: Regulatory exception grants require AICTE Central Administrator authority.
                </p>
              )}
            </div>

            <div>
              <label className="font-semibold text-slate-700">Audit Resolution Notes & Justification *</label>
              <textarea
                rows={3}
                placeholder="State the regulatory evidence, verification outcome, or transfer certificate details..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                This explanation is immutably logged into the AICTE compliance audit trail.
              </p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsResolveOpen(false)}
                className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resolveMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 cursor-pointer"
              >
                {resolveMutation.isPending ? 'Logging Resolution...' : 'Submit Resolution'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
