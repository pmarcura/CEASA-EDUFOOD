
import React, { useState, useEffect } from 'react';
import type { ItemVerificationState, VerifiedItem } from '../types';
import { Check, Edit, Save, ScanLine, ChevronDown, ChevronUp } from 'lucide-react';
import { UNITS } from '../constants/units';
import { formatQuantity, toTitleCase } from '../utils/formatters';

interface ItemVerificationCardProps {
    verificationState: ItemVerificationState;
    onConfirm: (verifiedItems: VerifiedItem[]) => void;
}

const ItemVerificationCard: React.FC<ItemVerificationCardProps> = ({ verificationState, onConfirm }) => {
    const [items, setItems] = useState<VerifiedItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showNonFood, setShowNonFood] = useState(false);

    useEffect(() => {
        // Format incoming items to be clean
        const cleanItems = verificationState.items.map(i => ({
            ...i,
            name: toTitleCase(i.name),
            quantity: formatQuantity(i.quantity)
        }));
        setItems(cleanItems);
    }, [verificationState.items]);

    const handleToggleInclude = (id: string) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, isIncluded: !item.isIncluded } : item
            )
        );
    };

    const handleInputChange = (id: string, field: 'name' | 'quantity' | 'unit', value: string | number) => {
        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleConfirm = () => {
        setEditingId(null);
        // Final cleanup before confirming
        const finalItems = items.map(i => ({
            ...i,
            name: toTitleCase(i.name), // Enforce one last time
            quantity: formatQuantity(i.quantity)
        }));
        onConfirm(finalItems);
    };

    const includedItems = items.filter(item => item.isIncluded && item.isFood !== false);
    const nonFoodOrExcluded = items.filter(item => !item.isIncluded || item.isFood === false);

    if (verificationState.status === 'verified') {
        return (
             <div className="bg-white/90 backdrop-blur-sm border border-green-100 rounded-2xl p-4 mt-2 w-full max-w-md shadow-sm animate-fade-in">
                <div className="flex items-center justify-center text-green-600 font-bold gap-2">
                    <div className="p-1 bg-green-100 rounded-full"><Check size={16}/></div>
                    <span>{items.filter(i => i.isIncluded).length} Itens Adicionados</span>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl shadow-edu border border-gray-100 overflow-hidden mt-2 w-full max-w-md animate-fade-in relative">
            {/* Receipt Header Effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary via-teal-400 to-brand-primary"></div>
            
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="bg-brand-primary/10 p-2 rounded-xl text-brand-primary">
                            <ScanLine size={20} />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-brand-text text-lg leading-none">Nota Fiscal</h3>
                            <p className="text-xs text-brand-text-secondary mt-0.5">{items.length} itens encontrados</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1 scrollbar-hide">
                    {includedItems.map(item => (
                        <div key={item.id} className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${editingId === item.id ? 'bg-gray-50 ring-2 ring-brand-primary/20' : 'hover:bg-gray-50'}`}>
                            <div className="relative flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={item.isIncluded}
                                    onChange={() => handleToggleInclude(item.id)}
                                    className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-brand-primary checked:border-brand-primary transition-colors cursor-pointer"
                                />
                                <Check size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                            </div>

                            {editingId === item.id ? (
                                <div className="flex-1 flex gap-2 items-center">
                                    <div className="flex-1 space-y-1">
                                        <input 
                                            type="text" 
                                            value={item.name} 
                                            onChange={e => handleInputChange(item.id, 'name', e.target.value)} 
                                            className="w-full text-sm font-bold bg-white border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-brand-primary outline-none"
                                        />
                                        <div className="flex gap-1">
                                            <input 
                                                type="number" 
                                                value={item.quantity} 
                                                onChange={e => handleInputChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                                                className="w-20 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-brand-primary outline-none font-mono"
                                                step="0.01"
                                            />
                                            <select 
                                                value={item.unit} 
                                                onChange={e => handleInputChange(item.id, 'unit', e.target.value)}
                                                className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-brand-primary outline-none"
                                            >
                                                {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={() => setEditingId(null)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Save size={16}/></button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingId(item.id)}>
                                        <p className="text-sm font-bold text-brand-text capitalize truncate leading-tight">{item.name}</p>
                                        <p className="text-xs text-brand-text-secondary font-mono mt-0.5">{item.quantity} {item.unit}</p>
                                    </div>
                                    <button onClick={() => setEditingId(item.id)} className="p-2 text-gray-300 hover:text-brand-primary hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit size={14}/>
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {nonFoodOrExcluded.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-3">
                        <button 
                            onClick={() => setShowNonFood(!showNonFood)}
                            className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 hover:text-brand-text-secondary transition-colors px-2"
                        >
                            <span>{nonFoodOrExcluded.length} itens ignorados/removidos</span>
                            {showNonFood ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>
                        
                        {showNonFood && (
                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto pr-1">
                                {nonFoodOrExcluded.map(item => (
                                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 opacity-60">
                                        <input
                                            type="checkbox"
                                            checked={item.isIncluded}
                                            onChange={() => handleToggleInclude(item.id)}
                                            className="appearance-none w-4 h-4 border-2 border-gray-300 rounded checked:bg-brand-primary checked:border-brand-primary cursor-pointer"
                                        />
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-gray-600 capitalize line-through">{item.name}</p>
                                            {item.isFood === false && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Não é comida</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                    onClick={handleConfirm}
                    className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 transform active:scale-95 transition-all hover:bg-brand-dark"
                >
                    Confirmar ({includedItems.length})
                </button>
            </div>
        </div>
    );
};

export default ItemVerificationCard;
