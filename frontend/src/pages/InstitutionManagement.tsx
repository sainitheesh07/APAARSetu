import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Institution } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Edit,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

export const InstitutionManagement: React.FC = () => {
  const { isAicteAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form states for register
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    institution_type: 'Central University/IIT/NIT',
    state: '',
    district: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    approval_ref: '',
  });

  // Edit approval form state
  const [editData, setEditData] = useState({
    aicte_approval_status: 'APPROVED',
    approval_ref: '',
  });

  const { data: institutions, isLoading } = useQuery<Institution[]>({
    queryKey: ['institutionsList', search, stateFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (stateFilter) params.append('state', stateFilter);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/institutions?${params.toString()}`);
      return res.data;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/institutions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutionsList'] });
      setIsRegisterOpen(false);
      setFormData({
        code: '',
        name: '',
        institution_type: 'Central University/IIT/NIT',
        state: '',
        district: '',
        address: '',
        contact_email: '',
        contact_phone: '',
        approval_ref: '',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await api.patch(`/institutions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutionsList'] });
      setIsEditOpen(false);
    },
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInst) {
      updateMutation.mutate({ id: selectedInst.id, data: editData });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institutions Registry & AICTE Sanctions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage approved higher education campuses, approval references, and authorized seat quotas.
          </p>
        </div>

        {isAicteAdmin && (
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Institution</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by institution name, code, or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-hidden"
        >
          <option value="">All States / UTs</option>
          <option value="Delhi">Delhi</option>
          <option value="Rajasthan">Rajasthan</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-hidden"
        >
          <option value="">All Approval Statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING_INSPECTION">Pending Inspection</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Institutions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">AICTE Code</th>
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">State & Type</th>
                <th className="py-3 px-4">Sanctioned Intake</th>
                <th className="py-3 px-4">Enrolled Students</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Loading institutions...
                  </td>
                </tr>
              ) : (institutions || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No institutions found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                (institutions || []).map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{inst.code}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inst.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Ref: {inst.approval_ref || 'Pending AICTE EOA'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{inst.state}</div>
                      <div className="text-[10px] text-slate-400">{inst.institution_type}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {inst.total_approved_intake || 0} seats
                    </td>
                    <td className="py-3.5 px-4 font-medium text-emerald-700">
                      {inst.total_enrolled || 0} students
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inst.aicte_approval_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        Details
                      </button>
                      {isAicteAdmin && (
                        <button
                          onClick={() => {
                            setSelectedInst(inst);
                            setEditData({
                              aicte_approval_status: inst.aicte_approval_status,
                              approval_ref: inst.approval_ref || '',
                            });
                            setIsEditOpen(true);
                          }}
                          className="text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Modal */}
      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Register AICTE Institution">
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">AICTE Permanent ID *</label>
              <input
                type="text"
                placeholder="1-AICTE-XXXX-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Institution Type *</label>
              <select
                value={formData.institution_type}
                onChange={(e) => setFormData({ ...formData, institution_type: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              >
                <option value="Central University/IIT/NIT">Central University / IIT / NIT</option>
                <option value="State University/Govt College">State University / Govt College</option>
                <option value="Deemed University">Deemed University</option>
                <option value="Private / Self-Financed">Private / Self-Financed</option>
                <option value="Autonomous Institute">Autonomous Institute</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Institution Full Legal Name *</label>
            <input
              type="text"
              placeholder="e.g. Indian Institute of Science and Technology"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">State *</label>
              <input
                type="text"
                placeholder="e.g. Maharashtra"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">District *</label>
              <input
                type="text"
                placeholder="e.g. Pune"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Contact Email *</label>
            <input
              type="email"
              placeholder="admin@college.ac.in"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">AICTE Approval Reference (EOA)</label>
            <input
              type="text"
              placeholder="AICTE/WEST/2026-27/1-XXXX-99"
              value={formData.approval_ref}
              onChange={(e) => setFormData({ ...formData, approval_ref: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 cursor-pointer"
            >
              {registerMutation.isPending ? 'Registering...' : 'Register Institution'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Institution Details Modal */}
      {selectedInst && !isEditOpen && (
        <Modal isOpen={!!selectedInst} onClose={() => setSelectedInst(null)} title="Institution Details">
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-mono text-blue-700 font-bold">{selectedInst.code}</span>
              <h2 className="text-base font-bold text-slate-900 mt-1">{selectedInst.name}</h2>
              <div className="mt-2 flex items-center space-x-2">
                <StatusBadge status={selectedInst.aicte_approval_status} size="sm" />
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 font-medium">{selectedInst.institution_type}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border rounded">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Approved Intake</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{selectedInst.total_approved_intake || 0} seats</p>
              </div>
              <div className="p-3 bg-white border rounded">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Current Enrolment</p>
                <p className="text-lg font-bold text-emerald-700 mt-0.5">{selectedInst.total_enrolled || 0} students</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t text-slate-600">
              <p className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{selectedInst.district}, {selectedInst.state}</span>
              </p>
              <p className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{selectedInst.contact_email}</span>
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-semibold text-slate-500">Approval EOA:</span>
                <span className="font-mono text-slate-800">{selectedInst.approval_ref || 'Pending'}</span>
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Approval Status Modal (AICTE Admin Only) */}
      {selectedInst && isEditOpen && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update AICTE Approval Status">
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Modifying regulatory sanction for <strong>{selectedInst.name}</strong> ({selectedInst.code}).
            </p>

            <div>
              <label className="font-semibold text-slate-700">Approval Status</label>
              <select
                value={editData.aicte_approval_status}
                onChange={(e) => setEditData({ ...editData, aicte_approval_status: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              >
                <option value="APPROVED">Approved (EOA Issued)</option>
                <option value="PENDING_INSPECTION">Pending Regulatory Inspection</option>
                <option value="SUSPENDED">Suspended (Intake Frozen)</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700">AICTE Approval Reference Number</label>
              <input
                type="text"
                value={editData.approval_ref}
                onChange={(e) => setEditData({ ...editData, approval_ref: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                required
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 cursor-pointer"
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Sanctions'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
