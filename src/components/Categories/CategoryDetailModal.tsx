import React from 'react';
import { Transaction } from '@/types';
import { CategoryItem } from '@/context/FinanceContext'; // Assuming exported, if not we redefine locally
import { X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Props {
    category: CategoryItem | null;
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
}

export default function CategoryDetailModal({ category, isOpen, onClose, transactions }: Props) {
    if (!isOpen || !category) return null;

    // Filter transactions for this category
    const categoryTx = transactions
        .filter(tx => tx.category === category.name)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalAmount = categoryTx.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP', maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-title">
                        <div className="cat-icon-lg" style={{ backgroundColor: `${category.color}30`, color: category.color }}>
                            {/* Emoji support */}
                            {category.icon && category.icon.length < 5 ? category.icon : '🏷️'}
                        </div>
                        <div>
                            <h2>{category.name}</h2>
                            <span className="subtitle">{categoryTx.length} movimientos</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                <div className="modal-body">
                    <div className="summary-card">
                        <span className="summary-label">Total {category.type === 'expense' ? 'Gastado' : 'Ingresado'}</span>
                        <span className="summary-amount">{formatCurrency(totalAmount)}</span>
                    </div>

                    <div className="history-list">
                        <h3>Historial</h3>
                        {categoryTx.length === 0 ? (
                            <div className="empty-state">No hay movimientos en esta categoría.</div>
                        ) : (
                            categoryTx.map(tx => (
                                <div key={tx.id} className="tx-item">
                                    <div className={`tx-icon ${tx.type}`}>
                                        {tx.type === 'expense' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                                    </div>
                                    <div className="tx-info">
                                        <span className="tx-note">{tx.note || 'Sin descripción'}</span>
                                        <span className="tx-date">{formatDate(tx.date)}</span>
                                    </div>
                                    <span className={`tx-amt ${tx.type}`}>
                                        {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100;
            display: flex; align-items: flex-end; justify-content: center;
        }
        @media (min-width: 640px) {
            .modal-overlay { align-items: center; }
        }

        .modal-content {
            background: white; width: 100%; max-width: 500px;
            border-top-left-radius: 24px; border-top-right-radius: 24px;
            max-height: 90vh; overflow-y: auto;
            animation: slideUp 0.3s ease-out;
        }
        @media (min-width: 640px) {
            .modal-content { border-radius: 24px; animation: scaleIn 0.2s ease-out; }
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .modal-header {
            padding: 24px; border-bottom: 1px solid #f2f2f7;
            display: flex; justify-content: space-between; align-items: center;
        }
        .header-title { display: flex; align-items: center; gap: 16px; }
        .cat-icon-lg {
            width: 50px; height: 50px; border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            font-size: 24px;
        }
        .header-title h2 { margin: 0; font-size: 1.2rem; }
        .subtitle { font-size: 0.9rem; color: #8e8e93; }
        .close-btn { background: #f2f2f7; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        .modal-body { padding: 24px; }

        .summary-card {
            background: #f9f9f9; padding: 20px; border-radius: 16px;
            display: flex; flex-direction: column; align-items: center;
            margin-bottom: 24px;
        }
        .summary-label { font-size: 0.9rem; color: #8e8e93; margin-bottom: 4px; }
        .summary-amount { font-size: 2rem; font-weight: 700; color: #000; }

        .history-list h3 { margin: 0 0 16px 0; font-size: 1rem; color: #000; }
        
        .tx-item { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f2f2f7; }
        .tx-item:last-child { border-bottom: none; }
        
        .tx-icon {
            width: 36px; height: 36px; border-radius: 50%; margin-right: 12px;
            display: flex; align-items: center; justify-content: center;
        }
        .tx-icon.expense { background: #fee2e2; color: #ef4444; }
        .tx-icon.income { background: #dcfce7; color: #16a34a; }

        .tx-info { flex: 1; display: flex; flex-direction: column; }
        .tx-note { font-weight: 500; font-size: 0.95rem; }
        .tx-date { font-size: 0.8rem; color: #8e8e93; }

        .tx-amt { font-weight: 600; font-size: 0.95rem; }
        .tx-amt.expense { color: #000; }
        .tx-amt.income { color: #16a34a; }

        .empty-state { text-align: center; color: #8e8e93; padding: 20px; }
      `}</style>
        </div>
    );
}
