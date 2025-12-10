'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Eye, EyeOff } from 'lucide-react';

export default function NetWorthCard() {
  const { getNetWorth, currentUser } = useFinance();
  const [visible, setVisible] = React.useState(true);

  const netWorth = getNetWorth();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getLabel = () => {
    switch (currentUser) {
      case 'user1': return 'Mi Patrimonio';
      case 'user2': return 'Patrimonio de Ella';
      case 'joint': return 'Patrimonio Familiar';
    }
  };

  return (
    <div className="card net-worth-card">
      <div className="header">
        <span className="label">{getLabel()}</span>
        <button onClick={() => setVisible(!visible)} className="toggle-btn">
          {visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
      <div className="amount">
        {visible ? formatCurrency(netWorth) : '••••••••'}
      </div>

      <style jsx>{`
        .net-worth-card {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
          margin-bottom: var(--spacing-md);
          color: white;
          box-shadow: var(--shadow-float);
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }
        
        .label {
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .toggle-btn {
          color: rgba(255, 255, 255, 0.9);
          padding: 4px;
        }
        
        .amount {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          letter-spacing: -1px;
        }
      `}</style>
    </div>
  );
}
