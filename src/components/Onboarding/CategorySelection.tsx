'use client';

import React, { useState, useEffect } from 'react';
import { Check as CheckIcon, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useFinance } from '@/context/FinanceContext';
import { useOnboarding } from '@/context/OnboardingContext';

interface DefaultCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'expense' | 'income';
}

export default function CategorySelection() {
    const { addCategory } = useFinance();
    const { completeStep, nextStep, skipStep } = useOnboarding();
    const [defaultCategories, setDefaultCategories] = useState<DefaultCategory[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddCustom, setShowAddCustom] = useState(false);
    const [customCategory, setCustomCategory] = useState({ name: '', icon: '📌', color: '#6366f1', type: 'expense' as 'expense' | 'income' });

    useEffect(() => {
        fetchDefaultCategories();
    }, []);

    const fetchDefaultCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('default_categories')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            setDefaultCategories(data || []);
            // Pre-select all categories
            setSelectedCategories(new Set(data?.map(c => c.id) || []));
        } catch (error) {
            console.error('Error fetching default categories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const handleAddCustomCategory = () => {
        if (!customCategory.name.trim()) return;

        const newCategory: DefaultCategory = {
            id: crypto.randomUUID(),
            ...customCategory,
        };

        setDefaultCategories(prev => [...prev, newCategory]);
        setSelectedCategories(prev => new Set([...prev, newCategory.id]));
        setShowAddCustom(false);
        setCustomCategory({ name: '', icon: '📌', color: '#6366f1', type: 'expense' });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Get selected categories
            const categoriesToAdd = defaultCategories.filter(c => selectedCategories.has(c.id));

            // Add each category to user's profile
            for (const category of categoriesToAdd) {
                await addCategory({
                    name: category.name,
                    icon: category.icon,
                    color: category.color,
                    type: category.type,
                });
            }

            await completeStep('categoriesSelected');
            nextStep();
        } catch (error) {
            console.error('Error saving categories:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="category-container">
                <div className="loading">Cargando categorías...</div>
            </div>
        );
    }

    const expenseCategories = defaultCategories.filter(c => c.type === 'expense');
    const incomeCategories = defaultCategories.filter(c => c.type === 'income');

    return (
        <div className="category-container">
            <div className="content-wrapper">
                {/* Header */}
                <div className="header">
                    <div className="step-indicator">Paso 1 de 3</div>
                    <h1>Selecciona tus Categorías</h1>
                    <p className="subtitle">
                        Elige las categorías que usarás para organizar tus gastos e ingresos.
                        Puedes modificarlas después.
                    </p>
                </div>

                {/* Categories Grid */}
                <div className="categories-section">
                    <h3 className="section-title">
                        <span className="icon">💸</span> Gastos
                    </h3>
                    <div className="category-grid">
                        {expenseCategories.map(category => (
                            <button
                                key={category.id}
                                className={`category-card ${selectedCategories.has(category.id) ? 'selected' : ''}`}
                                onClick={() => toggleCategory(category.id)}
                            >
                                <span className="category-icon">{category.icon}</span>
                                <span className="category-name">{category.name}</span>
                                {selectedCategories.has(category.id) && (
                                    <div className="check-badge">
                                        <CheckIcon size={14} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <h3 className="section-title">
                        <span className="icon">💰</span> Ingresos
                    </h3>
                    <div className="category-grid">
                        {incomeCategories.map(category => (
                            <button
                                key={category.id}
                                className={`category-card ${selectedCategories.has(category.id) ? 'selected' : ''}`}
                                onClick={() => toggleCategory(category.id)}
                            >
                                <span className="category-icon">{category.icon}</span>
                                <span className="category-name">{category.name}</span>
                                {selectedCategories.has(category.id) && (
                                    <div className="check-badge">
                                        <CheckIcon size={14} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add Custom Category */}
                {!showAddCustom ? (
                    <button className="add-custom-btn" onClick={() => setShowAddCustom(true)}>
                        <Plus size={20} />
                        Agregar Categoría Personalizada
                    </button>
                ) : (
                    <div className="custom-category-form">
                        <div className="form-row">
                            <button className="emoji-picker" onClick={() => setCustomCategory({ ...customCategory, icon: prompt('Emoji:') || '📌' })}>
                                {customCategory.icon}
                            </button>
                            <input
                                type="text"
                                placeholder="Nombre de la categoría"
                                value={customCategory.name}
                                onChange={(e) => setCustomCategory({ ...customCategory, name: e.target.value })}
                                className="category-input"
                            />
                            <input
                                type="color"
                                value={customCategory.color}
                                onChange={(e) => setCustomCategory({ ...customCategory, color: e.target.value })}
                                className="color-picker"
                            />
                        </div>
                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setShowAddCustom(false)}>
                                <X size={16} /> Cancelar
                            </button>
                            <button className="btn-primary-small" onClick={handleAddCustomCategory}>
                                <CheckIcon size={16} /> Agregar
                            </button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="actions">
                    <button className="skip-link" onClick={skipStep}>
                        Omitir este paso
                    </button>
                    <button
                        className="continue-btn"
                        onClick={handleSave}
                        disabled={selectedCategories.size === 0 || isSaving}
                    >
                        {isSaving ? 'Guardando...' : `Continuar (${selectedCategories.size} seleccionadas)`}
                    </button>
                </div>
            </div>

            <style jsx>{`
        .category-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .content-wrapper {
          width: 100%;
          max-width: 700px;
          background: white;
          border-radius: var(--radius-lg);
          padding: 40px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }

        .loading {
          text-align: center;
          color: var(--color-text-light);
          padding: 40px;
        }

        .header {
          text-align: center;
          margin-bottom: 40px;
        }

        .step-indicator {
          font-size: 12px;
          color: var(--color-primary);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        h1 {
          font-size: 32px;
          font-weight: 800;
          color: var(--color-text-main);
          margin-bottom: 12px;
        }

        .subtitle {
          font-size: 15px;
          color: var(--color-text-secondary);
          line-height: 1.6;
        }

        .categories-section {
          margin-bottom: 32px;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text-main);
          margin-bottom: 16px;
          margin-top: 32px;
        }

        .section-title .icon {
          font-size: 20px;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .category-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 12px;
          background: #f8f9fa;
          border: 2px solid transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-card:hover {
          background: #f0f2f5;
          transform: translateY(-2px);
        }

        .category-card.selected {
          background: rgba(99, 102, 241, 0.1);
          border-color: var(--color-primary);
        }

        .category-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .category-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-main);
          text-align: center;
        }

        .check-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: var(--color-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .add-custom-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: rgba(99, 102, 241, 0.1);
          border: 2px dashed var(--color-primary);
          border-radius: var(--radius-md);
          color: var(--color-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 32px;
        }

        .add-custom-btn:hover {
          background: rgba(99, 102, 241, 0.15);
        }

        .custom-category-form {
          background: #f8f9fa;
          padding: 20px;
          border-radius: var(--radius-md);
          margin-bottom: 32px;
        }

        .form-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .emoji-picker {
          width: 50px;
          height: 50px;
          font-size: 24px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: var(--radius-md);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-input {
          flex: 1;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: var(--radius-md);
          font-size: 15px;
        }

        .color-picker {
          width: 60px;
          height: 50px;
          border: 2px solid #e0e0e0;
          border-radius: var(--radius-md);
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: 12px;
        }

        .btn-secondary, .btn-primary-small {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: white;
          border: 2px solid #e0e0e0;
          color: var(--color-text-main);
        }

        .btn-primary-small {
          background: var(--color-primary);
          border: none;
          color: white;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .continue-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          border: none;
          border-radius: var(--radius-pill);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
        }

        .continue-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .continue-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
        }

        .skip-link {
          background: none;
          border: none;
          color: var(--color-text-light);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px;
        }

        .skip-link:hover {
          color: var(--color-text-main);
        }

        @media (max-width: 640px) {
          .content-wrapper {
            padding: 24px;
          }

          .category-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }
        }
      `}</style>
        </div>
    );
}
