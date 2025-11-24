import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, Save } from 'lucide-react';
import type { Recipe } from '../../types';

interface EditableRecipeModalProps {
    recipe: Recipe;
    onClose: () => void;
    onUpdate: (updatedRecipe: Recipe) => void;
}

const EditableRecipeModal: React.FC<EditableRecipeModalProps> = ({ recipe, onClose, onUpdate }) => {
    const [editedRecipe, setEditedRecipe] = useState(recipe);

    const handleSave = () => {
        onUpdate(editedRecipe);
    };
    
    const ingredientsToString = (recipe: Recipe): string => {
        return recipe.ingredients
            .map(section => `${section.items.map(item => item.displayString).join('\n')}`)
            .join('\n\n');
    };
    
    const stepsToString = (recipe: Recipe): string => {
        return recipe.steps
            .map(step => step.instruction)
            .join('\n\n');
    };
    
    const stringToIngredients = (text: string): Recipe['ingredients'] => {
        // A simple parser, for a real app, this would need to be more robust
        return [{ section: 'Ingredientes', items: text.split('\n').filter(line => line.trim() !== '').map(line => ({ name: line, quantity: 1, unit: 'un', displayString: line })) }];
    };

    const stringToSteps = (text: string): Recipe['steps'] => {
         // A simple parser
        return text.split('\n\n').filter(line => line.trim() !== '').map((line, index) => {
            return { order: index + 1, title: `Passo ${index + 1}`, time_min: 5, instruction: line };
        });
    };
    

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-brand-background rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] flex flex-col animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-brand-border flex items-center justify-between flex-shrink-0">
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
                        <X size={20}/>
                    </button>
                    <h2 className="text-lg font-bold text-brand-text">Editar Receita</h2>
                    <button 
                        onClick={handleSave}
                        className="font-bold text-brand-primary px-4 py-2 rounded-lg hover:bg-brand-primary/10 transition-colors"
                    >
                        Salvar
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    <>
                        <div>
                            <label className="font-semibold text-sm">Título</label>
                            <input type="text" value={editedRecipe.title} onChange={e => setEditedRecipe(r => ({...r, title: e.target.value}))} className="w-full mt-1 p-2 border border-brand-border rounded-lg text-sm bg-white"/>
                        </div>
                         <div>
                            <label className="font-semibold text-sm">Ingredientes</label>
                            <textarea value={ingredientsToString(editedRecipe)} onChange={e => setEditedRecipe(r => ({...r, ingredients: stringToIngredients(e.target.value)}))} rows={6} className="w-full mt-1 p-2 border border-brand-border rounded-lg text-sm bg-white"/>
                        </div>
                         <div>
                            <label className="font-semibold text-sm">Passos</label>
                            <textarea value={stepsToString(editedRecipe)} onChange={e => setEditedRecipe(r => ({...r, steps: stringToSteps(e.target.value)}))} rows={8} className="w-full mt-1 p-2 border border-brand-border rounded-lg text-sm bg-white"/>
                        </div>
                    </>
                </main>
            </div>
        </div>,
        modalRoot
    );
};

export default EditableRecipeModal;