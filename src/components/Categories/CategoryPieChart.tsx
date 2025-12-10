import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction, Category } from '@/types';
import { CategoryItem } from '@/types';

interface Props {
    transactions: Transaction[];
    categories: CategoryItem[];
    type: 'expense' | 'income';
}

export default function CategoryPieChart({ transactions, categories, type }: Props) {
    // 1. Filter transactions by type
    const filteredTx = transactions.filter(t => t.type === type);

    // 2. Aggregate by Category Name
    const dataMap: Record<string, number> = {};

    filteredTx.forEach(tx => {
        const amount = Math.abs(tx.amount);
        if (!dataMap[tx.category]) {
            dataMap[tx.category] = 0;
        }
        dataMap[tx.category] += amount;
    });

    // Normalization Map for Legacy Data
    const NORMALIZE: Record<string, string> = {
        'Food': 'Comida', 'Transport': 'Transporte', 'Home': 'Hogar',
        'Entertainment': 'Entretenimiento', 'Health': 'Salud', 'Shopping': 'Compras',
        'Utilities': 'Servicios', 'Travel': 'Viajes', 'Education': 'Educación',
        'Other': 'Otros', 'Investment': 'Inversiones', 'Salary': 'Salario',
        'Debt': 'Deudas', 'Credit Card': 'Tarjeta de Crédito'
    };

    // Helper to generate consistent color from string
    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    // 3. Convert to Array for Recharts
    let data = Object.keys(dataMap).map(catName => {
        // Try exact match
        let catMeta = categories.find(c => c.name === catName);

        // If not found, try normalized name
        if (!catMeta && NORMALIZE[catName]) {
            catMeta = categories.find(c => c.name === NORMALIZE[catName]);
        }

        // Use category color, or fallback to hash if completely unknown
        const color = catMeta?.color || stringToColor(catName);

        // Rename for display if we normalized it
        const displayName = catMeta?.name || catName;

        return {
            name: displayName,
            value: dataMap[catName],
            color: color
        };
    });

    // Filter out zero values and sort
    data = data.filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP', maximumFractionDigits: 0
        }).format(val);
    };

    if (data.length === 0) {
        return (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8E8E93' }}>
                No hay datos para mostrar
            </div>
        );
    }

    return (
        <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={data}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Text for Total */}
            <div className="center-text">
                <span className="total-label">Total</span>
                <span className="total-value">
                    {formatCurrency(data.reduce((acc, curr) => acc + curr.value, 0))}
                </span>
            </div>

            <style jsx>{`
        .chart-container {
            position: relative;
            background: white;
            padding: 20px;
            border-radius: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .center-text {
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: none; 
        }
        .total-label { font-size: 12px; color: #8E8E93; }
        .total-value { font-size: 14px; font-weight: 700; color: #000; }
      `}</style>
        </div>
    );
}
