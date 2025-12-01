
import React, { useState, useEffect } from 'react';
import type { PantryItem } from '../types';
import { Edit, Trash2, CheckCircle2, Save, LoaderCircle } from 'lucide-react';
import FoodIcon from './FoodIcon';
import { NOVA_CLASSIFICATION } from '../constants/foodClassifications';
import { UNITS } from '../constants/units';
import { formatQuantity, toTitleCase } from '../utils/formatters';


interface PantryListItemProps {
    item: PantryItem;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    isEditing: boolean;
    isSaving: boolean;
    onEditRequest: () => void;
    onSaveEdit: (id: string, updates: Partial<PantryItem>) => void;
    onCancelEdit: () => void;
    onDeleteItem: (id: string) => void;
}


const PantryListItem: React.FC<PantryListItemProps> = ({ 
    item, 
    isSelectionMode, 
    isSelected, 
    onToggleSelection, 
    isEditing,
    isSaving,
    onEditRequest,
    onSaveEdit,
    onCancelEdit,
    onDeleteItem
}) => {
    const [editedItem, setEditedItem] = useState(item);

    useEffect(() => {
        setEditedItem(item);
    }, [item, isEditing]);

    const handleFieldChange = (field: keyof PantryItem, value: string | number) => {
        // Ensure quantity is cleaned immediately on input for valid float parsing
        const processedValue = field === 'quantity' ? parseFloat(value as string) || 0 : value;
        setEditedItem(prev => ({ ...prev, [field]: processedValue }));
    };

    const handleSave = () => {
        const updates: Partial<PantryItem> = {};
        // Clean quantity before sending
        const cleanedQuantity = formatQuantity(editedItem.quantity);
        
        if (cleanedQuantity !== item.quantity) {
            updates.quantity = cleanedQuantity;
        }
        
        if (editedItem.name !== item.name) {
            updates.name = toTitleCase(editedItem.name);
        }
        if (editedItem.unit !== item.unit) updates.unit = editedItem.unit;

        onSaveEdit(item.id, updates);
    };

    if (isEditing) {
        return (
            <div className="bg-brand-surface p-3 rounded-xl shadow-lg border-2 border-brand-primary animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="text-xs font-semibold text-brand-text-secondary block mb-1">Nome do item</label>
                        <input type="text" value={editedItem.name} onChange={e => handleFieldChange('name', e.target.value)} className="w-full text-sm bg-brand-background border border-brand-border rounded-lg p-2"/>
                    </div>
                     <div>
                        <label className="text-xs font-semibold text-brand-text-secondary block mb-1">Quantidade</label>
                        <input 
                            type="number" 
                            value={editedItem.quantity} 
                            onChange={e => handleFieldChange('quantity', e.target.value)} 
                            className="w-full text-sm bg-brand-background border border-brand-border rounded-lg p-2" 
                            min="0" 
                            step="0.1"
                        />
                    </div>
                     <div>
                        <label className="text-xs font-semibold text-brand-text-secondary block mb-1">Unidade</label>
                        <select value={editedItem.unit} onChange={e => handleFieldChange('unit', e.target.value)} className="w-full text-sm bg-brand-background border border-brand-border rounded-lg p-2">
                            {UNITS.map(u => <option key={u.value} value={u.value}>{u.description}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="flex justify-between items-center mt-4 pt-3 border-t border-brand-border">
                    <button onClick={() => onDeleteItem(item.id)} className="flex items-center gap-1.5 text-sm text-red-500 font-semibold p-2 hover:bg-red-50 rounded-lg disabled:opacity-50" disabled={isSaving}>
                        <Trash2 size={16}/> Excluir
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onCancelEdit} disabled={isSaving} className="px-4 py-2 rounded-lg text-brand-text-secondary font-semibold hover:bg-gray-100 disabled:opacity-50">Cancelar</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 min-w-[110px] rounded-lg bg-brand-primary text-white font-bold hover:bg-brand-dark flex items-center justify-center gap-1.5 disabled:bg-gray-400 transition-colors">
                            {isSaving ? <LoaderCircle className="animate-spin" size={16}/> : <Save size={16}/>}
                            <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const novaInfo = NOVA_CLASSIFICATION[item.novaClassification] || NOVA_CLASSIFICATION.processed;
    return (
        <div className={`bg-brand-surface rounded-xl transition-shadow duration-200 ${isSelected ? 'shadow-md ring-2 ring-green-200' : 'hover:shadow-md'}`}>
            <div 
                className="w-full p-2.5 flex items-center justify-between gap-3"
                onClick={() => isSelectionMode && onToggleSelection(item.id)}
            >
                {isSelectionMode && (
                    <div className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'bg-brand-primary' : 'border-2 border-gray-300'}`}>
                        {isSelected && <CheckCircle2 size={20} className="text-white" />}
                    </div>
                )}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                     <FoodIcon name={item.name} icon={item.icon} size="sm" />
                    
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-brand-text capitalize truncate">{toTitleCase(item.name)}</h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                             <span className={`font-semibold capitalize px-1.5 py-0.5 rounded-md text-[10px] ${novaInfo.color}`}>{novaInfo.label}</span>
                             <span className="text-[10px] text-brand-text-secondary bg-gray-100 px-1.5 py-0.5 rounded-md">{item.codexCategory}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right flex items-center gap-3">
                    <div>
                        <span className="text-sm font-bold text-brand-text">{formatQuantity(item.quantity)}</span>
                        <span className="text-xs text-brand-text-secondary ml-1">{item.unit}</span>
                    </div>
                    {!isSelectionMode && (
                         <button onClick={onEditRequest} className="p-2 text-brand-text-secondary hover:bg-gray-100 rounded-full flex-shrink-0">
                            <Edit size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PantryListItem;
