import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { VerificationResponse } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Printer,
  QrCode,
  Building2,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';

export const VerificationPortalPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('849302194821'); // Seeded demo APAAR ID
  const [institutionCode, setInstitutionCode] = useState('');
  const [purpose, setPurpose] = useState('EMPLOYMENT');
  const [requesterName, setRequesterName] = useState('TCS Talent Acquisition');
  const [requesterOrg, setRequesterOrg] = useState('Tata Consultancy Services Ltd');
  const [consentRef, setConsentRef] = useState('CST-2026-9812');

  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/verifications', {
        identifier,
        institution_code: institutionCode || undefined,
        purpose,
        requester_name: requesterName,
        requester_org: requesterOrg,
        consent_reference: consentRef,
      });
      return res.data;
    },
    onSuccess: (data: VerificationResponse) => {
      setVerificationResult(data);
      setErrorText(null);
    },
    onError: (err: any) => {
      setErrorText(err.response?.data?.detail || 'Verification lookup failed.');
    },
  });

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setErrorText('Please provide a 12-digit APAAR ID or Student Admission Registration ID.');
      return;
    }
    verifyMutation.mutate();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-1.5 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>National Academic Record Verification Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Student Credential Verification</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          Authorized verification for employers, universities, and regulatory bodies.
          Follows privacy-preserving minimum disclosure principles with cryptographic audit seals.
        </p>
      </div>

      {/* Verification Query Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <form onSubmit={handleVerifySubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Student APAAR ID or Admission ID *
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 849302194821 or IITD-2026-CSE-001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Try seeded demo APAAR ID: <code className="text-blue-600 font-bold">849302194821</code> (IIT Delhi)
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Verification Purpose *</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="EMPLOYMENT">Employment Background Verification</option>
                <option value="HIGHER_EDUCATION">Higher Education Admission Check</option>
                <option value="BACKGROUND_CHECK">Government & Security Screening</option>
                <option value="SCHOLARSHIP">Scholarship Eligibility Verification</option>
                <option value="OTHER">Other Authorized Legal Purpose</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Requester Name *</label>
              <input
                type="text"
                placeholder="Verifier Name"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Requester Organization</label>
              <input
                type="text"
                placeholder="Company / University"
                value={requesterOrg}
                onChange={(e) => setRequesterOrg(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Consent Reference ID</label>
              <input
                type="text"
                placeholder="e.g. CST-2026-XXXX"
                value={consentRef}
                onChange={(e) => setConsentRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          {errorText && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded text-rose-800 text-xs">
              {errorText}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={verifyMutation.isPending}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {verifyMutation.isPending ? (
                <span>Querying Verification Registry...</span>
              ) : (
                <>
                  <span>Perform Verified Lookup</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Verification Result Receipt */}
      {verificationResult && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden print:border-none print:shadow-none">
          {/* Certificate Header */}
          <div className="h-2 bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

          <div className="p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-900 text-white p-3 rounded-xl">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Certificate of Academic Verification</h2>
                  <p className="text-xs text-slate-500">Ministry of Education • AICTE National Portal</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Verification Reference</p>
                <p className="font-mono font-bold text-blue-700 text-sm mt-0.5">{verificationResult.reference_no}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Timestamp: {new Date(verificationResult.verified_at).toUTCString()}
                </p>
              </div>
            </div>

            {/* Verification Status Banner */}
            <div
              className={`p-4 rounded-xl flex items-center justify-between border ${
                verificationResult.is_verified
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                {verificationResult.is_verified ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-7 h-7 text-rose-600 shrink-0" />
                )}
                <div>
                  <p className="font-bold text-sm">
                    {verificationResult.is_verified ? 'RECORD VERIFIED & AUTHENTIC' : 'VERIFICATION FAILED / UNRESOLVED'}
                  </p>
                  <p className="text-xs opacity-90">{verificationResult.verification_notes}</p>
                </div>
              </div>
              <StatusBadge status={verificationResult.verification_result} />
            </div>

            {/* Minimum Disclosure Student Data Table */}
            {verificationResult.is_verified && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Masked Student Name</span>
                  <span className="text-sm font-bold text-slate-900">{verificationResult.student_name_masked}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Masked APAAR Identifier</span>
                  <span className="text-sm font-mono font-bold text-blue-700">{verificationResult.apaar_id_masked}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Institution Code</span>
                  <span className="text-sm font-mono font-bold text-slate-900">{verificationResult.institution_code}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Enrolled Institution</span>
                  <span className="text-xs font-bold text-slate-900">{verificationResult.institution_name}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Department Programme</span>
                  <span className="text-xs font-bold text-slate-900">{verificationResult.programme_name}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Qualification Level</span>
                  <span className="text-xs font-medium text-slate-800">{verificationResult.qualification_level}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Academic Session</span>
                  <span className="text-xs font-medium text-slate-800">{verificationResult.academic_year}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Admission Status</span>
                  <span className="text-xs font-semibold text-emerald-700">{verificationResult.admission_status}</span>
                </div>
              </div>
            )}

            {/* Tamper-Proof Cryptographic Seal */}
            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-teal-400" />
                  <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                    Digital Verification Cryptographic Seal
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">SHA-256 Digest</span>
              </div>
              <p className="font-mono text-[11px] text-teal-300 break-all bg-slate-950 p-2 rounded border border-slate-800">
                {verificationResult.digital_seal_hash || 'SHA-256 DIGITAL SEAL VERIFIED'}
              </p>
              <p className="text-[10px] text-slate-400">
                This verification receipt has been permanently logged in the AICTE compliance ledger with Reference #{verificationResult.reference_no}.
              </p>
            </div>

            {/* Print Receipt Action */}
            <div className="flex justify-end pt-2 print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Verification Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
