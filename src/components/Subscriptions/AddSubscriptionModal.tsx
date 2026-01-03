import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function AddSubscriptionModal({ isOpen, onClose }: Props) {
    const { addSubscription, accounts, categories, showToast } = useFinance();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
    const [nextPaymentDate, setNextPaymentDate] = useState('');
    const [accountId, setAccountId] = useState('');
    const [category, setCategory] = useState('');

    // Filter expense categories
    const expenseCategories = categories.filter(c => c.type === 'expense');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name || !amount || !nextPaymentDate) {
            showToast('Por favor completa todos los campos', 'error');
            return;
        }

        if (!category) {
            showToast('Por favor selecciona una categoría', 'error');
            return;
        }

        try {
            await addSubscription({
                name,
                amount: Number(amount),
                frequency,
                nextPaymentDate,
                category,
                owner: 'user1',
                subscriptionType: 'subscription',
                accountId: accountId || undefined
            });
            showToast('Suscripción creada con éxito', 'success');

            // Reset and close
            setName('');
            setAmount('');
            setNextPaymentDate('');
            setCategory('');
            onClose();
        } catch (error) {
            console.error('Error adding subscription:', error);
            showToast('Error al crear la suscripción', 'error');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Nueva Suscripción</h2>
                    <button onClick={onClose} className="icon-btn"><X size={24} /></button>
                </div>

                <div className="form-content">
                    <div className="form-group">
                        <label>Nombre del Servicio</label>
                        <input
                            type="text"
                            placeholder="Ej. Netflix, Spotify, Gimnasio"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="input-field"
                            autoFocus
                        />
                    </div>

                    <div className="row-group">
                        <div className="form-group">
                            <label>Valor a Pagar</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <div className="form-group">
                            <label>Fecha Primer Pago</label>
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
                            <label>Frecuencia de Cobro</label>
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
                        <div className="form-group">
                            <label>Categoría</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="input-field"
                            >
                                <option value="">Seleccionar...</option>
                                {expenseCategories.map(cat => (
                                    <option key={cat.id || cat.name} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Método de Pago (Opcional)</label>
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
                        <small className="hint">Si eliges una cuenta, el cobro se descontará automáticamente.</small>
                    </div>

                    <button onClick={handleSubmit} className="save-btn">
                        Crear Suscripción
                    </button>
                </div>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 60;
          display: flex; justify-content: center; align-items: flex-end;
        }
        .modal-content {
          background: white; width: 100%; max-width: 500px;
          border-top-left-radius: 24px; border-top-right-radius: 24px;
          padding-bottom: 30px;
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .modal-header {
          padding: 20px; border-bottom: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
        }
        .modal-header h2 { margin: 0; font-size: 1.2rem; }
        .icon-btn { background: none; border: none; cursor: pointer; color: #666; }

        .form-content { padding: 20px; display: flex; flex-direction: column; gap: 15px; }

        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .row-group { display: flex; gap: 15px; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: #666; }
        .input-field {
          padding: 12px; border: 1px solid #ddd; border-radius: 12px;
          font-size: 1rem; outline: none; transition: border-color 0.2s;
        }
        .input-field:focus { border-color: black; }

        .hint { font-size: 0.75rem; color: #888; margin-top: 4px; }

        .save-btn {
            background: black; color: white; border: none; padding: 15px;
            border-radius: 14px; font-weight: 600; font-size: 1rem;
            margin-top: 10px; cursor: pointer;
        }
      `}</style>
        </div>
    );
}
