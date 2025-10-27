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
      <h1 className="text-3xl font-bold text-brand-text mb-2">
        Olá, eu sou o Edu 🥕!
      </h1>
      <p className="text-base text-brand-text-secondary mb-8 max-w-xs mx-auto">
        Vou te ajudar a organizar as refeições da sua família de forma prática, saudável e divertida.
      </p>
      <button
        onClick={() => onNext()}
        className="w-full max-w-xs bg-brand-primary text-white font-bold py-3.5 px-4 rounded-full flex items-center justify-center text-base shadow-lg hover:bg-brand-dark transition-colors"
      >
        Vamos começar!
      </button>
    </div>
  );
};

export default WelcomeStep;