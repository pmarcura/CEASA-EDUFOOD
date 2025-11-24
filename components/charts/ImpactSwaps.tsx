
import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { ArrowRight, Zap, LoaderCircle, Sparkles } from 'lucide-react';

const ImpactSwaps: React.FC = () => {
    const context = useContext(AppContext);

    if (!context) return null;
    const { isSwapsLoading, swaps } = context;

    if (isSwapsLoading) {
        return (
            <div className="flex items-center justify-center p-8 bg-white rounded-3xl border border-dashed border-gray-200">
                <LoaderCircle className="animate-spin mr-2 text-brand-primary" />
                <span className="text-sm text-brand-text-secondary font-medium">Buscando trocas inteligentes...</span>
            </div>
        );
    }

    if (swaps.length === 0) {
        return (
            <div className="bg-green-50 rounded-3xl p-6 border border-green-100 text-center">
                <Sparkles className="mx-auto text-green-500 mb-2" size={24} />
                <p className="text-sm font-bold text-green-800">Tudo limpo!</p>
                <p className="text-xs text-green-700 mt-1">Não encontramos ultraprocessados óbvios para substituir.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
             <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-lg font-bold text-brand-text flex items-center gap-2">
                    <Zap size={18} className="text-brand-primary fill-current"/>
                    Sugestões de Troca
                </h3>
                <span className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-lg">{swaps.length} Dicas</span>
            </div>
            
            {/* Horizontal Scroll Container */}
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar -mx-5 px-5">
                {swaps.map((swap, index) => (
                    <div 
                        key={index} 
                        className="snap-center flex-shrink-0 w-[280px] bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between gap-3 mb-4">
                            {/* Before */}
                            <div className="flex-1 bg-red-50 rounded-xl p-2 text-center min-h-[60px] flex flex-col items-center justify-center">
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-1">Evitar</span>
                                <p className="font-bold text-sm text-red-800 capitalize leading-tight line-clamp-2">{swap.before}</p>
                            </div>

                            <ArrowRight size={20} className="text-gray-300" />
                            
                            {/* After */}
                            <div className="flex-1 bg-green-50 rounded-xl p-2 text-center min-h-[60px] flex flex-col items-center justify-center">
                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wide mb-1">Preferir</span>
                                <p className="font-bold text-sm text-green-800 leading-tight line-clamp-2">{swap.after}</p>
                            </div>
                        </div>
                        
                        <div className="bg-brand-background rounded-xl p-3">
                            <p className="text-xs font-medium text-brand-text-secondary text-center leading-relaxed">
                                "{swap.benefit}"
                            </p>
                        </div>
                    </div>
                ))}
                {/* Padding element for the end of scroll */}
                <div className="w-1 flex-shrink-0"></div>
            </div>
        </div>
    );
};

export default ImpactSwaps;
