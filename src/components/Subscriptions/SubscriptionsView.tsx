import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Subscription, Category } from '@/types';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';

type ModalMode = 'view' | 'edit' | 'create';

export default function SubscriptionsView() {
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
        <div className="subscriptions-view">
            <div className="header">
                <h1>{activeTab === 'subscriptions' ? 'Suscripciones' : 'Pagos Recurrentes'}</h1>
                <button className="add-btn" onClick={handleOpenCreate}>
                    <Plus size={24} />
                </button>
            </div>

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
                            <div className="sub-icon" style={{ background: sub.color || getCategoryColor(sub.category) }}>
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
                                    <div className="action-buttons">
                                        <button className="edit-btn" onClick={handleEdit}>
                                            <Edit2 size={18} /> Editar
                                        </button>
                                        <button className="delete-btn" onClick={handleDelete}>
                                            <Trash2 size={18} /> Eliminar
                                        </button>
                                    </div>
                                </>
                            ) : (
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
                                            placeholder="Ej: Plan Premium"
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
                                    <div className="form-group">
                                        <label>Color Personalizado</label>
                                        <div className="color-scroll">
                                            {['#FF9500', '#5856D6', '#007AFF', '#AF52DE', '#FF2D55', '#FFCC00', '#34C759', '#FF3B30', '#8E8E93', '#111111', '#1DB954', '#E50914'].map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    className={`color-btn ${formData.color === c ? 'selected' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => setFormData({ ...formData, color: c })}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button className="cancel-btn" onClick={handleCloseModal}>Cancelar</button>
                                        <button className="save-btn" onClick={handleSave}>
                                            {modalMode === 'create' ? 'Crear' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .subscriptions-view {
          padding-top: 10px;
          padding-bottom: 80px;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .add-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background: #007AFF; border: none;
          display: flex; align-items: center; justify-content: center;
          color: white; cursor: pointer;
        }
        h1 { font-size: 24px; font-weight: 700; margin: 0; }
        .tabs {
          display: flex; gap: 8px; margin-bottom: 20px;
          background: #E5E5EA; padding: 4px; border-radius: 12px;
        }
        .tab {
          flex: 1; padding: 10px; border: none; background: transparent;
          color: #8E8E93; font-size: 15px; font-weight: 600;
          border-radius: 8px; cursor: pointer; transition: all 0.2s;
        }
        .tab.active { background: white; color: #000; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .subscriptions-list { display: flex; flex-direction: column; gap: 12px; }
        .subscription-card {
          background: white; border-radius: 16px; padding: 16px;
          display: flex; align-items: center; gap: 12px; cursor: pointer;
        }
        .sub-icon {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 20px; font-weight: 700;
        }
        .sub-info { flex: 1; }
        .sub-info h3 { font-size: 17px; margin: 0 0 4px 0; }
        .sub-next-payment { font-size: 13px; color: #8E8E93; margin: 0; }
        .sub-amount { text-align: right; }
        .amount { display: block; font-size: 18px; font-weight: 700; }
        .frequency { font-size: 12px; color: #8E8E93; }
        .empty-state { text-align: center; padding: 60px 20px; color: #8E8E93; }
        .create-first-btn {
          margin-top: 16px; padding: 12px 24px; background: #007AFF;
          color: white; border: none; border-radius: 12px;
          font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 20px;
        }
        .modal-content {
          background: white; border-radius: 24px; width: 100%; max-width: 500px;
          max-height: 90vh; overflow-y: auto;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px; border-bottom: 1px solid #E5E5EA;
        }
        .modal-header h2 { font-size: 22px; margin: 0; }
        .close-btn { width: 32px; height: 32px; border-radius: 50%; background: #F2F2F7; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .modal-body { padding: 20px; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #E5E5EA; }
        .detail-row:last-child { border-bottom: none; }
        .label { color: #8E8E93; font-size: 15px; }
        .value { font-weight: 600; font-size: 15px; }
        .action-buttons { display: flex; gap: 12px; margin-top: 20px; }
        .edit-btn, .delete-btn { flex: 1; padding: 12px; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .edit-btn { background: #007AFF; color: white; }
        .delete-btn { background: #FF3B30; color: white; }
        .form-section { display: flex; flex-direction: column; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        label { font-weight: 600; font-size: 14px; }
        input, select, textarea { padding: 12px; border: 1px solid #E5E5EA; border-radius: 10px; font-size: 16px; outline: none; }
        input:focus, select:focus, textarea:focus { border-color: #007AFF; }
        .form-actions { display: flex; gap: 12px; margin-top: 8px; }
        .cancel-btn, .save-btn { flex: 1; padding: 14px; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; }
        .cancel-btn { background: #F2F2F7; }
        .save-btn { background: #007AFF; color: white; }

        .color-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .color-btn { min-width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; }
        .color-btn.selected { border-color: black; transform: scale(1.1); }
      `}</style>
        </div>
    );
}
