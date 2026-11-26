import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  FileCheck2,
  Clock,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PatientRegistrationPage = () => {
  const { registerPatientWithOtp, sendOtp } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    gender: 'prefer_not_to_say',
    dateOfBirth: '',
    otp: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Strict Name: Letters and spaces only
  const handleNameKeyDown = (e) => {
    if (
      ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleNameChange = (e) => {
    const textOnly = e.target.value.replace(/[0-9]/g, '');
    setFormData((prev) => ({ ...prev, name: textOnly }));
  };

  // Strict Phone: Numbers only (10–15 digits)
  const handlePhoneKeyDown = (e) => {
    if (
      ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
    setFormData((prev) => ({ ...prev, phone: digitsOnly }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Dispatch OTP via SMTP
  const handleSendOtp = async () => {
    if (!formData.email.trim()) {
      setError('Please provide a valid email address to receive your verification code.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await sendOtp(formData.email.trim(), 'register_patient');
      setOtpSent(true);
      setCountdown(60);
      if (res?.devOtp) {
        setFormData((prev) => ({ ...prev, otp: res.devOtp }));
      }
      setSuccess(res?.message || 'A 6-digit verification code was sent to your email.');
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !/^[a-zA-Z\s.'-]+$/.test(formData.name.trim())) {
      setError('Patient Name must contain letters and spaces only (no numbers allowed).');
      return;
    }

    if (!formData.phone.trim() || !/^\d{10,15}$/.test(formData.phone.trim())) {
      setError('Phone number must contain between 10 and 15 digits (numbers only).');
      return;
    }

    if (!formData.otp.trim() || formData.otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification OTP code sent to your email.');
      return;
    }

    setLoading(true);

    try {
      await registerPatientWithOtp({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password.trim() || undefined,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        otp: formData.otp.trim(),
      });
      navigate('/dashboard/patient');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check the entered data and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="entry-layout">
      {/* ======================================================== */}
      {/* LEFT PATIENT HERO BRAND PANEL                            */}
      {/* ======================================================== */}
      <aside className="entry-brand">
        <Link to="/" className="entry-mark flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20 backdrop-blur-sm shadow-inner">
            <Shield size={20} className="text-brand-300" />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-white leading-none">
              SecureMed Share
            </div>
            <div className="text-[11px] font-semibold tracking-wider text-brand-300 uppercase mt-0.5">
              Personal Health Vault
            </div>
          </div>
        </Link>

        <div className="entry-message my-auto py-8">
          <div className="entry-symbol bg-brand-500/15 border-brand-300/30 text-brand-300 shadow-xl shadow-brand-950/40">
            <HeartPulse size={46} strokeWidth={1.5} />
          </div>

          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Your Medical Vault.<br />
            <span className="text-teal-300">Strictly Under</span> Your Control.
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed mt-4 max-w-md">
            Upload, protect, and selectively share diagnostic reports with verified clinicians. Encrypted with AES-256-GCM envelope cryptography.
          </p>

          {/* Privacy & Security Highlights */}
          <div className="mt-8 space-y-3.5 max-w-md">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300 mt-0.5">
                <Shield size={18} />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">Client-Controlled Consent</div>
                <div className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                  Clinicians can only view your records when you approve an explicit, time-bounded grant.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 mt-0.5">
                <FileCheck2 size={18} />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">AES-256-GCM Envelope Encryption</div>
                <div className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                  Every document receives a unique cryptographic key. Zero unencrypted storage.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 mt-0.5">
                <Clock size={18} />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white">Instant Consent Revocation</div>
                <div className="text-slate-300 mt-0.5 text-[11px] leading-relaxed">
                  Revoke doctor access anytime with a single click from your patient dashboard.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Patient Privacy Aligned</span>
          <Link to="/" className="text-teal-300 hover:text-teal-200 transition flex items-center gap-1 font-semibold">
            About SecureMed <ArrowRight size={14} />
          </Link>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* RIGHT REGISTRATION FORM                                  */}
      {/* ======================================================== */}
      <main className="entry-form w-full max-w-xl py-10 px-6 sm:px-10 overflow-y-auto">
        <div className="entry-heading mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-[11px] font-bold tracking-wide uppercase mb-3">
            <Sparkles size={13} className="text-brand-600" />
            <span>Patient Onboarding</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Patient Account Registration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create your patient portal with encrypted medical record storage. Complete email OTP verification to activate.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* GROUP 1: IDENTITY */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <User size={14} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Personal Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">Text only</span>
                </div>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    name="name"
                    value={formData.name}
                    onKeyDown={handleNameKeyDown}
                    onChange={handleNameChange}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">10–15 digits</span>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    name="phone"
                    value={formData.phone}
                    onKeyDown={handlePhoneKeyDown}
                    onChange={handlePhoneChange}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 2: EMAIL OTP VERIFICATION */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Mail size={14} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Instant Email Verification
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alex@example.com"
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || countdown > 0 || !formData.email}
                  className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 transition shrink-0 shadow-xs cursor-pointer"
                >
                  {loading
                    ? 'Sending...'
                    : countdown > 0
                      ? `Resend (${countdown}s)`
                      : otpSent
                        ? 'Resend Code'
                        : 'Send OTP'}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Email OTP Code (6 Digits) <span className="text-rose-500">*</span>
                </label>
                {otpSent && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Dispatched via SMTP
                  </span>
                )}
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  name="otp"
                  value={formData.otp}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Enter 6-digit code"
                  className="w-full pl-10 pr-4 py-2.5 tracking-widest font-mono text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                />
              </div>
            </div>
          </div>

          {/* GROUP 3: SECURITY & PROFILE */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Lock size={14} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Security & Demographics (Optional)
              </h3>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password (Optional — for password sign-in)
                </label>
                <span className="text-[10px] text-slate-400">Can also log in via OTP</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create optional password (or sign in with OTP)"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <div className="relative">
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition appearance-none cursor-pointer"
                  >
                    <option value="prefer_not_to_say">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Pill */}
          <div className="p-3.5 rounded-2xl bg-brand-50/70 border border-brand-100 flex items-start gap-2.5 text-[11px] text-slate-600">
            <Shield className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" />
            <span>
              <strong className="text-brand-800">Privacy Guarantee:</strong> Uploaded medical records will be encrypted with AES-256-GCM. No doctor or administrator can view your records without your active consent grant.
            </span>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-teal-600 text-white text-xs font-bold hover:from-brand-700 hover:to-teal-700 transition shadow-lg shadow-brand-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying OTP & Creating Account...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Verify OTP & Complete Registration</span>
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
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
              Sign In
            </Link>
          </div>
          <div>
            Are you a clinician?{' '}
            <Link to="/register/doctor" className="font-semibold text-teal-600 hover:text-teal-700 hover:underline">
              Doctor Registration
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
