import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Users,
  UploadCloud,
  AlertTriangle,
  FileCheck2,
  BarChart3,
  History,
  UserCheck,
  Settings,
  ShieldCheck,
  Award
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAicteAdmin, isInstitutionAdmin, isVerifier, isAuditor, isStudent } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-[calc(100vh-61px)] sticky top-[61px] overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Role Badge */}
        <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Authenticated Scope</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-bold text-white capitalize">
              {user?.role.replace('_', ' ')}
            </span>
          </div>
          {user?.institution_name && (
            <p className="text-[11px] text-blue-300 truncate mt-1">{user.institution_name}</p>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-1">
          {/* AICTE Admin Navigation */}
          {isAicteAdmin && (
            <>
              <div className="text-[10px] uppercase font-bold text-slate-400 px-3 pt-2 pb-1">AICTE Central Operations</div>
              <NavLink to="/admin/dashboard" className={navItemClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>National Dashboard</span>
              </NavLink>
              <NavLink to="/admin/institutions" className={navItemClass}>
                <Building2 className="w-4 h-4" />
                <span>Institutions Registry</span>
              </NavLink>
              <NavLink to="/programmes" className={navItemClass}>
                <GraduationCap className="w-4 h-4" />
                <span>Programme & Intake</span>
              </NavLink>
              <NavLink to="/students" className={navItemClass}>
                <Users className="w-4 h-4" />
                <span>Student Registry</span>
              </NavLink>
              <NavLink to="/validation" className={navItemClass}>
                <AlertTriangle className="w-4 h-4" />
                <span>Validation & Reviews</span>
              </NavLink>
            </>
          )}

          {/* Institution Admin Navigation */}
          {isInstitutionAdmin && (
            <>
              <div className="text-[10px] uppercase font-bold text-slate-400 px-3 pt-2 pb-1">Campus Management</div>
              <NavLink to="/institution/dashboard" className={navItemClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Campus Dashboard</span>
              </NavLink>
              <NavLink to="/students" className={navItemClass}>
                <Users className="w-4 h-4" />
                <span>Enrolled Students</span>
              </NavLink>
              <NavLink to="/upload" className={navItemClass}>
                <UploadCloud className="w-4 h-4" />
                <span>Bulk CSV Upload</span>
              </NavLink>
              <NavLink to="/programmes" className={navItemClass}>
                <GraduationCap className="w-4 h-4" />
                <span>Approved Intake Limits</span>
              </NavLink>
              <NavLink to="/validation" className={navItemClass}>
                <AlertTriangle className="w-4 h-4" />
                <span>Validation Issues</span>
              </NavLink>
            </>
          )}

          {/* Verifier Navigation */}
          {isVerifier && (
            <>
              <div className="text-[10px] uppercase font-bold text-slate-400 px-3 pt-2 pb-1">Verification Portal</div>
              <NavLink to="/verify" className={navItemClass}>
                <FileCheck2 className="w-4 h-4" />
                <span>Verify Student Record</span>
              </NavLink>
            </>
          )}

          {/* Auditor Navigation */}
          {isAuditor && (
            <>
              <div className="text-[10px] uppercase font-bold text-slate-400 px-3 pt-2 pb-1">Regulatory Oversight</div>
              <NavLink to="/audit" className={navItemClass}>
                <History className="w-4 h-4" />
                <span>Audit Logs Trail</span>
              </NavLink>
              <NavLink to="/analytics" className={navItemClass}>
                <BarChart3 className="w-4 h-4" />
                <span>Intake Compliance</span>
              </NavLink>
              <NavLink to="/validation" className={navItemClass}>
                <AlertTriangle className="w-4 h-4" />
                <span>Validation Center</span>
              </NavLink>
            </>
          )}

          {/* Student Navigation */}
          {isStudent && (
            <>
              <div className="text-[10px] uppercase font-bold text-slate-400 px-3 pt-2 pb-1">Student Services</div>
              <NavLink to="/student/profile" className={navItemClass}>
                <Award className="w-4 h-4" />
                <span>My Academic Profile</span>
              </NavLink>
              <NavLink to="/verify" className={navItemClass}>
                <ShieldCheck className="w-4 h-4" />
                <span>Digital Credentials</span>
              </NavLink>
            </>
          )}

          {/* Universal Cross-Cutting Links */}
          <div className="text-[10px] uppercase font-bold text-slate-400 px-3 pt-4 pb-1">Analytics & Public</div>
          {(isAicteAdmin || isInstitutionAdmin || isAuditor) && (
            <NavLink to="/analytics" className={navItemClass}>
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Reports</span>
            </NavLink>
          )}

          <NavLink to="/verify" className={navItemClass}>
            <FileCheck2 className="w-4 h-4" />
            <span>Verification Portal</span>
          </NavLink>

          {(isAicteAdmin || isInstitutionAdmin || isAuditor) && (
            <NavLink to="/audit" className={navItemClass}>
              <History className="w-4 h-4" />
              <span>Audit Trail</span>
            </NavLink>
          )}

          {isAicteAdmin && (
            <NavLink to="/users" className={navItemClass}>
              <UserCheck className="w-4 h-4" />
              <span>User & Role Access</span>
            </NavLink>
          )}

          <NavLink to="/settings" className={navItemClass}>
            <Settings className="w-4 h-4" />
            <span>System & Integrations</span>
          </NavLink>
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>APAAR Encryption • SHA-256 HMAC</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">All India Council for Technical Education</p>
      </div>
    </aside>
  );
};
