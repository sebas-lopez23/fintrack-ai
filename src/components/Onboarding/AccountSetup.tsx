'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, Building, Plus, X, HelpCircle, Check, DollarSign, Smartphone } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { Account } from '@/types';

type AccountType = 'bank' | 'cash' | 'credit';

interface PresetAccount {
  id: string;
  name: string;
  type: AccountType;
  icon: string;
  color: string;
  description: string;
}

const PRESET_ACCOUNTS: PresetAccount[] = [
  {
    id: 'preset_bank_main',
    name: 'Cuenta Principal',
    type: 'bank',
    icon: 'bank',
    color: '#6366f1', // Indigo
    description: 'Tu cuenta bancaria principal para ingresos y gastos.'
  },
  {
    id: 'preset_cash',
    name: 'Efectivo',
    type: 'cash',
    icon: 'cash',
    color: '#10b981', // Emerald
    description: 'Dinero físico en tu billetera. ¡Es importante rastrearlo!'
  },
  {
    id: 'preset_savings',
    name: 'Ahorros / Nequi',
    type: 'bank',
    icon: 'smartphone',
    color: '#8b5cf6', // Violet
    description: 'Billetera digital o cuenta de ahorros secundaria.'
  }
];

export default function AccountSetup() {
  const { addAccount } = useFinance();
  const { completeStep, nextStep, skipStep } = useOnboarding();

  // State
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set(PRESET_ACCOUNTS.map(a => a.id)));
  const [customAccounts, setCustomAccounts] = useState<Account[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for custom account
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as AccountType,
    balance: '',
    limit: '',
    color: '#f59e0b'
  });

  const togglePreset = (id: string) => {
    setSelectedPresets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleAddCustom = () => {
    if (!formData.name) return;

    const newAccount: Account = {
      id: crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      balance: Number(formData.balance) || 0,
      currency: 'COP',
      owner: 'user1', // dynamic in real app, but context handles this eventually
      limit: formData.type === 'credit' ? Number(formData.limit) : undefined,
      color: formData.color,
      icon: formData.type === 'credit' ? 'card' : formData.type === 'cash' ? 'cash' : 'bank'
    };

    setCustomAccounts(prev => [...prev, newAccount]);
    setFormData({ name: '', type: 'bank', balance: '', limit: '', color: '#f59e0b' });
    setIsFormOpen(false);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // 1. Create Account objects from selected presets
      const presetAccountsToCreate: Account[] = PRESET_ACCOUNTS
        .filter(p => selectedPresets.has(p.id))
        .map(p => ({
          id: crypto.randomUUID(),
          name: p.name,
          type: p.type,
          balance: 0, // Default to 0 for friction-less setup
          currency: 'COP',
          owner: 'user1',
          color: p.color,
          icon: p.icon
        }));

      // 2. Combine with custom accounts
      const allAccounts = [...presetAccountsToCreate, ...customAccounts];

      // 3. Save each
      for (const acc of allAccounts) {
        await addAccount(acc);
      }

      // 4. Complete
      await completeStep('accountsCreated');
      nextStep();
    } catch (error) {
      console.error('Error saving accounts:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeIcon = (iconName: string, type: AccountType) => {
    // Return based on icon name or fallback to type
    if (iconName === 'smartphone') return <Smartphone size={24} />;
    if (type === 'credit') return <CreditCard size={24} />;
    if (type === 'cash') return <Wallet size={24} />;
    return <Building size={24} />;
  };

  const totalSelected = selectedPresets.size + customAccounts.length;

  return (
    <div className="account-container">
      <div className="content-wrapper">
        <div className="header">
          <div className="step-indicator">Paso 2 de 3</div>
          <h1>Configura tus Cuentas</h1>
          <p className="subtitle">
            Selecciona las cuentas que utilizas frecuentemente.
            Comenzarán con saldo $0, podrás ajustarlo después.
          </p>
        </div>

        {/* VISUAL GRID OF ACCOUNTS (Presets + Custom) */}
        <div className="accounts-grid">
          {/* Render Presets */}
          {PRESET_ACCOUNTS.map(preset => {
            const isSelected = selectedPresets.has(preset.id);
            return (
              <div
                key={preset.id}
                className={`account-card ${isSelected ? 'selected' : ''}`}
                onClick={() => togglePreset(preset.id)}
              >
                <div className="card-check">
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </div>
                <div className="card-icon" style={{ backgroundColor: preset.color }}>
                  {getTypeIcon(preset.icon, preset.type)}
                </div>
                <div className="card-info">
                  <h3>{preset.name}</h3>
                  <p>{preset.description}</p>
                </div>
              </div>
            );
          })}

          {/* Render Custom Accounts */}
          {customAccounts.map((acc, index) => (
            <div key={acc.id} className="account-card selected custom">
              <button className="remove-custom" onClick={(e) => {
                e.stopPropagation();
                setCustomAccounts(prev => prev.filter((_, i) => i !== index));
              }}>
                <X size={14} />
              </button>
              <div className="card-check">
                <Check size={14} strokeWidth={3} />
              </div>
              <div className="card-icon" style={{ backgroundColor: acc.color }}>
                {getTypeIcon(acc.icon || 'bank', acc.type as AccountType)}
              </div>
              <div className="card-info">
                <h3>{acc.name}</h3>
                <p>
                  {acc.type === 'credit' ? 'Crédito' : acc.type === 'cash' ? 'Efectivo' : 'Banco'} •
                  ${acc.balance.toLocaleString()}
                </p>
              </div>
            </div>
          ))}

          {/* Add Button */}
          {!isFormOpen && (
            <button className="add-card-btn" onClick={() => setIsFormOpen(true)}>
              <div className="add-icon">
                <Plus size={24} />
              </div>
              <span>Agregar Otra</span>
            </button>
          )}
        </div>

        {/* Custom Account Form */}
        {isFormOpen && (
          <div className="custom-form-overlay">
            <div className="custom-form">
              <h3>Nueva Cuenta</h3>

              <div className="form-group">
                <label>Nombre</label>
                <input
                  autoFocus
                  placeholder="Ej. Davivienda"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <div className="type-toggles">
                  {['bank', 'cash', 'credit'].map(t => (
                    <button
                      key={t}
                      className={`type-toggle ${formData.type === t ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, type: t as AccountType })}
                    >
                      {t === 'bank' ? 'Banco' : t === 'credit' ? 'Crédito' : 'Efectivo'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>{formData.type === 'credit' ? 'Deuda' : 'Saldo'}</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formData.balance}
                  onChange={e => setFormData({ ...formData, balance: e.target.value })}
                />
              </div>

              <div className="form-actions-row">
                <button className="btn-cancel" onClick={() => setIsFormOpen(false)}>Cancelar</button>
                <button className="btn-save" onClick={handleAddCustom}>Agregar</button>
              </div>
            </div>
          </div>
        )}


        {/* Main Actions */}
        <div className="main-actions">
          <button className="skip-link" onClick={skipStep}>
            Omitir paso
          </button>
          <button
            className="continue-btn"
            onClick={handleSaveAll}
            disabled={totalSelected === 0 || isSaving}
          >
            {isSaving ? 'Guardando...' : `Continuar (${totalSelected})`}
          </button>
        </div>
      </div>

      <style jsx>{`
                .account-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                }

                .content-wrapper {
                    width: 100%;
                    max-width: 800px;
                    background: white;
                    border-radius: 24px;
                    padding: 40px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                }

                .header {
                    text-align: center;
                    margin-bottom: 40px;
                }

                .step-indicator {
                    font-size: 12px; color: #6366f1; font-weight: 700;
                    text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
                }

                h1 {
                    font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px;
                }

                .subtitle { font-size: 15px; color: #64748b; }

                /* GRID */
                .accounts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 16px;
                    margin-bottom: 40px;
                }

                .account-card {
                    position: relative;
                    background: #f8fafc;
                    border: 2px solid transparent;
                    border-radius: 20px;
                    padding: 24px 20px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .account-card:hover {
                    background: #f1f5f9;
                    transform: translateY(-2px);
                }

                .account-card.selected {
                    background: #eef2ff;
                    border-color: #6366f1;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
                }

                .card-check {
                    position: absolute;
                    top: 12px; right: 12px;
                    width: 24px; height: 24px;
                    border-radius: 50%;
                    border: 2px solid #e2e8f0;
                    background: white;
                    display: flex; align-items: center; justify-content: center;
                    color: white;
                    transition: all 0.2s;
                }

                .account-card.selected .card-check {
                    background: #6366f1;
                    border-color: #6366f1;
                }

                .card-icon {
                    width: 56px; height: 56px;
                    border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    color: white;
                    margin-bottom: 16px;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
                }

                .card-info h3 {
                    font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px;
                }

                .card-info p {
                    font-size: 13px; color: #64748b; line-height: 1.4;
                }

                /* ADD BUTTON */
                .add-card-btn {
                    border: 2px dashed #e2e8f0;
                    border-radius: 20px;
                    background: transparent;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 12px; cursor: pointer; color: #94a3b8;
                    min-height: 180px; transition: all 0.2s;
                }
                .add-card-btn:hover {
                    border-color: #6366f1;
                    color: #6366f1;
                    background: #f8fafc;
                }
                .add-icon {
                    width: 48px; height: 48px; border-radius: 50%;
                    background: #f1f5f9; display: flex; align-items: center; justify-content: center;
                }

                /* CUSTOM FORM OVERLAY (Simple inline for now or modal?) 
                   Let's make it look like a card replacing the button/modal
                */
                .custom-form-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 50;
                    padding: 20px;
                }
                .custom-form {
                    background: white; padding: 24px; border-radius: 24px;
                    width: 100%; max-width: 400px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    animation: slideUp 0.3s;
                }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

                .form-group { margin-bottom: 16px; }
                .form-group label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
                .form-group input {
                    width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 16px;
                }

                .type-toggles { display: flex; gap: 8px; }
                .type-toggle {
                    flex: 1; padding: 8px; border-radius: 10px; border: 1px solid #e2e8f0;
                    background: white; color: #64748b; cursor: pointer;
                }
                .type-toggle.active {
                    background: #eef2ff; color: #6366f1; border-color: #6366f1; font-weight: 600;
                }

                .form-actions-row { display: flex; gap: 12px; margin-top: 24px; }
                .btn-cancel {
                    flex: 1; padding: 12px; background: #f1f5f9; border: none; border-radius: 12px; color: #64748b; font-weight: 600; cursor: pointer;
                }
                .btn-save {
                    flex: 1; padding: 12px; background: #6366f1; border: none; border-radius: 12px; color: white; font-weight: 600; cursor: pointer;
                }


                .remove-custom {
                    position: absolute; top: 8px; left: 8px;
                    width: 24px; height: 24px; border-radius: 50%;
                    background: #fee2e2; color: #ef4444; border: none;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; z-index: 10;
                }
                
                .main-actions {
                    display: flex; flex-direction: column; gap: 12px;
                }

                .continue-btn {
                    width: 100%; padding: 16px;
                    background: linear-gradient(135deg, #6366f1, #4338ca);
                    color: white; border: none; border-radius: 100px;
                    font-size: 16px; font-weight: 700; cursor: pointer;
                    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
                    transition: all 0.2s;
                }
                .continue-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .continue-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
                }

                .skip-link {
                    background: none; border: none; color: #94a3b8; font-weight: 600; cursor: pointer;
                }

                @media (max-width: 640px) {
                    .content-wrapper { padding: 24px; }
                    .accounts-grid { grid-template-columns: 1fr; }
                    .add-card-btn { min-height: 80px; flex-direction: row; }
                }

            `}</style>
    </div>
  );
}
