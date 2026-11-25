import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Lock,
  FileText,
  CheckCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Badge } from './Badge';
import { notificationLink } from '../../services/notificationLinks';

export const Navbar = ({ onToggleSidebar, sidebarOpen, workspace = false }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead } = useNotifications();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/records?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-page)]/95 backdrop-blur-md border-b border-[var(--border-subtle)]">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
            aria-controls="workspace-sidebar"
            className={`${workspace ? 'lg:hidden' : 'hidden'} p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition`}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className={`flex items-center gap-2.5 group ${workspace ? 'lg:hidden' : ''}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 tracking-tight text-lg">SecureMed</span>
                <span className="font-semibold text-brand-600 text-lg">Share</span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 tracking-wider uppercase -mt-1 hidden sm:block">
                Privacy-Preserving EHR
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar */}
        {user && (
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search encrypted records"
                aria-label="Search encrypted records"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
              />
            </div>
          </form>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-6rem))] rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 z-50">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
                      <span className="text-sm font-semibold text-slate-800">Notifications</span>
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        View all
                      </Link>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-1.5">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-400">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <button
                            type="button"
                            key={n._id}
                            onClick={() => {
                              markRead(n._id);
                              setShowNotifications(false);
                              navigate(notificationLink(n)?.to || '/notifications');
                            }}
                            className={`block w-full text-left p-2.5 rounded-xl text-xs transition ${
                              n.isRead ? 'bg-slate-50/50 hover:bg-slate-100' : 'bg-brand-50/60 hover:bg-brand-50 border border-brand-100'
                            }`}
                          >
                            <p className="font-semibold text-slate-800">{n.title}</p>
                            <p className="text-slate-600 line-clamp-2 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left text-xs">
                    <p className="font-semibold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-50">
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Badge size="sm" variant={user.role === 'admin' ? 'purple' : user.role === 'doctor' ? 'primary' : 'cyan'}>
                          {user.role.toUpperCase()}
                        </Badge>
                        {user.role === 'doctor' && (
                          <Badge size="sm" variant={user.doctorProfile?.verificationStatus === 'verified' ? 'success' : 'warning'}>
                            {user.doctorProfile?.verificationStatus === 'verified' ? 'Verified' : 'Pending Review'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        Profile & Settings
                      </Link>
                      <Link
                        to="/security-status"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition"
                      >
                        <Lock className="h-4 w-4 text-slate-400" />
                        Encryption & Cryptography
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
              >
                Log In
              </Link>
              <Link
                to="/register/patient"
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
