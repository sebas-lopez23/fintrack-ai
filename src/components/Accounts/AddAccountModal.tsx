import React, { useState } from 'react';
import { X, Save, Wallet, CreditCard, Landmark } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Account } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    defaultType?: 'bank' | 'credit';
}

export default function AddAccountModal({ isOpen, onClose, defaultType = 'bank' }: Props) {
    const { addAccount } = useFinance();
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [type, setType] = useState<'bank' | 'cash' | 'credit'>(defaultType === 'credit' ? 'credit' : 'bank');

    // Credit Card fields
    const [limit, setLimit] = useState('');
    const [cutoffDay, setCutoffDay] = useState('');
    const [paymentDay, setPaymentDay] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name) return;

        const newAccount: any = {
            id: crypto.randomUUID(),
            name,
            type,
            balance: Number(balance) || 0,
            currency: 'COP',
            owner: 'user1'
        };

        if (type === 'credit') {
            newAccount.limit = Number(limit);
            newAccount.cutoffDate = Number(cutoffDay);
            newAccount.paymentDate = Number(paymentDay);
            // Credit card checks usually have negative balance representing debt, or 0 if paid off.
            // User inputs positive debt usually, so let's flip it if they put positive number to mean debt
            // Or assume balance is always raw balance. Let's keep it simple: input as is.
            // Usually initial balance of CC is 0 (no debt) or negative (debt).
            // Let's assume user enters debt as positive number, so we flip it.
            if (newAccount.balance > 0) newAccount.balance = -newAccount.balance;
        }

        await addAccount(newAccount);

        // Reset and close
        setName('');
        setBalance('');
        setLimit('');
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Nueva Cuenta / Tarjeta</h2>
                    <button onClick={onClose} className="icon-btn"><X size={24} /></button>
                </div>

                <div className="form-content">
                    <div className="type-selector">
                        <button
                            className={`type-btn ${type !== 'credit' ? 'active' : ''}`}
                            onClick={() => setType('bank')}
                        >
                            <Wallet size={18} /> Cuenta / Efectivo
                        </button>
                        <button
                            className={`type-btn ${type === 'credit' ? 'active' : ''}`}
                            onClick={() => setType('credit')}
                        >
                            <CreditCard size={18} /> Tarjeta Crédito
                        </button>
                    </div>

                    <div className="form-group">
                        <label>Nombre de la Cuenta</label>
                        <input
                            type="text"
                            placeholder="Ej. Nequi, Bancolombia, Visa..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="input-field"
                            autoFocus
                        />
                    </div>

                    <div className="row-group">
                        <div className="form-group">
                            <label>{type === 'credit' ? 'Deuda Inicial' : 'Saldo Actual'}</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={balance}
                                onChange={e => setBalance(e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>

                    {type === 'credit' && (
                        <>
                            <div className="form-group">
                                <label>Cupo Total (Límite)</label>
                                <input
                                    type="number"
                                    placeholder="Ej. 5000000"
                                    value={limit}
                                    onChange={e => setLimit(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div className="row-group">
                                <div className="form-group">
                                    <label>Día de Corte</label>
                                    <input
                                        type="number"
                                        placeholder="Ej. 15"
                                        value={cutoffDay}
                                        onChange={e => setCutoffDay(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Día Límite Pago</label>
                                    <input
                                        type="number"
                                        placeholder="Ej. 25"
                                        value={paymentDay}
                                        onChange={e => setPaymentDay(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button onClick={handleSubmit} className="save-btn">
                        Crear Cuenta
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

        .type-selector {
            display: flex; gap: 10px; margin-bottom: 10px;
        }
        .type-btn {
            flex: 1; padding: 10px; border-radius: 12px; border: 1px solid #eee;
            background: white; display: flex; align-items: center; justify-content: center; gap: 8px;
            font-weight: 500; cursor: pointer; color: #666;
        }
        .type-btn.active {
            background: black; color: white; border-color: black;
        }

        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .row-group { display: flex; gap: 15px; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: #666; }
        .input-field {
          padding: 12px; border: 1px solid #ddd; border-radius: 12px;
          font-size: 1rem; outline: none; transition: border-color 0.2s;
        }
        .input-field:focus { border-color: black; }

        .save-btn {
            background: black; color: white; border: none; padding: 15px;
            border-radius: 14px; font-weight: 600; font-size: 1rem;
            margin-top: 10px; cursor: pointer;
        }
      `}</style>
        </div>
    );
}
