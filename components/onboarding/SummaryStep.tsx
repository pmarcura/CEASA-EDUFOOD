
import React from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';

interface SummaryStepProps {
  onFinish: () => void;
  onBack: () => void;
}

const SummaryStep: React.FC<SummaryStepProps> = ({ onFinish, onBack }) => {
    
  const features = [
    'Organizar suas refeições',
    'Usar o que já tem em casa',
    'Criar receitas fáceis e nutritivas',
    'Ganhar recompensas saudáveis'
  ];

  return (
    <div className="text-center max-w-md w-full animate-fade-in">
      <h2 className="text-3xl font-bold text-brand-text mb-2">Pronto!</h2>
      <p className="text-base text-brand-text-secondary mb-8">Com base nas suas respostas, o Edu vai te ajudar a:</p>
      
      <div className="space-y-3 text-left bg-brand-surface p-5 rounded-2xl shadow-sm mb-10">
        {features.map((feature, index) => (
          <div key={feature} className="flex items-center animate-fade-in" style={{ animationDelay: `${index * 150}ms` }}>
            <CheckCircle className="h-5 w-5 text-brand-primary mr-3 flex-shrink-0" />
            <span className="font-semibold text-sm text-brand-text">{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="w-full max-w-xs mx-auto">
        <button
          onClick={() => onFinish()}
          className="w-full bg-brand-primary text-white font-bold py-3.5 px-4 rounded-full flex items-center justify-center text-base shadow-lg hover:bg-brand-dark transition-colors"
        >
          Começar Agora!
        </button>

        <div className="mt-6 text-center">
          <button onClick={onBack} className="flex items-center justify-center mx-auto gap-1.5 text-brand-text-secondary font-semibold hover:text-brand-text transition-colors text-base">
              <ArrowLeft size={18} /> Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryStep;
