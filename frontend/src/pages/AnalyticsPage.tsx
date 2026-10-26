import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { OverviewStats, ProgrammeIntakeMetric, CategoryDistribution, StateDistribution, TrendMetric } from '../types';
import {
  BarChart3,
  Download,
  TrendingUp,
  PieChart as PieIcon,
  Users,
  GraduationCap,
  ShieldCheck,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [academicYear, setAcademicYear] = useState('2026-2027');

  const { data: stats } = useQuery<OverviewStats>({
    queryKey: ['analyticsOverview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data;
    },
  });

  const { data: programmes } = useQuery<ProgrammeIntakeMetric[]>({
    queryKey: ['analyticsProgrammes'],
    queryFn: async () => {
      const res = await api.get('/analytics/enrolment');
      return res.data;
    },
  });

  const { data: categories } = useQuery<CategoryDistribution[]>({
    queryKey: ['analyticsCategories'],
    queryFn: async () => {
      const res = await api.get('/analytics/categories');
      return res.data;
    },
  });

  const { data: states } = useQuery<StateDistribution[]>({
    queryKey: ['analyticsStates'],
    queryFn: async () => {
      const res = await api.get('/analytics/states');
      return res.data;
    },
  });

  const { data: trends } = useQuery<TrendMetric[]>({
    queryKey: ['analyticsTrends'],
    queryFn: async () => {
      const res = await api.get('/analytics/trends');
      return res.data;
    },
  });

  const handleExportCSV = () => {
    window.open(`${api.defaults.baseURL}/analytics/export-csv`, '_blank');
  };

  const COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">National Analytics & Compliance Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Aggregated statistics on intake capacity, quota distributions, and institutional compliance trends.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Authorized CSV Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Approved Seats</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.total_approved_intake || 0}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sanctioned AICTE capacity</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Enrolled Students</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats?.total_students || 0}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active across all campuses</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Intake Utilization</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats?.intake_utilization_pct || 0}%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">National regular quota fill rate</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Data Quality Index</p>
          <p className="text-2xl font-bold text-purple-700 mt-1">{stats?.data_quality_score || 0} / 100</p>
          <p className="text-[11px] text-slate-500 mt-0.5">APAAR validity & compliance</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Intake vs Enrolment */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Approved Intake vs Actual Enrolment by Programme</h2>
          <p className="text-xs text-slate-500 mb-4">Comparison of sanctioned limits against enrolled student body</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={programmes || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="approved_intake" name="Approved Intake" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="regular_enrolled" name="Regular Enrolled" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="supernumerary_enrolled" name="Supernumerary" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (Pie) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Seat Category & Quota Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown of Regular, Supernumerary (TFW/EWS), and NRI seats</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${name.slice(0, 12)} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {(categories || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Admission Trends */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Enrolment Timeline Trends</h2>
          <p className="text-xs text-slate-500 mb-4">Monthly student intake batch submissions</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="enrolments" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* State-wise Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">State-wise Institution & Student Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Regional participation across Indian states</p>

          <div className="space-y-3 mt-4">
            {(states || []).map((s) => (
              <div key={s.state} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900">{s.state}</span>
                  <p className="text-[11px] text-slate-500">{s.institution_count} Registered Institutions</p>
                </div>
                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {s.student_count} Enrolled
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
