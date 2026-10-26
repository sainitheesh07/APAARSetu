import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { PreviewResponse, CommitResponse } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowRight,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';

export const BulkUploadPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [institutionId, setInstitutionId] = useState<number>(user?.institution_id || 1);

  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'INVALID' | 'VALID'>('ALL');

  // Preview Mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Please select a CSV file.');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('academic_year', academicYear);
      formData.append('institution_id', String(institutionId));

      const res = await api.post('/submissions/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data: PreviewResponse) => {
      setPreviewData(data);
      setCommitResult(null);
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.detail || err.message || 'CSV validation failed.');
    },
  });

  // Commit Mutation
  const commitMutation = useMutation({
    mutationFn: async () => {
      if (!previewData) throw new Error('No active preview session.');
      const res = await api.post('/submissions/commit', {
        submission_token: previewData.submission_token,
        commit_mode: 'VALID_ONLY',
      });
      return res.data;
    },
    onSuccess: (data: CommitResponse) => {
      setCommitResult(data);
      queryClient.invalidateQueries({ queryKey: ['studentsList'] });
      queryClient.invalidateQueries({ queryKey: ['institutionDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverviewStats'] });
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.detail || 'Failed to commit submission.');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setCommitResult(null);
      setUploadError(null);
    }
  };

  const handleDownloadSample = () => {
    window.open(`${api.defaults.baseURL}/submissions/template/sample-csv`, '_blank');
  };

  const handleDownloadErrorReport = () => {
    if (!previewData) return;
    window.open(`${api.defaults.baseURL}/submissions/error-report/${previewData.submission_token}`, '_blank');
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setCommitResult(null);
    setUploadError(null);
  };

  const filteredRowResults = (previewData?.row_results || []).filter((r) => {
    if (activeTab === 'VALID') return r.is_valid;
    if (activeTab === 'INVALID') return !r.is_valid;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bulk Student CSV Ingestion Workflow</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            11-Step validated ingestion pipeline with instant format validation, deduplication, and transactional commit.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-blue-600" />
          <span>Download Official CSV Template</span>
        </button>
      </div>

      {/* Upload & Parameter Configuration */}
      {!previewData && !commitResult && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
              >
                <option value="2026-2027">2026-2027 (Active Intake Session)</option>
                <option value="2025-2026">2025-2026 (Historical)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Target Campus</label>
              <input
                type="text"
                disabled
                value={user?.institution_name || 'Indian Institute of Technology Delhi'}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600"
              />
            </div>
          </div>

          {/* Drag & Drop Box */}
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50/50 transition-colors">
            <UploadCloud className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-sm">Select Student Admission Batch CSV</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              File must be a UTF-8 encoded .csv containing student_name, admission_id, apaar_id, programme_code, seat_category.
            </p>

            <div className="mt-4">
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors">
                <span>Browse Local CSV File</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {file && (
              <div className="mt-4 inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded text-xs text-blue-900 font-medium">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Batch Validation Error</p>
                <p className="mt-0.5">{uploadError}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => previewMutation.mutate()}
              disabled={!file || previewMutation.isPending}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {previewMutation.isPending ? (
                <span>Executing Server-Side Validation Engine...</span>
              ) : (
                <>
                  <span>Run Pre-Submission Validation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Validation Results & Preview Dashboard */}
      {previewData && !commitResult && (
        <div className="space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Batch Rows</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{previewData.summary.total_rows}</p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
              <p className="text-[10px] text-emerald-700 font-bold uppercase">Valid & Accepted</p>
              <p className="text-2xl font-bold text-emerald-800 mt-1">{previewData.summary.valid_rows}</p>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
              <p className="text-[10px] text-rose-700 font-bold uppercase">Invalid Rows</p>
              <p className="text-2xl font-bold text-rose-800 mt-1">{previewData.summary.invalid_rows}</p>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
              <p className="text-[10px] text-amber-700 font-bold uppercase">Duplicate Identifiers</p>
              <p className="text-2xl font-bold text-amber-800 mt-1">
                {previewData.summary.duplicate_in_file_count + previewData.summary.duplicate_existing_count}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 text-center">
              <p className="text-[10px] text-purple-700 font-bold uppercase">Cross-Institution</p>
              <p className="text-2xl font-bold text-purple-800 mt-1">{previewData.summary.cross_institution_count}</p>
            </div>
          </div>

          {/* Action Header */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 font-medium">Filter Preview:</span>
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                  activeTab === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                All Rows ({previewData.summary.total_rows})
              </button>
              <button
                onClick={() => setActiveTab('INVALID')}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                  activeTab === 'INVALID' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'
                }`}
              >
                Issues ({previewData.summary.invalid_rows})
              </button>
              <button
                onClick={() => setActiveTab('VALID')}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                  activeTab === 'VALID' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                Clean ({previewData.summary.valid_rows})
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {previewData.summary.invalid_rows > 0 && (
                <button
                  onClick={handleDownloadErrorReport}
                  className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Error Report CSV</span>
                </button>
              )}

              <button
                onClick={handleReset}
                className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>

              <button
                onClick={() => commitMutation.mutate()}
                disabled={!previewData.summary.can_commit || commitMutation.isPending}
                className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {commitMutation.isPending ? 'Committing Batch...' : `Commit ${previewData.summary.valid_rows} Valid Students`}
                </span>
              </button>
            </div>
          </div>

          {/* Row-Level Results Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3 w-16">Row #</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Admission ID</th>
                    <th className="py-3 px-3">APAAR ID</th>
                    <th className="py-3 px-3">Prog / Quota</th>
                    <th className="py-3 px-3">Row Status</th>
                    <th className="py-3 px-3">Diagnostic Findings & Corrections</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRowResults.map((row) => (
                    <tr
                      key={row.row_number}
                      className={row.is_valid ? 'hover:bg-slate-50' : 'bg-rose-50/40 hover:bg-rose-50/70'}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">{row.row_number}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{row.student_name}</td>
                      <td className="py-3 px-3 font-mono">{row.admission_id}</td>
                      <td className="py-3 px-3 font-mono text-blue-700 font-semibold">{row.apaar_id_masked}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{row.programme_code}</span>
                        <span className="text-[10px] text-slate-400 block">{row.seat_category}</span>
                      </td>
                      <td className="py-3 px-3">
                        {row.is_valid ? (
                          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> VALID
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-700 bg-rose-50 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3 mr-1" /> REJECTED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {row.issues.length === 0 ? (
                          <span className="text-slate-400 text-[11px]">Passed all validation rules</span>
                        ) : (
                          <div className="space-y-1">
                            {row.issues.map((issue, idx) => (
                              <div
                                key={idx}
                                className={`text-[11px] p-1.5 rounded ${
                                  issue.severity === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-900 border border-rose-200'
                                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                                }`}
                              >
                                <strong>{issue.issue_type.replace(/_/g, ' ')}:</strong> {issue.message}
                                {issue.suggested_fix && (
                                  <div className="text-[10px] text-slate-600 mt-0.5 italic">
                                    Fix: {issue.suggested_fix}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Commit Success Receipt */}
      {commitResult && (
        <div className="bg-white rounded-xl border border-emerald-300 p-8 shadow-md text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Batch Ingestion Committed Successfully</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{commitResult.message}</p>

          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto py-2">
            <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
              <p className="text-[10px] text-emerald-700 uppercase font-bold">Enrolled Students</p>
              <p className="text-2xl font-bold text-emerald-900 mt-0.5">{commitResult.accepted_count}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded border border-rose-200">
              <p className="text-[10px] text-rose-700 uppercase font-bold">Flagged for Review</p>
              <p className="text-2xl font-bold text-rose-900 mt-0.5">{commitResult.rejected_count}</p>
            </div>
          </div>

          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Upload Another Batch
            </button>
            <a
              href="/students"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              View Enrolled Registry
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
