
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { ArrowRight, Zap, LoaderCircle } from 'lucide-react';
import { generateSwaps } from '../../services/geminiService';

interface Swap {
    before: string;
    after: string;
    benefit: string;
}

const ImpactSwaps: React.FC = () => {
    const context = useContext(AppContext);
    const [swaps, setSwaps] = useState<Swap[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!context) return;
        
        const fetchSwaps = async () => {
            setIsLoading(true);
            setError(null);
            
            const ultraProcessedItems = context.pantry
                .filter(i => i.novaClassification === 'ultra_processed')
                .map(i => i.name);

            if (ultraProcessedItems.length === 0) {
                setSwaps([]);
                setIsLoading(false);
                return;
            }

            try {
                const generatedSwaps = await generateSwaps(ultraProcessedItems.slice(0, 3)); // Limit to 3 items for performance
                setSwaps(generatedSwaps);
            } catch (e) {
                setError("Não foi possível gerar sugestões no momento.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSwaps();
    }, [context]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center p-4">
                    <LoaderCircle className="animate-spin mr-2 text-brand-primary" />
                    <span className="text-sm text-brand-text-secondary">Buscando trocas inteligentes...</span>
                </div>
            );
        }

        if (error) {
            return <p className="text-sm text-red-500 text-center">{error}</p>;
        }

        if (swaps.length === 0) {
            return <p className="text-sm text-brand-text-secondary">Sua despensa está ótima! Não encontramos oportunidades claras para trocas ultraprocessadas no momento.</p>;
        }

        return (
            <div className="space-y-3">
                {swaps.map((swap, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between gap-2 text-sm font-semibold text-center">
                            <div className="flex-1">
                                <p className="text-xs text-brand-text-secondary">Trocar</p>
                                <p className="text-brand-text capitalize">{swap.before}</p>
                            </div>
                            <ArrowRight size={18} className="text-brand-primary flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs text-green-600">Por</p>
                                <p className="text-green-800">{swap.after}</p>
                            </div>
                        </div>
                        <div className="text-center mt-2">
                             <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-full inline-flex items-center gap-1">
                                <Zap size={12} /> {swap.benefit}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-brand-surface rounded-2xl p-5 shadow-edu">
            <h3 className="text-lg font-bold text-brand-text mb-3">Impacto das Trocas com IA</h3>
            {renderContent()}
        </div>
    );
};

export default ImpactSwaps;
