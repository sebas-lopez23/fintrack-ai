'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className="toast-container">
            <div className={`toast toast-${type}`}>
                <div className="toast-icon">
                    {type === 'success' ? (
                        <CheckCircle size={20} />
                    ) : (
                        <XCircle size={20} />
                    )}
                </div>
                <span className="toast-message">{message}</span>
                <button className="toast-close" onClick={onClose}>
                    <X size={16} />
                </button>
            </div>

            <style jsx>{`
                .toast-container {
                    position: fixed;
                    top: max(20px, env(safe-area-inset-top));
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 2147483647;
                    animation: slideDown 0.3s ease-out;
                    pointer-events: none; /* Allow clicks through container area, re-enable on toast */
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }

                .toast {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 18px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    min-width: 300px;
                    max-width: 500px;
                    pointer-events: auto;
                }

                .toast-success {
                    background: #34C759;
                    color: white;
                }

                .toast-error {
                    background: #FF3B30;
                    color: white;
                }

                .toast-icon {
                    display: flex;
                    align-items: center;
                }

                .toast-message {
                    flex: 1;
                    font-size: 0.95rem;
                    font-weight: 500;
                }

                .toast-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }

                .toast-close:hover {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
}
