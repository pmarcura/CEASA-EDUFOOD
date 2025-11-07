
import React, { useState, useEffect } from 'react';
import type { ItemVerificationState, VerifiedItem } from '../types';
import { Check, Edit, Save, FileCheck2, XCircle, Package } from 'lucide-react';
import { UNITS } from '../constants/units';

interface ItemVerificationCardProps {
    verificationState: ItemVerificationState;
    onConfirm: (verifiedItems: VerifiedItem[]) => void;
}

const ItemVerificationCard: React.FC<ItemVerificationCardProps> = ({ verificationState, onConfirm }) => {
    const [items, setItems] = useState<VerifiedItem[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        setItems(verificationState.items);
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
        onConfirm(items);
    };

    const totalIncluded = items.filter(item => item.isIncluded).length;

    if (verificationState.status === 'verified') {
        return (
             <div className="bg-transparent rounded-2xl p-2 mt-2 w-full max-w-xs md:max-w-md lg:max-w-lg">
                <div className="flex items-center text-brand-primary font-bold">
                    <FileCheck2 className="h-5 w-5 mr-2" />
                    <span>Itens Verificados e Adicionados</span>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-transparent p-1 mt-2 w-full max-w-xs md:max-w-md lg:max-w-lg">
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {items.map(item => (
                    <div key={item.id} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${item.isIncluded ? 'bg-black/5' : 'bg-black/5 opacity-60'}`}>
                        <input
                            type="checkbox"
                            checked={item.isIncluded}
                            onChange={() => handleToggleInclude(item.id)}
                            className="form-checkbox h-5 w-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary flex-shrink-0"
                            aria-label={`Incluir ${item.name}`}
                        />
                        {editingId === item.id ? (
                             <>
                                <input type="text" value={item.name} onChange={e => handleInputChange(item.id, 'name', e.target.value)} className="w-full p-1 border rounded text-sm bg-white"/>
                                <input type="number" value={item.quantity} onChange={e => handleInputChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-16 p-1 border rounded text-sm bg-white"/>
                                <select 
                                    value={item.unit} 
                                    onChange={e => handleInputChange(item.id, 'unit', e.target.value)}
                                    className="p-1 border rounded text-sm bg-white"
                                >
                                    {UNITS.map(u => (
                                        <option key={u.value} value={u.value}>{u.label}</option>
                                    ))}
                                </select>
                                <button onClick={() => setEditingId(null)} className="p-1.5 text-brand-primary hover:bg-green-100 rounded-full"><Save size={16}/></button>
                            </>
                        ) : (
                            <>
                                <div className="flex-grow">
                                    <span className="capitalize text-sm text-brand-text font-medium">{item.name}</span>
                                    {item.isFood === false && (
                                        <div className="flex items-center text-xs text-gray-500">
                                            <Package size={12} className="mr-1"/> 
                                            <span>Não é um alimento</span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm text-brand-text-secondary font-semibold">{item.quantity} {item.unit}</span>
                                <button onClick={() => setEditingId(item.id)} className="p-1.5 text-brand-text-secondary hover:bg-gray-200 rounded-full"><Edit size={16}/></button>
                            </>
                        )}
                       
                    </div>
                ))}
            </div>
            <button
                onClick={handleConfirm}
                disabled={totalIncluded === 0}
                className="w-full mt-4 bg-brand-ios-blue text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center transition-colors hover:opacity-80 disabled:bg-brand-ios-gray-dark disabled:opacity-70"
            >
                <Check className="mr-2"/>
                Confirmar e Adicionar {totalIncluded > 0 ? `(${totalIncluded} Itens)` : ''}
            </button>
        </div>
    );
};

export default ItemVerificationCard;