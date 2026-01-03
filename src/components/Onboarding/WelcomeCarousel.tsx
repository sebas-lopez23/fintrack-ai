'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Wallet, PieChart, Users, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useOnboarding } from '@/context/OnboardingContext';

interface Slide {
    icon: React.ReactNode;
    title: string;
    description: string;
    gradient: string;
}

const SLIDES: Slide[] = [
    {
        icon: <Sparkles size={64} />,
        title: 'Bienvenido a FinTrack AI',
        description: 'Tu asistente financiero personal impulsado por inteligencia artificial. Gestiona tus finanzas de manera inteligente y alcanza tus metas.',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
        icon: <TrendingUp size={64} />,
        title: 'Análisis Inteligente',
        description: 'Obtén insights personalizados sobre tus gastos, identifica patrones y recibe recomendaciones para mejorar tus finanzas.',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
        icon: <Wallet size={64} />,
        title: 'Multi-Cuenta',
        description: 'Administra todas tus cuentas bancarias, tarjetas de crédito y efectivo en un solo lugar. Control total de tu patrimonio.',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
        icon: <PieChart size={64} />,
        title: 'Presupuestos Automáticos',
        description: 'Crea presupuestos por categoría y recibe alertas cuando te acerques al límite. Planifica con confianza.',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
        icon: <Users size={64} />,
        title: 'Finanzas en Pareja',
        description: 'Comparte cuentas y gastos con tu pareja. Gestionen juntos su hogar con transparencia total.',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
];

export default function WelcomeCarousel() {
    const router = useRouter();
    const { completeStep } = useOnboarding();
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            handleGetStarted();
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const handleGetStarted = async () => {
        await completeStep('welcomeCarouselCompleted');
        router.push('/login');
    };

    const slide = SLIDES[currentSlide];
    const isLastSlide = currentSlide === SLIDES.length - 1;

    return (
        <div className="welcome-container">
            <div className="carousel-wrapper">
                {/* Progress Dots */}
                <div className="progress-dots">
                    {SLIDES.map((_, index) => (
                        <button
                            key={index}
                            className={`dot ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Slide Content */}
                <div className="slide-container">
                    <div
                        className="icon-wrapper"
                        style={{ background: slide.gradient }}
                    >
                        {slide.icon}
                    </div>

                    <h1 className="slide-title">{slide.title}</h1>
                    <p className="slide-description">{slide.description}</p>
                </div>

                {/* Navigation */}
                <div className="nav-controls">
                    {currentSlide > 0 && (
                        <button className="nav-btn prev" onClick={handlePrev}>
                            <ChevronLeft size={24} />
                        </button>
                    )}

                    <button
                        className="primary-btn"
                        onClick={handleNext}
                    >
                        {isLastSlide ? 'Comenzar' : 'Siguiente'}
                        {isLastSlide ? <ArrowRight size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>

                {/* Skip Button */}
                {!isLastSlide && (
                    <button className="skip-btn" onClick={handleGetStarted}>
                        Saltar
                    </button>
                )}
            </div>

            <style jsx>{`
        .welcome-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
        }

        .welcome-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.3;
        }

        .carousel-wrapper {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: var(--radius-lg);
          padding: 60px 40px 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .progress-dots {
          position: absolute;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(0,0,0,0.2);
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .dot.active {
          width: 24px;
          border-radius: 4px;
          background: var(--color-primary);
        }

        .slide-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .icon-wrapper {
          width: 120px;
          height: 120px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 32px;
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
        }

        .slide-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--color-text-main);
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }

        .slide-description {
          font-size: 16px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          margin-bottom: 40px;
        }

        .nav-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
        }

        .nav-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(0,0,0,0.05);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--color-text-main);
        }

        .nav-btn:hover {
          background: rgba(0,0,0,0.1);
          transform: scale(1.05);
        }

        .primary-btn {
          flex: 1;
          max-width: 250px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 28px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          border: none;
          border-radius: var(--radius-pill);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(99, 102, 241, 0.4);
        }

        .primary-btn:active {
          transform: translateY(0);
        }

        .skip-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          background: none;
          border: none;
          color: var(--color-text-light);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px;
          transition: color 0.2s;
        }

        .skip-btn:hover {
          color: var(--color-text-main);
        }

        @media (max-width: 640px) {
          .carousel-wrapper {
            padding: 50px 24px 32px;
          }

          .icon-wrapper {
            width: 100px;
            height: 100px;
            margin-bottom: 24px;
          }

          .slide-title {
            font-size: 24px;
          }

          .slide-description {
            font-size: 15px;
          }
        }
      `}</style>
        </div>
    );
}
