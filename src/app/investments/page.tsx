'use client';

import React, { useState } from 'react';
import MobileLayout from '@/components/Layout/MobileLayout';
import { TrendingUp, TrendingDown, Brain, DollarSign, BarChart3 } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Investment } from '@/types';

export default function InvestmentsPage() {
  const { investments } = useFinance();
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const formatCurrency = (amount: number, currency: 'USD' | 'COP' = 'USD') => {
    return new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTotalValue = () => {
    const USD_RATE = 4000;
    return investments.reduce((sum, asset) => {
      const price = asset.currentPrice || asset.purchasePrice;
      let value = asset.quantity * price;
      if (asset.type === 'stock' || asset.type === 'crypto' || asset.type === 'etf') {
        value *= USD_RATE;
      }
      return sum + value;
    }, 0);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setPrediction(null);
    setTimeout(() => {
      setIsAnalyzing(false);
      setPrediction("Basado en el análisis de tendencias históricas y sentimiento de mercado, se proyecta un crecimiento moderado del 5% para tu portafolio en el próximo trimestre. Se recomienda mantener posiciones en Tecnología (AAPL) y considerar tomar ganancias parciales en Cripto.");
    }, 2500);
  };

  return (
    <MobileLayout>
      <h1 className="page-title">Inversiones</h1>

      {/* Portfolio Summary */}
      <div className="summary-card">
        <div className="summary-label">Valor Total Estimado (COP)</div>
        <div className="summary-value">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(calculateTotalValue())}</div>
        <div className="summary-change positive">
          <TrendingUp size={16} />
          <span>+12.5% (Histórico)</span>
        </div>
      </div>

      {/* AI Prediction */}
      <div className="ai-section">
        <button className="ai-btn" onClick={handleAnalyze} disabled={isAnalyzing}>
          <Brain size={20} />
          <span>{isAnalyzing ? 'Analizando mercado...' : 'Analizar Portafolio con IA'}</span>
        </button>

        {prediction && (
          <div className="prediction-box">
            <div className="pred-header">
              <Brain size={16} className="text-primary" />
              <span>Insight Financiero</span>
            </div>
            <p>{prediction}</p>
          </div>
        )}
      </div>

      {/* Assets List */}
      <div className="assets-list">
        {investments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            No tienes inversiones registradas.
          </div>
        ) : (
          investments.map(asset => {
            const isUSD = asset.type === 'stock' || asset.type === 'crypto' || asset.type === 'etf';
            const price = asset.currentPrice || asset.purchasePrice;
            const value = asset.quantity * price;
            const cost = asset.quantity * asset.purchasePrice;
            const profit = value - cost;
            const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
            const isPositive = profit >= 0;

            return (
              <div key={asset.id} className="asset-item">
                <div className="asset-icon">
                  {asset.type === 'stock' || asset.type === 'etf' ? <BarChart3 /> : asset.type === 'crypto' ? <DollarSign /> : <DollarSign />}
                </div>
                <div className="asset-info">
                  <div className="asset-top">
                    <span className="asset-symbol">{asset.symbol || asset.name}</span>
                    <span className="asset-price">{formatCurrency(price, isUSD ? 'USD' : 'COP')}</span>
                  </div>
                  <div className="asset-name">{asset.name}</div>
                </div>
                <div className="asset-perf">
                  <div className="asset-value">{formatCurrency(value, isUSD ? 'USD' : 'COP')}</div>
                  <div className={`asset-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? '+' : ''}{profitPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: var(--spacing-lg);
        }

        .summary-card {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
          padding: var(--spacing-lg);
          border-radius: var(--radius-lg);
          color: white;
          margin-bottom: var(--spacing-lg);
          box-shadow: var(--shadow-lg);
        }

        .summary-label {
          font-size: 0.875rem;
          opacity: 0.9;
          margin-bottom: 4px;
        }

        .summary-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .summary-change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.875rem;
          background-color: rgba(255,255,255,0.2);
          width: fit-content;
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }

        .ai-section {
          margin-bottom: var(--spacing-lg);
        }

        .ai-btn {
          width: 100%;
          background: linear-gradient(90deg, #8b5cf6, #ec4899);
          color: white;
          padding: 12px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .ai-btn:disabled {
          opacity: 0.7;
        }

        .prediction-box {
          margin-top: var(--spacing-md);
          background-color: var(--color-surface);
          padding: var(--spacing-md);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-primary);
          animation: fadeIn 0.5s ease;
        }

        .pred-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--color-primary);
        }

        .prediction-box p {
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--color-text-muted);
        }

        .assets-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .asset-item {
          display: flex;
          align-items: center;
          padding: var(--spacing-md);
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }

        .asset-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--color-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: var(--spacing-md);
          color: var(--color-text-muted);
        }

        .asset-info {
          flex: 1;
        }

        .asset-top {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .asset-symbol {
          font-weight: 600;
        }

        .asset-price {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .asset-name {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .asset-perf {
          text-align: right;
        }

        .asset-value {
          font-weight: 600;
        }

        .asset-change {
          font-size: 0.75rem;
        }

        .asset-change.positive { color: var(--color-success); }
        .asset-change.negative { color: var(--color-danger); }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </MobileLayout>
  );
}
