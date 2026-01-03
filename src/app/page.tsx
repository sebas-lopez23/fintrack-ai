'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFinance } from '@/context/FinanceContext';
import WelcomeCarousel from '@/components/Onboarding/WelcomeCarousel';

export default function Home() {
  const router = useRouter();
  const { userId, isLoading } = useFinance();

  useEffect(() => {
    // If user is already logged in, skip welcome slides and go to dashboard
    if (!isLoading && userId) {
      router.push('/dashboard');
    }
  }, [userId, isLoading, router]);

  // While loading or if not logged in, show the carousel
  // The carousel will handle the "Get Started" -> Login flow
  return <WelcomeCarousel />;
}
