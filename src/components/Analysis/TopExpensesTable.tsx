'use client';

import React from 'react';
import { Transaction } from '@/types';

interface Props {
    transactions: Transaction[];
}

export default function TopExpensesTable({ transactions }: Props) {
    const data = React.useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const totalExpense = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const catMap: Record<string, number> = {};
        expenses.forEach(t => {
            const cat = t.category;
            catMap[cat] = (catMap[cat] || 0) + Math.abs(t.amount);
        });

        // Convert to array and Sort Descending
        return Object.keys(catMap).map(cat => ({
            category: cat,
            amount: catMap[cat],
            percent: totalExpense > 0 ? (catMap[cat] / totalExpense) * 100 : 0
        })).sort((a, b) => b.amount - a.amount).slice(0, 5); // Top 5
    }, [transactions]);

    const formatMoney = (val: number) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    // Helper map for icons (simple fallback)
    const getIcon = (cat: string) => {
        // You could import the full emoji map from CategoriesPage, simplified here
        const map: Record<string, string> = {
            'Comida': '🍔', 'Transporte': '🚗', 'Hogar': '🏠', 'Entretenimiento': '🎬',
            'Salud': '💊', 'Compras': '🛍️', 'Servicios': '💡', 'Viajes': '✈️',
            'Educación': '📚', 'Deuda': '💳'
        };
        return map[cat] || '🏷️';
    };

    if (data.length === 0) return <div className="empty">No hay gastos en este periodo.</div>;

    return (
        <div className="table-container">
            {data.map((row, i) => (
                <div key={row.category} className="row">
                    <div className="cat-icon">{getIcon(row.category)}</div>
                    <div className="cat-info">
                        <div className="cat-header">
                            <span className="name">{row.category}</span>
                            <span className="percent">{row.percent.toFixed(1)}%</span>
                        </div>
                        <div className="progress-bg">
                            <div className="progress-fill" style={{ width: `${row.percent}%` }} />
                        </div>
                    </div>
                    <div className="amount">
                        {formatMoney(row.amount)}
                    </div>
                </div>
            ))}

            <style jsx>{`
                .table-container { display: flex; flex-direction: column; gap: 16px; }
                .empty { text-align: center; color: #8E8E93; font-size: 14px; padding: 20px; }

                .row { display: flex; align-items: center; gap: 12px; }
                
                .cat-icon {
                    width: 36px; height: 36px; background: #F2F2F7; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center; font-size: 18px;
                }

                .cat-info { flex: 1; }
                .cat-header { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
                .name { font-weight: 500; color: #1C1C1E; }
                .percent { color: #8E8E93; font-size: 12px; }

                .progress-bg { height: 6px; background: #F2F2F7; border-radius: 3px; overflow: hidden; }
                .progress-fill { height: 100%; background: #007AFF; border-radius: 3px; }

                .amount { font-weight: 600; font-size: 14px; color: #1C1C1E; min-width: 80px; text-align: right; }
            `}</style>
        </div>
    );
}
