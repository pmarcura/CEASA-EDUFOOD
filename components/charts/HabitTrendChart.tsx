
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { TrendingUp } from 'lucide-react';

const HabitTrendChart: React.FC = () => {
    const context = useContext(AppContext);

    const chartData = useMemo(() => {
        if (!context || !context.mealLog) return [];

        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Generate last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push({
                date: date,
                label: i === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
                timestamp: date.getTime(),
                healthyCount: 0,
                processedCount: 0,
            });
        }

        // Fill data
        context.mealLog.forEach(log => {
            const logDate = new Date(log.timestamp);
            logDate.setHours(0,0,0,0);
            
            const dayStat = days.find(d => d.timestamp === logDate.getTime());
            if (dayStat && log.novaBreakdown) {
                // Healthy: In Natura + Culinary Ingredients
                dayStat.healthyCount += (log.novaBreakdown.in_natura || 0) + (log.novaBreakdown.culinary_ingredients || 0);
                // Unhealthy: Ultra Processed (Weighted heavily) + Processed
                dayStat.processedCount += (log.novaBreakdown.ultra_processed || 0) + (log.novaBreakdown.processed || 0);
            }
        });

        return days;
    }, [context?.mealLog]);

    const maxVal = Math.max(...chartData.map(d => d.healthyCount + d.processedCount), 1);

    return (
        <div className="bg-white p-5 rounded-3xl shadow-edu border border-gray-100 mt-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-brand-text">Semana Real vs. Processado</h3>
                <div className="flex items-center gap-1 text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded-lg">
                    <TrendingUp size={14} />
                    <span>Evolução</span>
                </div>
            </div>

            <div className="flex justify-between items-end h-32 gap-2">
                {chartData.map((day, index) => {
                    const total = day.healthyCount + day.processedCount;
                    const healthyH = total > 0 ? (day.healthyCount / maxVal) * 100 : 0;
                    const processedH = total > 0 ? (day.processedCount / maxVal) * 100 : 0;
                    const isEmpty = total === 0;

                    return (
                        <div key={index} className="flex flex-col items-center flex-1">
                            <div className="w-full max-w-[24px] flex flex-col-reverse h-full bg-gray-50 rounded-t-lg relative overflow-hidden">
                                {/* Empty State Marker */}
                                {isEmpty && <div className="w-full h-1 bg-gray-200 absolute bottom-0" />}
                                
                                {/* Bars */}
                                {!isEmpty && (
                                    <>
                                        <div 
                                            className="w-full bg-green-400 rounded-t-sm transition-all duration-700" 
                                            style={{ height: `${healthyH}%` }}
                                        />
                                        <div 
                                            className="w-full bg-red-300 rounded-b-sm transition-all duration-700" 
                                            style={{ height: `${processedH}%` }}
                                        />
                                    </>
                                )}
                            </div>
                            <span className={`text-[10px] font-semibold mt-2 ${index === 6 ? 'text-brand-primary' : 'text-brand-text-secondary'} uppercase`}>
                                {day.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex justify-center gap-4 mt-4 text-[10px] font-bold text-brand-text-secondary uppercase">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span>Comida Real</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-300"></div>
                    <span>Processados</span>
                </div>
            </div>
        </div>
    );
};

export default HabitTrendChart;
