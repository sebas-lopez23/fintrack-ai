import React, { useState, useEffect } from 'react';
import { Transaction, Category } from '@/types';
import { X, Edit2, Trash2 } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

interface Props {
    transaction: Transaction | null;
    isOpen: boolean;
    onClose: () => void;
}

type ModalMode = 'view' | 'edit';

export default function TransactionDetailModal({ transaction, isOpen, onClose }: Props) {
    const { updateTransaction, deleteTransaction, accounts, categories, addCategory } = useFinance();
    const [mode, setMode] = useState<ModalMode>('view');
    const [formData, setFormData] = useState<Partial<Transaction>>({});

    useEffect(() => {
        if (transaction) {
            setFormData(transaction);
            setMode('view');
        }
    }, [transaction]);

    if (!isOpen || !transaction) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const handleSave = async () => {
        if (transaction && formData) {
            await updateTransaction(transaction.id, formData);
            onClose();
        }
    };

    const handleDelete = async () => {
        if (transaction && confirm('¿Estás seguro de eliminar esta transacción?')) {
            await deleteTransaction(transaction.id);
            onClose();
        }
    };

    const categoryList: Category[] = [
        'Food', 'Transport', 'Home', 'Entertainment', 'Health',
        'Shopping', 'Utilities', 'Salary', 'Investment', 'Education', 'Travel', 'Debt', 'Other'
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{mode === 'edit' ? 'Editar Transacción' : 'Detalle'}</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {mode === 'view' ? (
                        <>
                            {/* View Mode */}
                            <div className="detail-section">
                                <div className="detail-row">
                                    <span className="label">Tipo</span>
                                    <span className={`tag ${formData.type}`}>
                                        {formData.type === 'expense' ? 'Gasto' : formData.type === 'income' ? 'Ingreso' : 'Transferencia'}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Monto</span>
                                    <span className="value">{formatCurrency(Math.abs(formData.amount || 0))}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Categoría</span>
                                    <span className="value">{formData.category}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Fecha</span>
                                    <span className="value">{formatDate(formData.date || '')}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Cuenta</span>
                                    <span className="value">
                                        {accounts.find(acc => acc.id === formData.accountId)?.name || 'N/A'}
                                    </span>
                                </div>
                                {formData.note && (
                                    <div className="detail-row">
                                        <span className="label">Nota</span>
                                        <span className="value note">{formData.note}</span>
                                    </div>
                                )}
                                {formData.accountId && accounts.find(a => a.id === formData.accountId)?.type === 'credit' && (
                                    <div className="detail-row">
                                        <span className="label">Cuotas</span>
                                        <span className="value">
                                            {formData.installments
                                                ? `${formData.installments.current} / ${formData.installments.total}`
                                                : '1 / 1'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="action-buttons">
                                <button className="edit-btn" onClick={() => setMode('edit')}>
                                    <Edit2 size={18} /> Editar
                                </button>
                                <button className="delete-btn" onClick={handleDelete}>
                                    <Trash2 size={18} /> Eliminar
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Edit Mode */}
                            <div className="form-section">
                                <div className="form-group">
                                    <label>Tipo</label>
                                    <select
                                        value={formData.type || 'expense'}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="input-field"
                                    >
                                        <option value="expense">Gasto</option>
                                        <option value="income">Ingreso</option>
                                        {/* Transfer usually handled differently, simplifying */}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Monto</label>
                                    <input
                                        type="number"
                                        value={Math.abs(formData.amount || 0)}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setFormData({
                                                ...formData,
                                                amount: formData.type === 'expense' ? -Math.abs(val) : Math.abs(val)
                                            });
                                        }}
                                        className="input-field"
                                    />
                                </div>

                                <div className="row-group">
                                    <div className="form-group">
                                        <label>Categoría</label>
                                        <select
                                            value={formData.category || 'Other'}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                            className="input-field"
                                        >
                                            {categoryList.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha</label>
                                        <input
                                            type="date"
                                            value={formatDateForInput(formData.date || '')}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="input-field"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Cuenta</label>
                                    <select
                                        value={formData.accountId || ''}
                                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                        className="input-field"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {formData.accountId && accounts.find(a => a.id === formData.accountId)?.type === 'credit' && formData.type === 'expense' && (
                                    <div className="form-group">
                                        <label>Cuotas</label>
                                        <select
                                            value={formData.installments?.total || 1}
                                            onChange={(e) => {
                                                const total = Number(e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    installments: {
                                                        current: formData.installments?.current || 1,
                                                        total: total
                                                    }
                                                });
                                            }}
                                            className="input-field"
                                        >
                                            <option value={1}>1 Cuota</option>
                                            {[2, 3, 4, 5, 6, 9, 12, 18, 24, 36].map(n => (
                                                <option key={n} value={n}>{n} Cuotas</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Nota</label>
                                    <textarea
                                        value={formData.note || ''}
                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                        className="input-field"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button className="cancel-btn" onClick={() => setMode('view')}>Cancelar</button>
                                <button className="save-btn" onClick={handleSave}>Guardar</button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-content {
          background: white; border-radius: 24px; width: 100%; max-width: 500px;
          animation: scaleIn 0.2s ease-out; overflow: hidden;
        }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .modal-header {
          padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;
        }
        .modal-header h2 { margin: 0; font-size: 1.2rem; }
        .close-btn { background: #f2f2f7; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .modal-body { padding: 20px; }

        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; }
        .label { color: #8e8e93; font-size: 0.95rem; }
        .value { font-weight: 600; font-size: 0.95rem; }
        .note { font-weight: 400; color: #666; font-style: italic; }

        .tag { padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
        .tag.expense { background: #fee2e2; color: #ef4444; }
        .tag.income { background: #dcfce7; color: #16a34a; }
        .tag.transfer { background: #dbeafe; color: #2563eb; }

        .action-buttons { display: flex; gap: 12px; margin-top: 20px; }
        .edit-btn, .delete-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
        .edit-btn { background: #007aff; color: white; }
        .delete-btn { background: #ff3b30; color: white; }

        .form-section { display: flex; flex-direction: column; gap: 15px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .row-group { display: flex; gap: 15px; }
        .input-field { padding: 12px; border: 1px solid #ddd; border-radius: 12px; font-size: 1rem; outline: none; }
        .input-field:focus { border-color: #007aff; }
        
        .form-actions { display: flex; gap: 12px; margin-top: 20px; }
        .cancel-btn, .save-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; }
        .cancel-btn { background: #f2f2f7; }
        .save-btn { background: #007aff; color: white; }
      `}</style>
        </div >
    );
}
