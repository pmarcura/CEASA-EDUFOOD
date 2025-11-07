import React from 'react';
import type { Recipe } from '../types';
import { Clock, Users, ArrowRight } from 'lucide-react';

interface RecipeCardProps {
    recipe: Recipe;
    onSelect: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSelect }) => {
    return (
        <button 
            onClick={onSelect}
            className="bg-transparent rounded-xl p-2 w-full text-left transition-all hover:bg-black/5"
        >
            <div className="flex justify-between items-start">
                <h3 className="text-md font-bold text-brand-text mb-2 flex-1 pr-2">{recipe.title}</h3>
                <div className="p-2 bg-brand-ios-gray-dark/50 rounded-full">
                    <ArrowRight className="text-brand-text" size={16} />
                </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-brand-text-secondary">
                <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>{recipe.total_time_min} min</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Users size={14} />
                    <span>{recipe.serves}</span>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
                {recipe.context_tags.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-black/5 text-brand-text-secondary text-xs font-medium px-2.5 py-1 rounded-full">
                        {tag}
                    </span>
                ))}
            </div>
        </button>
    );
};

export default RecipeCard;