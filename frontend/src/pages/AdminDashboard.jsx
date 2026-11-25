import { DashboardError, Metrics, Overview } from '../components/dashboard/Overview';
import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  UserCheck,
  Lock,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Eye,
  Shield,
  Search,
  Filter,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { adminApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);

  // Modal for Doctor Verification
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, docRes, userRes, secRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getPendingDoctors(),
        adminApi.getUsers({ limit: 10 }),
        adminApi.getSecurityEvents(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (docRes.success) setPendingDoctors(docRes.doctors || []);
      if (userRes.success) setUsers(userRes.users || []);
      if (secRes.success) setSecurityEvents(secRes.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (status) => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      await adminApi.verifyDoctor(selectedDoctor._id, {
        status,
        notes: verificationNotes,
      });
      setSelectedDoctor(null);
      setVerificationNotes('');
      await fetchAdminData();
    } catch (err) {
      alert(`Error updating verification status: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminApi.toggleUserStatus(userId, nextStatus);
      await fetchAdminData();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="stats" count={5} />
        <LoadingSkeleton type="table" count={4} />
      </div>
    );
  }

  return (
    <Overview title="Administration dashboard" description="Review clinician credentials, manage accounts, and monitor security events." action={{ to: '/audit-logs', label: 'Open audit trail' }}>
      {error && <DashboardError message={error} retry={fetchAdminData} />}
      {!error && <Metrics items={[
        { label: 'Patients', value: stats?.totalPatients ?? 0, icon: Users, to: '#users' },
        { label: 'Doctors', value: stats?.totalDoctors ?? 0, icon: Users, tone: 'blue', to: '#users' },
        { label: 'Pending reviews', value: pendingDoctors.length, icon: UserCheck, tone: 'amber', to: '#verifications' },
        { label: 'Encrypted medical records', value: stats?.totalEncryptedRecords ?? 0, icon: Lock, to: '/records' },
        { label: 'Security events', value: stats?.totalSecurityEvents ?? 0, icon: ShieldAlert, tone: 'amber', to: '/audit-logs' },
      ]} />}
      {/* Pending Doctor Verifications Queue */}
      <div id="verifications" className="admin-panel bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Doctor verification queue
              </h3>
              {pendingDoctors.length > 0 && (
                <Badge variant="warning" size="sm">{pendingDoctors.length} Action Required</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review medical licenses against the medical registry before granting record access rights
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Doctor Name</th>
                <th className="px-6 py-3.5">Specialization</th>
                <th className="px-6 py-3.5">License / Reg No.</th>
                <th className="px-6 py-3.5">Hospital Affiliation</th>
                <th className="px-6 py-3.5">Experience</th>
                <th className="px-6 py-3.5 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {pendingDoctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    All doctor accounts are currently reviewed and up to date.
                  </td>
                </tr>
              ) : (
                pendingDoctors.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {doc.userId?.name || 'Doctor'}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {doc.userId?.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="cyan" size="sm">{doc.specialization}</Badge>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                      {doc.licenseNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{doc.hospitalAffiliation}</td>
                    <td className="px-6 py-4 text-slate-600">{doc.experienceYears} Years</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedDoctor(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 transition shadow-xs text-xs"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Review & Verify</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management Overview */}
      <div id="users" className="admin-panel bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">User Account Governance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Manage user statuses and enforce access controls</p>
          </div>
          <Badge variant="neutral" size="sm">{users.length} Users Listed</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Account Status</th>
                <th className="px-6 py-3.5">Registered</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-[10px] text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={u.role === 'admin' ? 'purple' : u.role === 'doctor' ? 'primary' : 'cyan'}
                      size="sm"
                    >
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={u.status === 'active' ? 'success' : 'danger'} size="sm">
                      {u.status === 'active' ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleUserStatus(u._id, u.status)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          u.status === 'active'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctor Verification Modal */}
      <Modal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        title="Verify Physician Medical Registration"
      >
        {selectedDoctor && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Physician Name:</span>
                <span className="font-bold text-slate-900">{selectedDoctor.userId?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">License / Reg Number:</span>
                <span className="font-mono font-bold text-slate-900">{selectedDoctor.licenseNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialization:</span>
                <span className="font-semibold text-teal-700">{selectedDoctor.specialization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Hospital Affiliation:</span>
                <span className="font-semibold text-slate-800">{selectedDoctor.hospitalAffiliation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Qualification:</span>
                <span className="text-slate-700">{selectedDoctor.qualification}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Verification Notes / Audit Remarks
              </label>
              <textarea
                rows={2}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="e.g., Verified against State Medical Board registry license records."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleVerifyDoctor('rejected')}
                className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold transition"
              >
                Reject Registration
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleVerifyDoctor('verified')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-semibold transition shadow-sm"
              >
                {actionLoading ? 'Verifying...' : 'Approve & Verify Doctor'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Overview>
  );
};
