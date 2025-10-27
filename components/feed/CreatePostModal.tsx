
import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { X, ArrowRight, Image as ImageIcon, ChefHat, LoaderCircle, ArrowLeft } from 'lucide-react';
import type { Recipe, RecipeIngredient, RecipeStep } from '../../types';

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const CreatePostModal = ({ onClose }: { onClose: () => void }) => {
    const context = useContext(AppContext);
    const [image, setImage] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [recipeTitle, setRecipeTitle] = useState('');
    const [recipeTime, setRecipeTime] = useState(30);
    const [recipeServes, setRecipeServes] = useState('2 adultos');
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([{ name: '', quantity: 1, unit: 'un', displayString: '' }]);
    const [recipeSteps, setRecipeSteps] = useState<Partial<RecipeStep>[]>([{ instruction: '' }]);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const dataUrl = await fileToDataURL(e.target.files[0]);
            setImage(dataUrl);
        }
    };

    const handleAddIngredient = () => setRecipeIngredients([...recipeIngredients, { name: '', quantity: 1, unit: 'un', displayString: '' }]);
    const handleRemoveIngredient = (index: number) => setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
    const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string | number) => {
        const newIngredients = [...recipeIngredients];
        (newIngredients[index] as any)[field] = value;
        setRecipeIngredients(newIngredients);
    };

    const handleAddStep = () => setRecipeSteps([...recipeSteps, { instruction: '' }]);
    const handleRemoveStep = (index: number) => setRecipeSteps(recipeSteps.filter((_, i) => i !== index));
    const handleStepChange = (index: number, value: string) => {
        const newSteps = [...recipeSteps];
        newSteps[index].instruction = value;
        setRecipeSteps(newSteps);
    };

    const handleSaveRecipe = () => {
        const fullRecipe: Recipe = {
            title: recipeTitle,
            total_time_min: recipeTime,
            serves: recipeServes,
            level: 'Fácil',
            context_tags: ['Caseiro'],
            allergens: [],
            ingredients: [{ section: 'Principal', items: recipeIngredients }],
            tools: ['Faca', 'Tábua'],
            steps: recipeSteps.map((s, i) => ({
                order: i + 1,
                title: `Passo ${i + 1}`,
                time_min: Math.round(recipeTime / recipeSteps.length),
                instruction: s.instruction || '',
            })),
            storage: 'Manter refrigerado.',
        };
        setRecipe(fullRecipe);
        setIsCreatingRecipe(false);
    };

    const handleSubmit = async () => {
        if (!image || !caption || !context) return;
        setIsLoading(true);
        try {
            await context.createPost({
                caption,
                image,
                recipe: recipe || undefined,
            });
            onClose();
        } catch (error) {
            console.error("Failed to create post:", error);
            alert("Erro ao criar post. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-brand-background z-50 flex flex-col animate-fade-in">
            <header className="flex items-center justify-between p-3 border-b border-brand-border">
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
                <h2 className="font-bold text-lg">{isCreatingRecipe ? 'Criar Receita' : 'Novo Post'}</h2>
                <button 
                    onClick={handleSubmit} 
                    disabled={!image || !caption || isLoading}
                    className="font-bold text-brand-primary disabled:text-gray-400 transition-colors"
                >
                    {isLoading ? <LoaderCircle className="animate-spin" /> : 'Publicar'}
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {isCreatingRecipe ? (
                    // Recipe Creation View
                    <div>
                        <input type="text" placeholder="Nome da Receita" value={recipeTitle} onChange={e => setRecipeTitle(e.target.value)} className="w-full p-2 border rounded-md mb-2" />
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <input type="number" placeholder="Tempo (min)" value={recipeTime} onChange={e => setRecipeTime(Number(e.target.value))} className="w-full p-2 border rounded-md" />
                            <input type="text" placeholder="Serve" value={recipeServes} onChange={e => setRecipeServes(e.target.value)} className="w-full p-2 border rounded-md" />
                        </div>
                        <h3 className="font-bold mb-2">Ingredientes</h3>
                        {recipeIngredients.map((ing, i) => (
                            <div key={i} className="flex gap-1 mb-1">
                                <input type="text" placeholder="Nome" value={ing.name} onChange={e => handleIngredientChange(i, 'name', e.target.value)} className="w-full p-1 border rounded-md text-sm" />
                                <input type="number" placeholder="Qtd" value={ing.quantity} onChange={e => handleIngredientChange(i, 'quantity', Number(e.target.value))} className="w-16 p-1 border rounded-md text-sm" />
                                <input type="text" placeholder="Un" value={ing.unit} onChange={e => handleIngredientChange(i, 'unit', e.target.value)} className="w-16 p-1 border rounded-md text-sm" />
                                <button onClick={() => handleRemoveIngredient(i)} className="p-1 text-red-500"><X size={16}/></button>
                            </div>
                        ))}
                        <button onClick={handleAddIngredient} className="text-sm text-brand-primary font-semibold mb-4">+ Ingrediente</button>

                        <h3 className="font-bold mb-2">Passos</h3>
                        {recipeSteps.map((step, i) => (
                             <div key={i} className="flex gap-1 mb-1 items-center">
                                <span className="font-bold mr-1">{i+1}.</span>
                                <textarea placeholder="Instrução" value={step.instruction} onChange={e => handleStepChange(i, e.target.value)} rows={1} className="w-full p-1 border rounded-md text-sm" />
                                <button onClick={() => handleRemoveStep(i)} className="p-1 text-red-500"><X size={16}/></button>
                            </div>
                        ))}
                        <button onClick={handleAddStep} className="text-sm text-brand-primary font-semibold mb-4">+ Passo</button>

                        <div className="flex gap-2 mt-4">
                             <button onClick={() => setIsCreatingRecipe(false)} className="w-full flex items-center justify-center gap-1.5 bg-gray-200 text-brand-text font-bold py-3 px-4 rounded-xl"><ArrowLeft size={18}/> Voltar</button>
                             <button onClick={handleSaveRecipe} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl">Salvar Receita</button>
                        </div>
                    </div>
                ) : (
                    // Post Creation View
                    <>
                        <div className="flex items-start gap-3">
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                {image ? <img src={image} className="w-full h-full object-cover rounded-lg" /> : <ImageIcon className="text-gray-400" />}
                            </div>
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Escreva uma legenda..."
                                className="w-full h-24 bg-transparent focus:outline-none text-base"
                            />
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="text-brand-primary font-semibold text-sm">{image ? 'Trocar foto' : 'Selecionar foto'}</button>
                        
                        <div className="border-t border-brand-border pt-4 mt-4">
                            {recipe ? (
                                <div className="bg-green-50 p-3 rounded-lg flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <ChefHat className="text-brand-primary" />
                                        <p className="font-bold text-brand-text">{recipe.title}</p>
                                    </div>
                                    <button onClick={() => setRecipe(null)} className="text-red-500"><X size={18}/></button>
                                </div>
                            ) : (
                                <button onClick={() => setIsCreatingRecipe(true)} className="w-full flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg">
                                    <span className="font-semibold">Adicionar Receita</span>
                                    <ArrowRight />
                                </button>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default CreatePostModal;
