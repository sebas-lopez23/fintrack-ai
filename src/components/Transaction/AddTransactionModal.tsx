'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { CategoryItem } from '@/types';
import { TransactionType, Category } from '@/types';
import { X, Check, Mic, Camera, AlertCircle, Plus } from 'lucide-react';
import { processAudioTransaction, processImageTransaction } from '@/services/geminiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'manual' | 'voice' | 'camera';
}

export default function AddTransactionModal({ isOpen, onClose, initialMode = 'manual' }: Props) {
  const { addTransaction, addTransfer, accounts, currentUser, categories, addCategory } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('');
  const [accountId, setAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState(''); // New for transfer
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState(1);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Filter categories based on active type
  const visibleCategories = categories.filter(c => c.type === type);

  // Initialize defaults
  useEffect(() => {
    if (isOpen) {
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
        if (accounts.length > 1) setDestinationAccountId(accounts[1].id);
      }

      // Auto-select first visible category when type changes or categories load
      const firstCat = categories.find(c => c.type === type);
      if (firstCat) setCategory(firstCat.name);

      setAmount('');
      setNote('');
      setInstallments(1);

      if (initialMode === 'voice') handleVoiceCapture();
      else if (initialMode === 'camera') handleCameraCapture();
    }
  }, [isOpen, initialMode, accounts, categories, type]); // Added type to deps to re-select category

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleVoiceCapture = async () => {
    try {
      setError('');
      setProcessingMessage('Solicitando acceso al micrófono...');
      setIsProcessing(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setProcessingMessage('Analizando audio con Gemini AI...');

        try {
          const accountNames = accounts.map(a => a.name);
          const transactionData = await processAudioTransaction(audioBlob, accountNames);
          setAmount(transactionData.amount.toString());

          // Try to match category name
          const matchedCat = categories.find(c => c.name.toLowerCase() === transactionData.category.toLowerCase());
          if (matchedCat) {
            setCategory(matchedCat.name);
            setType(matchedCat.type as TransactionType); // Auto-switch type
          }

          setNote(transactionData.description + ' (Voz)');

          if (transactionData.type) setType(transactionData.type);

          // Match account if returned
          if (transactionData.accountName) {
            const matchedAccount = accounts.find(a => a.name.toLowerCase() === transactionData.accountName?.toLowerCase());
            if (matchedAccount) setAccountId(matchedAccount.id);
          }

          setIsProcessing(false);
          setProcessingMessage('');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al procesar el audio');
          setIsProcessing(false);
        }
      };

      setProcessingMessage('Grabando... (5s)');
      setIsRecording(true);
      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 5000);

    } catch (err) {
      setError('Sin acceso al micrófono.');
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      setError('');
      setProcessingMessage('Accediendo a cámara...');
      setIsProcessing(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsProcessing(false);
    } catch (err) {
      setError('Sin acceso a cámara.');
      setIsProcessing(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !streamRef.current) return;
    try {
      setIsProcessing(true);
      setProcessingMessage('Capturando...');
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          streamRef.current?.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          setProcessingMessage('Analizando recibo...');

          try {
            const accountNames = accounts.map(a => a.name);
            const transactionData = await processImageTransaction(blob, accountNames);
            setAmount(transactionData.amount.toString());
            const matchedCat = categories.find(c => c.name.toLowerCase() === transactionData.category.toLowerCase());
            if (matchedCat) {
              setCategory(matchedCat.name);
              setType(matchedCat.type as TransactionType);
            }
            setNote(transactionData.description + ' (Foto)');
            if (transactionData.type) setType(transactionData.type);

            // Match account if returned
            if (transactionData.accountName) {
              const matchedAccount = accounts.find(a => a.name.toLowerCase() === transactionData.accountName?.toLowerCase());
              if (matchedAccount) setAccountId(matchedAccount.id);
            }

            setIsProcessing(false);
          } catch (err) {
            setError('Error al procesar imagen');
            setIsProcessing(false);
          }
        }, 'image/jpeg', 0.8);
      }
    } catch (err) {
      setError('Error al capturar');
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    // Handle Local Date
    const [y, m, d] = date.split('-').map(Number);
    const now = new Date();
    const localDate = new Date(y, m - 1, d, now.getHours(), now.getMinutes());
    const finalDate = localDate.toISOString();

    if (type === 'transfer') {
      if (!accountId || !destinationAccountId || accountId === destinationAccountId) {
        setError('Selecciona cuentas de origen y destino válidas');
        return;
      }

      const selectedAccount = accounts.find(acc => acc.id === accountId);
      const transactionOwner = selectedAccount?.owner || (currentUser === 'joint' ? 'shared' : currentUser);

      addTransfer({
        amount: Number(amount),
        sourceAccountId: accountId,
        destinationAccountId: destinationAccountId,
        date: finalDate,
        note: note || 'Transferencia',
        createdBy: transactionOwner // Assuming mapping, but actually backend handles createdBy from auth. owner field is for view filters.
      });

    } else {
      // Normal Transaction
      if (!accountId || !category) return;

      const selectedAccount = accounts.find(acc => acc.id === accountId);
      const transactionOwner = selectedAccount?.owner || (currentUser === 'joint' ? 'shared' : currentUser);

      addTransaction({
        amount: Number(amount),
        type,
        category: category as Category,
        accountId,
        date: finalDate,
        owner: transactionOwner,
        note,
        installments: selectedAccount?.type === 'credit' && installments > 1 ? { current: 1, total: installments } : undefined
      });
    }

    handleClose();
  };

  const handleClose = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setIsProcessing(false);
    onClose();
  };

  const handleNewCategory = () => {
    const name = prompt('Nombre de la nueva categoría:');
    if (name) {
      addCategory({
        name,
        type: type === 'expense' ? 'expense' : 'income', // Use current type
        color: '#8E8E93',
        icon: 'Tag'
      });
      setCategory(name);
    }
  };

  const selectedAccount = accounts.find(a => a.id === accountId);
  const isCreditCard = selectedAccount?.type === 'credit';

  // Helper to get emoji from icon name (simple mapping or fallback)
  const getCategoryEmoji = (iconName?: string) => {
    // You can expand this mapping
    const map: Record<string, string> = {
      'Coffee': '🍔', 'Car': '🚌', 'Home': '🏠', 'Film': '🎬',
      'Heart': '💊', 'ShoppingBag': '🛍️', 'Zap': '💡', 'MoreHorizontal': '📦',
      'Tag': '🏷️', 'DollarSign': '💰', 'Briefcase': '📈', 'Plane': '✈️', 'Book': '📚'
    };
    // Include emoji if it's already an emoji
    if (iconName && /\p{Emoji}/u.test(iconName)) return iconName;
    return map[iconName || ''] || '🏷️';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Nueva Transacción</h2>
          <button onClick={handleClose} className="close-btn"><X size={24} /></button>
        </div>

        {error && <div className="error-banner"><AlertCircle size={16} /> {error}</div>}

        {isProcessing ? (
          <div className="processing-view">
            {initialMode === 'camera' && streamRef.current ? (
              <div className="camera-container">
                <video ref={videoRef} autoPlay playsInline />
                <button onClick={capturePhoto} className="capture-btn"><Camera size={32} /></button>
              </div>
            ) : (
              <div className="loading-state">
                {isRecording ? <Mic className="pulse-icon" size={48} /> : <div className="spinner" />}
                <p>{processingMessage}</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="transaction-form">
            {/* Type Toggle */}
            <div className="type-toggle">
              {(['expense', 'income', 'transfer'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  className={`type-btn ${type === t ? 'active' : ''}`}
                  onClick={() => setType(t)}
                >
                  {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Transf.'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="amount-section">
              <span className="currency">$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className="amount-input"
              />
            </div>

            {/* Categories (Hide if Transfer) */}
            {type !== 'transfer' && (
              <div className="form-section">
                <label>Categoría</label>
                <div className="categories-grid">
                  {visibleCategories.map(cat => (
                    <button
                      key={cat.id || cat.name}
                      type="button"
                      className={`cat-item ${category === cat.name ? 'selected' : ''}`}
                      onClick={() => setCategory(cat.name)}
                      style={{ borderColor: category === cat.name ? cat.color : 'transparent' }}
                    >
                      <span className="cat-emoji">{getCategoryEmoji(cat.icon)}</span>
                      <span className="cat-name">{cat.name}</span>
                    </button>
                  ))}
                  <button type="button" className="cat-item new" onClick={handleNewCategory}>
                    <Plus size={20} />
                    <span>Nueva</span>
                  </button>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="details-grid">
              {type === 'transfer' ? (
                <>
                  <div className="form-group">
                    <label>Desde (Origen)</label>
                    <select value={accountId} onChange={e => setAccountId(e.target.value)}>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Hacia (Destino)</label>
                    <select value={destinationAccountId} onChange={e => setDestinationAccountId(e.target.value)}>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>Cuenta</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)}>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Fecha</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            {/* Credit Card Installments */}
            {isCreditCard && type === 'expense' && (
              <div className="form-group">
                <label>Cuotas</label>
                <select value={installments} onChange={e => setInstallments(Number(e.target.value))}>
                  {[1, 2, 3, 6, 12, 24, 36].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'cuota' : 'cuotas'}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Nota</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Descripción..."
                rows={2}
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={!amount || (type !== 'transfer' && !category) || (type === 'transfer' && (!accountId || !destinationAccountId || accountId === destinationAccountId))}
            >
              Guardar Transacción
            </button>
          </form>
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
            border-radius: 24px; max-height: 90vh; overflow-y: auto;
            display: flex; flex-direction: column;
            box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        }
        .modal-header {
            padding: 20px; border-bottom: 1px solid #eee;
            display: flex; justify-content: space-between; align-items: center;
        }
        .modal-header h2 { margin: 0; font-size: 1.2rem; }
        .close-btn { background: none; border: none; cursor: pointer; color: #666; }
        
        .transaction-form { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
        
        .type-toggle {
            display: flex; background: #f0f0f5; padding: 4px; border-radius: 12px;
        }
        .type-btn {
            flex: 1; padding: 10px; border: none; background: none;
            border-radius: 8px; font-weight: 500; color: #666; cursor: pointer;
        }
        .type-btn.active { background: white; color: #000; shadow: 0 2px 4px rgba(0,0,0,0.05); }
        
        .amount-section { display: flex; justify-content: center; align-items: center; gap: 5px; }
        .currency { font-size: 2rem; color: #999; }
        .amount-input {
            font-size: 2.5rem; font-weight: 700; border: none; outline: none;
            width: 200px; text-align: center; color: #333;
        }
        
        .form-section label, .form-group label {
            display: block; font-size: 0.85rem; font-weight: 600; color: #666; margin-bottom: 8px;
        }
        
        .categories-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
        }
        .cat-item {
            display: flex; flex-direction: column; align-items: center; gap: 5px;
            padding: 10px; background: #f9f9f9; border: 2px solid transparent;
            border-radius: 12px; cursor: pointer; transition: all 0.2s;
        }
        .cat-item.selected { background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .cat-emoji { font-size: 1.5rem; }
        .cat-name { font-size: 0.7rem; text-align: center; }
        .cat-item.new { color: #007AFF; border: 1px dashed #007AFF; background: #f0f9ff; }
        
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        
        select, input, textarea {
            width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 12px;
            font-size: 1rem; outline: none; background: white;
        }
        select:focus, input:focus, textarea:focus { border-color: #007AFF; }
        
        .submit-btn {
            background: #000; color: white; padding: 16px; border-radius: 16px;
            font-weight: 600; font-size: 1rem; border: none; cursor: pointer;
            margin-top: 10px;
        }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        
        .processing-view { padding: 40px; text-align: center; }
        .pulse-icon { animation: pulse 1s infinite; color: red; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .camera-container { position: relative; border-radius: 16px; overflow: hidden; }
        .camera-container video { width: 100%; }
        .capture-btn {
            position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: white; border-radius: 50%; pading: 15px; border: none;
        }
        
        .error-banner {
            background-color: #FEE2E2; color: #DC2626; padding: 10px; border-radius: 12px;
            display: flex; align-items: center; gap: 8px; font-size: 0.9rem; margin-bottom: 3px;
        }
      `}</style>
    </div>
  );
}
