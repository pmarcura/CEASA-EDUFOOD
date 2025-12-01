
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

    // Safe fallback if classification is missing or invalid
    const classification = item.novaClassification || 'processed';

    // Using border colors for NOVA classification instead of full background for cleaner look
    const novaBorderColors = {
        'in_natura': 'border-l-green-500',
        'culinary_ingredients': 'border-l-blue-500',
        'processed': 'border-l-yellow-500',
        'ultra_processed': 'border-l-red-500',
    }[classification] || 'border-l-gray-300';
    
    const novaBadgeStyles = {
         'in_natura': 'text-green-700 bg-green-50',
        'culinary_ingredients': 'text-blue-700 bg-blue-50',
        'processed': 'text-yellow-700 bg-yellow-50',
        'ultra_processed': 'text-red-700 bg-red-50',
    }[classification] || 'text-gray-700 bg-gray-50';

    const novaInfo = NOVA_CLASSIFICATION[classification] || NOVA_CLASSIFICATION.processed;
    const NovaIcon = novaIconMap[classification] || novaIconMap.processed;

    const handleClick = () => {
        if (isSelectionMode) {
            onToggleSelection(item.id);
        } else {
            // Optional: Open detail view in future
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
                className={`relative group bg-white rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 border-l-4 shadow-sm border-y border-r border-gray-100 ${novaBorderColors} ${isSelectionMode ? 'cursor-pointer active:scale-95' : ''} ${isSelected ? 'ring-2 ring-brand-primary shadow-md' : 'hover:shadow-md'}`}
                onClick={handleClick}
                aria-selected={isSelected}
                role="checkbox"
            >
                {isSelectionMode && (
                    <div className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary scale-110' : 'bg-white border-2 border-gray-200'}`}>
                       {isSelected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                )}
                
                <div className="flex-1 mb-2">
                    <div className="flex flex-col items-center text-center gap-2">
                         {/* Icon */}
                        <div className="bg-gray-50 p-2 rounded-full">
                            <FoodIcon name={item.name} icon={item.icon} size="md" className="bg-transparent" />
                        </div>
                        
                        <div className="min-w-0 w-full">
                            <h3 className="text-sm font-bold text-brand-text capitalize leading-tight truncate px-1">{toTitleCase(item.name)}</h3>
                            <p className="text-xs text-brand-text-secondary font-medium mt-1">
                                {formatQuantity(item.quantity)} <span className="text-[10px] uppercase">{item.unit}</span>
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                     <div className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${novaBadgeStyles}`}>
                        <NovaIcon size={10} strokeWidth={3} />
                        <span className="truncate max-w-[60px]">{novaInfo.simpleLabel}</span>
                     </div>

                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTip();
                        }}
                        className="p-1.5 rounded-full bg-gray-50 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors relative"
                        title="Ver dicas"
                    >
                        <Lightbulb size={14} fill={item.tipRead ? "currentColor" : "none"} className={item.tipRead ? "opacity-80" : ""} />
                        {!item.tipRead && (
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
                        )}
                    </button>
                </div>
            </div>
            {isTipModalOpen && <HealthTipModal item={item} onClose={() => setIsTipModalOpen(false)} />}
        </>
    );
};

export default PantryItemCard;
