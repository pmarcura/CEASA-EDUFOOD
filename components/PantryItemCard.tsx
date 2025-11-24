
import React, { useContext, useState, useCallback } from 'react';
import type { PantryItem } from '../types';
import { AppContext } from '../contexts/AppContext';
import { Lightbulb, CheckCircle2, Carrot, Sandwich, Cookie } from 'lucide-react';
import FoodIcon from './FoodIcon';
import { NOVA_CLASSIFICATION } from '../constants/foodClassifications';
import HealthTipModal from './gamification/HealthTipModal';
import { formatQuantity, toTitleCase } from '../utils/formatters';

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

    // Mapped background styles for softer look
    const novaStyles = {
        'in_natura': 'bg-green-50/50 hover:bg-green-50',
        'culinary_ingredients': 'bg-blue-50/50 hover:bg-blue-50',
        'processed': 'bg-yellow-50/50 hover:bg-yellow-50',
        'ultra_processed': 'bg-red-50/50 hover:bg-red-50',
    }[item.novaClassification];
    
    const novaTextColor = {
         'in_natura': 'text-green-700',
        'culinary_ingredients': 'text-blue-700',
        'processed': 'text-yellow-700',
        'ultra_processed': 'text-red-700',
    }[item.novaClassification];

    const novaInfo = NOVA_CLASSIFICATION[item.novaClassification];
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
                className={`relative group rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 border border-transparent ${novaStyles} ${isSelectionMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-brand-primary bg-white shadow-lg' : 'hover:shadow-sm hover:border-black/5'}`}
                onClick={handleClick}
                aria-selected={isSelected}
                role="checkbox"
            >
                {isSelectionMode && (
                    <div className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary scale-110' : 'bg-white border-2 border-gray-200'}`}>
                       {isSelected && <CheckCircle2 size={16} className="text-white" />}
                    </div>
                )}
                
                <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                         {/* New Emoji Icon System */}
                        <FoodIcon name={item.name} icon={item.icon} size="md" />
                        
                        <div className="min-w-0 pt-0.5">
                            <h3 className="text-sm font-bold text-brand-text capitalize leading-tight mb-1 truncate pr-1">{toTitleCase(item.name)}</h3>
                            <p className="text-xs text-brand-text-secondary font-medium bg-white/60 px-1.5 py-0.5 rounded-md inline-block">
                                {formatQuantity(item.quantity)} <span className="text-[10px] uppercase">{item.unit}</span>
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between">
                     <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${novaTextColor}`}>
                        <NovaIcon size={12} strokeWidth={2.5} />
                        <span>{novaInfo.simpleLabel}</span>
                     </div>

                    <button 
                        onClick={(e) => {
                            if (isSelectionMode) e.stopPropagation();
                            handleOpenTip();
                        }}
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-brand-primary shadow-sm hover:scale-110 transition-transform relative"
                    >
                        <Lightbulb size={14} fill={item.tipRead ? "currentColor" : "none"} className={item.tipRead ? "opacity-50" : ""} />
                        {!item.tipRead && (
                            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        )}
                    </button>
                </div>
            </div>
            {isTipModalOpen && <HealthTipModal item={item} onClose={() => setIsTipModalOpen(false)} />}
        </>
    );
};

export default PantryItemCard;
