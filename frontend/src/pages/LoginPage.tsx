import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both institutional email and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(email, password);
      // Role-aware redirect
      if (user.role === 'aicte_admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'institution_admin') {
        navigate('/institution/dashboard');
      } else if (user.role === 'verifier') {
        navigate('/verify');
      } else if (user.role === 'auditor') {
        navigate('/audit');
      } else if (user.role === 'student') {
        navigate('/student/profile');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Cannot connect to backend server. Please make sure the backend is running at http://127.0.0.1:8001.');
      } else {
        setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Password@123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Tricolor Government Top Strip */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center bg-blue-600 text-white p-3 rounded-xl shadow-lg mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">APAARSetu</h2>
        <p className="mt-1 text-xs text-blue-300 font-medium uppercase tracking-wider">
          AICTE & APAAR National Verification Platform • Government of India
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-950/80 border border-rose-600 text-rose-200 text-xs flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Institutional Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@institution.edu.in"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating with Regulatory Node...</span>
              ) : (
                <>
                  <span>Sign In to Regulatory Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Authorized Role Fast Login Section */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <div className="flex items-center space-x-2 text-xs font-semibold text-teal-400 mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Authorized System Role Fast Login</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('aicte.admin@apaarsetu.gov.in')}
                className="p-2.5 bg-slate-900/90 hover:bg-blue-900/60 border border-slate-700 rounded-lg text-slate-200 transition-colors text-left"
              >
                <div className="font-bold text-blue-400">AICTE Admin</div>
                <div className="text-[10px] text-slate-400 truncate">aicte.admin@apaarsetu.gov.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@iitd.ac.in')}
                className="p-2.5 bg-slate-900/90 hover:bg-blue-900/60 border border-slate-700 rounded-lg text-slate-200 transition-colors text-left"
              >
                <div className="font-bold text-emerald-400">IIT Delhi Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@iitd.ac.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@bits-pilani.ac.in')}
                className="p-2.5 bg-slate-900/90 hover:bg-blue-900/60 border border-slate-700 rounded-lg text-slate-200 transition-colors text-left"
              >
                <div className="font-bold text-indigo-400">BITS Pilani Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@bits-pilani.ac.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('verifier@tcs.com')}
                className="p-2.5 bg-slate-900/90 hover:bg-blue-900/60 border border-slate-700 rounded-lg text-slate-200 transition-colors text-left"
              >
                <div className="font-bold text-purple-400">Authorized Verifier</div>
                <div className="text-[10px] text-slate-400 truncate">verifier@tcs.com (TCS)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('auditor@cag.gov.in')}
                className="p-2.5 bg-slate-900/90 hover:bg-blue-900/60 border border-slate-700 rounded-lg text-slate-200 transition-colors text-left"
              >
                <div className="font-bold text-amber-400">CAG Auditor</div>
                <div className="text-[10px] text-slate-400 truncate">auditor@cag.gov.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('student@iitd.ac.in')}
                className="p-2.5 bg-slate-900/90 hover:bg-blue-900/60 border border-slate-700 rounded-lg text-slate-200 transition-colors text-left"
              >
                <div className="font-bold text-teal-400">Student Portal</div>
                <div className="text-[10px] text-slate-400 truncate">student@iitd.ac.in</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Default Regulatory Access Password: <code className="text-blue-300 font-mono">Password@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
