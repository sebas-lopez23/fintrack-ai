'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { processPdfStatement, TransactionData } from '@/services/geminiService';
import { useFinance } from '@/context/FinanceContext';
import { Category, TransactionType } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// Extended interface for editability
interface EditableTransaction extends TransactionData {
    id: string; // Temp ID
    selected: boolean;
    date?: string;
    merchant?: string; // Merchant name from PDF
}

export default function ImportStatementModal({ isOpen, onClose }: Props) {
    const { addTransaction, categories, accounts } = useFinance();

    const [step, setStep] = useState<'upload' | 'review'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [transactions, setTransactions] = useState<EditableTransaction[]>([]);
    const [targetAccountId, setTargetAccountId] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleProcess = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError('');

        try {
            const { transactions: rawTransactions, meta } = await processPdfStatement(file);

            // Map to editable format
            const mapped: EditableTransaction[] = rawTransactions.map((t, index) => ({
                ...t,
                id: `temp-${index}`,
                selected: true,
                // Ensure category matches existing ones or default to Other
                category: categories.find(c => c.name.toLowerCase() === t.category.toLowerCase())?.name || 'Otros'
            }));

            // Attach meta to array for display (temporary but effective)
            (mapped as any).meta = meta;

            setTransactions(mapped);
            // Default to first account or auto-detected if possible
            if (accounts.length > 0) {
                setTargetAccountId(accounts[0].id);
            }
            setStep('review');
        } catch (err: any) {
            setError(err.message || 'Error al procesar el archivo');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = () => {
        const toImport = transactions.filter(t => t.selected);

        if (!targetAccountId) {
            setError('Por favor selecciona una cuenta para asignar las transacciones.');
            return;
        }

        toImport.forEach(t => {
            addTransaction({
                amount: t.amount,
                type: t.type,
                category: t.category as Category,
                accountId: targetAccountId, // Use the bulk selected account
                date: new Date(t.date || new Date()).toISOString(),
                note: t.merchant || '',
            });
        });

        onClose();
        // Reset state
        setStep('upload');
        setFile(null);
        setTransactions([]);
    };

    const toggleSelection = (id: string) => {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
    };

    const deleteTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Importar Extracto</h2>
                    <button onClick={onClose} className="close-btn"><X size={24} /></button>
                </div>

                {step === 'upload' ? (
                    <div className="upload-view">
                        <div
                            className={`dropzone ${file ? 'has-file' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf"
                                hidden
                            />
                            {file ? (
                                <div className="file-preview">
                                    <FileText size={48} className="file-icon" />
                                    <p className="filename">{file.name}</p>
                                    <p className="filesize">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            ) : (
                                <div className="placeholder">
                                    <Upload size={48} className="upload-icon" />
                                    <p>Toca para subir tu extracto PDF</p>
                                    <span className="subtext">Soporta Bancolombia, Nequi, etc.</span>
                                </div>
                            )}
                        </div>

                        {error && <div className="error-banner"><AlertCircle size={16} /> {error}</div>}

                        <button
                            className="action-btn"
                            disabled={!file || isProcessing}
                            onClick={handleProcess}
                        >
                            {isProcessing ? 'Analizando...' : 'Procesar Extracto'}
                        </button>
                    </div>
                ) : (
                    <div className="review-view">
                        {(transactions.length > 0 || (transactions as any).meta) && (
                            <div className="summary-header">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <p style={{ margin: 0 }}>Se encontraron <strong>{transactions.length}</strong> movimientos</p>
                                    {(transactions as any).meta?.balance && (
                                        <div className="balance-badge" style={{ background: '#E0F2FE', color: '#0369A1', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                            Saldo: <strong>${(transactions as any).meta.balance.toLocaleString('es-CO')}</strong>
                                        </div>
                                    )}
                                </div>
                                <div className="account-selector" style={{ background: 'white', padding: 8, borderRadius: 12, border: '1px solid #eee' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: 4 }}>Asignar a cuenta:</label>
                                    <select
                                        value={targetAccountId}
                                        onChange={(e) => setTargetAccountId(e.target.value)}
                                        style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #ddd', background: '#FAFAFA' }}
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="transactions-list">
                            {transactions.map(t => (
                                <div key={t.id} className={`review-item ${!t.selected ? 'ignored' : ''}`}>
                                    <div className="checkbox" onClick={() => toggleSelection(t.id)}>
                                        {t.selected && <Check size={14} color="white" />}
                                    </div>
                                    <div className="ritem-details">
                                        <p className="ritem-merchant">{t.merchant || t.description || 'Sin descripción'}</p>
                                        <div className="ritem-meta">
                                            <span className={`badge ${t.type}`}>{t.type === 'expense' ? 'Gasto' : 'Ingreso'}</span>
                                            <span className="date-text">{t.date}</span>
                                        </div>
                                        <div className="category-row">
                                            <div
                                                className="cat-indicator"
                                                style={{
                                                    background: categories.find(c => c.name === t.category)?.color || '#999'
                                                }}
                                            />
                                            <select
                                                className="category-select-styled"
                                                value={t.category}
                                                onChange={(e) => {
                                                    setTransactions(prev => prev.map(tx =>
                                                        tx.id === t.id ? { ...tx, category: e.target.value } : tx
                                                    ));
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {categories.filter(cat =>
                                                    cat.type === t.type || cat.name === 'Otros'
                                                ).map(cat => (
                                                    <option key={cat.id} value={cat.name}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="ritem-right">
                                        <p className="ritem-amount">${t.amount.toLocaleString('es-CO')}</p>
                                        <button className="delete-btn" onClick={() => deleteTransaction(t.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="review-actions">
                            <button className="secondary-btn" onClick={() => setStep('upload')}>Atrás</button>
                            <button className="primary-btn" onClick={handleImport}>
                                Importar ({transactions.filter(t => t.selected).length})
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.6); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          padding: 20px; backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white; width: 100%; max-width: 500px;
          border-radius: 24px; max-height: 90vh; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }
        .modal-header {
          padding: 20px; border-bottom: 1px solid #eee;
          display: flex; justify-content: space-between; align-items: center;
        }
        .modal-header h2 { margin: 0; font-size: 1.2rem; }
        .close-btn { background: none; border: none; cursor: pointer; color: #666; }

        .upload-view { padding: 30px; display: flex; flex-direction: column; gap: 20px; }
        .dropzone {
          border: 2px dashed #ddd; border-radius: 20px;
          height: 250px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s; background: #fafafa;
        }
        .dropzone:hover, .dropzone.has-file { border-color: #007AFF; background: #F0F9FF; }
        
        .placeholder { text-align: center; color: #999; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .file-preview { text-align: center; color: #007AFF; }
        .filename { font-weight: 600; margin: 10px 0 5px; color: #333; }
        .filesize { font-size: 0.8rem; color: #666; }

        .action-btn {
          background: #000; color: white; padding: 16px; border-radius: 16px;
          font-weight: 600; font-size: 1rem; border: none; cursor: pointer;
          width: 100%;
        }
        .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .review-view { display: flex; flex-direction: column; height: 100%; max-height: 600px; }
        .summary-header { padding: 15px 20px; background: #f9f9f9; border-bottom: 1px solid #eee; }
        
        .transactions-list {
          flex: 1; overflow-y: auto; padding: 0;
        }
        
        .review-item {
          display: flex; align-items: center; gap: 12px; padding: 15px 20px;
          border-bottom: 1px solid #f0f0f0; transition: background 0.2s;
        }
        .review-item.ignored { opacity: 0.5; background: #fafafa; }
        
        .checkbox {
          width: 20px; height: 20px; border-radius: 6px; border: 2px solid #ddd;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .review-item:not(.ignored) .checkbox { background: #007AFF; border-color: #007AFF; }
        
        
        .ritem-details { 
          flex: 1; display: flex; flex-direction: column; gap: 6px; 
        }
        .ritem-merchant { 
          font-weight: 600; font-size: 0.95rem; margin: 0; color: #111; 
          line-height: 1.3;
        }
        .ritem-meta { 
          font-size: 0.75rem; color: #666; display: flex; align-items: center; gap: 8px; margin: 0; 
        }
        .date-text { color: #999; }
        
        .category-row {
          display: flex; align-items: center; gap: 10px; margin-top: 2px;
        }
        .cat-indicator {
          width: 10px; height: 10px; border-radius: 50%;
          flex-shrink: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }
        .category-select-styled {
          flex: 1;
          padding: 8px 12px; 
          border-radius: 8px; 
          border: 1px solid #d1d5db;
          font-size: 0.875rem; 
          background: white; 
          cursor: pointer;
          outline: none; 
          transition: all 0.15s ease;
          font-weight: 400;
          color: #374151;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 8px center;
          background-repeat: no-repeat;
          background-size: 16px;
          padding-right: 32px;
        }
        .category-select-styled:hover { 
          border-color: #3b82f6; 
        }
        .category-select-styled:focus { 
          border-color: #3b82f6; 
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        
        .badge { padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; text-transform: uppercase; font-weight: 700; }
        .badge.expense { background: #fee2e2; color: #dc2626; }
        .badge.income { background: #dcfce7; color: #16a34a; }
        
        .ritem-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
        .ritem-amount { font-weight: 600; font-size: 0.9rem; }
        
        .delete-btn {
          color: #999; background: none; border: none; padding: 4px;
          cursor: pointer; hover: text-red-500;
        }
        .delete-btn:hover { color: #ef4444; }

        .review-actions {
          padding: 20px; border-top: 1px solid #eee; display: flex; gap: 10px;
        }
        .primary-btn { flex: 2; background: #000; color: white; border: none; padding: 14px; border-radius: 14px; font-weight: 600; cursor: pointer; }
        .secondary-btn { flex: 1; background: #f0f0f0; color: #333; border: none; padding: 14px; border-radius: 14px; font-weight: 600; cursor: pointer; }
        
        .error-banner {
            background-color: #FEE2E2; color: #DC2626; padding: 10px; border-radius: 12px;
            display: flex; align-items: center; gap: 8px; font-size: 0.9rem;
        }
      `}</style>
        </div>
    );
}
