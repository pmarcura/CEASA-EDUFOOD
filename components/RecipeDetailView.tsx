
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { X, Clock, Users, BarChart, AlertTriangle, List, CheckSquare, ChefHat, Heart, Sparkles, Baby, Shield, Plus, Minus, CheckCircle2, ShoppingCart } from 'lucide-react';
import type { Recipe } from '../../types';

const getNumericServings = (serves: string): number => {
    const numbers = serves.match(/\d+(\.\d+)?/g);
    return numbers ? numbers.map(Number).reduce((acc, curr) => acc + curr, 0) : 2;
};

const RecipeDetailView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context || !context.viewingRecipe) return null;

    const { viewingRecipe: recipe, setViewingRecipe, setIsCookingMode, setCookingRecipe, pantry } = context;

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

    // Helper to check if ingredient is in pantry
    const checkPantryAvailability = (ingredientName: string) => {
        const normalizedName = ingredientName.toLowerCase().trim();
        // Simple contains check - can be improved with fuzzy search later
        return pantry.some(item => normalizedName.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(normalizedName));
    };

    // Calculate availability stats
    const availabilityStats = useMemo(() => {
        const allIngredients = scaledRecipe.ingredients.flatMap(s => s.items);
        const totalItems = allIngredients.length;
        const availableItems = allIngredients.filter(item => checkPantryAvailability(item.name)).length;
        return { total: totalItems, available: availableItems, percentage: totalItems > 0 ? (availableItems / totalItems) * 100 : 0 };
    }, [scaledRecipe, pantry]);


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

    const hasMissingItems = availabilityStats.percentage < 100;

    return (
        <div className="fixed inset-0 bg-brand-background z-30 flex flex-col">
            <header className="p-3 flex items-center justify-between border-b border-brand-border flex-shrink-0 bg-brand-surface">
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
                    {(recipe.context_tags || []).map(tag => (
                        <span key={tag} className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Pantry Availability Summary */}
                <div className="bg-brand-surface p-3 rounded-xl border border-brand-border">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-brand-text-secondary">Disponibilidade na Despensa</span>
                        <span className="text-xs font-bold text-brand-primary">{availabilityStats.available}/{availabilityStats.total} itens</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-500 ${availabilityStats.percentage === 100 ? 'bg-green-500' : 'bg-brand-primary'}`} 
                            style={{ width: `${availabilityStats.percentage}%` }} 
                        />
                    </div>
                    {availabilityStats.percentage < 100 && (
                         <p className="text-[10px] text-red-500 mt-1 font-medium text-right">Faltam {availabilityStats.total - availabilityStats.available} ingredientes</p>
                    )}
                </div>


                {/* Allergens */}
                {(recipe.allergens || []).length > 0 && (
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
                
                {/* Ingredients with Pantry Check */}
                <div className="bg-brand-surface p-4 rounded-xl shadow-sm">
                    <h3 className="font-bold text-lg mb-2 flex items-center justify-between">
                        <div className="flex items-center"><List className="mr-2 text-brand-primary"/>Ingredientes</div>
                    </h3>
                    {scaledRecipe.ingredients.map((section, index) => (
                        <div key={index} className="mb-2 last:mb-0">
                            <h4 className="font-semibold text-brand-text-secondary text-sm mb-1">{section.section}</h4>
                            <ul className="space-y-1.5">
                                {section.items.map((item, i) => {
                                    const inPantry = checkPantryAvailability(item.name);
                                    return (
                                        <li key={i} className={`flex items-start text-sm p-1.5 rounded-lg ${inPantry ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'}`}>
                                            <div className="flex-shrink-0 mr-2 mt-0.5">
                                                {inPantry ? (
                                                    <CheckCircle2 size={16} className="text-green-500" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full border border-red-300 bg-white" />
                                                )}
                                            </div>
                                            <span className={inPantry ? 'text-brand-text' : 'text-brand-text font-medium'}>
                                                <strong>{item.quantity} {item.unit}</strong> - {item.displayString.replace(/[\d.,]+\s*\w*\s*de\s*/, '')}
                                            </span>
                                            {!inPantry && (
                                                <ShoppingCart size={14} className="ml-auto text-red-400" />
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                     <p className="text-[10px] text-right text-brand-text-secondary mt-2 italic">*Verificação automática baseada no nome do item.</p>
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
                    className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center text-base shadow-lg transform active:scale-95 transition-colors ${
                        hasMissingItems 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                        : 'bg-brand-primary text-white hover:bg-brand-dark'
                    }`}
                >
                    <ChefHat className="mr-2" size={20} />
                    {hasMissingItems ? 'Cozinhar mesmo assim' : 'Iniciar Preparo'}
                </button>
                {hasMissingItems && (
                    <p className="text-[10px] text-center text-yellow-700 mt-2 font-medium">
                        Alguns ingredientes estão faltando na despensa digital.
                    </p>
                )}
            </footer>
        </div>
    );
};

export default RecipeDetailView;
