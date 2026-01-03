'use client';

import React, { useState } from 'react';
import { Upload, FileText, ArrowRight, SkipForward } from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';

export default function TransactionImport() {
    const { completeStep, nextStep, skipStep } = useOnboarding();
    const [isUploading, setIsUploading] = useState(false);

    // Mock upload handler for now
    const handleUpload = async () => {
        setIsUploading(true);
        // Simulate upload delay
        setTimeout(async () => {
            await completeStep('transactionsImported');
            setIsUploading(false);
            nextStep();
        }, 1500);
    };

    const handleSkip = () => {
        skipStep();
    };

    return (
        <div className="import-container">
            <div className="content-wrapper">
                <div className="header">
                    <div className="step-indicator">Paso 3 de 3</div>
                    <h1>Importar Transacciones</h1>
                    <p className="subtitle">
                        Si tienes un historial en CSV de otro banco o app, súbelo aquí.
                    </p>
                </div>

                <div className="upload-area">
                    <div className="upload-icon-wrapper">
                        <Upload size={48} strokeWidth={1.5} />
                    </div>
                    <h3>Sube tu archivo CSV</h3>
                    <p>Arrastra y suelta o haz clic para seleccionar</p>
                    <button className="select-file-btn" onClick={handleUpload} disabled={isUploading}>
                        {isUploading ? 'Procesando...' : 'Seleccionar Archivo'}
                    </button>
                </div>

                <div className="info-box">
                    <FileText size={20} />
                    <div className="info-text">
                        <strong>Nota:</strong> Puedes omitir este paso y hacerlo más tarde desde la configuración.
                    </div>
                </div>

                <div className="actions">
                    <button className="skip-btn" onClick={handleSkip}>
                        Omitir por ahora
                    </button>
                </div>
            </div>

            <style jsx>{`
        .import-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .content-wrapper {
          width: 100%;
          max-width: 600px;
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          text-align: center;
        }

        .header { margin-bottom: 40px; }
        .step-indicator {
          font-size: 12px; color: #6366f1; font-weight: 700;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        h1 { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px; }
        .subtitle { font-size: 15px; color: #64748b; }

        .upload-area {
          border: 2px dashed #e2e8f0;
          border-radius: 24px;
          padding: 40px;
          margin-bottom: 32px;
          transition: all 0.2s;
          background: #f8fafc;
        }
        .upload-area:hover {
          border-color: #6366f1;
          background: #eef2ff;
        }

        .upload-icon-wrapper {
          width: 80px; height: 80px;
          background: white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          color: #6366f1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .upload-area h3 { font-size: 18px; color: #1e293b; margin-bottom: 8px; }
        .upload-area p { color: #94a3b8; margin-bottom: 24px; font-size: 14px; }

        .select-file-btn {
          padding: 12px 24px;
          background: #6366f1; color: white;
          border: none; border-radius: 12px;
          font-weight: 600; cursor: pointer;
          transition: all 0.2s;
        }
        .select-file-btn:hover { background: #4f46e5; transform: translateY(-1px); }
        .select-file-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .info-box {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 16px;
          padding: 16px;
          display: flex; gap: 12px;
          text-align: left;
          color: #b45309;
          margin-bottom: 32px;
        }

        .actions {
          display: flex; justify-content: center;
        }

        .skip-btn {
          background: none; border: none;
          color: #64748b; font-weight: 600;
          cursor: pointer;
          padding: 12px 24px;
          border-radius: 12px;
        }
        .skip-btn:hover { background: #f1f5f9; color: #1e293b; }

        @media (max-width: 640px) {
          .content-wrapper { padding: 24px; }
        }
      `}</style>
        </div>
    );
}
