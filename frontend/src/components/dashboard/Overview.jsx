import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronRight,
  Lock,
  RefreshCw,
  ShieldCheck,
  FileText,
  KeyRound,
  FileCheck2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export function Overview({ title, description, action, secondaryAction, children }) {
  return (
    <div className="overview space-y-6">
      {/* Top Banner / Welcome Header */}
      <header className="overview-heading flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-normal">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {secondaryAction && (
            <Link
              to={secondaryAction.to}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-sidebar)] transition shadow-2xs"
            >
              {secondaryAction.icon && <secondaryAction.icon size={15} />}
              <span>{secondaryAction.label}</span>
            </Link>
          )}
          {action && (
            <Link
              to={action.to}
              className="overview-button inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[var(--accent-bg)] text-[var(--accent-text)] hover:opacity-90 transition shadow-sm"
            >
              <span>{action.label}</span>
              <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {children}
    </div>
  );
}

export function Metrics({ items }) {
  return (
    <div className="overview-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(({ label, value, icon: Icon, tone = 'green', tag, to }) => (
        <Link
          to={to}
          key={label}
          className="overview-metric group relative p-5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl hover:border-[var(--accent-bg)] hover:shadow-xs transition duration-150 flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="overview-icon flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--bg-sidebar)] text-[var(--accent-bg)] group-hover:scale-105 transition">
              <Icon size={20} />
            </span>
            <div className="flex items-center gap-1.5">
              {tag && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-sidebar)] text-[var(--accent-bg)]">
                  {tag}
                </span>
              )}
              <ArrowUpRight
                className="text-[var(--text-muted)] group-hover:text-[var(--accent-bg)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition"
                size={16}
              />
            </div>
          </div>

          <div className="mt-3">
            <strong className="block text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {value}
            </strong>
            <span className="text-xs font-medium text-[var(--text-muted)] mt-0.5 block">
              {label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function Panel({ title, icon: Icon, to, linkLabel = 'View all', badge, children }) {
  return (
    <section className="overview-panel bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="text-[var(--accent-bg)] flex items-center">
              <Icon size={18} />
            </span>
          )}
          <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
            {title}
          </h2>
          {badge && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-sidebar)] text-[var(--accent-bg)]">
              {badge}
            </span>
          )}
        </div>
        {to && (
          <Link
            to={to}
            className="text-xs font-semibold text-[var(--accent-bg)] hover:underline inline-flex items-center gap-1 transition"
          >
            <span>{linkLabel}</span>
            <ChevronRight size={14} />
          </Link>
        )}
      </header>
      <div>{children}</div>
    </section>
  );
}

