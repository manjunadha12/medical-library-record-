import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Lock,
  Copy,
  Download,
  Eye,
  FileCheck2,
  Calendar,
  Building,
  User,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { recordsApi, verifyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Modal } from '../components/common/Modal';

export const RecordDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setCopyStatus('');
    fetchRecordDetails();
  }, [id]);

  const fetchRecordDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [recRes, secRes] = await Promise.all([
        recordsApi.getById(id),
        recordsApi.getSecurity(id),
      ]);

      if (recRes.success) setRecord(recRes.record);
      if (secRes.success) setSecurity(secRes.security);
    } catch (err) {
      setError(err.message || 'Failed to load record details.');
    } finally {
      setLoading(false);
    }
  };

  async function copyRecordId() {
    try {
      await navigator.clipboard.writeText(id);
      setCopyStatus('Record ID copied.');
    } catch {
      setCopyStatus('Copy the ID from the field above.');
    }
  }

  const handlePreview = async () => {
    try {
      setPreviewLoading(true);
      const blob = await recordsApi.preview(id);
      const url = window.URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      setPreviewModalOpen(true);
    } catch (err) {
      alert(`Preview failed: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await recordsApi.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.originalFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download blocked: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" count={3} />
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Record Unavailable</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{error || 'Record could not be loaded.'}</p>
        <Link
          to="/records"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Records</span>
        </Link>
      </div>
    );
  }

  const canDownload = user?.role === 'patient' || record.doctorPermission === 'view_download';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link
          to="/records"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Medical Records</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="cyan" size="sm">{record.category}</Badge>
            <Badge variant="crypto" size="sm" className="gap-1"><Lock size={12} aria-hidden="true" /> Encrypted</Badge>
            <Badge variant="purple" size="sm">RSA-PSS Signed</Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{record.title}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Original File: <span className="font-mono text-slate-700">{record.originalFileName}</span> • {(record.fileSize / 1024).toFixed(1)} KB
          </p>
        </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'patient' && (
              <Link
                to={`/consent-management?recordId=${record._id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#114B3E] text-white text-xs font-semibold hover:bg-[#0c362d] transition shadow-sm"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Share with Doctor</span>
              </Link>
            )}

            {user?.role !== 'admin' && (
              <button
                onClick={handlePreview}
                disabled={previewLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F2922] text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
              >
                <Eye className="h-4 w-4" />
                <span>{previewLoading ? 'Decrypting Stream...' : 'Preview Decrypted Report'}</span>
              </button>
            )}

            {canDownload && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Download File</span>
              </button>
            )}

            <Link
              to={`/integrity-verification?recordId=${record._id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition"
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Verify Integrity</span>
            </Link>
          </div>
        </div>

      {user?.role === 'patient' && (
        <section className="overview-panel">
          <header><h2><KeyRound size={18} /> Share a record ID</h2></header>
          <div className="overview-inset">
            <p className="mb-3">Send this ID to your doctor so they can request access. You approve the request before they can open the record.</p>
            <div className="flex flex-wrap gap-2">
              <input readOnly aria-label="Medical record ID" value={id} onFocus={(event) => event.target.select()} className="w-64 max-w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-mono" />
              <button type="button" className="overview-button" onClick={copyRecordId}><Copy size={15} />Copy ID</button>
            </div>
            <p role="status" className="mt-2">{copyStatus}</p>
          </div>
        </section>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clinical Information */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            Clinical Metadata & Patient Information
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                Examination Date:
              </span>
              <span className="font-semibold text-slate-800">
                {new Date(record.medicalDate).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building className="h-4 w-4 text-slate-400" />
                Hospital / Facility:
              </span>
              <span className="font-semibold text-slate-800">{record.hospitalName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                Attending Physician:
              </span>
              <span className="font-semibold text-slate-800">{record.doctorName || 'Not specified'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                Patient Owner:
              </span>
              <span className="font-semibold text-slate-800">{record.patient?.name || 'Alex Morgan'}</span>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-500 block mb-1">Clinical Notes & Findings:</span>
              <p className="p-3 rounded-xl bg-slate-50 text-slate-700 leading-relaxed font-sans">
                {record.description || 'No diagnostic notes attached to this record.'}
              </p>
            </div>
          </div>
        </div>

        {/* Envelope Encryption & Security Specs */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-teal-600" />
              <span>Cryptographic Protection Envelope</span>
            </h3>
            <Badge variant="crypto" size="sm">Module 2</Badge>
          </div>

          <div className="space-y-3 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 text-[10px] block font-sans font-semibold uppercase">
                Original Plaintext SHA-256 Digest
              </span>
              <span className="text-slate-800 font-semibold break-all bg-slate-50 p-1.5 rounded-lg block mt-0.5">
                {record.originalSha256}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 text-[10px] block font-sans font-semibold uppercase">
                  Cipher Initialization Vector (IV)
                </span>
                <span className="text-teal-700 font-bold bg-slate-50 p-1.5 rounded-lg block mt-0.5 truncate">
                  {security?.ivHex || '96-bit Random Hex'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans font-semibold uppercase">
                  GCM AuthTag (128-bit)
                </span>
                <span className="text-teal-700 font-bold bg-slate-50 p-1.5 rounded-lg block mt-0.5 truncate">
                  {security?.authTagHex || '128-bit Authentication Tag'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block font-sans font-semibold uppercase">
                Wrapped Data Encryption Key (DEK)
              </span>
              <span className="text-slate-600 bg-slate-50 p-1.5 rounded-lg block mt-0.5 truncate">
                {security?.maskedWrappedDek || 'Master Key Envelope Protected'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] block font-sans font-semibold uppercase">
                RSA-PSS Attestation Signer
              </span>
              <span className="text-indigo-700 font-bold bg-slate-50 p-1.5 rounded-lg block mt-0.5">
                {record.digitalSignature?.signerName || 'SecureMed Share Automated Attestation Authority'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          if (previewBlobUrl) window.URL.revokeObjectURL(previewBlobUrl);
        }}
        title={`Decrypted View: ${record.title}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              Authenticated Decryption Complete • SHA-256 Validated
            </span>
            <span className="font-mono text-[11px] text-teal-700">{record.mimeType}</span>
          </div>

          <div className="w-full h-[65vh] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
            {record.mimeType === 'application/pdf' ? (
              <iframe
                src={previewBlobUrl}
                title="Medical PDF Preview"
                className="w-full h-full"
              />
            ) : (
              <img
                src={previewBlobUrl}
                alt={record.title}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
