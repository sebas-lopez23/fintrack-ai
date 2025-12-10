'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useFinance } from '@/context/FinanceContext';

export default function YearlyFinancialChart() {
  const { transactions } = useFinance();

  const data = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    // Initialize with 0
    const chartData = months.map(month => ({ name: month, ingresos: 0, gastos: 0 }));

    transactions.forEach(tx => {
      const date = new Date(tx.date);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        if (tx.type === 'income') {
          chartData[monthIndex].ingresos += tx.amount;
        } else if (tx.type === 'expense') {
          chartData[monthIndex].gastos += Math.abs(tx.amount);
        }
      }
    });

    return chartData;
  }, [transactions]);

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3>Balance Anual {new Date().getFullYear()}</h3>
        <div className="legend">
          <div className="legend-item">
            <span className="dot income"></span> Ingresos
          </div>
          <div className="legend-item">
            <span className="dot expense"></span> Gastos
          </div>
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#8E8E93' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#8E8E93' }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              formatter={(value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)}
            />
            <Bar dataKey="ingresos" fill="#34C759" radius={[4, 4, 0, 0]} barSize={8} />
            <Bar dataKey="gastos" fill="#FF3B30" radius={[4, 4, 0, 0]} barSize={8} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <style jsx>{`
        .chart-card {
          background: white;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.03);
          margin-bottom: 24px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #000;
          margin: 0;
        }

        .legend {
          display: flex;
          gap: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #8E8E93;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot.income { background: #34C759; }
        .dot.expense { background: #FF3B30; }

        .chart-wrapper {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
