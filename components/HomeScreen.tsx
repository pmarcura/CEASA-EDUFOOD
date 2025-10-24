import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ArrowRight, BotMessageSquare, Book, Award, UtensilsCrossed, BookMarked } from 'lucide-react';
import type { Tab, Recipe } from '../types';

interface HomeScreenProps {
  setActiveTab: (tab: Tab) => void;
}

const SavedRecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
    <div className="bg-brand-surface rounded-2xl shadow-edu p-4 border-t-4 border-brand-primary/50">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-md font-bold text-brand-text">{recipe.title}</h3>
            <BookMarked size={18} className="text-brand-primary" />
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

const HomeScreen: React.FC<HomeScreenProps> = ({ setActiveTab }) => {
    const context = useContext(AppContext);
    const { savedRecipes } = context || {};

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 grid-rows-2 gap-4 h-64">
                <button onClick={() => setActiveTab('chat')} className="relative row-span-2 bg-brand-accent-lime rounded-3xl p-4 flex flex-col justify-between items-start text-brand-text transition-transform transform hover:scale-105">
                    <div className="flex justify-between items-center w-full">
                        <BotMessageSquare size={24} />
                        <ArrowRight size={24} />
                    </div>
                    <h2 className="text-xl font-bold">Conversar com o Professor Nutri</h2>
                </button>

                <button onClick={() => setActiveTab('pantry')} className="relative bg-brand-accent-green rounded-3xl p-4 flex flex-col justify-between items-start text-brand-text transition-transform transform hover:scale-105">
                    <div className="flex justify-between items-center w-full">
                        <Book size={24} />
                        <ArrowRight size={24} />
                    </div>
                    <h2 className="text-lg font-semibold">Ver minha Despensa</h2>
                </button>

                <button onClick={() => setActiveTab('progress')} className="relative bg-brand-accent-pink rounded-3xl p-4 flex flex-col justify-between items-start text-brand-text transition-transform transform hover:scale-105">
                     <div className="flex justify-between items-center w-full">
                        <Award size={24} />
                        <ArrowRight size={24} />
                    </div>
                    <h2 className="text-lg font-semibold">Acompanhar Progresso</h2>
                </button>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-brand-text mb-4">Meu Livro de Receitas</h2>
                {savedRecipes && savedRecipes.length > 0 ? (
                    <div className="space-y-4">
                        {savedRecipes.map((recipe, index) => (
                           <SavedRecipeCard key={index} recipe={recipe} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-brand-text-secondary mt-4 p-6 bg-brand-surface rounded-2xl">
                         <UtensilsCrossed size={32} className="text-gray-300 mx-auto mb-2" />
                        <p>Suas receitas salvas aparecerão aqui.</p>
                        <p className="text-xs">Peça sugestões ao Professor Nutri no chat!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomeScreen;