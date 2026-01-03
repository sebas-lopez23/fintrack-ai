'use client';

import React, { useState } from 'react';
import { Plus, Mic, Camera, PenTool, X, FileText } from 'lucide-react';

interface Props {
  onAction: (mode: 'manual' | 'voice' | 'camera' | 'pdf') => void;
}

export default function FAB({ onAction }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  const handleAction = (mode: 'manual' | 'voice' | 'camera' | 'pdf') => {
    onAction(mode);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && <div className="overlay" onClick={toggle} />}

      <div className={`fab-container ${isOpen ? 'open' : ''}`}>
        {isOpen && (
          <div className="fab-options">
            {/* Unified Glass Pill Buttons */}
            <button className="fab-pill" onClick={() => handleAction('pdf')}>
              <span className="label-text">Extracto</span>
              <div className="icon-wrapper"><FileText size={20} /></div>
            </button>

            <button className="fab-pill" onClick={() => handleAction('voice')}>
              <span className="label-text">Voz</span>
              <div className="icon-wrapper"><Mic size={20} /></div>
            </button>

            <button className="fab-pill" onClick={() => handleAction('camera')}>
              <span className="label-text">Foto</span>
              <div className="icon-wrapper"><Camera size={20} /></div>
            </button>

            <button className="fab-pill" onClick={() => handleAction('manual')}>
              <span className="label-text">Manual</span>
              <div className="icon-wrapper"><PenTool size={20} /></div>
            </button>
          </div>
        )}

        <button id="fab-button" className="fab-main" onClick={toggle}>
          {isOpen ? <X size={32} /> : <Plus size={32} />}
        </button>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.3); /* Lighter overlay */
          z-index: 90;
          backdrop-filter: blur(8px); /* Strong blur */
        }

        .fab-container {
          position: fixed;
          bottom: 100px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .fab-main {
          width: 72px; /* Large main button */
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .fab-main:active {
          transform: scale(0.9);
        }
        
        .fab-container.open .fab-main {
          transform: rotate(45deg);
          background: linear-gradient(135deg, #ef4444, #b91c1c); /* Red on close */
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
        }

        .fab-options {
          position: absolute;
          bottom: 90px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          width: max-content;
        }

        /* The Pill Button - purely glass, no hard edges */
        .fab-pill {
          display: flex;
          align-items: center;
          justify-content: flex-end; /* Align to right */
          gap: 16px;
          padding: 8px 8px 8px 24px;
          background: rgba(255, 255, 255, 0.85); /* Highly opaque glass */
          border: 1px solid white;
          border-radius: 999px; /* Absolute pill */
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
          color: var(--color-text-main);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          min-width: 180px;
        }
        
        .fab-pill:active { transform: scale(0.95) translateY(0); }
        
        .fab-pill:nth-child(1) { animation-delay: 0.1s; }
        .fab-pill:nth-child(2) { animation-delay: 0.08s; }
        .fab-pill:nth-child(3) { animation-delay: 0.06s; }
        .fab-pill:nth-child(4) { animation-delay: 0.04s; }

        .icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
        }
        
        .label-text {
          color: var(--color-text-main);
        }

        @keyframes slideUp {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
