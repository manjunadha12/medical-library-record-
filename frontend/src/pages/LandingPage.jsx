import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck2,
  History,
  ArrowRight,
  CheckCircle,
  FileText,
  Users,
  Eye,
  Server,
  Cpu,
  ChevronRight,
  Database,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-md shadow-brand-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-lg">SecureMed</span>
                <span className="font-semibold text-brand-600 text-lg">Share</span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 tracking-wider uppercase -mt-1 hidden sm:block">
                Privacy-Preserving EHR
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#workflow" className="hover:text-brand-600 transition">How It Works</a>
            <a href="#modules" className="hover:text-brand-600 transition">Core Modules</a>
            <a href="#security" className="hover:text-brand-600 transition">Cryptography</a>
            <a href="#roles" className="hover:text-brand-600 transition">User Roles</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={`/dashboard/${user.role}`}
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register/patient"
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-brand-200/40 via-teal-100/30 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-bottom-2">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span>Final-Year Capstone Project • Zero-Trust Medical Privacy</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Your Health Records.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-teal-600 to-indigo-600">
              Your Privacy.
            </span>{' '}
            Your Control.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Securely store, encrypt, verify, and share your medical records with trusted healthcare professionals through fine-grained, patient-mediated consent.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register/patient"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 shadow-md shadow-brand-500/25 transition group"
            >
              <span>Get Started as Patient</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
            </Link>

            <a
              href="#workflow"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition shadow-xs"
            >
              Explore Features
            </a>
          </div>

          {/* Production Access Portals */}
          <div className="mt-12 max-w-2xl mx-auto p-4 rounded-2xl bg-white border border-slate-200 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-left">
                <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Role-Based Secure Healthcare Access
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Patient data sovereignty with cryptographic verification for licensed physicians
                  </p>
                </div>
              </div>
              <Badge variant="cyan" size="sm">Active Guard</Badge>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <Link
                to="/register/patient"
                className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:border-brand-200 border border-slate-200/80 transition text-center group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-brand-700">Patient Portal</span>
                <span className="text-[10px] text-slate-500">Register / Manage Records</span>
              </Link>
              <Link
                to="/register/doctor"
                className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200/80 transition text-center group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700">Doctor Portal</span>
                <span className="text-[10px] text-slate-500">Physician Registration</span>
              </Link>
              <Link
                to="/login"
                className="flex flex-col items-center justify-center py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200/80 transition text-center group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">System Sign In</span>
                <span className="text-[10px] text-slate-500">Secure Account Access</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Workflow Section */}
      <section id="workflow" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="primary" size="sm">End-to-End Architecture</Badge>
            <h2 className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">
              Cryptographic Workflow & Lifecycle
            </h2>
            <p className="text-slate-600 mt-2 text-sm">
              From the moment a patient uploads a medical report to when a verified doctor reviews it, security and patient consent are mathematically enforced.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 relative">
            {/* Step 1: Upload */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 relative text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Upload</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Patient uploads PDF/JPG/PNG report. File buffer held strictly in memory.
              </p>
            </div>

            {/* Step 2: Encrypt */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 relative text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Envelope Encrypt</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Unique 256-bit DEK generated per file; wrapped with Master Key via AES-256-GCM.
              </p>
            </div>

            {/* Step 3: Consent */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 relative text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Doctor Request</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Verified doctor requests permission with clinical purpose and time window.
              </p>
            </div>

            {/* Step 4: Patient Approval */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 relative text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm mb-4">
                4
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Patient Grant</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Patient approves: selects View vs Download permission and expiry duration.
              </p>
            </div>

            {/* Step 5: Verify */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 relative text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold text-sm mb-4">
                5
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Integrity Verify</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                SHA-256 hash & RSA-PSS digital signatures validated on every decrypted stream.
              </p>
            </div>

            {/* Step 6: Audit */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 relative text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700 font-bold text-sm mb-4">
                6
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Audit Trail</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Immutable event recorded with actor, outcome, and timestamp; patient notified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Four Core Modules Section */}
      <section id="modules" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="cyan" size="sm">Modular Engineering</Badge>
            <h2 className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">
              The Four Core System Modules
            </h2>
            <p className="text-slate-600 mt-2 text-sm">
              Engineered according to rigorous cybersecurity principles and modern medical privacy standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Module 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Module 1</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Medical Record Management
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Structured clinical reports categorized into Blood Tests, MRI, CT Scans, X-rays, Prescriptions, Lab Reports, and Discharge Summaries. Enforces strict MIME validation, ownership checks, and safe streaming without exposing public URLs.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  PDF, JPEG, and PNG format support with inline browser viewing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Rich medical metadata: clinical dates, hospital name, and physician notes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Strict ownership boundary: users cannot access unpermitted files
                </li>
              </ul>
            </div>

            {/* Module 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-6">
                <Lock className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Module 2</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Encrypted Storage & Key Management
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Envelope encryption architecture using AES-256-GCM. Plaintext files are never written to disk. Every record is protected by a unique ephemeral Data Encryption Key (DEK) wrapped by a protected Master Key.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Authenticated AES-256-GCM with 96-bit random IV and 128-bit AuthTag
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Zero plaintext leakage: modified ciphertext is rejected instantly
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Key versioning and envelope metadata stored securely
                </li>
              </ul>
            </div>

            {/* Module 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6">
                <KeyRound className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Module 3</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Consent-Based Access Control
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Patient-empowered access governance. Doctors request access for clinical reasons. Patients grant granular View or View & Download permissions with custom expiration windows (1h, 24h, 7d, custom).
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Doctors must be administrator-verified before requesting patient records
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Instant revocation: patient can terminate doctor access at any second
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Server-side enforcement checks doctor identity and expiration on every call
                </li>
              </ul>
            </div>

            {/* Module 4 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-6">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Module 4</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Integrity Verification & Audit Logging
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                SHA-256 cryptographic hashes and RSA-PSS digital signatures verify record authenticity. An immutable append-only audit trail logs all uploads, views, downloads, consent events, and denied access attempts.
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  RSA-PSS digital signatures authenticate system attestation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Verify the integrity and digital signature of stored reports
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Full CSV export for security compliance and audit oversight
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Showcase */}
      <section id="roles" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="purple" size="sm">Role-Based Access Governance</Badge>
            <h2 className="text-3xl font-bold text-slate-900 mt-3 tracking-tight">
              Three Distinct Architectural Roles
            </h2>
            <p className="text-slate-600 mt-2 text-sm">
              Strict separation of concerns ensures that administrators manage the platform without accessing patient medical content.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Role 1</span>
                <Badge variant="cyan" size="sm">Record Owner</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Patient</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Uploads medical records, monitors encryption status, grants or revokes consent, defines permission duration, and receives real-time notifications whenever a doctor views or downloads a record.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Role 2</span>
                <Badge variant="primary" size="sm">Verified Clinician</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Doctor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registers medical license, undergoes administrator verification, requests record access with clinical rationale, views authorized records, and verifies document integrity with cryptographic proof.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Role 3</span>
                <Badge variant="purple" size="sm">Security Overseer</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Administrator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Validates doctor credentials, manages user statuses, and monitors security alerts. Enforces zero-trust: administrators CANNOT decrypt patient medical reports or view private encryption keys.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base">SecureMed Share</span>
              <p className="text-xs text-slate-400">Innovative Privacy-Preserving Medical Record Sharing System</p>
            </div>
          </div>

          <div className="text-xs text-center md:text-right font-mono text-slate-400">
            <p>AES-256-GCM • SHA-256 • RSA-PSS • Zero-Trust Architecture</p>
            <p className="mt-1 text-slate-500">Enterprise Privacy-Preserving Health Record Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
