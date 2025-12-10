'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import { Subscription, Category } from '@/types';
import { ArrowLeft, Plus, X, Edit2, Trash2 } from 'lucide-react';
import MobileLayout from '@/components/Layout/MobileLayout';

type ModalMode = 'view' | 'edit' | 'create';

export default function SubscriptionsPage() {
  const router = useRouter();
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription, accounts } = useFinance();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'bills'>('subscriptions');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [formData, setFormData] = useState<Partial<Subscription>>({});

  const filteredSubscriptions = subscriptions.filter(
    sub => sub.subscriptionType === (activeTab === 'subscriptions' ? 'subscription' : 'recurring_bill')
  );

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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Entertainment: '#FF3B30',
      Utilities: '#FF9500',
      Home: '#34C759',
      Transport: '#007AFF',
      Food: '#5856D6',
      Health: '#FF2D55',
      Shopping: '#AF52DE',
    };
    return colors[category] || '#8E8E93';
  };

  const handleOpenCreate = () => {
    setFormData({
      subscriptionType: activeTab === 'subscriptions' ? 'subscription' : 'recurring_bill',
      frequency: 'monthly',
      isActive: true,
      owner: 'shared',
    });
    setModalMode('create');
    setSelectedSubscription(null);
  };

  const handleOpenView = (sub: Subscription) => {
    setSelectedSubscription(sub);
    setFormData(sub);
    setModalMode('view');
  };

  const handleEdit = () => {
    setModalMode('edit');
  };

  const handleSave = () => {
    if (modalMode === 'create') {
      addSubscription(formData as Omit<Subscription, 'id'>);
    } else if (modalMode === 'edit' && selectedSubscription) {
      updateSubscription(selectedSubscription.id, formData);
    }
    handleCloseModal();
  };

  const handleDelete = () => {
    if (selectedSubscription && confirm('¿Estás seguro de eliminar esta suscripción?')) {
      deleteSubscription(selectedSubscription.id);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setSelectedSubscription(null);
    setModalMode('view');
    setFormData({});
  };

  const isModalOpen = modalMode !== 'view' || selectedSubscription !== null;

  return (
    <MobileLayout>
      <div className="subscriptions-page">
        {/* Header */}
        <div className="header">
          <button className="back-btn" onClick={() => router.push('/')}>
            <ArrowLeft size={24} />
          </button>
          <h1>Suscripciones</h1>
          <button className="add-btn" onClick={handleOpenCreate}>
            <Plus size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            Suscripciones
          </button>
          <button
            className={`tab ${activeTab === 'bills' ? 'active' : ''}`}
            onClick={() => setActiveTab('bills')}
          >
            Pagos Recurrentes
          </button>
        </div>

        {/* List */}
        <div className="subscriptions-list">
          {filteredSubscriptions.length === 0 ? (
            <div className="empty-state">
              <p>No tienes {activeTab === 'subscriptions' ? 'suscripciones' : 'pagos recurrentes'} registrados</p>
              <button className="create-first-btn" onClick={handleOpenCreate}>
                <Plus size={20} />
                Crear {activeTab === 'subscriptions' ? 'suscripción' : 'pago recurrente'}
              </button>
            </div>
          ) : (
            filteredSubscriptions.map(sub => (
              <div
                key={sub.id}
                className="subscription-card"
                onClick={() => handleOpenView(sub)}
              >
                <div className="sub-icon" style={{ background: getCategoryColor(sub.category) }}>
                  {sub.name.charAt(0)}
                </div>
                <div className="sub-info">
                  <h3>{sub.name}</h3>
                  <p className="sub-next-payment">Próximo: {formatDate(sub.nextPaymentDate)}</p>
                </div>
                <div className="sub-amount">
                  <span className="amount">{formatCurrency(sub.amount)}</span>
                  <span className="frequency">/{sub.frequency === 'monthly' ? 'mes' : 'año'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail/Edit Modal - Centered */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'create' ? 'Nueva Suscripción' : formData.name || 'Suscripción'}</h2>
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
                        <span className="label">Monto</span>
                        <span className="value">{formatCurrency(formData.amount || 0)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Frecuencia</span>
                        <span className="value">{formData.frequency === 'monthly' ? 'Mensual' : 'Anual'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Próximo pago</span>
                        <span className="value">{formData.nextPaymentDate ? formatDate(formData.nextPaymentDate) : '-'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Categoría</span>
                        <span className="value">{formData.category}</span>
                      </div>
                      {formData.description && (
                        <div className="detail-row">
                          <span className="label">Descripción</span>
                          <span className="value">{formData.description}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                      <button className="edit-btn" onClick={handleEdit}>
                        <Edit2 size={18} />
                        Editar
                      </button>
                      <button className="delete-btn" onClick={handleDelete}>
                        <Trash2 size={18} />
                        Eliminar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Edit/Create Mode */}
                    <div className="form-section">
                      <div className="form-group">
                        <label>Nombre</label>
                        <input
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ej: Netflix"
                        />
                      </div>

                      <div className="form-group">
                        <label>Monto</label>
                        <input
                          type="number"
                          value={formData.amount || ''}
                          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                          placeholder="0"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Frecuencia</label>
                          <select
                            value={formData.frequency || 'monthly'}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                          >
                            <option value="monthly">Mensual</option>
                            <option value="yearly">Anual</option>
                            <option value="weekly">Semanal</option>
                            <option value="quarterly">Trimestral</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Categoría</label>
                          <select
                            value={formData.category || 'Other'}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                          >
                            <option value="Entertainment">Entretenimiento</option>
                            <option value="Utilities">Servicios</option>
                            <option value="Home">Hogar</option>
                            <option value="Transport">Transporte</option>
                            <option value="Food">Comida</option>
                            <option value="Health">Salud</option>
                            <option value="Shopping">Compras</option>
                            <option value="Other">Otro</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Próximo pago</label>
                        <input
                          type="date"
                          value={formData.nextPaymentDate || ''}
                          onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Descripción (opcional)</label>
                        <textarea
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Ej: Plan Premium - 4 pantallas"
                          rows={2}
                        />
                      </div>

                      <div className="form-group">
                        <label>Cuenta de pago</label>
                        <select
                          value={formData.accountId || ''}
                          onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                        >
                          <option value="">Seleccionar cuenta</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Save/Cancel Buttons */}
                    <div className="form-actions">
                      <button className="cancel-btn" onClick={handleCloseModal}>Cancelar</button>
                      <button className="save-btn" onClick={handleSave}>
                        {modalMode === 'create' ? 'Crear' : 'Guardar'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .subscriptions-page {
          padding-top: 20px;
          padding-bottom: 100px;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .back-btn, .add-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-surface, white);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text, #000);
          cursor: pointer;
        }

        h1 {
          font-size: 28px;
          font-weight: 700;
          color: var(--color-text, #000);
          margin: 0;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          background: var(--color-surface, white);
          padding: 4px;
          border-radius: 12px;
        }

        .tab {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: var(--color-text-muted, #8E8E93);
          font-size: 15px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab.active {
          background: #007AFF;
          color: white;
        }

        .subscriptions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .subscription-card {
          background: var(--color-surface, white);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .subscription-card:active {
          transform: scale(0.98);
        }

        .sub-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          font-weight: 700;
        }

        .sub-info {
          flex: 1;
        }

        .sub-info h3 {
          font-size: 17px;
          font-weight: 600;
          color: var(--color-text, #000);
          margin: 0 0 4px 0;
        }

        .sub-next-payment {
          font-size: 13px;
          color: var(--color-text-muted, #8E8E93);
          margin: 0;
        }

        .sub-amount {
          text-align: right;
        }

        .amount {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text, #000);
        }

        .frequency {
          font-size: 12px;
          color: var(--color-text-muted, #8E8E93);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--color-text-muted, #8E8E93);
        }

        .create-first-btn {
          margin-top: 16px;
          padding: 12px 24px;
          background: #007AFF;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        /* Modal Styles - CENTERED */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .modal-content {
          background: var(--color-surface, white);
          border-radius: 24px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          animation: scaleIn 0.2s ease-out;
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
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

        .history-section {
          margin-bottom: 24px;
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

        .action-buttons {
          display: flex;
          gap: 12px;
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
          background: #007AFF;
          color: white;
        }

        .delete-btn {
          background: #FF3B30;
          color: white;
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
          padding: 12px;
          border: 1px solid var(--color-border, #E5E5EA);
          border-radius: 10px;
          font-size: 16px;
          background: var(--color-surface, white);
          color: var(--color-text, #000);
          outline: none;
        }

        input:focus, select:focus, textarea:focus {
          border-color: #007AFF;
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
          background: var(--color-bg, #F2F2F7);
          color: var(--color-text, #000);
        }

        .save-btn {
          background: #007AFF;
          color: white;
        }
      `}</style>
    </MobileLayout>
  );
}
