'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction } from '@/types';
import { ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

interface RecentTransactionsProps {
  onTransactionClick?: (transaction: Transaction) => void;
  onImport?: () => void;
}

export default function RecentTransactions({ onTransactionClick, onImport }: RecentTransactionsProps) {
  const { transactions, categories } = useFinance();

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

  const getCategoryStyles = (categoryName: string) => {
    const cat = categories.find(c => c.name === categoryName);

    const emojis: Record<string, string> = {
      'comida': '🍔',
      'transporte': '🚗',
      'hogar': '🏠',
      'servicios': '⚡',
      'compras': '🛍️',
      'salario': '💰',
      'salud': '🏥',
      'entretenimiento': '🎬',
      'educación': '📚',
      'inversiones': '📈',
      'regalos': '🎁',
      'arriendo': '🏠'
    };

    const key = categoryName.toLowerCase();
    let icon = emojis[key];

    // If not found in map, try DB icon if it's short (emoji), otherwise default
    if (!icon && cat?.icon && cat.icon.length <= 4) {
      icon = cat.icon;
    }

    return {
      icon: icon || '📌',
      color: cat?.color || '#8E8E93'
    };
  };

  const hexToRgba = (hex: string, alpha: number) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="section">
      <h3 className="section-title">Últimos Movimientos</h3>
      <div className="list">
        {recent.length === 0 ? (
          <div className="empty-state">
            <p>No hay movimientos recientes</p>
            {onImport && (
              <button className="import-btn-link" onClick={onImport}>
                Importar Extracto PDF
              </button>
            )}
          </div>
        ) : (
          recent.map((tx) => {
            const { icon, color } = getCategoryStyles(tx.category);
            const bgColor = hexToRgba(color, 0.15);

            return (
              <div
                key={tx.id}
                className="transaction-item"
                onClick={() => onTransactionClick?.(tx)}
                style={{ cursor: onTransactionClick ? 'pointer' : 'default' }}
              >
                <div
                  className="icon-box"
                  style={{ backgroundColor: bgColor }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                </div>
                <div className="details">
                  <div className="category">{tx.note || tx.category}</div>
                  <div className="meta">{formatDate(tx.date)} • {tx.category}</div>
                </div>
                <div className={`amount ${tx.type}`}>
                  {tx.amount < 0 ? '-' : '+'}{formatCurrency(tx.amount)}
                </div>
              </div>
            )
          })
        )}
      </div>

      <style jsx>{`
        .section {
          margin-top: var(--spacing-lg);
          background: white;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: var(--color-text-main);
        }
        
        .list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .transaction-item {
          display: flex;
          align-items: center;
          padding: 16px;
          background: white;
          border: 2px solid #f0f0f5;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
          transition: all 0.2s ease;
        }
        
        .transaction-item:hover {
          border-color: #e5e5ea;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }
        
        .transaction-item:active {
          transform: scale(0.98);
        }
        
        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 14px;
          flex-shrink: 0;
        }
        
        .details {
          flex: 1;
        }
        
        .category {
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 4px;
          color: var(--color-text-main);
        }
        
        .meta {
          font-size: 0.8rem;
          color: var(--color-text-light);
        }
        
        .amount {
          font-weight: 700;
          font-size: 1rem;
        }
        
        .amount.expense { color: #FF3B30; }
        .amount.income { color: #34C759; }
        
        .empty-state {
          text-align: center;
          padding: var(--spacing-lg);
          color: var(--color-text-muted);
          background-color: #f8f8f8;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .import-btn-link {
          background: none; border: none;
          color: #007AFF; font-weight: 500;
          cursor: pointer; text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
