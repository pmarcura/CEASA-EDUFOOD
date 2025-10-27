
import React from 'react';
import { LoaderCircle, CheckCircle2, XCircle, ScanLine } from 'lucide-react';
import type { AnalysisState, NovaClassificationKey, RiskLevel } from '../../types';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';

interface AnalysisProgressCardProps {
    analysis: AnalysisState;
}

const getStatusIcon = (status: 'pending' | 'success' | 'error' | 'skipped') => {
    switch (status) {
        case 'pending':
            return <LoaderCircle className="h-4 w-4 animate-spin text-brand-text-secondary" />;
        case 'success':
            return <CheckCircle2 className="h-4 w-4 text-brand-risk-low" />;
        case 'error':
            return <XCircle className="h-4 w-4 text-brand-risk-high" />;
        case 'skipped':
            return <XCircle className="h-4 w-4 text-gray-400" />;
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

const getNovaClassificationStyle = (classification?: NovaClassificationKey) => {
    if (!classification || !NOVA_CLASSIFICATION[classification]) {
        return 'bg-gray-100 text-gray-800';
    }
    return NOVA_CLASSIFICATION[classification].color;
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
        <div className="bg-brand-surface rounded-xl shadow-edu p-3 mt-2 w-full max-w-full sm:max-w-md border border-brand-border">
            <div className="flex items-center mb-2">
                <ScanLine className="h-5 w-5 text-brand-primary mr-2.5 flex-shrink-0" />
                <div className="w-full overflow-hidden">
                    <p className="font-bold text-brand-text truncate text-sm">{getTitle()}</p>
                     {(status === 'enriching' || status === 'done') && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    )}
                </div>
            </div>

            {processedItems.length > 0 && (
                 <div className="space-y-1.5 text-sm max-h-40 overflow-y-auto pr-2">
                    {processedItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-brand-background rounded-lg">
                            <div className="flex items-center overflow-hidden">
                                <span className="mr-2 flex-shrink-0">{getStatusIcon(item.status)}</span>
                                <span className="capitalize text-brand-text truncate text-sm">{item.name}</span>
                            </div>
                            {item.status === 'success' && (
                               <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                     <span className={`text-xs font-semibold ${getRiskColor(item.riskLevel)}`}>{item.riskLevel}</span>
                                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${getNovaClassificationStyle(item.novaClassification)} capitalize`}>
                                        {NOVA_CLASSIFICATION[item.novaClassification!]?.label.split(' ')[0]}
                                    </span>
                               </div>
                            )}
                             {item.status === 'error' && (
                                <span className="text-xs font-semibold text-brand-risk-high flex-shrink-0 ml-2">Falha</span>
                            )}
                             {item.status === 'skipped' && (
                                <span className="text-xs font-semibold text-gray-500 flex-shrink-0 ml-2">Não é alimento</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnalysisProgressCard;
