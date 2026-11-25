import { notificationLink } from '../services/notificationLinks';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Clock,
  UserCheck,
  ShieldAlert,
  FileText,
  KeyRound,
  Check,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { Badge } from '../components/common/Badge';

export const NotificationsPage = () => {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time security alerts, doctor access requests, and medical record viewing updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs font-bold transition px-3 py-1.5 rounded-xl ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`text-xs font-bold transition px-3 py-1.5 rounded-xl ${
            filter === 'unread'
              ? 'bg-brand-600 text-white'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
          <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          No notifications found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div
              key={n._id}
              onClick={() => markRead(n._id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-white border-slate-200/80 hover:bg-slate-50'
                  : 'bg-brand-50/50 border-brand-200 hover:bg-brand-50/80 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    n.type === 'access_request'
                      ? 'bg-indigo-50 text-indigo-600'
                      : n.type === 'record_accessed'
                      ? 'bg-teal-50 text-teal-600'
                      : n.type === 'consent_granted'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {n.type === 'access_request' ? (
                    <KeyRound className="h-5 w-5" />
                  ) : n.type === 'record_accessed' ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <Bell className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                    {!n.isRead && (
                      <span className="flex h-2 w-2 rounded-full bg-brand-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {notificationLink(n) && (
                <Link
                  to={notificationLink(n).to}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shrink-0 transition"
                >
                  {notificationLink(n).label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
