import React, { useState } from 'react';
import type { UserProfile, Child } from '../../types';
import { Plus, X, ArrowLeft, ArrowRight, Minus } from 'lucide-react';

interface FamilyProfileStepProps {
  onNext: (data: Partial<UserProfile>) => void;
  onBack: () => void;
  data: Partial<UserProfile>;
}

const FamilyProfileStep: React.FC<FamilyProfileStepProps> = ({ onNext, onBack, data }) => {
  const [familyMembers, setFamilyMembers] = useState<number>(data.familyMembers ?? 2);
  const [children, setChildren] = useState<Child[]>(data.children ?? []);

  const handleChildAgeChange = (index: number, age: string) => {
    const newChildren = [...children];
    const newAge = parseInt(age, 10);
    newChildren[index] = { age: isNaN(newAge) ? 0 : newAge };
    setChildren(newChildren);
  };
  
  const addChild = () => {
    if (children.length < 3) {
      setChildren([...children, { age: 5 }]);
    }
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };
  
  const handleNext = () => {
    onNext({ familyMembers, children });
  };
  
  return (
     <div className="text-center max-w-md w-full animate-fade-in">
        <h2 className="text-xl font-bold text-brand-text mb-6">Sobre sua família</h2>
        
        <div className="bg-brand-surface p-4 rounded-2xl shadow-sm mb-4">
            <label className="font-semibold text-brand-text-secondary">Quantas pessoas comem em casa?</label>
             <div className="flex items-center justify-center gap-6 mt-3">
                <button onClick={() => setFamilyMembers(p => Math.max(1, p - 1))} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-brand-text-secondary hover:bg-gray-200 transition-colors">
                    <Minus size={20} />
                </button>
                <span className="text-4xl font-bold w-12 text-brand-text">{familyMembers}</span>
                <button onClick={() => setFamilyMembers(p => p + 1)} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-brand-text-secondary hover:bg-gray-200 transition-colors">
                    <Plus size={20} />
                </button>
            </div>
        </div>

        <div className="bg-brand-surface p-4 rounded-2xl shadow-sm">
            <label className="font-semibold text-brand-text-secondary">Tem crianças? Quantos anos elas têm?</label>
            <div className="space-y-3 mt-3">
                {children.map((child, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Idade"
                            value={child.age || ''}
                            onChange={(e) => handleChildAgeChange(index, e.target.value)}
                            className="w-full p-2.5 border border-brand-border rounded-lg text-sm"
                        />
                        <button onClick={() => removeChild(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><X size={18}/></button>
                    </div>
                ))}
            </div>
            {children.length < 3 && (
                <button onClick={addChild} className="mt-4 text-base text-brand-primary font-semibold flex items-center justify-center w-full gap-1.5 hover:underline">
                    <Plus size={16}/> Adicionar criança
                </button>
            )}
        </div>
        
        <div className="flex justify-between items-center mt-10 w-full">
         <button onClick={onBack} className="flex items-center gap-1.5 text-brand-text-secondary font-semibold hover:text-brand-text transition-colors text-base">
            <ArrowLeft size={18} /> Voltar
         </button>
         <button 
            onClick={handleNext}
            className="flex items-center gap-1.5 bg-brand-primary text-white font-bold py-3 px-5 rounded-xl transition-colors text-base"
        >
            Próximo <ArrowRight size={18} />
        </button>
      </div>
     </div>
  );
};

export default FamilyProfileStep;