'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';

export default function BudgetProgressBar() {
    const { getBudgetProgress, getMonthlySpend, budgets } = useFinance();

    const progress = getBudgetProgress(); // 0 to 1+
    const spend = getMonthlySpend();
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);

    const percentage = Math.min(progress * 100, 100);

    const getColor = () => {
        if (progress > 1) return 'var(--color-danger)';
        if (progress > 0.8) return 'var(--color-primary)'; // Blue/Warning? User said Blue if close.
        return 'var(--color-success)';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="card budget-card">
            <div className="header">
                <span className="title">Resumen del Mes</span>
                <span className="values">
                    <span className="spend">{formatCurrency(spend)}</span>
                    <span className="total"> / {formatCurrency(totalBudget)}</span>
                </span>
            </div>

            <div className="progress-track">
                <div
                    className="progress-fill"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: getColor()
                    }}
                />
            </div>

            <div className="status-text">
                {progress > 1 ? 'Presupuesto excedido' : `${(progress * 100).toFixed(0)}% gastado`}
            </div>

            <style jsx>{`
        .budget-card {
          margin-bottom: var(--spacing-md);
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: var(--spacing-sm);
        }
        
        .title {
          font-weight: 600;
        }
        
        .values {
          font-size: 0.875rem;
        }
        
        .spend {
          font-weight: 600;
          color: var(--color-text);
        }
        
        .total {
          color: var(--color-text-muted);
        }
        
        .progress-track {
          height: 12px;
          background-color: var(--color-bg);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: var(--spacing-xs);
        }
        
        .progress-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width 0.5s ease, background-color 0.3s ease;
        }
        
        .status-text {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-align: right;
        }
      `}</style>
        </div>
    );
}
