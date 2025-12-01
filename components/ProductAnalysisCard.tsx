
import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, ThumbsUp, ThumbsDown, Check, ScanLine, Scale, Plus, Minus, Package } from 'lucide-react';
import type { ProductAnalysisResult } from '../types';
import { NOVA_CLASSIFICATION } from '../constants/foodClassifications';

interface ProductAnalysisCardProps {
    analysis: ProductAnalysisResult;
    onConfirm: (packCount: number) => void;
}

const ProductAnalysisCard: React.FC<ProductAnalysisCardProps> = ({ analysis, onConfirm }) => {
    const { productName, brand, size, healthScore, additivesExplained, positivePoints, negativePoints, novaClassification, scannedItem } = analysis;
    const [step, setStep] = useState<'initial' | 'quantity' | 'added'>('initial');
    // 'packCount' represents the number of packages/units, defaulting to 1.
    const [packCount, setPackCount] = useState(1);
    
    let scoreColor = 'text-red-500';
    let scoreBg = 'bg-red-50';
    if (healthScore >= 70) {
        scoreColor = 'text-green-600';
        scoreBg = 'bg-green-50';
    } else if (healthScore >= 40) {
        scoreColor = 'text-yellow-600';
        scoreBg = 'bg-yellow-50';
    }

    const novaInfo = NOVA_CLASSIFICATION[novaClassification] || NOVA_CLASSIFICATION.processed;

    const handleInitialClick = () => {
        setStep('quantity');
    };

    const handleConfirm = () => {
        onConfirm(packCount);
        setStep('added');
    };

    // Calculate total quantity based on pack count
    const totalQuantity = packCount * (scannedItem.quantity || 0);

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden w-full max-w-sm animate-fade-in mb-4 relative">
            {/* Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-brand-text-secondary uppercase mb-1">{brand}</p>
                    <h3 className="font-bold text-xl text-brand-text leading-tight">{productName}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg text-xs font-bold text-gray-700 border border-gray-200">
                            <Scale size={12}/> {size}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${novaInfo.color}`}>
                            {novaInfo.simpleLabel}
                        </span>
                    </div>
                </div>
                <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full ${scoreBg} ${scoreColor}`}>
                    <span className="text-2xl font-black">{healthScore}</span>
                    <span className="text-[10px] font-bold uppercase">Score</span>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Additives Translation */}
                {additivesExplained.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-brand-text mb-2 flex items-center gap-2">
                            <ScanLine size={16} className="text-brand-primary"/> Tradução do Rótulo
                        </h4>
                        <div className="space-y-2">
                            {additivesExplained.map((item, idx) => (
                                <div key={idx} className={`p-3 rounded-xl border-l-4 text-sm ${item.risk === 'high' ? 'bg-red-50 border-red-400' : item.risk === 'medium' ? 'bg-yellow-50 border-yellow-400' : 'bg-blue-50 border-blue-400'}`}>
                                    <p className="font-bold text-brand-text">{item.term}</p>
                                    <p className="text-brand-text-secondary leading-snug mt-0.5">{item.explanation}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pros & Cons */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <h5 className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1"><ThumbsUp size={14}/> Pontos Fortes</h5>
                        <ul className="space-y-1">
                            {positivePoints.map((p, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                    <Check size={12} className="text-green-500 mt-0.5 flex-shrink-0"/> {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1"><ThumbsDown size={14}/> Atenção</h5>
                        <ul className="space-y-1">
                            {negativePoints.map((p, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                    <ShieldAlert size={12} className="text-red-500 mt-0.5 flex-shrink-0"/> {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Dynamic Footer Action */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
                {step === 'initial' && (
                    <button 
                        onClick={handleInitialClick}
                        className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-brand-dark transition-all flex items-center justify-center gap-2"
                    >
                        <ShieldCheck size={20}/>
                        Adicionar à Despensa
                    </button>
                )}

                {step === 'quantity' && (
                    <div className="animate-fade-in">
                        <p className="text-center text-xs font-bold text-brand-text-secondary mb-2 uppercase flex items-center justify-center gap-1">
                            <Package size={14} /> Quantos Pacotes?
                        </p>
                        
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex flex-1 items-center bg-white border border-gray-300 rounded-xl px-1">
                                <button onClick={() => setPackCount(Math.max(1, packCount - 1))} className="p-3 text-brand-text hover:bg-gray-100 rounded-l-lg"><Minus size={18}/></button>
                                <span className="flex-1 text-center font-bold text-lg">{packCount} {packCount === 1 ? 'un' : 'uns'}</span>
                                <button onClick={() => setPackCount(packCount + 1)} className="p-3 text-brand-text hover:bg-gray-100 rounded-r-lg"><Plus size={18}/></button>
                            </div>
                        </div>
                        
                        <div className="text-center mb-4 text-xs text-brand-text-secondary bg-blue-50 p-2 rounded-lg border border-blue-100">
                            Total na Despensa: <span className="font-bold text-blue-700">{totalQuantity} {scannedItem.unit}</span>
                        </div>

                        <button 
                            onClick={handleConfirm}
                            className="w-full bg-brand-primary text-white font-bold py-3 rounded-xl shadow-md hover:bg-brand-dark transition-colors"
                        >
                            Confirmar ({totalQuantity} {scannedItem.unit})
                        </button>
                    </div>
                )}

                {step === 'added' && (
                    <div className="w-full bg-green-100 text-green-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 animate-pop cursor-default">
                        <Check size={20}/>
                        Adicionado com Sucesso!
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductAnalysisCard;
