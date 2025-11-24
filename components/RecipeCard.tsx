
import React from 'react';
import type { Recipe } from '../types';
import { Clock, Users, ChefHat, ChevronRight, Sparkles } from 'lucide-react';

interface RecipeCardProps {
    recipe: Recipe;
    onSelect: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect }) => {
    return (
        <div 
            onClick={onSelect}
            className="group bg-white rounded-3xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md hover:border-brand-primary/30 relative overflow-hidden w-full"
        >
            {/* Decorative Gradient Blob */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-colors"></div>

            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {recipe.context_tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h3 className="font-display font-bold text-lg text-brand-text leading-tight mb-1 group-hover:text-brand-primary transition-colors">
                        {recipe.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs text-brand-text-secondary font-medium mt-3">
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                            <Clock size={12} className="text-brand-primary"/>
                            <span>{recipe.total_time_min} min</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                            <Users size={12} className="text-brand-primary"/>
                            <span>{recipe.serves}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end justify-between h-full gap-4">
                    <div className="w-10 h-10 bg-brand-background rounded-2xl flex items-center justify-center text-brand-primary shadow-inner">
                        <ChefHat size={20} />
                    </div>
                </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Sparkles size={12} />
                    <span>Sugestão IA</span>
                </div>
                <span className="text-xs font-bold text-brand-primary flex items-center group-hover:translate-x-1 transition-transform">
                    Ver Receita <ChevronRight size={14} className="ml-0.5"/>
                </span>
            </div>
        </div>
    );
};

export default RecipeCard;