export function Records({ records, doctor = false }) {
  if (!records || records.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--bg-sidebar)] flex items-center justify-center text-[var(--accent-bg)]">
          <FileText size={24} />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {doctor
            ? 'No patient records currently shared with you'
            : 'No encrypted medical records uploaded yet'}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
          {doctor
            ? 'Request record access using a patient record ID in Access Requests.'
            : 'Securely upload diagnostic reports, prescriptions, or imaging with encrypted storage.'}
        </p>
        {!doctor && (
          <Link
            to="/upload"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[var(--accent-bg)] text-[var(--accent-text)] hover:opacity-90 transition"
          >
            <span>Upload First Record</span>
            <ArrowUpRight size={14} />
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul className="overview-list divide-y divide-[var(--border-subtle)]">
      {records.slice(0, 5).map((record) => {
        const categoryLabel = record.category || 'Clinical Record';
        return (
          <li key={record._id}>
            <Link
              to={`/records/${record._id}`}
              className="overview-row flex items-center justify-between gap-3 p-4 hover:bg-[var(--bg-sidebar)]/60 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-[var(--bg-sidebar)] text-[var(--accent-bg)] flex items-center justify-center">
                  <Lock size={16} />
                </span>
                <div className="min-w-0">
                  <strong className="block text-xs font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-bg)] transition">
                    {record.title}
                  </strong>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--text-muted)]">
                    <span className="capitalize font-medium text-[var(--text-primary)]">
                      {doctor ? record.patientId?.name || 'Patient' : categoryLabel}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                      AES-256
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <small className="text-xs text-[var(--text-muted)] hidden sm:inline-flex items-center gap-1">
                  <Calendar size={12} />
                  <span>
                    {record.medicalDate
                      ? new Date(record.medicalDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Recent'}
                  </span>
                </small>
                <ChevronRight
                  size={16}
                  className="text-[var(--text-muted)] group-hover:text-[var(--accent-bg)] group-hover:translate-x-0.5 transition"
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function QuickActionHub({ role = 'patient' }) {
  const actions =
    role === 'patient'
      ? [
          {
            title: 'Upload Record',
            description: 'Encrypt & store new medical PDF or image',
            to: '/upload',
            icon: FileText,
          },
          {
            title: 'Access Requests',
            description: 'Review clinician requests to view your data',
            to: '/access-requests',
            icon: KeyRound,
          },
          {
            title: 'Sharing Permissions',
            description: 'Revoke or manage active consents',
            to: '/consent-management',
            icon: ShieldCheck,
          },
          {
            title: 'Verify integrity',
            description: 'Verify SHA-256 hash & digital signature',
            to: '/integrity-verification',
            icon: FileCheck2,
          },
        ]
      : [
          {
            title: 'Access Requests',
            description: 'Request access with patient Record ID',
            to: '/access-requests',
            icon: KeyRound,
          },
          {
            title: 'Shared records',
            description: 'Browse all authorized medical records',
            to: '/records',
            icon: FileText,
          },
          {
            title: 'Verify Signature',
            description: 'Audit cryptographic integrity of shared files',
            to: '/integrity-verification',
            icon: FileCheck2,
          },
          {
            title: 'Security & Keys',
            description: 'Inspect active RSA-PSS signing keys',
            to: '/security-status',
            icon: ShieldCheck,
          },
        ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <Link
            key={act.title}
            to={act.to}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--accent-bg)] bg-[var(--bg-card)] hover:bg-[var(--bg-sidebar)]/40 transition group"
          >
            <span className="w-8 h-8 rounded-lg bg-[var(--bg-sidebar)] text-[var(--accent-bg)] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
              <Icon size={16} />
            </span>
            <div className="min-w-0">
              <strong className="block text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-bg)] transition">
                {act.title}
              </strong>
              <small className="block text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">
                {act.description}
              </small>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function SecurityHealthCard() {
  return (
    <div className="p-4 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--accent-bg)]" />
          <strong className="text-xs font-bold text-[var(--text-primary)]">
            Cryptographic Engine Status
          </strong>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          ● Secure
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
        <div>
          <span className="text-[11px] text-[var(--text-muted)] block">Encryption</span>
          <strong className="text-[11px] font-mono text-[var(--text-primary)]">
            AES-256-GCM
          </strong>
        </div>
        <div>
          <span className="text-[11px] text-[var(--text-muted)] block">Digital Signatures</span>
          <strong className="text-[11px] font-mono text-[var(--text-primary)]">
            RSA-PSS 2048-bit
          </strong>
        </div>
        <div>
          <span className="text-[11px] text-[var(--text-muted)] block">Integrity Hash</span>
          <strong className="text-[11px] font-mono text-[var(--text-primary)]">SHA-256</strong>
        </div>
        <div>
          <span className="text-[11px] text-[var(--text-muted)] block">Audit Logging</span>
          <strong className="text-[11px] font-semibold text-emerald-700">Tamper-Evident</strong>
        </div>
      </div>
    </div>
  );
}

export function DashboardError({ message, retry }) {
  return (
    <div
      className="overview-error flex items-center justify-between gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs"
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-rose-600" />
        <span>{message}</span>
      </div>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-rose-800 font-bold border border-rose-200 rounded-lg hover:bg-rose-100 transition shadow-2xs"
        >
          <RefreshCw size={13} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
}
