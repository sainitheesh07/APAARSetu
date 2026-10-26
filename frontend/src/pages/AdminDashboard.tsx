import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { OverviewStats, ProgrammeIntakeMetric, ValidationIssue } from '../types';
import {
  Building2,
  GraduationCap,
  Users,
  AlertTriangle,
  FileCheck2,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading: isStatsLoading } = useQuery<OverviewStats>({
    queryKey: ['adminOverviewStats'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data;
    },
  });

  const { data: programmes } = useQuery<ProgrammeIntakeMetric[]>({
    queryKey: ['adminProgrammeMetrics'],
    queryFn: async () => {
      const res = await api.get('/analytics/enrolment');
      return res.data;
    },
  });

  const { data: highPriorityIssues } = useQuery<ValidationIssue[]>({
    queryKey: ['adminPriorityIssues'],
    queryFn: async () => {
      const res = await api.get('/validation/issues?limit=5');
      return res.data;
    },
  });

  const chartData = (programmes || []).slice(0, 6).map((p) => ({
    name: p.code,
    approved: p.approved_intake,
    regular: p.regular_enrolled,
    supernumerary: p.supernumerary_enrolled,
  }));

  if (isStatsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Regulatory Command Center</span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">AICTE National Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">National Student Intake & Verification Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time monitoring of AICTE institutions, sanctioned capacity compliance, and cross-institution duplicate alerts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/validation"
            className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Review Validation Alerts</span>
          </Link>
          <Link
            to="/analytics"
            className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Generate Reports</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Approved Institutions"
          value={`${stats?.approved_institutions || 0} / ${stats?.total_institutions || 0}`}
          subtitle="AICTE active registry"
          icon={Building2}
          color="blue"
        />

        <StatCard
          title="Enrolled Students"
          value={stats?.total_students || 0}
          subtitle="Across all departments"
          icon={Users}
          color="teal"
        />

        <StatCard
          title="National Intake Utilization"
          value={`${stats?.intake_utilization_pct || 0}%`}
          subtitle={`Capacity: ${stats?.total_approved_intake || 0} seats`}
          icon={GraduationCap}
          color="indigo"
        />

        <StatCard
          title="Regulatory Data Quality"
          value={`${stats?.data_quality_score || 0} / 100`}
          subtitle="Zero-duplicate & intake index"
          icon={FileCheck2}
          color="emerald"
        />
      </div>

      {/* Secondary Warning Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Duplicate & Dual Enrolments</p>
            <p className="text-2xl font-extrabold text-amber-950 mt-1">{stats?.duplicate_alerts || 0}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Cross-institution & in-batch conflicts</p>
          </div>
          <ShieldAlert className="w-8 h-8 text-amber-600 opacity-80" />
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Missing or Invalid APAAR</p>
            <p className="text-2xl font-extrabold text-rose-950 mt-1">{stats?.missing_apaar_count || 0}</p>
            <p className="text-[11px] text-rose-700 mt-0.5">Records blocked from formal verification</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-600 opacity-80" />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Unresolved Issues</p>
            <p className="text-2xl font-extrabold text-blue-950 mt-1">{stats?.unresolved_issues || 0}</p>
            <p className="text-[11px] text-blue-700 mt-0.5">Pending administrative exception review</p>
          </div>
          <Clock className="w-8 h-8 text-blue-600 opacity-80" />
        </div>
      </div>

      {/* Chart & High Priority Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approved Intake vs Actual Enrolment Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Approved Intake vs Actual Enrolment</h2>
              <p className="text-xs text-slate-500">Regular admissions compared against AICTE sanctioned capacity</p>
            </div>
            <Link to="/analytics" className="text-xs text-blue-600 font-semibold hover:underline flex items-center">
              Full Analytics <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="approved" name="Approved Intake" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="regular" name="Regular Enrolled" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="supernumerary" name="Supernumerary (TFW/EWS)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Validation Alerts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Priority Alerts</h2>
              <p className="text-xs text-slate-500">Requires regulatory intervention</p>
            </div>
            <Link to="/validation" className="text-xs text-blue-600 font-semibold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {(highPriorityIssues || []).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No outstanding validation issues.</p>
            ) : (
              (highPriorityIssues || []).map((issue) => (
                <div key={issue.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={issue.severity} size="sm" />
                    <span className="text-[10px] text-slate-400">
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 leading-snug">{issue.description}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{issue.institution_name || 'System-wide'}</span>
                    <span className="font-medium text-amber-700">{issue.issue_type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
