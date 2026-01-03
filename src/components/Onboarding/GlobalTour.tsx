'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';

interface TourStep {
    targetId?: string;
    title: string;
    content: string;
    path: string;
    placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
    // Dashboard Steps
    {
        title: '¡Bienvenido a tu Nuevo Dashboard!',
        content: 'Aquí tendrás una vista general de tus finanzas. Vamos a conocer las funciones clave.',
        path: '/',
        placement: 'center'
    },
    {
        targetId: 'fab-button',
        title: 'Acciones Rápidas',
        content: 'Usa este botón para registrar gastos, ingresos o crear presupuestos rápidamente.',
        path: '/',
        placement: 'top' // FAB is usually bottom right
    },
    {
        targetId: 'nav-item-billetera',
        title: 'Tu Billetera',
        content: 'Aquí verás todas tus cuentas bancarias, tarjetas y efectivo.',
        path: '/',
        placement: 'right' // Sidebar is left
    },
    // Wallet Page Steps
    {
        title: 'Gestión de Cuentas',
        content: 'En esta sección puedes administrar tus cuentas y monitorear tus saldos.',
        path: '/accounts',
        placement: 'center'
    },
    {
        targetId: 'btn-add-account',
        title: 'Agrega más Cuentas',
        content: 'Crea nuevas cuentas o tarjetas para mantener todo organizado.',
        path: '/accounts',
        placement: 'bottom'
    },
    {
        targetId: 'nav-item-movimientos',
        title: 'Historial de Transacciones',
        content: 'Vamos a ver dónde consultar tus gastos e ingresos detallados.',
        path: '/accounts',
        placement: 'right'
    },
    // Transactions Page Steps
    {
        title: 'Tus Movimientos',
        content: 'Revisa cada transacción en detalle, filtra por fecha o categoría.',
        path: '/transactions',
        placement: 'center'
    },
    {
        targetId: 'btn-filter-transactions',
        title: 'Filtros Avanzados',
        content: 'Encuentra transacciones específicas usando los filtros por categoría, cuenta o monto.',
        path: '/transactions',
        placement: 'bottom'
    },
    {
        title: '¡Todo Listo!',
        content: 'Ya conoces lo básico. ¡Empieza a tomar el control de tus finanzas con FinTrack AI!',
        path: '/transactions',
        placement: 'center'
    }
];

