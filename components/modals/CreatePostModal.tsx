

import React, { useState, useContext, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Image as ImageIcon, PlusCircle, ChefHat, Sparkles, LoaderCircle, Ghost, Smile, Trophy, Box } from 'lucide-react';
import { AppContext } from '../../contexts/AppContext';
import { analyzeUserRecipe } from '../../services/geminiService';
import type { Recipe, SuccessTag } from '../../types';

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

const SUCCESS_TAGS: { id: SuccessTag, label: string, icon: React.ElementType, color: string }[] = [
    { id: 'hidden_veggies', label: 'Legumes Escondidos', icon: Ghost, color: 'bg-purple-100 text-purple-700' },
    { id: 'fun_story', label: 'História Lúdica', icon: Sparkles, color: 'bg-yellow-100 text-yellow-700' },
    { id: 'texture_win', label: 'Aceitou Textura', icon: Smile, color: 'bg-blue-100 text-blue-700' },
    { id: 'first_time', label: 'Provou 1ª Vez', icon: Trophy, color: 'bg-green-100 text-green-700' },
    { id: 'lunchbox', label: 'Lancheira Sucesso', icon: Box, color: 'bg-orange-100 text-orange-700' },
];

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose }) => {
    const context = useContext(AppContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [image, setImage] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [addRecipe, setAddRecipe] = useState(true); // Default to true to encourage sharing
    const [recipeTitle, setRecipeTitle] = useState('');
    const [recipeIngredients, setRecipeIngredients] = useState('');
    const [recipeSteps, setRecipeSteps] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedRecipe, setAnalyzedRecipe] = useState<Recipe | null>(null);
    const [selectedTag, setSelectedTag] = useState<SuccessTag | undefined>(undefined);
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
            successType: selectedTag,
        });
        onClose();
    };
    
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose}>
            <div 
                className="bg-brand-background rounded-t-3xl shadow-lg w-full max-h-[95vh] flex flex-col animate-slide-in-up"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-brand-border flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-brand-text">Registrar Vitória</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20}/></button>
                </header>

                <main className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Image Upload */}
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-video bg-brand-surface border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center text-brand-text-secondary cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden"
                    >
                        {image ? (
                            <img src={image} alt="Prévia da publicação" className="w-full h-full object-cover" />
                        ) : (
                            <>
                                <div className="bg-brand-primary/10 p-3 rounded-full mb-2">
                                    <ImageIcon size={28} className="text-brand-primary"/>
                                </div>
                                <p className="font-semibold text-sm">Adicionar Foto do Prato</p>
                            </>
                        )}
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    </div>

                    {/* Success Tag Selection */}
                    <div>
                        <h3 className="text-sm font-bold text-brand-text mb-3">Qual foi o segredo do sucesso?</h3>
                        <div className="flex flex-wrap gap-2">
                            {SUCCESS_TAGS.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => setSelectedTag(tag.id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                        selectedTag === tag.id 
                                            ? `${tag.color} border-transparent shadow-sm scale-105` 
                                            : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    <tag.icon size={14} />
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Caption */}
                    <div>
                        <h3 className="text-sm font-bold text-brand-text mb-2">Conte sua história</h3>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Ex: O João nem percebeu o espinafre porque chamei de 'massa do Hulk'..."
                            rows={3}
                            className="w-full bg-white border border-brand-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                        />
                    </div>
                    
                    {/* Recipe Section */}
                    <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
                         <div className="p-4 flex items-center justify-between border-b border-brand-border/50 bg-gray-50">
                            <span className="font-bold text-brand-text flex items-center gap-2 text-sm"><ChefHat size={18} className="text-brand-primary"/> Compartilhar Receita?</span>
                            <div className="relative">
                                <input type="checkbox" checked={addRecipe} onChange={() => setAddRecipe(!addRecipe)} className="sr-only peer" />
                                <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                            </div>
                        </div>

                        {addRecipe && (
                            <div className="p-4 space-y-3">
                                 <input type="text" value={recipeTitle} onChange={e => setRecipeTitle(e.target.value)} placeholder="Nome da Receita" className="w-full text-sm bg-brand-background border border-brand-border rounded-lg p-2.5"/>
                                 <textarea rows={3} value={recipeIngredients} onChange={e => setRecipeIngredients(e.target.value)} placeholder="Ingredientes (1 por linha)" className="w-full text-sm bg-brand-background border border-brand-border rounded-lg p-2.5"/>
                                 <textarea rows={3} value={recipeSteps} onChange={e => setRecipeSteps(e.target.value)} placeholder="Como fazer (passo a passo)" className="w-full text-sm bg-brand-background border border-brand-border rounded-lg p-2.5"/>
                                 
                                 {analyzedRecipe ? (
                                    <div className="flex items-center gap-3 p-3 bg-green-50 text-green-800 rounded-xl border border-green-100">
                                        <div className="bg-white p-1.5 rounded-full"><Sparkles size={16} className="text-green-500"/></div>
                                        <div>
                                            <p className="font-bold text-xs">IA Analisou com sucesso!</p>
                                            <p className="text-[10px] opacity-80">{analyzedRecipe.total_time_min}min • {analyzedRecipe.level}</p>
                                        </div>
                                    </div>
                                 ) : (
                                    <button
                                        onClick={handleAnalyzeRecipe}
                                        disabled={isAnalyzing}
                                        className="w-full flex items-center justify-center gap-2 bg-brand-text text-white font-bold py-3 px-4 rounded-xl disabled:bg-gray-400 transition-colors text-sm"
                                    >
                                        {isAnalyzing ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                        <span>{isAnalyzing ? 'Organizando...' : 'Organizar com IA'}</span>
                                    </button>
                                 )}
                            </div>
                        )}
                    </div>
                    
                    {error && <p className="text-red-500 text-xs text-center bg-red-50 p-2 rounded-lg">{error}</p>}

                </main>

                 <footer className="p-4 border-t border-brand-border bg-brand-surface/80 backdrop-blur-sm flex-shrink-0">
                    <button 
                        onClick={handleSubmit}
                        className="w-full bg-brand-primary text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center text-base shadow-lg hover:bg-brand-dark disabled:opacity-50 transition-transform active:scale-95"
                        disabled={!image || !caption || (addRecipe && !analyzedRecipe)}
                    >
                        <PlusCircle className="mr-2" size={20} />
                        Publicar Vitória
                    </button>
                </footer>
            </div>
        </div>,
        modalRoot
    );
};

export default CreatePostModal;