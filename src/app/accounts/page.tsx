'use client';

import React, { useState } from 'react';
import MobileLayout from '@/components/Layout/MobileLayout';
import AccountsView from '@/components/Accounts/AccountsView';
import SubscriptionsView from '@/components/Subscriptions/SubscriptionsView';

export default function AccountsPage() {
  const [viewMode, setViewMode] = useState<'accounts' | 'subscriptions'>('accounts');

  return (
    <MobileLayout>
      <div className="page-header">
        <h1 className="page-title">Billetera</h1>
        <div className="tabs-container">
          <button
            className={`tab-btn ${viewMode === 'accounts' ? 'active' : ''}`}
            onClick={() => setViewMode('accounts')}
          >
            Cuentas
          </button>
          <button
            className={`tab-btn ${viewMode === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setViewMode('subscriptions')}
          >
            Suscripciones
          </button>
          <div className="tab-indicator" style={{
            left: viewMode === 'accounts' ? '2px' : '50%'
          }} />
        </div>
      </div>

      <div className="view-content">
        {viewMode === 'accounts' ? (
          <AccountsView />
        ) : (
          <SubscriptionsView />
        )}
      </div>

      <style jsx>{`
                .page-header {
                    margin-bottom: 20px;
                }
                .page-title {
                    font-size: 1.75rem;
                    font-weight: 800;
                    margin-bottom: 16px;
                    color: #000;
                }

                .tabs-container {
                    display: flex;
                    background-color: #F2F2F7;
                    padding: 4px;
                    border-radius: 14px;
                    position: relative;
                }

                .tab-btn {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    background: transparent;
                    font-weight: 600;
                    font-size: 14px;
                    color: #8E8E93;
                    cursor: pointer;
                    z-index: 2;
                    transition: color 0.2s;
                }

                .tab-btn.active {
                    color: #000;
                }

                .tab-indicator {
                    position: absolute;
                    top: 4px;
                    bottom: 4px;
                    width: calc(50% - 6px);
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    transition: left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    z-index: 1;
                }
            `}</style>
    </MobileLayout>
  );
}
