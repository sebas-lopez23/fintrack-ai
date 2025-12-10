'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Transaction } from '@/types';

interface Props {
    transactions: Transaction[];
}

export default function CashFlowChart({ transactions }: Props) {
    const data = useMemo(() => {
        // Group by Month (or suitable Unit)
        // If range is small, group by day? Let's stick to Month for general view, or adjust dynamic?
        // Let's do dynamic: if txs span < 35 days, daily. Else, monthly.

        if (transactions.length === 0) return [];

        const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const start = new Date(sorted[0].date);
        const end = new Date(sorted[sorted.length - 1].date);
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);

        const isDaily = diffDays < 45;

        const groups: Record<string, { income: number; expense: number; date: Date }> = {};

        transactions.forEach(tx => {
            const d = new Date(tx.date);
            let key = '';

            if (isDaily) {
                key = d.toISOString().split('T')[0]; // YYYY-MM-DD
            } else {
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            }

            if (!groups[key]) groups[key] = { income: 0, expense: 0, date: d };

            if (tx.type === 'income') groups[key].income += tx.amount;
            if (tx.type === 'expense') groups[key].expense += Math.abs(tx.amount);
        });

        // Convert to array and Sort
        return Object.keys(groups).map(k => ({
            name: k,
            income: groups[k].income,
            expense: groups[k].expense,
            date: groups[k].date
        })).sort((a, b) => a.date.getTime() - b.date.getTime());

    }, [transactions]);

    const formatCurrency = (val: number) => {
        if (Math.abs(val) > 999999) return `$${(val / 1000000).toFixed(1)}M`;
        return `$${(val / 1000).toFixed(0)}k`;
    };

    const formatDate = (dateStr: string) => {
        // Simple heuristic: if contains '-', check length
        if (dateStr.length === 7) { // YYYY-MM
            const [y, m] = dateStr.split('-');
            const date = new Date(parseInt(y), parseInt(m) - 1);
            return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        }
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    if (data.length === 0) return <div className="empty-state">No hay datos para mostrar.</div>;

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} barGap={4}>
                <Tooltip
                    formatter={(val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val)}
                    labelFormatter={(label) => formatDate(label as string)}
                    contentStyle={{ borderRadius: '12px', border: 'none' }}
                    cursor={{ fill: '#f4f4f5' }}
                />
                <Legend iconType="circle" />
                <XAxis dataKey="name" tickFormatter={formatDate} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="income" name="Ingresos" fill="#34C759" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Gastos" fill="#FF3B30" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
