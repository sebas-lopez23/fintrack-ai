import React, { useState, useEffect } from 'react';
import { Account, Transaction } from '@/types';
import { X, Save, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

interface Props {
    account: Account | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function AccountDetailModal({ account, isOpen, onClose }: Props) {
    const { transactions, updateAccount, deleteAccount } = useFinance();
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [limit, setLimit] = useState('');
    const [cutoffDay, setCutoffDay] = useState('');
    const [paymentDay, setPaymentDay] = useState('');

    useEffect(() => {
        if (account) {
            setName(account.name);
            setBalance(account.balance.toString());
            setLimit(account.limit?.toString() || '');
            setCutoffDay(account.cutoffDate?.toString() || '');
            setPaymentDay(account.paymentDate?.toString() || '');
        }
    }, [account]);

    if (!isOpen || !account) return null;

    // Filter transactions for this account
    const accountTransactions = transactions
        .filter(t => t.accountId === account.id || t.relatedAccountId === account.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleSave = async () => {
        if (!name || !balance) return;

        await updateAccount(account.id, {
            name,
            balance: Number(balance),
            limit: limit ? Number(limit) : undefined,
            cutoffDate: cutoffDay ? Number(cutoffDay) : undefined,
            paymentDate: paymentDay ? Number(paymentDay) : undefined
        });
        onClose();
    };

    const handleDelete = async () => {
        if (confirm('¿Estás seguro de eliminar esta cuenta? Se perderá el historial asociado.')) {
            await deleteAccount(account.id);
            onClose();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Detalles de Cuenta</h2>
                    <button onClick={onClose} className="icon-btn"><X size={24} /></button>
                </div>

                <div className="scroll-content">
                    {/* Edit Form */}
                    <div className="form-section">
                        <div className="form-group">
                            <label>Nombre</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="input-field"
                            />
                        </div>

                        <div className="row-group">
                            <div className="form-group">
                                <label>{account.type === 'credit' ? 'Saldo Actual (Deuda)' : 'Saldo'}</label>
                                <input
                                    type="number"
                                    value={balance}
                                    onChange={e => setBalance(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            {account.type === 'credit' && (
                                <div className="form-group">
                                    <label>Cupo Total</label>
                                    <input
                                        type="number"
                                        value={limit}
                                        onChange={e => setLimit(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                            )}
                        </div>

                        {account.type === 'credit' && (
                            <div className="row-group">
                                <div className="form-group">
                                    <label>Día Corte</label>
                                    <input
                                        type="number"
                                        placeholder="Ej. 15"
                                        value={cutoffDay}
                                        onChange={e => setCutoffDay(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Día Pago</label>
                                    <input
                                        type="number"
                                        placeholder="Ej. 25"
                                        value={paymentDay}
                                        onChange={e => setPaymentDay(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="actions">
                            <button onClick={handleSave} className="save-btn">
                                <Save size={18} /> Guardar Cambios
                            </button>
                            <button onClick={handleDelete} className="delete-btn">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="history-section">
                        <h3>Historial de Movimientos</h3>
                        {accountTransactions.length === 0 ? (
                            <p className="empty-text">No hay movimientos recientes.</p>
                        ) : (
                            <div className="tx-list">
                                {accountTransactions.map(tx => {
                                    const isIncome = tx.type === 'income' || (tx.type === 'transfer' && tx.relatedAccountId === account.id);
                                    // If transfer, check direction
                                    let finalAmount = tx.amount;
                                    let isPositive = false;

                                    if (tx.type === 'income') isPositive = true;
                                    else if (tx.type === 'expense') isPositive = false;
                                    else if (tx.type === 'transfer') {
                                        if (tx.accountId === account.id) isPositive = false; // Outgoing
                                        else isPositive = true; // Incoming
                                    }

                                    return (
                                        <div key={tx.id} className="tx-item">
                                            <div className={`tx-icon ${isPositive ? 'income' : 'expense'}`}>
                                                {isPositive ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                            </div>
                                            <div className="tx-info">
                                                <div className="tx-cat">{tx.category || tx.note || 'Movimiento'}</div>
                                                <div className="tx-date">{new Date(tx.date).toLocaleDateString()}</div>
                                            </div>
                                            <div className={`tx-amount ${isPositive ? 'pos' : 'neg'}`}>
                                                {isPositive ? '+' : '-'}${new Intl.NumberFormat('es-CO').format(finalAmount)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50;
          display: flex; justify-content: center; align-items: flex-end;
        }
        .modal-content {
          background: white; width: 100%; max-width: 500px;
          border-top-left-radius: 24px; border-top-right-radius: 24px;
          max-height: 90vh; display: flex; flex-direction: column;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        
        .modal-header {
          padding: 20px; border-bottom: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
        }
        .modal-header h2 { margin: 0; font-size: 1.2rem; }
        .icon-btn { background: none; border: none; cursor: pointer; color: #666; }

        .scroll-content { overflow-y: auto; padding: 20px; }

        .form-section { display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .row-group { display: flex; gap: 15px; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: #666; }
        .input-field {
          padding: 12px; border: 1px solid #ddd; border-radius: 12px;
          font-size: 1rem; outline: none; transition: border-color 0.2s;
        }
        .input-field:focus { border-color: black; }

        .actions { display: flex; gap: 10px; margin-top: 10px; }
        .save-btn {
          flex: 1; background: black; color: white; border: none;
          padding: 12px; border-radius: 12px; font-weight: 600;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer;
        }
        .delete-btn {
          background: #fee2e2; color: #ef4444; border: none;
          padding: 12px; border-radius: 12px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
        }

        .history-section h3 { margin: 0 0 15px 0; font-size: 1rem; color: #333; }
        .empty-text { text-align: center; color: #999; font-size: 0.9rem; }
        
        .tx-list { display: flex; flex-direction: column; gap: 12px; }
        .tx-item {
          display: flex; align-items: center; padding: 10px;
          background: #f9fafb; border-radius: 12px;
        }
        .tx-icon {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-right: 12px; flex-shrink: 0;
        }
        .tx-icon.income { background: #dcfce7; color: #16a34a; }
        .tx-icon.expense { background: #fee2e2; color: #ef4444; }
        
        .tx-info { flex: 1; }
        .tx-cat { font-size: 0.9rem; font-weight: 500; }
        .tx-date { font-size: 0.75rem; color: #999; }
        
        .tx-amount { font-weight: 600; font-size: 0.9rem; }
        .tx-amount.pos { color: #16a34a; }
        .tx-amount.neg { color: #1f2937; }
      `}</style>
        </div>
    );
}
