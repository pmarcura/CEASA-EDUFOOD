import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import PantryItemCard from './PantryItemCard';

const PantryDisplay: React.FC = () => {
    const context = useContext(AppContext);

    if (!context || !context.pantry) {
        return <p>Carregando despensa...</p>;
    }

    const { pantry } = context;

    if (pantry.length === 0) {
        return (
            <div className="text-center text-brand-text-secondary mt-10">
                <h2 className="text-2xl font-bold text-brand-text mb-2">Sua despensa está vazia!</h2>
                <p>Use a aba 'Chat' para adicionar sua primeira lista de compras.</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-3xl font-bold text-brand-text mb-6">Sua Despensa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pantry.map(item => (
                    <PantryItemCard key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
};

export default PantryDisplay;