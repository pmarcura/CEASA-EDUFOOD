

import React from 'react';
import type { Recipe } from '../types';
import { Clock, Users, CheckCircle2, AlertTriangle, ShoppingCart, Eye } from 'lucide-react';

interface PlannerRecipeCardProps {
    recipe: Recipe;
    onView: () => void;
}

const PlannerRecipeCard: React.FC<PlannerRecipeCardProps> = ({ recipe, onView }) => {
    
    const statusInfo = {
        complete: { Icon: CheckCircle2, text: "Ingredientes na despensa", color: "text-green-600" },
        partial: { Icon: AlertTriangle, text: "Faltam alguns itens", color: "text-yellow-600" },
        missing: { Icon: ShoppingCart, text: "Precisa comprar", color: "text-red-600" }
    }[recipe.pantryStatus || 'missing'];
    
    return (
        <button 
            onClick={onView}
            className="w-full bg-white rounded-xl p-3 border border-gray-200 shadow-sm text-left hover:border-brand-primary transition-colors"
        >
            <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                    <h4 className="text-md font-bold text-brand-text">{recipe.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-brand-text-secondary my-1.5">
                        <div className="flex items-center gap-1"><Clock size={12} /><span>{recipe.total_time_min} min</span></div>
                        <div className="flex items-center gap-1"><Users size={12} /><span>{recipe.serves}</span></div>
                    </div>
                </div>
                 <div className="flex flex-col items-center text-center text-xs font-semibold text-brand-text-secondary">
                    <div className="p-2 bg-gray-100 rounded-full mb-1">
                        <Eye size={16} />
                    </div>
                    <span>Ver</span>
                 </div>
            </div>
            
             <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2 text-xs">
                <statusInfo.Icon size={14} className={`flex-shrink-0 ${statusInfo.color}`} />
                <p className={`font-semibold ${statusInfo.color}`}>{statusInfo.text}</p>
            </div>
        </button>
    );
};

export default PlannerRecipeCard;
