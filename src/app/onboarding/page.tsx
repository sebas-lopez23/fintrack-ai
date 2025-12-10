'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Send, Sparkles, Check, ArrowRight, Wallet, Target, PieChart, X } from 'lucide-react';
import { generateOnboardingPlan, OnboardingData } from '@/services/geminiService';

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<'intro' | 'input' | 'processing' | 'review'>('intro');
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [plan, setPlan] = useState<OnboardingData | null>(null);

    const [isTranscribing, setIsTranscribing] = useState(false);

    // Voice recording refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Import dynamically to avoid SSR issues with MediaRecorder if needed, 
    // but for now standard import is fine as this is a client component.
    const { transcribeAudio } = require('@/services/geminiService');

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                setIsRecording(false);
                setIsTranscribing(true);

                try {
                    const text = await transcribeAudio(audioBlob);
                    setInputText(prev => prev + (prev ? ' ' : '') + text);
                } catch (error) {
                    console.error(error);
                    alert('Error al transcribir el audio.');
                } finally {
                    setIsTranscribing(false);
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('No se pudo acceder al micrófono');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    const handleGeneratePlan = async () => {
        if (!inputText.trim()) return;

        setStep('processing');
        try {
            const data = await generateOnboardingPlan(inputText);
            setPlan(data);
            setStep('review');
        } catch (error) {
            console.error(error);
            alert('Hubo un error al generar tu plan. Intenta de nuevo.');
            setStep('input');
        }
    };

    const updateAccount = (index: number, field: string, value: any) => {
        if (!plan) return;
        const newAccounts = [...plan.accounts];
        newAccounts[index] = { ...newAccounts[index], [field]: value };
        setPlan({ ...plan, accounts: newAccounts });
    };

    const removeAccount = (index: number) => {
        if (!plan) return;
        const newAccounts = plan.accounts.filter((_, i) => i !== index);
        setPlan({ ...plan, accounts: newAccounts });
    };

    const addAccount = () => {
        if (!plan) return;
        setPlan({
            ...plan,
            accounts: [...plan.accounts, { name: 'Nueva Cuenta', type: 'bank', balance: 0, currency: 'COP' }]
        });
    };

    const updateCategory = (index: number, field: string, value: any) => {
        if (!plan) return;
        const newCategories = [...plan.categories];
        newCategories[index] = { ...newCategories[index], [field]: value };
        setPlan({ ...plan, categories: newCategories });
    };

    const updateGoal = (index: number, field: string, value: any) => {
        if (!plan) return;
        const newGoals = [...plan.goals];
        newGoals[index] = { ...newGoals[index], [field]: value };
        setPlan({ ...plan, goals: newGoals });
    };

    const handleFinish = () => {
        // Here we would save the plan to Supabase
        // await saveOnboardingData(plan);
        router.push('/');
    };

    return (
        <div className="onboarding-container">
            {step === 'intro' && (
                <div className="slide-content">
                    <div className="icon-wrapper">
                        <Sparkles size={48} className="text-primary" />
                    </div>
                    <h1>Bienvenido a FinTrack AI</h1>
                    <p>Soy tu arquitecto financiero personal. No necesitas configurar nada manualmente.</p>
                    <p>Solo cuéntame sobre tu vida financiera y yo construiré todo por ti.</p>
                    <button className="primary-btn" onClick={() => setStep('input')}>
                        Comenzar <ArrowRight size={20} />
                    </button>
                </div>
            )}

            {step === 'input' && (
                <div className="slide-content">
                    <h2>Cuéntame sobre ti</h2>
                    <p className="hint">
                        Ejemplo: "Tengo cuenta en Bancolombia y Nequi. Gasto en arriendo y comida. Quiero ahorrar para un carro."
                    </p>

                    <div className="input-area">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Escribe o habla aquí..."
                            rows={6}
                        />
                        <button
                            className={`mic-btn ${isRecording ? 'recording' : ''}`}
                            onMouseDown={handleStartRecording}
                            onMouseUp={handleStopRecording}
                            onTouchStart={handleStartRecording}
                            onTouchEnd={handleStopRecording}
                            disabled={isTranscribing}
                        >
                            <Mic size={24} />
                        </button>
                    </div>

                    {isTranscribing && (
                        <p className="transcribing-text">
                            <span className="spinner-small"></span> Escuchando y transcribiendo...
                        </p>
                    )}

                    <button
                        className="primary-btn"
                        onClick={handleGeneratePlan}
                        disabled={!inputText.trim() || isTranscribing}
                    >
                        Generar Mi Plan <Sparkles size={20} />
                    </button>
                </div>
            )}

            {step === 'processing' && (
                <div className="slide-content">
                    <div className="spinner"></div>
                    <h2>Analizando tus finanzas...</h2>
                    <p>Estoy creando tus cuentas, definiendo presupuestos y estructurando tus metas.</p>
                </div>
            )}

            {step === 'review' && plan && (
                <div className="slide-content review-mode">
                    <h2>¡Tu Plan Está Listo!</h2>
                    <p className="subtitle">Revisa y edita lo que necesites antes de continuar.</p>

                    <div className="persona-badge">{plan.userProfile.financialPersona}</div>
                    <p className="advice">"{plan.userProfile.advice}"</p>

                    <div className="plan-grid">
                        {/* Cuentas */}
                        <div className="plan-card">
                            <div className="card-header">
                                <div className="header-title"><Wallet size={16} /> Cuentas Detectadas</div>
                                <button className="add-btn-small" onClick={addAccount}>+ Agregar</button>
                            </div>
                            <div className="list-container">
                                {plan.accounts.map((acc, i) => (
                                    <div key={i} className="edit-row">
                                        <input
                                            className="input-name"
                                            value={acc.name}
                                            onChange={(e) => updateAccount(i, 'name', e.target.value)}
                                        />
                                        <div className="row-right">
                                            <span className="currency-symbol">$</span>
                                            <input
                                                className="input-amount"
                                                type="number"
                                                value={acc.balance}
                                                onChange={(e) => updateAccount(i, 'balance', Number(e.target.value))}
                                            />
                                            <button className="delete-btn" onClick={() => removeAccount(i)}><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Presupuestos */}
                        <div className="plan-card">
                            <div className="card-header"><PieChart size={16} /> Presupuestos Sugeridos</div>
                            <div className="list-container">
                                {plan.categories.map((cat, i) => (
                                    <div key={i} className="edit-row">
                                        <div className="icon-name">
                                            <span>{cat.icon}</span>
                                            <input
                                                className="input-name"
                                                value={cat.name}
                                                onChange={(e) => updateCategory(i, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="row-right">
                                            <span className="currency-symbol">$</span>
                                            <input
                                                className="input-amount"
                                                type="number"
                                                value={cat.budget}
                                                onChange={(e) => updateCategory(i, 'budget', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Metas */}
                        <div className="plan-card">
                            <div className="card-header"><Target size={16} /> Metas</div>
                            <div className="list-container">
                                {plan.goals.map((goal, i) => (
                                    <div key={i} className="edit-row">
                                        <input
                                            className="input-name"
                                            value={goal.name}
                                            onChange={(e) => updateGoal(i, 'name', e.target.value)}
                                        />
                                        <div className="row-right">
                                            <span className="currency-symbol">$</span>
                                            <input
                                                className="input-amount"
                                                type="number"
                                                value={goal.targetAmount}
                                                onChange={(e) => updateGoal(i, 'targetAmount', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {plan.goals.length === 0 && <p className="empty-text">No se detectaron metas.</p>}
                            </div>
                        </div>
                    </div>

                    <button className="primary-btn" onClick={handleFinish}>
                        Aplicar Plan y Entrar <Check size={20} />
                    </button>
                </div>
            )}
            <style jsx>{`
        /* iOS Native-like Styles */
        .onboarding-container {
          min-height: 100vh;
          background-color: #F2F2F7; /* iOS System Gray 6 */
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          color: #000;
          font-family: -apple-system, BlinkMacMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .slide-content {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .review-mode {
          align-items: stretch;
        }

        h1 {
          font-size: 34px;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-align: center;
          margin-bottom: 8px;
          color: #000;
        }

        h2 {
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 0.01em;
          color: #000;
          margin: 0;
        }

        p {
          font-size: 17px;
          line-height: 1.4;
          color: #3C3C4399; /* iOS Secondary Label */
          text-align: center;
        }

        .subtitle {
          text-align: left;
          margin-bottom: 20px;
        }

        /* iOS Card / Grouped List Style */
        .plan-card {
          background: #FFFFFF;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .card-header {
          padding: 16px;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #E5E5EA; /* iOS Separator */
        }

        .header-title {
          font-size: 20px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #000;
        }

        .add-btn-small {
          font-size: 15px;
          color: #007AFF; /* iOS Blue */
          background: none;
          border: none;
          font-weight: 500;
          cursor: pointer;
        }

        .list-container {
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
        }

        .edit-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #FFFFFF;
          position: relative;
        }

        /* Separator line that doesn't touch left edge (iOS style) */
        .edit-row:not(:last-child)::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 16px;
          right: 0;
          height: 1px;
          background-color: #E5E5EA;
        }

        .input-name {
          font-size: 17px;
          color: #000;
          border: none;
          background: transparent;
          width: 100%;
          font-weight: 400;
          padding: 0;
        }

        .input-name:focus {
          outline: none;
          color: #007AFF;
        }

        .row-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .currency-symbol {
          color: #3C3C4399;
          font-size: 17px;
        }

        .input-amount {
          font-size: 17px;
          color: #3C3C4399; /* Secondary label color for values */
          text-align: right;
          border: none;
          background: transparent;
          width: 100px;
          padding: 0;
        }

        .input-amount:focus {
          outline: none;
          color: #007AFF;
        }

        .delete-btn {
          color: #FF3B30; /* iOS Red */
          background: none;
          border: none;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        
        .delete-btn:hover {
          opacity: 1;
        }

        .icon-name {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .icon-name span {
          font-size: 20px;
        }

        /* Buttons */
        .primary-btn {
          background-color: #007AFF;
          color: white;
          font-size: 17px;
          font-weight: 600;
          padding: 14px;
          border-radius: 12px;
          border: none;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-top: 20px;
        }

        .primary-btn:active {
          background-color: #0062CC;
          transform: scale(0.98);
        }

        .primary-btn:disabled {
          background-color: #E5E5EA;
          color: #3C3C434D;
        }

        .mic-btn {
          position: absolute;
          bottom: 16px;
          right: 16px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: #007AFF;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,122,255,0.3);
          cursor: pointer;
        }

        .mic-btn.recording {
          background-color: #FF3B30;
          animation: pulse 1.5s infinite;
        }

        .input-area {
          position: relative;
          width: 100%;
          margin-bottom: 20px;
        }

        textarea {
          width: 100%;
          background: #FFFFFF;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-size: 17px;
          line-height: 1.4;
          min-height: 150px;
          resize: none;
          color: #000;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        textarea:focus {
          outline: none;
          box-shadow: 0 0 0 2px #007AFF33;
        }

        .persona-badge {
          align-self: flex-start;
          background-color: #E5E5EA;
          color: #000;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 100px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .advice {
          font-size: 22px;
          font-weight: 700;
          color: #000;
          text-align: left;
          line-height: 1.3;
          margin-bottom: 32px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #E5E5EA;
          border-top-color: #007AFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
      `}</style>
        </div>
    );
}
