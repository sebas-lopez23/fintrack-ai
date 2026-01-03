'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import TimeRangeSelector from '@/components/Shared/TimeRangeSelector';

export default function FinancialChart() {
  const { transactions } = useFinance();
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  // Calculate expenses by category
  const expensesByCategory = React.useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;

    transactions.forEach(tx => {
      // 1. Filter by Date Range
      if (dateRange) {
        const txDate = new Date(tx.date);
        // Set txDate to clean local time for comparison if needed, but assuming ISO strings work
        if (txDate < dateRange.start || txDate > dateRange.end) return;
      }

      if (tx.type === 'expense') {
        const amount = Math.abs(tx.amount);
        // Normalize Category Names (Legacy Support)
        let catName = tx.category;
        const NORMALIZE: Record<string, string> = {
          'Food': 'Comida', 'Transport': 'Transporte', 'Home': 'Hogar',
          'Entertainment': 'Entretenimiento', 'Health': 'Salud', 'Shopping': 'Compras',
          'Utilities': 'Servicios', 'Travel': 'Viajes', 'Education': 'Educación',
          'Other': 'Otros', 'Investment': 'Inversiones', 'Salary': 'Salario'
        };
        if (NORMALIZE[catName]) catName = NORMALIZE[catName];

        categoryTotals[catName] = (categoryTotals[catName] || 0) + amount;
        totalExpense += amount;
      }
    });

    // Define colors for categories (Bilingual Support / Standard Palette)
    const categoryColors: Record<string, string> = {
      'Comida': '#FF9500',
      'Transporte': '#5856D6',
      'Hogar': '#007AFF',
      'Entretenimiento': '#AF52DE',
      'Salud': '#FF2D55',
      'Compras': '#FFCC00',
      'Servicios': '#5AC8FA',
      'Viajes': '#34C759',
      'Educación': '#FF3B30',
      'Otros': '#8E8E93',
      'Inversiones': '#00C7BE',
      'Salario': '#30B0C7',
      // ... (Legacy handling implicitly covered by normalization, but keep for safety)
      'Food': '#FF9500', 'Transport': '#5856D6', 'Home': '#007AFF',
      'Entertainment': '#AF52DE', 'Health': '#FF2D55', 'Shopping': '#FFCC00',
      'Utilities': '#5AC8FA', 'Travel': '#34C759', 'Education': '#FF3B30',
      'Other': '#8E8E93', 'Investment': '#00C7BE', 'Salary': '#30B0C7'
    };

    const data = Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
        color: categoryColors[name] || '#8E8E93'
      }))
      .sort((a, b) => b.value - a.value);

    return { data, totalExpense };
  }, [transactions, dateRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Gastos por Categoría</h3>
      </div>

      <TimeRangeSelector
        onChange={(range) => setDateRange({ start: range.start, end: range.end })}
        initialRange="month"
      />

      <div className="chart-wrapper">
        {expensesByCategory.data.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expensesByCategory.data}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {expensesByCategory.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Text Overlay */}
            <div className="chart-center-text">
              <span className="amount">{formatCurrency(expensesByCategory.totalExpense)}</span>
              <span className="label">Total Gastado</span>
            </div>
          </>
        ) : (
          <div className="no-data">
            <p>No hay gastos registrados</p>
          </div>
        )}
      </div>

      <div className="chart-legend">
        {expensesByCategory.data.slice(0, 4).map((item, i) => (
          <div key={i} className="legend-item">
            <div className="dot" style={{ background: item.color }}></div>
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .chart-container {
          background: var(--glass-surface);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: 32px;
          padding: 24px;
          box-shadow: var(--shadow-glass);
          margin-bottom: 32px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #000;
        }

        .filter-btn {
          background: #F2F2F7;
          border: none;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: #000;
        }

        .chart-wrapper {
          position: relative;
          height: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chart-center-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
        }

        .amount {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #000;
        }

        .label {
          font-size: 12px;
          color: #8E8E93;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #3C3C43;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .no-data {
            color: #8E8E93;
            font-size: 14px;
        }
      `}</style>
    </div>
  );
}
