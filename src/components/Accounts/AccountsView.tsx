'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Account } from '@/types';
import {
    Plus, CreditCard, Wallet, Landmark,
    Banknote, Coins, PiggyBank, Briefcase,
    Smartphone, Building2, Receipt, DollarSign
} from 'lucide-react';
import AccountDetailModal from '@/components/Accounts/AccountDetailModal';
import AddAccountModal from '@/components/Accounts/AddAccountModal';

const ICON_MAP: Record<string, React.ElementType> = {
    'Wallet': Wallet,
    'Landmark': Landmark,
    'CreditCard': CreditCard,
    'Banknote': Banknote,
    'Coins': Coins,
    'PiggyBank': PiggyBank,
    'Briefcase': Briefcase,
    'Smartphone': Smartphone,
    'Building2': Building2,
    'Receipt': Receipt,
    'DollarSign': DollarSign
};

const renderAccountIcon = (iconName: string | undefined, type: string, size = 24) => {
    if (!iconName) {
        if (type === 'cash') return <Banknote size={size} />;
        if (type === 'credit') return <CreditCard size={size} />;
        return <Landmark size={size} />;
    }

    const IconComponent = ICON_MAP[iconName];
    if (IconComponent) return <IconComponent size={size} />;

    return <span style={{ fontSize: `${size}px` }}>{iconName}</span>;
};

