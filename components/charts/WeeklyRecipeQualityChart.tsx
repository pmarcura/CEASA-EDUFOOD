import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';
import { TrendingUp, TrendingDown, Info, BarChart2 } from 'lucide-react';

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
    <span className="text-xs font-medium text-brand-text-secondary">{label}</span>
  </div>
);

const WeeklyRecipeQualityChart: React.FC = () => {
    const context = useContext(AppContext);

    const weeklyData = useMemo(() => {
        if (!context || !context.mealLog) {
            return { totalMeals: 0, percentages: null, healthyIndex: 0, insight: null };
        }

        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentMeals = context.mealLog.filter(log => log.timestamp >= oneWeekAgo);

        if (recentMeals.length === 0) {
            return { totalMeals: 0, percentages: null, healthyIndex: 0, insight: null };
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
            return { totalMeals: recentMeals.length, percentages: null, healthyIndex: 0, insight: null };
        }
        
        const realFoodCount = totals.in_natura + totals.culinary_ingredients;

        const percentages = {
            inNatura: (realFoodCount / totalIngredients) * 100,
            processed: (totals.processed / totalIngredients) * 100,
            ultraProcessed: (totals.ultra_processed / totalIngredients) * 100,
        };

        const healthyIndex = Math.round(percentages.inNatura);
        
        let insight = null;
        if (healthyIndex >= 75) {
            insight = { text: "Excelente! A maioria das suas refeições é baseada em comida de verdade.", icon: TrendingUp, color: "text-brand-primary" };
        } else if (percentages.ultraProcessed > 25) {
            insight = { text: "Vamos tentar reduzir os ultraprocessados na próxima semana. Que tal trocas inteligentes?", icon: TrendingDown, color: "text-brand-risk-high" };
        } else {
             insight = { text: "Bom equilíbrio! Continue priorizando ingredientes frescos e naturais.", icon: TrendingUp, color: "text-brand-primary" };
        }

        return { totalMeals: recentMeals.length, percentages, healthyIndex, insight };
    }, [context?.mealLog]);

    if (!weeklyData || weeklyData.totalMeals === 0) {
        return (
            <div className="bg-brand-surface rounded-2xl p-5 shadow-edu">
                <h3 className="text-lg font-bold text-brand-text mb-1">Qualidade das Refeições da Semana</h3>
                <div className="text-center text-brand-text-secondary py-6">
                     <BarChart2 size={32} className="mx-auto mb-3 text-gray-300"/>
                    <p className="text-sm font-semibold text-brand-text">Nenhuma refeição registrada</p>
                    <p className="text-xs mt-1">Cozinhe uma receita para começar a análise!</p>
                </div>
            </div>
        );
    }
    
    const { totalMeals, percentages, healthyIndex, insight } = weeklyData;

    return (
        <div className="bg-brand-surface rounded-2xl p-5 shadow-edu">
            <h3 className="text-lg font-bold text-brand-text mb-1">Qualidade das Refeições da Semana</h3>
            <p className="text-sm text-brand-text-secondary mb-4">Análise de {totalMeals} refeições registradas nos últimos 7 dias.</p>
            
            <div className="text-center mb-4">
                <p className="text-xs font-bold text-brand-text-secondary leading-tight">Índice de Comida de Verdade</p>
                <p className="text-5xl font-extrabold text-brand-primary mt-1">{healthyIndex}<span className="text-3xl">%</span></p>
            </div>
            
            {percentages && (
                <div className="w-full flex h-5 rounded-full overflow-hidden mb-2">
                    <div style={{ width: `${percentages.inNatura}%`, backgroundColor: NOVA_CLASSIFICATION.in_natura.chartColor }} />
                    <div style={{ width: `${percentages.processed}%`, backgroundColor: NOVA_CLASSIFICATION.processed.chartColor }} />
                    <div style={{ width: `${percentages.ultraProcessed}%`, backgroundColor: NOVA_CLASSIFICATION.ultra_processed.chartColor }} />
                </div>
            )}
            <div className="flex justify-between gap-2 mb-4">
                <LegendItem color={NOVA_CLASSIFICATION.in_natura.chartColor} label="In Natura" />
                <LegendItem color={NOVA_CLASSIFICATION.processed.chartColor} label="Processados" />
                <LegendItem color={NOVA_CLASSIFICATION.ultra_processed.chartColor} label="Ultraprocessados" />
            </div>

            {insight && (
                <div className="bg-gray-50 p-2.5 rounded-lg flex items-center gap-2 border border-gray-200">
                    <insight.icon size={20} className={`flex-shrink-0 ${insight.color}`} />
                    <p className="text-xs font-semibold text-brand-text-secondary">{insight.text}</p>
                </div>
            )}
        </div>
    );
};

export default WeeklyRecipeQualityChart;
