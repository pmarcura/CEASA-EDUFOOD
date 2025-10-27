
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import PantryItemCard from './PantryItemCard';
import PantryListItem from './PantryListItem';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';
import { Search, ChevronDown, X, LayoutGrid, List } from 'lucide-react';
import type { NovaClassificationKey } from '../../types';

const PantryDisplay: React.FC = () => {
    const context = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNova, setSelectedNova] = useState<NovaClassificationKey | 'all'>('all');
    const [selectedCodex, setSelectedCodex] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    
    if (!context || !context.pantry) {
        return <p>Carregando despensa...</p>;
    }

    const { pantry } = context;

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
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-brand-text">Despensa</h2>
                <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-full border border-brand-border shadow-sm">
                    <button 
                        onClick={() => setViewMode('grid')} 
                        className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-primary/10'}`}
                        aria-label="Visualização em Grade"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')} 
                        className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-primary/10'}`}
                        aria-label="Visualização em Lista"
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            <div className="bg-brand-surface p-3 rounded-xl shadow-edu mb-6 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-secondary" />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-brand-background border border-brand-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                </div>
                <div className="space-y-3">
                     <div className="relative">
                        <select
                            value={selectedNova}
                            onChange={(e) => setSelectedNova(e.target.value as NovaClassificationKey | 'all')}
                            className="w-full appearance-none bg-brand-background border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="all">Todas as Classificações NOVA</option>
                            {Object.entries(NOVA_CLASSIFICATION).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-secondary pointer-events-none" />
                    </div>
                     <div className="relative">
                        <select
                            value={selectedCodex}
                            onChange={(e) => setSelectedCodex(e.target.value)}
                            className="w-full appearance-none bg-brand-background border border-brand-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="all">Todas as Categorias Codex</option>
                            {availableCodexCategories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-secondary pointer-events-none" />
                    </div>
                </div>
                 {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-sm text-brand-primary font-semibold flex items-center gap-1 hover:underline">
                        <X size={14}/> Limpar filtros
                    </button>
                )}
            </div>
            
            {filteredPantry.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredPantry.map(item => (
                            <PantryItemCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredPantry.map(item => (
                            <PantryListItem key={item.id} item={item} />
                        ))}
                    </div>
                )
            ) : (
                <div className="text-center text-brand-text-secondary mt-10 p-6 bg-brand-surface rounded-xl">
                    <h3 className="text-lg font-bold text-brand-text mb-1">Nenhum item encontrado</h3>
                    <p className="text-sm">Tente ajustar seus filtros ou adicione mais itens à sua despensa.</p>
                </div>
            )}
        </div>
    );
};

export default PantryDisplay;
