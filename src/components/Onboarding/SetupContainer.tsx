'use client';

import React from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import CategorySelection from './CategorySelection';
import AccountSetup from './AccountSetup';
// We'll skip DashboardTour import here as it will be an overlay on the main dashboard

export default function SetupContainer() {
    const { currentStep, isLoading } = useOnboarding();

    if (isLoading) {
        return <div className="setup-loading">Cargando...</div>;
    }

    return (
        <div className="setup-wrapper">
            {currentStep === 'categories' && <CategorySelection />}
            {currentStep === 'accounts' && <AccountSetup />}
            {/* Import step is optional/skipped for now as per minimal viable onboarding */}
            {/* Tour is handled in the main layout/dashboard */}

            <style jsx>{`
        .setup-wrapper {
          min-height: 100vh;
          background: #f0f2f5;
        }
        .setup-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-size: 18px;
          color: #666;
        }
      `}</style>
        </div>
    );
}
