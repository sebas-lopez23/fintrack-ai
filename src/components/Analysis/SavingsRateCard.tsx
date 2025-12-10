'use client';

import React from 'react';
import { Transaction } from '@/types';
import { TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from 'lucide-react';

interface Props {
    transactions: Transaction[];
}

export default function SavingsRateCard({ transactions }: Props) {
    const metrics = React.useMemo(() => {
        let income = 0;
        let expense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') income += t.amount;
            if (t.type === 'expense') expense += Math.abs(t.amount);
        });

        const saved = income - expense;
        const rate = income > 0 ? (saved / income) * 100 : 0;

        return { income, expense, saved, rate };
    }, [transactions]);

    const formatMoney = (val: number) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    const isHealthy = metrics.rate >= 20; // Healthy savings rate > 20%
    const isPositive = metrics.saved >= 0;

    return (
        <div className="metrics-container">
            {/* Main Savings Card */}
            <div className="main-metric">
                <div className="metric-header">
                    <div className="icon-bg">
                        {isPositive ? <PiggyBank size={24} color="#007AFF" /> : <AlertTriangle size={24} color="#FF3B30" />}
                    </div>
                    <span>Tasa de Ahorro</span>
                </div>
                <div className="metric-value">
                    <span className={`rate ${isPositive ? 'good' : 'bad'}`}>
                        {metrics.rate.toFixed(1)}%
                    </span>
                    <span className="label">de tus ingresos</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="fill"
                        style={{
                            width: `${Math.max(0, Math.min(100, metrics.rate))}%`,
                            background: isPositive ? (isHealthy ? '#34C759' : '#FF9500') : '#FF3B30'
                        }}
                    />
                </div>
                <p className="advice">
                    {isPositive
                        ? (isHealthy
                            ? "¡Excelente! Estás construyendo riqueza."
                            : "Vas bien, pero intenta llegar al 20%.")
                        : "Cuidado: Estás gastando más de lo que ganas."}
                </p>
            </div>

            {/* Smaller Detail Cards */}
            <div className="details-grid">
                <div className="detail-card income">
                    <span className="label">Total Ingresos</span>
                    <span className="val">{formatMoney(metrics.income)}</span>
                </div>
                <div className="detail-card expense">
                    <span className="label">Total Gastos</span>
                    <span className="val">{formatMoney(metrics.expense)}</span>
                </div>
                <div className="detail-card net">
                    <span className="label">Ahorro Neto</span>
                    <span className={`val ${isPositive ? 'pos' : 'neg'}`}>
                        {isPositive ? '+' : ''}{formatMoney(metrics.saved)}
                    </span>
                </div>
            </div>

            <style jsx>{`
                .metrics-container { display: flex; flex-direction: column; gap: 16px; }
                
                .main-metric {
                    
                }

                .metric-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
                .icon-bg { 
                    width: 40px; height: 40px; border-radius: 12px; background: #E5E5EA; 
                    display: flex; align-items: center; justify-content: center;
                }
                .metric-header span { font-weight: 600; font-size: 16px; color: #1C1C1E; }

                .metric-value { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; }
                .rate { font-size: 32px; font-weight: 800; }
                .rate.good { color: #34C759; }
                .rate.bad { color: #FF3B30; }
                .metric-value .label { color: #8E8E93; font-size: 14px; }

                .progress-bar {
                    height: 8px; background: #F2F2F7; border-radius: 4px; overflow: hidden; margin-bottom: 12px;
                }
                .fill { height: 100%; transition: width 0.5s ease; }

                .advice { font-size: 13px; color: #8E8E93; margin: 0; }

                .details-grid {
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
                    padding-top: 16px; border-top: 1px solid #E5E5EA;
                }
                .detail-card { display: flex; flex-direction: column; gap: 4px; }
                .detail-card .label { font-size: 11px; color: #8E8E93; text-transform: uppercase; letter-spacing: 0.5px; }
                .detail-card .val { font-size: 13px; font-weight: 600; color: #000; word-break: break-all; }
                
                .detail-card.income .val { color: #34C759; }
                .detail-card.expense .val { color: #FF3B30; }
                .val.neg { color: #FF3B30; }
                .val.pos { color: #34C759; }
            `}</style>
        </div>
    );
}
