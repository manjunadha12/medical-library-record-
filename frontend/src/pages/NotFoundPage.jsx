import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-card max-w-md w-full text-center space-y-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 mx-auto shadow-md">
          <Shield className="h-8 w-8" />
        </div>

        <div>
          <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full uppercase">
            HTTP 404 Not Found
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            The requested medical portal URL or route does not exist.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-sm"
          >
            <Home className="h-4 w-4" />
            <span>Return to SecureMed Share</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