export default function AccountsView() {
    const { accounts } = useFinance();

    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [addAccountType, setAddAccountType] = useState<'bank' | 'credit'>('bank');

    // Filter accounts
    const creditCards = accounts.filter(a => a.type === 'credit');
    const debitCards = accounts.filter(a => a.type !== 'credit' && a.hasCard);
    const listAccounts = accounts.filter(a => a.type !== 'credit');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const openAddAccount = (type: 'bank' | 'credit') => {
        setAddAccountType(type);
        setIsAddAccountOpen(true);
    };

    // Helper to render card JSX reuse
    const renderCard = (acc: Account) => (
        <div
            key={acc.id}
            className="modern-card-visual clickable"
            style={{
                backgroundColor: acc.color || '#2563eb',
                backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.6) 100%)'
            }}
            onClick={() => setSelectedAccount(acc)}
        >
            <div className="card-texture"></div>

            <div className="card-top">
                <span className="card-bank-name">{acc.name}</span>
                <div className="card-icon-glass">
                    {renderAccountIcon(acc.icon, acc.type, 20)}
                </div>
            </div>

            <div className="card-middle">
                <div className="card-chip-sim">
                    <div className="chip-line"></div>
                    <div className="chip-line"></div>
                </div>
                {/* Contactless symbol simulation */}
                <div className="contactless-icon">
                    <span>)</span>
                    <span>)</span>
                    <span>)</span>
                </div>
            </div>

            <div className="card-number-mask">
                <span className="dots">••••</span> <span className="dots">••••</span> <span className="dots">••••</span>
                <span className="last-digits">{acc.last4Digits || '••••'}</span>
            </div>

            <div className="card-bottom">
                <div className="card-balance-group">
                    <span className="balance-label">{acc.type === 'credit' ? 'Deuda Total' : 'Saldo Disponible'}</span>
                    <span className="balance-value">{formatCurrency(Math.abs(acc.balance))}</span>
                </div>
                <div className="card-brand">{acc.type === 'credit' ? 'VISA' : 'DEBIT'}</div>
            </div>
        </div>
    );

    return (
        <div className="accounts-view container-glass">
            {/* Credit Cards Section */}
            {creditCards.length > 0 && (
                <section className="section-group">
                    <div className="section-header">
                        <h2 className="modern-title">Tarjetas de Crédito</h2>
                        <button className="add-btn-glass" onClick={() => openAddAccount('credit')}><Plus size={18} /></button>
                    </div>
                    {/* Horizontal Scroll / Grid Wrapper */}
                    <div className="cards-scroll-container">
                        {creditCards.map(acc => renderCard(acc))}
                        {/* Spacer for scroll padding */}
                        <div style={{ minWidth: '10px' }}></div>
                    </div>
                </section>
            )}

            {/* Debit Cards Section */}
            {debitCards.length > 0 && (
                <section className="section-group">
                    <div className="section-header">
                        <h2 className="modern-title">Tarjetas Débito</h2>
                    </div>
                    <div className="cards-scroll-container">
                        {debitCards.map(acc => renderCard(acc))}
                        <div style={{ minWidth: '10px' }}></div>
                    </div>
                </section>
            )}

            {/* Other Accounts List */}
            <section className="section-group">
                <div className="section-header">
                    <h2 className="modern-title">Cuentas y Efectivo</h2>
                    <button id="btn-add-account" className="add-btn-glass" onClick={() => openAddAccount('bank')}><Plus size={18} /></button>
                </div>
                <div className="others-list">
                    {listAccounts.map(acc => (
                        <div
                            key={acc.id}
                            className="glass-panel account-item-modern clickable"
                            onClick={() => setSelectedAccount(acc)}
                        >
                            <div className="acc-icon-box" style={{ background: acc.color ? `${acc.color}15` : '#f3f4f6', color: acc.color || '#333' }}>
                                {renderAccountIcon(acc.icon, acc.type, 24)}
                            </div>
                            <div className="acc-details-modern">
                                <div className="acc-name-modern">{acc.name}</div>
                                <div className="acc-type-label">{acc.type === 'cash' ? 'Efectivo' : 'Cuenta Bancaria'}</div>
                            </div>
                            <div className="acc-balance-modern">{formatCurrency(acc.balance)}</div>
                        </div>
                    ))}
                    {listAccounts.length === 0 && creditCards.length === 0 && (
                        <div className="empty-state-modern">
                            <p>No tienes cuentas registradas.</p>
                            <button className="btn-primary" style={{ marginTop: '10px' }} onClick={() => openAddAccount('bank')}>Agregar Cuenta</button>
                        </div>
                    )}
                </div>
            </section>

            <AccountDetailModal
                account={selectedAccount}
                isOpen={!!selectedAccount}
                onClose={() => setSelectedAccount(null)}
            />

            <AddAccountModal
                isOpen={isAddAccountOpen}
                onClose={() => setIsAddAccountOpen(false)}
                defaultType={addAccountType}
            />

            <style jsx>{`
                .container-glass {
                    padding-bottom: 90px;
                    overflow-x: hidden;
                }
                .section-group { margin-bottom: 35px; }
                
                .section-header { 
                    display: flex; justify-content: space-between; align-items: center; 
                    margin-bottom: 15px; padding: 0 5px;
                }
                .modern-title {
                    font-size: 1.1rem; font-weight: 700; color: #1e293b; letter-spacing: -0.3px;
                }

                .add-btn-glass {
                    width: 32px; height: 32px; border-radius: 10px;
                    background: #f1f5f9; border: none;
                    display: flex; align-items: center; justify-content: center;
                    color: #2563eb; cursor: pointer;
                }

                /* CARDS SCROLL CONTAINER */
                :global(.cards-scroll-container) {
                    display: flex;
                    gap: 15px;
                    overflow-x: auto;
                    padding: 5px 5px 20px 5px;
                    scroll-snap-type: x mandatory;
                    -webkit-overflow-scrolling: touch;
                }
                :global(.cards-scroll-container::-webkit-scrollbar) { display: none; }

                /* MODERN CARD VISUAL */
                :global(.modern-card-visual) {
                    min-width: 300px;
                    max-width: 340px;
                    height: 190px;
                    border-radius: 20px;
                    padding: 20px;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    position: relative;
                    overflow: hidden;
                    scroll-snap-align: center;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
                    flex-shrink: 0;
                    margin-right: 5px;
                }

                :global(.card-texture) {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 60%);
                    pointer-events: none;
                }

                :global(.card-top) { display: flex; justify-content: space-between; align-items: flex-start; z-index: 2; }
                :global(.card-bank-name) { font-weight: 700; font-size: 1rem; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
                :global(.card-icon-glass) { 
                    background: rgba(255,255,255,0.2); padding: 8px; border-radius: 10px; 
                    backdrop-filter: blur(4px);
                }

                :global(.card-middle) { display: flex; justify-content: space-between; align-items: center; z-index: 2; margin-top: 5px; }
                
                :global(.card-chip-sim) {
                    width: 36px; height: 26px; 
                    background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
                    border-radius: 5px; position: relative; overflow: hidden;
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
                }
                :global(.chip-line) { width: 100%; height: 1px; background: rgba(0,0,0,0.2); position: absolute; top: 33%; }
                :global(.chip-line:nth-child(2)) { top: 66%; }

                :global(.contactless-icon) { display: flex; gap: 2px; opacity: 0.7; }
                :global(.contactless-icon span) { font-weight: bold; font-family: sans-serif; }

                :global(.card-number-mask) {
                    font-size: 1.3rem; letter-spacing: 3px; font-family: monospace; 
                    opacity: 0.9; text-shadow: 0 1px 2px rgba(0,0,0,0.4);
                    margin-top: auto; margin-bottom: 15px; z-index: 2;
                }
                :global(.last-digits) { font-weight: bold; }

                :global(.card-bottom) { display: flex; justify-content: space-between; align-items: flex-end; z-index: 2; }
                :global(.card-balance-group) { display: flex; flex-direction: column; }

                :global(.balance-label) { font-size: 0.7rem; opacity: 0.8; text-transform: uppercase; display: block; margin-bottom: 2px; }
                :global(.balance-value) { font-size: 1.3rem; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
                :global(.card-brand) { font-style: italic; font-weight: 900; font-size: 1.2rem; opacity: 0.9; }

                /* LIST Styles */
                .others-list { display: flex; flex-direction: column; gap: 10px; }
                .account-item-modern {
                    display: flex; align-items: center; padding: 16px; 
                    background: white; border-radius: 16px;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.02);
                }
                .acc-icon-box {
                    width: 44px; height: 44px; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    margin-right: 15px;
                }
                .acc-details-modern { flex: 1; }
                .acc-name-modern { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
                .acc-type-label { font-size: 0.75rem; color: #94a3b8; }
                .acc-balance-modern { font-weight: 700; color: #0f172a; font-size: 1rem; }

                .empty-state-modern { text-align: center; padding: 30px; color: #94a3b8; }
            `}</style>
        </div>
    );
}
