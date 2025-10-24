import React from 'react';
import { LoaderCircle, CheckCircle2, XCircle, ScanLine } from 'lucide-react';
import type { AnalysisState, Classification, RiskLevel } from '../types';

interface AnalysisProgressCardProps {
    analysis: AnalysisState;
}

const getStatusIcon = (status: 'pending' | 'success' | 'error' | 'skipped') => {
    switch (status) {
        case 'pending':
            return <LoaderCircle className="h-5 w-5 animate-spin text-brand-text-secondary" />;
        case 'success':
            return <CheckCircle2 className="h-5 w-5 text-brand-risk-low" />;
        case 'error':
            return <XCircle className="h-5 w-5 text-brand-risk-high" />;
        case 'skipped':
            return <XCircle className="h-5 w-5 text-gray-400" />;
        default:
            return null;
    }
};

const getRiskColor = (riskLevel?: RiskLevel) => {
    switch (riskLevel) {
        case 'Baixo': return 'text-brand-risk-low';
        case 'Médio': return 'text-brand-risk-medium';
        case 'Alto': return 'text-brand-risk-high';
        default: return 'text-brand-text-secondary';
    }
};

const getClassificationColor = (classification?: Classification) => {
    switch (classification) {
        case 'in natura': return 'bg-green-100 text-green-800';
        case 'processado': return 'bg-yellow-100 text-yellow-800';
        case 'ultraprocessado': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

const AnalysisProgressCard: React.FC<AnalysisProgressCardProps> = ({ analysis }) => {
    const { status, progress, totalItems, processedItems } = analysis;

    const getTitle = () => {
        switch (status) {
            case 'parsing': return 'Analisando sua lista...';
            case 'enriching': return `Analisando ${processedItems.filter(p => p.status === 'success' || p.status === 'error').length}/${totalItems} itens...`;
            case 'done': return `Análise Concluída!`;
            case 'error': return 'Ocorreu um erro na análise.';
            default: 'Iniciando análise...';
        }
    };
    
    if (status === 'idle') return null;

    return (
        <div className="bg-brand-surface rounded-2xl shadow-edu p-4 mt-2 w-full max-w-xs md:max-w-md lg:max-w-lg border border-brand-border">
            <div className="flex items-center mb-3">
                <ScanLine className="h-6 w-6 text-brand-primary mr-3" />
                <div className="w-full">
                    <p className="font-bold text-brand-text">{getTitle()}</p>
                     {(status === 'enriching' || status === 'done') && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1.5">
                            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                </div>
            </div>

            {processedItems.length > 0 && (
                 <div className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
                    {processedItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2.5 bg-brand-background rounded-lg">
                            <div className="flex items-center">
                                <span className="mr-3">{getStatusIcon(item.status)}</span>
                                <span className="capitalize text-brand-text">{item.name}</span>
                            </div>
                            {item.status === 'success' && (
                               <div className="flex items-center gap-2">
                                     <span className={`text-xs font-semibold ${getRiskColor(item.riskLevel)}`}>{item.riskLevel}</span>
                                     <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getClassificationColor(item.classification)} capitalize`}>
                                        {item.classification}
                                    </span>
                               </div>
                            )}
                             {item.status === 'error' && (
                                <span className="text-xs font-semibold text-brand-risk-high">Falha</span>
                            )}
                             {item.status === 'skipped' && (
                                <span className="text-xs font-semibold text-gray-500">Não é alimento</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnalysisProgressCard;