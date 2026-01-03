'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface OnboardingProgress {
    welcomeCarouselCompleted: boolean;
    categoriesSelected: boolean;
    accountsCreated: boolean;
    transactionsImported: boolean;
    dashboardTourCompleted: boolean;
}

export type OnboardingStep = 'welcome' | 'categories' | 'accounts' | 'import' | 'tour' | 'complete';

interface OnboardingContextType {
    isActive: boolean;
    currentStep: OnboardingStep;
    progress: OnboardingProgress;
    setStep: (step: OnboardingStep) => void;
    completeStep: (step: keyof OnboardingProgress) => Promise<void>;
    skipStep: () => void;
    nextStep: () => void;
    prevStep: () => void;
    completeOnboarding: () => Promise<void>;
    resetOnboarding: () => Promise<void>;
    isLoading: boolean;
    userId: string | null;
    tourStepIndex: number;
    setTourStepIndex: (index: number) => void;
    totalTourSteps: number;
    restartTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STEP_ORDER: OnboardingStep[] = ['welcome', 'categories', 'accounts', 'import', 'tour', 'complete'];

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
    const [progress, setProgress] = useState<OnboardingProgress>({
        welcomeCarouselCompleted: false,
        categoriesSelected: false,
        accountsCreated: false,
        transactionsImported: false,
        dashboardTourCompleted: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [tourStepIndex, setTourStepIndex] = useState(0);

    // Initialize onboarding state from Supabase
    useEffect(() => {
        const initOnboarding = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setIsLoading(false);
                return;
            }

            setUserId(user.id);

            // Check if user has onboarding record
            const { data: onboardingData, error } = await supabase
                .from('user_onboarding')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                // Error other than "not found"
                console.error('Error fetching onboarding data:', error);
                setIsLoading(false);
                return;
            }

            if (!onboardingData) {
                // New user - create onboarding record
                const { error: insertError } = await supabase
                    .from('user_onboarding')
                    .insert({
                        user_id: user.id,
                        welcome_carousel_completed: false,
                        categories_selected: false,
                        accounts_created: false,
                        transactions_imported: false,
                        dashboard_tour_completed: false,
                    });

                if (insertError) {
                    console.error('Error creating onboarding record:', insertError);
                }

                setIsActive(true);
                setCurrentStep('welcome');
                setIsLoading(false);
                return;
            }

            // Check if onboarding is complete
            // AUTO-FIX: Check localStorage as fallback if DB persistence failed previously
            const localCompleted = typeof window !== 'undefined' && localStorage.getItem('fintrack_onboarding_completed') === 'true';

            const isComplete =
                localCompleted ||
                (onboardingData.welcome_carousel_completed &&
                    onboardingData.categories_selected &&
                    onboardingData.accounts_created &&
                    onboardingData.dashboard_tour_completed);

            if (isComplete) {
                setIsActive(false);
                setCurrentStep('complete');
            } else {
                setIsActive(true);
                // Determine current step based on progress
                if (!onboardingData.welcome_carousel_completed) setCurrentStep('welcome');
                else if (!onboardingData.categories_selected) setCurrentStep('categories');
                else if (!onboardingData.accounts_created) setCurrentStep('accounts');
                else if (!onboardingData.dashboard_tour_completed) setCurrentStep('tour');
            }

            setProgress({
                welcomeCarouselCompleted: onboardingData.welcome_carousel_completed || localCompleted,
                categoriesSelected: onboardingData.categories_selected || localCompleted,
                accountsCreated: onboardingData.accounts_created || localCompleted,
                transactionsImported: onboardingData.transactions_imported || localCompleted,
                dashboardTourCompleted: onboardingData.dashboard_tour_completed || localCompleted,
            });

            setIsLoading(false);
        };

        initOnboarding();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
            } else {
                setUserId(null);
                setIsActive(false);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const completeStep = async (step: keyof OnboardingProgress) => {
        if (!userId) return;

        // Update local state
        setProgress(prev => ({ ...prev, [step]: true }));

        // Update Supabase
        const dbField = step
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase();

        const { error } = await supabase
            .from('user_onboarding')
            .update({
                [dbField]: true,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (error) {
            console.error('Error updating onboarding progress:', error);
        }
    };

    const setStep = (step: OnboardingStep) => {
        setCurrentStep(step);
    };

    const nextStep = () => {
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex < STEP_ORDER.length - 1) {
            setCurrentStep(STEP_ORDER[currentIndex + 1]);
        }
    };

    const prevStep = () => {
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(STEP_ORDER[currentIndex - 1]);
        }
    };

    const skipStep = () => {
        nextStep();
    };

    const completeOnboarding = async () => {
        // ALWAYS close the modal first for immediate UI feedback
        setIsActive(false);
        setCurrentStep('complete');

        // SAFETY: Persist to localStorage immediately
        if (typeof window !== 'undefined') {
            localStorage.setItem('fintrack_onboarding_completed', 'true');
        }

        if (!userId) return;

        try {
            const { error } = await supabase
                .from('user_onboarding')
                .update({
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    dashboard_tour_completed: true // Ensure this is definitely set
                })
                .eq('user_id', userId);

            if (error) {
                console.error('Error completing onboarding (Supabase):', error);
            }
        } catch (err) {
            console.error('Exception completing onboarding:', err);
        }
    };

    const resetOnboarding = async () => {
        if (!userId) return;

        setProgress({
            welcomeCarouselCompleted: false,
            categoriesSelected: false,
            accountsCreated: false,
            transactionsImported: false,
            dashboardTourCompleted: false,
        });
        setCurrentStep('welcome');
        setIsActive(true);

        if (typeof window !== 'undefined') {
            localStorage.removeItem('fintrack_onboarding_completed');
        }

        const { error } = await supabase
            .from('user_onboarding')
            .update({
                welcome_carousel_completed: false,
                categories_selected: false,
                accounts_created: false,
                transactions_imported: false,
                dashboard_tour_completed: false,
                completed_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

        if (error) {
            console.error('Error resetting onboarding:', error);
        }
    };

    const restartTour = () => {
        setTourStepIndex(0);
        setCurrentStep('tour');
        setIsActive(true);
        // Supabase update is optional here, we treat it as a temporary replay
    };

    return (
        <OnboardingContext.Provider
            value={{
                isActive,
                currentStep,
                progress,
                setStep,
                completeStep,
                skipStep,
                nextStep,
                prevStep,
                completeOnboarding,
                resetOnboarding,
                isLoading,
                userId,
                tourStepIndex,
                setTourStepIndex,
                totalTourSteps: 9,
                restartTour,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
