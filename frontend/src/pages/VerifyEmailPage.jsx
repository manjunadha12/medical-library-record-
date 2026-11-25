import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Shield, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { authApi } from '../services/api';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setVerified(false);
      setMessage('No verification token provided in URL.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authApi.verifyEmail(token);
        setVerified(true);
        setMessage(res.message || 'Your email has been verified successfully!');
      } catch (err) {
        setVerified(false);
        setMessage(err.message || 'Email verification link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-lg shadow-brand-500/25">
            <Shield className="h-6 w-6" />
          </div>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Email Verification
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-card rounded-3xl border border-slate-200/80 text-center sm:px-10 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <RefreshCw className="h-8 w-8 text-brand-600 animate-spin" />
              <p className="text-xs text-slate-500">Verifying your email token...</p>
            </div>
          ) : verified ? (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Email Verified Successfully</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-sm"
                >
                  Proceed to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <XCircle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Verification Failed</h3>
              <p className="text-xs text-rose-600 leading-relaxed">{message}</p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
