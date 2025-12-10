import React, { useState, useEffect } from 'react';
import { Subscription, Transaction } from '@/types';
import { X, Save, Trash2, CalendarCheck, DollarSign, Wallet } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

interface Props {
    subscription: Subscription | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function SubscriptionDetailModal({ subscription, isOpen, onClose }: Props) {
    const { transactions, accounts, updateSubscription, deleteSubscription } = useFinance();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<Subscription['frequency']>('monthly');
    const [nextPaymentDate, setNextPaymentDate] = useState('');
    const [accountId, setAccountId] = useState('');

    useEffect(() => {
        if (subscription) {
            setName(subscription.name);
            setAmount(subscription.amount.toString());
            setFrequency(subscription.frequency || 'monthly');
            setNextPaymentDate(subscription.nextPaymentDate ? subscription.nextPaymentDate.split('T')[0] : '');
            setAccountId(subscription.accountId || '');
        }
    }, [subscription]);

    if (!isOpen || !subscription) return null;

    // Calculate "Paid Months" heuristic
    const paidHistory = transactions.filter(t => {
        const noteMatch = t.note?.toLowerCase().includes(subscription.name.toLowerCase());
        const amountMatch = Math.abs(t.amount) === subscription.amount;
        return noteMatch || (t.category === subscription.category && amountMatch);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const paidCount = paidHistory.length;

    const handleSave = async () => {
        if (!name || !amount || !nextPaymentDate) return;

        await updateSubscription(subscription.id, {
            name,
            amount: Number(amount),
            nextPaymentDate,
            frequency,
            accountId: accountId || undefined
        });
        onClose();
    };

    const handleDelete = async () => {
        if (confirm('¿Cancelar esta suscripción?')) {
            await deleteSubscription(subscription.id);
            onClose();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Detalle Suscripción</h2>
                    <button onClick={onClose} className="icon-btn"><X size={24} /></button>
                </div>

                <div className="scroll-content">
                    {/* Header Card */}
                    <div className="sub-card-header">
                        <div className="sub-icon-large">
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="sub-stats">
                            <div className="stat-value">{paidCount}</div>
                            <div className="stat-label">Pagos Registrados</div>
                        </div>
                    </div>

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
                                <label>Monto</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha de Inicio / Corte</label>
                                <input
                                    type="date"
                                    value={nextPaymentDate}
                                    onChange={e => setNextPaymentDate(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="row-group">
                            <div className="form-group">
                                <label>Frecuencia</label>
                                <select
                                    value={frequency}
                                    onChange={e => setFrequency(e.target.value as any)}
                                    className="input-field"
                                >
                                    <option value="monthly">Mensual</option>
                                    <option value="yearly">Anual</option>
                                    <option value="weekly">Semanal</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Método de Pago</label>
                            <select
                                value={accountId}
                                onChange={e => setAccountId(e.target.value)}
                                className="input-field"
                            >
                                <option value="">-- Sin asignar --</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.type === 'credit' ? 'TC' : 'Cuenta'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="actions">
                            <button onClick={handleSave} className="save-btn">
                                <Save size={18} /> Guardar
                            </button>
                            <button onClick={handleDelete} className="delete-btn">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Paid History List */}
                    <div className="history-section">
                        <h3>Historial Detectado</h3>
                        {paidHistory.length === 0 ? (
                            <p className="empty-text">No se han detectado pagos automáticos para esta suscripción en tus transacciones.</p>
                        ) : (
                            <div className="tx-list">
                                {paidHistory.map(tx => (
                                    <div key={tx.id} className="tx-item">
                                        <div className="tx-date">{new Date(tx.date).toLocaleDateString()}</div>
                                        <div className="tx-note">{tx.note || tx.category}</div>
                                        <div className="tx-amount">-${tx.amount}</div>
                                    </div>
                                ))}
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
        .modal-header {
          padding: 20px; border-bottom: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
        }
        .modal-header h2 { margin: 0; font-size: 1.2rem; }
        .icon-btn { background: none; border: none; cursor: pointer; color: #666; }
        .scroll-content { overflow-y: auto; padding: 20px; }

        .sub-card-header {
            display: flex; align-items: center; justify-content: space-between;
            background: #f8f9fa; padding: 20px; border-radius: 16px; margin-bottom: 24px;
        }
        .sub-icon-large {
            width: 60px; height: 60px; background: black; color: white;
            border-radius: 50%; font-size: 1.5rem; font-weight: bold;
            display: flex; align-items: center; justify-content: center;
        }
        .sub-stats { text-align: right; }
        .stat-value { font-size: 2rem; font-weight: 800; line-height: 1; }
        .stat-label { font-size: 0.8rem; color: #666; }

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
        .empty-text { text-align: center; color: #999; font-size: 0.9rem; font-style: italic; }
        .tx-list { display: flex; flex-direction: column; gap: 10px; }
        .tx-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px; border-bottom: 1px solid #eee;
        }
        .tx-date { font-size: 0.8rem; color: #666; width: 80px; }
        .tx-note { flex: 1; font-size: 0.9rem; color: #333; }
        .tx-amount { font-weight: 600; font-size: 0.9rem; }
      `}</style>
        </div>
    );
}
