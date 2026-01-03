'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useOnboarding } from '@/context/OnboardingContext';

export default function OnboardingGuard() {
    const router = useRouter();
    const pathname = usePathname();
    const { isActive, currentStep, isLoading, userId } = useOnboarding();

    useEffect(() => {
        if (isLoading) return;

        if (isActive) {
            if (currentStep === 'welcome' && pathname !== '/welcome') {
                router.push('/welcome');
            } else if ((currentStep === 'categories' || currentStep === 'accounts' || currentStep === 'import') && pathname !== '/setup') {
                router.push('/setup');
            } else if (currentStep === 'tour' && pathname !== '/') {
                router.push('/');
            }
        } else {
            // If user is authenticated and onboarding is complete (or inactive)
            if (userId) {
                if (pathname === '/welcome' || pathname === '/setup') {
                    router.push('/');
                }
            } else {
                // User is NOT authenticated
                // Block /setup, but allow /welcome
                if (pathname === '/setup') {
                    router.push('/login');
                }
                // /welcome is allowed for guests
            }
        }
    }, [isActive, currentStep, isLoading, pathname, router, userId]);

    return null;
}
