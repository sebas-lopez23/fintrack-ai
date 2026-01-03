'use client';

import React from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import CategorySelection from './CategorySelection';
import AccountSetup from './AccountSetup';
import WelcomeCarousel from './WelcomeCarousel';
import TransactionImport from './TransactionImport';

export default function SetupContainer() {
  const { currentStep, isLoading } = useOnboarding();
  const router = useRouter();

  if (isLoading) {
    return <div className="setup-loading">Cargando...</div>;
  }

  // Redirect to dashboard if we hit the tour step (it happens there)
  if (currentStep === 'tour') {
    router.push('/dashboard');
    return <div className="setup-loading">Redirigiendo al Dashboard...</div>;
  }

  return (
    <div className="setup-wrapper">
      {currentStep === 'welcome' && <WelcomeCarousel />}
      {currentStep === 'categories' && <CategorySelection />}
      {currentStep === 'accounts' && <AccountSetup />}
      {currentStep === 'import' && <TransactionImport />}
      {/* Tour step redirects to dashboard automatically above */}

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
