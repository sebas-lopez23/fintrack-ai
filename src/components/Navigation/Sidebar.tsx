'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  X,
  CreditCard,
  PieChart,
  TrendingUp,
  Sparkles,
  Calendar,
  Wallet,
  List,
  LogOut,
  LayoutDashboard,
  Target,
  BarChart2,
  UploadCloud,
  Layers,
  Users
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCount?: number;
}

export default function Sidebar({ isOpen, onClose, inviteCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const sections = [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { name: 'Planificación', icon: <Target size={20} />, path: '/budget', badge: 'Nuevo' },
      ]
    },
    {
      title: 'Gestión',
      items: [
        { name: 'Movimientos', icon: <List size={20} />, path: '/transactions' },
        { name: 'Billetera', icon: <Wallet size={20} />, path: '/accounts' },
        { name: 'Importar Extracto', icon: <UploadCloud size={20} />, path: '/import' },
        { name: 'Familia', icon: <Users size={20} />, path: '/family', badge: inviteCount > 0 ? `${inviteCount}` : undefined },
        { name: 'Inversiones', icon: <TrendingUp size={20} />, path: '/investments' },
      ]
    },
    {
      title: 'Inteligencia',
      items: [
        { name: 'Análisis IA', icon: <Sparkles size={20} />, path: '/ai-chat' },
        { name: 'Reportes', icon: <PieChart size={20} />, path: '/analysis' },
      ]
    }
  ];

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">💸</div>
            <div className="logo-text-wrap">
              <span className="logo-text">FinTrack AI</span>
              <span className="logo-sub">Gestión inteligente</span>
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          {sections.map((section, idx) => (
            <div key={idx} className="sidebar-section">
              <h4 className="section-title">{section.title}</h4>
              <div className="nav-links">
                {section.items.map((item) => {
                  const isActive = pathname === item.path;
                  const isRedBadge = item.path === '/family' && inviteCount > 0;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      id={`nav-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <span className="icon">{item.icon}</span>
                      <span className="label">{item.name}</span>
                      {item.badge && (
                        <span className={`badge ${isRedBadge ? 'red' : ''}`}>{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={async () => {
            const { supabase } = await import('@/lib/supabase'); // Dynamic import to avoid circular dep issues if any, or just clean usage
            await supabase.auth.signOut();
            // Clear any local state if needed
            window.location.href = '/'; // Hard redirect to clear any in-memory state
          }}>
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 40;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
          backdrop-filter: blur(8px);
        }
        .sidebar-overlay.open { 
          opacity: 1;
          pointer-events: auto;
        }

        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 300px;
          height: 100%;
          background: white;
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 10px 0 40px rgba(0,0,0,0.08);
        }
        .sidebar.open { 
          transform: translateX(0);
        }

        .sidebar-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f0f0f5;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-icon {
          font-size: 28px;
        }
        
        .logo-text-wrap {
          display: flex;
          flex-direction: column;
        }
        
        .logo-text {
          font-size: 18px;
          font-weight: 800;
          color: #1f2937;
          letter-spacing: -0.5px;
        }
        
        .logo-sub {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 500;
        }

        .close-btn {
          background: #f5f5f7;
          border: none;
          color: #6b7280;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: #e5e7eb;
        }

        .sidebar-content {
          flex: 1;
          padding: 20px 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .section-title {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          margin: 0 0 10px 12px;
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          color: #4b5563;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s ease;
          position: relative;
        }

        .nav-item:hover {
          background: #f9fafb;
          color: #111827;
        }
        
        .nav-item.active {
          background: #f0f4ff;
          color: #4f46e5;
          font-weight: 600;
        }
        
        .nav-item .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-item .label {
          flex: 1;
        }

        .badge {
          margin-left: auto;
          font-size: 10px;
          font-weight: 700;
          background: #e0e7ff;
          color: #4f46e5;
          padding: 3px 8px;
          border-radius: 100px;
        }
        .nav-item.active .badge {
          background: #4f46e5;
          color: white;
        }

        .badge.red {
          background: #FF3B30;
          color: white;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid #f0f0f5;
        }
        
        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          background: #fee2e2;
        }
      `}</style>
    </>
  );
}
