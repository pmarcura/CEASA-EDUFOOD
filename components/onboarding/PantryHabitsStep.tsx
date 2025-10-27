import React, { useState } from 'react';
import type { UserProfile, PantryManagementHabit } from '../../types';
import OnboardingCard from './OnboardingCard';
import { ListTodo, Brain, HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';

interface PantryHabitsStepProps {
  onNext: (data: Partial<UserProfile>) => void;
  onBack: () => void;
  data: Partial<UserProfile>;
}

const PantryHabitsStep: React.FC<PantryHabitsStepProps> = ({ onNext, onBack, data }) => {
  const [habit, setHabit] = useState<PantryManagementHabit | undefined>(data.pantryHabit);

  const handleNext = () => {
    onNext({ pantryHabit: habit });
  };
  
  const options: { id: PantryManagementHabit; icon: React.ElementType; text: string }[] = [
    { id: 'organized', icon: ListTodo, text: 'Sim, tenho tudo anotado' },
    { id: 'tries', icon: Brain, text: 'Mais ou menos… tento lembrar' },
    { id: 'chaotic', icon: HelpCircle, text: 'Não, nunca sei o que ainda tem 😅' },
  ];

  return (
     <div className="text-center max-w-md w-full animate-fade-in">
        <h2 className="text-xl font-bold text-brand-text mb-6">Você costuma controlar os alimentos que tem em casa?</h2>
        
        <div className="space-y-3">
             {options.map(option => (
                <OnboardingCard
                    key={option.id}
                    icon={option.icon}
                    text={option.text}
                    isSelected={habit === option.id}
                    onClick={() => setHabit(option.id)}
                    isWide
                />
            ))}
        </div>
        
        <div className="flex justify-between items-center mt-10 w-full">
            <button onClick={onBack} className="flex items-center gap-1.5 text-brand-text-secondary font-semibold hover:text-brand-text transition-colors text-base">
                <ArrowLeft size={18} /> Voltar
            </button>
            <button 
                onClick={handleNext} 
                disabled={!habit}
                className="flex items-center gap-1.5 bg-brand-primary text-white font-bold py-3 px-5 rounded-xl disabled:bg-gray-300 transition-colors text-base"
            >
                Próximo <ArrowRight size={18} />
            </button>
        </div>
     </div>
  );
};

export default PantryHabitsStep;