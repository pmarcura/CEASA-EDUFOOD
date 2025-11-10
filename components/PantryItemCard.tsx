
import React, { useContext, useState, useCallback } from 'react';
import type { PantryItem, RiskLevel } from '../types';
import { AppContext } from '../contexts/AppContext';
import { Lightbulb, ChevronDown, CheckCircle2, Carrot, Sandwich, Cookie } from 'lucide-react';
import DynamicIcon from './DynamicIcon';
import { NOVA_CLASSIFICATION } from '../constants/foodClassifications';
import HealthTipModal from './gamification/HealthTipModal';

interface PantryItemCardProps {
    item: PantryItem;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
}

const novaIconMap: { [key in PantryItem['novaClassification']]: React.ElementType } = {
    'in_natura': Carrot,
    'culinary_ingredients': Carrot,
    'processed': Sandwich,
    'ultra_processed': Cookie,
};

const PantryItemCard: React.FC<PantryItemCardProps> = ({ item, isSelectionMode, isSelected, onToggleSelection }) => {
    const context = useContext(AppContext);
    const [isTipModalOpen, setIsTipModalOpen] = useState(false);

    const riskStyles: { [key in RiskLevel]: { border: string, text: string, bg: string } } = {
        'Baixo': { border: 'border-brand-risk-low', text: 'text-brand-risk-low', bg: 'bg-green-50' },
        'Médio': { border: 'border-brand-risk-medium', text: 'text-brand-risk-medium', bg: 'bg-yellow-50' },
        'Alto': { border: 'border-brand-risk-high', text: 'text-brand-risk-high', bg: 'bg-red-50' },
    };
    
    const novaInfo = NOVA_CLASSIFICATION[item.novaClassification];
    const currentRiskStyle = riskStyles[item.riskLevel];
    const NovaIcon = novaIconMap[item.novaClassification];

    const handleClick = () => {
        if (isSelectionMode) {
            onToggleSelection(item.id);
        }
    };
    
    const handleOpenTip = useCallback(() => {
        setIsTipModalOpen(true);
        if (!item.tipRead && context) {
            context.markTipAsRead(item.id);
        }
    }, [item.id, item.tipRead, context]);


    return (
        <>
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

                    <div className="flex items-center gap-2 text-xs mb-3">
                       <div className={`flex items-center gap-1 font-semibold capitalize px-1.5 py-0.5 rounded-md ${novaInfo.color}`}>
                           <NovaIcon size={12} />
                           <span>{novaInfo.simpleLabel}</span>
                       </div>
                       <span className={`font-semibold ${currentRiskStyle.text}`}>{item.riskLevel}</span>
                    </div>
                </div>

                <div className="mt-auto pt-2 border-t border-brand-border">
                    <button 
                        onClick={(e) => {
                            if (isSelectionMode) e.stopPropagation();
                            handleOpenTip();
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-primary w-full text-left"
                    >
                        <div className="relative">
                            <Lightbulb size={14} />
                            {!item.tipRead && (
                                <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-brand-surface" />
                            )}
                        </div>
                        <span>Dica do Nutri</span>
                        <ChevronDown size={14} className="ml-auto" />
                    </button>
                </div>
            </div>
            {isTipModalOpen && <HealthTipModal item={item} onClose={() => setIsTipModalOpen(false)} />}
        </>
    );
};

export default PantryItemCard;
