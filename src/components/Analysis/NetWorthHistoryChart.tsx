'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Transaction, Account } from '@/types';

interface Props {
    transactions: Transaction[];
    accounts: Account[];
    dateRange: { start: Date; end: Date } | null;
}

export default function NetWorthHistoryChart({ transactions, accounts, dateRange }: Props) {
    const data = useMemo(() => {
        // 1. Calculate Current Net Worth (Starting Point)
        // We use the dynamic calculation logic we implemented in FinanceContext
        // But here we need history.

        // Strategy: 
        // 1. Get all initial balances sum.
        // 2. Sort ALL transactions by date ascending.
        // 3. Iterate day by day (or transaction by transaction) accumulating the value.
        // 4. Filter the result for the view window.

        const initialTotal = accounts.reduce((sum, acc) => sum + (acc.initialBalance || 0), 0);

        // Sort txs ascending
        const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Group by Day
        const history: { date: number; value: number }[] = [];
        let currentWorth = initialTotal;

        // If we have no transactions, just show a straight line?
        // Let's assume we start from the very first transaction or "today" if empty.

        const txMap = new Map<string, number>(); // date -> daily change

        sortedTx.forEach(tx => {
            const dateStr = tx.date.split('T')[0];
            const amount = Math.abs(tx.amount);
            const change = tx.type === 'expense' ? -amount : amount; // Income +, Expense -

            const prev = txMap.get(dateStr) || 0;
            txMap.set(dateStr, prev + change);
        });

        // Generate timeline
        // Find min and max date
        if (sortedTx.length === 0) return [];

        const startDate = new Date(sortedTx[0].date);
        const endDate = new Date(); // Up to today

        const timeline: { date: string; value: number }[] = [];
        let runningTotal = initialTotal;

        // Iterate from first tx date to today
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateKey = d.toISOString().split('T')[0];
            const change = txMap.get(dateKey) || 0;
            runningTotal += change;

            timeline.push({
                date: dateKey,
                value: runningTotal
            });
        }

        // Filter by View Range
        if (!dateRange) return timeline; // Return all if no range (though standard says null = all?)

        return timeline.filter(pt => {
            const d = new Date(pt.date);
            return d >= dateRange.start && d <= dateRange.end;
        });

    }, [transactions, accounts, dateRange]);

    const formatCurrency = (val: number) => {
        if (Math.abs(val) >= 1000000) {
            return `$${(val / 1000000).toFixed(1)}M`;
        }
        return `$${(val / 1000).toFixed(0)}k`;
    };

    const formatTooltip = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    if (data.length === 0) {
        return <div className="empty-chart">No hay suficientes datos para generar historia.</div>;
    }

    const lastValue = data[data.length - 1]?.value || 0;
    const startValue = data[0]?.value || 0;
    const isGrowing = lastValue >= startValue;

    return (
        <div className="chart-wrapper">
            <div className="chart-stats">
                <span className={`badge ${isGrowing ? 'up' : 'down'}`}>
                    {isGrowing ? '↗ Creciendo' : '↘ Decreciendo'}
                </span>
                <span className="current-val">{formatTooltip(lastValue)}</span>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5EA" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 10, fill: '#8E8E93' }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fontSize: 10, fill: '#8E8E93' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                    />
                    <Tooltip
                        formatter={(val: number) => [formatTooltip(val), 'Patrimonio']}
                        labelFormatter={(label) => formatDate(label as string)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#007AFF"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>

            <style jsx>{`
                .empty-chart { text-align: center; color: #8E8E93; padding: 40px; font-size: 14px; }
                .chart-wrapper { position: relative; }
                .chart-stats {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 15px; padding: 0 10px;
                }
                .badge {
                    font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px;
                }
                .badge.up { background: #E4F9E9; color: #34C759; }
                .badge.down { background: #FFEAEA; color: #FF3B30; }
                .current-val { font-size: 16px; font-weight: 700; color: #000; }
            `}</style>
        </div>
    );
}
