import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  FileText,
  Lock,
  CheckCircle,
  AlertCircle,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  X,
  User,
  Search,
} from 'lucide-react';
import { recordsApi, consentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

const CATEGORIES = [
  'Blood Tests',
  'Prescriptions',
  'X-rays',
  'MRI',
  'CT Scans',
  'Lab Reports',
  'Discharge Summaries',
  'Other',
];

export const UploadRecordPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Blood Tests',
    medicalDate: new Date().toISOString().split('T')[0],
    hospitalName: '',
    doctorName: isDoctor ? user?.name : '',
    description: '',
  });

  // Doctor Target Patient Selection
  const [targetPatient, setTargetPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [createdRecord, setCreatedRecord] = useState(null);

  const handlePatientSearch = async (query) => {
    setPatientSearch(query);
    if (!query || query.trim().length < 1) {
      setPatientSearchResults([]);
      return;
    }

    try {
      setSearchingPatients(true);
      const res = await consentApi.searchPatientsForDoctor(query.trim());
      if (res.success) {
        setPatientSearchResults(res.patients || []);
      }
    } catch (err) {
      console.warn('Patient lookup error:', err.message);
    } finally {
      setSearchingPatients(false);
    }
  };

  const handleSelectPatient = (pat) => {
    setTargetPatient(pat.patient || pat);
    setPatientSearch('');
    setPatientSearchResults([]);
    setError(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 15 * 1024 * 1024) {
        setError('File exceeds 15MB limit.');
        return;
      }
      setFile(selected);
      setError(null);
      if (!formData.title) {
        // Auto-fill title from clean filename
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setFormData((prev) => ({ ...prev, title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1) }));
      }
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a medical report file (PDF, JPG, or PNG).');
      return;
    }

    if (isDoctor && !targetPatient) {
      setError('Please select the Target Patient to whom this diagnostic report belongs.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('title', formData.title);
      payload.append('category', formData.category);
      payload.append('medicalDate', formData.medicalDate);
      payload.append('hospitalName', formData.hospitalName);
      payload.append('doctorName', formData.doctorName || (isDoctor ? user?.name : ''));
      payload.append('description', formData.description);

      if (isDoctor && targetPatient) {
        payload.append('targetPatientId', targetPatient.id || targetPatient._id);
      }

      const res = await recordsApi.upload(payload);
      if (res.success && res.record) {
        setCreatedRecord(res.record);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload and encrypt record.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Upload & Encrypt Medical Record
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Files are hashed with SHA-256, sealed with AES-256-GCM envelope encryption, and signed with RSA-PSS before persisting.
        </p>
      </div>

      {createdRecord ? (
        /* Success Screen */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-card text-center space-y-6 animate-in fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 mx-auto shadow-md">
            <CheckCircle className="h-8 w-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Medical Record Encrypted & Sealed</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your report "{createdRecord.title}" is protected in storage. No plaintext copy exists on disk.
            </p>
          </div>

          {/* Cryptographic Attestation Metadata */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left font-mono text-xs max-w-xl mx-auto space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans">Encryption Scheme:</span>
              <span className="text-teal-700 font-bold">AES-256-GCM (Envelope Mode)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans">Original SHA-256:</span>
              <span className="text-slate-800 truncate max-w-[280px]">
                {createdRecord.originalSha256}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans">Attestation Signature:</span>
              <span className="text-indigo-700 font-bold">RSA-PSS-SHA256 (System Attested)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to={`/records/${createdRecord.id}`}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-sm"
            >
              View Record Details
            </Link>
            <Link
              to={`/integrity-verification?recordId=${createdRecord.id}`}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition"
            >
              Verify Cryptographic Integrity
            </Link>
            <button
              onClick={() => {
                setCreatedRecord(null);
                setFile(null);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
            >
              Upload Another File
            </button>
          </div>
        </div>
      ) : (
        /* Upload Form */
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Doctor Patient Selection Section */}
          {isDoctor && (
            <div className="p-4 rounded-2xl bg-[#EDF2F0] border border-[#DCE5E1] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#114B3E]">
                    Clinician Workflow
                  </span>
                  <h3 className="text-xs font-bold text-[#0F2922]">Target Patient Assignment *</h3>
                </div>
                {targetPatient && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#114B3E] text-white rounded-full">
                    Patient Selected
                  </span>
                )}
              </div>

              {targetPatient ? (
                <div className="p-3 rounded-xl bg-white border border-[#DCE5E1] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EDF2F0] text-[#114B3E] flex items-center justify-center font-bold text-xs">
                      <User size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-slate-900">{targetPatient.name}</strong>
                        {targetPatient.patientId && (
                          <span className="px-1.5 py-0.2 bg-teal-50 text-teal-700 font-mono text-[10px] rounded border border-teal-200 font-bold">
                            {targetPatient.patientId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{targetPatient.email} • {targetPatient.phone || 'No phone'}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTargetPatient(null)}
                    className="text-xs font-semibold text-[#114B3E] hover:underline"
                  >
                    Change Patient
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Search Patient by Name, Patient ID (e.g. PAT-1001), or Email
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => handlePatientSearch(e.target.value)}
                      placeholder="Type patient name, Patient ID, or email..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#DCE5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#114B3E]/20"
                    />
                  </div>

                  {searchingPatients && (
                    <p className="text-[11px] text-slate-400">Searching patient database...</p>
                  )}

                  {patientSearchResults.length > 0 && (
                    <div className="border border-[#DCE5E1] rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white shadow-sm">
                      {patientSearchResults.map((pat) => (
                        <button
                          key={pat._id || pat.id}
                          type="button"
                          onClick={() => handleSelectPatient(pat)}
                          className="w-full p-2.5 text-left hover:bg-slate-50 transition flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-xs">{pat.name}</span>
                              {pat.patientId && (
                                <span className="px-1.5 py-0.2 bg-[#EDF2F0] text-[#114B3E] font-mono text-[10px] rounded border border-[#DCE5E1] font-bold">
                                  {pat.patientId}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">{pat.email} • {pat.phone || 'No phone'}</p>
                          </div>
                          <span className="text-[11px] text-[#114B3E] font-bold bg-[#EDF2F0] px-2.5 py-1 rounded-lg">
                            Select
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Medical Document (PDF, JPEG, PNG • Max 15MB) *
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 text-center transition bg-slate-50/50">
              <input
                type="file"
                required
                accept=".pdf,image/jpeg,image/png"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">{file.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 mx-auto">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-brand-600">Click to browse</span>
                    <span className="text-xs text-slate-500"> or drag and drop your clinical file here</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Plaintext bytes are processed strictly in memory and encrypted before writing to storage.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Report Title *
              </label>
              <input
                type="text"
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Complete Blood Count (CBC)"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical Examination Date *
              </label>
              <input
                type="date"
                required
                name="medicalDate"
                value={formData.medicalDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Diagnostic Facility *
              </label>
              <input
                type="text"
                required
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="e.g. St. Jude Academic Medical Center"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attending Physician (Optional)
              </label>
              <input
                type="text"
                name="doctorName"
                value={formData.doctorName}
                onChange={handleChange}
                placeholder="e.g. Dr. Sarah Jenkins"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Notes / Findings
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Routine annual metabolic screening, normal enzymes"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {uploading && (
            <p role="status" className="text-sm text-[var(--text-muted)]">
              Uploading and encrypting your file…
            </p>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition shadow-md shadow-brand-500/20 disabled:opacity-50"
          >
            {uploading ? (
              <span>Encrypting & Sealing File...</span>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Encrypt & Upload Medical Record</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
