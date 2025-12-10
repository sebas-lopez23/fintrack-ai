'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Subscription } from '@/types';

interface UpcomingPaymentsProps {
  onSubscriptionClick?: (subscription: Subscription) => void;
}

export default function UpcomingPayments({ onSubscriptionClick }: UpcomingPaymentsProps) {
  const { subscriptions, getUpcomingCCPayments } = useFinance();

  // Combine real subscriptions with virtual credit card bills
  const ccBills = getUpcomingCCPayments();
  const allItems = [...subscriptions, ...ccBills];

  // Sort by next payment date
  const sortedSubscriptions = allItems
    .sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime())
    .slice(0, 10); // Show next 10

  const formatDate = (dateString: string) => {
    // Handling timezone issues roughly by using Split or UTC methods if needed
    // But keeping it simple as standard Date parsing usually works in local env if string is YYYY-MM-DD
    const date = new Date(dateString);
    // Trick to avoid timezone shift on simple dates: append time
    const d = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
    const day = d.getDate();
    const month = d.toLocaleDateString('es-ES', { month: 'short' });
    return `${day} ${month}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Entertainment: '#FF3B30',
      Utilities: '#FF9500',
      Home: '#34C759',
      Transport: '#007AFF',
      Food: '#5856D6',
      Health: '#FF2D55',
      Shopping: '#AF52DE',
      Debt: '#1C1C1E', // Black for cards
    };
    return colors[category] || '#8E8E93';
  };

  return (
    <div className="upcoming-payments">
      <div className="payments-scroll">
        {sortedSubscriptions.map((sub) => (
          <div
            key={sub.id}
            className={`payment-card ${sub.subscriptionType === 'credit_card_bill' ? 'credit-bill' : ''}`}
            onClick={() => onSubscriptionClick?.(sub)}
            style={{ cursor: onSubscriptionClick ? 'pointer' : 'default' }}
          >
            <div className="card-header">
              <div className="icon" style={{ background: getCategoryColor(sub.category) }}>
                {sub.subscriptionType === 'credit_card_bill' ? '💳' : sub.name.charAt(0)}
              </div>
              <span className="date">{formatDate(sub.nextPaymentDate)}</span>
            </div>
            <h4>{sub.name}</h4>
            <p className="amount">{formatCurrency(sub.amount)}</p>
          </div>
        ))}
      </div>
      <style jsx>{`
        .upcoming-payments {
          margin-bottom: 24px;
        }

        .payments-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .payments-scroll::-webkit-scrollbar {
          display: none;
        }

        .payment-card {
          min-width: 160px;
          background: var(--color-surface, white);
          border-radius: 16px;
          padding: 16px;
          transition: transform 0.2s;
        }

        .payment-card.credit-bill {
            border: 1px solid #000;
            background: #f9f9f9;
        }

        .payment-card:active {
          transform: scale(0.95);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          font-weight: 700;
        }

        .date {
          font-size: 12px;
          color: var(--color-text-muted, #8E8E93);
          font-weight: 500;
        }

        h4 {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text, #000);
          margin: 0 0 8px 0;
        }

        .amount {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text, #000);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
