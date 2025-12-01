
import React, { useContext, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { AppContext } from '../../contexts/AppContext';
import { X, Plus, Sun, Moon, Coffee, Sandwich, BookOpen, Edit, Trash2, Save, LoaderCircle } from 'lucide-react';
import type { MealLogEntry, Recipe } from '../../types';
import { generateRecipeFromTitle } from '../../services/geminiService';
import EditableRecipeModal from './EditableRecipeModal';

interface MealDetailModalProps {
    date: Date;
    onClose: () => void;
}

const getMealCategory = (timestamp: number) => {
    const hour = new Date(timestamp).getHours();
    if (hour < 11) return { name: 'Café da Manhã', icon: Coffee };
    if (hour < 15) return { name: 'Almoço', icon: Sun };
    if (hour < 18) return { name: 'Lanche da Tarde', icon: Sandwich };
    return { name: 'Jantar', icon: Moon };
};

const MealDetailModal: React.FC<MealDetailModalProps> = ({ date, onClose }) => {
    const context = useContext(AppContext);
    const [newMealName, setNewMealName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingMeal, setEditingMeal] = useState<MealLogEntry | null>(null);
    
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot || !context) return null;

    const { mealLog, addMealLogEntry, setViewingRecipe, setIsViewingProfile, updateMealLogEntry, deleteMealLogEntry } = context;

    const mealsForDay = useMemo(() => {
        return mealLog
            .filter(log => new Date(log.timestamp).toDateString() === date.toDateString())
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [mealLog, date]);

    const groupedMeals = useMemo(() => {
        const groups: { [key: string]: MealLogEntry[] } = {};
        mealsForDay.forEach(meal => {
            const category = getMealCategory(meal.timestamp).name;
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(meal);
        });
        return groups;
    }, [mealsForDay]);

    const handleAddMeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMealName.trim() || isAdding) return;

        setIsAdding(true);
        try {
            const generatedRecipe = await generateRecipeFromTitle(newMealName);

            const mealTimestamp = new Date(date);
            // Default to lunch time if adding manually
            mealTimestamp.setHours(12, 30, 0, 0);

            await addMealLogEntry({
                recipeTitle: generatedRecipe.title,
                timestamp: mealTimestamp.getTime(),
                recipe: generatedRecipe,
            });
            
            setNewMealName('');
        } catch (error) {
            console.error("Failed to generate recipe from title:", error);
            // Optionally show an error to the user
        } finally {
            setIsAdding(false);
        }
    };

    const handleViewRecipe = (recipe: Recipe) => {
        setViewingRecipe(recipe);
        onClose(); // Closes the current modal
        setIsViewingProfile(false); // Closes the profile screen to reveal the recipe view
    };
    
    const handleDelete = async (mealId: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta refeição?")) {
            setDeletingId(mealId);
            try {
                await deleteMealLogEntry(mealId);
            } catch (error) {
                console.error("Failed to delete meal:", error);
            } finally {
                setDeletingId(null);
            }
        }
    };
    
    const handleUpdateMeal = async (updatedRecipe: Recipe) => {
        if (!editingMeal) return;
        await updateMealLogEntry(editingMeal.id, {
            recipe: updatedRecipe,
            recipeTitle: updatedRecipe.title,
        });
        setEditingMeal(null);
    };


    return ReactDOM.createPortal(
        <>
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-brand-surface rounded-2xl shadow-lg w-full max-w-sm p-5 max-h-[80vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-brand-border">
                        <h4 className="text-lg font-bold">Refeições de {date.toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</h4>
                        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                        {Object.keys(groupedMeals).length > 0 ? (
                            Object.keys(groupedMeals).map((category) => {
                                const meals = groupedMeals[category];
                                if (!meals || meals.length === 0) return null;
                                const CategoryIcon = getMealCategory(meals[0].timestamp).icon;
                                return (
                                    <div key={category}>
                                        <h5 className="font-bold text-brand-text flex items-center gap-2 mb-2">
                                            <CategoryIcon size={18} className="text-brand-primary" />
                                            {category}
                                        </h5>
                                        <div className="space-y-2 pl-4 border-l-2 border-brand-primary-light">
                                            {meals.map(meal => (
                                                <div key={meal.id} className="bg-brand-background p-2 rounded-md flex justify-between items-center group">
                                                    <div>
                                                        <p className="text-sm font-semibold text-brand-text-secondary">{meal.recipeTitle}</p>
                                                        {meal.recipe && (
                                                            <button onClick={() => handleViewRecipe(meal.recipe!)} className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-brand-primary-light px-2 py-1 rounded-md">
                                                                <BookOpen size={14}/> Ver Receita
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {meal.recipe && <button onClick={() => setEditingMeal(meal)} className="p-1.5 hover:bg-gray-200 rounded-full"><Edit size={14}/></button>}
                                                        <button onClick={() => handleDelete(meal.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-full" disabled={deletingId === meal.id}>
                                                            {deletingId === meal.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14}/>}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-center text-brand-text-secondary py-8">Nenhuma refeição registrada para este dia.</p>
                        )}
                    </div>

                    <div className="flex-shrink-0 pt-4 border-t border-brand-border">
                        <h5 className="font-bold text-center mb-2">Adicionar Refeição</h5>
                        <form onSubmit={handleAddMeal} className="flex gap-2">
                            <input
                                type="text"
                                value={newMealName}
                                onChange={(e) => setNewMealName(e.target.value)}
                                placeholder="Ex: Lasanha à bolonhesa"
                                className="flex-grow bg-brand-background border border-brand-border rounded-lg p-2.5 text-sm"
                                disabled={isAdding}
                            />
                            <button
                                type="submit"
                                disabled={!newMealName.trim() || isAdding}
                                className="p-3 bg-brand-primary text-white rounded-lg disabled:bg-gray-300 w-12 flex items-center justify-center"
                            >
                                {isAdding ? <LoaderCircle size={20} className="animate-spin" /> : <Plus size={20}/>}
                            </button>
                        </form>
                         <p className="text-xs text-center text-brand-text-secondary mt-2">A IA irá gerar uma receita completa para você!</p>
                    </div>
                </div>
            </div>
            {editingMeal && editingMeal.recipe && (
                <EditableRecipeModal
                    recipe={editingMeal.recipe}
                    onClose={() => setEditingMeal(null)}
                    onUpdate={handleUpdateMeal}
                />
            )}
        </>,
        modalRoot
    );
};

export default MealDetailModal;
