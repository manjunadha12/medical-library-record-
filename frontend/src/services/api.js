const API_BASE = import.meta.env.VITE_API_URL || '/api';

let refreshInFlight;

/**
 * Universal API request wrapper with silent token refresh and secure httpOnly cookies
 */
export async function apiRequest(endpoint, options = {}, isRetry = false) {
  const url = `${API_BASE}${endpoint}`;

  const headers = {
    ...options.headers,
  };

  const isJson = options.body && !(options.body instanceof FormData);
  if (isJson) headers['Content-Type'] = 'application/json';

  const config = {
    ...options,
    headers,
    body: isJson ? JSON.stringify(options.body) : options.body,
    credentials: 'include', // Include HTTP-only cookies
  };

  try {
    const res = await fetch(url, config);

    // If 401 received on a non-auth endpoint and not already a retry, attempt silent refresh
    if (
      res.status === 401 &&
      !isRetry &&
      !endpoint.startsWith('/auth/login') &&
      !endpoint.startsWith('/auth/refresh')
    ) {
      refreshInFlight ??= fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      }).then((response) => response.ok).catch(() => false).finally(() => {
        refreshInFlight = undefined;
      });

      if (await refreshInFlight) return apiRequest(endpoint, options, true);
    }

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        const error = new Error(data.message || `Request failed with status ${res.status}`);
        error.status = res.status;
        error.code = data.code;
        error.activeDevice = data.activeDevice;
        throw error;
      }
      return data;
    } else {
      // Blob / Stream / CSV / File
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      return await res.blob();
    }
  } catch (err) {
    throw err;
  }
}

// Authentication API
export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  loginWithGoogle: (credential, forceLogin = false) =>
    apiRequest('/auth/google', { method: 'POST', body: { credential, forceLogin } }),
  registerPatient: (data) => apiRequest('/auth/register/patient', { method: 'POST', body: data }),
  registerDoctor: (data) => apiRequest('/auth/register/doctor', { method: 'POST', body: data }),
  getMe: () => apiRequest('/auth/me'),
  refreshToken: () => apiRequest('/auth/refresh', { method: 'POST' }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  updateProfile: (data) => apiRequest('/auth/profile', { method: 'PUT', body: data }),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, newPassword) => apiRequest('/auth/reset-password', { method: 'POST', body: { token, newPassword } }),
  changePassword: (currentPassword, newPassword) => apiRequest('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } }),
  verifyEmail: (token) => apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  sendOtp: (email, purpose = 'login') => apiRequest('/auth/otp/send', { method: 'POST', body: { email, purpose } }),
  verifyLoginOtp: (email, otp, forceLogin = false) => apiRequest('/auth/otp/verify-login', { method: 'POST', body: { email, otp, forceLogin } }),
  registerPatientWithOtp: (data) => apiRequest('/auth/otp/verify-register', { method: 'POST', body: data }),
};

// Medical Records API
export const recordsApi = {
  upload: (formData) => apiRequest('/records', { method: 'POST', body: formData }),
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/records${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/records/${id}`),
  preview: (id) => apiRequest(`/records/${id}/preview`),
  download: (id) => apiRequest(`/records/${id}/download`),
  getSecurity: (id) => apiRequest(`/records/${id}/security`),
  tamperTest: (id, tamperType) => apiRequest(`/records/${id}/tamper-test`, { method: 'POST', body: { tamperType } }),
};

// Consent Management API
export const consentApi = {
  requestAccess: (data) => apiRequest('/consent/request', { method: 'POST', body: data }),
  respond: (requestId, data) => apiRequest(`/consent/respond/${requestId}`, { method: 'POST', body: data }),
  revoke: (grantId, reason) => apiRequest(`/consent/revoke/${grantId}`, { method: 'POST', body: { reason } }),
  getPatientRequests: (status) => apiRequest(`/consent/patient/requests${status ? `?status=${status}` : ''}`),
  getDoctorRequests: (status) => apiRequest(`/consent/doctor/requests${status ? `?status=${status}` : ''}`),
  getPatientGrants: () => apiRequest('/consent/patient/grants'),
  directGrant: (data) => apiRequest('/consent/direct-grant', { method: 'POST', body: data }),
  searchPatientsForDoctor: (query) =>
    apiRequest(`/consent/doctor/search-patients${query ? `?q=${encodeURIComponent(query)}` : ''}`),
};

// Doctors Directory API
export const doctorsApi = {
  getDirectory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/doctors/directory${query ? `?${query}` : ''}`);
  },
  getProfile: (id) => apiRequest(`/doctors/profile/${id}`),
};

// Admin API
export const adminApi = {
  getStats: () => apiRequest('/admin/stats'),
  getPendingDoctors: () => apiRequest('/admin/doctors/pending'),
  verifyDoctor: (doctorProfileId, data) => apiRequest(`/admin/doctors/${doctorProfileId}/verify`, { method: 'POST', body: data }),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${query ? `?${query}` : ''}`);
  },
  toggleUserStatus: (userId, status) => apiRequest(`/admin/users/${userId}/status`, { method: 'POST', body: { status } }),
  getSecurityEvents: () => apiRequest('/admin/security-events'),
};

// Audit Logs API
export const auditApi = {
  getLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/audit${query ? `?${query}` : ''}`);
  },
  exportCsv: () => apiRequest('/audit/export/csv'),
};

// Notifications API
export const notificationsApi = {
  get: () => apiRequest('/notifications'),
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
};

// Verification API
export const verifyApi = {
  verifyRecord: (id) => apiRequest(`/verify/record/${id}`),
  getKeys: () => apiRequest('/verify/keys'),
};
