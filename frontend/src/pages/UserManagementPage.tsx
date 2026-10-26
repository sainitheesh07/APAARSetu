import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { User, Institution } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  UserCheck,
  Plus,
  Search,
  Lock,
  Mail,
  Building2,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [roleFilter, setRoleFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'institution_admin',
    institution_id: 1,
    is_active: true,
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['usersList', roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/users?${params.toString()}`);
      return res.data;
    },
  });

  const { data: institutions } = useQuery<Institution[]>({
    queryKey: ['institutionsSimple'],
    queryFn: async () => {
      const res = await api.get('/institutions');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post('/users', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
      setIsCreateOpen(false);
      setErrorMessage(null);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'institution_admin',
        institution_id: 1,
        is_active: true,
      });
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.detail || 'Failed to create user account.');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await api.patch(`/users/${userId}/toggle-active`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usersList'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Accounts & Role Permissions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage administrative credentials, institution bindings, and access privileges.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create User Account</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Bound Institution</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : (
                (users || []).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{u.full_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase text-[10px]">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{u.institution_name || 'Global Regulatory Scope'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never logged in'}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-bold">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toggleMutation.mutate(u.id)}
                        className={`text-xs font-semibold cursor-pointer ${
                          u.is_active ? 'text-rose-600 hover:text-rose-800' : 'text-emerald-600 hover:text-emerald-800'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create User Account">
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800">{errorMessage}</div>
          )}

          <div>
            <label className="font-semibold text-slate-700">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Dr. Ramesh Kumar"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">Email Address *</label>
              <input
                type="email"
                placeholder="user@apaarsetu.gov.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700">Initial Password *</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700">System Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
              >
                <option value="aicte_admin">AICTE Administrator</option>
                <option value="institution_admin">Institution Administrator</option>
                <option value="verifier">Authorized Verifier</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>
            {formData.role === 'institution_admin' && (
              <div>
                <label className="font-semibold text-slate-700">Bound Institution *</label>
                <select
                  value={formData.institution_id}
                  onChange={(e) => setFormData({ ...formData, institution_id: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border rounded bg-slate-50 border-slate-300"
                >
                  {(institutions || []).map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 cursor-pointer"
            >
              {createMutation.isPending ? 'Creating User...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
