

import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Carrot, Sandwich, Cookie, Package, Percent } from 'lucide-react';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';

const getArcPath = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number, thickness: number) => {
    const start = {
        x: cx + (radius - thickness / 2) * Math.cos(startAngle),
        y: cy + (radius - thickness / 2) * Math.sin(startAngle)
    };
    const end = {
        x: cx + (radius - thickness / 2) * Math.cos(endAngle),
        y: cy + (radius - thickness / 2) * Math.sin(endAngle)
    };
    const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius - thickness / 2} ${radius - thickness / 2} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

const PieChart: React.FC<{ data: { name: string; percentage: number; color: string }[] }> = ({ data }) => {
    let accumulatedAngle = -Math.PI / 2;
    return (
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {data.map(segment => {
                if (segment.percentage === 0) return null;
                const angle = (segment.percentage / 100) * 2 * Math.PI;
                const path = getArcPath(50, 50, 50, accumulatedAngle, accumulatedAngle + angle, 20);
                accumulatedAngle += angle;
                return (
                    <path
                        key={segment.name}
                        d={path}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="20"
                        className="transition-all duration-300"
                    />
                );
            })}
        </svg>
    );
};

const ProductHistory: React.FC = () => {
    const context = useContext(AppContext);
    const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('all');
    
    const timeFilterOptions: { id: typeof timeFilter, label: string }[] = [
        { id: '7d', label: '7 Dias' },
        { id: '30d', label: '30 Dias' },
        { id: 'all', label: 'Tudo' },
    ];

    const filteredItems = useMemo(() => {
        if (!context) return [];
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        return context.pantry.filter(item => {
            if (timeFilter === 'all') return true;
            if (!item.addedAt) return false;
            if (timeFilter === '7d') return item.addedAt >= sevenDaysAgo;
            if (timeFilter === '30d') return item.addedAt >= thirtyDaysAgo;
            return false;
        });
    }, [context, timeFilter]);

    const analysisData = useMemo(() => {
        const counts = { in_natura: 0, processed: 0, ultra_processed: 0 };
        filteredItems.forEach(item => {
            if (item.novaClassification === 'in_natura' || item.novaClassification === 'culinary_ingredients') {
                counts.in_natura++;
            } else if (item.novaClassification === 'processed') {
                counts.processed++;
            } else if (item.novaClassification === 'ultra_processed') {
                counts.ultra_processed++;
            }
        });
        
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        if (total === 0) return null;

        const pieChartData = [
            { name: 'In Natura', percentage: (counts.in_natura / total) * 100, color: NOVA_CLASSIFICATION.in_natura.chartColor, count: counts.in_natura, icon: Carrot },
            { name: 'Processado', percentage: (counts.processed / total) * 100, color: NOVA_CLASSIFICATION.processed.chartColor, count: counts.processed, icon: Sandwich },
            { name: 'Ultraprocessado', percentage: (counts.ultra_processed / total) * 100, color: NOVA_CLASSIFICATION.ultra_processed.chartColor, count: counts.ultra_processed, icon: Cookie },
        ];

        return { total, pieChartData };
    }, [filteredItems]);

    if (!context) return null;

    return (
        <div className="bg-brand-surface p-4 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-brand-text mb-3">Análise da Despensa</h3>
            
            <div className="flex gap-1 mb-4 bg-brand-background p-1 rounded-full border border-brand-border">
                {timeFilterOptions.map(option => (
                    <button
                        key={option.id}
                        onClick={() => setTimeFilter(option.id)}
                        className={`w-full text-xs font-semibold py-2 px-3 rounded-full transition-colors ${timeFilter === option.id ? 'bg-brand-primary text-white shadow' : 'text-brand-text-secondary hover:bg-gray-200'}`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {analysisData ? (
                <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="relative w-full aspect-square">
                        <PieChart data={analysisData.pieChartData} />
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-3xl font-extrabold text-brand-text">{analysisData.total}</span>
                            <span className="text-xs font-semibold text-brand-text-secondary leading-tight">Itens</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {analysisData.pieChartData.map(d => (
                            <div key={d.name} className="flex items-start gap-2">
                                <d.icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: d.color }} />
                                <div>
                                    <p className="font-bold text-sm text-brand-text">{d.name}</p>
                                    <p className="text-xs text-brand-text-secondary">{d.count} itens ({Math.round(d.percentage)}%)</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <Package size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-brand-text-secondary">
                        Nenhum item adicionado neste período.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProductHistory;
