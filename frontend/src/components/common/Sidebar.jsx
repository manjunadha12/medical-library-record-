import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bell,
  Stethoscope,
  Upload,
  UserCheck,
  KeyRound,
  FileCheck2,
  Lock,
  History,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const role = user.role;

  const careRole = role === 'patient' || role === 'doctor';
  const groups = [
    { label: 'Workspace', items: [
      { name: 'Overview', to: '/dashboard/' + role, icon: LayoutDashboard },
      { name: role === 'doctor' ? 'Shared records' : 'Medical records', to: '/records', icon: Lock },
      ...(careRole ? [{ name: 'Upload record', to: '/upload', icon: Upload }] : []),
    ] },
    ...(careRole ? [{ label: 'Care & sharing', items: [
      { name: 'Access requests', to: '/access-requests', icon: UserCheck },
      { name: 'Sharing permissions', to: '/consent-management', icon: KeyRound },
      { name: 'Doctor directory', to: '/doctors', icon: Stethoscope },
    ] }] : []),
    { label: 'Account & security', items: [
      { name: 'Notifications', to: '/notifications', icon: Bell },
      { name: 'Verify integrity', to: '/integrity-verification', icon: FileCheck2 },
      { name: 'Security & keys', to: '/security-status', icon: ShieldCheck },
      { name: 'Audit history', to: '/audit-logs', icon: History },
    ] },
  ];

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="workspace-backdrop"
          onClick={onClose}
        />
      )}
      <aside id="workspace-sidebar" className={`workspace-sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="workspace-brand">
          <span>
            <ShieldCheck size={23} />
          </span>
          <div>
            <strong>SecureMed Share</strong>
            <small>Medical records workspace</small>
          </div>
          <button
            className="workspace-close"
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Workspace navigation">
          {groups.map(({ label, items }) => (
          <div className="workspace-nav-group" key={label}>
            <p>{label}</p>
            {items.map(({ name, to, icon: Icon }) => {
              const [pathname] = to.split('#');
              const isDashboard = pathname.startsWith('/dashboard');
              const active = isDashboard
                ? location.pathname.startsWith('/dashboard')
                : location.pathname === pathname || location.pathname.startsWith(`${pathname}/`);

              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={active ? 'workspace-nav-link active' : 'workspace-nav-link'}
                  aria-current={active ? 'page' : false}
                >
                  <Icon aria-hidden="true" size={18} />
                  <span>{name}</span>
                </Link>
              );
            })}
          </div>
          ))}
        </nav>

        <Link className="workspace-person" to="/profile" onClick={onClose}>
          <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
          <div>
            <strong>{user.name}</strong>
            <small className="capitalize">{user.role}</small>
          </div>
        </Link>
      </aside>
    </>
  );
};
