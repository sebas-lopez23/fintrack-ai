import React, { useState } from 'react';
import { X, Save, Wallet, CreditCard, Landmark, Banknote, Coins, DollarSign, PiggyBank, Briefcase, Smartphone, Building2, Receipt } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Account } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    defaultType?: 'bank' | 'credit';
}

export default function AddAccountModal({ isOpen, onClose, defaultType = 'bank' }: Props) {
    const { addAccount, showToast } = useFinance();
    const [name, setName] = useState('');
    const [balance, setBalance] = useState('');
    const [type, setType] = useState<'bank' | 'cash' | 'credit'>(defaultType === 'credit' ? 'credit' : 'bank');

    // Credit Card fields
    const [limit, setLimit] = useState('');
    const [cutoffDay, setCutoffDay] = useState('');
    const [paymentDay, setPaymentDay] = useState('');
    const [hasCard, setHasCard] = useState(false);
    const [last4Digits, setLast4Digits] = useState('');
    const [icon, setIcon] = useState('🏦');
    const [color, setColor] = useState('#111111');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name) {
            showToast('Por favor ingresa un nombre para la cuenta', 'error');
            return;
        }

        const newAccount: any = {
            id: crypto.randomUUID(),
            name,
            type,
            balance: Number(balance) || 0,
            currency: 'COP',
            owner: 'user1',
            icon,
            color,
            last4Digits,
            hasCard: type === 'credit' ? true : hasCard
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

        try {
            await addAccount(newAccount);
            showToast('Cuenta creada con éxito', 'success');

            // Reset and close
            setName('');
            setBalance('');
            setLimit('');
            onClose();
        } catch (error) {
            console.error('Error adding account:', error);
            showToast('Error al crear la cuenta', 'error');
        }
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

                    <div className="form-group">
                        <label>Color</label>
                        <div className="color-scroll">
                            {['#FF9500', '#5856D6', '#007AFF', '#0070ba', '#AF52DE', '#FF2D55', '#FFCC00', '#34C759', '#14b8a6', '#FF3B30', '#64748b', '#8E8E93', '#111111'].map(c => (
                                <button
                                    key={c}
                                    className={`color-btn ${color === c ? 'selected' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Icono</label>
                        <div className="icon-grid">
                            {[
                                { name: 'Landmark', Component: Landmark },
                                { name: 'Wallet', Component: Wallet },
                                { name: 'CreditCard', Component: CreditCard },
                                { name: 'Banknote', Component: Banknote },
                                { name: 'Coins', Component: Coins },
                                { name: 'DollarSign', Component: DollarSign },
                                { name: 'PiggyBank', Component: PiggyBank },
                                { name: 'Briefcase', Component: Briefcase },
                                { name: 'Smartphone', Component: Smartphone },
                                { name: 'Building2', Component: Building2 },
                                { name: 'Receipt', Component: Receipt }
                            ].map(({ name, Component }) => (
                                <button
                                    key={name}
                                    className={`icon-btn-select ${icon === name ? 'selected' : ''}`}
                                    onClick={() => setIcon(name)}
                                    title={name}
                                >
                                    <Component size={24} />
                                </button>
                            ))}
                        </div>
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
                            <div className="form-group" style={{ marginTop: '10px' }}>
                                <label>Últimos 4 dígitos</label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    placeholder="Ej. 1234"
                                    value={last4Digits}
                                    onChange={e => setLast4Digits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="input-field"
                                />
                            </div>
                        </>
                    )}

                    {type !== 'credit' && (
                        <div className="card-option-section">
                            <div className="checkbox-row" onClick={() => setHasCard(!hasCard)}>
                                <div className={`custom-checkbox ${hasCard ? 'checked' : ''}`}>
                                    {hasCard && <span className="checkmark">✓</span>}
                                </div>
                                <span className="checkbox-label">¿Tiene tarjeta asociada?</span>
                            </div>

                            {hasCard && (
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label>Últimos 4 dígitos</label>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        placeholder="Ej. 4293"
                                        value={last4Digits}
                                        onChange={e => setLast4Digits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="input-field"
                                    />
                                </div>
                            )}
                        </div>
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

        .color-scroll {
            display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;
        }
        .color-btn {
            min-width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer;
        }
        .color-btn.selected {
            border-color: black; transform: scale(1.1);
        }

        .card-option-section { 
            padding: 15px; background: #f8f9fa; border-radius: 16px; margin-top: 5px;
        }
        .checkbox-row { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .custom-checkbox {
            width: 24px; height: 24px; border: 2px solid #ddd; border-radius: 6px;
            display: flex; align-items: center; justify-content: center; background: white;
            transition: all 0.2s;
        }
        .custom-checkbox.checked { background: black; border-color: black; color: white; }
        .checkmark { font-size: 14px; font-weight: bold; }
        .checkbox-label { font-weight: 500; font-size: 0.9rem; color: #333; }
        
        .icon-grid {
            display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;
        }
        .icon-btn-select {
            background: #f3f4f6; border: 1px solid transparent; border-radius: 8px;
            font-size: 1.2rem; padding: 6px; cursor: pointer;
        }
        .icon-btn-select.selected {
            background: #e5e7eb; border-color: black; transform: scale(1.1);
        }
        .center-text { text-align: center; }
      `}</style>
        </div>
    );
}
