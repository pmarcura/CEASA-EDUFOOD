
import React, { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../../contexts/AppContext';
import PantryItemCard from './PantryItemCard';
import PantryListItem from './PantryListItem';
import { Search, LayoutGrid, List, Trash2, Filter } from 'lucide-react';
import type { NovaClassificationKey, PantryItem } from '../../types';
import { enrichFoodItemsBatch } from '../../services/geminiService';
import { ACTION_XP_VALUES } from '../../services/gamificationService';
import PantryFilterModal from './modals/PantryFilterModal';

const PantryDisplay: React.FC = () => {
    const context = useContext(AppContext);
    
    // Filter and View States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNova, setSelectedNova] = useState<NovaClassificationKey | 'all'>('all');
    const [selectedCodex, setSelectedCodex] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    
    // Interaction States
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!context) return <div>Carregando contexto...</div>;
    const { pantry, removeItemsFromPantry, updatePantryItemDetails, removeItemFromPantry, awardXp } = context;

    const availableCodexCategories = useMemo(() => {
        const categories = new Set(pantry.map(item => item.codexCategory));
        return Array.from(categories).sort();
    }, [pantry]);
    
    const filteredPantry = useMemo(() => {
        return pantry.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const novaMatch = selectedNova === 'all' || item.novaClassification === selectedNova;
            const codexMatch = selectedCodex === 'all' || item.codexCategory === selectedCodex;
            return nameMatch && novaMatch && codexMatch;
        });
    }, [pantry, searchTerm, selectedNova, selectedCodex]);

    const handleToggleSelection = useCallback((itemId: string) => {
        setSelectedItems(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(itemId)) {
                newSelection.delete(itemId);
            } else {
                newSelection.add(itemId);
            }
            return newSelection;
        });
    }, []);

    const handleToggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedItems(new Set());
        setEditingItemId(null); // Exit edit mode when toggling selection
    };
    
    const handleDeleteSelected = async () => {
        await removeItemsFromPantry(Array.from(selectedItems));
        setIsSelectionMode(false);
        setSelectedItems(new Set());
    };
    
    const handleEditRequest = (itemId: string) => {
        setIsSelectionMode(false); // Ensure we're not in selection mode
        setEditingItemId(itemId);
    };

    const handleSaveEdit = async (id: string, updates: Partial<Omit<PantryItem, 'id'>>) => {
        if (Object.keys(updates).length === 0) {
            setEditingItemId(null);
            return;
        }
        setIsSaving(true);
        const originalItem = pantry.find(item => item.id === id);
        if (!originalItem) {
            console.error("Item não encontrado para edição");
            setIsSaving(false);
            return;
        }
    
        if (updates.name && updates.name.trim() && updates.name.toLowerCase() !== originalItem.name.toLowerCase()) {
            try {
                const enrichedDataArray = await enrichFoodItemsBatch([updates.name]);
                if (enrichedDataArray.length > 0) {
                    const enrichedData = enrichedDataArray[0];
                    const finalUpdates: Partial<PantryItem> = {
                        ...updates,
                        novaClassification: enrichedData.novaClassification,
                        codexCategory: enrichedData.codexCategory,
                        ageWarningTag: enrichedData.ageWarningTag,
                        riskLevel: enrichedData.riskLevel,
                        icon: enrichedData.icon,
                        color: enrichedData.color,
                        nutritionalInfo: enrichedData.nutritionalInfo,
                        tags: enrichedData.tags,
                        tipRead: false,
                    };
                    await updatePantryItemDetails(id, finalUpdates);

                    // Gamification: Award XP if the item became healthier
                    const novaOrder = { 'in_natura': 4, 'culinary_ingredients': 3, 'processed': 2, 'ultra_processed': 1 };
                    const oldNovaValue = novaOrder[originalItem.novaClassification] || 0;
                    const newNovaValue = novaOrder[finalUpdates.novaClassification!] || 0;
                    if (newNovaValue > oldNovaValue) {
                        awardXp(ACTION_XP_VALUES.HEALTHY_EDIT, "Fez uma troca saudável!");
                    }

                } else {
                    await updatePantryItemDetails(id, updates);
                }
            } catch (error) {
                console.error("Erro ao enriquecer o item:", error);
                await updatePantryItemDetails(id, updates);
            }
        } else {
            await updatePantryItemDetails(id, updates);
        }
        
        setIsSaving(false);
        setEditingItemId(null);
    };

    const handleCancelEdit = () => {
        setEditingItemId(null);
    };

    if (pantry.length === 0 && !context) {
        return <p>Carregando despensa...</p>;
    }

    if (pantry.length === 0) {
        return (
            <div className="text-center text-brand-text-secondary mt-10">
                <h2 className="text-xl font-bold text-brand-text mb-2">Sua despensa está vazia!</h2>
                <p>Use a aba 'Chat' para adicionar sua primeira lista de compras.</p>
            </div>
        );
    }
    
    const activeFilterCount = (selectedNova !== 'all' ? 1 : 0) + (selectedCodex !== 'all' ? 1 : 0);
    
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedNova('all');
        setSelectedCodex('all');
    };

    return (
        <div className="pb-24">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-brand-text">Despensa</h2>
                <div className="flex items-center gap-2">
                    <button onClick={handleToggleSelectionMode} className="text-sm font-semibold text-brand-primary">
                        {isSelectionMode ? 'Cancelar' : 'Selecionar'}
                    </button>
                    <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-full border border-brand-border shadow-sm">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-primary/10'}`} aria-label="Visualização em Grade"><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-primary/10'}`} aria-label="Visualização em Lista"><List size={18} /></button>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-2 mb-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-secondary" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full bg-brand-surface border border-brand-border rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                </div>
                <button 
                    onClick={() => setIsFilterModalOpen(true)} 
                    className="relative flex-shrink-0 px-3 bg-brand-surface border border-brand-border rounded-lg font-semibold text-sm text-brand-text hover:bg-gray-50"
                    aria-label="Abrir filtros"
                >
                    <Filter size={18} />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-white text-[10px] font-bold ring-2 ring-brand-background">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>
            
            {filteredPantry.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredPantry.map(item => (
                            <PantryItemCard key={item.id} item={item} isSelected={selectedItems.has(item.id)} isSelectionMode={isSelectionMode} onToggleSelection={handleToggleSelection}/>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredPantry.map(item => (
                           <PantryListItem 
                                key={item.id} 
                                item={item} 
                                isSelected={selectedItems.has(item.id)} 
                                isSelectionMode={isSelectionMode} 
                                onToggleSelection={handleToggleSelection} 
                                isEditing={editingItemId === item.id}
                                isSaving={isSaving && editingItemId === item.id}
                                onEditRequest={() => handleEditRequest(item.id)}
                                onCancelEdit={handleCancelEdit}
                                onSaveEdit={handleSaveEdit}
                                onDeleteItem={removeItemFromPantry}
                            />
                        ))}
                    </div>
                )
            ) : (
                <div className="text-center text-brand-text-secondary mt-10 p-6 bg-brand-surface rounded-xl">
                    <h3 className="text-lg font-bold text-brand-text mb-1">Nenhum item encontrado</h3>
                    <p className="text-sm">Tente ajustar seus filtros ou adicione mais itens à sua despensa.</p>

                </div>
            )}

            {isSelectionMode && selectedItems.size > 0 && (
                 <div className="fixed bottom-20 left-4 right-4 z-10 transition-transform animate-fade-in">
                    <div className="bg-brand-text text-white rounded-xl shadow-lg p-2.5 flex items-center justify-between max-w-md mx-auto">
                        <span className="font-bold text-sm ml-2">{selectedItems.size} {selectedItems.size > 1 ? 'itens selecionados' : 'item selecionado'}</span>
                        <button onClick={handleDeleteSelected} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Trash2 size={16}/> Excluir</button>
                    </div>
                </div>
            )}
            
             <PantryFilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                selectedNova={selectedNova}
                setSelectedNova={setSelectedNova}
                selectedCodex={selectedCodex}
                setSelectedCodex={setSelectedCodex}
                availableCodexCategories={availableCodexCategories}
                onClearFilters={clearFilters}
            />
        </div>
    );
};

export default PantryDisplay;
