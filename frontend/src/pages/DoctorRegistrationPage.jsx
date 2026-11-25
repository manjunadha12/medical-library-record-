import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Stethoscope,
  User,
  Mail,
  Lock,
  Phone,
  Award,
  Building,
  GraduationCap,
  FileText,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  BadgeCheck,
  Clock,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'General Medicine',
  'Oncology',
  'Orthopedics',
  'Radiology',
  'Pediatrics',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Pulmonology',
  'Nephrology',
  'Psychiatry',
  'Emergency Medicine',
  'Anesthesiology',
  'Other',
];

export const DoctorRegistrationPage = () => {
  const { registerDoctor, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: 'Cardiology',
    licenseNumber: '',
    hospitalAffiliation: '',
    experienceYears: 5,
    qualification: 'MBBS, MD',
    bio: '',
  });

  const [submittedDoctor, setSubmittedDoctor] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Real-time password criteria
  const passwordCriteria = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setError('Physician name is required (minimum 2 characters).');
      return;
    }

    if (!formData.email.trim()) {
      setError('Professional email address is required.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must meet all complexity requirements (8+ characters, uppercase, lowercase, number, special character).');
      return;
    }

    if (!formData.licenseNumber.trim() || formData.licenseNumber.trim().length < 3) {
      setError('A valid medical license or registration number is required.');
      return;
    }

    if (!formData.hospitalAffiliation.trim()) {
      setError('Hospital or clinic affiliation is required.');
      return;
    }

    if (!formData.qualification.trim()) {
      setError('Clinical qualifications are required (e.g. MBBS, MD).');
      return;
    }

    setLoading(true);

    try {
      await registerDoctor({
        ...formData,
        experienceYears: Number(formData.experienceYears) || 0,
      });
      setSubmittedDoctor({ ...formData });
    } catch (err) {
      setError(err.message || 'Doctor registration failed. Please review the form and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="entry-layout">
      {/* ======================================================== */}
      {/* LEFT CLINICAL BRAND PANEL                                */}
      {/* ======================================================== */}
      <aside className="entry-brand">
        <Link to="/" className="entry-mark flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20 backdrop-blur-sm shadow-inner">
            <Shield size={20} className="text-teal-300" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white leading-none">
              SecureMed Share
            </div>
            <div className="text-[11px] font-semibold tracking-wider text-teal-300 uppercase mt-0.5">
              Verified Clinical Registry
            </div>
          </div>
        </Link>

        <div className="entry-message my-auto py-8">
          <div className="entry-symbol bg-teal-500/15 border-teal-300/30 text-teal-300 shadow-xl shadow-teal-950/40">
            <Stethoscope size={46} strokeWidth={1.5} />
          </div>

          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Clinical Excellence.<br />
            <span className="text-teal-300">Cryptographically</span> Protected.
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed mt-4 max-w-md">
            Review patient diagnostics with end-to-end cryptographic confidentiality. All access is governed by patient consent grants, AES-256-GCM envelope encryption, and immutable audit logs.
          </p>

          {/* Clinical Pillars */}
          <div className="mt-8 space-y-3.5 max-w-md">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 mt-0.5">
                <BadgeCheck size={18} />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">Administrator Vetted</div>
                <div className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                  Medical licenses are cross-referenced before patient record access is unlocked.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300 mt-0.5">
                <Shield size={18} />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">AES-256-GCM Envelope Protection</div>
                <div className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                  Decryption keys remain transient and tied to active, time-bounded consent grants.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 mt-0.5">
                <Clock size={18} />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">Single-Device Active Session</div>
                <div className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                  Session security automatically blocks concurrent account hijacking attempts.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Healthcare Compliance Ready</span>
          <Link to="/" className="text-teal-300 hover:text-teal-200 transition flex items-center gap-1 font-semibold">
            About System <ArrowRight size={14} />
          </Link>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* RIGHT REGISTRATION FORM OR CONFIRMATION SCREEN           */}
      {/* ======================================================== */}
      <main className="entry-form w-full max-w-2xl py-10 px-6 sm:px-10 overflow-y-auto">
        {submittedDoctor ? (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="text-center pb-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 shadow-sm mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold tracking-wide uppercase mb-2">
                <Clock size={12} className="text-amber-600" />
                <span>Verification In Progress</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Application Submitted Successfully
              </h2>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                Thank you, Dr. {submittedDoctor.name}. Your clinician profile has been registered and submitted for administrator license verification.
              </p>
            </div>

            {/* Compliance Review Notice */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 text-amber-950 text-xs shadow-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Info size={16} className="text-amber-600" />
                <span>What Happens Next?</span>
              </div>
              <ul className="space-y-1.5 text-amber-900/90 pl-5 list-disc text-[11px] leading-relaxed">
                <li>
                  <strong>Institutional Verification:</strong> Hospital compliance administrators review your license (<strong>{submittedDoctor.licenseNumber}</strong>) against the medical registry before granting patient access (typically within 24–48 hours).
                </li>
                <li>
                  <strong>Record Access Locked:</strong> In compliance with medical privacy laws, access requests cannot be sent until an administrator verifies your credentials.
                </li>
                <li>
                  <strong>Email Notification:</strong> You will receive a verification update email at <strong>{submittedDoctor.email}</strong> once approved.
                </li>
              </ul>
            </div>

            {/* Application Summary Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Submitted Clinician Profile</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                  Pending Admin Review
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Physician Name</span>
                  <span className="font-semibold text-slate-800">Dr. {submittedDoctor.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Medical License No.</span>
                  <span className="font-semibold text-slate-800 uppercase">{submittedDoctor.licenseNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Specialization</span>
                  <span className="font-semibold text-slate-800">{submittedDoctor.specialization}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Hospital Affiliation</span>
                  <span className="font-semibold text-slate-800">{submittedDoctor.hospitalAffiliation}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Qualifications</span>
                  <span className="font-semibold text-slate-800">{submittedDoctor.qualification}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/doctor')}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition shadow-md shadow-teal-600/20 cursor-pointer active:scale-[0.99]"
              >
                <span>Go to Clinician Dashboard (Pending Preview)</span>
                <ArrowRight size={15} />
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await logout();
                  } catch (e) {}
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs cursor-pointer"
              >
                <span>Sign Out & Return to Login</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="entry-heading mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold tracking-wide uppercase mb-3">
            <Sparkles size={13} className="text-teal-600" />
            <span>Clinician Onboarding</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Doctor / Clinician Registration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Join the verified provider network on SecureMed Share.
          </p>
        </div>

        {/* Compliance Alert Box */}
        <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 text-amber-900 text-xs shadow-xs">
          <Info className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold text-amber-950">Admin Verification Required:</strong> In accordance with healthcare compliance standards, doctor accounts require administrator review and license verification before accessing patient medical records.
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: IDENTITY & LOGIN CREDENTIALS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <User size={14} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Physician Identity & Account
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physician Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Dr. Sarah Jenkins"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="s.jenkins@academic-med.org"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Min 8 characters</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Password Criteria Checklist */}
                {formData.password.length > 0 && (
                  <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] space-y-1">
                    <div className="font-semibold text-slate-600 mb-1">Password Requirements:</div>
                    <div className="grid grid-cols-2 gap-1 text-slate-500">
                      <span className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-emerald-600 font-semibold' : ''}`}>
                        <Check size={11} className={passwordCriteria.length ? 'text-emerald-600' : 'text-slate-300'} />
                        8+ characters
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.uppercase ? 'text-emerald-600 font-semibold' : ''}`}>
                        <Check size={11} className={passwordCriteria.uppercase ? 'text-emerald-600' : 'text-slate-300'} />
                        Uppercase (A-Z)
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.lowercase ? 'text-emerald-600 font-semibold' : ''}`}>
                        <Check size={11} className={passwordCriteria.lowercase ? 'text-emerald-600' : 'text-slate-300'} />
                        Lowercase (a-z)
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.number ? 'text-emerald-600 font-semibold' : ''}`}>
                        <Check size={11} className={passwordCriteria.number ? 'text-emerald-600' : 'text-slate-300'} />
                        Number (0-9)
                      </span>
                      <span className={`flex items-center gap-1 col-span-2 ${passwordCriteria.special ? 'text-emerald-600 font-semibold' : ''}`}>
                        <Check size={11} className={passwordCriteria.special ? 'text-emerald-600' : 'text-slate-300'} />
                        Special symbol (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 234-8890"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Used for urgent clinical consent notifications and security verifications.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: LICENSING & CLINICAL ROLE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <Award size={14} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Licensing & Specialization
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medical License / Reg No. <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="MD-CARDIO-88392"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition uppercase"
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  State / National medical council registration ID.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Specialization <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition appearance-none cursor-pointer"
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital / Clinic Affiliation <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    name="hospitalAffiliation"
                    value={formData.hospitalAffiliation}
                    onChange={handleChange}
                    placeholder="Metropolitan University Hospital"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Years of Practice Experience
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    min={0}
                    max={60}
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: QUALIFICATIONS & PROFILE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <GraduationCap size={14} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Qualifications & Focus
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Qualifications & Degrees <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="MBBS, MD (Cardiology), FACC"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Degrees, fellowships, and clinical certifications displayed on your verified registry badge.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Bio / Clinical Focus
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Specializing in diagnostic cardiology, echocardiography, and preventative cardiovascular intervention..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Brief summary visible to patients requesting consultation or sharing diagnostic records.
              </p>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 text-white text-xs font-bold hover:from-teal-700 hover:to-teal-800 transition shadow-lg shadow-teal-600/25 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Clinical Credentials for Verification...</span>
                </>
              ) : (
                <>
                  <BadgeCheck size={16} />
                  <span>Register for Doctor Credentials</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* BOTTOM NAVIGATION FOOTER */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700 hover:underline">
              Sign In
            </Link>
          </div>
          <div>
            Are you a patient?{' '}
            <Link to="/register/patient" className="font-semibold text-slate-700 hover:text-brand-600 hover:underline">
              Patient Registration
            </Link>
          </div>
        </div>
          </>
        )}
      </main>
    </div>
  );
};
