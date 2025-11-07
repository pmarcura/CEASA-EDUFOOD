
import React, { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../../contexts/AppContext';
import PantryItemCard from './PantryItemCard';
import PantryListItem from './PantryListItem';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';
import { UNITS } from '../../constants/units';
import { Search, ChevronDown, X, LayoutGrid, List, Trash2, Edit } from 'lucide-react';
import type { NovaClassificationKey, PantryItem } from '../../types';

const PantryDisplay: React.FC = () => {
    const context = useContext(AppContext);
    
    // Filter and View States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNova, setSelectedNova] = useState<NovaClassificationKey | 'all'>('all');
    const [selectedCodex, setSelectedCodex] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    // Interaction States
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

    if (!context) return <div>Carregando contexto...</div>;
    const { pantry, removeItemsFromPantry, updatePantryItemDetails } = context;

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
    };
    
    const handleDeleteSelected = async () => {
        await removeItemsFromPantry(Array.from(selectedItems));
        setIsSelectionMode(false);
        setSelectedItems(new Set());
    };
    
    const handleSaveEdit = async (id: string, quantity: number, unit: string) => {
        await updatePantryItemDetails(id, { quantity, unit });
        setEditingItem(null);
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
    
    const hasActiveFilters = searchTerm || selectedNova !== 'all' || selectedCodex !== 'all';
    
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

             <div className="bg-brand-surface p-3 rounded-xl shadow-edu mb-6 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-secondary" />
                    <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-brand-background border border-brand-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                </div>
                <div className="space-y-3">
                     <div className="relative">
                        <select value={selectedNova} onChange={(e) => setSelectedNova(e.target.value as NovaClassificationKey | 'all')} className="w-full appearance-none bg-brand-background border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                            <option value="all">Todas as Classificações NOVA</option>
                            {Object.entries(NOVA_CLASSIFICATION).map(([key, value]) => (<option key={key} value={key}>{value.label}</option>))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-secondary pointer-events-none" />
                    </div>
                     <div className="relative">
                        <select value={selectedCodex} onChange={(e) => setSelectedCodex(e.target.value)} className="w-full appearance-none bg-brand-background border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                            <option value="all">Todas as Categorias Codex</option>
                            {availableCodexCategories.map(category => (<option key={category} value={category}>{category}</option>))}
                        </select>
                         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-secondary pointer-events-none" />
                    </div>
                </div>
                 {hasActiveFilters && (<button onClick={clearFilters} className="text-sm text-brand-primary font-semibold flex items-center gap-1 hover:underline"><X size={14}/> Limpar filtros</button>)}
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
                           <PantryListItem key={item.id} item={item} isSelected={selectedItems.has(item.id)} isSelectionMode={isSelectionMode} onToggleSelection={handleToggleSelection} onEditRequest={() => setEditingItem(item)}/>
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
            
            {editingItem && <EditItemModal item={editingItem} onSave={handleSaveEdit} onClose={() => setEditingItem(null)} />}
        </div>
    );
};

// Edit Modal Component
const EditItemModal: React.FC<{ item: PantryItem, onSave: (id: string, quantity: number, unit: string) => void, onClose: () => void }> = ({ item, onSave, onClose }) => {
    const [quantity, setQuantity] = useState(item.quantity);
    const [unit, setUnit] = useState(item.unit);

    const handleSaveClick = () => {
        onSave(item.id, Number(quantity), unit);
    };
    
    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-brand-surface rounded-2xl shadow-lg w-full max-w-sm p-5">
                <h3 className="text-lg font-bold text-brand-text mb-1">Editar Item</h3>
                <p className="text-brand-text-secondary mb-4 capitalize">{item.name}</p>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-semibold text-brand-text-secondary block mb-1">Quantidade</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-brand-background border border-brand-border rounded-lg p-2.5 text-sm" min="0"/>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-brand-text-secondary block mb-1">Unidade</label>
                         <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-brand-background border border-brand-border rounded-lg p-2.5 text-sm">
                            {UNITS.map(u => <option key={u.value} value={u.value}>{u.description} ({u.value})</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-brand-text-secondary font-semibold hover:bg-gray-100">Cancelar</button>
                    <button onClick={handleSaveClick} className="px-5 py-2 rounded-lg bg-brand-primary text-white font-bold hover:bg-brand-dark">Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default PantryDisplay;