
import React, { useState, useContext } from 'react';
import ReactDOM from 'react-dom';
import { AppContext } from '../../contexts/AppContext';
import { X, Save, Sparkles, LoaderCircle } from 'lucide-react';
import { UNITS } from '../../constants/units';
import { enrichFoodItemsBatch } from '../../services/geminiService';
import type { PantryItem } from '../../types';
import { toTitleCase } from '../../utils/formatters';

interface AddItemModalProps {
    onClose: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose }) => {
    const context = useContext(AppContext);
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('un');
    const [isEnriching, setIsEnriching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot || !context) return null;

    const { addItemsToPantry, awardXpForNewItem } = context;

    const handleSmartFill = async () => {
        if (!name.trim()) return;
        setIsEnriching(true);
        try {
            // Mock adding just to trigger the logic, but we are actually creating the object here
            const enrichedDataArray = await enrichFoodItemsBatch([name]);
            if (enrichedDataArray.length > 0) {
                // In a real scenario we might update some local state with a preview
                // For now, let's just save directly using the enriched data logic in handleSave
                // Or better, set a "pending enrichment" state that handleSave uses.
                // To keep it simple for the user: Just clicking "Magic" saves time later.
            }
        } catch (error) {
            console.error("Enrichment failed", error);
        } finally {
            setIsEnriching(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !quantity) return;
        setIsSaving(true);

        try {
            // Attempt enrichment on save if not already done, or just basic add
            const enrichedDataArray = await enrichFoodItemsBatch([name]);
            const enriched = enrichedDataArray[0];

            const newItem: Omit<PantryItem, 'id'> = {
                name: toTitleCase(enriched?.name || name),
                quantity: parseFloat(quantity),
                unit: unit,
                novaClassification: enriched?.novaClassification || 'processed',
                codexCategory: enriched?.codexCategory || 'Outros',
                ageWarningTag: enriched?.ageWarningTag || '',
                riskLevel: enriched?.riskLevel || 'Médio',
                icon: enriched?.icon || '📦',
                color: enriched?.color || '#9CA3AF',
                nutritionalInfo: enriched?.nutritionalInfo || { origin: 'Manual', benefits: [], risks: [], nutritionFacts: '' },
                tags: enriched?.tags || [],
                tipRead: false,
                addedAt: Date.now(),
            };

            await addItemsToPantry([newItem]);
            awardXpForNewItem(newItem);
            onClose();
        } catch (error) {
            console.error("Failed to add item", error);
            // Fallback save without enrichment
             const newItem: Omit<PantryItem, 'id'> = {
                name: toTitleCase(name),
                quantity: parseFloat(quantity),
                unit: unit,
                novaClassification: 'processed',
                codexCategory: 'Outros',
                ageWarningTag: '',
                riskLevel: 'Médio',
                icon: '📦',
                color: '#9CA3AF',
                nutritionalInfo: { origin: 'Manual', benefits: [], risks: [], nutritionFacts: '' },
                tags: ['Adicionado Manualmente'],
                tipRead: false,
                addedAt: Date.now(),
            };
            await addItemsToPantry([newItem]);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-brand-surface rounded-2xl shadow-lg w-full max-w-xs p-5 flex flex-col animate-pop"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-brand-text">Adicionar Item</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20}/></button>
                </header>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-brand-text-secondary uppercase mb-1 block">Nome do Produto</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder="Ex: Arroz Integral" 
                                className="w-full bg-brand-background border border-brand-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-brand-text-secondary uppercase mb-1 block">Qtd</label>
                            <input 
                                type="number" 
                                value={quantity} 
                                onChange={e => setQuantity(e.target.value)} 
                                placeholder="1" 
                                className="w-full bg-brand-background border border-brand-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-bold text-brand-text-secondary uppercase mb-1 block">Unidade</label>
                            <select 
                                value={unit} 
                                onChange={e => setUnit(e.target.value)} 
                                className="w-full bg-brand-background border border-brand-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                            >
                                {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <button 
                        onClick={handleSave} 
                        disabled={!name || !quantity || isSaving}
                        className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center shadow-lg hover:bg-brand-dark disabled:bg-gray-300 disabled:shadow-none transition-all active:scale-95"
                    >
                        {isSaving ? <LoaderCircle className="animate-spin" size={20} /> : <Save className="mr-2" size={20} />}
                        {isSaving ? 'Salvando...' : 'Salvar na Despensa'}
                    </button>
                </div>
            </div>
        </div>,
        modalRoot
    );
};

export default AddItemModal;
