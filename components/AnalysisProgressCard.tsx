
import React, { useState, useEffect } from 'react';
import { LoaderCircle, CheckCircle2, XCircle, Sparkles, Clock, Database } from 'lucide-react';
import type { AnalysisState } from '../../types';

interface AnalysisProgressCardProps {
    analysis: AnalysisState;
}

const LOADING_MESSAGES = [
    "Digitalizando nota fiscal...",
    "Extraindo texto...",
    "Identificando produtos...",
    "Organizando lista..."
];

const ENRICHING_MESSAGES = [
    "Consultando tabela nutricional...",
    "Classificando (NOVA)...",
    "Verificando validade...",
    "Colorindo despensa..."
];

const AnalysisProgressCard: React.FC<AnalysisProgressCardProps> = ({ analysis }) => {
    const { status, totalItems, progress } = analysis;
    const [elapsedTime, setElapsedTime] = useState(0);
    const [messageIndex, setMessageIndex] = useState(0);

    const isComplete = status === 'done';
    const isError = status === 'error';
    const isEnriching = status === 'enriching';

    // Timer logic for elapsed time only
    useEffect(() => {
        if (isComplete || isError) return;

        const startTime = Date.now();
        const timerInterval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [isComplete, isError]);

    // Message rotation logic
    useEffect(() => {
        if (isComplete || isError) return;
        
        const messageInterval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % (isEnriching ? ENRICHING_MESSAGES.length : LOADING_MESSAGES.length));
        }, 3000);

        return () => clearInterval(messageInterval);
    }, [isEnriching, isComplete, isError]);

    const currentMessage = isEnriching 
        ? ENRICHING_MESSAGES[messageIndex]
        : LOADING_MESSAGES[messageIndex];

    // Determine the visual progress percentage
    // If parsing, we fake it slightly up to 90% because we don't know total yet.
    // If enriching, we use the REAL progress passed from props.
    const displayProgress = isEnriching ? progress : (status === 'parsing' ? 45 : 0);

    if (status === 'idle') return null;

    return (
        <div className="w-full max-w-sm mx-auto mt-3 animate-fade-in">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-edu relative overflow-hidden">
                
                {/* Header with Icon and Status */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0">
                        {isComplete ? (
                            <div className="bg-green-100 p-2 rounded-full animate-pop">
                                <CheckCircle2 size={20} className="text-green-600" />
                            </div>
                        ) : isError ? (
                            <div className="bg-red-100 p-2 rounded-full animate-pop">
                                <XCircle size={20} className="text-red-600" />
                            </div>
                        ) : (
                            <div className="bg-brand-primary/10 p-2 rounded-full relative">
                                <LoaderCircle size={20} className="animate-spin text-brand-primary" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-brand-text text-sm">
                                {isComplete ? 'Processamento Concluído' : isError ? 'Erro no Processamento' : (isEnriching ? 'Enriquecendo Itens' : 'Lendo Imagem')}
                            </h4>
                            {!isComplete && !isError && (
                                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 flex items-center gap-1">
                                    <Clock size={10} /> {elapsedTime}s
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-brand-text-secondary mt-0.5 transition-all duration-300 ease-in-out">
                            {isComplete 
                                ? `${totalItems} itens adicionados à despensa` 
                                : isError 
                                    ? 'Tente enviar novamente' 
                                    : currentMessage
                            }
                        </p>
                    </div>
                </div>

                {/* Real Progress Bar */}
                {!isComplete && !isError && (
                    <div className="relative">
                        <div className="flex justify-between text-[10px] font-semibold text-gray-400 mb-1">
                            <span>{isEnriching ? `${Math.round(displayProgress)}%` : 'Aguarde...'}</span>
                            {isEnriching && <span>{totalItems} itens</span>}
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-brand-primary transition-all duration-500 ease-out rounded-full relative"
                                style={{ width: `${isComplete ? 100 : Math.max(5, displayProgress)}%` }}
                            >
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_1.5s_infinite]" 
                                     style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Database Sync Indicator (Visual Flair) */}
                {isEnriching && (
                    <div className="absolute bottom-2 right-2 opacity-20">
                        <Database size={40} className="text-brand-primary animate-pulse" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisProgressCard;
