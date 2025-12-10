'use client';

import React, { useState, useCallback } from 'react';
import MobileLayout from '@/components/Layout/MobileLayout';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Edit2, Loader2, ArrowRight } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { useRouter } from 'next/navigation';

export default function ImportPage() {
    const { addTransaction, accounts, transactions } = useFinance();
    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload');
    const [targetAccount, setTargetAccount] = useState<string>('');

    // --- 1. File Handling ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setIsAnalyzing(true);

        // Simulate reading text from file clientside for demo (since we don't have server full pdf parsing setup yet)
        // In real app, we send FormData to /api/analyze-statement
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/analyze-statement', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.transactions) {
                setParsedData(data.transactions);
                // Select all by default initially
                setSelectedIndices(new Set(data.transactions.map((_: any, i: number) => i)));
                setStep('review');
            }
        } catch (e) {
            console.error('Error analyzing', e);
            alert('Error analizando el archivo.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- Duplicate Detection ---
    const isDuplicate = useCallback((tx: any, accId: string) => {
        if (!accId) return false;
        // lenient check: same amount, type, and roughly same date (within 1 day)
        const txDate = new Date(tx.date);
        return transactions.some(existing => {
            if (existing.accountId !== accId) return false;
            if (Math.abs(existing.amount - tx.amount) > 1) return false; // tolerance 1 peso
            if (existing.type !== tx.type) return false;

            const exDate = new Date(existing.date);
            const diffTime = Math.abs(txDate.getTime() - exDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 1;
        });
    }, [transactions]);

    // Construct list with duplicate info
    const reviewedData = parsedData.map((tx, i) => {
        const dup = isDuplicate(tx, targetAccount);
        return { ...tx, originalIndex: i, isDuplicate: dup };
    });

    const toggleSelection = (index: number) => {
        const next = new Set(selectedIndices);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setSelectedIndices(next);
    };

    // --- 2. Saving ---
    const handleSaveAll = async () => {
        if (!targetAccount && accounts.length > 0) {
            alert('Por favor selecciona una cuenta destino.');
            return;
        }

        const accountId = targetAccount || accounts[0]?.id || 'cash';
        let count = 0;

        for (let i = 0; i < parsedData.length; i++) {
            if (selectedIndices.has(i)) {
                const tx = parsedData[i];
                await addTransaction({
                    accountId: accountId,
                    amount: tx.amount,
                    type: tx.type,
                    category: tx.category,
                    description: tx.merchant,
                    date: tx.date || new Date().toISOString(),
                    isrecurring: false
                });
                count++;
            }
        }

        if (count === 0) {
            alert('No seleccionaste ninguna transacción nueva.');
            return;
        }

        setStep('success');
        setTimeout(() => router.push('/'), 2000);
    };

    return (
        <MobileLayout>
            <div className="page-header">
                <h1>Importar Extracto</h1>
                <p>Sube tu PDF del banco para actualizar tus movimientos.</p>
            </div>

            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
                <div className="upload-box">
                    <div className="dashed-zone">
                        <UploadCloud size={48} color="#007AFF" />
                        <p>Toca para subir tu extracto<br /><span>PDF, CSV, Imagen</span></p>
                        <input type="file" onChange={handleFileChange} accept=".pdf,.csv,.txt,.png,.jpg" />
                    </div>

                    {file && (
                        <div className="file-preview">
                            <FileText size={20} color="#007AFF" />
                            <span>{file.name}</span>
                        </div>
                    )}

                    <button
                        className={`action-btn ${!file ? 'disabled' : ''}`}
                        onClick={handleAnalyze}
                        disabled={!file || isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <><Loader2 className="spin" size={20} /> Leyendo Transacciones...</>
                        ) : (
                            'Procesar Archivo'
                        )}
                    </button>
                </div>
            )}

            {/* STEP 2: REVIEW */}
            {step === 'review' && (
                <div className="review-section">
                    <div className="review-config">
                        <label>Cuenta Destino:</label>
                        <select
                            value={targetAccount}
                            onChange={(e) => {
                                setTargetAccount(e.target.value);
                                // Auto-deselect duplicates when account changes
                                // Logic handled in render mostly, but could auto-update selection here if desired
                            }}
                            className="account-select"
                        >
                            <option value="">Selecciona Cuenta...</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="review-stats">
                        <span>{parsedData.length} detectadas</span>
                        <span>{selectedIndices.size} a importar</span>
                    </div>

                    <div className="tx-list">
                        {reviewedData.map((tx) => (
                            <div
                                key={tx.originalIndex}
                                className={`tx-row ${selectedIndices.has(tx.originalIndex) ? 'selected' : ''} ${tx.isDuplicate ? 'duplicate' : ''}`}
                                onClick={() => toggleSelection(tx.originalIndex)}
                            >
                                <div className="checkbox">
                                    {selectedIndices.has(tx.originalIndex) && <div className="dot" />}
                                </div>
                                <div className="tx-content">
                                    <div className="tx-main">
                                        <span className="tx-date">{tx.date}</span>
                                        <span className="tx-desc">{tx.merchant}</span>
                                    </div>
                                    <div className="tx-meta">
                                        {tx.isDuplicate && <span className="badge-dup">Posible Duplicado</span>}
                                        <span className={`tx-amt ${tx.type}`}>
                                            ${tx.amount.toLocaleString()}
                                        </span>
                                    </div>
                                    <span className="tx-cat">{tx.category}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="actions">
                        <button className="cancel-btn" onClick={() => setStep('upload')}>Volver</button>
                        <button className="save-btn" onClick={handleSaveAll}>
                            Importar ({selectedIndices.size})
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 'success' && (
                <div className="success-view">
                    <CheckCircle size={64} color="#34C759" />
                    <h2>¡Importación Exitosa!</h2>
                    <p>Tus finanzas están al día.</p>
                </div>
            )}

            <style jsx>{`
                .page-header h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px; }
                .page-header p { color: #8E8E93; font-size: 14px; margin-bottom: 30px; }

                /* UPLOAD */
                .dashed-zone {
                    border: 2px dashed #C7C7CC; border-radius: 20px;
                    height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center;
                    text-align: center; color: #8E8E93; position: relative; background: #FAFAFA;
                }
                .dashed-zone span { font-size: 12px; color: #C7C7CC; }
                .dashed-zone input { 
                    position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
                }
                
                .file-preview {
                    margin-top: 16px; background: white; padding: 12px; border-radius: 12px;
                    display: flex; align-items: center; gap: 8px; border: 1px solid #E5E5EA;
                    font-weight: 600; font-size: 14px;
                }

                .action-btn {
                    margin-top: 24px; width: 100%; background: #007AFF; color: white;
                    padding: 16px; border-radius: 16px; border: none; font-weight: 700; font-size: 16px;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .action-btn.disabled { opacity: 0.5; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                /* REVIEW */
                .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .review-header h3 { font-size: 16px; font-weight: 700; }
                .account-select { padding: 8px; border-radius: 8px; border: 1px solid #C7C7CC; font-size: 13px; }

                .tx-list {
                    background: white; border-radius: 16px; border: 1px solid #F2F2F7;
                    max-height: 400px; overflow-y: auto; margin-bottom: 20px;
                }
                .tx-row {
                    display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #F2F2F7;
                }
                .tx-left { display: flex; flex-direction: column; }
                .tx-date { font-size: 11px; color: #8E8E93; }
                .tx-desc { font-weight: 600; font-size: 14px; }
                
                .tx-right { text-align: right; display: flex; flex-direction: column; alignItems: flex-end; }
                .tx-amt { font-weight: 700; font-size: 14px; }
                .tx-amt.expense { color: #1C1C1E; }
                .tx-amt.income { color: #34C759; }
                .tx-cat { font-size: 11px; background: #F2F2F7; padding: 2px 6px; border-radius: 4px; color: #8E8E93; margin-top: 2px; }

                .actions { display: flex; gap: 12px; }
                .cancel-btn { flex: 1; padding: 16px; border: none; background: #F2F2F7; color: #1C1C1E; border-radius: 16px; font-weight: 600; }
                .save-btn { flex: 2; padding: 16px; border: none; background: #007AFF; color: white; border-radius: 16px; font-weight: 700; display: flex; justify-content: center; align-items: center; gap: 8px;}

                /* SUCCESS */
                .success-view {
                    text-align: center; padding-top: 60px;
                }
                .success-view h2 { margin-top: 20px; font-size: 24px; font-weight: 800; }
                .success-view p { color: #8E8E93; }

            `}</style>
        </MobileLayout>
    );
}
