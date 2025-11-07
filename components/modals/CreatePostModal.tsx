
import React, { useState, useContext, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Image as ImageIcon, PlusCircle, ChefHat, Sparkles, LoaderCircle } from 'lucide-react';
import { AppContext } from '../../contexts/AppContext';
import { analyzeUserRecipe } from '../../services/geminiService';
import type { Recipe } from '../../types';

interface CreatePostModalProps {
    onClose: () => void;
}

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose }) => {
    const context = useContext(AppContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [image, setImage] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [addRecipe, setAddRecipe] = useState(false);
    const [recipeTitle, setRecipeTitle] = useState('');
    const [recipeIngredients, setRecipeIngredients] = useState('');
    const [recipeSteps, setRecipeSteps] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedRecipe, setAnalyzedRecipe] = useState<Recipe | null>(null);
    const [error, setError] = useState('');

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageDataUrl = await fileToDataURL(file);
            setImage(imageDataUrl);
        }
    };

    const handleAnalyzeRecipe = async () => {
        if (!recipeTitle || !recipeIngredients || !recipeSteps) {
            setError('Preencha o título, ingredientes e passos para a análise.');
            return;
        }
        setIsAnalyzing(true);
        setError('');
        try {
            const result = await analyzeUserRecipe(recipeTitle, recipeIngredients, recipeSteps);
            setAnalyzedRecipe(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Falha ao analisar a receita.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = () => {
        if (!image || !caption) {
            setError('Por favor, adicione uma imagem e uma legenda.');
            return;
        }
        if (addRecipe && !analyzedRecipe) {
            setError('Por favor, analise sua receita com a IA antes de postar.');
            return;
        }

        context?.addPostToFeed({
            image,
            caption,
            recipe: addRecipe ? analyzedRecipe! : undefined,
        });
        onClose();
    };
    
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose}>
            <div 
                className="bg-brand-background rounded-t-2xl shadow-lg w-full max-h-[95vh] flex flex-col animate-slide-in-up"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-brand-border flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-brand-text">Criar Publicação</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20}/></button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-square bg-brand-surface border-2 border-dashed border-brand-border rounded-xl flex flex-col items-center justify-center text-brand-text-secondary cursor-pointer"
                    >
                        {image ? (
                            <img src={image} alt="Prévia da publicação" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <>
                                <ImageIcon size={40} />
                                <p className="mt-2 font-semibold">Adicionar Foto</p>
                            </>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    </div>

                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Escreva uma legenda..."
                        rows={3}
                        className="w-full bg-brand-surface border border-brand-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    
                    <div className="border-t border-brand-border pt-4">
                         <label className="flex items-center justify-between cursor-pointer">
                            <span className="font-bold text-brand-text flex items-center gap-2"><ChefHat size={18}/> Adicionar Receita</span>
                            <div className="relative">
                                <input type="checkbox" checked={addRecipe} onChange={() => setAddRecipe(!addRecipe)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                            </div>
                        </label>
                    </div>

                    {addRecipe && (
                        <div className="space-y-3 p-3 bg-brand-surface border border-brand-border rounded-xl animate-fade-in">
                            <h3 className="font-semibold text-center">Detalhes da Receita</h3>
                             <input type="text" value={recipeTitle} onChange={e => setRecipeTitle(e.target.value)} placeholder="Título da Receita" className="w-full text-sm bg-brand-background border border-brand-border rounded-lg p-2.5"/>
                             <textarea rows={4} value={recipeIngredients} onChange={e => setRecipeIngredients(e.target.value)} placeholder="Ingredientes (ex: 1 xícara de farinha, 2 ovos)" className="w-full text-sm bg-brand-background border border-brand-border rounded-lg p-2.5"/>
                             <textarea rows={6} value={recipeSteps} onChange={e => setRecipeSteps(e.target.value)} placeholder="Passo a passo (ex: 1. Misture os ingredientes secos...)" className="w-full text-sm bg-brand-background border border-brand-border rounded-lg p-2.5"/>
                             
                             {analyzedRecipe ? (
                                <div className="text-center p-3 bg-green-50 text-green-800 rounded-lg">
                                    <p className="font-bold">Receita analisada com sucesso!</p>
                                    <p className="text-xs">Tempo: {analyzedRecipe.total_time_min}min | Nível: {analyzedRecipe.level}</p>
                                </div>
                             ) : (
                                <button
                                    onClick={handleAnalyzeRecipe}
                                    disabled={isAnalyzing}
                                    className="w-full flex items-center justify-center gap-2 bg-brand-ios-blue text-white font-bold py-2.5 px-4 rounded-xl disabled:bg-gray-400 transition-colors"
                                >
                                    {isAnalyzing ? <LoaderCircle className="animate-spin" size={20} /> : <Sparkles size={18} />}
                                    <span>{isAnalyzing ? 'Analisando...' : 'Analisar com IA'}</span>
                                </button>
                             )}
                        </div>
                    )}
                    
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                </main>

                 <footer className="p-3 border-t border-brand-border bg-brand-surface/80 backdrop-blur-sm flex-shrink-0">
                    <button 
                        onClick={handleSubmit}
                        className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-base shadow-lg hover:bg-brand-dark disabled:opacity-50"
                        disabled={!image || !caption || (addRecipe && !analyzedRecipe)}
                    >
                        <PlusCircle className="mr-2" size={20} />
                        Publicar
                    </button>
                </footer>
            </div>
        </div>,
        modalRoot
    );
};

export default CreatePostModal;
