'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types';
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

interface RecentTransactionsProps {
  onTransactionClick?: (transaction: Transaction) => void;
}

export default function RecentTransactions({ onTransactionClick }: RecentTransactionsProps) {
  const { transactions } = useFinance();

  // Sort by date desc and take top 5
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  const getIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'expense': return <ArrowUpRight className="icon-expense" size={20} />;
      case 'income': return <ArrowDownLeft className="icon-income" size={20} />;
      case 'transfer': return <RefreshCw className="icon-transfer" size={18} />;
    }
  };

  return (
    <div className="section">
      <h3 className="section-title">Últimos Movimientos</h3>
      <div className="list">
        {recent.length === 0 ? (
          <div className="empty-state">No hay movimientos recientes</div>
        ) : (
          recent.map((tx) => (
            <div
              key={tx.id}
              className="transaction-item"
              onClick={() => onTransactionClick?.(tx)}
              style={{ cursor: onTransactionClick ? 'pointer' : 'default' }}
            >
              <div className={`icon-box ${tx.type}`}>
                {getIcon(tx.type)}
              </div>
              <div className="details">
                <div className="category">{tx.note || tx.category}</div>
                <div className="meta">{formatDate(tx.date)} • {tx.category}</div>
              </div>
              <div className={`amount ${tx.type}`}>
                {tx.amount < 0 ? '-' : '+'}{formatCurrency(tx.amount)}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .section {
          margin-top: var(--spacing-lg);
        }
        
        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: var(--spacing-md);
          color: var(--color-text, #000);
        }
        
        .list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .transaction-item {
          display: flex;
          align-items: center;
          padding: var(--spacing-md);
          background-color: var(--color-surface, white);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          border: none;
          transition: transform 0.1s;
        }
        
        .transaction-item:active {
          transform: scale(0.98);
        }
        
        .icon-box {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: var(--spacing-md);
          background-color: var(--color-bg);
        }
        
        .icon-box.expense { 
          background-color: #FFEBEE;
          color: #FF3B30; 
        }
        .icon-box.income { 
          background-color: #E8F5E9;
          color: #34C759; 
        }
        .icon-box.transfer { 
          background-color: #E3F2FD;
          color: #007AFF; 
        }
        
        .details {
          flex: 1;
        }
        
        .category {
          font-weight: 500;
          margin-bottom: 2px;
          color: var(--color-text, #000);
        }
        
        .meta {
          font-size: 0.75rem;
          color: var(--color-text-muted, #8E8E93);
        }
        
        .amount {
          font-weight: 600;
        }
        
        .amount.expense { color: var(--color-text, #000); }
        .amount.income { color: #34C759; }
        
        .empty-state {
          text-align: center;
          padding: var(--spacing-lg);
          color: var(--color-text-muted);
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
        }
      `}</style>
    </div>
  );
}
