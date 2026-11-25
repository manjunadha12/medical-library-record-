import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Building,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Save,
  Lock,
  Laptop,
  Smartphone,
  Globe,
  Radio,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { Badge } from '../components/common/Badge';

export const ProfileSettingsPage = () => {
  const { user, refreshUser, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    gender: user?.gender || 'prefer_not_to_say',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    bio: user?.doctorProfile?.bio || '',
    hospitalAffiliation: user?.doctorProfile?.hospitalAffiliation || '',
    specialization: user?.doctorProfile?.specialization || '',
    experienceYears: user?.doctorProfile?.experienceYears || 0,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const res = await authApi.updateProfile(formData);
      if (res.success) {
        setSuccess(true);
        await refreshUser();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError(err.message || 'Profile update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          User Profile & Platform Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, contact preferences, and cryptographic credentials.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* User Identity Header Card */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white font-bold text-2xl shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              {user?.patientId && (
                <span className="px-2 py-0.5 rounded-md bg-[#EDF2F0] text-[#114B3E] font-mono text-xs font-bold border border-[#DCE5E1]">
                  ID: {user.patientId}
                </span>
              )}
              <Badge variant={user?.role === 'admin' ? 'purple' : user?.role === 'doctor' ? 'primary' : 'cyan'}>
                {user?.role.toUpperCase()}
              </Badge>
              {user?.role === 'doctor' && (
                <Badge variant={user?.doctorProfile?.verificationStatus === 'verified' ? 'success' : 'warning'}>
                  {user?.doctorProfile?.verificationStatus === 'verified' ? 'Verified Doctor' : 'Pending Verification'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>
        </div>

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Profile information updated successfully.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Profile Update Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>

          {user?.role === 'patient' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Residential Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {user?.role === 'doctor' && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Clinical Practitioner Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital Affiliation
                  </label>
                  <input
                    type="text"
                    name="hospitalAffiliation"
                    value={formData.hospitalAffiliation}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Bio
                </label>
                <textarea
                  rows={2}
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>

        {/* Active Logged-in Devices Section */}
        <div className="mt-8 pt-8 border-t border-slate-100">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-[#114B3E]" />
                  Active Logged-in Device (Single Session Policy)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  To protect healthcare data, only 1 device can be actively signed into your account at any time.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Single Device Active
              </span>
            </div>
          </div>

          {user?.activeSession ? (
            <div className="p-5 rounded-2xl bg-[#F6F8F7] border border-[#DCE5E1] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDF2F0] border border-[#DCE5E1] flex items-center justify-center text-[#114B3E]">
                    {user.activeSession.os?.toLowerCase().includes('phone') || user.activeSession.os?.toLowerCase().includes('android') || user.activeSession.os?.toLowerCase().includes('ios') ? (
                      <Smartphone className="h-5 w-5" />
                    ) : (
                      <Laptop className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-bold text-[#0F2922]">
                        {user.activeSession.device || 'Current Active Device'}
                      </strong>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#114B3E] text-white rounded-md">
                        Current Session
                      </span>
                    </div>
                    <p className="text-[11px] text-[#566E67] mt-0.5">
                      {user.activeSession.browser || 'Browser'} • {user.activeSession.os || 'OS'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition shrink-0"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log Out This Device</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#DCE5E1] text-[11px]">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">IP Address</span>
                  <span className="font-mono text-slate-800 font-medium">
                    {user.activeSession.ipAddress || 'Localhost / Internal'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Operating System</span>
                  <span className="text-slate-800 font-medium">{user.activeSession.os || 'Standard OS'}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Last Active</span>
                  <span className="text-slate-800 font-medium">
                    {user.activeSession.lastActivity
                      ? new Date(user.activeSession.lastActivity).toLocaleTimeString()
                      : 'Just now'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
              No active device metadata available.
            </div>
          )}
        </div>

        {/* Change Password Card */}
        {user?.authProvider !== 'google' && (
          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-600" />
                Change Account Password
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your password meeting our cryptographic security standard (min. 8 characters, letters, numbers, symbols)
              </p>
            </div>

            <ChangePasswordForm />
          </div>
        )}
      </div>
    </div>
  );
};

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    if (newPassword !== confirmPassword) {
      setErr('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErr(error.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
      {msg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
          {msg}
        </div>
      )}
      {err && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {err}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••••••"
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 chars"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-50"
      >
        {loading ? 'Updating Password...' : 'Update Password'}
      </button>
    </form>
  );
};
