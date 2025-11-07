
import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import type { NovaClassificationKey } from '../../types';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';

interface PantryFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedNova: NovaClassificationKey | 'all';
    setSelectedNova: (value: NovaClassificationKey | 'all') => void;
    selectedCodex: string;
    setSelectedCodex: (value: string) => void;
    availableCodexCategories: string[];
    onClearFilters: () => void;
}

const FilterButton: React.FC<{ label: string; isSelected: boolean; onClick: () => void }> = ({ label, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-semibold rounded-full border transition-colors ${
            isSelected
                ? 'bg-brand-primary border-brand-primary text-white'
                : 'bg-brand-surface border-brand-border text-brand-text hover:bg-gray-100'
        }`}
    >
        {label}
    </button>
);

const PantryFilterModal: React.FC<PantryFilterModalProps> = ({
    isOpen,
    onClose,
    selectedNova,
    setSelectedNova,
    selectedCodex,
    setSelectedCodex,
    availableCodexCategories,
    onClearFilters,
}) => {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;
    
    const animationClass = isOpen ? 'animate-slide-in-up' : 'animate-slide-out-down';

    return ReactDOM.createPortal(
        <div
            className={`fixed inset-0 bg-black/50 z-40 flex flex-col justify-end ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}
            onClick={onClose}
        >
            <div
                className={`bg-brand-background rounded-t-2xl shadow-lg w-full max-h-[75vh] flex flex-col ${animationClass}`}
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-brand-border flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-brand-text">Filtros</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20}/></button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 space-y-5">
                    <div>
                        <h3 className="font-semibold text-brand-text mb-2">Classificação NOVA</h3>
                        <div className="flex flex-wrap gap-2">
                            <FilterButton label="Todas" isSelected={selectedNova === 'all'} onClick={() => setSelectedNova('all')} />
                            {Object.entries(NOVA_CLASSIFICATION).map(([key, value]) => (
                                <FilterButton
                                    key={key}
                                    label={value.simpleLabel || value.label}
                                    isSelected={selectedNova === key}
                                    onClick={() => setSelectedNova(key as NovaClassificationKey)}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-brand-text mb-2">Categoria Codex</h3>
                        <div className="flex flex-wrap gap-2">
                             <FilterButton label="Todas" isSelected={selectedCodex === 'all'} onClick={() => setSelectedCodex('all')} />
                             {availableCodexCategories.map(category => (
                                <FilterButton
                                    key={category}
                                    label={category}
                                    isSelected={selectedCodex === category}
                                    onClick={() => setSelectedCodex(category)}
                                />
                             ))}
                        </div>
                    </div>
                </main>
                
                <footer className="p-3 border-t border-brand-border bg-brand-surface/80 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClearFilters}
                            className="w-full bg-brand-surface text-brand-text font-bold py-3 px-4 rounded-xl border border-brand-border hover:bg-gray-100"
                        >
                            Limpar Filtros
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-brand-dark"
                        >
                            Ver Resultados
                        </button>
                    </div>
                </footer>
            </div>
        </div>,
        modalRoot
    );
};

export default PantryFilterModal;
