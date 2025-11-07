
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { ArrowRight, Zap, LoaderCircle } from 'lucide-react';

const ImpactSwaps: React.FC = () => {
    const context = useContext(AppContext);

    const renderContent = () => {
        if (!context) return null;
        const { isSwapsLoading, swaps } = context;

        if (isSwapsLoading) {
            return (
                <div className="flex items-center justify-center p-4">
                    <LoaderCircle className="animate-spin mr-2 text-brand-primary" />
                    <span className="text-sm text-brand-text-secondary">Buscando trocas inteligentes...</span>
                </div>
            );
        }

        if (swaps.length === 0) {
            return <p className="text-sm text-brand-text-secondary p-4 text-center">Sua despensa está ótima! Não encontramos oportunidades claras para trocas ultraprocessadas no momento.</p>;
        }

        return (
            <div className="space-y-4">
                {swaps.map((swap, index) => (
                    <div key={index} className="bg-brand-background p-4 rounded-xl border border-brand-border">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            {/* Before */}
                            <div className="text-center">
                                <span className="text-xs font-semibold text-brand-text-secondary">Trocar</span>
                                <p className="font-bold text-brand-text mt-1 capitalize">{swap.before}</p>
                            </div>

                            {/* Arrow */}
                            <div className="p-2 bg-brand-primary-light rounded-full">
                                <ArrowRight size={20} className="text-brand-primary" />
                            </div>
                            
                            {/* After */}
                            <div className="text-center">
                                <span className="text-xs font-semibold text-green-600">Por</span>
                                <p className="font-bold text-green-700 mt-1">{swap.after}</p>
                            </div>
                        </div>
                        {/* Benefit */}
                        <div className="mt-4 pt-3 border-t border-brand-border/60">
                            <div className="flex items-center gap-2 text-sm text-brand-primary">
                                <Zap size={16} />
                                <p className="font-semibold">{swap.benefit}</p>
                            </div>
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