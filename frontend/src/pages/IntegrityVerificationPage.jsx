import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  Cpu,
  CheckCircle2,
  XCircle,
  Hash,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { recordsApi, verifyApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { useAuth } from '../context/AuthContext';

export const IntegrityVerificationPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialRecordId = searchParams.get('recordId') || '';

  const [records, setRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState(initialRecordId);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    fetchRecordsList();
  }, []);

  const fetchRecordsList = async () => {
    try {
      setLoading(true);
      const res = await recordsApi.list();
      if (res.success && res.records) {
        setRecords(res.records);
        if (!selectedRecordId && res.records.length > 0) {
          setSelectedRecordId(res.records[0]._id);
        }
      }
    } catch (err) {
      console.warn('Failed to load records for verification:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedRecordId) return;
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await verifyApi.verifyRecord(selectedRecordId);
      if (res.success) {
        setVerificationResult(res.verification);
      }
    } catch (err) {
      setVerificationResult({
        status: 'Verification Failed',
        verified: false,
        hashMatch: false,
        signatureValid: false,
        failureReason: err.message,
      });
    } finally {
      setVerifying(false);
    }
  };

  const selectedRecord = records.find((r) => r._id === selectedRecordId);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="purple" size="sm">Module 4 Core Feature</Badge>
          <Badge variant="crypto" size="sm">SHA-256 & RSA-PSS</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Cryptographic Integrity & Signature Verification Studio
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Verify that medical files stored in the platform have maintained absolute byte-level integrity since upload, and authenticate the RSA-PSS digital signature issued by the Attestation Authority.
        </p>
      </div>

      {/* Verification Control Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Medical Document to Verify
            </label>
            <select
              value={selectedRecordId}
              onChange={(e) => {
                setSelectedRecordId(e.target.value);
                setVerificationResult(null);
              }}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 font-medium"
            >
              {records.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.title} — {r.category} ({new Date(r.medicalDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying || !selectedRecordId}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
          >
            {verifying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Decrypting & Verifying...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="h-4 w-4" />
                <span>Run Cryptographic Verification</span>
              </>
            )}
          </button>
        </div>

        {/* Verification Report Card */}
        {verificationResult && (
          <div
            className={`p-6 rounded-2xl border transition-all animate-in fade-in space-y-6 ${
              verificationResult.verified
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-rose-50/50 border-rose-200'
            }`}
          >
            {/* Top Status Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    verificationResult.verified
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {verificationResult.verified ? (
                    <ShieldCheck className="h-7 w-7" />
                  ) : (
                    <ShieldAlert className="h-7 w-7" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {verificationResult.verified
                        ? 'Cryptographic Verification Passed'
                        : 'Verification Failed: Integrity Mismatch'}
                    </h3>
                    <Badge
                      variant={verificationResult.verified ? 'success' : 'danger'}
                      size="sm"
                    >
                      {verificationResult.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified on {new Date(verificationResult.verifiedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Side-by-side Hash & Signature Proofs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* SHA-256 Digest Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 font-sans font-semibold text-[10px] uppercase">
                  <span>SHA-256 Plaintext Digest Comparison</span>
                  <span
                    className={
                      verificationResult.hashMatch ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'
                    }
                  >
                    {verificationResult.hashMatch ? 'MATCHES 100%' : 'MISMATCH'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Stored Original Hash:</span>
                  <span className="text-slate-800 break-all text-[11px] block mt-0.5">
                    {verificationResult.originalSha256 || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Recomputed Decrypted Hash:</span>
                  <span className="text-teal-700 font-bold break-all text-[11px] block mt-0.5">
                    {verificationResult.computedSha256 || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Digital Signature Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-slate-400 font-sans font-semibold text-[10px] uppercase">
                  <span>RSA-PSS Digital Signature Attestation</span>
                  <span
                    className={
                      verificationResult.signatureValid
                        ? 'text-emerald-600 font-bold'
                        : 'text-rose-600 font-bold'
                    }
                  >
                    {verificationResult.signatureValid ? 'VALID SIGNATURE' : 'INVALID'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Attestation Scheme:</span>
                  <span className="text-indigo-700 font-bold text-[11px] block mt-0.5">
                    {verificationResult.algorithm}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Signer Identity:</span>
                  <span className="text-slate-800 text-[11px] block mt-0.5 font-sans">
                    {verificationResult.signer?.name || 'SecureMed Share Attestation Authority'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              <strong>Technical Integrity Guarantee:</strong> Authenticated decryption confirms that the ciphertext stored on disk has remained untouched since original submission, and the RSA-PSS digital signature confirms metadata provenance.
            </p>
          </div>
        )}
      </div>

      {/* Controlled Cryptographic Integrity Test (Admin Only) */}
    </div>
  );
};
