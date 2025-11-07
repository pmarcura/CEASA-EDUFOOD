
import React, { useContext, useState } from 'react';
import type { PantryItem, RiskLevel } from '../types';
import { AppContext } from '../contexts/AppContext';
import { AlertTriangle, Lightbulb, ChevronDown, CheckCircle2 } from 'lucide-react';
import DynamicIcon from './DynamicIcon';
import { NOVA_CLASSIFICATION } from '../constants/foodClassifications';

interface PantryItemCardProps {
    item: PantryItem;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
}

const PantryItemCard: React.FC<PantryItemCardProps> = ({ item, isSelectionMode, isSelected, onToggleSelection }) => {
    const [isTipVisible, setIsTipVisible] = useState(false);

    const riskStyles: { [key in RiskLevel]: { border: string, text: string, bg: string } } = {
        'Baixo': { border: 'border-brand-risk-low', text: 'text-brand-risk-low', bg: 'bg-green-50' },
        'Médio': { border: 'border-brand-risk-medium', text: 'text-brand-risk-medium', bg: 'bg-yellow-50' },
        'Alto': { border: 'border-brand-risk-high', text: 'text-brand-risk-high', bg: 'bg-red-50' },
    };
    
    const novaInfo = NOVA_CLASSIFICATION[item.novaClassification];
    const currentRiskStyle = riskStyles[item.riskLevel];
    const hasAgeWarning = item.ageWarningTag && item.ageWarningTag.length > 0;

    const handleClick = () => {
        if (isSelectionMode) {
            onToggleSelection(item.id);
        }
    };

    return (
        <div 
            className={`relative bg-brand-surface rounded-xl shadow-edu p-3 flex flex-col justify-between transition-all duration-300 border-t-4 ${novaInfo.borderColor} ${isSelectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-brand-primary' : ''}`}
            onClick={handleClick}
            aria-selected={isSelected}
            role="checkbox"
        >
            {isSelectionMode && (
                <div className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary' : 'bg-gray-200'}`}>
                   {isSelected && <CheckCircle2 size={16} className="text-white" />}
                </div>
            )}
            
            <div className="flex-1">
                <div className="flex items-start mb-2">
                    <div className={`p-2.5 rounded-full mr-3 ${currentRiskStyle.bg}`}>
                        <DynamicIcon name={item.icon} className={`w-6 h-6 ${currentRiskStyle.text}`}/>
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                        <h3 className="text-base font-bold text-brand-text capitalize leading-tight">{item.name}</h3>
                        <p className="text-sm text-brand-text-secondary font-semibold mt-1">{item.quantity} {item.unit}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-3">
                    <div className="group relative">
                        <p><strong>NOVA:</strong> <span className={`font-semibold capitalize px-1.5 py-0.5 rounded-md text-xs ${novaInfo.color}`}>{novaInfo.label}</span></p>
                        <div className="absolute bottom-full mb-2 w-56 bg-brand-text text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                            {novaInfo.description}
                            <svg className="absolute text-brand-text h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                        </div>
                    </div>
                    <p><strong>Risco:</strong> <span className={`font-semibold ${currentRiskStyle.text}`}>{item.riskLevel}</span></p>
                    {hasAgeWarning && (
                         <div className="flex items-center gap-1 text-yellow-800 font-semibold">
                            <AlertTriangle size={14}/>
                            <span>{item.ageWarningTag}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-auto pt-2 border-t border-brand-border">
                <button 
                    onClick={(e) => {
                        if (isSelectionMode) e.stopPropagation();
                        setIsTipVisible(!isTipVisible)
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary w-full text-left"
                    aria-expanded={isTipVisible}
                >
                    <Lightbulb size={14} /> Dica do Nutri
                    <ChevronDown size={14} className={`ml-auto transition-transform ${isTipVisible ? 'rotate-180' : ''}`} />
                </button>
                {isTipVisible && (
                    <p className="text-xs text-brand-text-secondary mt-1.5 animate-fade-in">
                        {item.healthTip}
                    </p>
                )}
            </div>
        </div>
    );
};

export default PantryItemCard;