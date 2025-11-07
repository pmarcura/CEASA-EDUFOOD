
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';
import type { PantryItem } from '../../types';
import { X, Lightbulb, Carrot, Cookie, Sandwich } from 'lucide-react';
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
      color: key === 'In Natura' ? NOVA_CLASSIFICATION.in_natura.chartColor : key === 'Processado' ? NOVA_CLASSIFICATION.processed.chartColor : NOVA_CLASSIFICATION.ultra_processed.chartColor,
      icon: key === 'In Natura' ? Carrot : key === 'Processado' ? Sandwich : Cookie,
    }));
    
    return { segments, healthyPercentage, total };
  }, [context]);

  const handleSliceClick = (category: ChartCategory) => {
    if (getItemsForCategory(category).length > 0) {
      setModalCategory(category);
    }
  };
  
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
      <div className="bg-brand-surface rounded-2xl p-5 text-center shadow-edu">
        <h3 className="text-lg font-bold text-brand-text">Painel NOVA da Despensa</h3>
        <p className="text-sm text-brand-text-secondary mt-2">Fotografe uma nota fiscal ou adicione uma lista de compras no chat para ver a proporção de alimentos da sua despensa!</p>
      </div>
    );
  }

  const { segments, healthyPercentage } = chartData;
  let accumulatedAngle = -Math.PI / 2;

  return (
    <div className="bg-brand-surface rounded-2xl p-5 shadow-edu">
      <h3 className="text-lg font-bold text-brand-text text-center mb-4">Painel NOVA da Despensa</h3>
      <div className="relative w-48 h-48 mx-auto">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {segments.map(segment => {
            if (segment.percentage === 0) return null;
            const angle = (segment.percentage / 100) * 2 * Math.PI;
            const path = getArcPath(50, 50, 50, accumulatedAngle, accumulatedAngle + angle, 18);
            accumulatedAngle += angle;
            return (
              <path
                key={segment.name}
                d={path}
                fill="none"
                stroke={segment.color}
                strokeWidth="18"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleSliceClick(segment.name)}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold text-brand-text">{healthyPercentage}%</span>
          <span className="text-xs font-semibold text-brand-text-secondary leading-tight max-w-[70px]">Despensa Saudável</span>
        </div>
      </div>
      <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4 text-xs">
        {segments.map(s => (
          <div key={s.name} className="flex items-center gap-1.5">
            <s.icon className="w-4 h-4" style={{ color: s.color }} />
            <span className="font-semibold">{s.name}</span>
            <span className="text-brand-text-secondary">({s.count})</span>
          </div>
        ))}
      </div>
      
      {modalCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setModalCategory(null)}>
            <div className="bg-brand-surface rounded-2xl shadow-lg w-full max-w-sm p-5 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-brand-border">
                    <h4 className="text-lg font-bold">Itens - {modalCategory}</h4>
                    <button onClick={() => setModalCategory(null)} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {getItemsForCategory(modalCategory).map(item => (
                        <div key={item.id} className="bg-gray-50 p-3 rounded-xl">
                            <div className="flex items-center gap-3">
                                <DynamicIcon name={item.icon} className="w-6 h-6 flex-shrink-0" style={{ color: item.color }}/>
                                <p className="font-bold capitalize text-sm flex-1">{item.name}</p>
                            </div>
                            <div className="text-xs text-brand-text-secondary mt-2 flex items-start gap-2 bg-white p-2 rounded-lg border border-gray-200">
                               <Lightbulb size={20} className="text-brand-primary flex-shrink-0 mt-0.5"/>
                               <div>
                                   <strong className="text-brand-text">Por quê?</strong> {NOVA_CLASSIFICATION[item.novaClassification].description}
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
