import React, { useState } from 'react';
import type { UserProfile, FamilyGoal } from '../../types';
import OnboardingCard from './OnboardingCard';
import { Leaf, Clock, Trash, Heart, ListChecks, ArrowLeft, ArrowRight } from 'lucide-react';

interface GoalsStepProps {
  onNext: (data: Partial<UserProfile>) => void;
  onBack: () => void;
  data: Partial<UserProfile>;
}

const GoalsStep: React.FC<GoalsStepProps> = ({ onNext, onBack, data }) => {
  const [selectedGoals, setSelectedGoals] = useState<FamilyGoal[]>(data.goals ?? []);

  const handleSelectGoal = (goal: FamilyGoal) => {
    setSelectedGoals(prev => {
      if (prev.includes(goal)) {
        return prev.filter(g => g !== goal);
      }
      if (prev.length < 2) {
        return [...prev, goal];
      }
      return prev;
    });
  };
  
  const handleNext = () => {
    onNext({ goals: selectedGoals });
  };
  
  const options: { id: FamilyGoal; icon: React.ElementType; text: string }[] = [
    { id: 'eat_healthier', icon: Leaf, text: 'Comer melhor no dia a dia' },
    { id: 'organize_time', icon: Clock, text: 'Organizar melhor o tempo' },
    { id: 'reduce_waste', icon: Trash, text: 'Gastar menos com desperdício' },
    { id: 'kids_eat_better', icon: Heart, text: 'Fazer as crianças comerem melhor' },
    { id: 'plan_menus', icon: ListChecks, text: 'Planejar cardápios saudáveis' },
  ];

  return (
    <div className="text-center max-w-md w-full animate-fade-in">
        <h2 className="text-xl font-bold text-brand-text mb-2">O que você quer melhorar na alimentação da sua família?</h2>
        <p className="text-brand-text-secondary mb-6">Pode escolher até 2 objetivos.</p>
        
        <div className="grid grid-cols-2 gap-3">
             {options.map(option => (
                <OnboardingCard
                    key={option.id}
                    icon={option.icon}
                    text={option.text}
                    isSelected={selectedGoals.includes(option.id)}
                    onClick={() => handleSelectGoal(option.id)}
                    isTall
                />
            ))}
        </div>
        
        <div className="flex justify-between items-center mt-10 w-full">
            <button onClick={onBack} className="flex items-center gap-1.5 text-brand-text-secondary font-semibold hover:text-brand-text transition-colors text-base">
                <ArrowLeft size={18} /> Voltar
            </button>
            <button 
                onClick={handleNext} 
                disabled={selectedGoals.length === 0}
                className="flex items-center gap-1.5 bg-brand-primary text-white font-bold py-3 px-5 rounded-xl disabled:bg-gray-300 transition-colors text-base"
            >
                Próximo <ArrowRight size={18} />
            </button>
        </div>
    </div>
  );
};

export default GoalsStep;