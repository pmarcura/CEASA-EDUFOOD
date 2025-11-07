
import React, { useContext, useState, useRef } from 'react';
import type { PantryItem } from '../types';
import { AppContext } from '../../contexts/AppContext';
import { X, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import DynamicIcon from './DynamicIcon';
import { NOVA_CLASSIFICATION } from '../constants/foodClassifications';

interface PantryListItemProps {
    item: PantryItem;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    onEditRequest: (item: PantryItem) => void;
}

const SwipeableItem: React.FC<{
    children: React.ReactNode;
    onDelete: () => void;
    onEdit: () => void;
    isSelectionMode: boolean;
}> = ({ children, onDelete, onEdit, isSelectionMode }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const startX = useRef(0);
    const currentX = useRef(0);
    const isSwiping = useRef(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isSelectionMode) return;
        startX.current = e.touches[0].clientX;
        isSwiping.current = true;
        itemRef.current!.style.transition = 'none';
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping.current || isSelectionMode) return;
        const deltaX = e.touches[0].clientX - startX.current;
        currentX.current = Math.max(-144, Math.min(0, deltaX)); // Max swipe left = 144px
        itemRef.current!.style.transform = `translateX(${currentX.current}px)`;
    };

    const handleTouchEnd = () => {
        if (!isSwiping.current || isSelectionMode) return;
        isSwiping.current = false;
        itemRef.current!.style.transition = 'transform 0.3s ease';

        if (currentX.current < -72) { // Threshold to snap open
            currentX.current = -144;
        } else {
            currentX.current = 0;
        }
        itemRef.current!.style.transform = `translateX(${currentX.current}px)`;
    };
    
    const resetPosition = () => {
       if (itemRef.current) {
            itemRef.current.style.transition = 'transform 0.3s ease';
            itemRef.current.style.transform = 'translateX(0px)';
            currentX.current = 0;
       }
    };

    return (
        <div className="relative w-full overflow-hidden bg-brand-surface rounded-xl">
            <div className="absolute top-0 right-0 h-full flex z-0">
                <button onClick={() => { onEdit(); resetPosition(); }} className="bg-blue-500 text-white w-18 flex flex-col items-center justify-center p-2"><Edit size={20} /><span className="text-xs mt-1">Editar</span></button>
                <button onClick={() => { onDelete(); resetPosition(); }} className="bg-red-500 text-white w-18 flex flex-col items-center justify-center p-2"><Trash2 size={20} /><span className="text-xs mt-1">Excluir</span></button>
            </div>
            <div 
                ref={itemRef} 
                className="relative z-10 bg-brand-surface"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
};


const PantryListItem: React.FC<PantryListItemProps> = ({ item, isSelectionMode, isSelected, onToggleSelection, onEditRequest }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { removeItemFromPantry } = context;
    
    const novaInfo = NOVA_CLASSIFICATION[item.novaClassification];

    const content = (
         <div 
            className={`w-full bg-brand-surface p-2.5 flex items-center justify-between gap-3 transition-all duration-200 ${isSelected ? 'bg-green-50' : 'hover:shadow-md'}`}
            onClick={() => isSelectionMode && onToggleSelection(item.id)}
        >
            {isSelectionMode && (
                <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-brand-primary' : 'border-2 border-gray-300'}`}>
                    {isSelected && <CheckCircle2 size={20} className="text-white" />}
                </div>
            )}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                 <div className={`p-2 rounded-full flex-shrink-0`} style={{ backgroundColor: `${item.color}20` }}>
                    <DynamicIcon name={item.icon} className="w-5 h-5" style={{ color: item.color }}/>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-brand-text capitalize truncate">{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                         <span className={`font-semibold capitalize px-1.5 py-0.5 rounded-md text-[10px] ${novaInfo.color}`}>{novaInfo.label}</span>
                         <span className="text-[10px] text-brand-text-secondary bg-gray-100 px-1.5 py-0.5 rounded-md">{item.codexCategory}</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <span className="text-sm font-bold text-brand-text">{item.quantity}</span>
                <span className="text-xs text-brand-text-secondary ml-1">{item.unit}</span>
            </div>
        </div>
    );

    return (
        <SwipeableItem 
            onDelete={() => removeItemFromPantry(item.id)} 
            onEdit={() => onEditRequest(item)}
            isSelectionMode={isSelectionMode}
        >
            {content}
        </SwipeableItem>
    );
};

export default PantryListItem;