import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';
import { Footer } from '../common/Footer';
import './workspace.css';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = hash.slice(1);
    const scrollToSection = () => {
      const section = document.getElementById(id);
      if (!section) return false;
      section.scrollIntoView({ block: 'start' });
      return true;
    };
    if (scrollToSection()) return;
    const observer = new MutationObserver(() => {
      if (scrollToSection()) observer.disconnect();
    });
    observer.observe(document.querySelector('.workspace-content'), { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname, hash]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [sidebarOpen]);

  return (
    <div className="workspace-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="workspace-body">
        <Navbar onToggleSidebar={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} workspace />
        <main className="workspace-content"><Outlet /></main>
        <Footer />
      </div>
    </div>
  );
}
