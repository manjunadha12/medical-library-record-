import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  User,
  Phone,
  Calendar,
  RefreshCw,
  Sparkles,
  UserPlus,
  Smartphone,
  Laptop,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { GoogleSignInButton } from '../components/common/GoogleSignInButton';

export const LoginPage = () => {
  const { user, login, loginWithOtp, loginWithGoogle, registerPatientWithOtp, sendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'otp' | 'password'
  const [authMode, setAuthMode] = useState('password');

  // Single-device conflict modal state
  const [activeSessionConflict, setActiveSessionConflict] = useState(null);
  const [pendingCredentials, setPendingCredentials] = useState(null); // { type: 'password' | 'otp', email, password, otp }

  // Common navigation target
  const destination = location.state?.from;
  const from = destination?.pathname || null;

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      redirectAfterLogin(user);
    }
  }, [user]);

  const redirectAfterLogin = (loggedInUser) => {
    // If previous destination was another role's dashboard or root, redirect to user's correct dashboard
    if (
      from &&
      from !== '/login' &&
      from !== '/' &&
      !from.startsWith('/dashboard')
    ) {
      navigate(from + (destination.search || '') + (destination.hash || ''), { replace: true });
    } else {
      if (loggedInUser.role === 'patient') navigate('/dashboard/patient', { replace: true });
      else if (loggedInUser.role === 'doctor') navigate('/dashboard/doctor', { replace: true });
      else if (loggedInUser.role === 'admin') navigate('/dashboard/admin', { replace: true });
      else navigate('/', { replace: true });
    }
  };

  // --- Password Login State ---
  const [passwordEmail, setPasswordEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const handlePasswordSubmit = async (e, forceLogin = false) => {
    if (e) e.preventDefault();
    setPasswordError(null);
    setPasswordLoading(true);

    try {
      const loggedUser = await login(passwordEmail, password, forceLogin);
      setActiveSessionConflict(null);
      setPendingCredentials(null);
      redirectAfterLogin(loggedUser);
    } catch (err) {
      if (err.code === 'ACTIVE_SESSION_EXISTS' && err.activeDevice) {
        setActiveSessionConflict({
          message: err.message,
          activeDevice: err.activeDevice,
        });
        setPendingCredentials({
          type: 'password',
          email: passwordEmail,
          password,
        });
      } else {
        setPasswordError(err.message || 'Login failed. Please verify your credentials.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- Email OTP Login State ---
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [otpSuccess, setOtpSuccess] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendLoginOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpEmail.trim()) {
      setOtpError('Please enter your email address.');
      return;
    }

    setOtpError(null);
    setOtpSuccess(null);
    setOtpLoading(true);

    try {
      const res = await sendOtp(otpEmail.trim(), 'login');
      setOtpSent(true);
      setCountdown(60);
      if (res?.devOtp) {
        setOtpCode(res.devOtp);
      }
      setOtpSuccess(res?.message || 'Verification code sent to your email.');
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP code. Please check your email address.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e, forceLogin = false) => {
    if (e) e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError('Please enter the 6-digit code received in your email.');
      return;
    }

    setOtpError(null);
    setOtpLoading(true);

    try {
      const loggedUser = await loginWithOtp(otpEmail.trim(), otpCode.trim(), forceLogin);
      setActiveSessionConflict(null);
      setPendingCredentials(null);
      redirectAfterLogin(loggedUser);
    } catch (err) {
      if (err.code === 'ACTIVE_SESSION_EXISTS' && err.activeDevice) {
        setActiveSessionConflict({
          message: err.message,
          activeDevice: err.activeDevice,
        });
        setPendingCredentials({
          type: 'otp',
          email: otpEmail.trim(),
          otp: otpCode.trim(),
        });
      } else {
        setOtpError(err.message || 'Invalid or expired OTP code.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleConfirmSwitchDevice = async () => {
    if (!pendingCredentials) return;
    try {
      let loggedUser = null;
      if (pendingCredentials.type === 'password') {
        setPasswordLoading(true);
        loggedUser = await login(pendingCredentials.email, pendingCredentials.password, true);
      } else if (pendingCredentials.type === 'otp') {
        setOtpLoading(true);
        loggedUser = await loginWithOtp(pendingCredentials.email, pendingCredentials.otp, true);
      } else if (pendingCredentials.type === 'google') {
        setPasswordLoading(true);
        loggedUser = await loginWithGoogle(pendingCredentials.credential, true);
      }

      if (loggedUser) {
        setActiveSessionConflict(null);
        setPendingCredentials(null);
        redirectAfterLogin(loggedUser);
      }
    } catch (err) {
      if (pendingCredentials.type === 'otp') {
        setOtpError(err.message || 'Failed to switch device. Please try again.');
      } else {
        setPasswordError(err.message || 'Failed to switch device. Please try again.');
      }
      setActiveSessionConflict(null);
      setPendingCredentials(null);
    } finally {
      setPasswordLoading(false);
      setOtpLoading(false);
    }
  };

  // --- Patient Registration Modal State ---
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGender, setRegGender] = useState('prefer_not_to_say');
  const [regDob, setRegDob] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regOtpSent, setRegOtpSent] = useState(false);
  const [regCountdown, setRegCountdown] = useState(0);
  const [regLoading, setRegLoading] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState(null);
  const [regSuccess, setRegSuccess] = useState(null);

  useEffect(() => {
    let timer;
    if (regCountdown > 0) {
      timer = setTimeout(() => setRegCountdown(regCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [regCountdown]);

  // Strict Name: Text / Letters only (no numbers)
  const handleNameKeyDown = (e) => {
    if (
      ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    // Block any digits 0-9
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleNameChange = (e) => {
    // Strip any numeric characters
    const textOnly = e.target.value.replace(/[0-9]/g, '');
    setRegName(textOnly);
  };

  // Strict Phone: Numbers only (no letters or symbols)
  const handlePhoneKeyDown = (e) => {
    if (
      ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    // Block anything that is not a numeric digit
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhoneChange = (e) => {
    // Keep numbers only and cap length at 15 digits
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
    setRegPhone(digitsOnly);
  };

  const handleSendRegisterOtp = async () => {
    if (!regEmail.trim()) {
      setRegError('Please provide a valid email address to receive your OTP.');
      return;
    }

    setRegError(null);
    setRegSuccess(null);
    setRegLoading(true);

    try {
      const res = await sendOtp(regEmail.trim(), 'register_patient');
      setRegOtpSent(true);
      setRegCountdown(60);
      if (res?.devOtp) {
        setRegOtp(res.devOtp);
      }
      setRegSuccess(res?.message || '6-digit OTP code sent to your email.');
    } catch (err) {
      setRegError(err.message || 'Failed to send OTP code.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError(null);

    // Validate name (text only)
    if (!regName.trim() || !/^[a-zA-Z\s.'-]+$/.test(regName.trim())) {
      setRegError('Patient Name must contain letters and spaces only (no numbers allowed).');
      return;
    }

    // Validate phone (digits only: 10-15 digits)
    if (!regPhone.trim() || !/^\d{10,15}$/.test(regPhone.trim())) {
      setRegError('Phone number must contain between 10 and 15 numbers (digits only).');
      return;
    }

    // Validate OTP
    if (!regOtp.trim() || regOtp.trim().length !== 6) {
      setRegError('Please enter the 6-digit verification OTP sent to your email.');
      return;
    }

    setRegLoading(true);

    try {
      const newUser = await registerPatientWithOtp({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword.trim() || undefined,
        gender: regGender,
        dateOfBirth: regDob || undefined,
        otp: regOtp.trim(),
      });

      setIsRegisterModalOpen(false);
      redirectAfterLogin(newUser);
    } catch (err) {
      setRegError(err.message || 'Registration failed. Please check the entered data.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="entry-layout">
      <aside className="entry-brand">
        <Link to="/landing" className="entry-mark"><Shield size={23} /> SecureMed Share</Link>
        <div className="entry-message">
          <span className="entry-symbol" aria-hidden="true"><Lock size={50} strokeWidth={1.4} /></span>
          <h1>Medical records,<br />shared with consent.</h1>
          <p>Store and organize your reports. Give verified clinicians access when they need it, and manage that access from one workspace.</p>
        </div>
        <Link to="/landing" className="entry-about">About SecureMed Share <ArrowRight size={16} /></Link>
      </aside>

      <main className="entry-form">
        <div className="entry-heading">
          <h2>Sign in</h2>
          <p>Use your password or request a one-time email code.</p>
        </div>
        <div className="bg-white py-7 px-6 shadow-card rounded-3xl border border-slate-200/80 sm:px-8">
          
          {/* Auth Mode Tabs */}
          <div className="grid grid-cols-2 p-1 mb-6 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setOtpError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition ${
                authMode === 'otp'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Email OTP (SMTP)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setPasswordError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition ${
                authMode === 'password'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Password Sign-In</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* TAB 1: EMAIL OTP AUTHENTICATION                          */}
          {/* ======================================================== */}
          {authMode === 'otp' && (
            <div>
              {otpError && (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{otpError}</span>
                </div>
              )}

              {otpSuccess && (
                <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{otpSuccess}</span>
                </div>
              )}

              {!otpSent ? (
                // Step 1: Request OTP
                <form onSubmit={handleSendLoginOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="e.g. patient@securemed.io"
                        className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      We will dispatch a secure 6-digit one-time passcode to this email via SMTP.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
                  >
                    {otpLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Sending OTP via SMTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit Passcode</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Step 2: Verify OTP
                <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Enter 6-Digit Passcode
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          setOtpError(null);
                        }}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Change Email
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Sent to <span className="font-medium text-slate-700">{otpEmail}</span>
                    </p>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        required
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-3 text-center tracking-[0.4em] font-mono text-base font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length !== 6}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
                  >
                    {otpLoading ? 'Verifying OTP...' : 'Verify OTP & Sign In'}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="text-center pt-2">
                    {countdown > 0 ? (
                      <span className="text-[11px] text-slate-400">
                        Resend passcode in <strong className="text-slate-600">{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendLoginOtp}
                        disabled={otpLoading}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Resend OTP Code</span>
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: STANDARD PASSWORD SIGN-IN                         */}
          {/* ======================================================== */}
          {authMode === 'password' && (
            <div>
              {passwordError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      id="login-email"
                      autoComplete="username"
                      value={passwordEmail}
                      onChange={(e) => setPasswordEmail(e.target.value)}
                      placeholder="name@securemed.io"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      id="login-password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
                >
                  {passwordLoading ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}

          {/* Patient Registration Callout / Trigger Modal */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">Or continue with</span>
            </div>
          </div>

          <div className="mb-6">
            <GoogleSignInButton
              onSuccess={(user) => {
                redirectAfterLogin(user);
              }}
              onError={(err) => {
                if (err?.code === 'ACTIVE_SESSION_EXISTS' && err.activeDevice) {
                  setActiveSessionConflict({
                    message: err.message,
                    activeDevice: err.activeDevice,
                  });
                  setPendingCredentials({
                    type: 'google',
                    credential: err.credential,
                  });
                }
              }}
            />
          </div>

          {/* Patient Registration Callout / Trigger Modal */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-50 to-teal-50 border border-brand-100 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-brand-600" />
                  <span>New Patient?</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Create an account with a verified email address
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterModalOpen(true);
                  setRegError(null);
                  setRegSuccess(null);
                }}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-sm"
              >
                Register as Patient
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">
                Healthcare provider?{' '}
                <Link to="/register/doctor" className="font-semibold text-teal-600 hover:text-teal-700">
                  Register as Doctor
                </Link>
              </p>
            </div>
          </div>


        </div>
      </main>

      {/* ======================================================== */}
      {/* PATIENT REGISTRATION MODAL                               */}
      {/* ======================================================== */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title=""
        maxWidth="max-w-xl"
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="pb-3 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles size={12} className="text-brand-600" />
              <span>Encrypted Patient Vault</span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
              Patient Account Registration
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Create your private portal with encrypted medical record storage. Complete email OTP verification to activate your account.
            </p>
          </div>

          {regError && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{regError}</span>
            </div>
          )}

          {regSuccess && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed">{regSuccess}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* 1. Identity Group */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User size={13} className="text-brand-600" />
                <span>1. Personal Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/60 text-slate-600 font-medium">Text only (no numbers)</span>
                  </div>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onKeyDown={handleNameKeyDown}
                      onChange={handleNameChange}
                      placeholder="e.g. Alex Morgan"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-xs"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/60 text-slate-600 font-medium">Numbers only (10–15 digits)</span>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={regPhone}
                      onKeyDown={handlePhoneKeyDown}
                      onChange={handlePhoneChange}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Verification Group */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Mail size={13} className="text-brand-600" />
                <span>2. Email OTP Verification</span>
              </div>

              {/* Email Address + Send OTP Button */}
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
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendRegisterOtp}
                    disabled={regLoading || regCountdown > 0 || !regEmail}
                    className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 transition shrink-0 shadow-xs cursor-pointer"
                  >
                    {regLoading
                      ? 'Sending...'
                      : regCountdown > 0
                      ? `Resend (${regCountdown}s)`
                      : regOtpSent
                      ? 'Resend Code'
                      : 'Send OTP'}
                  </button>
                </div>
              </div>

              {/* 6-Digit Email OTP */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Email OTP Code (6 Digits) <span className="text-rose-500">*</span>
                  </label>
                  {regOtpSent && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Passcode sent to email via SMTP
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
                    value={regOtp}
                    onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="w-full pl-10 pr-4 py-2.5 tracking-widest font-mono text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Password & Demographics */}
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Lock size={13} className="text-brand-600" />
                <span>3. Password & Profile (Optional)</span>
              </div>

              {/* Password */}
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
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create optional password (or sign in with OTP)"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Gender & DOB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <div className="relative">
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-xs appearance-none cursor-pointer"
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
                      value={regDob}
                      onChange={(e) => setRegDob(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Guarantee Pill */}
            <div className="p-3 rounded-xl bg-brand-50/60 border border-brand-100 flex items-start gap-2.5 text-[11px] text-slate-600">
              <Shield className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" />
              <span>
                <strong className="text-brand-800">End-to-End Encrypted:</strong> Uploaded medical records are protected with AES-256-GCM envelope encryption. Clinicians require your explicit, revocable consent to view any file.
              </span>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 text-white text-xs font-bold hover:from-brand-700 hover:to-teal-700 transition shadow-md shadow-brand-500/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {regLoading ? (
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
        </div>
      </Modal>

      {/* Active Device Session Conflict Modal */}
      <Modal
        isOpen={Boolean(activeSessionConflict)}
        onClose={() => {
          setActiveSessionConflict(null);
          setPendingCredentials(null);
        }}
        title="Active Device Session Detected"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-amber-950 mb-1">
                This account is currently logged in on another device!
              </strong>
              <p className="text-amber-800 leading-relaxed">
                For medical data security and privacy compliance, SecureMed Share enforces a <strong>single active login session</strong>.
              </p>
            </div>
          </div>

          {activeSessionConflict?.activeDevice && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Currently Logged In Device Information
              </span>
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Laptop className="h-4 w-4 text-slate-500" />
                <span>{activeSessionConflict.activeDevice.device || 'Active Device'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px]">Browser & OS:</span>
                  <span className="font-medium text-slate-700">
                    {activeSessionConflict.activeDevice.browser || 'Web Browser'} ({activeSessionConflict.activeDevice.os || 'Unknown OS'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">IP Address:</span>
                  <span className="font-mono text-slate-700">
                    {activeSessionConflict.activeDevice.ipAddress || 'Not recorded'}
                  </span>
                </div>
              </div>
              {activeSessionConflict.activeDevice.lastActivity && (
                <p className="text-[10px] text-slate-400">
                  Last active: {new Date(activeSessionConflict.activeDevice.lastActivity).toLocaleTimeString()} ({new Date(activeSessionConflict.activeDevice.lastActivity).toLocaleDateString()})
                </p>
              )}
            </div>
          )}

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
            <strong>Warning:</strong> Logging in on this device will <strong>immediately terminate the session</strong> on the other device.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setActiveSessionConflict(null);
                setPendingCredentials(null);
              }}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
            >
              Cancel Login
            </button>
            <button
              type="button"
              onClick={handleConfirmSwitchDevice}
              disabled={passwordLoading || otpLoading}
              className="px-5 py-2.5 rounded-xl bg-[#114B3E] hover:bg-[#0c362d] text-white font-semibold shadow-sm transition flex items-center gap-1.5 disabled:opacity-60"
            >
              <span>{passwordLoading || otpLoading ? 'Switching...' : 'Switch to This Device'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
