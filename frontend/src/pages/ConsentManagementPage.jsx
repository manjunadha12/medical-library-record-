import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  KeyRound,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Lock,
  User,
  Calendar,
  History,
  Info,
  Plus,
  ArrowRight,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { consentApi, recordsApi, doctorsApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const ConsentManagementPage = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [searchParams] = useSearchParams();
  const initialRecordId = searchParams.get('recordId');
  const initialDoctorId = searchParams.get('doctorId');

  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('Patient requested immediate revocation');
  const [revoking, setRevoking] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  // Direct Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [patientRecords, setPatientRecords] = useState([]);
  const [verifiedDoctors, setVerifiedDoctors] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  const [shareDuration, setShareDuration] = useState('24h');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(null);
  const [shareError, setShareError] = useState(null);

  useEffect(() => {
    fetchGrants();
    if (!isDoctor && (initialRecordId || initialDoctorId)) {
      handleOpenShareModal(initialRecordId, initialDoctorId);
    }
  }, [initialRecordId, initialDoctorId, isDoctor]);

  const fetchGrants = async () => {
    try {
      setLoading(true);
      const res = await consentApi.getPatientGrants();
      if (res.success) {
        setGrants(res.grants || []);
      }
    } catch (err) {
      console.warn('Failed to load consents:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShareModal = async (preselectedRecordId = null, preselectedDoctorId = null) => {
    setShareModalOpen(true);
    setShareError(null);
    setShareSuccess(null);
    try {
      const [recsRes, docsRes] = await Promise.all([
        recordsApi.list(),
        doctorsApi.getDirectory(),
      ]);

      if (recsRes.records) {
        setPatientRecords(recsRes.records);
        if (preselectedRecordId) {
          setSelectedRecordId(preselectedRecordId);
        } else if (recsRes.records.length > 0) {
          setSelectedRecordId(recsRes.records[0]._id);
        }
      }

      if (docsRes.doctors) {
        setVerifiedDoctors(docsRes.doctors);
        if (docsRes.doctors.length > 0) {
          const preferredDoctor = docsRes.doctors.find((doctor) => doctor.id === preselectedDoctorId);
          setSelectedDoctorId(preselectedDoctorId ? preferredDoctor?.id || '' : docsRes.doctors[0].id);
        }
      }
    } catch (err) {
      setShareError('Failed to load records or doctor directory.');
    }
  };

  const handleDirectShare = async (e) => {
    e.preventDefault();
    if (!selectedRecordId || !selectedDoctorId) {
      setShareError('Please select both a medical record and a doctor.');
      return;
    }

    setShareLoading(true);
    setShareError(null);

    try {
      const res = await consentApi.directGrant({
        recordId: selectedRecordId,
        doctorId: selectedDoctorId,
        permission: sharePermission,
        duration: shareDuration,
      });

      setShareSuccess(res.message || 'Record shared successfully!');
      await fetchGrants();
      setTimeout(() => {
        setShareModalOpen(false);
        setShareSuccess(null);
      }, 1500);
    } catch (err) {
      setShareError(err.message || 'Failed to grant access.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await consentApi.revoke(revokeTarget._id, revokeReason);
      setRevokeTarget(null);
      await fetchGrants();
    } catch (err) {
      alert(`Revocation failed: ${err.message}`);
    } finally {
      setRevoking(false);
    }
  };

  const activeGrants = grants.filter(
    (g) => g.status === 'active' && new Date(g.validUntil) > new Date()
  );
  const historicalGrants = grants.filter(
    (g) => g.status !== 'active' || new Date(g.validUntil) <= new Date()
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Direct Share or Request Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EDF2F0] text-[#114B3E] border border-[#DCE5E1]">
              <ShieldCheck size={13} />
              {isDoctor ? 'Clinical Access Grants' : 'Zero-Trust Consent Engine'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {isDoctor ? 'Authorized Patient Medical Records' : 'Consent Management & Revocation Center'}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-2xl leading-relaxed">
            {isDoctor
              ? 'Review patient records and diagnostic files you are currently authorized to access through active consent grants.'
              : 'You hold sovereign authority over your medical files. Grant temporary access to verified doctors, or immediately terminate access at any second.'}
          </p>
        </div>

        {isDoctor ? (
          <Link
            to="/access-requests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition shadow-sm shrink-0"
          >
            <UserCheck size={16} />
            <span>Request Patient Access</span>
          </Link>
        ) : (
          <button
            onClick={handleOpenShareModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition shadow-sm shrink-0"
          >
            <Plus size={16} />
            <span>Share Record with Doctor</span>
          </button>
        )}
      </div>

      {/* Advisory & Explainability Card */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-start gap-3.5 text-xs text-[var(--text-primary)]">
        <span className="w-8 h-8 rounded-xl bg-[var(--bg-sidebar)] text-[var(--accent-bg)] flex items-center justify-center shrink-0 mt-0.5">
          <KeyRound size={18} />
        </span>
        <div className="leading-relaxed">
          <strong className="block text-sm font-bold text-[var(--text-primary)] mb-0.5">
            {isDoctor ? 'How Clinician Access Works:' : 'How Consent & Revocation Works:'}
          </strong>
          <span className="text-[var(--text-muted)]">
            {isDoctor ? (
              <>
                1. <strong>Authorized Files</strong>: Access is granted by patients or attending clinical uploads sealed with AES-256-GCM.<br />
                2. <strong>Time-Bound Validity</strong>: Each access grant is cryptographically time-stamped and automatically expires.<br />
                3. <strong>Audit Trail</strong>: Every record inspection or download is attested and permanently logged.
              </>
            ) : (
              <>
                1. <strong>Direct Share</strong>: Pick any of your encrypted records and grant access to a doctor with 1 click.<br />
                2. <strong>Time-Bound Access</strong>: Permissions expire automatically after your selected duration (e.g. 24 hours).<br />
                3. <strong>Instant Revocation</strong>: Click <em>"Revoke Access"</em> below to instantly invalidate cryptographic access tokens. The doctor's next request is immediately rejected.
              </>
            )}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'active'
              ? 'border-[var(--accent-bg)] text-[var(--accent-bg)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>{isDoctor ? 'Active Authorizations' : 'Active Consents'}</span>
          <span className="px-2 py-0.5 rounded-full bg-[#EDF2F0] text-[#114B3E] font-bold text-[10px]">
            {activeGrants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 -mb-px ${
            activeTab === 'history'
              ? 'border-[var(--accent-bg)] text-[var(--accent-bg)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <span>{isDoctor ? 'Expired & Revoked Records' : 'Revoked & Expired History'}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
            {historicalGrants.length}
          </span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" count={3} />
      ) : activeTab === 'active' ? (
        /* Active Consents View */
        activeGrants.length === 0 ? (
          <div className="bg-[var(--bg-card)] p-12 rounded-3xl border border-[var(--border-subtle)] text-center">
            <KeyRound className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {isDoctor ? 'No active patient authorizations' : 'No active doctor consents'}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
              {isDoctor
                ? 'You do not currently have active access to any patient records. Request access from a patient or upload a clinical record.'
                : 'You are not currently sharing any medical files. Use the button above to share a report directly with a physician.'}
            </p>
            {isDoctor ? (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link
                  to="/access-requests"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition"
                >
                  <UserCheck size={14} />
                  <span>Request Patient Access</span>
                </Link>
                <Link
                  to="/upload"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--bg-sidebar)] text-[var(--text-primary)] text-xs font-bold hover:bg-[var(--border-subtle)] transition border border-[var(--border-subtle)]"
                >
                  <Plus size={14} />
                  <span>Upload Record for Patient</span>
                </Link>
              </div>
            ) : (
              <button
                onClick={handleOpenShareModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] text-xs font-bold hover:opacity-90 transition"
              >
                <Plus size={14} />
                <span>Share a Record Now</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-sidebar)] text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Medical Record</th>
                    <th className="px-6 py-4">{isDoctor ? 'Patient' : 'Authorized Doctor'}</th>
                    <th className="px-6 py-4">Permission</th>
                    <th className="px-6 py-4">Valid Until</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                  {activeGrants.map((grant) => {
                    const remainingHours = Math.max(
                      0,
                      Math.round((new Date(grant.validUntil) - new Date()) / (1000 * 60 * 60))
                    );

                    return (
                      <tr key={grant._id} className="hover:bg-[var(--bg-sidebar)]/40 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-[var(--text-primary)]">
                            {grant.recordId?.title || 'Report'}
                          </p>
                          <span className="text-[10px] text-[var(--accent-bg)] font-semibold">
                            {grant.recordId?.category || 'Clinical Record'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isDoctor ? (
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">
                                {grant.patientId?.name || 'Patient'}
                              </p>
                              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                                {grant.patientId?.patientId && (
                                  <span className="font-mono px-1.5 py-0.5 rounded bg-[#EDF2F0] text-[#114B3E] font-bold text-[10px]">
                                    {grant.patientId.patientId}
                                  </span>
                                )}
                                <span>{grant.patientId?.email}</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold text-[var(--text-primary)]">
                                Dr. {grant.doctorId?.name}
                              </p>
                              <p className="text-[11px] text-[var(--text-muted)]">
                                {grant.doctorId?.email}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EDF2F0] text-[#114B3E]">
                            {grant.permission === 'view_download'
                              ? 'View & Download'
                              : 'View Only'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[var(--text-primary)]">
                            {new Date(grant.validUntil).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                          <span className="text-[11px] text-[var(--accent-bg)] font-semibold">
                            ~{remainingHours} hour(s) left
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isDoctor ? (
                            <Link
                              to={grant.recordId?._id ? `/records/${grant.recordId._id}` : '/records'}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] font-bold transition text-xs hover:opacity-90"
                            >
                              <FileText size={13} />
                              <span>Inspect File</span>
                            </Link>
                          ) : (
                            <button
                              onClick={() => setRevokeTarget(grant)}
                              className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition text-xs border border-rose-200"
                            >
                              Revoke Access
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Historical Consents View */
        historicalGrants.length === 0 ? (
          <div className="bg-[var(--bg-card)] p-12 rounded-3xl border border-[var(--border-subtle)] text-center text-[var(--text-muted)] text-xs">
            No historical revocations or expirations recorded.
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-sidebar)] text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-4">Record Title</th>
                    <th className="px-6 py-4">{isDoctor ? 'Patient' : 'Physician'}</th>
                    <th className="px-6 py-4">Permission</th>
                    <th className="px-6 py-4">Status & Notes</th>
                    <th className="px-6 py-4 text-right">Termination Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                  {historicalGrants.map((grant) => (
                    <tr key={grant._id} className="hover:bg-[var(--bg-sidebar)]/30 transition">
                      <td className="px-6 py-4 font-bold text-[var(--text-primary)]">
                        {grant.recordId?.title || 'Report'}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-primary)]">
                        {isDoctor
                          ? (grant.patientId?.name || 'Patient')
                          : `Dr. ${grant.doctorId?.name || 'Doctor'}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[var(--text-muted)]">
                          {grant.permission}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            grant.status === 'revoked'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {grant.status === 'revoked' ? 'REVOKED' : 'EXPIRED'}
                        </span>
                        {grant.revokedReason && (
                          <span className="block text-[11px] text-[var(--text-muted)] mt-0.5">
                            Reason: {grant.revokedReason}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-[var(--text-muted)] text-[11px]">
                        {grant.revokedAt
                          ? new Date(grant.revokedAt).toLocaleString()
                          : new Date(grant.validUntil).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Direct Share with Doctor Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Medical Record with Doctor"
      >
        <form onSubmit={handleDirectShare} className="space-y-4 text-xs">
          <p className="text-[var(--text-muted)]">
            Select one of your encrypted records and choose a verified physician to grant immediate access.
          </p>

          {shareError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{shareError}</span>
            </div>
          )}

          {shareSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{shareSuccess}</span>
            </div>
          )}

          {/* Select Record */}
          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1">
              Select Medical Record to Share *
            </label>
            {patientRecords.length === 0 ? (
              <p className="p-2.5 bg-[var(--bg-sidebar)] rounded-xl text-[var(--text-muted)]">
                No records uploaded yet. Please upload a record first.
              </p>
            ) : (
              <select
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
              >
                {patientRecords.map((rec) => (
                  <option key={rec._id} value={rec._id}>
                    {rec.title} ({rec.category})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Select Doctor */}
          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1">
              Select Verified Doctor *
            </label>
            {verifiedDoctors.length === 0 ? (
              <p className="p-2.5 bg-[var(--bg-sidebar)] rounded-xl text-[var(--text-muted)]">
                No verified doctors available in directory.
              </p>
            ) : (
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
              >
                {verifiedDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name} — {doc.specialization} ({doc.hospitalAffiliation || 'Hospital'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Permission Level */}
          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1">
              Permission Level *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition ${
                  sharePermission === 'view'
                    ? 'border-[var(--accent-bg)] bg-[var(--bg-sidebar)] font-bold'
                    : 'border-[var(--border-subtle)]'
                }`}
              >
                <input
                  type="radio"
                  name="perm"
                  value="view"
                  checked={sharePermission === 'view'}
                  onChange={() => setSharePermission('view')}
                  className="hidden"
                />
                <span>👁️ View Only</span>
                <span className="text-[10px] font-normal text-[var(--text-muted)]">
                  Doctor can preview in browser
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition ${
                  sharePermission === 'view_download'
                    ? 'border-[var(--accent-bg)] bg-[var(--bg-sidebar)] font-bold'
                    : 'border-[var(--border-subtle)]'
                }`}
              >
                <input
                  type="radio"
                  name="perm"
                  value="view_download"
                  checked={sharePermission === 'view_download'}
                  onChange={() => setSharePermission('view_download')}
                  className="hidden"
                />
                <span>📥 View & Download</span>
                <span className="text-[10px] font-normal text-[var(--text-muted)]">
                  Doctor can download file locally
                </span>
              </label>
            </div>
          </div>

          {/* Validity Duration */}
          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1">
              Access Expiry Duration *
            </label>
            <select
              value={shareDuration}
              onChange={(e) => setShareDuration(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
            >
              <option value="1h">1 Hour (Quick Consultation)</option>
              <option value="24h">24 Hours (Standard Examination)</option>
              <option value="7d">7 Days (Treatment Review)</option>
              <option value="30d">30 Days (Extended Follow-up)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className="px-4 py-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-sidebar)] font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={shareLoading || patientRecords.length === 0}
              className="px-5 py-2.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-text)] font-bold hover:opacity-90 disabled:opacity-50 transition shadow-sm"
            >
              {shareLoading ? 'Granting Access...' : 'Confirm & Grant Access'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Revocation Confirmation Modal */}
      <Modal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke Medical Record Access"
      >
        {revokeTarget && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="block mb-1 font-bold text-rose-900">Immediate Access Revocation</strong>
                Revoking this consent grant will immediately block Dr. {revokeTarget.doctorId?.name} from previewing, decrypting, or viewing "{revokeTarget.recordId?.title}".
              </div>
            </div>

            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-1">
                Reason for Revocation
              </label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-sidebar)] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={handleRevoke}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition"
              >
                {revoking ? 'Revoking...' : 'Confirm Revoke Now'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
