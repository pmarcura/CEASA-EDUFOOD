
import React, { useState } from 'react';
import type { UserProfile, Child, FoodSelectivityLevel, ReligiousDiet, FoodPersonality } from '../../types';
import { Plus, X, ArrowLeft, ArrowRight, Smile, Meh, Frown, Info } from 'lucide-react';
import { RELIGIOUS_DIETS_OPTIONS } from '../../constants/foodRestrictions';
import { FOOD_PERSONALITIES } from '../../constants/profileOptions';

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
  dislikedFoods: '',
  foodPersonality: []
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
  
  const handleTogglePersonality = (childId: string, personalityId: FoodPersonality) => {
        const child = children.find(c => c.id === childId);
        if (!child) return;

        const currentPersonalities = Array.isArray(child.foodPersonality) ? child.foodPersonality : [];
        let newPersonalities: FoodPersonality[];

        if (personalityId === 'unknown') {
            // If choosing unknown, clear everything else
            newPersonalities = currentPersonalities.includes('unknown') ? [] : ['unknown'];
        } else {
            // If choosing specific, remove 'unknown' first
            let temp = currentPersonalities.filter(p => p !== 'unknown');
            
            if (temp.includes(personalityId)) {
                newPersonalities = temp.filter(p => p !== personalityId);
            } else {
                // Limit to max 3 specific traits to avoid confusing AI
                if (temp.length >= 3) return; 
                newPersonalities = [...temp, personalityId];
            }
        }
        
        handleUpdateChild(childId, { foodPersonality: newPersonalities });
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
            <h2 className="text-xl font-bold text-brand-text mb-2">Perfil Alimentar das Crianças</h2>
            <p className="text-sm text-brand-text-secondary mb-6">Responda as perguntas para personalizar a experiência.</p>
        </div>
        
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 pb-4">
            {children.length === 0 && (
                 <div className="text-center p-6 border-2 border-dashed border-brand-border rounded-xl">
                    <p className="text-brand-text-secondary">Nenhuma criança adicionada ainda.</p>
                </div>
            )}

            {children.map((child, index) => (
                <div key={child.id} className="bg-brand-surface p-5 rounded-3xl shadow-sm animate-fade-in border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-brand-text">Criança {index + 1}</h3>
                        <button onClick={() => handleRemoveChild(child.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"><X size={18}/></button>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="col-span-2">
                             <label className="text-xs font-semibold text-brand-text-secondary">Nome</label>
                             <input type="text" placeholder="Ex: João" value={child.name} onChange={e => handleUpdateChild(child.id, { name: e.target.value })} className="w-full mt-1 p-2.5 border border-brand-border rounded-xl text-sm"/>
                        </div>
                         <div>
                             <label className="text-xs font-semibold text-brand-text-secondary">Idade</label>
                            <input type="number" placeholder="5" value={child.age || ''} onChange={e => handleUpdateChild(child.id, { age: parseInt(e.target.value) || 0 })} className="w-full mt-1 p-2.5 border border-brand-border rounded-xl text-sm"/>
                        </div>
                    </div>
                    
                    <div className="space-y-5">
                        
                        {/* Comportamento Alimentar (Card List) */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <label className="text-sm font-semibold text-brand-text">Comportamento (Selecione o que se aplica)</label>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {FOOD_PERSONALITIES.map(p => {
                                    const isSelected = (child.foodPersonality || []).includes(p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => handleTogglePersonality(child.id, p.id)}
                                            className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                                                isSelected
                                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                                                    : 'bg-brand-background border-brand-border hover:border-blue-300'
                                            }`}
                                        >
                                            <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <p.icon size={16} />
                                            </div>
                                            <div>
                                                <span className={`text-sm font-bold block mb-0.5 ${isSelected ? 'text-blue-900' : 'text-brand-text'}`}>
                                                    {p.diagnosticQuestion}
                                                </span>
                                                <span className={`text-xs font-medium uppercase tracking-wide ${isSelected ? 'text-blue-600' : 'text-brand-text-secondary'}`}>
                                                    {p.label}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-brand-text block mb-1.5">Nível de Seletividade Geral</label>
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
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs font-bold text-brand-text-secondary uppercase mb-2">Restrições Específicas</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                <CheckboxWithLabel label="Comportamental" checked={child.restrictions.psychological} onChange={v => handleUpdateRestriction(child.id, 'psychological', v)} />
                                <CheckboxWithLabel label="Autismo/Sensorial" checked={child.restrictions.autism} onChange={v => handleUpdateRestriction(child.id, 'autism', v)} />
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
                            <textarea placeholder="Alergias ou intolerâncias (ex: lactose, glúten, amendoim)" value={child.medicalConditions} onChange={e => handleUpdateChild(child.id, { medicalConditions: e.target.value })} rows={2} className="w-full mt-3 p-3 bg-brand-background border border-brand-border rounded-xl text-sm"/>
                        </div>
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
