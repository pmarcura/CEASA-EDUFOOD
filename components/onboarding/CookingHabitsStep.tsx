import React, { useState } from 'react';
import type { UserProfile, CookingResponsibility } from '../../types';
import OnboardingCard from './OnboardingCard';
import { User, Users, ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';

interface CookingHabitsStepProps {
  onNext: (data: Partial<UserProfile>) => void;
  onBack: () => void;
  data: Partial<UserProfile>;
}

const CookingHabitsStep: React.FC<CookingHabitsStepProps> = ({ onNext, onBack, data }) => {
  const [responsibility, setResponsibility] = useState<CookingResponsibility | undefined>(data.cookingResponsibility);
  const [frequency, setFrequency] = useState<number>(data.cookingFrequency ?? 4);

  const handleNext = () => {
    onNext({ cookingResponsibility: responsibility, cookingFrequency: frequency });
  };

  const options: { id: CookingResponsibility; icon: React.ElementType; text: string }[] = [
    { id: 'self', icon: User, text: 'Eu mesmo(a)' },
    { id: 'shared', icon: Users, text: 'Divido com alguém' },
    { id: 'delivery', icon: ShoppingCart, text: 'Às vezes peço comida' },
  ];

  return (
    <div className="text-center max-w-sm w-full animate-fade-in">
      <h2 className="text-xl font-bold text-brand-text mb-4">Quem costuma cuidar das refeições?</h2>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {options.map(option => (
          <OnboardingCard
            key={option.id}
            icon={option.icon}
            text={option.text}
            isSelected={responsibility === option.id}
            onClick={() => setResponsibility(option.id)}
            isTall
          />
        ))}
      </div>
      
      <h2 className="text-xl font-bold text-brand-text mb-4">Quantos dias por semana vocês cozinham em casa?</h2>
      <div className="bg-brand-surface p-4 rounded-xl shadow-sm">
        <p className="text-3xl font-bold text-brand-primary mb-2">{frequency}</p>
        <input
          type="range"
          min="0"
          max="7"
          value={frequency}
          onChange={(e) => setFrequency(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
        />
        <div className="flex justify-between text-xs text-brand-text-secondary mt-1">
          <span>0 dias</span>
          <span>7 dias</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-10 w-full">
         <button onClick={onBack} className="flex items-center gap-1.5 text-brand-text-secondary font-semibold hover:text-brand-text transition-colors text-base">
            <ArrowLeft size={18} /> Voltar
         </button>
         <button 
            onClick={handleNext} 
            disabled={!responsibility}
            className="flex items-center gap-1.5 bg-brand-primary text-white font-bold py-3 px-5 rounded-xl disabled:bg-gray-300 transition-colors text-base"
        >
            Próximo <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default CookingHabitsStep;