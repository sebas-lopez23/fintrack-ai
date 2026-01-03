'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from './TopBar';
import FAB from '../Dashboard/FAB';
import AddTransactionModal from '../Transaction/AddTransactionModal';
import ImportStatementModal from '../Transaction/ImportStatementModal';
import Sidebar from '../Navigation/Sidebar';
import { Search as SearchIcon, X, Bell } from 'lucide-react';

import { useFinance } from '@/context/FinanceContext';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { pendingInvites } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'manual' | 'voice' | 'camera'>('manual');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // PDF Modal State

  // New States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenModal = (mode: 'manual' | 'voice' | 'camera' | 'pdf') => {
    if (mode === 'pdf') {
      setIsImportModalOpen(true);
      return;
    }
    setModalMode(mode);
    setIsModalOpen(true);
  };

  // Listen for custom event from child components (e.g., RecentTransactions empty state)
  useEffect(() => {
    const handleOpenImport = () => setIsImportModalOpen(true);
    window.addEventListener('open-import-modal', handleOpenImport);
    return () => window.removeEventListener('open-import-modal', handleOpenImport);
  }, []);

  const handleProfileClick = () => {
    router.push('/profile');
  };

  return (
    <div className="mobile-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        inviteCount={pendingInvites.length}
      />

      {/* Search Bar Overlay */}
      {showSearch ? (
        <div className="search-bar-overlay">
          <div className="search-input-wrapper">
            <SearchIcon size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar transacciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <TopBar
          onMenuClick={() => setIsSidebarOpen(true)}
          onProfileClick={handleProfileClick}
          onNotificationsClick={() => setShowNotifications(!showNotifications)}
          onSearchClick={() => setShowSearch(true)}
        />
      )}

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          <div className="notifications-overlay" onClick={() => setShowNotifications(false)} />
          <div className="notifications-panel">
            <div className="panel-header">
              <h3>Notificaciones</h3>
              <button onClick={() => setShowNotifications(false)}><X size={20} /></button>
            </div>
            <div className="notifications-list">
              <div className="notification-item unread">
                <div className="notif-icon"><Bell size={16} /></div>
                <div className="notif-content">
                  <p className="notif-title">¡Meta alcanzada!</p>
                  <p className="notif-body">Has ahorrado el 20% de tu meta para el viaje.</p>
                  <span className="notif-time">Hace 2h</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notif-icon warning">!</div>
                <div className="notif-content">
                  <p className="notif-title">Gasto inusual</p>
                  <p className="notif-body">Detectamos un gasto alto en Restaurantes.</p>
                  <span className="notif-time">Ayer</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <main className="content">
        {children}
      </main>

      <FAB onAction={handleOpenModal} />

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode={modalMode}
      />

      <ImportStatementModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <style jsx>{`
        .mobile-layout {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          /* Background handled by body mesh */
          position: relative;
          overflow-x: hidden;
        }

        .content {
          flex: 1;
          padding: 0 20px 100px 20px;
          max-width: 600px;
          margin: 0 auto;
          width: 100%;
        }

        /* Search Bar Styles */
        .search-bar-overlay {
          padding: 12px 20px;
          background: transparent;
          position: sticky;
          top: 0;
          z-index: 35;
        }

        .search-input-wrapper {
          background: var(--glass-surface); /* Glass input */
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          padding: 10px 16px;
          gap: 12px;
          box-shadow: var(--shadow-sm);
        }

        .search-icon { color: var(--color-text-muted, #8E8E93); }

        input {
          flex: 1;
          background: transparent;
          border: none;
          font-size: 17px;
          color: var(--color-text, #000);
          outline: none;
        }

        /* Notifications Styles */
        .notifications-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 40;
          background: rgba(0,0,0,0.2);
        }

        .notifications-panel {
          position: absolute;
          top: 70px;
          right: 20px;
          width: 300px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid white;
          border-radius: var(--radius-lg);
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          z-index: 41;
          overflow: hidden;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .panel-header {
          padding: 16px;
          border-bottom: 1px solid var(--color-border, #E5E5EA);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .panel-header h3 { 
          margin: 0; 
          font-size: 17px; 
          font-weight: 600;
          color: var(--color-text, #000);
        }

        .notifications-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 12px 16px;
          display: flex;
          gap: 12px;
          border-bottom: 1px solid var(--color-border, #E5E5EA);
        }

        .notification-item.unread {
          background: #F0F9FF;
        }

        .notif-icon {
          width: 32px;
          height: 32px;
          background: #007AFF;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .notif-icon.warning { background: #FF9500; font-weight: bold; }

        .notif-content { flex: 1; }

        .notif-title {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 2px 0;
          color: var(--color-text, #000);
        }

        .notif-body {
          font-size: 13px;
          color: var(--color-text, #3C3C43);
          margin: 0 0 4px 0;
          line-height: 1.4;
        }

        .notif-time {
          font-size: 11px;
          color: var(--color-text-muted, #8E8E93);
        }
      `}</style>
    </div>
  );
}
