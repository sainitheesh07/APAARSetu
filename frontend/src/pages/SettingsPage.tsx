import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  Settings,
  Server,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  Lock,
  Cpu
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { data: health } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const res = await api.get('/settings/integrations');
      return res.data;
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Configuration & Integration Adapters</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Gateway statuses, regulatory policy settings, and government API integration endpoints.
        </p>
      </div>

      {/* Integration Statuses Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">External Gateway Adapters</h2>
            <p className="text-xs text-slate-500">Authorized government service bridges</p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gateway Status: Operational</span>
          </span>
        </div>

        <div className="space-y-3">
          {(health?.integrations || []).map((int: any, idx: number) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-sm text-slate-900">{int.name}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[11px]">
                  {int.status}
                </span>
              </div>

              <p className="text-slate-600">{int.purpose}</p>

              <div className="flex flex-wrap items-center gap-4 text-slate-500 font-mono text-[11px] pt-1">
                <span>Endpoint: {int.base_url}</span>
                <span>•</span>
                <span>Latency: {int.latency_ms}ms</span>
                <span>•</span>
                <span>Mode: {int.mode}</span>
              </div>

              <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-200">
                {int.notes}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory Policies Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Configured Regulatory Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block">Active Academic Year</span>
            <span className="text-slate-600 mt-1 block">2026-2027 (AICTE Synchronized)</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block">APAAR Format Check</span>
            <span className="text-slate-600 mt-1 block">12-Digit Numeric Regex & Checksum simulation</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block">Data Retention Period</span>
            <span className="text-slate-600 mt-1 block">7 Years (National Education Policy 2020 Standard)</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block">Identifier Storage Policy</span>
            <span className="text-slate-600 mt-1 block">Keyed HMAC-SHA256 Fingerprint (Never plaintext)</span>
          </div>
        </div>
      </div>

      {/* Swagger & API Docs Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between text-xs">
        <div>
          <h3 className="font-bold text-blue-900 text-sm">FastAPI Swagger Documentation</h3>
          <p className="text-blue-700 mt-0.5">Explore all versioned endpoints, schemas, and live OpenAPI spec.</p>
        </div>
        <a
          href="http://127.0.0.1:8001/docs"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <span>Open /docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
