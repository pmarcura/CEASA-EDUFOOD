
import React from 'react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="text-center max-w-sm w-full animate-fade-in">
       <img 
          src="/professor-nutri.png" 
          alt="Professor Nutri Mascot" 
          className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto mb-6"
      />
      <h1 className="text-2xl font-bold text-brand-text mb-2">
        Bem-vindo, Pai/Mãe!
      </h1>
      <p className="text-base text-brand-text-secondary mb-8 max-w-xs mx-auto leading-relaxed">
        O <strong>EduFood</strong> é sua central de comando para planejar refeições, gerenciar a despensa e educar o paladar dos seus filhos sem stress.
      </p>
      <button
        onClick={() => onNext()}
        className="w-full max-w-xs bg-brand-primary text-white font-bold py-3.5 px-4 rounded-full flex items-center justify-center text-base shadow-lg hover:bg-brand-dark transition-colors"
      >
        Organizar minha casa
      </button>
    </div>
  );
};

export default WelcomeStep;
