
import React, { useState, useContext, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { AppContext } from '../../contexts/AppContext';
import { X, ArrowRight, Check, Award, LoaderCircle, Baby, Star } from 'lucide-react';
import type { PantryItem, PantryReviewChange, PantryReviewAction } from '../../types';
import PantryReviewItem from '../PantryReviewItem';
import { ACTION_XP_VALUES } from '../../services/gamificationService';

const PantryReviewModal: React.FC = () => {
    const context = useContext(AppContext);
    
    const [step, setStep] = useState<'reviewing' | 'summary'>('reviewing');
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [changes, setChanges] = useState<Map<string, PantryReviewChange>>(new Map());
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot || !context) return null;

    const { pantry, setIsPantryReviewOpen, completePantryReview } = context;

    const groupedPantry = useMemo(() => {
        const groups: { [key: string]: PantryItem[] } = {};
        pantry.forEach(item => {
            const category = item.codexCategory || 'Outros';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        });
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [pantry]);

    const categories = useMemo(() => groupedPantry.map(([category]) => category), [groupedPantry]);
    const currentCategory = categories[currentCategoryIndex];
    const itemsForCurrentCategory = groupedPantry[currentCategoryIndex]?.[1] || [];

    const handleAction = useCallback((itemId: string, action: PantryReviewAction, details?: { newQuantity?: number; newUnit?: string, newChildPreferences?: Record<string, number> }) => {
        setChanges(prev => {
            const newChanges = new Map(prev);
            const originalItem = pantry.find(p => p.id === itemId);
            if(originalItem) {
                newChanges.set(itemId, { 
                    itemId, 
                    action, 
                    newQuantity: details?.newQuantity, 
                    newUnit: details?.newUnit,
                    newChildPreferences: details?.newChildPreferences,
                    originalItem 
                });
            }
            return newChanges;
        });
    }, [pantry]);
    
    const handleNext = () => {
        if (currentCategoryIndex < categories.length - 1) {
            setCurrentCategoryIndex(prev => prev + 1);
        } else {
            setStep('summary');
        }
    };
    
    const handleSubmit = async () => {
        setIsSubmitting(true);
        await completePantryReview(Array.from(changes.values()));
        setIsPantryReviewOpen(false);
    };

    const summaryData = useMemo(() => {
        const summary = { kept: 0, updated: 0, removed: 0, xp: 0 };
        changes.forEach(change => {
            if (change.action === 'keep') {
                summary.kept++;
                summary.xp += ACTION_XP_VALUES.PANTRY_REVIEW_KEEP;
            } else if (change.action === 'update') {
                summary.updated++;
                summary.xp += ACTION_XP_VALUES.PANTRY_REVIEW_UPDATE;
            } else if (change.action === 'remove') {
                summary.removed++;
                summary.xp += ACTION_XP_VALUES.PANTRY_REVIEW_REMOVE;
            }
        });
        if (changes.size > 0) {
            summary.xp += ACTION_XP_VALUES.PANTRY_REVIEW_BONUS;
        }
        return summary;
    }, [changes]);

    const renderReviewStep = () => (
        <>
            {/* Banner de Engajamento Infantil */}
            <div className="mx-4 mt-2 bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm text-blue-500">
                    <Baby size={20} />
                </div>
                <div>
                    <p className="text-xs font-bold text-blue-800">Dica: Chame as crianças!</p>
                    <p className="text-xs text-blue-600 leading-tight">Peça para elas darem estrelinhas para cada alimento.</p>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-4 space-y-3">
                <h3 className="font-bold text-lg text-brand-text">{currentCategory}</h3>
                {itemsForCurrentCategory.map(item => (
                    <PantryReviewItem 
                        key={item.id} 
                        item={item} 
                        change={changes.get(item.id)}
                        onAction={handleAction} 
                    />
                ))}
            </main>
            <footer className="p-3 border-t border-brand-border bg-brand-surface/80 backdrop-blur-sm flex-shrink-0">
                <button 
                    onClick={handleNext}
                    className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-base shadow-lg hover:bg-brand-dark"
                >
                    {currentCategoryIndex < categories.length - 1 ? 'Próxima Categoria' : 'Finalizar Revisão'}
                    <ArrowRight className="ml-2" size={20} />
                </button>
            </footer>
        </>
    );

    const renderSummaryStep = () => (
        <>
            <main className="flex-1 overflow-y-auto p-4 text-center">
                <Award size={48} className="text-yellow-500 mx-auto mb-4" />
                <h3 className="font-bold text-xl text-brand-text">Revisão Concluída!</h3>
                <p className="text-sm text-brand-text-secondary mt-1">Ótimo trabalho mantendo a despensa organizada.</p>
                <div className="bg-brand-background border border-brand-border rounded-xl p-4 my-6 space-y-3">
                    <div className="flex justify-between"><span className="font-semibold">Itens mantidos:</span><span>{summaryData.kept}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Itens atualizados:</span><span>{summaryData.updated}</span></div>
                    <div className="flex justify-between"><span className="font-semibold">Itens removidos:</span><span>{summaryData.removed}</span></div>
                    <div className="flex justify-between pt-3 border-t border-brand-border mt-3 text-brand-primary font-bold"><span >XP Total:</span><span>+{summaryData.xp} XP</span></div>
                </div>
            </main>
            <footer className="p-3 border-t border-brand-border bg-brand-surface/80 backdrop-blur-sm flex-shrink-0">
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-base shadow-lg hover:bg-brand-dark disabled:bg-gray-400"
                >
                    {isSubmitting ? <LoaderCircle className="animate-spin" size={20}/> : <Check className="mr-2" size={20} />}
                    {isSubmitting ? 'Salvando...' : 'Confirmar e Coletar'}
                </button>
            </footer>
        </>
    );
    
    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={() => setIsPantryReviewOpen(false)}>
            <div 
                className="bg-brand-background rounded-t-2xl shadow-lg w-full max-h-[95vh] flex flex-col animate-slide-in-up"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-brand-border flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-brand-text">Revisão da Despensa ({currentCategoryIndex + 1}/{categories.length})</h2>
                    <button onClick={() => setIsPantryReviewOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20}/></button>
                </header>

                {step === 'reviewing' ? renderReviewStep() : renderSummaryStep()}
            </div>
        </div>,
        modalRoot
    );
};

export default PantryReviewModal;
