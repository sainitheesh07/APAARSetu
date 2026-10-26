import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'aicte_admin':
        return 'AICTE Central Regulatory Admin';
      case 'institution_admin':
        return 'Institution Administrator';
      case 'verifier':
        return 'Authorized Stakeholder Verifier';
      case 'auditor':
        return 'Government Regulatory Auditor';
      case 'student':
        return 'Student Portal';
      default:
        return 'Public User';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      {/* Tricolor Government Top Strip */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2 text-white hover:opacity-90">
            <div className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight">APAARSetu</span>
                <span className="bg-blue-800 text-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                  Govt. of India • AICTE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">National APAAR Student Verification & Intake Platform</p>
            </div>
          </Link>
        </div>

        {/* Right: User Profile, Logout */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white leading-none">{user.full_name}</p>
                <p className="text-[11px] text-blue-300 mt-0.5">
                  {user.institution_name ? `${user.institution_name} • ` : ''}
                  {getRoleDisplayName(user.role)}
                </p>
              </div>

              <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm border border-blue-400">
                {user.full_name.charAt(0)}
              </div>

              <button
                onClick={logout}
                title="Sign out of APAARSetu"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Portal Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
