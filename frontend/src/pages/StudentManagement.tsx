import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Student, Programme } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Calendar,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentManagement: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state for creating a student
  const [formData, setFormData] = useState({
    student_name: '',
    admission_id: '',
    apaar_id: '',
    institution_id: user?.institution_id || 1,
    programme_id: 1,
    academic_year: '2026-2027',
    seat_category: 'REGULAR',
    dob: '2005-01-01',
    gender: 'Male',
    admission_date: '2026-08-01',
    admission_status: 'ENROLLED',
  });

  const { data: programmes } = useQuery<Programme[]>({
    queryKey: ['programmesDropdown'],
    queryFn: async () => {
      const res = await api.get('/programmes');
      return res.data;
    },
  });

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ['studentsList', search, programmeFilter, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (programmeFilter) params.append('programme_id', programmeFilter);
      if (categoryFilter) params.append('seat_category', categoryFilter);
      if (statusFilter) params.append('record_status', statusFilter);
      const res = await api.get(`/students?${params.toString()}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/students', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentsList'] });
      setIsAddOpen(false);
      setErrorMessage(null);
      setFormData({
        student_name: '',
        admission_id: '',
        apaar_id: '',
        institution_id: user?.institution_id || 1,
        programme_id: (programmes && programmes[0]?.id) || 1,
        academic_year: '2026-2027',
        seat_category: 'REGULAR',
        dob: '2005-01-01',
        gender: 'Male',
        admission_date: '2026-08-01',
        admission_status: 'ENROLLED',
      });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.detail || 'Failed to enroll student.');
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Admissions & Enrolment Registry</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified academic records with masked APAAR identifiers, seat category allocations, and intake status.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/upload"
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <span>Bulk CSV Upload</span>
          </Link>
          <button
            onClick={() => {
              if (programmes && programmes.length > 0) {
                setFormData((prev) => ({ ...prev, programme_id: programmes[0].id }));
              }
              setIsAddOpen(true);
            }}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, admission roll no, or masked APAAR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={programmeFilter}
          onChange={(e) => setProgrammeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-hidden"
        >
          <option value="">All Programmes</option>
          {(programmes || []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-hidden"
        >
          <option value="">All Seat Quotas</option>
          <option value="REGULAR">Regular</option>
          <option value="SUPERNUMERARY_TFW">Supernumerary (TFW)</option>
          <option value="SUPERNUMERARY_EWS">Supernumerary (EWS)</option>
          <option value="NRI">NRI / OCI</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-hidden"
        >
          <option value="">All Verification Statuses</option>
          <option value="VERIFIED">Verified</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="FLAGGED">Flagged</option>
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Admission Roll No</th>
                <th className="py-3 px-4">Masked APAAR ID</th>
                <th className="py-3 px-4">Programme</th>
                <th className="py-3 px-4">Seat Category</th>
                <th className="py-3 px-4">Admission Status</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    Loading student records...
                  </td>
                </tr>
              ) : (students || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No student records found.
                  </td>
                </tr>
              ) : (
                (students || []).map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{st.student_name}</td>
                    <td className="py-3.5 px-4 font-mono font-medium">{st.admission_id}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{st.apaar_id_masked}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{st.programme_code || 'CSE'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                        {st.seat_category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{st.admission_status}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={st.record_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(st);
                          setIsDetailOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Enroll Single Student">
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">Validation / Regulatory Alert</p>
                <p className="text-[11px] mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Student Legal Name *</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Institutional Admission ID *</label>
              <input
                type="text"
                placeholder="e.g. IITD-2026-CSE-101"
                value={formData.admission_id}
                onChange={(e) => setFormData({ ...formData, admission_id: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">12-Digit APAAR ID *</label>
            <input
              type="text"
              placeholder="12-digit numeric identifier (e.g. 849302194821)"
              value={formData.apaar_id}
              onChange={(e) => setFormData({ ...formData, apaar_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300 font-mono"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Validated against structure, duplicate checks, and cross-institutional conflicts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Department Programme *</label>
              <select
                value={formData.programme_id}
                onChange={(e) => setFormData({ ...formData, programme_id: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              >
                {(programmes || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700">Seat Category *</label>
              <select
                value={formData.seat_category}
                onChange={(e) => setFormData({ ...formData, seat_category: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              >
                <option value="REGULAR">REGULAR (Sanctioned Quota)</option>
                <option value="SUPERNUMERARY_TFW">SUPERNUMERARY (TFW - Fee Waiver)</option>
                <option value="SUPERNUMERARY_EWS">SUPERNUMERARY (EWS Quota)</option>
                <option value="SUPERNUMERARY_PMSSS">SUPERNUMERARY (PMSSS Scholarship)</option>
                <option value="SUPERNUMERARY_JK">SUPERNUMERARY (J&K Quota)</option>
                <option value="NRI">NRI Quota</option>
                <option value="OCI">Overseas Citizen of India (OCI)</option>
                <option value="FOREIGN_NATIONAL">Foreign National / PIO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 cursor-pointer"
            >
              {createMutation.isPending ? 'Verifying & Enrolling...' : 'Verify & Enroll Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Details Modal */}
      {selectedStudent && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Student Academic Record">
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-mono text-blue-700 font-bold text-sm">{selectedStudent.apaar_id_masked}</span>
                <StatusBadge status={selectedStudent.record_status} size="sm" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1">{selectedStudent.student_name}</h2>
              <p className="text-slate-500 font-mono mt-0.5">Admission Roll: {selectedStudent.admission_id}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border rounded">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Programme</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedStudent.programme_name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{selectedStudent.programme_code}</p>
              </div>
              <div className="p-3 bg-white border rounded">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Seat Category</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedStudent.seat_category.replace(/_/g, ' ')}</p>
                <p className="text-[10px] text-emerald-600 font-medium">{selectedStudent.admission_status}</p>
              </div>
            </div>

            <div className="border-t pt-3">
              <h4 className="font-bold text-slate-900 mb-2">Enrolment Timeline</h4>
              {(selectedStudent.enrolments || []).length === 0 ? (
                <p className="text-slate-400">Current Academic Year Enrolment Active ({selectedStudent.academic_year}).</p>
              ) : (
                <div className="space-y-2">
                  {(selectedStudent.enrolments || []).map((e) => (
                    <div key={e.id} className="p-2.5 bg-slate-50 border rounded flex justify-between items-center text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-800">{e.programme_name || selectedStudent.programme_name}</span>
                        <p className="text-slate-500 font-mono">{e.academic_year} • {e.seat_category}</p>
                      </div>
                      <StatusBadge status={e.admission_status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
