import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Programme, Institution } from '../types';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Plus,
  AlertTriangle,
  CheckCircle,
  Edit,
  ShieldCheck,
  Search
} from 'lucide-react';

export const ProgrammeManagement: React.FC = () => {
  const { isAicteAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProg, setSelectedProg] = useState<Programme | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    institution_id: user?.institution_id || 1,
    name: '',
    code: '',
    qualification_level: 'Undergraduate (B.Tech/B.E.)',
    approved_intake: 60,
    academic_year: '2026-2027',
  });

  const [editIntake, setEditIntake] = useState<number>(60);

  const { data: institutions } = useQuery<Institution[]>({
    queryKey: ['institutionsSimpleList'],
    queryFn: async () => {
      const res = await api.get('/institutions');
      return res.data;
    },
  });

  const { data: programmes, isLoading } = useQuery<Programme[]>({
    queryKey: ['programmesList', selectedInstId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedInstId) params.append('institution_id', selectedInstId);
      const res = await api.get(`/programmes?${params.toString()}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/programmes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmesList'] });
      setIsAddOpen(false);
      setFormData({
        institution_id: user?.institution_id || 1,
        name: '',
        code: '',
        qualification_level: 'Undergraduate (B.Tech/B.E.)',
        approved_intake: 60,
        academic_year: '2026-2027',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, intake }: { id: number; intake: number }) => {
      return await api.patch(`/programmes/${id}`, { approved_intake: intake });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmesList'] });
      setIsEditOpen(false);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProg) {
      updateMutation.mutate({ id: selectedProg.id, intake: editIntake });
    }
  };

  const filteredProgrammes = (programmes || []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.institution_name && p.institution_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Programmes & Intake Capacities</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor regular intake, supernumerary quotas (TFW/EWS), and enforce AICTE sanctioned ceilings.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Programme</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by programme name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isAicteAdmin && (
          <select
            value={selectedInstId}
            onChange={(e) => setSelectedInstId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="">All Institutions</option>
            {(institutions || []).map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.code})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Programmes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="text-xs text-slate-400 col-span-3 text-center py-10">Loading programmes...</p>
        ) : filteredProgrammes.length === 0 ? (
          <p className="text-xs text-slate-400 col-span-3 text-center py-10">No programmes found.</p>
        ) : (
          filteredProgrammes.map((prog) => {
            const isOverrun = prog.enrolled_count > prog.approved_intake;
            return (
              <div
                key={prog.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded border border-blue-200">
                      {prog.code}
                    </span>
                    <span className="text-[11px] text-slate-400">{prog.academic_year}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 mt-2 text-sm">{prog.name}</h3>
                  <p className="text-[11px] text-slate-500">{prog.institution_name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{prog.qualification_level}</p>

                  {/* Progress Stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Sanctioned Capacity:</span>
                      <strong className="text-slate-900">{prog.approved_intake} seats</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Regular Enrolled:</span>
                      <strong className="text-blue-700">{prog.enrolled_count} students</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Supernumerary (TFW/EWS):</span>
                      <strong className="text-amber-700">{prog.supernumerary_count}</strong>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          isOverrun ? 'bg-rose-500' : prog.intake_utilization_pct >= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, prog.intake_utilization_pct)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-[11px] font-semibold pt-1">
                      <span className={isOverrun ? 'text-rose-600' : 'text-emerald-700'}>
                        {prog.intake_utilization_pct}% Utilized
                      </span>
                      <span className="text-slate-500">{prog.remaining_intake} remaining</span>
                    </div>

                    {isOverrun && (
                      <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-700 flex items-center space-x-1.5 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Ceiling Exceeded by +{prog.enrolled_count - prog.approved_intake} regular seats!</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">AICTE Validated</span>
                  {isAicteAdmin && (
                    <button
                      onClick={() => {
                        setSelectedProg(prog);
                        setEditIntake(prog.approved_intake);
                        setIsEditOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Adjust Intake</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Programme Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Academic Programme">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {isAicteAdmin && (
            <div>
              <label className="font-semibold text-slate-700">Institution *</label>
              <select
                value={formData.institution_id}
                onChange={(e) => setFormData({ ...formData, institution_id: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              >
                {(institutions || []).map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Programme Code *</label>
              <input
                type="text"
                placeholder="e.g. CSE, ECE, ME"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Qualification Level *</label>
              <select
                value={formData.qualification_level}
                onChange={(e) => setFormData({ ...formData, qualification_level: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              >
                <option value="Undergraduate (B.Tech/B.E.)">Undergraduate (B.Tech/B.E.)</option>
                <option value="Postgraduate (M.Tech/M.E./MCA/MBA)">Postgraduate (M.Tech/MCA)</option>
                <option value="Diploma in Engineering">Diploma in Engineering</option>
                <option value="Doctoral (Ph.D.)">Doctoral (Ph.D.)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700">Programme Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Computer Science and Engineering"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">Approved Intake Capacity *</label>
            <input
              type="number"
              min="5"
              max="1000"
              value={formData.approved_intake}
              onChange={(e) => setFormData({ ...formData, approved_intake: Number(e.target.value) })}
              className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              required
            />
            <p className="text-[10px] text-slate-400 mt-1">Official AICTE approved student seat limit for the academic year.</p>
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
              {createMutation.isPending ? 'Saving...' : 'Add Programme'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Intake Capacity Modal (AICTE Admin Only) */}
      {selectedProg && isEditOpen && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify AICTE Sanctioned Intake">
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800">
              <p className="font-bold">AICTE Regulatory Control</p>
              <p className="mt-0.5">
                Modifying the approved intake for <strong>{selectedProg.name}</strong> ({selectedProg.code}).
                Institutional administrators cannot alter this threshold.
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700">New Approved Intake Capacity</label>
              <input
                type="number"
                min="1"
                max="2000"
                value={editIntake}
                onChange={(e) => setEditIntake(Number(e.target.value))}
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
                {updateMutation.isPending ? 'Updating...' : 'Save New Intake Limit'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
