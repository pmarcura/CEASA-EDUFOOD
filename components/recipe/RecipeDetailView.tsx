
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { X, Clock, Users, BarChart, AlertTriangle, List, CheckSquare, ChefHat, Heart, Sparkles, Baby, Shield, Plus, Minus } from 'lucide-react';
import type { Recipe } from '../../types';

const getNumericServings = (serves: string): number => {
    const numbers = serves.match(/\d+(\.\d+)?/g);
    return numbers ? numbers.map(Number).reduce((acc, curr) => acc + curr, 0) : 2;
};

const RecipeDetailView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context || !context.viewingRecipe) return null;

    const { viewingRecipe: recipe, setViewingRecipe, setIsCookingMode, setCookingRecipe } = context;

    const originalServings = useMemo(() => getNumericServings(recipe.serves), [recipe.serves]);
    const [currentServings, setCurrentServings] = useState(originalServings);

    const scaleFactor = currentServings / originalServings;

    const scaledRecipe = useMemo<Recipe>(() => {
        if (scaleFactor === 1) return recipe;
        return {
            ...recipe,
            serves: `Serve ${currentServings}`,
            ingredients: recipe.ingredients.map(section => ({
                ...section,
                items: section.items.map(item => ({
                    ...item,
                    quantity: parseFloat((item.quantity * scaleFactor).toFixed(2)),
                })),
            })),
        };
    }, [recipe, scaleFactor, currentServings]);

    const handleStartCooking = () => {
        setCookingRecipe(scaledRecipe);
        setIsCookingMode(true);
    };
    
    const handleClose = () => {
        setViewingRecipe(null);
        setIsCookingMode(false);
    };
    
    const handleServingChange = (amount: number) => {
        setCurrentServings(prev => Math.max(1, prev + amount));
    };

    return (
        <div className="fixed inset-0 bg-brand-background z-30 flex flex-col">
            <header className="p-3 flex items-center justify-between border-b border-brand-border flex-shrink-0">
                <h2 className="text-lg font-bold text-brand-text truncate pr-4">{recipe.title}</h2>
                <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100">
                    <X size={20} />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Quick Info */}
                <div className="grid grid-cols-3 gap-2 text-center">
                     <div className="bg-brand-surface p-2.5 rounded-xl shadow-sm">
                        <Clock className="mx-auto mb-1 text-brand-primary" size={18} />
                        <p className="text-xs font-bold">{recipe.total_time_min} min</p>
                    </div>
                     <div className="bg-brand-surface p-2.5 rounded-xl shadow-sm col-span-1">
                         <Users className="mx-auto mb-1 text-brand-primary" size={18} />
                         <div className="flex items-center justify-center gap-2">
                             <button onClick={() => handleServingChange(-1)} className="p-1 rounded-full bg-gray-200 disabled:opacity-50" disabled={currentServings <= 1}><Minus size={12}/></button>
                             <span className="text-xs font-bold w-4 text-center">{currentServings}</span>
                             <button onClick={() => handleServingChange(1)} className="p-1 rounded-full bg-gray-200"><Plus size={12}/></button>
                         </div>
                    </div>
                     <div className="bg-brand-surface p-2.5 rounded-xl shadow-sm">
                        <BarChart className="mx-auto mb-1 text-brand-primary" size={18} />
                        <p className="text-xs font-bold">{recipe.level}</p>
                    </div>
                </div>
                
                {/* Tags */}
                 <div className="flex flex-wrap justify-center gap-1.5">
                    {recipe.context_tags.map(tag => (
                        <span key={tag} className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Allergens */}
                {recipe.allergens.length > 0 && (
                     <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-2.5 rounded-md">
                        <div className="flex items-center">
                            <AlertTriangle size={18} className="mr-2.5"/>
                            <div>
                                <h4 className="font-bold text-sm">Contém Alérgenos</h4>
                                <p className="text-xs capitalize">{recipe.allergens.join(', ')}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Ingredients */}
                <div className="bg-brand-surface p-4 rounded-xl shadow-sm">
                    <h3 className="font-bold text-lg mb-2 flex items-center"><List className="mr-2 text-brand-primary"/>Ingredientes</h3>
                    {scaledRecipe.ingredients.map((section, index) => (
                        <div key={index} className="mb-2 last:mb-0">
                            <h4 className="font-semibold text-brand-text-secondary text-sm">{section.section}</h4>
                            <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                                {section.items.map((item, i) => (
                                    <li key={i}>
                                        <strong>{item.quantity} {item.unit}</strong> - {item.displayString.replace(/[\d.,]+\s*\w*\s*de\s*/, '')}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Utensils */}
                <div className="bg-brand-surface p-4 rounded-xl shadow-sm">
                    <h3 className="font-bold text-lg mb-2 flex items-center"><ChefHat className="mr-2 text-brand-primary"/>Utensílios</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        {recipe.tools.map((tool, i) => <li key={i}>{tool}</li>)}
                    </ul>
                </div>
                
                {/* Steps Overview */}
                <div className="bg-brand-surface p-4 rounded-xl shadow-sm">
                    <h3 className="font-bold text-lg mb-3 flex items-center"><CheckSquare className="mr-2 text-brand-primary"/>Passo a Passo</h3>
                    <div className="space-y-4">
                        {recipe.steps.map(step => (
                            <div key={step.order} className="flex gap-3 items-start">
                                <div className="flex-shrink-0 w-7 h-7 bg-brand-primary text-white font-bold rounded-full flex items-center justify-center text-sm">{step.order}</div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{step.title} <span className="text-xs font-normal text-brand-text-secondary">({step.time_min} min)</span></p>
                                    <p className="text-sm text-brand-text-secondary">{step.instruction}</p>
                                      {step.tip && <p className="text-xs text-blue-600 bg-blue-50 p-1.5 rounded-md mt-1.5 flex items-start gap-1.5"><Heart size={14} className="flex-shrink-0 mt-0.5" /> {step.tip}</p>}
                                      {step.child_friendly && <p className="text-xs text-green-600 bg-green-50 p-1.5 rounded-md mt-1.5 flex items-start gap-1.5"><Baby size={14} className="flex-shrink-0 mt-0.5"/> {step.child_friendly}</p>}
                                      {step.safety && <p className="text-xs text-red-600 bg-red-50 p-1.5 rounded-md mt-1.5 flex items-start gap-1.5"><Shield size={14} className="flex-shrink-0 mt-0.5"/> {step.safety}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Final Touches */}
                <div className="bg-brand-surface p-4 rounded-xl shadow-sm">
                    <h3 className="font-bold text-lg mb-2 flex items-center"><Sparkles className="mr-2 text-brand-primary"/>Finalização</h3>
                    {recipe.presentation_suggestion && <p className="text-sm mb-2"><strong>Apresentação:</strong> {recipe.presentation_suggestion}</p>}
                    <p className="text-sm"><strong>Armazenamento:</strong> {recipe.storage}</p>
                </div>
            </main>
            
            <footer className="p-3 border-t border-brand-border bg-brand-surface/80 backdrop-blur-sm flex-shrink-0">
                <button 
                    onClick={handleStartCooking}
                    className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-base shadow-lg transform hover:scale-105 transition-colors hover:bg-brand-dark"
                >
                    <ChefHat className="mr-2" size={20} />
                    Iniciar Preparo
                </button>
            </footer>
        </div>
    );
};

export default RecipeDetailView;
