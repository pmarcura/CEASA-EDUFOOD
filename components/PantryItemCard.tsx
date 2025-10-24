import React, { useContext } from 'react';
import type { PantryItem, Classification, RiskLevel } from '../types';
import { AppContext } from '../contexts/AppContext';
import { X } from 'lucide-react';
import DynamicIcon from './DynamicIcon';

interface PantryItemCardProps {
    item: PantryItem;
}

const PantryItemCard: React.FC<PantryItemCardProps> = ({ item }) => {
    const context = useContext(AppContext);

    const riskStyles: { [key in RiskLevel]: { border: string, text: string, bg: string } } = {
        'Baixo': { border: 'border-brand-risk-low', text: 'text-brand-risk-low', bg: 'bg-green-50' },
        'Médio': { border: 'border-brand-risk-medium', text: 'text-brand-risk-medium', bg: 'bg-yellow-50' },
        'Alto': { border: 'border-brand-risk-high', text: 'text-brand-risk-high', bg: 'bg-red-50' },
    };

    const classificationStyles: { [key in Classification]: string } = {
        'in natura': 'bg-green-100 text-green-800',
        'processado': 'bg-yellow-100 text-yellow-800',
        'ultraprocessado': 'bg-red-100 text-red-800',
    };
    
    const currentRiskStyle = riskStyles[item.riskLevel] || { border: 'border-gray-500', text: 'text-gray-800', bg: 'bg-gray-100' };

    return (
        <div className={`relative bg-brand-surface rounded-2xl shadow-edu p-4 flex flex-col justify-between transition-transform transform hover:scale-105 border-t-4 ${currentRiskStyle.border}`}>
            <button
                onClick={() => context?.removeItemFromPantry(item.id)}
                className="absolute top-3 right-3 p-1 bg-gray-100/60 rounded-full text-brand-text-secondary hover:bg-brand-risk-high/20 hover:text-brand-risk-high transition-colors z-10"
                aria-label={`Remover ${item.name}`}
            >
                <X size={16} />
            </button>
            
            <div>
                <div className="flex items-start mb-3">
                    <div className={`p-3 rounded-full mr-4 ${currentRiskStyle.bg}`}>
                        <DynamicIcon name={item.icon} className={`w-8 h-8 ${currentRiskStyle.text}`}/>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-brand-text capitalize">{item.name}</h3>
                        <p className="text-sm text-brand-text-secondary">{item.quantity} {item.unit}</p>
                    </div>
                </div>

                <p className="text-xs italic text-brand-text-secondary mb-4 bg-gray-50 rounded-lg p-2">"{item.healthTip}"</p>

                <div className="text-sm space-y-2 mb-4">
                    <p><strong>Classificação:</strong> <span className={`font-semibold capitalize px-2 py-1 rounded-full text-xs ${classificationStyles[item.classification]}`}>{item.classification}</span></p>
                    <p><strong>Risco Nutricional:</strong> <span className={`font-semibold ${currentRiskStyle.text}`}>{item.riskLevel}</span></p>
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-brand-border">
                {item.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-brand-text-secondary text-xs font-medium px-2.5 py-1 rounded-full">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default PantryItemCard;