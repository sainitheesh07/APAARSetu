import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Student } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  ShieldCheck,
  Building2,
  GraduationCap,
  Calendar,
  FileCheck2,
  Edit,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correctionField, setCorrectionField] = useState('student_name');
  const [proposedValue, setProposedValue] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch student profile (first student or linked student)
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['myStudentProfile'],
    queryFn: async () => {
      const res = await api.get('/students?limit=1');
      return res.data;
    },
  });

  const student = students && students.length > 0 ? students[0] : null;

  const correctionMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!student) return;
      return await api.post(`/students/${student.id}/corrections`, data);
    },
    onSuccess: () => {
      setIsCorrectionOpen(false);
      setSuccessMessage('Correction request submitted successfully for institutional review.');
      setProposedValue('');
      setCorrectionReason('');
    },
  });

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    correctionMutation.mutate({
      student_id: student?.id,
      field_to_correct: correctionField,
      proposed_value: proposedValue,
      reason: correctionReason,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <p className="text-slate-500 text-sm">No linked student academic profile found for current session.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Student Academic Identity
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">My Academic Profile & Credentials</h1>
        </div>

        <button
          onClick={() => setIsCorrectionOpen(true)}
          className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <Edit className="w-4 h-4" />
          <span>Request Data Correction</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Student Credential Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Card Header with Tri-color Accent */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {student.apaar_id_masked}
                </span>
                <span className="text-[11px] text-slate-400">Masked National Academic Identifier</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-2">{student.student_name}</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Roll / Reg No: {student.admission_id} • Enrolment Session {student.academic_year}
              </p>
            </div>

            <div className="text-right flex flex-col sm:items-end">
              <span className="text-[10px] uppercase font-bold text-slate-400">AICTE Verification</span>
              <div className="mt-1">
                <StatusBadge status={student.record_status} />
              </div>
            </div>
          </div>

          {/* Academic Profile Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="font-semibold uppercase text-[10px]">Institution</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{student.institution_name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">AICTE Approved Campus</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <GraduationCap className="w-4 h-4 text-teal-600" />
                <span className="font-semibold uppercase text-[10px]">Department Programme</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{student.programme_name}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{student.programme_code}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="font-semibold uppercase text-[10px]">Seat Category</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{student.seat_category.replace(/_/g, ' ')}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{student.admission_status}</p>
            </div>
          </div>

          {/* Demographic details */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</span>
              <span className="font-semibold text-slate-800">{student.dob || '2005-04-12'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender</span>
              <span className="font-semibold text-slate-800">{student.gender || 'Male'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Admission Date</span>
              <span className="font-semibold text-slate-800">{student.admission_date || '2026-08-01'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Submission Source</span>
              <span className="font-semibold text-slate-800">{student.source_of_submission}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Correction Request Modal */}
      <Modal isOpen={isCorrectionOpen} onClose={() => setIsCorrectionOpen(false)} title="Submit Student Data Correction Request">
        <form onSubmit={handleCorrectionSubmit} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Submit a correction request to institutional registrar if demographic or admission details require updating.
          </p>

          <div>
            <label className="font-semibold text-slate-700">Field Requiring Correction *</label>
            <select
              value={correctionField}
              onChange={(e) => setCorrectionField(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
            >
              <option value="student_name">Legal Name</option>
              <option value="dob">Date of Birth</option>
              <option value="seat_category">Seat Category / Quota</option>
              <option value="admission_id">Institutional Admission ID</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Correct / Proposed Value *</label>
            <input
              type="text"
              placeholder="e.g. Correct spelling or updated value"
              value={proposedValue}
              onChange={(e) => setProposedValue(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">Reason / Supporting Justification *</label>
            <textarea
              rows={3}
              placeholder="Provide reason and mention supporting certificate details (e.g., matriculation certificate, Aadhaar update)..."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              required
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCorrectionOpen(false)}
              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={correctionMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 cursor-pointer"
            >
              {correctionMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
