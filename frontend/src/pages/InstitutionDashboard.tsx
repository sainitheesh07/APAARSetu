import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { InstitutionDashboardStats, Student } from '../types';
import {
  GraduationCap,
  Users,
  UploadCloud,
  AlertTriangle,
  FileCheck2,
  Globe2,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InstitutionDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery<InstitutionDashboardStats>({
    queryKey: ['institutionDashboard'],
    queryFn: async () => {
      const res = await api.get('/analytics/institution-dashboard');
      return res.data;
    },
  });

  const { data: recentStudents } = useQuery<Student[]>({
    queryKey: ['recentStudents'],
    queryFn: async () => {
      const res = await api.get('/students?limit=5');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Institution Information & EOA Status */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Campus Regulatory Dashboard
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">Code: {stats?.institution_code}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{stats?.institution_name}</h1>
          <div className="flex items-center space-x-3 mt-2 text-xs">
            <span className="text-slate-500">AICTE Approval Status:</span>
            <StatusBadge status={stats?.aicte_status || 'APPROVED'} size="sm" />
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Data Quality Score:</span>
            <span className="font-bold text-emerald-600">{stats?.data_quality_score || 0} / 100</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/upload"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Student CSV</span>
          </Link>
          <Link
            to="/students"
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </Link>
        </div>
      </div>

      {/* Campus KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="AICTE Sanctioned Intake"
          value={stats?.total_approved_intake || 0}
          subtitle="Total approved capacity"
          icon={GraduationCap}
          color="blue"
        />

        <StatCard
          title="Actual Total Enrolment"
          value={stats?.total_enrolled || 0}
          subtitle={`Remaining seats: ${stats?.remaining_seats || 0}`}
          icon={Users}
          color="teal"
        />

        <StatCard
          title="Supernumerary Seats"
          value={stats?.supernumerary_enrolled || 0}
          subtitle="TFW, EWS, J&K, PMSSS"
          icon={FileCheck2}
          color="amber"
        />

        <StatCard
          title="NRI & International"
          value={stats?.nri_oci_enrolled || 0}
          subtitle="OCI & Foreign Nationals"
          icon={Globe2}
          color="indigo"
        />
      </div>

      {/* Programme-wise Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Department Intake Capacity & Progress</h2>
            <p className="text-xs text-slate-500">Live comparison of enrolled students versus approved ceiling</p>
          </div>
          <Link to="/programmes" className="text-xs text-blue-600 font-semibold hover:underline">
            View Programme Details
          </Link>
        </div>

        <div className="space-y-4">
          {(stats?.programmes || []).map((prog) => {
            const isOverrun = prog.regular_enrolled > prog.approved_intake;
            const pct = prog.utilization_pct;
            return (
              <div key={prog.programme_id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="font-bold text-sm text-slate-900">{prog.programme_name}</span>
                    <span className="ml-2 text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                      {prog.code}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <span>
                      Regular: <strong>{prog.regular_enrolled}</strong> / {prog.approved_intake}
                    </span>
                    <span>
                      Supernumerary: <strong>{prog.supernumerary_enrolled}</strong>
                    </span>
                    <span className={`font-bold ${isOverrun ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {pct}% Utilized
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      isOverrun ? 'bg-rose-500' : pct >= 90 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  ></div>
                </div>

                {isOverrun && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 inline" />
                    <span>Intake Overrun Alert: Exceeds sanctioned AICTE limit by {prog.regular_enrolled - prog.approved_intake} regular seats.</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Student Registrations Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Campus Admissions</h2>
            <p className="text-xs text-slate-500">Latest enrolled students with masked APAAR identifiers</p>
          </div>
          <Link to="/students" className="text-xs text-blue-600 font-semibold hover:underline">
            View All Students
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Admission ID</th>
                <th className="py-2.5 px-3">Masked APAAR ID</th>
                <th className="py-2.5 px-3">Programme</th>
                <th className="py-2.5 px-3">Seat Category</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(recentStudents || []).map((st) => (
                <tr key={st.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-900">{st.student_name}</td>
                  <td className="py-3 px-3 font-mono">{st.admission_id}</td>
                  <td className="py-3 px-3 font-mono text-blue-700">{st.apaar_id_masked}</td>
                  <td className="py-3 px-3">{st.programme_code || 'N/A'}</td>
                  <td className="py-3 px-3 font-medium">{st.seat_category.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={st.record_status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
