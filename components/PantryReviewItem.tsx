


import React, { useState, useEffect } from 'react';
import type { PantryItem, PantryReviewChange, PantryReviewAction } from '../types';
import { Trash2, Check, Edit, Save, X } from 'lucide-react';
import { UNITS } from '../constants/units';

interface PantryReviewItemProps {
    item: PantryItem;
    change: PantryReviewChange | undefined;
    onAction: (itemId: string, action: PantryReviewAction, details?: { newQuantity?: number, newUnit?: string }) => void;
}

const PantryReviewItem: React.FC<PantryReviewItemProps> = ({ item, change, onAction }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editState, setEditState] = useState({ quantity: item.quantity, unit: item.unit });

    useEffect(() => {
        // Reset local state if the parent's change state indicates we are not editing this item anymore.
        if (change?.action !== 'update') {
            setIsEditing(false);
        }
        setEditState({ quantity: change?.newQuantity ?? item.quantity, unit: change?.newUnit ?? item.unit });
    }, [change, item]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        onAction(item.id, 'update', { newQuantity: editState.quantity, newUnit: editState.unit });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditState({ quantity: item.quantity, unit: item.unit });
        setIsEditing(false);
        // Revert to 'keep' if it was previously marked for update
        if (change?.action === 'update') {
             onAction(item.id, 'keep');
        }
    };

    const action = change?.action;

    return (
        <div className={`p-3 rounded-xl transition-all ${action ? 'bg-brand-primary-light' : 'bg-brand-surface border border-brand-border'}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-text capitalize truncate">{item.name}</p>
                    <p className="text-xs text-brand-text-secondary">
                        Atual: {item.quantity} {item.unit}
                        {action === 'update' && (
                            <span className="font-bold text-brand-primary ml-2">
                                → {change.newQuantity} {change.newUnit || item.unit}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {isEditing ? (
                <div className="mt-3 pt-3 border-t border-brand-border/50 space-y-2 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={editState.quantity}
                            onChange={(e) => setEditState(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                            className="w-full p-2 border rounded-lg text-sm bg-white"
                        />
                        <select
                            value={editState.unit}
                            onChange={(e) => setEditState(prev => ({ ...prev, unit: e.target.value }))}
                            className="w-full p-2 border rounded-lg text-sm bg-white"
                        >
                            {UNITS.map(u => <option key={u.value} value={u.value}>{u.description}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                         <button onClick={handleCancel} className="p-2 text-brand-text-secondary hover:bg-gray-100 rounded-full"><X size={16}/></button>
                         <button onClick={handleSave} className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-full"><Save size={16}/></button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-brand-border/50">
                    <button 
                        onClick={() => onAction(item.id, 'keep')}
                        className={`flex items-center justify-center gap-1.5 text-sm font-semibold p-2 rounded-lg transition-colors ${action === 'keep' ? 'bg-green-600 text-white' : 'bg-white border text-green-700 hover:bg-green-50'}`}
                    >
                        <Check size={14} /> Manter
                    </button>
                    <button 
                        onClick={handleEdit}
                        className={`flex items-center justify-center gap-1.5 text-sm font-semibold p-2 rounded-lg transition-colors ${action === 'update' ? 'bg-blue-500 text-white' : 'bg-white border text-blue-600 hover:bg-blue-50'}`}
                    >
                        <Edit size={14} /> Ajustar
                    </button>
                    <button 
                        onClick={() => onAction(item.id, 'remove')} 
                        className={`flex items-center justify-center gap-1.5 text-sm font-semibold p-2 rounded-lg transition-colors ${action === 'remove' ? 'bg-red-500 text-white' : 'bg-white border text-red-500 hover:bg-red-50'}`}
                    >
                        <Trash2 size={14} /> Remover
                    </button>
                </div>
            )}
        </div>
    );
};

export default PantryReviewItem;
