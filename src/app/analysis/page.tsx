'use client';

import React, { useState, useMemo } from 'react';
import MobileLayout from '@/components/Layout/MobileLayout';
import { useFinance } from '@/context/FinanceContext';
import { PieChart, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import PillarAnalysis from '@/components/Analysis/PillarAnalysis';
import TopExpensesTable from '@/components/Analysis/TopExpensesTable';
import NetWorthHistoryChart from '@/components/Analysis/NetWorthHistoryChart';

type PillarType = 'needs' | 'wants' | 'savings';

export default function AnalysisPage() {
  const { transactions, budgets, categories, accounts } = useFinance();
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'all'>('month');

  // --- 1. Filter Transactions by Time ---
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      if (timeRange === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (timeRange === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, timeRange]);

  // --- 2. Pillar Logic Mapping ---
  // (We duplicate this mapping for now, ideally it's in a shared utils or DB property)
  const MAPPING: Record<string, PillarType> = {
    'Arriendo': 'needs', 'Hogar': 'needs', 'Servicios': 'needs', 'Comida': 'needs',
    'Mercado': 'needs', 'Salud': 'needs', 'Transporte': 'needs', 'Educación': 'needs',
    'Ahorro': 'savings', 'Inversión': 'savings', 'Diezmo': 'savings',
    'Entretenimiento': 'wants', 'Compras': 'wants', 'Restaurantes': 'wants', 'Viajes': 'wants',
    'Suscripciones': 'wants'
  };
  const getPillar = (cat: string) => MAPPING[cat] || 'wants';

  // --- 3. Calculate Pillar Performance ---
  const pillarStats = useMemo(() => {
    const acc = {
      needs: { actual: 0, budget: 0 },
      wants: { actual: 0, budget: 0 },
      savings: { actual: 0, budget: 0 }
    };

    // Sum Budgets
    budgets.forEach(b => {
      const p = getPillar(b.category);
      acc[p].budget += b.limit;
    });

    // Sum Spending (Expenses only)
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        const p = getPillar(t.category);
        acc[p].actual += Math.abs(t.amount);
      }
    });

    return [
      { name: 'Necesidades', target: acc.needs.budget, actual: acc.needs.actual, color: '#007AFF', percentUsed: 0 },
      { name: 'Estilo de Vida', target: acc.wants.budget, actual: acc.wants.actual, color: '#AF52DE', percentUsed: 0 },
      { name: 'Futuro', target: acc.savings.budget, actual: acc.savings.actual, color: '#34C759', percentUsed: 0 },
    ];
  }, [budgets, filteredTransactions]);

  // --- 4. KPIs ---
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const netWorth = accounts.reduce((acc, a) => acc + (a.type === 'credit' ? -Math.abs(a.balance) : a.balance), 0);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <MobileLayout>
      <div className="page-header">
        <h1>Reporte Financiero</h1>
        <div className="time-selector">
          {(['month', 'year', 'all'] as const).map(t => (
            <button
              key={t}
              className={timeRange === t ? 'active' : ''}
              onClick={() => setTimeRange(t)}
            >
              {t === 'month' ? 'Mes' : t === 'year' ? 'Año' : 'Todo'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="icon" style={{ background: '#E4F9E9', color: '#34C759' }}><TrendingUp size={20} /></div>
          <span className="label">Tasa de Ahorro</span>
          <span className="value">{savingsRate.toFixed(1)}%</span>
        </div>
        <div className="kpi-card">
          <div className="icon" style={{ background: '#F0F9FF', color: '#007AFF' }}><Wallet size={20} /></div>
          <span className="label">Patrimonio Neto</span>
          <span className="value compact">{formatMoney(netWorth)}</span>
        </div>
        <div className="kpi-card">
          <div className="icon" style={{ background: '#FFF0F0', color: '#FF3B30' }}><DollarSign size={20} /></div>
          <span className="label">Gastos Totales</span>
          <span className="value compact">{formatMoney(totalExpense)}</span>
        </div>
      </div>

      {/* Main Strategies */}
      <PillarAnalysis data={pillarStats} />

      {/* Net Worth Trend */}
      <div className="chart-card">
        <h3>Tendencia de Patrimonio</h3>
        <NetWorthHistoryChart transactions={transactions} accounts={accounts} dateRange={null} />
      </div>

      {/* Drill Down */}
      <TopExpensesTable transactions={filteredTransactions} />

      <style jsx>{`
                .page-header { 
                    display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; 
                }
                h1 { fontSize: 24px; fontWeight: 800; margin: 0; color: #1C1C1E; }
                
                .time-selector { 
                    background: #E5E5EA; padding: 2px; border-radius: 8px; display: flex; 
                }
                .time-selector button {
                    background: none; border: none; padding: 6px 12px; font-size: 13px; font-weight: 600; color: #8E8E93; border-radius: 6px;
                }
                .time-selector button.active { background: white; color: #1C1C1E; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

                .kpi-grid { 
                    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; 
                }
                .kpi-card {
                    background: white; border-radius: 16px; padding: 16px 12px; 
                    display: flex; flex-direction: column; align-items: center; text-align: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #F2F2F7;
                }
                .icon { width: 36px; height: 36px; border-radius: 10px; display: flex; alignItems: center; justifyContent: center; margin-bottom: 8px; }
                .label { font-size: 11px; color: #8E8E93; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; }
                .value { font-size: 18px; font-weight: 800; color: #1C1C1E; }
                .value.compact { font-size: 15px; }

                .chart-card {
                    background: white; padding: 20px; border-radius: 24px; margin-bottom: 24px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                }
                .chart-card h3 { margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #1C1C1E; }
            `}</style>
    </MobileLayout>
  );
}
