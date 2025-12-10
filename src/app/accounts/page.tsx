'use client';

import React, { useState } from 'react';
import MobileLayout from '@/components/Layout/MobileLayout';
import { useFinance } from '@/context/FinanceContext';
import { Account, Subscription } from '@/types';
import { CreditCard, Wallet, Landmark, Plus, Calendar } from 'lucide-react';
import AccountDetailModal from '@/components/Accounts/AccountDetailModal';
import SubscriptionDetailModal from '@/components/Subscriptions/SubscriptionDetailModal';
import AddAccountModal from '@/components/Accounts/AddAccountModal';
import AddSubscriptionModal from '@/components/Subscriptions/AddSubscriptionModal';

export default function AccountsPage() {
  const { accounts, subscriptions } = useFinance();

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Add Modals State
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [addAccountType, setAddAccountType] = useState<'bank' | 'credit'>('bank');
  const [isAddSubscriptionOpen, setIsAddSubscriptionOpen] = useState(false);

  const bankAccounts = accounts.filter(a => a.type === 'bank' || a.type === 'cash');
  const creditCards = accounts.filter(a => a.type === 'credit');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const openAddAccount = (type: 'bank' | 'credit') => {
    setAddAccountType(type);
    setIsAddAccountOpen(true);
  };

  return (
    <MobileLayout>
      <h1 className="page-title">Cuentas y Deudas</h1>

      {/* Bank Accounts */}
      <section className="section">
        <div className="section-header">
          <h2>Cuentas y Efectivo</h2>
          <button className="add-btn" onClick={() => openAddAccount('bank')}><Plus size={18} /></button>
        </div>
        <div className="card-grid">
          {bankAccounts.map(acc => (
            <div
              key={acc.id}
              className="account-card bank clickable"
              onClick={() => setSelectedAccount(acc)}
            >
              <div className="acc-icon">
                {acc.type === 'cash' ? <Wallet size={24} /> : <Landmark size={24} />}
              </div>
              <div className="acc-info">
                <div className="acc-name">{acc.name}</div>
                <div className="acc-balance">{formatCurrency(acc.balance)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Credit Cards */}
      <section className="section">
        <div className="section-header">
          <h2>Tarjetas de Crédito</h2>
          <button className="add-btn" onClick={() => openAddAccount('credit')}><Plus size={18} /></button>
        </div>
        <div className="card-list">
          {creditCards.map(acc => {
            const limit = acc.limit || 0;
            const debt = Math.abs(acc.balance);
            const available = limit - debt;
            const progress = limit > 0 ? (debt / limit) * 100 : 0;
            const isNearLimit = progress > 90;

            return (
              <div
                key={acc.id}
                className="credit-card-item clickable"
                onClick={() => setSelectedAccount(acc)}
              >
                <div className="cc-header">
                  <div className="cc-name">
                    <div className="cc-icon-bg"><CreditCard size={20} /></div>
                    <span>{acc.name}</span>
                  </div>
                  <div className="cc-debt-info">
                    <span className="label">Deuda Actual</span>
                    <span className="value text-danger">{formatCurrency(Math.abs(acc.balance))}</span>
                  </div>
                </div>

                <div className="cc-progress-container">
                  <div className="cc-progress-labels">
                    <span>Uso: {progress.toFixed(0)}%</span>
                    <span>Disp: {formatCurrency(available)}</span>
                  </div>
                  <div className="cc-bar-bg">
                    <div
                      className={`cc-bar-fill ${isNearLimit ? 'danger' : ''}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Subscriptions */}
      <section className="section">
        <div className="section-header">
          <h2>Suscripciones</h2>
          <button className="add-btn" onClick={() => setIsAddSubscriptionOpen(true)}><Plus size={18} /></button>
        </div>
        <div className="sub-list">
          {subscriptions.map(sub => (
            <div
              key={sub.id}
              className="sub-item clickable"
              onClick={() => setSelectedSubscription(sub)}
            >
              <div className="sub-icon"><Calendar size={20} /></div>
              <div className="sub-details">
                <div className="sub-name">{sub.name}</div>
                <div className="sub-date">Próx: {sub.nextPaymentDate}</div>
              </div>
              <div className="sub-amount">{formatCurrency(sub.amount)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      <AccountDetailModal
        account={selectedAccount}
        isOpen={!!selectedAccount}
        onClose={() => setSelectedAccount(null)}
      />

      <SubscriptionDetailModal
        subscription={selectedSubscription}
        isOpen={!!selectedSubscription}
        onClose={() => setSelectedSubscription(null)}
      />

      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        defaultType={addAccountType}
      />

      <AddSubscriptionModal
        isOpen={isAddSubscriptionOpen}
        onClose={() => setIsAddSubscriptionOpen(false)}
      />

      <style jsx>{`
        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--spacing-lg);
        }

        .section {
          margin-bottom: var(--spacing-xl);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .section-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .add-btn {
            width: 32px; height: 32px; border-radius: 50%;
            background-color: var(--color-surface);
            display: flex; align-items: center; justify-content: center;
            color: var(--color-primary);
            border: 1px solid var(--color-border);
            cursor: pointer;
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: var(--spacing-md);
        }

        .clickable {
            cursor: pointer;
            transition: transform 0.1s, box-shadow 0.1s;
        }
        .clickable:active { transform: scale(0.98); }

        .account-card {
          background-color: var(--color-surface);
          padding: var(--spacing-md);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          display: flex; flex-direction: column; gap: var(--spacing-sm);
        }

        .acc-icon { color: var(--color-primary); }
        .acc-name {
          font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 4px;
        }
        .acc-balance { font-weight: 600; font-size: 1.125rem; }

        /* Credit Cards Light Mode */
        .credit-card-item {
          background-color: white; /* Light background */
          padding: 20px;
          border-radius: 20px;
          border: 1px solid #eee;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          margin-bottom: var(--spacing-md);
        }

        .cc-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 20px;
        }

        .cc-name {
          display: flex; align-items: center; gap: 12px;
          font-weight: 600; font-size: 1rem; color: #111;
        }
        
        .cc-icon-bg {
            background: #f3f4f6; padding: 8px; border-radius: 12px;
            color: #111;
        }

        .cc-debt-info {
            display: flex; flex-direction: column; align-items: flex-end;
        }
        .cc-debt-info .label { font-size: 0.7rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        .cc-debt-info .value { font-size: 1.1rem; font-weight: 700; color: #111; }

        .cc-progress-labels {
            display: flex; justify-content: space-between;
            font-size: 0.8rem; color: #666; margin-bottom: 8px; font-weight: 500;
        }

        .cc-bar-bg {
          height: 8px; background-color: #f3f4f6;
          border-radius: var(--radius-full); overflow: hidden;
        }

        .cc-bar-fill {
          height: 100%; background-color: #111; /* Dark bar for contrast */
          border-radius: var(--radius-full);
        }
        .cc-bar-fill.danger { background-color: #ef4444; }

        .sub-list {
          display: flex; flex-direction: column; gap: var(--spacing-sm);
        }

        .sub-item {
          display: flex; align-items: center;
          padding: var(--spacing-md);
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }

        .sub-icon { margin-right: var(--spacing-md); color: var(--color-text-muted); }
        .sub-details { flex: 1; }
        .sub-name { font-weight: 500; }
        .sub-date { font-size: 0.75rem; color: var(--color-text-muted); }
        .sub-amount { font-weight: 600; }
      `}</style>
    </MobileLayout>
  );
}
