'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';

export interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: TourStep[] = [
    {
        targetId: 'balance-card',
        title: 'Tu Balance Total',
        description: 'Aquí ves tu patrimonio en tiempo real. Puedes alternar entre vista parcial (líquido) y total.',
        position: 'bottom'
    },
    {
        targetId: 'chart-section',
        title: 'Gráfico de Gastos',
        description: 'Visualiza en qué estás gastando tu dinero este mes de un vistazo.',
        position: 'top'
    },
    {
        targetId: 'ai-chat-btn',
        title: 'Asistente IA',
        description: '¿Dudas? Habla con tu asistente financiero para consejos o análisis rápidos.',
        position: 'top' // Since button is bottom-right
    },
    {
        targetId: 'fab-add-transaction',
        title: 'Registrar Movimientos',
        description: 'El botón más importante. Úsalo para registrar cada gasto o ingreso al instante.',
        position: 'top'
    }
];

export default function AppTour() {
    const [currentStep, setCurrentStep] = useState(-1);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check local storage
        const hasSeenTour = localStorage.getItem('fintrack_tour_completed');
        if (!hasSeenTour) {
            // Wait a bit for layout to settle
            setTimeout(() => startTour(), 1000);
        }
    }, []);

    const startTour = () => {
        setIsVisible(true);
        setCurrentStep(0);
    };

    const endTour = () => {
        setIsVisible(false);
        localStorage.setItem('fintrack_tour_completed', 'true');
    };

    useEffect(() => {
        if (currentStep >= 0 && currentStep < STEPS.length) {
            const step = STEPS[currentStep];
            const element = document.getElementById(step.targetId);
            if (element) {
                // Scroll to element smoothly
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Update rect after scroll
                setTimeout(() => {
                    const rect = element.getBoundingClientRect();
                    setTargetRect(rect);
                }, 500);
            } else {
                // Skip if element not found (e.g. mobile vs desktop differences)
                handleNext();
            }
        }
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            endTour();
        }
    };

    if (!isVisible || currentStep < 0 || !targetRect) return null;

    const step = STEPS[currentStep];
    const isLast = currentStep === STEPS.length - 1;

    // Calculate Tooltip Position
    const tooltipStyle: React.CSSProperties = { position: 'fixed' };
    const gutter = 16;

    if (step.position === 'bottom') {
        tooltipStyle.top = targetRect.bottom + gutter;
        tooltipStyle.left = targetRect.left + (targetRect.width / 2) - 140; // Center approx
    } else if (step.position === 'top') {
        tooltipStyle.bottom = (window.innerHeight - targetRect.top) + gutter;
        tooltipStyle.left = targetRect.left + (targetRect.width / 2) - 140;
    }

    // Boundary checks for mobile
    // Simplified logic, better libs do this automatically but for custom this works for vertical scroll apps
    if (Number(tooltipStyle.left) < 20) tooltipStyle.left = 20;

    return (
        <div className="tour-overlay">
            {/* Spotlight Effects */}
            {/* We use a massive box-shadow or SVG mask approach. Box-shadow is easiest. */}
            <div
                className="spotlight"
                style={{
                    top: targetRect.top,
                    left: targetRect.left,
                    width: targetRect.width,
                    height: targetRect.height,
                    borderRadius: window.getComputedStyle(document.getElementById(step.targetId) || document.body).borderRadius || '16px'
                }}
            />

            {/* Tooltip Card */}
            <div className="tour-card" style={tooltipStyle}>
                <div className="tour-header">
                    <span className="step-indicator">{currentStep + 1} / {STEPS.length}</span>
                    <button onClick={endTour} className="close-btn"><X size={16} /></button>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>

                <div className="tour-actions">
                    <button className="next-btn" onClick={handleNext}>
                        {isLast ? 'Finalizar' : 'Siguiente'}
                        {isLast ? <Check size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .tour-overlay {
                    position: fixed;
                    top: 0; left: 0; width: 100vw; height: 100vh;
                    z-index: 9999;
                    pointer-events: auto; /* Block interactions behind */
                }

                .spotlight {
                    position: absolute;
                    box-shadow: 0 0 0 9999px rgba(0,0,0,0.7); /* The dark overlay */
                    transition: all 0.4s ease;
                    pointer-events: none; /* Let clicks pass specific area if needed, but here we block all for guided tour */
                    z-index: 10000;
                    border: 2px solid rgba(255,255,255,0.5); /* Highlight border */
                }

                .tour-card {
                    width: 280px;
                    background: white;
                    border-radius: 20px;
                    padding: 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 10001;
                    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    transition: all 0.4s ease;
                }

                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }

                .tour-header {
                    display: flex; justify-content: space-between; margin-bottom: 8px;
                }
                .step-indicator {
                    font-size: 12px; font-weight: 600; color: #8E8E93;
                    background: #F2F2F7; padding: 2px 8px; border-radius: 100px;
                }
                .close-btn {
                    background: none; border: none; color: #8E8E93; cursor: pointer; padding: 0;
                }

                h3 {
                    margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #000;
                }
                p {
                    margin: 0 0 16px 0; font-size: 14px; color: #3C3C43; line-height: 1.4;
                }

                .tour-actions {
                    display: flex; justify-content: flex-end;
                }
                .next-btn {
                    background: #007AFF; color: white; border: none;
                    padding: 8px 16px; border-radius: 100px;
                    font-size: 14px; font-weight: 600;
                    display: flex; align-items: center; gap: 6px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,122,255,0.3);
                }
            `}</style>
        </div>
    );
}
