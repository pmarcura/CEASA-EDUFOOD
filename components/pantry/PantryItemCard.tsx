
import React, { useContext, useState, memo } from 'react';
import type { PantryItem, RiskLevel } from '../../types';
import { AppContext } from '../../contexts/AppContext';
import { X, AlertTriangle, Edit, Save, XCircle } from 'lucide-react';
import DynamicIcon from '../common/DynamicIcon';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';
import { UNITS } from '../../constants/units';
import { getUnitLabel } from '../../helpers/units';

interface PantryItemCardProps {
    item: PantryItem;
}

const PantryItemCard: React.FC<PantryItemCardProps> = ({ item }) => {
    const context = useContext(AppContext);
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuantity, setEditedQuantity] = useState(item.quantity);
    const [editedUnit, setEditedUnit] = useState(item.unit);

    const riskStyles: { [key in RiskLevel]: { border: string, text: string, bg: string } } = {
        'Baixo': { border: 'border-brand-risk-low', text: 'text-brand-risk-low', bg: 'bg-green-50' },
        'Médio': { border: 'border-brand-risk-medium', text: 'text-brand-risk-medium', bg: 'bg-yellow-50' },
        'Alto': { border: 'border-brand-risk-high', text: 'text-brand-risk-high', bg: 'bg-red-50' },
    };
    
    const fallbackNova = {
        label: 'Desconhecido',
        description: 'Classificação nutricional não disponível.',
        color: 'bg-gray-100 text-gray-800',
        borderColor: 'border-gray-500',
    };
    const novaInfo = NOVA_CLASSIFICATION[item.novaClassification] || fallbackNova;
    
    const fallbackRisk = { border: 'border-gray-500', text: 'text-gray-500', bg: 'bg-gray-100' };
    const currentRiskStyle = riskStyles[item.riskLevel] || fallbackRisk;

    const hasAgeWarning = item.notRecommendedFor && item.notRecommendedFor.length > 0 && !item.notRecommendedFor.includes('everyone');

    const ageWarningText = item.notRecommendedFor.map(age => {
        if (age === 'infants') return 'bebês (0-2 anos)';
        if (age === 'toddlers') return 'crianças pequenas (2-5 anos)';
        return age;
    }).join(', ');

    const handleSave = async () => {
        if (!context) return;
        const newQuantity = Number(editedQuantity);
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            await context.updatePantryItemDetails(item.id, {
                quantity: newQuantity,
                unit: editedUnit,
            });
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditedQuantity(item.quantity);
        setEditedUnit(item.unit);
        setIsEditing(false);
    };

    return (
        <div className={`relative bg-brand-surface rounded-xl shadow-edu p-3 flex flex-col justify-between transition-all duration-300 border-t-4 ${novaInfo.borderColor} ${isEditing ? 'ring-2 ring-brand-primary' : ''}`}>
            <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                 {!isEditing && (
                     <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 bg-gray-100/60 rounded-full text-brand-text-secondary hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        aria-label={`Editar ${item.name}`}
                    >
                        <Edit size={14} />
                    </button>
                 )}
                <button
                    onClick={async () => await context?.removeItemFromPantry(item.id)}
                    className="p-1.5 bg-gray-100/60 rounded-full text-brand-text-secondary hover:bg-brand-risk-high/20 hover:text-brand-risk-high transition-colors"
                    aria-label={`Remover ${item.name}`}
                >
                    <X size={14} />
                </button>
            </div>
            
            <div>
                <div className="flex items-start mb-2">
                    <div className={`p-2.5 rounded-full mr-3 ${currentRiskStyle.bg}`}>
                        <DynamicIcon name={item.icon} className={`w-6 h-6 ${currentRiskStyle.text}`}/>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-brand-text capitalize pr-10 leading-tight">{item.name}</h3>
                        {isEditing ? (
                             <div className="flex items-center gap-1 mt-1">
                                <input
                                    type="number"
                                    value={editedQuantity}
                                    onChange={(e) => setEditedQuantity(Number(e.target.value))}
                                    className="w-16 p-1 border border-brand-border rounded-md text-xs"
                                    min="0"
                                />
                                <select
                                    value={editedUnit}
                                    onChange={(e) => setEditedUnit(e.target.value)}
                                    className="p-1 border border-brand-border rounded-md text-xs bg-white"
                                >
                                    {UNITS.map(u => <option key={u.value} value={u.value}>{u.label.split(' ')[1]}</option>)}
                                </select>
                            </div>
                        ) : (
                            <p className="text-sm text-brand-text-secondary font-semibold">{item.quantity} {getUnitLabel(item.unit)}</p>
                        )}
                    </div>
                </div>

                {!isEditing && (
                    <div className="text-xs space-y-1.5 mb-3">
                        <div className="group relative">
                            <p><strong>NOVA:</strong> <span className={`font-semibold capitalize px-1.5 py-0.5 rounded-md text-xs ${novaInfo.color}`}>{novaInfo.label}</span></p>
                            <div className="absolute bottom-full mb-2 w-56 bg-brand-text text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                                {novaInfo.description}
                                <svg className="absolute text-brand-text h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                            </div>
                        </div>
                        <p><strong>Risco:</strong> <span className={`font-semibold ${currentRiskStyle.text}`}>{item.riskLevel}</span></p>
                    </div>
                )}
                

                {hasAgeWarning && !isEditing && (
                     <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-1.5 rounded-md mb-3">
                        <div className="flex items-center">
                            <AlertTriangle size={16} className="mr-2"/>
                            <p className="text-xs font-semibold">Não recomendado para: {ageWarningText}.</p>
                        </div>
                    </div>
                )}
            </div>

            {isEditing ? (
                 <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-brand-border">
                    <button onClick={handleCancel} className="p-1.5 rounded-full text-brand-text-secondary hover:bg-gray-200 transition-colors"><XCircle size={18} /></button>
                    <button onClick={handleSave} className="p-1.5 rounded-full text-brand-primary hover:bg-green-100 transition-colors"><Save size={18} /></button>
                </div>
            ) : (
                 <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-brand-border">
                    {item.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="bg-gray-100 text-brand-text-secondary text-[10px] font-medium px-2 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
            
        </div>
    );
};

export default memo(PantryItemCard);
