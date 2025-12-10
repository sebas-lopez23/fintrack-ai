'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
        { name: 'Transacciones', icon: <List size={20} />, path: '/transactions' },
        { name: 'Cuentas & Deuda', icon: <CreditCard size={20} />, path: '/accounts' },
        { name: 'Importar Extracto', icon: <UploadCloud size={20} />, path: '/import' },
        { name: 'Familia', icon: <Users size={20} />, path: '/family', badge: inviteCount > 0 ? `${inviteCount}` : undefined },
        { name: 'Categorías', icon: <Layers size={20} />, path: '/categories' },
        { name: 'Inversiones', icon: <TrendingUp size={20} />, path: '/investments' },
        { name: 'Suscripciones', icon: <Calendar size={20} />, path: '/subscriptions' },
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
          <div className="logo d-flex align-items-center gap-2">
            <div className="logo-icon">F</div>
            <span className="logo-text">FinTrack AI</span>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="sidebar-content">
          {sections.map((section, idx) => (
            <div key={idx} className="sidebar-section">
              <h4 className="section-title">{section.title}</h4>
              <div className="nav-links">
                {section.items.map((item) => {
                  const isActive = pathname === item.path;
                  // Specific styling for Badge
                  const isRedBadge = item.path === '/family' && inviteCount > 0;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
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
          <button className="logout-btn">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.4); z-index: 40; opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease; backdrop-filter: blur(4px);
        }
        .overlay.open { opacity: 1; pointer-events: auto; }

        .sidebar {
          position: fixed; top: 0; left: 0; width: 300px; height: 100%;
          background: #FFFFFF; z-index: 50; transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
          display: flex; flex-direction: column;
          box-shadow: 10px 0 40px rgba(0,0,0,0.1);
        }
        .sidebar.open { transform: translateX(0); }

        .sidebar-header {
          padding: 24px; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid #F5F5F5;
        }

        .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .logo-icon-bg {
            width: 40px; height: 40px; background: #F2F2F7; border-radius: 12px;
            display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .logo-text-wrapper { display: flex; flex-direction: column; }
        .logo-text { font-size: 18px; font-weight: 700; color: #1C1C1E; letter-spacing: -0.5px; }
        .logo-sub { font-size: 11px; color: #8E8E93; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }

        .close-btn { 
            background: #F2F2F7; border: none; color: #3C3C43; width: 32px; height: 32px; 
            border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;
            transition: background 0.2s;
        }
        .close-btn:active { background: #E5E5EA; }

        .sidebar-nav {
          flex: 1; padding: 24px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 24px;
        }

        .section-title {
          font-size: 11px; color: #8E8E93; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
          margin: 0 0 12px 12px;
        }

        .section-items { display: flex; flex-direction: column; gap: 4px; }

        .nav-item {
          display: flex; align-items: center; gap: 14px; padding: 12px 14px;
          border-radius: 14px; color: #3C3C43; text-decoration: none;
          font-size: 15px; font-weight: 500; transition: all 0.2s ease;
          position: relative;
        }

        .nav-item:hover { background: #F2F2F7; }
        
        .nav-item.active {
          background: #007AFF; color: white;
          box-shadow: 0 4px 12px rgba(0,122,255,0.25);
        }
        
        .nav-item.special { color: #5856D6; }
        .nav-item.special svg { stroke: #5856D6; }
        .nav-item.special.active { 
            background: linear-gradient(135deg, #5856D6 0%, #AF52DE 100%); 
            color: white; 
        }
        .nav-item.special.active svg { stroke: white; }

        .badge {
            margin-left: auto; font-size: 10px; font-weight: 700;
            background: #E5E5EA; color: #8E8E93; padding: 2px 8px; border-radius: 100px;
        }
        .nav-item.active .badge { background: rgba(255,255,255,0.2); color: white; }

        .badge.red {
            background: #FF3B30; color: white;
            box-shadow: 0 2px 6px rgba(255,59,48,0.3);
        }

        .sidebar-footer { padding: 24px; border-top: 1px solid #F5F5F5; }
        .logout-btn {
          width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 14px;
          background: #FFF0F0; border: none; border-radius: 14px;
          color: #FF3B30; font-size: 15px; font-weight: 600;
          cursor: pointer; transition: background 0.2s;
        }
        .logout-btn:active { background: #FFE5E5; }
      `}</style>
    </>
  );
}
