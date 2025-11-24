
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';
import type { PantryItem } from '../../types';
import { X, Lightbulb, ArrowRight } from 'lucide-react';
import DynamicIcon from '../DynamicIcon';

// Helper function to calculate SVG path for a donut slice
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

type ChartCategory = 'In Natura' | 'Processado' | 'Ultraprocessado';

const NovaDonutChart: React.FC = () => {
  const context = useContext(AppContext);
  const [modalCategory, setModalCategory] = useState<ChartCategory | null>(null);

  const chartData = useMemo(() => {
    if (!context || context.pantry.length === 0) return null;
    const { pantry } = context;

    const counts = {
      'In Natura': pantry.filter(i => i.novaClassification === 'in_natura' || i.novaClassification === 'culinary_ingredients').length,
      'Processado': pantry.filter(i => i.novaClassification === 'processed').length,
      'Ultraprocessado': pantry.filter(i => i.novaClassification === 'ultra_processed').length,
    };
    
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    if (total === 0) return null;

    const healthyPercentage = Math.round((counts['In Natura'] / total) * 100);

    const segments = (Object.keys(counts) as ChartCategory[]).map(key => ({
      name: key,
      count: counts[key],
      percentage: (counts[key] / total) * 100,
      color: key === 'In Natura' ? '#10B981' : key === 'Processado' ? '#F59E0B' : '#EF4444', // Using simplified strong colors
      // Brighter background colors for the legend
      bgColor: key === 'In Natura' ? 'bg-green-100' : key === 'Processado' ? 'bg-yellow-100' : 'bg-red-100',
      textColor: key === 'In Natura' ? 'text-green-800' : key === 'Processado' ? 'text-yellow-800' : 'text-red-800',
    }));
    
    return { segments, healthyPercentage, total };
  }, [context]);

  const getItemsForCategory = (category: ChartCategory): PantryItem[] => {
    if (!context) return [];
    switch(category) {
        case 'In Natura':
            return context.pantry.filter(i => i.novaClassification === 'in_natura' || i.novaClassification === 'culinary_ingredients');
        case 'Processado':
            return context.pantry.filter(i => i.novaClassification === 'processed');
        case 'Ultraprocessado':
            return context.pantry.filter(i => i.novaClassification === 'ultra_processed');
        default:
            return [];
    }
  };

  if (!context) return null;

  if (!chartData || context.pantry.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 text-center shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-brand-text">Sua Despensa</h3>
        <p className="text-sm text-brand-text-secondary mt-2">Adicione itens para ver a análise nutricional.</p>
      </div>
    );
  }

  const { segments, healthyPercentage } = chartData;
  let accumulatedAngle = -Math.PI / 2;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-edu border border-white/50">
      <div className="flex items-center justify-between">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {/* Background Circle */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="#F3F4F6" strokeWidth="12" />
              
              {segments.map(segment => {
                if (segment.percentage === 0) return null;
                const angle = (segment.percentage / 100) * 2 * Math.PI;
                // Using a slightly thinner stroke for elegance
                const path = getArcPath(50, 50, 50, accumulatedAngle, accumulatedAngle + angle, 12);
                accumulatedAngle += angle;
                return (
                  <path
                    key={segment.name}
                    d={path}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="cursor-pointer transition-opacity duration-300 hover:opacity-80"
                    onClick={() => setModalCategory(segment.name as ChartCategory)}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-brand-text tracking-tighter">{healthyPercentage}%</span>
              <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wide">Saudável</span>
            </div>
          </div>

          <div className="flex-1 pl-6 space-y-3">
            {segments.map(s => (
              <button 
                key={s.name} 
                onClick={() => setModalCategory(s.name as ChartCategory)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                   <div className={`w-3 h-3 rounded-full ${s.bgColor}`} style={{ backgroundColor: s.color }}></div>
                   <span className="text-sm font-medium text-brand-text">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-brand-text-secondary">{s.count}</span>
                    <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"/>
                </div>
              </button>
            ))}
          </div>
      </div>

      {modalCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setModalCategory(null)}>
            <div className="bg-brand-surface rounded-3xl shadow-xl w-full max-w-sm p-6 max-h-[80vh] flex flex-col animate-pop" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                    <h4 className="text-lg font-bold text-brand-text">Itens: {modalCategory}</h4>
                    <button onClick={() => setModalCategory(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={18}/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {getItemsForCategory(modalCategory).map(item => (
                        <div key={item.id} className="bg-brand-background p-3 rounded-2xl border border-gray-100 flex items-start gap-3">
                            <div className="bg-white p-2 rounded-xl shadow-sm">
                                <DynamicIcon name={item.icon} className="w-5 h-5" style={{ color: item.color }}/>
                            </div>
                            <div>
                                <p className="font-bold capitalize text-sm text-brand-text">{item.name}</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Lightbulb size={12} className="text-brand-primary"/>
                                    <p className="text-xs text-brand-text-secondary leading-tight">
                                        {NOVA_CLASSIFICATION[item.novaClassification].description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default NovaDonutChart;
