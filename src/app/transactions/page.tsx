'use client';

import React, { useState } from 'react';
import MobileLayout from '@/components/Layout/MobileLayout';
import { useFinance } from '@/context/FinanceContext';
import { Transaction, Category } from '@/types';
import TransactionDetailModal from '@/components/Transaction/TransactionDetailModal';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Calendar,
    DollarSign,
    ShoppingBag,
    Coffee,
    Home,
    Zap,
    Activity,
    Briefcase,
    Plane,
    BookOpen,
    MoreHorizontal
} from 'lucide-react';

export default function TransactionsPage() {
    const { transactions, categories } = useFinance();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    const filteredTransactions = transactions.filter(tx => {
        const note = tx.note || '';
        const category = tx.category || '';
        const term = searchTerm.toLowerCase();

        const matchesSearch = note.toLowerCase().includes(term) ||
            category.toLowerCase().includes(term);
        const matchesType = filterType === 'all' || tx.type === filterType;
        return matchesSearch && matchesType;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-CO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    const getCategoryIcon = (categoryName: string) => {
        const category = categories.find(c => c.name === categoryName);
        // Map string icon names to Lucide components if needed, or just use the switch as fallback
        // For now, let's keep the switch as a reliable mapper, but we could extend it
        switch (categoryName) {
            case 'Comida': return <Coffee size={18} />;
            case 'Transporte': return <Activity size={18} />;
            case 'Hogar': return <Home size={18} />;
            case 'Servicios': return <Zap size={18} />;
            case 'Compras': return <ShoppingBag size={18} />;
            case 'Salario': return <DollarSign size={18} />;
            case 'Inversiones': return <Briefcase size={18} />;
            case 'Viajes': return <Plane size={18} />;
            case 'Educación': return <BookOpen size={18} />;
            default: return <MoreHorizontal size={18} />;
        }
    };

    return (
        <MobileLayout>
            <h1 className="page-title">Transacciones</h1>

            {/* Search and Filter */}
            <div className="filters-container">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        Todos
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'expense' ? 'active' : ''}`}
                        onClick={() => setFilterType('expense')}
                    >
                        Gastos
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'income' ? 'active' : ''}`}
                        onClick={() => setFilterType('income')}
                    >
                        Ingresos
                    </button>
                </div>
            </div>

            {/* Transactions List */}
            <div className="transactions-list">
                {filteredTransactions.length === 0 ? (
                    <div className="empty-state">No se encontraron transacciones.</div>
                ) : (
                    filteredTransactions.map(tx => (
                        <div
                            key={tx.id}
                            className="transaction-item"
                            onClick={() => setSelectedTx(tx)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={`tx-icon ${tx.type}`}>
                                {getCategoryIcon(tx.category)}
                            </div>
                            <div className="tx-details">
                                <div className="tx-main">
                                    <span className="tx-category">{tx.category}</span>
                                    <span className={`tx-amount ${tx.type}`}>
                                        {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                                <div className="tx-sub">
                                    <span className="tx-note">{tx.note || 'Sin nota'}</span>
                                    <span className="tx-date">{formatDate(tx.date)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <TransactionDetailModal
                transaction={selectedTx}
                isOpen={!!selectedTx}
                onClose={() => setSelectedTx(null)}
            />

            <style jsx>{`
                .page-title {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: var(--spacing-md);
                }

                .filters-container {
                    margin-bottom: var(--spacing-lg);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .search-bar {
                    position: relative;
                    width: 100%;
                }

                .search-icon {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--color-text-muted);
                }

                .search-input {
                    width: 100%;
                    padding: 10px 10px 10px 36px;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--color-border);
                    background-color: var(--color-surface);
                    font-size: 0.875rem;
                    outline: none;
                }

                .filter-tabs {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding-bottom: 4px;
                }

                .filter-tab {
                    padding: 6px 16px;
                    border-radius: var(--radius-full);
                    border: 1px solid var(--color-border);
                    background-color: var(--color-surface);
                    font-size: 0.875rem;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-tab.active {
                    background-color: var(--color-primary);
                    color: white;
                    border-color: var(--color-primary);
                }

                .transactions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .transaction-item {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    background-color: var(--color-surface);
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--color-border);
                }

                .tx-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 12px;
                    color: white;
                }

                .tx-icon.expense { background-color: var(--color-danger); }
                .tx-icon.income { background-color: var(--color-success); }
                .tx-icon.transfer { background-color: var(--color-primary); }

                .tx-details {
                    flex: 1;
                }

                .tx-main {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }

                .tx-category {
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .tx-amount {
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .tx-amount.expense { color: var(--color-text); }
                .tx-amount.income { color: var(--color-success); }

                .tx-sub {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: var(--color-text-muted);
                }
            `}</style>
        </MobileLayout>
    );
}