export default function GlobalTour() {
    const { isActive, currentStep, tourStepIndex, setTourStepIndex, completeOnboarding, userId } = useOnboarding();
    const pathname = usePathname();
    const router = useRouter();
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const step = TOUR_STEPS[tourStepIndex] || TOUR_STEPS[0];
    const shouldRender = mounted && isActive && currentStep === 'tour';

    // Handle Navigation Logic
    // If current step path doesn't match current pathname, redirect
    useEffect(() => {
        if (!shouldRender) return;
        if (pathname !== step.path) {
            router.push(step.path);
        }
    }, [tourStepIndex, pathname, step.path, router, shouldRender]);

    // Calculate Position
    useEffect(() => {
        if (!shouldRender) return;

        if (!step.targetId) {
            setCoords(null); // Center mode
            return;
        }

        const updatePosition = () => {
            const element = document.getElementById(step.targetId!);
            if (element) {
                const rect = element.getBoundingClientRect();
                // Since container is fixed, use viewport coordinates (rect) directly
                // Do NOT add window.scrollY/X
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
            } else {
                // If element not found (e.g. sidebar closed), fallback to center or keep looking
                // For now, let's just nullify coords to center it if target is missing?
                // Or maybe just let it fail gracefully? 
                // Let's set coords to null so it centers if element is missing/invisible (e.g. sidebar closed offscreen?)
                // Actually, sidebar exists but is offscreen. rect.left might be negative.
                // Let's keep it but if it's way off screen, maybe handle that?
            }
        };

        // Initial check
        updatePosition();

        // Polling for element appearance (useful after route changes)
        const interval = setInterval(updatePosition, 500);

        // Resize listener
        window.addEventListener('resize', updatePosition);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', updatePosition);
        };
    }, [step.targetId, pathname, shouldRender]); // Re-run when target or path changes

    // Don't render content if not active or not on the right page
    if (!shouldRender || pathname !== step.path) return null;

    const handleNext = () => {
        if (tourStepIndex < TOUR_STEPS.length - 1) {
            setTourStepIndex(tourStepIndex + 1);
        } else {
            completeOnboarding();
        }
    };

    const handleBack = () => {
        if (tourStepIndex > 0) {
            setTourStepIndex(tourStepIndex - 1);
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    // Render logic
    const isCentered = !step.targetId || !coords;

    const renderTooltip = () => {
        const style: React.CSSProperties = {};

        if (!isCentered && coords) {
            const pos = getTooltipPosition(step.placement, coords);
            style.top = pos.top;
            style.left = pos.left;
        }

        return (
            <div
                className={`tour-tooltip ${isCentered ? 'centered' : ''}`}
                style={style}
            >
                <div className="tooltip-header">
                    <h3>{step.title}</h3>
                    <button onClick={handleSkip} className="close-btn"><X size={16} /></button>
                </div>
                <p className="tooltip-content">{step.content}</p>
                <div className="tooltip-footer">
                    <span className="step-indicator">{tourStepIndex + 1} / {TOUR_STEPS.length}</span>
                    <div className="tooltip-actions">
                        {tourStepIndex > 0 && (
                            <button onClick={handleBack} className="btn-secondary">
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <button onClick={handleNext} className="btn-primary">
                            {tourStepIndex === TOUR_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
                            {tourStepIndex !== TOUR_STEPS.length - 1 && <ArrowRight size={16} />}
                            {tourStepIndex === TOUR_STEPS.length - 1 && <Check size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return createPortal(
        <div className="tour-overlay-container">
            {/* Spotlight Mask - Render this OR the plain overlay, not both to avoid double dimming */}
            {!isCentered && coords ? (
                <div className="spotlight-mask" style={{
                    top: coords.top,
                    left: coords.left,
                    width: coords.width,
                    height: coords.height
                }} />
            ) : (
                <div className="tour-overlay" />
            )}

            {renderTooltip()}

            <style jsx global>{`
                .tour-overlay-container {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 9999;
                    pointer-events: none; /* Allow clicks to pass through except on tooltip */
                }

                .tour-overlay {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    pointer-events: auto; /* Catch clicks on background */
                }

                /* If we have coords, we can make the background transparent around the target. 
                   With simple CSS, this is hard without box-shadow hack. 
                   Using box-shadow hack for spotlight effect. 
                */
                .spotlight-mask {
                    position: absolute;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    pointer-events: none;
                    z-index: 10000;
                    /* Pulse animation */
                    animation: pulse-border 2s infinite;
                }

                @keyframes pulse-border {
                    0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7), 0 0 0 9999px rgba(0, 0, 0, 0.6); }
                    70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0), 0 0 0 9999px rgba(0, 0, 0, 0.6); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0), 0 0 0 9999px rgba(0, 0, 0, 0.6); }
                }

                .tour-tooltip {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(12px);
                    padding: 20px;
                    border-radius: 20px;
                    width: 300px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.5);
                    pointer-events: auto;
                    z-index: 10001;
                    transition: all 0.3s ease;
                    animation: floatIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .tour-tooltip.centered {
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }

                @keyframes floatIn {
                    from { opacity: 0; transform: translateY(10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .tooltip-header {
                    display: flex; justify-content: space-between; align-items: start;
                    margin-bottom: 12px;
                }

                .tooltip-header h3 {
                    font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0;
                }

                .close-btn {
                    background: none; border: none; cursor: pointer; color: #94a3b8;
                    padding: 4px; transition: color 0.2s;
                }
                .close-btn:hover { color: #ef4444; }

                .tooltip-content {
                    font-size: 0.95rem; color: #475569; line-height: 1.5; margin-bottom: 20px;
                }

                .tooltip-footer {
                    display: flex; justify-content: space-between; align-items: center;
                }

                .step-indicator {
                    font-size: 0.8rem; font-weight: 600; color: #94a3b8;
                }

                .tooltip-actions {
                    display: flex; gap: 8px;
                }

                .btn-primary, .btn-secondary {
                    display: flex; align-items: center; gap: 6px;
                    padding: 8px 16px; border-radius: 10px; font-weight: 600; font-size: 0.9rem;
                    cursor: pointer; transition: all 0.2s; border: none;
                }

                .btn-primary {
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
                }

                .btn-secondary {
                    background: #f1f5f9; color: #64748b;
                }
                .btn-secondary:hover {
                    background: #e2e8f0; color: #1e293b;
                }
            `}</style>
        </div>
        , document.body);
}

function getTooltipPosition(placement: string, coords: { top: number; left: number; width: number; height: number }) {
    const gap = 15;
    const tooltipWidth = 300;

    // Safety check for window dimensions (client side only)
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;

    let top = 0;
    let left = 0;

    switch (placement) {
        case 'top':
            top = coords.top - gap - 150; // Approximated height needs to be better handled but CSS handles overflow usually? No, absolute.
            // Better to position bottom up? NO just set top.
            left = coords.left + (coords.width / 2) - (tooltipWidth / 2);
            break;
        case 'bottom':
            top = coords.top + coords.height + gap;
            left = coords.left + (coords.width / 2) - (tooltipWidth / 2);
            break;
        case 'left':
            top = coords.top;
            left = coords.left - tooltipWidth - gap;
            break;
        case 'right':
            top = coords.top;
            left = coords.left + coords.width + gap;
            break;
        default: // center
            // Handled by CSS class 'centered' usually, but if we fall here:
            top = viewportHeight / 2 - 100;
            left = viewportWidth / 2 - 150;
    }

    // CLAMPING LOGIC
    // Ensure left is at least 10px
    if (left < 10) left = 10;
    // Ensure right doesn't overflow
    if (left + tooltipWidth > viewportWidth - 10) left = viewportWidth - tooltipWidth - 10;

    // Ensure top is at least 10px
    if (top < 10) top = 10;
    // Ensure bottom doesn't overflow (assuming ~200px height for safety? can't know dynamic height easily without ref)
    // We'll just clamp top mainly.
    // If placement was top and we clamped it down, it might cover the element.
    // Ideally we flip, but that's complex. Clamping is a good first step.

    return { top, left };
}
