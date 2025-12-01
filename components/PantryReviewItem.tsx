
import React, { useState, useEffect, useContext } from 'react';
import type { PantryItem, PantryReviewChange, PantryReviewAction } from '../types';
import { AppContext } from '../contexts/AppContext';
import { Trash2, Check, Edit, Save, X } from 'lucide-react';
import { UNITS } from '../constants/units';
import StarRating from './StarRating';

interface PantryReviewItemProps {
    item: PantryItem;
    change: PantryReviewChange | undefined;
    onAction: (itemId: string, action: PantryReviewAction, details?: { newQuantity?: number, newUnit?: string, newChildPreferences?: Record<string, number> }) => void;
}

const PantryReviewItem: React.FC<PantryReviewItemProps> = ({ item, change, onAction }) => {
    const context = useContext(AppContext);
    const { userProfile } = context || {};
    const children = userProfile?.children || [];

    const [isEditing, setIsEditing] = useState(false);
    const [editState, setEditState] = useState({ quantity: item.quantity, unit: item.unit });
    
    // State for each child's preference
    const [childPrefs, setChildPrefs] = useState<Record<string, number>>(item.childPreferences || {});

    useEffect(() => {
        if (change?.action !== 'update') {
            setIsEditing(false);
        }
        setEditState({ quantity: change?.newQuantity ?? item.quantity, unit: change?.newUnit ?? item.unit });
        if (change?.newChildPreferences) {
            setChildPrefs(change.newChildPreferences);
        }
    }, [change, item]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        onAction(item.id, 'update', { 
            newQuantity: editState.quantity, 
            newUnit: editState.unit, 
            newChildPreferences: childPrefs 
        });
        setIsEditing(false);
    };

    const handleKeep = () => {
        onAction(item.id, 'keep', { newChildPreferences: childPrefs });
    };

    const handleRatingChange = (childId: string, newRating: number) => {
        const newPrefs = { ...childPrefs, [childId]: newRating };
        setChildPrefs(newPrefs);
        
        // Auto-save preference change immediately
        const currentAction = change?.action === 'update' ? 'update' : 'keep';
        onAction(item.id, currentAction, { 
            newQuantity: change?.newQuantity, 
            newUnit: change?.newUnit, 
            newChildPreferences: newPrefs 
        });
    };

    const handleCancel = () => {
        setEditState({ quantity: item.quantity, unit: item.unit });
        setChildPrefs(item.childPreferences || {});
        setIsEditing(false);
        if (change?.action === 'update') {
             onAction(item.id, 'keep', { newChildPreferences: item.childPreferences || {} });
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
            
            {/* Child Ratings Section */}
            {children.length > 0 && (
                <div className="mt-2 bg-white/50 rounded-lg p-2 space-y-2">
                    {children.map(child => (
                        <div key={child.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700">
                                    {child.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-brand-text">{child.name}</span>
                            </div>
                            <StarRating 
                                rating={childPrefs[child.id] || 0} 
                                setRating={(r) => handleRatingChange(child.id, r)} 
                                size={14} 
                            />
                        </div>
                    ))}
                </div>
            )}

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
                        onClick={handleKeep}
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
