import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-card max-w-md w-full text-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 mx-auto shadow-md">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div>
          <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Access Unauthorized
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            You do not possess the required authorization level or active patient consent grant to access this medical resource.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Security Access Governance:</p>
          <p className="text-[11px] text-slate-500">
            • Patients own their medical files.<br />
            • Doctors require administrator verification and active patient consent.<br />
            • Administrators cannot decrypt medical records.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to={user ? `/dashboard/${user.role}` : '/'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
          >
            <Home className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            to="/records"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
          >
            <span>My Records</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
