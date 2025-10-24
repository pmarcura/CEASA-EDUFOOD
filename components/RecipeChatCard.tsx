import React from 'react';
import type { Recipe } from '../types';
import { BookCheck, BookMarked } from 'lucide-react';

interface RecipeChatCardProps {
    recipe: Recipe;
    onSave: (recipe: Recipe) => void;
    isSaved: boolean;
}

const RecipeChatCard: React.FC<RecipeChatCardProps> = ({ recipe, onSave, isSaved }) => (
    <div className="bg-brand-surface rounded-xl shadow-edu p-4 border border-brand-border w-full">
        <div className="flex justify-between items-start">
            <h3 className="text-md font-bold text-brand-text mb-2 flex-1 pr-2">{recipe.title}</h3>
            <button 
                onClick={() => onSave(recipe)} 
                disabled={isSaved}
                className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${isSaved ? 'text-brand-primary bg-brand-primary/10 cursor-default' : 'text-brand-text-secondary bg-gray-100 hover:bg-gray-200'}`}
                aria-label={isSaved ? 'Receita salva' : 'Salvar receita'}
            >
                {isSaved ? <BookCheck size={14} /> : <BookMarked size={14} />}
                <span>{isSaved ? 'Salva' : 'Salvar'}</span>
            </button>
        </div>
        <details>
            <summary className="font-semibold text-sm text-brand-text-secondary cursor-pointer hover:text-brand-primary">Ver detalhes</summary>
            <div className="mt-2 pt-2 border-t border-brand-border">
                 <div className="mb-2">
                    <h4 className="font-semibold text-brand-text mb-1 text-sm">Ingredientes:</h4>
                    <ul className="list-disc list-inside text-xs text-brand-text-secondary space-y-1">
                        {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold text-brand-text mb-1 text-sm">Modo de Preparo:</h4>
                    <p className="text-xs text-brand-text-secondary whitespace-pre-line">{recipe.instructions}</p>
                </div>
            </div>
        </details>
    </div>
);

export default RecipeChatCard;