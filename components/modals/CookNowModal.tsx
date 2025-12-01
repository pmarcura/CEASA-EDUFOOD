
import React, { useState, useContext, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { X, ChefHat, Camera, LoaderCircle, Sparkles, Plus } from 'lucide-react';
import { AppContext } from '../../contexts/AppContext';
import { generateInstantRecipe, ImagePayload } from '../../services/geminiService';
import FoodIcon from '../FoodIcon';

interface CookNowModalProps {
    onClose: () => void;
}

const fileToDataURL = (file: File): Promise<ImagePayload> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64Data = reader.result.split(',')[1];
                resolve({ data: base64Data, mimeType: file.type });
            } else {
                reject(new Error("Failed to read file"));
            }
        };
        reader.onerror = error => reject(error);
    });
};

const CookNowModal: React.FC<CookNowModalProps> = ({ onClose }) => {
    const context = useContext(AppContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedPantryItems, setSelectedPantryItems] = useState<Set<string>>(new Set());
    const [extraText, setExtraText] = useState('');
    const [uploadedImages, setUploadedImages] = useState<ImagePayload[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot || !context) return null;

    const { pantry, userProfile, mealLog, setViewingRecipe } = context;

    // Sort pantry items by quantity > 0 and then name
    const sortedPantry = useMemo(() => {
        return [...pantry].sort((a, b) => {
            if (a.quantity > 0 && b.quantity <= 0) return -1;
            if (a.quantity <= 0 && b.quantity > 0) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [pantry]);

    const togglePantryItem = (itemName: string) => {
        setSelectedPantryItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemName)) newSet.delete(itemName);
            else newSet.add(itemName);
            return newSet;
        });
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        try {
            const newImages: ImagePayload[] = [];
            for (let i = 0; i < files.length; i++) {
                const payload = await fileToDataURL(files[i]);
                newImages.push(payload);
            }
            setUploadedImages(prev => [...prev, ...newImages]);
        } catch (e) {
            console.error("Error uploading images", e);
        }
    };

    const handleGenerate = async () => {
        if (selectedPantryItems.size === 0 && uploadedImages.length === 0 && !extraText.trim()) {
            setError("Selecione pelo menos um ingrediente ou envie uma foto.");
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            const recipe = await generateInstantRecipe(
                Array.from(selectedPantryItems),
                uploadedImages,
                extraText,
                userProfile,
                mealLog
            );
            setViewingRecipe(recipe);
            onClose();
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Erro ao gerar receita.");
        } finally {
            setIsGenerating(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose}>
            <div 
                className="bg-brand-background rounded-t-3xl shadow-2xl w-full max-h-[95vh] flex flex-col animate-slide-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="p-5 border-b border-brand-border bg-brand-surface rounded-t-3xl flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-display font-bold text-brand-text flex items-center gap-2">
                            <Sparkles className="text-brand-primary fill-brand-primary" size={20} />
                            Cozinhar Agora
                        </h2>
                        <p className="text-xs text-brand-text-secondary">Receita mágica com o que você tem</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><X size={24}/></button>
                </header>

                <main className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Section 1: Pantry Selection */}
                    <div>
                        <h3 className="font-bold text-sm text-brand-text mb-3 uppercase tracking-wide text-brand-text-secondary">1. O que tem na despensa?</h3>
                        {pantry.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Sua despensa está vazia.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {sortedPantry.map(item => {
                                    const isSelected = selectedPantryItems.has(item.name);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => togglePantryItem(item.name)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
                                                isSelected 
                                                ? 'bg-brand-primary text-white border-brand-primary shadow-md ring-2 ring-brand-primary/20' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary/50'
                                            }`}
                                        >
                                            <FoodIcon name={item.name} icon={item.icon} size="sm" className={`w-5 h-5 text-xs ${isSelected ? 'bg-white/20' : ''}`} />
                                            {item.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Section 2: New Ingredients (Photo/Text) */}
                    <div>
                        <h3 className="font-bold text-sm text-brand-text mb-3 uppercase tracking-wide text-brand-text-secondary">2. Algo mais? (Sobras, mercado...)</h3>
                        
                        <div className="flex gap-3 mb-3">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                                <Camera size={24} />
                                <span className="text-xs font-bold">Foto Ingredientes</span>
                            </button>
                            <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                            
                            {/* Image Previews */}
                            {uploadedImages.length > 0 && (
                                <div className="flex items-center gap-2 overflow-x-auto max-w-[50%] p-1">
                                    {uploadedImages.map((img, idx) => (
                                        <img key={idx} src={`data:${img.mimeType};base64,${img.data}`} className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-sm" />
                                    ))}
                                    <span className="text-xs font-bold text-green-600">+{uploadedImages.length}</span>
                                </div>
                            )}
                        </div>

                        <textarea 
                            value={extraText}
                            onChange={(e) => setExtraText(e.target.value)}
                            placeholder="Ex: Tenho meio repolho sobrando e quero usar frango descongelado..."
                            className="w-full bg-white border border-brand-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                            rows={3}
                        />
                    </div>
                    
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold text-center">{error}</div>}
                </main>

                {/* Footer Action */}
                <footer className="p-5 border-t border-brand-border bg-brand-surface flex-shrink-0 pb-8">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-gradient-to-r from-brand-primary to-teal-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-3 text-lg transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <LoaderCircle className="animate-spin" size={24}/> : <ChefHat size={24} />}
                        {isGenerating ? 'Criando Mágica...' : 'Criar Receita Instantânea'}
                    </button>
                </footer>
            </div>
        </div>,
        modalRoot
    );
};

export default CookNowModal;
