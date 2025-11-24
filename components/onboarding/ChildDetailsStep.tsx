import React, { useState } from 'react';
import type { UserProfile, Child, FoodSelectivityLevel, ReligiousDiet } from '../../types';
import { Plus, X, ArrowLeft, ArrowRight, Smile, Meh, Frown } from 'lucide-react';
import { RELIGIOUS_DIETS_OPTIONS } from '../../constants/foodRestrictions';

interface ChildDetailsStepProps {
  onNext: (data: Partial<UserProfile>) => void;
  onBack: () => void;
  data: Partial<UserProfile>;
}

const defaultChild: Omit<Child, 'id'> = {
  name: '',
  age: 5,
  restrictions: { psychological: false, autism: false },
  religiousDiets: [],
  otherReligiousDiet: '',
  medicalConditions: '',
  foodSelectivity: { level: 'medium', context: '' },
  dislikedFoods: ''
};

const CheckboxWithLabel: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-2 bg-brand-background p-2 rounded-lg border border-brand-border">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
        />
        <span className="text-sm font-medium text-brand-text">{label}</span>
    </label>
);

const ChildDetailsStep: React.FC<ChildDetailsStepProps> = ({ onNext, onBack, data }) => {
  const [children, setChildren] = useState<Child[]>(data.children ?? []);

  const handleAddChild = () => {
    if (children.length < 5) {
      setChildren(prev => [...prev, { id: Date.now().toString(), ...defaultChild }]);
    }
  };

  const handleRemoveChild = (id: string) => {
    setChildren(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateChild = (id: string, updates: Partial<Child>) => {
    setChildren(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };
  
  const handleUpdateRestriction = (id: string, key: keyof Child['restrictions'], value: boolean) => {
    setChildren(prev => prev.map(c => {
        if (c.id === id) {
            return { ...c, restrictions: { ...c.restrictions, [key]: value } };
        }
        return c;
    }));
  };

  const handleUpdateFoodSelectivity = (id: string, field: 'level' | 'context', value: string) => {
    setChildren(prev => prev.map(c => {
        if (c.id === id) {
            return { ...c, foodSelectivity: { ...c.foodSelectivity, [field]: value } };
        }
        return c;
    }));
  };
  
  const handleToggleReligiousDiet = (id: string, diet: ReligiousDiet | 'other') => {
    setChildren(prev => prev.map(c => {
        if (c.id === id) {
            const currentDiets = c.religiousDiets || [];
            const newDiets = currentDiets.includes(diet)
                ? currentDiets.filter(d => d !== diet)
                : [...currentDiets, diet];
            return { ...c, religiousDiets: newDiets };
        }
        return c;
    }));
  };

  const handleNext = () => {
    onNext({ children });
  };
  
  const isNextDisabled = children.some(c => !c.name.trim() || c.age <= 0);

  return (
     <div className="text-left max-w-md w-full animate-fade-in">
        <div className="text-center">
            <h2 className="text-xl font-bold text-brand-text mb-2">Vamos falar sobre as crianças!</h2>
            <p className="text-sm text-brand-text-secondary mb-6">Esta informação ajuda o Professor Nutri a criar sugestões mais personalizadas.</p>
        </div>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pb-4">
            {children.length === 0 && (
                 <div className="text-center p-6 border-2 border-dashed border-brand-border rounded-xl">
                    <p className="text-brand-text-secondary">Nenhuma criança adicionada ainda.</p>
                </div>
            )}

            {children.map((child, index) => (
                <div key={child.id} className="bg-brand-surface p-4 rounded-2xl shadow-sm animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-brand-text">Criança {index + 1}</h3>
                        <button onClick={() => handleRemoveChild(child.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"><X size={18}/></button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="col-span-2">
                             <label className="text-xs font-semibold text-brand-text-secondary">Nome</label>
                             <input type="text" placeholder="Ex: João" value={child.name} onChange={e => handleUpdateChild(child.id, { name: e.target.value })} className="w-full mt-1 p-2 border border-brand-border rounded-lg text-sm"/>
                        </div>
                         <div>
                             <label className="text-xs font-semibold text-brand-text-secondary">Idade</label>
                            <input type="number" placeholder="5" value={child.age || ''} onChange={e => handleUpdateChild(child.id, { age: parseInt(e.target.value) || 0 })} className="w-full mt-1 p-2 border border-brand-border rounded-lg text-sm"/>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-brand-text-secondary">Restrições e Condições</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                           <CheckboxWithLabel label="Comportamental" checked={child.restrictions.psychological} onChange={v => handleUpdateRestriction(child.id, 'psychological', v)} />
                           <CheckboxWithLabel label="Relacionada a Autismo" checked={child.restrictions.autism} onChange={v => handleUpdateRestriction(child.id, 'autism', v)} />
                        </div>
                        <div className="space-y-2">
                          {RELIGIOUS_DIETS_OPTIONS.map(diet => (
                            <CheckboxWithLabel key={diet.id} label={diet.label} checked={child.religiousDiets?.includes(diet.id) ?? false} onChange={() => handleToggleReligiousDiet(child.id, diet.id)} />
                          ))}
                           <CheckboxWithLabel label="Outra" checked={child.religiousDiets?.includes('other') ?? false} onChange={() => handleToggleReligiousDiet(child.id, 'other')} />
                           {child.religiousDiets?.includes('other') && (
                             <input type="text" placeholder="Descreva a restrição" value={child.otherReligiousDiet} onChange={e => handleUpdateChild(child.id, { otherReligiousDiet: e.target.value })} className="w-full mt-1 p-2 border border-brand-border rounded-lg text-sm"/>
                           )}
                        </div>

                        <textarea placeholder="Alguma alergia, intolerância ou outra condição médica? (ex: alergia a amendoim, intolerância a lactose)" value={child.medicalConditions} onChange={e => handleUpdateChild(child.id, { medicalConditions: e.target.value })} rows={2} className="w-full mt-1 p-2 border border-brand-border rounded-lg text-sm"/>

                        <p className="text-sm font-semibold text-brand-text-secondary pt-2">Seletividade Alimentar</p>
                        <div className="flex justify-around bg-brand-background p-1 rounded-full border border-brand-border">
                            {(['low', 'medium', 'high'] as FoodSelectivityLevel[]).map(level => {
                                const isSelected = child.foodSelectivity.level === level;
                                const labels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
                                const icons = { low: Smile, medium: Meh, high: Frown };
                                const Icon = icons[level];
                                return (
                                    <button key={level} onClick={() => handleUpdateFoodSelectivity(child.id, 'level', level)} className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-1.5 px-2 rounded-full transition-colors ${isSelected ? 'bg-brand-primary text-white shadow' : 'text-brand-text-secondary hover:bg-gray-200'}`}>
                                       <Icon size={16}/> <span>{labels[level]}</span>
                                    </button>
                                );
                            })}
                        </div>
                         <textarea placeholder="Dê mais contexto sobre a seletividade (opcional). Ex: não gosta de molhos, prefere comida seca." value={child.foodSelectivity.context} onChange={e => handleUpdateFoodSelectivity(child.id, 'context', e.target.value)} rows={2} className="w-full mt-1 p-2 border border-brand-border rounded-lg text-sm"/>

                         <p className="text-sm font-semibold text-brand-text-secondary pt-2">Alimentos que não gosta de jeito nenhum</p>
                         <textarea placeholder="Liste os alimentos separados por vírgula (ex: jiló, fígado, abacate)" value={child.dislikedFoods} onChange={e => handleUpdateChild(child.id, { dislikedFoods: e.target.value })} rows={2} className="w-full mt-1 p-2 border border-brand-border rounded-lg text-sm"/>
                    </div>

                </div>
            ))}
        </div>
        
        {children.length < 5 && (
            <button onClick={handleAddChild} className="mt-4 text-base text-brand-primary font-semibold flex items-center justify-center w-full gap-1.5 py-3 border-2 border-dashed border-brand-border rounded-xl hover:bg-green-50 transition-colors">
                <Plus size={16}/> Adicionar criança
            </button>
        )}
        
        <div className="flex justify-between items-center mt-10 w-full">
         <button onClick={onBack} className="flex items-center gap-1.5 text-brand-text-secondary font-semibold hover:text-brand-text transition-colors text-base">
            <ArrowLeft size={18} /> Voltar
         </button>
         <button 
            onClick={handleNext}
            disabled={isNextDisabled}
            className="flex items-center gap-1.5 bg-brand-primary text-white font-bold py-3 px-5 rounded-xl transition-colors text-base disabled:bg-gray-300"
        >
            Próximo <ArrowRight size={18} />
        </button>
      </div>
     </div>
  );
};

export default ChildDetailsStep;