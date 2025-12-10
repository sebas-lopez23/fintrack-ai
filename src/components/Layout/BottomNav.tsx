'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, PieChart, TrendingUp, MessageSquare } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Inicio', icon: <LayoutDashboard size={20} /> },
    { href: '/accounts', label: 'Cuentas', icon: <Wallet size={20} /> },
    { href: '/analysis', label: 'Análisis', icon: <PieChart size={20} /> },
    { href: '/investments', label: 'Inversión', icon: <TrendingUp size={20} /> },
    // Chatbot as a separate floating button or nav item? 
    // Requirement says "Floating secondary button". But let's put it in nav for now or handle it separately.
    // Let's stick to the main sections.
  ];

  return (
    <nav className="bottom-nav">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link key={link.href} href={link.href} className={`nav-item ${isActive ? 'active' : ''}`}>
            {link.icon}
            <span className="nav-label">{link.label}</span>
          </Link>
        );
      })}

      <style jsx>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--color-surface);
          box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
          display: flex;
          justify-content: space-around;
          padding: 12px 0;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          z-index: 50;
          border-top: none;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: var(--color-text-muted);
          padding: 8px;
          border-radius: var(--radius-md);
          transition: all 0.2s;
          min-width: 64px;
        }

        .nav-item.active {
          color: var(--color-primary);
          background-color: var(--color-primary-light);
        }

        .nav-label {
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </nav>
  );
}
