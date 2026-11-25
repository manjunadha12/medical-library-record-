export function notificationLink(notification) {
  if (['access_request', 'consent_rejected', 'consent_revoked'].includes(notification.type)) {
    return { to: '/access-requests', label: 'Open requests' };
  }
  if (['doctor_verified', 'doctor_rejected'].includes(notification.type)) {
    return { to: '/dashboard', label: 'Open dashboard' };
  }
  if (notification.relatedRecordId) {
    return { to: '/records/' + notification.relatedRecordId, label: 'View record' };
  }
  return null;
}
