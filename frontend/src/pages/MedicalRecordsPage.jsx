import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Grid,
  List,
  Upload,
  Eye,
  Download,
  Lock,
  FileCheck2,
  Calendar,
  Building,
  Inbox,
  ShieldCheck,
  User,
  X,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { recordsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { DashboardError } from '../components/dashboard/Overview';
import { EmptyState } from '../components/common/EmptyState';

const CATEGORIES = [
  'All',
  'Blood Tests',
  'Prescriptions',
  'X-rays',
  'MRI',
  'CT Scans',
  'Lab Reports',
  'Discharge Summaries',
  'Other',
];

export const MedicalRecordsPage = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const isPatient = user?.role === 'patient';
  const isAdmin = user?.role === 'admin';

  const [searchParams, setSearchParams] = useSearchParams();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  const activeCategory = searchParams.get('category') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || '-createdAt';

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    const scheduled = setTimeout(async () => {
      try {
        const params = { sort };
        if (activeCategory !== 'All') params.category = activeCategory;
        if (searchQuery) params.search = searchQuery;
        const response = await recordsApi.list(params);
        if (current) setRecords(response.records || []);
      } catch (err) {
        if (current) setError(err.message);
      } finally {
        if (current) setLoading(false);
      }
    }, searchQuery ? 200 : 0);

    return () => {
      current = false;
      clearTimeout(scheduled);
    };
  }, [activeCategory, searchQuery, sort, reload]);

  const handleCategoryChange = (cat) => {
    const nextParams = new URLSearchParams(searchParams);
    if (cat === 'All') nextParams.delete('category');
    else nextParams.set('category', cat);
    setSearchParams(nextParams);
  };

  const handleClearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    setSearchParams(next, { replace: true });
  };

  const handleDownload = async (recordId, fileName) => {
    try {
      const blob = await recordsApi.download(recordId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download blocked: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDF2F0] text-[#114B3E] border border-[#DCE5E1]">
              <Lock size={12} className="text-[#114B3E]" />
              AES-256-GCM Cryptographic Vault
            </span>
            {isDoctor && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck size={12} />
                Consent Verified
              </span>
            )}
          </div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            <span className="overview-icon green"><Lock size={19} aria-hidden="true" /></span>
            {isDoctor ? 'Authorized Patient Medical Records' : 'Encrypted Medical Records'}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {isDoctor
              ? 'Diagnostic reports and imaging unlocked under active, patient-consented cryptographic grants'
              : 'Medical reports secured with zero-trust AES-256-GCM envelope encryption'}
          </p>
        </div>

        {isPatient && (
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#114B3E] text-white text-xs font-semibold hover:bg-[#0c362d] transition shadow-sm"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Medical Record</span>
          </Link>
        )}
      </div>

      {/* Modern Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[var(--border-subtle)] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Enhanced Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              aria-label="Search medical records"
              maxLength={120}
              placeholder={
                isDoctor
                  ? "Search by Patient name, Report title, Hospital, or Category..."
                  : "Search titles, diagnostic notes, hospitals, or categories..."
              }
              value={searchQuery}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set('search', e.target.value);
                else next.delete('search');
                setSearchParams(next, { replace: true });
              }}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#114B3E]/20 text-[var(--text-primary)] font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition rounded-full hover:bg-slate-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Sort selector */}
            <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
              <span>Sort:</span>
              <select
                value={sort}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 py-2 text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:ring-2 focus:ring-[#114B3E]/20"
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  next.set('sort', event.target.value);
                  setSearchParams(next);
                }}
              >
                <option value="-createdAt">Recently Uploaded</option>
                <option value="-medicalDate">Latest Examination</option>
                <option value="title">Record Title (A-Z)</option>
              </select>
            </label>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 border-l border-[var(--border-subtle)] pl-3">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition ${
                  viewMode === 'table'
                    ? 'bg-[#114B3E] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)]'
                }`}
                title="Table View"
                aria-pressed={viewMode === 'table'}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition ${
                  viewMode === 'grid'
                    ? 'bg-[#114B3E] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-sidebar)]'
                }`}
                title="Grid View"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none border-t border-[var(--border-subtle)]/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0 mr-1">
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-[#114B3E] text-white shadow-xs'
                  : 'bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[#EDF2F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <DashboardError message={error} retry={() => setReload((value) => value + 1)} />
      ) : loading ? (
        <LoadingSkeleton type={viewMode === 'table' ? 'table' : 'cards'} count={4} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={searchQuery ? 'No matching medical records found' : 'No medical records found'}
          description={
            searchQuery || activeCategory !== 'All'
              ? `No records found matching "${searchQuery || activeCategory}". Try searching with a different patient name, title, or clearing filters.`
              : isDoctor
              ? 'No patients have currently granted you access to their medical records. You can request access in the Access Requests center.'
              : 'You have not uploaded any medical records to your secure vault yet.'
          }
          actionLabel={isPatient ? 'Upload First Record' : isDoctor ? 'Search Patients & Request Access' : null}
          onAction={() => window.location.assign(isPatient ? '/upload' : '/access-requests')}
        />
      ) : viewMode === 'table' ? (
        /* Enhanced Table View with Patient Identification */
        <div className="bg-white rounded-3xl border border-[var(--border-subtle)] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#EDF2F0] text-[#566E67] font-bold uppercase tracking-wider text-[10px] border-b border-[#DCE5E1]">
                <tr>
                  <th className="px-6 py-4">Title & Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Exam Date</th>
                  <th className="px-6 py-4">Hospital / Facility</th>
                  <th className="px-6 py-4">Security Envelope</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] font-medium">
                {records.map((rec) => {
                  const patientInfo = rec.patientId || rec.patient;
                  const patientName = patientInfo?.name || (isPatient ? user?.name : 'Patient Record');
                  const patientEmail = patientInfo?.email || '';

                  return (
                    <tr key={rec._id} className="hover:bg-[#F6F8F7] transition group">
                      {/* Title & Details Column with Patient Name Badge */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <Link
                            to={`/records/${rec._id}`}
                            className="font-bold text-[#0F2922] group-hover:text-[#114B3E] text-sm leading-snug transition flex items-center gap-1.5"
                          >
                            <span>{rec.title}</span>
                          </Link>

                          {/* Patient Identification pill */}
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EDF2F0] text-[#114B3E] font-semibold text-[11px] border border-[#DCE5E1]">
                              <User size={11} className="text-[#114B3E]" />
                              <span>{patientName}</span>
                            </span>

                            <span className="text-[11px] text-[var(--text-muted)] font-mono">
                              {rec.originalFileName} • {(rec.fileSize / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <Badge variant="cyan" size="sm">{rec.category}</Badge>
                      </td>

                      {/* Exam Date */}
                      <td className="px-6 py-4 text-[var(--text-muted)] font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(rec.medicalDate).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Hospital / Facility */}
                      <td className="px-6 py-4 text-[var(--text-primary)]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building size={13} className="text-slate-400" />
                          <span>{rec.hospitalName}</span>
                        </div>
                        {rec.doctorName && (
                          <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                            Attending: Dr. {rec.doctorName}
                          </span>
                        )}
                      </td>

                      {/* Security Envelope */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <Badge variant="crypto" size="sm" className="gap-1">
                            <Lock size={11} aria-hidden="true" />
                            <span>AES-256</span>
                          </Badge>

                          {isDoctor && rec.consent?.permission && (
                            <span className="block text-[10px] font-semibold text-[#114B3E]">
                              {rec.consent.permission === 'view_download' ? 'View & Download' : 'View Only'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <Link
                          to={`/records/${rec._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </Link>

                        {isPatient && (
                          <Link
                            to={`/consent-management?recordId=${rec._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EDF2F0] hover:bg-[#DCE5E1] text-[#114B3E] font-semibold transition"
                            title="Share Record with Doctor"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Share</span>
                          </Link>
                        )}

                        {(isPatient || rec.consent?.permission === 'view_download') && (
                          <button
                            onClick={() => handleDownload(rec._id, rec.originalFileName)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#114B3E]/10 hover:bg-[#114B3E]/20 text-[#114B3E] font-semibold transition"
                            title="Download Decrypted File"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </button>
                        )}

                        <Link
                          to={`/integrity-verification?recordId=${rec._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold transition"
                          title="Verify Cryptographic Signature"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          <span>Verify</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Enhanced Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((rec) => {
            const patientInfo = rec.patientId || rec.patient;
            const patientName = patientInfo?.name || (isPatient ? user?.name : 'Patient Record');

            return (
              <div
                key={rec._id}
                className="bg-white rounded-3xl border border-[var(--border-subtle)] p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="cyan" size="sm">{rec.category}</Badge>
                    <Badge variant="crypto" size="sm" className="gap-1">
                      <Lock size={12} aria-hidden="true" />
                      <span>AES-256</span>
                    </Badge>
                  </div>

                  <Link
                    to={`/records/${rec._id}`}
                    className="font-bold text-[#0F2922] hover:text-[#114B3E] text-base line-clamp-1 transition"
                  >
                    {rec.title}
                  </Link>

                  {/* Patient Name Tag in Grid */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EDF2F0] text-[#114B3E] font-semibold text-[11px] border border-[#DCE5E1]">
                      <User size={11} />
                      <span>{patientName}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2 leading-relaxed">
                    {rec.description || 'No diagnostic notes attached.'}
                  </p>

                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-1.5 text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(rec.medicalDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{rec.hospitalName}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <Link
                    to={`/records/${rec._id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Inspect</span>
                  </Link>

                  {isPatient ? (
                    <Link
                      to={`/consent-management?recordId=${rec._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#EDF2F0] hover:bg-[#DCE5E1] text-[#114B3E] text-xs font-semibold transition"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </Link>
                  ) : (
                    <Link
                      to={`/integrity-verification?recordId=${rec._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                      <span>Verify</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
