import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { authApi } from '../services/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to dispatch password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-lg shadow-brand-500/25">
            <Shield className="h-6 w-6" />
          </div>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered email address to receive password reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-card rounded-3xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Check Your Email</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                If an account exists with <span className="font-semibold text-slate-700">{email}</span>, we have sent instructions to reset your password. The link expires in 1 hour.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {loading ? 'Dispatching Link...' : 'Send Reset Link'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link to="/login" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Remember your password? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
