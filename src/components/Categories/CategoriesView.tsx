import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { CategoryItem } from '@/types';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import CategoryDetailModal from './CategoryDetailModal';

export default function CategoriesView() {
    const { categories, transactions, addCategory, updateCategory, deleteCategory, showToast } = useFinance();
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
    const [detailCategory, setDetailCategory] = useState<CategoryItem | null>(null);
    const [formData, setFormData] = useState<Partial<CategoryItem>>({
        type: 'expense',
        color: '#8E8E93',
        icon: '🏷️'
    });

    const EMOJIS = [
        // Comida y Bebidas
        '🍔', '🍕', '🍟', '🌭', '🍜', '🍲', '🍝', '🥗',
        '☕', '🍵', '🍺', '🍻', '🍷', '🍸', '🥤',
        // Transporte
        '🚗', '🚕', '🚙', '🚌', '🚎', '🚓', '🚑', '🚒',
        '🚲', '✈️', '🚁', '🚂', '🚆', '🚇', '🚊',
        // Hogar y Tecnología
        '🏠', '🏡', '🏢', '🏪', '🏨', '🏩',
        '💡', '🔌', '💻', '📱', '🖥️',
        // Compras y Dinero
        '🛒', '🛍️', '💳', '💰', '💵', '💸', '💴', '🏧',
        // Salud y Deporte
        '💊', '💉', '🏥', '🏋️', '⛹️', '🏃', '🚴',
        // Entretenimiento
        '🎬', '🎮', '🎯', '🎲', '🎰', '🎺', '🎸', '🎹',
        '🎧', '🎤', '📺', '📻', '📷', '📸', '🎥',
        // Educación y Trabajo
        '📚', '📖', '📝', '📋', '📊', '📈', '📉', '💼', '🎓',
        // Otros
        '🎁', '🎀', '🎈', '🎉', '🎊', '🏷️', '🔧', '🔨', '🔑',
        '👶', '🐶', '🐱', '🌳', '🌸', '⭐', '❤️', '💚', '💙', '💜'
    ];

    const colors = [
        '#FF9500', '#5856D6', '#007AFF', '#AF52DE', '#FF2D55',
        '#FFCC00', '#5AC8FA', '#34C759', '#FF3B30', '#00C7BE',
        '#30B0C7', '#8E8E93'
    ];

    const filteredCategories = categories.filter(c => c.type === activeTab);

    const handleSave = async () => {
        if (!formData.name) {
            showToast('Por favor ingresa un nombre para la categoría', 'error');
            return;
        }

        try {
            let message = '';
            if (editingCategory && editingCategory.id) {
                await updateCategory(editingCategory.id, {
                    name: formData.name,
                    type: formData.type,
                    icon: formData.icon,
                    color: formData.color
                });
                message = 'Categoría actualizada con éxito';
            } else {
                await addCategory({
                    name: formData.name,
                    type: formData.type as 'income' | 'expense',
                    icon: formData.icon || '🏷️',
                    color: formData.color
                });
                message = 'Categoría creada con éxito';
            }

            setIsModalOpen(false);
            setEditingCategory(null);
            setFormData({ type: activeTab, color: '#8E8E93', icon: '🏷️' });

            // Show toast after modal closes to ensure visibility
            setTimeout(() => {
                showToast(message, 'success');
            }, 300);
        } catch (e: any) {
            showToast('Error al guardar categoría: ' + e.message, 'error');
            console.error(e);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
        await deleteCategory(id);
    };

    const openEdit = (cat: CategoryItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCategory(cat);
        setFormData(cat);
        setIsModalOpen(true);
    };

    const getCategoryEmoji = (iconName?: string) => {
        const map: Record<string, string> = {
            'Coffee': '☕', 'Car': '🚗', 'Home': '🏠', 'Film': '🎬',
            'Heart': '❤️', 'ShoppingBag': '🛍️', 'Zap': '💡', 'MoreHorizontal': '📦',
            'Tag': '🏷️', 'DollarSign': '💰', 'Briefcase': '💼', 'Plane': '✈️', 'Book': '📚',
            'Activity': '🏋️', 'TrendingUp': '📈', 'BookOpen': '📖'
        };
        return map[iconName || ''] || iconName || '🏷️';
    };

    return (
        <div className="categories-view">
            <div className="page-header">
                {/* Header logic can be simplifed here since parent handles nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Removed Home button as it's partial view now */}
                    <h2>Categorías</h2>
                </div>
                <button className="add-btn" onClick={() => {
                    setEditingCategory(null);
                    setFormData({ type: activeTab, color: '#8E8E93', icon: '🏷️' });
                    setIsModalOpen(true);
                }}>
                    <Plus size={24} />
                </button>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'expense' ? 'active' : ''}`}
                    onClick={() => setActiveTab('expense')}
                >
                    Gastos
                </button>
                <button
                    className={`tab ${activeTab === 'income' ? 'active' : ''}`}
                    onClick={() => setActiveTab('income')}
                >
                    Ingresos
                </button>
            </div>

            <div className="categories-list">
                {filteredCategories.length === 0 ? (
                    <div className="empty-state">No hay categorías de {activeTab === 'expense' ? 'gasto' : 'ingreso'}.</div>
                ) : (
                    filteredCategories.map(cat => (
                        <div
                            key={cat.id || cat.name}
                            className="category-item"
                            style={{ borderLeft: `4px solid ${cat.color || '#ccc'}`, cursor: 'pointer' }}
                            onClick={() => setDetailCategory(cat)}
                        >
                            <div className="cat-icon" style={{ backgroundColor: `${cat.color}20` }}>
                                <span style={{ fontSize: '24px' }}>{getCategoryEmoji(cat.icon)}</span>
                            </div>
                            <div className="cat-info">
                                <span className="cat-name">{cat.name}</span>
                            </div>
                            <div className="cat-actions">
                                <button onClick={(e) => openEdit(cat, e)}><Edit2 size={18} /></button>
                                <button onClick={(e) => cat.id && handleDelete(cat.id, e)} className="delete"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <CategoryDetailModal
                category={detailCategory}
                isOpen={!!detailCategory}
                onClose={() => setDetailCategory(null)}
                transactions={transactions}
            />

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Mascotas"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Tipo</label>
                                <div className="type-selector">
                                    <button
                                        className={formData.type === 'expense' ? 'active' : ''}
                                        onClick={() => setFormData({ ...formData, type: 'expense' })}
                                    >Gasto</button>
                                    <button
                                        className={formData.type === 'income' ? 'active' : ''}
                                        onClick={() => setFormData({ ...formData, type: 'income' })}
                                    >Ingreso</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Color</label>
                                <div className="color-grid">
                                    {colors.map(c => (
                                        <button
                                            key={c}
                                            style={{ background: c }}
                                            className={`color-btn ${formData.color === c ? 'selected' : ''}`}
                                            onClick={() => setFormData({ ...formData, color: c })}
                                        >
                                            {formData.color === c && <Check size={12} color="white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Icono</label>
                                <div className="emoji-input-container">
                                    <input
                                        type="text"
                                        value={formData.icon || ''}
                                        onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                        placeholder="Pega cualquier emoji aquí 😊"
                                        className="emoji-text-input"
                                        maxLength={2}
                                    />
                                </div>
                                <div className="icon-grid">
                                    {EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            className={`icon-btn ${formData.icon === emoji ? 'selected' : ''}`}
                                            onClick={() => setFormData({ ...formData, icon: emoji })}
                                        >
                                            <span style={{ fontSize: '20px' }}>{emoji}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button className="save-btn" onClick={handleSave}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .categories-view {
                    padding-bottom: 80px;
                }
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                h2 { font-size: 20px; font-weight: 700; margin: 0; }
                .add-btn {
                    width: 40px; height: 40px;
                    border-radius: 50%;
                    background: #007AFF;
                    color: white;
                    border: none;
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                }

                .tabs {
                    display: flex; background: #E5E5EA; padding: 4px; border-radius: 12px;
                    margin-bottom: 20px;
                }
                .tab {
                    flex: 1; padding: 10px; border: none; background: none;
                    font-weight: 600; color: #8E8E93; border-radius: 8px;
                    cursor: pointer; transition: all 0.2s;
                }
                .tab.active {
                    background: white; color: #000; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .categories-list {
                    display: flex; flex-direction: column; gap: 12px;
                }
                .empty-state {
                    text-align: center; color: #8E8E93; padding: 40px;
                }
                .category-item {
                    background: white;
                    padding: 16px;
                    border-radius: 16px;
                    display: flex; align-items: center; gap: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                }
                .cat-icon {
                    width: 40px; height: 40px;
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                }
                .cat-info { flex: 1; display: flex; flex-direction: column; }
                .cat-name { font-weight: 600; font-size: 16px; }
                .cat-actions { display: flex; gap: 8px; }
                .cat-actions button {
                    background: none; border: none; color: #007AFF; cursor: pointer; padding: 8px;
                }
                .cat-actions button.delete { color: #FF3B30; }

                /* Modal */
                .modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.5);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 100; padding: 20px;
                }
                .modal-content {
                    background: white; width: 100%; max-width: 400px;
                    border-radius: 24px; overflow: hidden;
                    max-height: 90vh; overflow-y: auto;
                }
                .modal-header {
                    padding: 20px; border-bottom: 1px solid #E5E5EA;
                    display: flex; justify-content: space-between; align-items: center;
                }
                .modal-header h2 { margin: 0; font-size: 20px; }
                .modal-header button { background: none; border: none; cursor: pointer; }
                .modal-body { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
                
                .form-group label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; }
                .form-group input {
                    width: 100%; padding: 12px; border-radius: 12px;
                    border: 1px solid #E5E5EA; font-size: 16px;
                }
                .type-selector { display: flex; gap: 10px; }
                .type-selector button {
                    flex: 1; padding: 10px; border-radius: 10px;
                    border: 1px solid #E5E5EA; background: white;
                    font-weight: 500; cursor: pointer;
                }
                .type-selector button.active {
                    background: #007AFF; color: white; border-color: #007AFF;
                }
                
                .color-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 10px;
                }
                
                .color-btn {
                    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                }
                
                .color-btn.selected { transform: scale(1.1); border: 2px solid white; box-shadow: 0 0 0 2px #000; }
                
                .emoji-input-container {
                    margin-bottom: 12px;
                }

                .emoji-text-input {
                    width: 100%;
                    padding: 12px;
                    border-radius: 12px;
                    border: 1.5px solid #E5E5EA;
                    font-size: 24px;
                    text-align: center;
                    outline: none;
                }

                .emoji-text-input:focus {
                    border-color: #007AFF;
                    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
                }

                .icon-grid {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    gap: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                }

                .icon-btn {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    border: 1.5px solid #E5E5EA;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .icon-btn:hover {
                    background: #f5f5f5;
                }
                
                .icon-btn.selected {
                    background: #007AFF; color: white; border-color: #007AFF;
                }
                
                .save-btn {
                    width: 100%; padding: 16px; background: #007AFF; color: white;
                    border: none; border-radius: 16px; font-weight: 600; font-size: 16px;
                    cursor: pointer; margin-top: 10px;
                }
            `}</style>
        </div>
    );
}
