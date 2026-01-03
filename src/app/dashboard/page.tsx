'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { useOnboarding } from '@/context/OnboardingContext';
import UpcomingPayments from '@/components/Dashboard/UpcomingPayments';
import FinancialChart from '@/components/Dashboard/FinancialChart';
import RecentTransactions from '@/components/Dashboard/RecentTransactions';
import YearlyFinancialChart from '@/components/Dashboard/YearlyFinancialChart';
import AIChat from '@/components/AIChat';
// ImportStatementModal handled in MobileLayout now
import { Eye, EyeOff, X, Edit2, Trash2, Sparkles } from 'lucide-react';
import MobileLayout from '@/components/Layout/MobileLayout';
import { Subscription, Transaction, Category } from '@/types';

type ModalType = 'subscription' | 'transaction' | null;
type ModalMode = 'view' | 'edit';

export default function DashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    accounts,
    transactions,
    getNetWorth,
    getPartialBalance, // Restored
    getMonthlySpend,
    getBudgetProgress,
    categories,
    addCategory, // Restored
    updateTransaction, // Restored
    deleteTransaction, // Restored
    pendingInvites,
    userId,
    isLoading,
    userProfile
  } = useFinance();

  const { isActive: isOnboardingActive, isLoading: isOnboardingLoading, currentStep } = useOnboarding();

  const [greeting, setGreeting] = useState('');
  const [showPartial, setShowPartial] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Modal handled globally in MobileLayout via event

  // Auth Guard
  useEffect(() => {
    if (!isLoading && !userId && !currentUser) {
      router.push('/login');
    }
  }, [isLoading, userId, currentUser, router]);

  // Onboarding Guard
  useEffect(() => {
    // If we know onboarding is active, redirect to setup
    // EXCEPTION: If the current step is 'tour', we want them ON the dashboard
    if (!isOnboardingLoading && isOnboardingActive && currentStep !== 'tour' && currentStep !== 'complete') {
      router.push('/setup');
    }
  }, [isOnboardingActive, isOnboardingLoading, currentStep, router]);

  // Modal states
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionFormData, setTransactionFormData] = useState<Partial<Transaction>>({});

  const currentBalance = showPartial ? getPartialBalance() : getNetWorth();

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 18) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleSubscriptionClick = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setModalType('subscription');
    setModalMode('view');
  };

  const handleTransactionClick = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setTransactionFormData(tx);
    setModalType('transaction');
    setModalMode('view');
  };

  const handleEditTransaction = () => {
    setModalMode('edit');
  };

  const handleSaveTransaction = () => {
    if (selectedTransaction) {
      updateTransaction(selectedTransaction.id, transactionFormData);
      handleCloseModal();
    }
  };

  const handleDeleteTransaction = () => {
    if (selectedTransaction && confirm('¿Estás seguro de eliminar esta transacción?')) {
      deleteTransaction(selectedTransaction.id);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setModalType(null);
    setModalMode('view');
    setSelectedSubscription(null);
    setSelectedTransaction(null);
    setTransactionFormData({});
  };

  if (isLoading || isOnboardingLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f7' }}>
        <div className="spinner"></div>
        <style jsx>{`
             .spinner {
               width: 40px; height: 40px; border: 4px solid rgba(0,0,0,0.1);
               border-left-color: #007aff; border-radius: 50%;
               animation: spin 1s linear infinite;
             }
             @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
           `}</style>
      </div>
    );
  }

  return (
    <MobileLayout>
      <div className="dashboard-container">
        {/* Header Greeting */}
        <div className="header-greeting">
          <h1>{greeting},</h1>
          <h2>{userProfile?.full_name?.split(' ')[0] || (currentUser === 'user1' ? 'Sebas' : currentUser === 'user2' ? 'Amor' : (typeof currentUser === 'string' ? currentUser.split('@')[0] : 'Usuario'))}!</h2>
        </div>


        {/* FAMILY INVITATION ALERT */}
        {pendingInvites.length > 0 && (
          <div className="invite-alert" onClick={() => router.push('/family')}>
            <div className="alert-content">
              <span className="icon">🔔</span>
              <div className="text">
                <strong>Tienes una invitación familiar</strong>
                <p>Toca para ver y aceptar</p>
              </div>
            </div>
            <div className="arrow">→</div>
          </div>
        )}

        {/* Main Balance Card */}
        <div className="balance-card" id="balance-card">
          <div className="balance-info">
            <span className="balance-label">
              {isBalanceVisible ? (showPartial ? 'Balance Disponible (Parcial)' : 'Balance Real (Neto)') : 'Balance Total'}
            </span>
            <span className="balance-amount">
              {isBalanceVisible ? formatCurrency(currentBalance) : '••••••••'}
            </span>
          </div>
          <div className="balance-actions">
            <button
              className="toggle-type-btn"
              onClick={() => setShowPartial(!showPartial)}
            >
              {showPartial ? 'Ver Real' : 'Ver Parcial'}
            </button>
            <button
              className="toggle-btn"
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
            >
              {isBalanceVisible ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>
          </div>
        </div>

        {/* Upcoming Payments Section */}
        <div className="section-header">
          <h3>Próximos Pagos</h3>
          <button className="see-all" onClick={() => router.push('/subscriptions')}>Ver todo</button>
        </div>
        <UpcomingPayments onSubscriptionClick={handleSubscriptionClick} />

        {/* Financial Chart */}
        <div id="chart-section">
          <FinancialChart />
        </div>

        {/* Recent Transactions */}
        <div className="transactions-section" id="transactions-list">
          <div className="section-header">
            <h3>Transacciones Recientes</h3>
            <button className="see-all" onClick={() => router.push('/transactions')}>Ver todo</button>
          </div>
          <RecentTransactions
            onTransactionClick={handleTransactionClick}
            onImport={() => window.dispatchEvent(new CustomEvent('open-import-modal'))}
          />
        </div>

        {/* Yearly Financial Chart */}
        <YearlyFinancialChart />

        {/* Subscription Detail Modal */}
        {selectedSubscription && (
          <div className="modal-overlay" onClick={() => setSelectedSubscription(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedSubscription.name}</h2>
                <button className="close-btn" onClick={() => setSelectedSubscription(null)}>
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                <div className="detail-section">
                  <div className="detail-row">
                    <span className="label">Monto</span>
                    <span className="value">{formatCurrency(selectedSubscription.amount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Frecuencia</span>
                    <span className="value">{selectedSubscription.frequency === 'monthly' ? 'Mensual' : 'Anual'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Próximo pago</span>
                    <span className="value">{formatDate(selectedSubscription.nextPaymentDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Categoría</span>
                    <span className="value">{selectedSubscription.category}</span>
                  </div>
                  {selectedSubscription.description && (
                    <div className="detail-row">
                      <span className="label">Descripción</span>
                      <span className="value">{selectedSubscription.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Detail/Edit Modal */}
        {modalType === 'transaction' && selectedTransaction && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'edit' ? 'Editar Transacción' : 'Detalle de Transacción'}</h2>
                <button className="close-btn" onClick={handleCloseModal}>
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                {modalMode === 'view' ? (
                  <>
                    {/* View Mode */}
                    <div className="detail-section">
                      <div className="detail-row">
                        <span className="label">Tipo</span>
                        <span className="value">{transactionFormData.type === 'expense' ? 'Gasto' : 'Ingreso'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Monto</span>
                        <span className="value">{formatCurrency(Math.abs(transactionFormData.amount || 0))}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Categoría</span>
                        <span className="value">{transactionFormData.category}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Fecha</span>
                        <span className="value">{formatDate(transactionFormData.date || '')}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Cuenta</span>
                        <span className="value">
                          {accounts.find(acc => acc.id === transactionFormData.accountId)?.name || 'N/A'}
                        </span>
                      </div>
                      {transactionFormData.note && (
                        <div className="detail-row">
                          <span className="label">Nota</span>
                          <span className="value">{transactionFormData.note}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={handleEditTransaction}>
                        <Edit2 size={18} />
                        Editar
                      </button>
                      <button className="delete-btn" onClick={handleDeleteTransaction}>
                        <Trash2 size={18} />
                        Eliminar
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
                          value={transactionFormData.type || 'expense'}
                          onChange={(e) => setTransactionFormData({ ...transactionFormData, type: e.target.value as any })}
                        >
                          <option value="expense">Gasto</option>
                          <option value="income">Ingreso</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Monto</label>
                        <input
                          type="number"
                          value={Math.abs(transactionFormData.amount || 0)}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setTransactionFormData({
                              ...transactionFormData,
                              amount: transactionFormData.type === 'expense' ? -Math.abs(value) : Math.abs(value)
                            });
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Categoría</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select
                              value={transactionFormData.category || 'Other'}
                              onChange={(e) => {
                                if (e.target.value === 'NEW_CATEGORY') {
                                  const name = prompt('Nombre de la nueva categoría:');
                                  if (name) {
                                    // Add category immediately
                                    addCategory({
                                      name,
                                      type: (transactionFormData.type === 'expense' || transactionFormData.type === 'income') ? transactionFormData.type : 'expense',
                                      color: '#8E8E93', // Default gray
                                      icon: 'Tag'
                                    });
                                    // Select it
                                    setTransactionFormData({ ...transactionFormData, category: name as any });
                                  }
                                } else {
                                  setTransactionFormData({ ...transactionFormData, category: e.target.value as Category });
                                }
                              }}
                              style={{ flex: 1 }}
                            >
                              {categories.map(cat => (
                                <option key={cat.name} value={cat.name}>{cat.name}</option>
                              ))}
                              <option value="NEW_CATEGORY">+ Nueva Categoría...</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Fecha</label>
                          <input
                            type="date"
                            value={formatDateForInput(transactionFormData.date || new Date().toISOString())}
                            onChange={(e) => setTransactionFormData({ ...transactionFormData, date: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Cuenta</label>
                        <select
                          value={transactionFormData.accountId || ''}
                          onChange={(e) => setTransactionFormData({ ...transactionFormData, accountId: e.target.value })}
                        >
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Nota (opcional)</label>
                        <textarea
                          value={transactionFormData.note || ''}
                          onChange={(e) => setTransactionFormData({ ...transactionFormData, note: e.target.value })}
                          placeholder="Ej: Almuerzo en restaurante"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Save/Cancel Buttons */}
                    <div className="form-actions">
                      <button className="cancel-btn" onClick={() => setModalMode('view')}>Cancelar</button>
                      <button className="save-btn" onClick={handleSaveTransaction}>Guardar</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Chat Floating Button */}
        <button id="ai-chat-btn" className="ai-chat-btn" onClick={() => setIsChatOpen(true)}>
          <Sparkles size={24} />
        </button>

        {/* AI Chat Modal */}
        <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />



        <style jsx>{`
          .dashboard-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
            padding-top: 10px; /* Espacio extra debajo del TopBar */
          }

          .header-greeting {
            margin-bottom: 8px;
            padding: 0 4px;
          }

          h1 {
            font-size: 28px;
            font-weight: 400;
            color: var(--color-text-muted, #8E8E93);
            margin: 0;
          }

          h2 {
            font-size: 34px;
            font-weight: 700;
            color: var(--color-text-main);
            margin: 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .balance-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.6);
            border-radius: 32px;
            padding: 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 20px 50px -10px rgba(99, 102, 241, 0.25);
            color: var(--color-text-main);
            position: relative;
            overflow: hidden;
          }
          
          .balance-card::before {
             content: '';
             position: absolute;
             top: 0; left: 0; right: 0; bottom: 0;
             background: linear-gradient(45deg, transparent, rgba(255,255,255,0.4), transparent);
             transform: translateX(-100%);
             transition: 0.5s;
          }

          .balance-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .balance-label {
            font-size: 15px;
            font-weight: 500;
            opacity: 0.7;
          }

          .balance-amount {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }

          .toggle-btn {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1C1C1E;
            cursor: pointer;
            backdrop-filter: blur(4px);
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding: 0 4px;
          }

          h3 {
            font-size: 18px;
            font-weight: 600;
            color: var(--color-text, #000);
            margin: 0;
          }

          .see-all {
            background: none;
            border: none;
            color: var(--color-primary);
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          .see-all:hover { opacity: 0.8; }

          .transactions-section {
            margin-top: 8px;
          }

          /* Modal Styles - CENTERED */
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.3); /* Darker, blurrier overlay */
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            padding: 20px;
          }

          .modal-content {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid white;
            border-radius: 32px;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          }

          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid var(--color-border, #E5E5EA);
          }

          .modal-header h2 {
            font-size: 22px;
            font-weight: 700;
            color: var(--color-text, #000);
            margin: 0;
          }

          .close-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--color-bg, #F2F2F7);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-text, #000);
            cursor: pointer;
          }

          .modal-body {
            padding: 20px;
          }

          .detail-section {
            margin-bottom: 24px;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid var(--color-border, #E5E5EA);
          }

          .detail-row:last-child {
            border-bottom: none;
          }

          .label {
            font-size: 15px;
            color: var(--color-text-muted, #8E8E93);
          }

          .value {
            font-size: 15px;
            font-weight: 600;
            color: var(--color-text, #000);
          }

          .history-section h3 {
            font-size: 18px;
            font-weight: 600;
            color: var(--color-text, #000);
            margin: 0 0 16px 0;
          }

          .history-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: var(--color-bg, #F2F2F7);
            border-radius: 12px;
            margin-bottom: 8px;
          }

          .history-date {
            font-size: 14px;
            color: var(--color-text-muted, #8E8E93);
          }

          .history-amount {
            font-size: 15px;
            font-weight: 600;
            color: var(--color-text, #000);
          }

          .history-status {
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 6px;
            font-weight: 600;
          }

          .history-status.paid {
            background: #34C759;
            color: white;
          }

          .history-status.pending {
            background: #FF9500;
            color: white;
          }

          .history-status.failed {
            background: #FF3B30;
            color: white;
          }

          /* Action Buttons */
          .action-buttons {
            display: flex;
            gap: 12px;
            margin-top: 16px;
          }

          .edit-btn, .delete-btn {
            flex: 1;
            padding: 12px;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .edit-btn {
            background: var(--color-primary);
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }

          .delete-btn {
            background: rgba(239, 68, 68, 0.1); /* Soft red bg */
            color: var(--color-danger);
            border: 1px solid var(--color-danger);
          }

          /* Form Styles */
          .form-section {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
                
          .quick-access-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;
          }
          
          .invite-alert {
            background: #FFF8E1; border: 1px solid #FFC107; border-radius: 16px;
            padding: 12px 16px; margin-bottom: 20px; cursor: pointer;
            display: flex; align-items: center; justify-content: space-between;
          }
          .alert-content { display: flex; align-items: center; gap: 12px; }
          .alert-content .icon { font-size: 20px; }
          .alert-content .text strong { display: block; font-size: 14px; color: #5D4037; }
          .alert-content .text p { margin: 0; font-size: 12px; color: #795548; }
          .invite-alert .arrow { color: #FFC107; font-weight: bold; }       
          
          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          label {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text, #000);
          }

          input, select, textarea {
            padding: 14px;
            border: 2px solid transparent;
            border-radius: 16px;
            font-size: 16px;
            background: rgba(241, 245, 249, 0.5);
            color: var(--color-text-main);
            outline: none;
            transition: all 0.2s;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
          }

          input:focus, select:focus, textarea:focus {
            background: white;
            border-color: var(--color-primary-light);
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
          }

          textarea {
            resize: vertical;
            font-family: inherit;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            margin-top: 8px;
          }

          .cancel-btn, .save-btn {
            flex: 1;
            padding: 14px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            border: none;
            cursor: pointer;
          }

          .cancel-btn {
            background: rgba(0,0,0,0.05);
            color: var(--color-text-secondary);
          }

          .save-btn {
            background: var(--color-primary);
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          }

          /* AI Chat Button */
          .ai-chat-btn {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
            z-index: 50;
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .ai-chat-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
          }

          .ai-chat-btn:active {
            transform: scale(0.95);
          }
        `}</style>
      </div>
    </MobileLayout>
  );
}
