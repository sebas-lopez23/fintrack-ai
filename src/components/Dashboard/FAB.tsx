'use client';

import React, { useState } from 'react';
import { Plus, Mic, Camera, PenTool, X } from 'lucide-react';

interface Props {
  onAction: (mode: 'manual' | 'voice' | 'camera') => void;
}

export default function FAB({ onAction }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  const handleAction = (mode: 'manual' | 'voice' | 'camera') => {
    onAction(mode);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && <div className="overlay" onClick={toggle} />}

      <div className={`fab-container ${isOpen ? 'open' : ''}`}>
        {isOpen && (
          <div className="fab-options">
            <button className="fab-option" onClick={() => handleAction('voice')}>
              <span className="label">Voz</span>
              <div className="icon-circle"><Mic size={20} /></div>
            </button>
            <button className="fab-option" onClick={() => handleAction('camera')}>
              <span className="label">Foto</span>
              <div className="icon-circle"><Camera size={20} /></div>
            </button>
            <button className="fab-option" onClick={() => handleAction('manual')}>
              <span className="label">Manual</span>
              <div className="icon-circle"><PenTool size={20} /></div>
            </button>
          </div>
        )}

        <button className="fab-main" onClick={toggle}>
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 90;
          backdrop-filter: blur(2px);
        }

        .fab-container {
          position: fixed;
          bottom: 90px; /* Above bottom nav */
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .fab-main {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
          color: white;
          box-shadow: var(--shadow-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .fab-container.open .fab-main {
          transform: rotate(45deg);
          background: var(--color-surface);
          color: var(--color-text);
        }

        .fab-options {
          position: absolute;
          bottom: 70px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
          width: 200px;
        }

        .fab-option {
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideUp 0.2s ease-out forwards;
        }
        
        .fab-option:nth-child(1) { animation-delay: 0.1s; }
        .fab-option:nth-child(2) { animation-delay: 0.05s; }
        .fab-option:nth-child(3) { animation-delay: 0s; }

        .label {
          background-color: var(--color-surface);
          padding: 4px 8px;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          box-shadow: var(--shadow-md);
        }

        .icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background-color: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
          color: var(--color-primary);
          border: 1px solid var(--color-border);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
