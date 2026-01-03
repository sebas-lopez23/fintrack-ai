'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Transaction, Category } from '@/types';
import TransactionDetailModal from '@/components/Transaction/TransactionDetailModal';
import CategoryPieChart from '@/components/Categories/CategoryPieChart';
import TimeRangeSelector, { TimeRangeType } from '@/components/Shared/TimeRangeSelector';
import {
    Filter,
} from 'lucide-react';

export default function TransactionsView() {
    const { transactions, categories, accounts } = useFinance();
    const [searchTerm, setSearchTerm] = useState('');

    // Main View Controls
    const [viewType, setViewType] = useState<'expense' | 'income'>('expense'); // Toggle for Chart/List

    // Time Range State
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date; label: string }>({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        label: ''
    });

    // Advanced Filters
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterAccount, setFilterAccount] = useState<string>('all');
    const [minAmount, setMinAmount] = useState<string>('');
    const [maxAmount, setMaxAmount] = useState<string>('');
    const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // 1. Filter Transactions by Time Range first
    const timeFilteredTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        // Set hours to ignore time part for inclusive comparison
        txDate.setHours(0, 0, 0, 0);
        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);

        return txDate >= start && txDate <= end;
    });

    // 2. Filter available categories based on viewType (Expense/Income)
    const availableCategories = categories.filter(cat => cat.type === viewType);

    // 3. Apply Advanced Filters
    const filteredTransactions = timeFilteredTransactions
        .filter(tx => {
            // Must match current view type (expense/income) unless we want to allow mixing in list? 
            // The prompt implies splitting by Gastos/Ingresos like Categories view did.
            // Let's enforce viewType on the list too for consistency with the chart.
            if (tx.type !== viewType) return false;

            const note = tx.note || '';
            const category = tx.category || '';
            const term = searchTerm.toLowerCase();

            const matchesSearch = note.toLowerCase().includes(term) ||
                category.toLowerCase().includes(term);
            const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
            const matchesAccount = filterAccount === 'all' || tx.accountId === filterAccount;

            // Amount filter
            const min = minAmount ? parseFloat(minAmount) : 0;
            const max = maxAmount ? parseFloat(maxAmount) : Infinity;
            const matchesAmount = tx.amount >= min && tx.amount <= max;

            return matchesSearch && matchesCategory && matchesAccount && matchesAmount;
        })
        .sort((a, b) => {
            const multiplier = sortOrder === 'asc' ? 1 : -1;

            if (sortBy === 'date') {
                return (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier;
            } else {
                return (a.amount - b.amount) * multiplier;
            }
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

    const getCategoryStyles = (categoryName: string) => {
        const cat = categories.find(c => c.name === categoryName);

        const emojis: Record<string, string> = {
            'comida': '🍔',
            'transporte': '🚗',
            'hogar': '🏠',
            'servicios': '⚡',
            'compras': '🛍️',
            'salario': '💰',
            'salud': '🏥',
            'entretenimiento': '🎬',
            'educación': '📚',
            'inversiones': '📈',
            'regalos': '🎁',
            'arriendo': '🏠'
        };

        const key = categoryName.toLowerCase();
        let icon = emojis[key];

        // If not found in map, try DB icon if it's short (emoji), otherwise default
        if (!icon && cat?.icon && cat.icon.length <= 4) {
            icon = cat.icon;
        }

        return {
            icon: icon || '📌',
            color: cat?.color || '#8E8E93'
        };
    };

    const hexToRgba = (hex: string, alpha: number) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
        <div className="transactions-view">
            {/* Expense/Income Toggle */}
            <div className="view-toggle-container">
                <div className="segmented-control">
                    <button
                        className={`segment-btn ${viewType === 'expense' ? 'active' : ''}`}
                        onClick={() => setViewType('expense')}
                    >
                        Gastos
                    </button>
                    <button
                        className={`segment-btn ${viewType === 'income' ? 'active' : ''}`}
                        onClick={() => setViewType('income')}
                    >
                        Ingresos
                    </button>
                </div>
            </div>

            {/* Time Range Selector */}
            <TimeRangeSelector
                onChange={setDateRange}
                initialRange="month"
            />

            {/* Pie Chart */}
            <CategoryPieChart
                transactions={filteredTransactions}
                categories={categories}
                type={viewType}
            />

            {/* Search and Filter Button */}
            <div className="top-bar">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="🔍 Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <button id="btn-filter-transactions" className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
                    <Filter size={20} />
                </button>
            </div>

            {/* Filter Modal */}
            {showFilters && (
                <div className="filter-modal-overlay" onClick={() => setShowFilters(false)}>
                    <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Filtros</h3>
                            <button onClick={() => setShowFilters(false)}>✕</button>
                        </div>

                        <div className="filter-section">
                            <label>Categoría ({viewType === 'expense' ? 'Gastos' : 'Ingresos'})</label>
                            <div className="category-grid">
                                <button
                                    className={`category-btn ${filterCategory === 'all' ? 'active' : ''}`}
                                    onClick={() => setFilterCategory('all')}
                                >
                                    <span className="cat-emoji">📂</span>
                                    Todas
                                </button>
                                {availableCategories.map(cat => {
                                    const { icon } = getCategoryStyles(cat.name);
                                    return (
                                        <button
                                            key={cat.id}
                                            className={`category-btn ${filterCategory === cat.name ? 'active' : ''}`}
                                            onClick={() => setFilterCategory(cat.name)}
                                        >
                                            <span className="cat-emoji">{icon}</span>
                                            {cat.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Account Filter */}
                        <div className="filter-section">
                            <h4>Cuenta</h4>
                            <select
                                value={filterAccount}
                                onChange={(e) => setFilterAccount(e.target.value)}
                                className="account-select"
                            >
                                <option value="all">Todas las cuentas</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.type === 'credit' ? 'TC' : 'Cuenta'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-section">
                            <label>Rango de Monto</label>
                            <div className="amount-row">
                                <input
                                    type="number"
                                    placeholder="Mínimo"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    className="amount-input"
                                />
                                <span>-</span>
                                <input
                                    type="number"
                                    placeholder="Máximo"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className="amount-input"
                                />
                            </div>
                        </div>

                        <div className="filter-section">
                            <label>Ordenar por</label>
                            <div className="sort-options">
                                <button
                                    className={`sort-option ${sortBy === 'date' ? 'active' : ''}`}
                                    onClick={() => {
                                        if (sortBy === 'date') {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        } else {
                                            setSortBy('date');
                                            setSortOrder('desc');
                                        }
                                    }}
                                >
                                    📅 Fecha {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </button>
                                <button
                                    className={`sort-option ${sortBy === 'amount' ? 'active' : ''}`}
                                    onClick={() => {
                                        if (sortBy === 'amount') {
                                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                        } else {
                                            setSortBy('amount');
                                            setSortOrder('desc');
                                        }
                                    }}
                                >
                                    💰 Monto {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </button>
                            </div>
                        </div>

                        <button className="apply-btn" onClick={() => setShowFilters(false)}>
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            )}

            {/* Transactions List */}
            <div className="transactions-list">
                {filteredTransactions.length === 0 ? (
                    <div className="empty-state">No se encontraron transacciones en este periodo.</div>
                ) : (
                    filteredTransactions.map(tx => {
                        const { icon, color } = getCategoryStyles(tx.category);
                        const bgColor = hexToRgba(color, 0.15); // 15% opacity background

                        return (
                            <div
                                key={tx.id}
                                className="transaction-item"
                                onClick={() => setSelectedTx(tx)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div
                                    className="tx-icon"
                                    style={{ backgroundColor: bgColor }}
                                >
                                    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
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
                        );
                    })
                )}
            </div>

            <TransactionDetailModal
                transaction={selectedTx}
                isOpen={!!selectedTx}
                onClose={() => setSelectedTx(null)}
            />

            <style jsx>{`
                .transactions-view {
                    padding-bottom: 80px;
                }
                
                .view-toggle-container {
                    margin-bottom: 20px;
                }

                .segmented-control {
                    display: flex;
                    background: white;
                    padding: 4px;
                    border-radius: 12px;
                    border: 1px solid #e0e0e0;
                }

                .segment-btn {
                    flex: 1;
                    padding: 8px;
                    border: none;
                    background: transparent;
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #8E8E93;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .segment-btn.active {
                    background: white;
                    color: #000;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .top-bar {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .search-bar {
                    flex: 1;
                }

                .search-input {
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 1.5px solid #e0e0e0;
                    background: white;
                    font-size: 0.95rem;
                    outline: none;
                    transition: all 0.2s;
                }

                .search-input:focus {
                    border-color: #007AFF;
                    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
                }

                .filter-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    border: 1.5px solid #e0e0e0;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-btn:hover {
                    background: #f8f8f8;
                    border-color: #007AFF;
                }

                /* Filter Modal */
                .filter-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    display: flex;
                    align-items: flex-end;
                    animation: fadeIn 0.2s;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .filter-modal {
                    background: white;
                    border-radius: 20px 20px 0 0;
                    padding: 24px;
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s;
                }

                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .modal-header h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                }

                .modal-header button {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 4px 8px;
                    color: #999;
                }

                .filter-section {
                    margin-bottom: 24px;
                }

                .filter-section label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #666;
                    margin-bottom: 12px;
                }

                .category-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }

                .category-btn {
                    padding: 12px 8px;
                    border-radius: 12px;
                    border: 1.5px solid #e0e0e0;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .category-btn:hover {
                    border-color: #007AFF;
                }

                .category-btn.active {
                    background: #007AFF;
                    color: white;
                    border-color: #007AFF;
                }

                .cat-emoji {
                    font-size: 1.5rem;
                }

                .amount-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .amount-row span {
                    color: #999;
                    font-weight: 500;
                }

                .amount-input {
                    flex: 1;
                    padding: 12px;
                    border-radius: 10px;
                    border: 1.5px solid #e0e0e0;
                    background: white;
                    font-size: 0.9rem;
                    outline: none;
                }

                .amount-input:focus {
                    border-color: #007AFF;
                    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
                }

                .sort-options {
                    display: flex;
                    gap: 10px;
                }

                .sort-option {
                   flex: 1;
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 1.5px solid #e0e0e0;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .sort-option:hover {
                    border-color: #007AFF;
                }

                .sort-option.active {
                    background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
                    color: white;
                    border-color: #007AFF;
                }

                .apply-btn {
                    width: 100%;
                    padding: 14px;
                    border-radius: 12px;
                    border: none;
                    background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 8px;
                }

                .apply-btn:active {
                    transform: scale(0.98);
                }

                .account-select {
                    width: 100%; padding: 12px; border: 1px solid #ddd;
                    border-radius: 8px; font-size: 0.9rem;
                    background: white; cursor: pointer;
                }

                .transactions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-top: 20px;
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
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 12px;
                }

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

                /* Updated Colors per user request */
                .tx-amount.expense { color: #FF3B30; }
                .tx-amount.income { color: #34C759; }

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
        </div>
    );
}
