
import React, { useContext, useState, memo } from 'react';
import type { PantryItem } from '../../types';
import { AppContext } from '../../contexts/AppContext';
import { Minus, Plus, X, Edit, Save, XCircle } from 'lucide-react';
import DynamicIcon from '../common/DynamicIcon';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';
import { UNITS } from '../../constants/units';
import { getUnitLabel } from '../../helpers/units';

interface PantryListItemProps {
    item: PantryItem;
}

const PantryListItem: React.FC<PantryListItemProps> = ({ item }) => {
    const context = useContext(AppContext);
    const [isEditing, setIsEditing] = useState(false);
    const [editedQuantity, setEditedQuantity] = useState(item.quantity);
    const [editedUnit, setEditedUnit] = useState(item.unit);

    if (!context) return null;
    const { removeItemFromPantry, updatePantryItemQuantity, updatePantryItemDetails } = context;
    
    const fallbackNova = {
        label: 'Desconhecido',
        description: 'Classificação nutricional não disponível.',
        color: 'bg-gray-100 text-gray-800',
        borderColor: 'border-gray-500',
    };
    const novaInfo = NOVA_CLASSIFICATION[item.novaClassification] || fallbackNova;

    const handleQuantityChange = async (amount: number) => {
        const newQuantity = item.quantity + amount;
        if (newQuantity >= 0) {
            await updatePantryItemQuantity(item.id, newQuantity);
        }
    };
    
    const handleSave = async () => {
        const newQuantity = Number(editedQuantity);
        if (!isNaN(newQuantity) && newQuantity >= 0) {
            await updatePantryItemDetails(item.id, {
                quantity: newQuantity,
                unit: editedUnit,
            });
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditedQuantity(item.quantity);
        setEditedUnit(item.unit);
        setIsEditing(false);
    };


    if (isEditing) {
        return (
            <div className="bg-brand-surface rounded-xl shadow-sm p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ring-2 ring-brand-primary">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-full flex-shrink-0`} style={{ backgroundColor: `${item.color}20` }}>
                        <DynamicIcon name={item.icon} className="w-5 h-5" style={{ color: item.color }}/>
                    </div>
                    <h3 className="text-sm font-bold text-brand-text capitalize truncate">{item.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={editedQuantity}
                        onChange={(e) => setEditedQuantity(Number(e.target.value))}
                        className="w-16 p-1.5 border border-brand-border rounded-lg text-sm"
                        min="0"
                    />
                    <select
                        value={editedUnit}
                        onChange={(e) => setEditedUnit(e.target.value)}
                        className="p-1.5 border border-brand-border rounded-lg text-xs bg-white flex-1"
                    >
                         {UNITS.map(u => <option key={u.value} value={u.value}>{u.label.split(' ')[1]}</option>)}
                    </select>
                    <button onClick={handleCancel} className="p-1.5 rounded-full text-brand-text-secondary hover:bg-gray-200 transition-colors"><XCircle size={18} /></button>
                    <button onClick={handleSave} className="p-1.5 rounded-full text-brand-primary bg-green-50 hover:bg-green-100 transition-colors"><Save size={18} /></button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-brand-surface rounded-xl shadow-sm p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                 <div className={`p-2 rounded-full flex-shrink-0`} style={{ backgroundColor: `${item.color}20` }}>
                    <DynamicIcon name={item.icon} className="w-5 h-5" style={{ color: item.color }}/>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-brand-text capitalize truncate">{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                         <span className={`font-semibold capitalize px-1.5 py-0.5 rounded-md text-[10px] ${novaInfo.color}`}>{novaInfo.label}</span>
                         <span className="text-[10px] text-brand-text-secondary bg-gray-100 px-1.5 py-0.5 rounded-md">{item.codexCategory}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
                 <div className="flex items-center gap-1 sm:gap-1.5 bg-brand-background rounded-full border border-brand-border p-1">
                    <button 
                        onClick={() => handleQuantityChange(-1)} 
                        className="p-1 rounded-full text-brand-text-secondary hover:bg-gray-200 transition-colors"
                        aria-label={`Diminuir quantidade de ${item.name}`}
                    >
                        <Minus size={14} />
                    </button>
                    <div className="text-center w-14 sm:w-16">
                        <span className="text-sm font-bold text-brand-text">{item.quantity}</span>
                        <span className="text-xs text-brand-text-secondary ml-1">{getUnitLabel(item.unit)}</span>
                    </div>
                    <button 
                        onClick={() => handleQuantityChange(1)} 
                        className="p-1 rounded-full text-brand-text-secondary hover:bg-gray-200 transition-colors"
                        aria-label={`Aumentar quantidade de ${item.name}`}
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 bg-gray-100/60 rounded-full text-brand-text-secondary hover:bg-blue-100 hover:text-blue-600 transition-colors"
                        aria-label={`Editar ${item.name}`}
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={async () => await removeItemFromPantry(item.id)}
                        className="p-1.5 bg-gray-100/60 rounded-full text-brand-text-secondary hover:bg-brand-risk-high/20 hover:text-brand-risk-high transition-colors"
                        aria-label={`Remover ${item.name}`}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default memo(PantryListItem);
