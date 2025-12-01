
import React from 'react';
import type { Child, FoodSelectivityLevel, ReligiousDiet, FoodPersonality } from '../types';
import { Smile, Meh, Frown, Trash2, Info } from 'lucide-react';
import { RELIGIOUS_DIETS_OPTIONS } from '../../constants/foodRestrictions';
import { FOOD_PERSONALITIES } from '../../constants/profileOptions';

interface ChildEditCardProps {
    child: Child;
    isEditing: boolean;
    onUpdate: (id: string, updates: Partial<Child>) => void;
    onRemove: (id: string) => void;
}

const CheckboxWithLabel: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; isEditing: boolean }> = ({ label, checked, onChange, isEditing }) => (
    <label className={`flex items-center gap-2 p-2 rounded-lg ${isEditing ? 'bg-white border border-brand-border cursor-pointer' : ''}`}>
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={!isEditing}
            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary disabled:opacity-70"
        />
        <span className={`text-sm font-medium ${isEditing ? 'text-brand-text' : 'text-brand-text-secondary'}`}>{label}</span>
    </label>
);

const ChildEditCard: React.FC<ChildEditCardProps> = ({ child, isEditing, onUpdate, onRemove }) => {
    
    const handleUpdate = (updates: Partial<Child>) => {
        onUpdate(child.id, updates);
    };

    const handleUpdateFoodSelectivity = (field: 'level' | 'context', value: string) => {
        handleUpdate({ foodSelectivity: { ...child.foodSelectivity, [field]: value } });
    };
    
    const handleTogglePersonality = (personalityId: FoodPersonality) => {
        const currentPersonalities = Array.isArray(child.foodPersonality) ? child.foodPersonality : [];
        let newPersonalities: FoodPersonality[];

        if (personalityId === 'unknown') {
            newPersonalities = currentPersonalities.includes('unknown') ? [] : ['unknown'];
        } else {
            let temp = currentPersonalities.filter(p => p !== 'unknown');
            if (temp.includes(personalityId)) {
                newPersonalities = temp.filter(p => p !== personalityId);
            } else {
                if (temp.length >= 3) return; 
                newPersonalities = [...temp, personalityId];
            }
        }
        handleUpdate({ foodPersonality: newPersonalities });
    };
    
    const handleToggleReligiousDiet = (diet: ReligiousDiet | 'other') => {
        const currentDiets = child.religiousDiets || [];
        const newDiets = currentDiets.includes(diet)
            ? currentDiets.filter(d => d !== diet)
            : [...currentDiets, diet];
        handleUpdate({ religiousDiets: newDiets });
    };

    // Ensure we handle both old string format and new array format safely
    const activePersonalities = Array.isArray(child.foodPersonality) ? child.foodPersonality : (child.foodPersonality ? [child.foodPersonality] : []);

    if (!isEditing) {
        return (
             <div className="bg-brand-background p-3 rounded-lg border border-brand-border">
                <p className="font-bold text-brand-text">{child.name}, {child.age} anos</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {activePersonalities.length > 0 ? activePersonalities.map(pId => {
                        const pDef = FOOD_PERSONALITIES.find(p => p.id === pId);
                        if (!pDef) return null;
                        return (
                            <div key={pId} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-md inline-flex max-w-full">
                                <pDef.icon size={14} className="flex-shrink-0" />
                                <span className="text-[10px] font-bold truncate">{pDef.label}</span>
                            </div>
                        );
                    }) : (
                        <span className="text-xs text-brand-text-secondary italic">Sem perfil definido</span>
                    )}
                </div>
                <p className="text-xs text-brand-text-secondary capitalize mt-1.5">Seletividade: {child.foodSelectivity.level}</p>
             </div>
        )
    }

    return (
        <div className="bg-brand-background p-3 rounded-xl border-2 border-brand-primary/50">
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-brand-text">Editar Criança</h4>
                <button onClick={() => onRemove(child.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"><Trash2 size={16}/></button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="col-span-2">
                    <label className="text-xs font-semibold text-brand-text-secondary">Nome</label>
                    <input type="text" value={child.name} onChange={e => handleUpdate({ name: e.target.value })} className="w-full mt-1 p-2 bg-white border border-brand-border rounded-lg text-sm"/>
                </div>
                <div>
                    <label className="text-xs font-semibold text-brand-text-secondary">Idade</label>
                    <input type="number" value={child.age} onChange={e => handleUpdate({ age: parseInt(e.target.value) })} className="w-full mt-1 p-2 bg-white border border-brand-border rounded-lg text-sm"/>
                </div>
            </div>

            <div className="space-y-4">
                {/* Personalidade Alimentar */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <label className="text-sm font-semibold text-brand-text-secondary">Comportamento (Selecione os aplicáveis)</label>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {FOOD_PERSONALITIES.map(p => {
                            const isSelected = activePersonalities.includes(p.id);
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handleTogglePersonality(p.id)}
                                    className={`p-2.5 rounded-lg border text-left transition-all flex items-start gap-3 ${
                                        isSelected
                                            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                                            : 'bg-white border-brand-border text-brand-text-secondary hover:border-blue-300'
                                    }`}
                                >
                                    <div className={`mt-0.5 p-1 rounded-full flex-shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <p.icon size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <span className={`text-xs font-bold block leading-tight mb-0.5 ${isSelected ? 'text-blue-900' : 'text-brand-text'}`}>
                                            {p.diagnosticQuestion}
                                        </span>
                                        <span className={`text-[10px] font-medium uppercase tracking-wide ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {p.label}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <p className="text-sm font-semibold text-brand-text-secondary mb-1.5">Nível de Seletividade</p>
                    <div className="flex justify-around bg-white p-1 rounded-full border border-brand-border">
                        {(['low', 'medium', 'high'] as FoodSelectivityLevel[]).map(level => {
                            const isSelected = child.foodSelectivity.level === level;
                            const labels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
                            const icons = { low: Smile, medium: Meh, high: Frown };
                            const Icon = icons[level];
                            return (
                                <button key={level} onClick={() => handleUpdateFoodSelectivity('level', level)} className={`w-full flex items-center justify-center gap-1 text-xs font-semibold py-1 px-1.5 rounded-full transition-colors ${isSelected ? 'bg-brand-primary text-white shadow' : 'text-brand-text-secondary hover:bg-gray-100'}`}>
                                    <Icon size={14}/> <span>{labels[level]}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                 <div>
                    <label className="text-sm font-semibold text-brand-text-secondary mb-1 block">Alimentos PROIBIDOS (Ódio/Recusa)</label>
                    <textarea 
                        placeholder="Liste o que não come DE JEITO NENHUM" 
                        value={child.dislikedFoods} 
                        onChange={e => handleUpdate({ dislikedFoods: e.target.value })} 
                        rows={2} 
                        className="w-full p-2 bg-white border border-brand-border rounded-lg text-sm"
                    />
                </div>

                 <div>
                    <p className="text-sm font-semibold text-brand-text-secondary mb-1.5">Restrições e Condições</p>
                     <div className="space-y-2">
                        {RELIGIOUS_DIETS_OPTIONS.map(diet => (
                            <CheckboxWithLabel key={diet.id} label={diet.label} checked={child.religiousDiets?.includes(diet.id) ?? false} onChange={() => handleToggleReligiousDiet(diet.id)} isEditing={isEditing} />
                        ))}
                        <CheckboxWithLabel label="Outra" checked={child.religiousDiets?.includes('other') ?? false} onChange={() => handleToggleReligiousDiet('other')} isEditing={isEditing} />
                        {child.religiousDiets?.includes('other') && (
                            <input type="text" placeholder="Descreva a restrição" value={child.otherReligiousDiet} onChange={e => handleUpdate({ otherReligiousDiet: e.target.value })} className="w-full mt-1 p-2 bg-white border border-brand-border rounded-lg text-sm"/>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default ChildEditCard;
