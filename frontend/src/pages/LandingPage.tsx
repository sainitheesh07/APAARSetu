import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  UploadCloud,
  BarChart3,
  Lock,
  ArrowRight,
  Database,
  Building2,
  Users
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Tricolor Header */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

      {/* Navigation */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight">APAARSetu</span>
                <span className="bg-blue-800 text-blue-200 text-xs px-2 py-0.5 rounded font-semibold uppercase">
                  Govt. of India
                </span>
              </div>
              <p className="text-xs text-slate-400">AICTE APAAR-Based Student Data Verification Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/verify"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Public Verifier
            </Link>
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all"
            >
              Institutional Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-blue-950/80 border border-blue-700 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full">
            <span>All India Council for Technical Education</span>
            <span>•</span>
            <span>Ministry of Education, Govt. of India</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Centralized APAAR Student Verification & Intake Compliance Platform
          </h1>

          <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Eliminating fragmented records, cross-institution duplicate enrolments, missing APAAR IDs,
            and unauthorized intake overruns across all AICTE-approved institutions with cryptographic verification and real-time analytics.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg flex items-center space-x-2 transition-all"
            >
              <span>Access Institutional Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/verify"
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold px-6 py-3 rounded-lg transition-all flex items-center space-x-2"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Verify a Student Record</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem & Solution Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs uppercase font-bold tracking-widest text-blue-600">Core Objectives</h2>
          <p className="text-3xl font-bold text-slate-900 mt-1">Solving Regulatory Challenges with Intelligence</p>
          <p className="text-slate-600 mt-2 text-sm">
            APAARSetu introduces automated safeguards to protect institutional integrity and student academic identity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="bg-amber-100 text-amber-800 p-3 rounded-lg w-fit mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Duplicate & Dual Enrolment Detection</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Detects identical APAAR IDs across multiple institutions concurrently, flagging dual enrolments and ghost admissions before university seat allocations are finalized.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="bg-rose-100 text-rose-800 p-3 rounded-lg w-fit mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Intake Overrun Enforcement</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Strictly calculates regular versus supernumerary intake quotas (TFW, EWS, J&K, PMSSS, NRI), blocking unapproved over-admissions while preserving permitted supernumerary exceptions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="bg-emerald-100 text-emerald-800 p-3 rounded-lg w-fit mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Privacy-Preserving Minimum Disclosure</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Employers and authorized verifiers can confirm student credentials using tamper-proof digital seals without leaking sensitive personal identifiers or full APAAR numbers.
            </p>
          </div>
        </div>
      </section>

      {/* 11-Step Bulk Processing Workflow Preview */}
      <section className="bg-slate-100 py-16 px-6 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">End-to-End Workflow</span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">High-Throughput Bulk CSV Ingestion</h2>
            <p className="text-sm text-slate-600 mt-1">
              Institutions upload thousands of student records through an 11-step validated pipeline with instant error reports.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-blue-600 font-bold text-lg mb-1">01</div>
              <p className="text-xs font-semibold text-slate-900">Download Template</p>
              <p className="text-[11px] text-slate-500 mt-1">Pre-formatted AICTE schema</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-blue-600 font-bold text-lg mb-1">02</div>
              <p className="text-xs font-semibold text-slate-900">Upload & Preview</p>
              <p className="text-[11px] text-slate-500 mt-1">Header & encoding check</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-blue-600 font-bold text-lg mb-1">03</div>
              <p className="text-xs font-semibold text-slate-900">Validation Engine</p>
              <p className="text-[11px] text-slate-500 mt-1">Cross-check APAAR & intake</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
              <div className="text-blue-600 font-bold text-lg mb-1">04</div>
              <p className="text-xs font-semibold text-slate-900">Transactional Commit</p>
              <p className="text-[11px] text-slate-500 mt-1">Save valid, isolate issues</p>
            </div>
          </div>
        </div>
      </section>

      {/* Official Regulatory Advisory & Security Compliance */}
      <section className="py-8 px-6 bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Official AICTE National Regulatory Portal</p>
              <p className="text-slate-400 mt-0.5">Automated student intake validation, deduplication, and APAAR verification for technical institutions.</p>
            </div>
          </div>
          <div className="flex items-center space-x-6 text-slate-400">
            <span>256-Bit SSL Secured</span>
            <span>•</span>
            <span>NEP 2020 Compliant</span>
            <span>•</span>
            <span>National Academic Depository (NAD)</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-6 text-center text-xs border-t border-slate-800 mt-auto">
        <p>© 2026 APAARSetu • All India Council for Technical Education (AICTE), Ministry of Education, Government of India</p>
      </footer>
    </div>
  );
};
