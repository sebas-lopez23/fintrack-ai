'use client';

import React, { useState, useMemo, useEffect } from 'react';
import MobileLayout from '@/components/Layout/MobileLayout';
import { useFinance } from '@/context/FinanceContext';
import { Target, Shield, ShoppingBag, Edit2, AlertTriangle, ChevronDown, ChevronUp, AlertCircle, X, PieChart } from 'lucide-react';

type PillarType = 'needs' | 'wants' | 'savings';

export default function BudgetPage() {
    const { budgets, transactions, subscriptions, updateBudget, categories, strategyTargets, updateStrategyTarget } = useFinance();

    // State
    const [incomeEstimate, setIncomeEstimate] = useState<number>(5000000);
    const [expandedPillar, setExpandedPillar] = useState<PillarType | null>('needs');
    const [selectedSubCat, setSelectedSubCat] = useState<{ name: string, limit: number } | null>(null);
    const [modalVal, setModalVal] = useState('');

    // --- 1. Top Level Configuration ---
    // Synced with Context
    const [pillars, setPillars] = useState({
        needs: { label: 'Necesidades', targetPct: strategyTargets.needs, color: '#007AFF', icon: <Shield size={20} /> },
        wants: { label: 'Estilo de Vida', targetPct: strategyTargets.wants, color: '#AF52DE', icon: <ShoppingBag size={20} /> },
        savings: { label: 'Futuro', targetPct: strategyTargets.savings, color: '#34C759', icon: <Target size={20} /> }
    });

    // Update local state when context loads/changes
    useEffect(() => {
        setPillars(prev => ({
            ...prev,
            needs: { ...prev.needs, targetPct: strategyTargets.needs },
            wants: { ...prev.wants, targetPct: strategyTargets.wants },
            savings: { ...prev.savings, targetPct: strategyTargets.savings }
        }));
    }, [strategyTargets]);

    const totalPct = Object.values(pillars).reduce((sum, p) => sum + (p.targetPct || 0), 0);
    const remainingPct = 100 - totalPct;
    const isOver = totalPct > 100;

    const changePillarTarget = (type: PillarType, newVal: string) => {
        const num = parseFloat(newVal);
        const finalVal = isNaN(num) ? 0 : num;

        // Optimistic local update
        setPillars(prev => ({
            ...prev,
            [type]: { ...prev[type], targetPct: finalVal }
        }));

        // Persist to Supabase
        updateStrategyTarget(type, finalVal);
    };

    // --- 2. Category Mapping ---
    const MAPPING: Record<string, PillarType> = {
        'Arriendo': 'needs', 'Hogar': 'needs', 'Servicios': 'needs', 'Comida': 'needs',
        'Mercado': 'needs', 'Salud': 'needs', 'Transporte': 'needs', 'Educación': 'needs', 'Gasolina': 'needs', 'Seguros': 'needs',
        'Ahorro': 'savings', 'Inversión': 'savings', 'Diezmo': 'savings', 'Fondo de Emergencia': 'savings', 'Deuda': 'savings',
        'Entretenimiento': 'wants', 'Compras': 'wants', 'Restaurantes': 'wants', 'Viajes': 'wants',
        'Personal': 'wants', 'Regalos': 'wants', 'Mascotas': 'wants', 'Suscripciones': 'wants', 'Ropa': 'wants'
    };

    const getPillar = (catName: string): PillarType => MAPPING[catName] || 'wants';

    // --- 3. Spending Calculations ---
    const budgetMap = new Map(budgets.map(b => [b.category as string, b.limit]));
    const now = new Date();
    const currentSpendMap = useMemo(() => {
        const map: Record<string, number> = {};
        transactions.forEach(t => {
            const d = new Date(t.date);
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense') {
                map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
            }
        });
        return map;
    }, [transactions]);

    const groups = useMemo(() => {
        const acc = {
            needs: { cats: [] as string[], allocated: 0, spending: 0 },
            wants: { cats: [] as string[], allocated: 0, spending: 0 },
            savings: { cats: [] as string[], allocated: 0, spending: 0 }
        };

        categories.forEach(cat => {
            const p = getPillar(cat.name);
            acc[p].cats.push(cat.name);
            acc[p].allocated += (budgetMap.get(cat.name) || 0);
            acc[p].spending += (currentSpendMap[cat.name] || 0);
        });
        return acc;
    }, [categories, budgets, currentSpendMap]);

    // Helpers
    const formatMoney = (val: number) =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

    const openSubEdit = (cat: string) => {
        const limit = budgetMap.get(cat) || 0;
        setSelectedSubCat({ name: cat, limit });
        setModalVal(limit > 0 ? limit.toString() : '');
    };

    const saveSubBudget = async () => {
        if (selectedSubCat) {
            const val = parseFloat(modalVal) || 0;
            await updateBudget(selectedSubCat.name, val);
            setSelectedSubCat(null);
        }
    };

    return (
        <MobileLayout>
            <div className="budget-container">
                <h1 className="main-title">Estrategia 50/30/20</h1>

                {/* 1. INCOME INPUT */}
                <div className="income-card">
                    <span className="label">Ingreso Mensual Base</span>
                    <div className="input-row">
                        <span>$</span>
                        <input
                            type="number"
                            value={incomeEstimate}
                            onChange={(e) => setIncomeEstimate(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>

                {/* 2. STRATEGY CONTROLLER (Unified) */}
                <div className="strategy-panel">
                    <div className="strategy-header">
                        <span className="s-title">Distribución del Ingreso</span>
                        <span className={`s-total ${isOver ? 'danger' : 'ok'}`}>
                            {totalPct}% / 100%
                        </span>
                    </div>

                    <div className="master-bar">
                        <div className="bar-seg" style={{ width: `${pillars.needs.targetPct}%`, background: pillars.needs.color }} />
                        <div className="bar-seg" style={{ width: `${pillars.wants.targetPct}%`, background: pillars.wants.color }} />
                        <div className="bar-seg" style={{ width: `${pillars.savings.targetPct}%`, background: pillars.savings.color }} />
                        {isOver && <div className="bar-seg pattern-danger" style={{ width: `${totalPct - 100}%` }} />}
                    </div>

                    {isOver && (
                        <div className="error-msg">
                            <AlertCircle size={14} /> Estás usando el {totalPct}% del dinero. Reduce un {totalPct - 100}%.
                        </div>
                    )}

                    <div className="inputs-grid">
                        {(Object.keys(pillars) as PillarType[]).map(key => (
                            <div key={key} className="strategy-input-group">
                                <label style={{ color: pillars[key].color }}>{pillars[key].label}</label>
                                <div className="input-box">
                                    <input
                                        type="number"
                                        value={pillars[key].targetPct}
                                        onChange={(e) => changePillarTarget(key, e.target.value)}
                                    />
                                    <span>%</span>
                                </div>
                                <span className="money-preview">
                                    {formatMoney((pillars[key].targetPct / 100) * incomeEstimate)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. PILLARS & SUBCATEGORIES */}
                <div className="pillars-list">
                    {(Object.keys(pillars) as PillarType[]).map(type => {
                        const conf = pillars[type];
                        const data = groups[type];
                        const budgetAvailable = (conf.targetPct / 100) * incomeEstimate;
                        const remaining = budgetAvailable - data.allocated;
                        const isExpanded = expandedPillar === type;

                        return (
                            <div key={type} className={`pillar-card ${isExpanded ? 'open' : ''}`}>
                                <div className="p-header" onClick={() => setExpandedPillar(isExpanded ? null : type)}>
                                    <div className="p-icon" style={{ background: `${conf.color}15`, color: conf.color }}>
                                        {conf.icon}
                                    </div>
                                    <div className="p-main">
                                        <h3>{conf.label}</h3>
                                        <span className="p-subtitle">
                                            {data.allocated === 0 ? 'Sin asignar' : `${formatMoney(data.allocated)} asignados`}
                                        </span>
                                    </div>
                                    <div className="p-actions">
                                        {isExpanded ? <ChevronUp size={20} color="#C7C7CC" /> : <ChevronDown size={20} color="#C7C7CC" />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-content">
                                        <div className="p-summary">
                                            <span>Disponible: {formatMoney(remaining)}</span>
                                            <div className="mini-track">
                                                <div
                                                    className="mini-fill"
                                                    style={{
                                                        width: `${Math.min(100, (data.allocated / budgetAvailable) * 100)}%`,
                                                        background: remaining < 0 ? '#FF3B30' : conf.color
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="sub-list">
                                            {data.cats.map(cat => (
                                                <div key={cat} className="sub-item" onClick={(e) => { e.stopPropagation(); openSubEdit(cat); }}>
                                                    <div className="sub-info">
                                                        <span className="name">{cat}</span>
                                                    </div>
                                                    <div className="sub-val">
                                                        {budgetMap.get(cat) ? (
                                                            <span className="amount">{formatMoney(budgetMap.get(cat) || 0)}</span>
                                                        ) : (
                                                            <span className="unset">Definir</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Modal */}
                {selectedSubCat && (
                    <>
                        <div className="overlay" onClick={() => setSelectedSubCat(null)} />
                        <div className="bottom-sheet">
                            <div className="sheet-header">
                                <h3>{selectedSubCat.name}</h3>
                                <button onClick={() => setSelectedSubCat(null)}><X size={24} /></button>
                            </div>
                            <div className="sheet-body">
                                <div className="input-lg">
                                    <span>$</span>
                                    <input
                                        type="number"
                                        autoFocus
                                        value={modalVal}
                                        onChange={(e) => setModalVal(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                                <p>Define el límite mensual para esta categoría.</p>
                                <button className="btn-save" onClick={saveSubBudget}>Guardar</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                .budget-container { padding-bottom: 40px; }
                .main-title { font-size: 26px; font-weight: 800; margin: 10px 0 20px; color: #1C1C1E; }

                .income-card {
                    background: #1C1C1E; color: white; border-radius: 20px; padding: 20px; margin-bottom: 24px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                .income-card .label { font-size: 13px; color: #8E8E93; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 8px;}
                .input-row { display: flex; align-items: center; gap: 4px; }
                .input-row span { font-size: 24px; color: #34C759; } 
                .input-row input { 
                    background: none; border: none; font-size: 28px; font-weight: 700; color: white; width: 100%; outline: none; 
                }

                /* STRATEGY PANEL */
                .strategy-panel {
                    background: white; border-radius: 20px; padding: 20px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #F2F2F7;
                    margin-bottom: 24px;
                }
                .strategy-header { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; font-weight: 600; }
                .s-total.ok { color: #34C759; }
                .s-total.danger { color: #FF3B30; }

                .master-bar { 
                    height: 10px; background: #F2F2F7; border-radius: 5px; overflow: hidden; display: flex; margin-bottom: 20px; 
                }
                .bar-seg { height: 100%; transition: width 0.3s ease; }
                .pattern-danger { background: repeating-linear-gradient(45deg, #FF3B30, #FF3B30 10px, #FF6B6B 10px, #FF6B6B 20px); }

                .error-msg { background: #FFEAEA; color: #FF3B30; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }

                .inputs-grid { display: flex; justify-content: space-between; gap: 8px; }
                .strategy-input-group { flex: 1; display: flex; flex-direction: column; align-items: center; }
                .strategy-input-group label { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; }
                .input-box { 
                    background: #F2F2F7; border-radius: 12px; padding: 8px 4px; width: 100%; 
                    display: flex; justify-content: center; align-items: center; margin-bottom: 4px; 
                }
                .input-box input { 
                    width: 40px; text-align: right; background: none; border: none; font-weight: 700; font-size: 16px; outline: none; 
                }
                .input-box span { font-size: 12px; font-weight: 600; color: #8E8E93; margin-left: 2px; }
                .money-preview { font-size: 10px; color: #8E8E93; font-weight: 500; }

                /* PILLARS */
                .pillars-list { display: flex; flex-direction: column; gap: 16px; }
                .pillar-card { 
                    background: white; border-radius: 16px; border: 1px solid #F2F2F7; overflow: hidden; transition: all 0.2s; 
                }
                .pillar-card.open { box-shadow: 0 8px 30px rgba(0,0,0,0.08); border-color: transparent; }

                .p-header { display: flex; align-items: center; gap: 12px; padding: 16px; cursor: pointer; }
                .p-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
                .p-main { flex: 1; }
                .p-main h3 { margin: 0; font-size: 16px; font-weight: 600; }
                .p-subtitle { font-size: 12px; color: #8E8E93; }

                .p-content { padding: 0 16px 16px 16px; animation: slideDown 0.2s ease-out; }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

                .p-summary { 
                    background: #FAFAFA; padding: 10px; border-radius: 10px; margin-bottom: 12px; 
                    font-size: 12px; font-weight: 600; color: #8E8E93; 
                }
                .mini-track { height: 4px; background: #E5E5EA; border-radius: 2px; margin-top: 6px; overflow: hidden; }
                .mini-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }

                .sub-list { display: flex; flex-direction: column; gap: 8px; }
                .sub-item { 
                    display: flex; justify-content: space-between; align-items: center; padding: 12px; 
                    border: 1px solid #F2F2F7; border-radius: 12px; cursor: pointer; 
                }
                .sub-item:active { background: #F9F9F9; }
                .name { font-size: 14px; font-weight: 500; }
                .amount { font-weight: 700; font-size: 14px; color: #1C1C1E; }
                .unset { font-size: 11px; background: #E5E5EA; padding: 4px 8px; border-radius: 100px; color: #8E8E93; font-weight: 600; }

                /* MODAL */
                .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 99; backdrop-filter: blur(2px); }
                .bottom-sheet {
                    position: fixed; bottom: 0; left: 0; width: 100%; background: white; z-index: 100;
                    border-radius: 24px 24px 0 0; padding: 24px; box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
                }
                .sheet-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .sheet-header h3 { margin: 0; font-size: 18px; }
                .input-lg { 
                    display: flex; justify-content: center; align-items: center; gap: 8px; 
                    border-bottom: 2px solid #007AFF; padding-bottom: 10px; margin-bottom: 20px; 
                }
                .input-lg span { font-size: 28px; color: #007AFF; font-weight: 600; }
                .input-lg input { font-size: 36px; font-weight: 700; width: 220px; border: none; text-align: center; outline: none; }
                
                .btn-save { 
                    width: 100%; background: #007AFF; color: white; padding: 16px; border-radius: 16px; 
                    font-size: 16px; font-weight: 700; border: none; margin-top: 10px;
                }
            `}</style>
        </MobileLayout>
    );
}
