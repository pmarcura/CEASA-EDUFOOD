
import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { User, UserProfile } from '../types';

import WelcomeStep from './onboarding/WelcomeStep';
import CookingHabitsStep from './onboarding/CookingHabitsStep';
import FamilyProfileStep from './onboarding/FamilyProfileStep';
import GoalsStep from './onboarding/GoalsStep';
import PantryHabitsStep from './onboarding/PantryHabitsStep';
import SummaryStep from './onboarding/SummaryStep';
import ProgressBar from './onboarding/ProgressBar';
import { LoaderCircle } from 'lucide-react';

interface OnboardingFlowProps {
  user: User;
}

const TOTAL_STEPS = 6;

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<Partial<UserProfile>>({
    onboardingCompleted: false,
    goals: [],
    children: [],
    dietaryRestrictions: [],
  });

  const handleNext = (data: Partial<UserProfile> = {}) => {
    setProfileData(prev => ({ ...prev, ...data }));
    if (step < TOTAL_STEPS) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinish = async (data: Partial<UserProfile> = {}) => {
    setIsLoading(true);
    const finalProfile: UserProfile = {
      ...profileData,
      ...data,
      onboardingCompleted: true,
    };
    
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, finalProfile, { merge: true });
        // The App component will detect the change and switch views.
    } catch (error) {
        console.error("Error saving user profile:", error);
        setIsLoading(false);
        // Optionally show an error message to the user
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center p-4 text-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-brand-primary mb-4" />
        <h2 className="text-2xl font-bold text-brand-text">Salvando seu perfil...</h2>
        <p className="text-brand-text-secondary">Estamos preparando tudo para você!</p>
      </div>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return <CookingHabitsStep onNext={handleNext} onBack={handleBack} data={profileData} />;
      case 3:
        return <FamilyProfileStep onNext={handleNext} onBack={handleBack} data={profileData} />;
      case 4:
        return <GoalsStep onNext={handleNext} onBack={handleBack} data={profileData} />;
      case 5:
        return <PantryHabitsStep onNext={handleNext} onBack={handleBack} data={profileData} />;
      case 6:
        return <SummaryStep onFinish={handleFinish} onBack={handleBack} />;
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex flex-col items-center justify-between p-4">
        <div className="w-full max-w-md mt-8">
            {step > 1 && <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />}
        </div>
        <div className="flex-grow flex items-center justify-center w-full">
            {renderStep()}
        </div>
        <div className="h-16"></div> 
    </div>
  );
};

export default OnboardingFlow;
