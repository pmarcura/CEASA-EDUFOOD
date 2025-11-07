
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { Leaf, Wheat, Drumstick } from 'lucide-react';

interface FoodGroup {
    name: 'Proteínas' | 'Grãos e Tubérculos' | 'Vegetais e Frutas';
    key: 'proteins' | 'grains' | 'vegetables';
    goal: number;
    color: string;
    icon: React.ElementType;
}

const FOOD_GROUPS: FoodGroup[] = [
    { name: 'Proteínas', key: 'proteins', goal: 2, color: 'bg-blue-500', icon: Drumstick },
    { name: 'Grãos e Tubérculos', key: 'grains', goal: 2, color: 'bg-orange-500', icon: Wheat },
    { name: 'Vegetais e Frutas', key: 'vegetables', goal: 4, color: 'bg-pink-500', icon: Leaf },
];

const ProgressThermometer: React.FC<{ group: FoodGroup; progress: number }> = ({ group, progress }) => {
    const percentage = Math.min((progress / group.goal) * 100, 100);
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5">
                    <group.icon size={14} className="text-brand-text-secondary" />
                    <span className="text-sm font-semibold text-brand-text">{group.name}</span>
                </div>
                <span className="text-xs font-bold text-brand-text-secondary">{progress} / {group.goal} porções</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-500 ${group.color}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};


const BalancedPlateChart: React.FC = () => {
    const context = useContext(AppContext);

    const dailyProgress = useMemo(() => {
        const progress = { proteins: 0, grains: 0, vegetables: 0 };
        if (!context || !context.mealLog) return progress;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfToday = today.getTime();

        context.mealLog
            .filter(log => log.timestamp >= startOfToday)
            .forEach(log => {
                if (log.foodGroupPortions) {
                    progress.proteins += log.foodGroupPortions.proteins;
                    progress.grains += log.foodGroupPortions.grains;
                    progress.vegetables += log.foodGroupPortions.vegetables;
                }
            });

        return progress;
    }, [context]);


    return (
        <div className="bg-brand-surface rounded-2xl p-5 shadow-edu">
            <h3 className="text-lg font-bold text-brand-text mb-1">Prato Equilibrado do Dia</h3>
            <p className="text-sm text-brand-text-secondary mb-4">Acompanhe as porções consumidas hoje com base nas suas refeições registradas.</p>
            <div className="space-y-4">
                {FOOD_GROUPS.map(group => (
                    <ProgressThermometer 
                        key={group.key} 
                        group={group} 
                        progress={dailyProgress[group.key]}
                    />
                ))}
            </div>
        </div>
    );
};

export default BalancedPlateChart;
