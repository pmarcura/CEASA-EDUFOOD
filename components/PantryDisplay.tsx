
import React, { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../../contexts/AppContext';
import PantryItemCard from './PantryItemCard';
import PantryListItem from './PantryListItem';
import { Search, LayoutGrid, List, Trash2, Filter, PlusCircle, MinusCircle, Carrot, Sandwich, Cookie, Sparkles, Plus, ScanLine, ShoppingBag } from 'lucide-react';
import type { NovaClassificationKey, PantryItem } from '../../types';
import { enrichFoodItemsBatch } from '../../services/geminiService';
import { ACTION_XP_VALUES } from '../../services/gamificationService';
import PantryFilterModal from './modals/PantryFilterModal';
import AddItemModal from './modals/AddItemModal';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';

const novaFilters: {
    key: NovaClassificationKey | 'all';
    label: string;
    icon: React.ElementType;
    description?: string;
    colorClass: string;
}[] = [
    { key: 'all', label: 'Todos', icon: Sparkles, colorClass: 'text-brand-text-secondary' },
    { key: 'in_natura', label: 'In Natura', icon: Carrot, description: NOVA_CLASSIFICATION.in_natura.description, colorClass: 'text-green-600' },
    { key: 'processed', label: 'Processado', icon: Sandwich, description: NOVA_CLASSIFICATION.processed.description, colorClass: 'text-yellow-600' },
    { key: 'ultra_processed', label: 'Ultraproc.', icon: Cookie, description: NOVA_CLASSIFICATION.ultra_processed.description, colorClass: 'text-red-600' },
];


const PantryDisplay: React.FC = () => {
    const context = useContext(AppContext);
    
    // Filter and View States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNova, setSelectedNova] = useState<NovaClassificationKey | 'all'>('all');
    const [selectedCodex, setSelectedCodex] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isNovaInfoExpanded, setIsNovaInfoExpanded] = useState(false);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    
    // Interaction States
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set<string>());
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!context) return <div>Carregando contexto...</div>;
    const { pantry, removeItemsFromPantry, updatePantryItemDetails, removeItemFromPantry, awardXp, setActiveTab } = context; 

    const availableCodexCategories = useMemo(() => {
        const categories = new Set(pantry.map(item => item.codexCategory));
        return Array.from(categories).sort();
    }, [pantry]);
    
    const filteredPantry = useMemo(() => {
        return pantry.filter(item => {
            const nameMatch = item.name ? String(item.name).toLowerCase().includes(searchTerm.toLowerCase()) : false;
            const novaMatch = selectedNova === 'all' || item.novaClassification === selectedNova || (selectedNova === 'in_natura' && item.novaClassification === 'culinary_ingredients');
            const codexMatch = selectedCodex === 'all' || item.codexCategory === selectedCodex;
            return nameMatch && novaMatch && codexMatch;
        });
    }, [pantry, searchTerm, selectedNova, selectedCodex]);

    const handleNovaFilterClick = (key: NovaClassificationKey | 'all') => {
        setSelectedNova(prev => (prev === key ? 'all' : key));
    };

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

    const activeFilterCount = (selectedNova !== 'all' ? 1 : 0) + (selectedCodex !== 'all' ? 1 : 0);
    
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedNova('all');
        setSelectedCodex('all');
    };

    const handleScanRedirect = () => {
        if (setActiveTab) {
            setActiveTab('chat');
        }
    };

    return (
        <div className="pb-24 relative min-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-brand-text">Despensa</h2>
                 <button onClick={handleToggleSelectionMode} className="text-sm font-semibold text-brand-primary" disabled={pantry.length === 0}>
                    {pantry.length > 0 && (isSelectionMode ? 'Cancelar' : 'Selecionar')}
                </button>
            </div>
            
            {pantry.length > 0 && (
                <div className="bg-brand-surface rounded-xl shadow-edu p-3 mb-4">
                    <button 
                        onClick={() => setIsNovaInfoExpanded(!isNovaInfoExpanded)}
                        className="w-full flex justify-between items-center"
                        aria-expanded={isNovaInfoExpanded}
                    >
                        <h3 className="text-base font-bold text-brand-text">Classificação NOVA</h3>
                        {isNovaInfoExpanded ? <MinusCircle size={20} className="text-brand-text-secondary"/> : <PlusCircle size={20} className="text-brand-primary"/>}
                    </button>
                    
                     {isNovaInfoExpanded && (
                        <div className="mt-3 pt-3 border-t border-brand-border space-y-3 animate-fade-in">
                            {novaFilters.filter(f => f.key !== 'all').map(filter => (
                                <div key={filter.key} className="flex items-start gap-3">
                                    <filter.icon size={24} className={`flex-shrink-0 mt-1 ${filter.colorClass}`} />
                                    <div>
                                        <p className={`font-bold text-sm ${filter.colorClass}`}>{NOVA_CLASSIFICATION[filter.key as NovaClassificationKey].label}</p>
                                        <p className="text-xs text-brand-text-secondary">{filter.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={`grid grid-cols-4 gap-2 ${isNovaInfoExpanded ? 'mt-3 pt-3 border-t border-brand-border' : 'mt-2'}`}>
                        {novaFilters.map(filter => (
                            <button key={filter.key} onClick={() => handleNovaFilterClick(filter.key)}
                             className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${selectedNova === filter.key ? 'bg-brand-primary/10 shadow-inner' : 'hover:bg-gray-100'}`}
                             aria-pressed={selectedNova === filter.key}
                            >
                                <filter.icon size={22} className={selectedNova === filter.key ? 'text-brand-primary' : filter.colorClass} />
                                <span className={`text-xs font-semibold mt-1 ${selectedNova === filter.key ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>{filter.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {pantry.length > 0 && (
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
                     <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-full border border-brand-border shadow-sm">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-primary/10'}`} aria-label="Visualização em Grade"><LayoutGrid size={18} /></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-primary/10'}`} aria-label="Visualização em Lista"><List size={18} /></button>
                    </div>
                </div>
            )}
            
            {pantry.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200 text-center mt-4">
                    <div className="bg-orange-100 p-4 rounded-full mb-4">
                        <ShoppingBag size={40} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-text mb-2">Comece por aqui!</h3>
                    <p className="text-brand-text-secondary mb-8 text-sm max-w-xs mx-auto">
                        Sua despensa está vazia. Adicione o que você tem em casa para ganhar receitas e dicas.
                    </p>
                    
                    <div className="w-full space-y-3">
                        <button 
                            onClick={handleScanRedirect}
                            className="w-full bg-brand-surface border-2 border-brand-primary/20 hover:border-brand-primary text-brand-primary font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all"
                        >
                            <ScanLine size={22} />
                            Escanear Nota Fiscal
                        </button>
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                            <div className="relative flex justify-center text-xs text-gray-400"><span className="bg-white px-2">OU</span></div>
                        </div>
                        <button 
                            onClick={() => setIsAddItemModalOpen(true)}
                            className="w-full bg-brand-primary text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:bg-brand-dark transition-all transform active:scale-95"
                        >
                            <PlusCircle size={22} />
                            Adicionar Manualmente
                        </button>
                    </div>
                </div>
            ) : (
                filteredPantry.length > 0 ? (
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
                        <h3 className="text-lg font-bold text-brand-text mb-1">
                            Nenhum item encontrado
                        </h3>
                        <p className="text-sm">Tente ajustar seus filtros de busca.</p>
                        <button onClick={clearFilters} className="mt-4 text-brand-primary font-bold text-sm hover:underline">Limpar filtros</button>
                    </div>
                )
            )}

            {isSelectionMode && selectedItems.size > 0 && (
                 <div className="fixed bottom-20 left-4 right-4 z-10 transition-transform animate-fade-in">
                    <div className="bg-brand-text text-white rounded-xl shadow-lg p-2.5 flex items-center justify-between max-w-md mx-auto">
                        <span className="font-bold text-sm ml-2">{selectedItems.size} {selectedItems.size > 1 ? 'itens selecionados' : 'item selecionado'}</span>
                        <button onClick={handleDeleteSelected} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><Trash2 size={16}/> Excluir</button>
                    </div>
                </div>
            )}
            
            {/* FAB for Manual Add - Visible if pantry has items and not selecting */}
            {pantry.length > 0 && !isSelectionMode && (
                <button
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="fixed bottom-24 right-4 w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-primary/30 transform hover:scale-110 transition-all hover:bg-brand-dark z-30"
                    aria-label="Adicionar item manualmente"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
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
            
            {isAddItemModalOpen && <AddItemModal onClose={() => setIsAddItemModalOpen(false)} />}
        </div>
    );
};

export default PantryDisplay;
