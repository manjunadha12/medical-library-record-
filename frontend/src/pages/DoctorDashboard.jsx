import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  FileCheck2,
  FolderLock,
  KeyRound,
  ShieldCheck,
  ArrowUpRight,
  UserCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { recordsApi, consentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import {
  DashboardError,
  Metrics,
  Overview,
  Panel,
  Records,
  QuickActionHub,
  SecurityHealthCard,
} from '../components/dashboard/Overview';

export function DoctorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const status = user?.doctorProfile?.verificationStatus;
  const verified = status === 'verified';

  async function load() {
    setError('');
    try {
      const [records, requests] = await Promise.all([
        recordsApi.list(),
        consentApi.getDoctorRequests(),
      ]);
      setData({
        records: records.records || [],
        requests: requests.requests || [],
      });
    } catch (err) {
      setError(err.message || 'Failed to load clinician dashboard');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pendingCount = data
    ? data.requests.filter((req) => req.status === 'pending').length
    : 0;
  const approvedCount = data
    ? data.requests.filter((req) => req.status === 'approved').length
    : 0;

  return (
    <Overview
      title={`Dr. ${user?.name || 'Clinician'}`}
      description="Access authorized patient medical records and manage clinical access requests."
      action={{
        to: '/access-requests',
        label: verified ? 'Request Record Access' : 'View Access Requests',
      }}
      secondaryAction={{
        to: '/records',
        label: 'Library Reports',
        icon: FileText,
      }}
    >
      {error && <DashboardError message={error} retry={load} />}
      {!data && !error && <LoadingSkeleton type="stats" count={3} />}

      {data && (
        <div className="space-y-6">
          {/* Verification Status Alert if doctor is not yet verified */}
          {!verified && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle size={18} />
                </span>
                <div>
                  <strong className="block text-amber-900 font-bold">
                    Credential Verification Pending
                  </strong>
                  <span className="text-amber-700">
                    Your medical license and hospital affiliations are currently under review by
                    administrators. Once verified, you will be able to request patient record access.
                  </span>
                </div>
              </div>
              <Link
                to="/profile"
                className="shrink-0 px-3.5 py-1.5 rounded-full bg-amber-800 text-white font-bold hover:bg-amber-900 transition"
              >
                View Profile
              </Link>
            </div>
          )}

          {/* Clinician Metrics */}
          <Metrics
            items={[
              {
                label: 'Authorized Patient Records',
                value: data.records.length,
                icon: FolderLock,
                tag: 'Decrypted On-Demand',
                to: '/records',
              },
              {
                label: 'Pending Access Requests',
                value: pendingCount,
                icon: Clock,
                tone: 'amber',
                tag: pendingCount > 0 ? 'Pending Consent' : 'None Pending',
                to: '/access-requests',
              },
              {
                label: 'Approved Patient Grants',
                value: approvedCount,
                icon: KeyRound,
                tone: 'blue',
                tag: 'Active',
                to: '/access-requests',
              },
            ]}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Shared Records & Clinician Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <Panel
                title="Authorized Medical Records"
                icon={FolderLock}
                to="/records"
                linkLabel="Library Reports"
                badge={`${data.records.length} Shared`}
              >
                <Records records={data.records} doctor />
              </Panel>

              <Panel title="Clinician Hub" icon={ArrowUpRight}>
                <QuickActionHub role="doctor" />
              </Panel>
            </div>

            {/* Right Column: Credentials & Security Status */}
            <div className="space-y-6">
              <Panel title="Medical Credentials" icon={ShieldCheck} to="/profile" linkLabel="Edit">
                <div className="p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Verification Status</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        verified
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {verified ? '● Verified Practitioner' : '● Pending Admin Review'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[11px]">Specialization</span>
                    <strong className="text-[var(--text-primary)] font-bold">
                      {user?.doctorProfile?.specialization || 'General Practice'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[11px]">License Number</span>
                    <strong className="text-[var(--text-primary)] font-mono">
                      {user?.doctorProfile?.licenseNumber || 'Not submitted'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[11px]">Hospital Affiliation</span>
                    <strong className="text-[var(--text-primary)] font-semibold">
                      {user?.doctorProfile?.hospitalAffiliation || 'Private Practice'}
                    </strong>
                  </div>
                </div>
              </Panel>

              <SecurityHealthCard />
            </div>
          </div>
        </div>
      )}
    </Overview>
  );
}
