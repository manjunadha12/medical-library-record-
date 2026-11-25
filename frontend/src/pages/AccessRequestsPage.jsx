import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Calendar,
  ShieldCheck,
  Building,
  User,
  ArrowRight,
  Search,
  FileText,
  Lock,
} from 'lucide-react';
import { consentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const AccessRequestsPage = () => {
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Patient Response Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseAction, setResponseAction] = useState('approve'); // 'approve' | 'reject'
  const [permission, setPermission] = useState('view'); // 'view' | 'view_download'
  const [duration, setDuration] = useState('24h'); // '1h' | '24h' | '7d' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Doctor Request Creation Modal with Patient Lookup
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newRequestRecordId, setNewRequestRecordId] = useState('');
  const [newRequestReason, setNewRequestReason] = useState('');
  const [newRequestPermission, setNewRequestPermission] = useState('view');

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      if (isPatient) {
        const res = await consentApi.getPatientRequests();
        if (res.success) setRequests(res.requests || []);
      } else if (isDoctor) {
        const res = await consentApi.getDoctorRequests();
        if (res.success) setRequests(res.requests || []);
      }
    } catch (err) {
      console.warn('Failed to load access requests:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setNewRequestRecordId('');
    setSelectedPatient(null);
    setPatientSearchQuery('');
    setPatientSearchResults([]);
    setCreateModalOpen(true);
  };

  const handleSearchPatients = async (query) => {
    setPatientSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setPatientSearchResults([]);
      return;
    }

    try {
      setIsSearchingPatients(true);
      const res = await consentApi.searchPatientsForDoctor(query.trim());
      if (res.success) {
        setPatientSearchResults(res.patients || []);
      }
    } catch (err) {
      console.warn('Patient search error:', err.message);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    if (patient.records && patient.records.length > 0) {
      setNewRequestRecordId(patient.records[0]._id);
    } else {
      setNewRequestRecordId('');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequestRecordId || !newRequestReason.trim()) {
      alert('Please select a patient record and provide a clinical rationale.');
      return;
    }

    setSubmitting(true);
    try {
      await consentApi.requestAccess({
        recordId: newRequestRecordId,
        reason: newRequestReason,
        requestedPermission: newRequestPermission,
      });
      setCreateModalOpen(false);
      setNewRequestReason('');
      setSelectedPatient(null);
      await fetchRequests();
    } catch (err) {
      alert(`Request failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      await consentApi.respond(selectedRequest._id, {
        action: responseAction,
        permission,
        duration,
        customExpiryDate: duration === 'custom' ? customDate : undefined,
        responseNote,
      });
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isPatient ? 'Doctor Access Requests' : 'Submitted Record Access Requests'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isPatient
              ? 'Review pending clinician requests, grant time-limited permissions, or deny access.'
              : 'Track request approval status, granted permissions, and consent expirations.'}
          </p>
        </div>

        {isDoctor && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Request Record Access</span>
          </button>
        )}
      </div>

      {/* Requests Table */}
      {loading ? (
        <LoadingSkeleton type="table" count={4} />
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
          <KeyRound className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No access requests found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isPatient
              ? 'You do not have any pending or historical doctor access requests.'
              : 'You have not submitted any access requests yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Record Title</th>
                  <th className="px-6 py-4">{isPatient ? 'Requesting Doctor' : 'Patient'}</th>
                  <th className="px-6 py-4">Clinical Purpose</th>
                  <th className="px-6 py-4">Permission</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{req.recordId?.title || 'Report'}</p>
                      <span className="text-[10px] text-teal-600 font-semibold">
                        {req.recordId?.category || 'Medical Report'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {isPatient ? (
                        <div>
                          <p className="font-semibold text-slate-900">Dr. {req.doctorId?.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {req.doctorProfileId?.specialization || 'Clinician'}
                          </p>
                        </div>
                      ) : (
                        <p className="font-semibold text-slate-900">{req.patientId?.name || 'Patient'}</p>
                      )}
                    </td>

                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-slate-600 line-clamp-2">{req.reason}</p>
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={req.requestedPermission === 'view_download' ? 'primary' : 'neutral'}
                        size="sm"
                      >
                        {req.requestedPermission === 'view_download' ? 'View & Download' : 'View Only'}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          req.status === 'approved'
                            ? 'success'
                            : req.status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {req.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {isPatient && req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setResponseAction('approve');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition shadow-xs text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setResponseAction('reject');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-semibold hover:bg-rose-100 transition text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Response Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={
          responseAction === 'approve'
            ? 'Grant Medical Record Access Consent'
            : 'Decline Access Request'
        }
      >
        {selectedRequest && (
          <form onSubmit={handleRespond} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Record:</span>
                <span className="font-bold text-slate-900">{selectedRequest.recordId?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Physician:</span>
                <span className="font-semibold text-slate-800">Dr. {selectedRequest.doctorId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Clinical Purpose:</span>
                <span className="text-slate-700 max-w-xs text-right">{selectedRequest.reason}</span>
              </div>
            </div>

            {responseAction === 'approve' ? (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Permission Level *
                  </label>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="view">View Only (Browser preview; no downloads)</option>
                    <option value="view_download">View & Download (Doctor may export file)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Consent Expiration Duration *
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="1h">1 Hour (Quick Consultation)</option>
                    <option value="24h">24 Hours (Standard Review)</option>
                    <option value="7d">7 Days (Extended Clinical Follow-up)</option>
                    <option value="custom">Custom Date & Time</option>
                  </select>
                </div>

                {duration === 'custom' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Custom Expiration Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Rejection (Optional)
                </label>
                <textarea
                  rows={2}
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder="e.g. Consultation not scheduled or record not pertinent."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-5 py-2 rounded-xl text-white font-semibold shadow-sm transition ${
                  responseAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting
                  ? 'Processing...'
                  : responseAction === 'approve'
                  ? 'Confirm Consent Grant'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Doctor Create Request Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Request Medical Record Access"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          {/* Patient Directory Search */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Find Patient by Name, Email, or Phone
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={patientSearchQuery}
                onChange={(e) => handleSearchPatients(e.target.value)}
                placeholder="Type patient name (e.g. Alex Morgan) or email..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#114B3E]/20"
              />
            </div>
            {isSearchingPatients && (
              <p className="text-[11px] text-slate-400 mt-1">Searching patient directory...</p>
            )}

            {/* Patient Search Results Dropdown */}
            {patientSearchResults.length > 0 && !selectedPatient && (
              <div className="mt-2 border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto bg-white shadow-sm">
                {patientSearchResults.map((pat) => (
                  <button
                    key={pat._id}
                    type="button"
                    onClick={() => handleSelectPatient(pat)}
                    className="w-full p-2.5 text-left hover:bg-slate-50 transition flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{pat.name}</p>
                      <p className="text-[10px] text-slate-500">{pat.email} • {pat.phone || 'No phone'}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#114B3E] bg-[#EDF2F0] px-2 py-0.5 rounded-md">
                      {pat.records?.length || 0} Records
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Patient & Record Selector */}
          {selectedPatient && (
            <div className="p-3 rounded-xl bg-[#EDF2F0] border border-[#DCE5E1] space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#566E67] tracking-wider">Target Patient</span>
                  <p className="font-bold text-[#0F2922] text-xs">{selectedPatient.name} ({selectedPatient.email})</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedPatient(null); setNewRequestRecordId(''); }}
                  className="text-[11px] text-[#114B3E] hover:underline font-semibold"
                >
                  Change
                </button>
              </div>

              {selectedPatient.records && selectedPatient.records.length > 0 ? (
                <div>
                  <label className="block font-semibold text-[#0F2922] mb-1">Select Record to Request Access To *</label>
                  <select
                    value={newRequestRecordId}
                    onChange={(e) => setNewRequestRecordId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-[#DCE5E1] rounded-xl focus:outline-none"
                  >
                    {selectedPatient.records.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.title} ({r.category}) - {new Date(r.medicalDate).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                  This patient currently has no uploaded records in the system.
                </p>
              )}
            </div>
          )}

          {/* Manual Record ID Input (fallback) */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Or Enter 24-Character Record ID Manually
            </label>
            <input
              type="text"
              required
              value={newRequestRecordId}
              onChange={(e) => setNewRequestRecordId(e.target.value.trim())}
              placeholder="e.g. 67417088b7762696e57ba3b8"
              aria-label="Medical record ID"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Requested Permission Level *
            </label>
            <select
              value={newRequestPermission}
              onChange={(e) => setNewRequestPermission(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="view">View Only (Diagnostic Review)</option>
              <option value="view_download">View & Download (Clinical Archival)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Clinical Rationale / Purpose *
            </label>
            <textarea
              required
              rows={3}
              value={newRequestReason}
              onChange={(e) => setNewRequestReason(e.target.value)}
              placeholder="e.g. Required for cardiology risk assessment and ECG correlation prior to medication adjustment."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !newRequestRecordId}
              className="px-5 py-2 rounded-xl bg-[#114B3E] hover:bg-[#0c362d] text-white font-semibold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request to Patient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
