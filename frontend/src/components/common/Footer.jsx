import React from 'react';
import { Shield, Lock, FileCheck, CheckCircle2 } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[var(--bg-card)] border-t border-[var(--border-subtle)] py-8 px-4 sm:px-6 lg:px-8 mt-auto text-[var(--text-muted)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Shield className="h-3.5 w-3.5" />
          </div>
          <span className="font-semibold text-slate-700">SecureMed Share</span>
          <span>— Innovative Privacy-Preserving Medical Record Sharing System</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-teal-600 font-medium">
            <Lock className="h-3 w-3" /> AES-256-GCM
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-brand-600 font-medium">
            <FileCheck className="h-3 w-3" /> SHA-256 Integrity
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-indigo-600 font-medium">
            <CheckCircle2 className="h-3 w-3" /> RSA-PSS Signatures
          </span>
        </div>

        <p className="text-slate-400">Final-Year Academic Capstone Project</p>
      </div>
    </footer>
  );
};
