import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Clock,
  FolderLock,
  KeyRound,
  Lock,
  ShieldCheck,
  Users,
  FileCheck2,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { recordsApi, consentApi, auditApi } from '../services/api';
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

export function PatientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [records, requests, grants, audit] = await Promise.all([
        recordsApi.list(),
        consentApi.getPatientRequests('pending'),
        consentApi.getPatientGrants(),
        auditApi.getLogs({ limit: 5 }),
      ]);
      setData({
        records: records.records || [],
        requests: requests.requests || [],
        grants: grants.grants || [],
        logs: audit.logs || [],
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeGrants = data
    ? data.grants.filter(
        (grant) => grant.status === 'active' && new Date(grant.validUntil) > new Date()
      ).length
    : 0;

  return (
    <Overview
      title={`Hello, ${user?.name || 'Patient'}${user?.patientId ? ` (${user.patientId})` : ''}`}
      description="Review your records, respond to access requests, and manage who can see your files."
      action={{ to: '/upload', label: 'Upload Medical Record' }}
      secondaryAction={{
        to: '/access-requests',
        label: 'Access Requests',
        icon: KeyRound,
      }}
    >
      {error && <DashboardError message={error} retry={load} />}
      {!data && !error && <LoadingSkeleton type="stats" count={3} />}

      {data && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <Metrics
            items={[
              {
                label: 'Encrypted Medical Records',
                value: data.records.length,
                icon: Lock,
                tag: 'AES-256',
                to: '/records',
              },
              {
                label: 'Pending Access Requests',
                value: data.requests.length,
                icon: Clock,
                tone: 'amber',
                tag: data.requests.length > 0 ? 'Action Needed' : 'Up to Date',
                to: '/access-requests',
              },
              {
                label: 'Active Sharing Consents',
                value: activeGrants,
                icon: KeyRound,
                tone: 'blue',
                tag: 'Active',
                to: '/consent-management',
              },
            ]}
          />

          {/* Pending Access Alert Banner if clinicians are requesting access */}
          {data.requests.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertCircle size={18} />
                </span>
                <div>
                  <strong className="block text-amber-900 font-bold">
                    {data.requests.length} clinician access request(s) awaiting your consent
                  </strong>
                  <span className="text-amber-700">
                    Review which doctors are requesting to view your records and specify permissions.
                  </span>
                </div>
              </div>
              <Link
                to="/access-requests"
                className="shrink-0 px-4 py-2 rounded-full bg-amber-700 text-white font-bold hover:bg-amber-800 transition text-center shadow-xs"
              >
                Review Requests
              </Link>
            </div>
          )}

          {/* Main Dashboard Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols wide on desktop): Records & Quick Action Hub */}
            <div className="lg:col-span-2 space-y-6">
              <Panel
                title="Your Encrypted Medical Records"
                icon={Lock}
                to="/records"
                linkLabel="All Records"
                badge={`${data.records.length} Stored`}
              >
                <Records records={data.records} />
              </Panel>

              <Panel title="Quick Actions" icon={ArrowUpRight}>
                <QuickActionHub role="patient" />
              </Panel>
            </div>

            {/* Right Column (1 Col wide): Security Status & Recent Activity */}
            <div className="space-y-6">
              {/* Cryptographic Health Card */}
              <SecurityHealthCard />

              {/* Recent Security & Access Activity */}
              <Panel
                title="Recent Security Activity"
                icon={Activity}
                to="/audit-logs"
                linkLabel="Audit History"
              >
                {data.logs.length === 0 ? (
                  <p className="p-6 text-center text-xs text-[var(--text-muted)]">
                    No security events recorded yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--border-subtle)] text-xs">
                    {data.logs.slice(0, 4).map((log) => (
                      <li key={log._id} className="p-3.5 flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-bg)] mt-1.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <strong className="block text-[var(--text-primary)] font-semibold truncate capitalize">
                            {log.action.replace(/_/g, ' ').toLowerCase()}
                          </strong>
                          <span className="block text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                            {log.details || 'System operation executed'}
                          </span>
                          <span className="block text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                            {new Date(log.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        </div>
      )}
    </Overview>
  );
}
