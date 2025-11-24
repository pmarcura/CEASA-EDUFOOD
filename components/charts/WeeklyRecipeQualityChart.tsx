
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

const WeeklyRecipeQualityChart: React.FC = () => {
    const context = useContext(AppContext);

    const weeklyData = useMemo(() => {
        if (!context || !context.mealLog) {
            return { totalMeals: 0, healthyIndex: 0, insight: null };
        }

        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentMeals = context.mealLog.filter(log => log.timestamp >= oneWeekAgo);

        if (recentMeals.length === 0) {
            return { totalMeals: 0, healthyIndex: 0, insight: null };
        }

        const totals = { in_natura: 0, culinary_ingredients: 0, processed: 0, ultra_processed: 0 };
        recentMeals.forEach(meal => {
            if (meal.novaBreakdown) {
                totals.in_natura += meal.novaBreakdown.in_natura;
                totals.culinary_ingredients += meal.novaBreakdown.culinary_ingredients;
                totals.processed += meal.novaBreakdown.processed;
                totals.ultra_processed += meal.novaBreakdown.ultra_processed;
            }
        });

        const totalIngredients = Object.values(totals).reduce((sum, count) => sum + count, 0);
        if (totalIngredients === 0) {
            return { totalMeals: recentMeals.length, healthyIndex: 0, insight: null };
        }
        
        const realFoodCount = totals.in_natura + totals.culinary_ingredients;
        const healthyIndex = Math.round((realFoodCount / totalIngredients) * 100);
        
        let insight = null;
        if (healthyIndex >= 75) {
            insight = { text: "Excelente! Maioria comida de verdade.", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" };
        } else if ((totals.ultra_processed / totalIngredients) > 0.25) {
            insight = { text: "Cuidado com os ultraprocessados.", icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" };
        } else {
             insight = { text: "Bom equilíbrio. Continue assim.", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" };
        }

        return { totalMeals: recentMeals.length, healthyIndex, insight };
    }, [context?.mealLog]);

    if (!weeklyData || weeklyData.totalMeals === 0) {
        return (
            <div className="bg-white rounded-3xl p-6 shadow-edu border border-white/50 flex items-center justify-center gap-4">
                <div className="p-3 bg-gray-50 rounded-full">
                    <BarChart2 size={24} className="text-gray-300"/>
                </div>
                <div className="text-left">
                    <p className="text-sm font-bold text-brand-text">Sem dados suficientes</p>
                    <p className="text-xs text-brand-text-secondary">Registre refeições para ver sua nota.</p>
                </div>
            </div>
        );
    }
    
    const { totalMeals, healthyIndex, insight } = weeklyData;

    return (
        <div className="bg-white rounded-3xl p-6 shadow-edu border border-white/50 flex items-stretch justify-between gap-4">
            {/* Left: Score */}
            <div className="flex flex-col justify-between">
                 <div>
                    <p className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Índice Saudável</p>
                    <p className="text-4xl font-black text-brand-text mt-1">{healthyIndex}%</p>
                 </div>
                 <p className="text-xs font-medium text-brand-text-secondary bg-gray-50 px-2 py-1 rounded-lg self-start mt-2">
                    {totalMeals} refeições
                 </p>
            </div>

            {/* Right: Insight */}
            <div className="flex-1 flex flex-col justify-center items-end text-right">
                {insight && (
                    <div className={`p-3 rounded-2xl ${insight.bg} max-w-[160px]`}>
                        <div className="flex items-center justify-end gap-1.5 mb-1">
                            <span className={`text-xs font-bold ${insight.color}`}>Tendência</span>
                            <insight.icon size={14} className={insight.color} />
                        </div>
                        <p className={`text-xs font-medium leading-tight ${insight.color}`}>{insight.text}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeeklyRecipeQualityChart;
