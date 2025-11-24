
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ChevronRight } from 'lucide-react';

const WeeklyPlannerCard: React.FC = () => {
    const context = useContext(AppContext);

    const plannedMealsCount = useMemo(() => {
        if (!context || !context.mealLog) return 0;
        const now = Date.now();
        const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);
        // Count meals scheduled in the next 3 days
        return context.mealLog.filter(log => log.timestamp > now && log.timestamp < threeDaysFromNow).length;
    }, [context?.mealLog]);

    const isPlanActive = plannedMealsCount >= 3;

    const handleOpenPlanner = () => {
        context?.setIsMealPlannerOpen(true);
    };

    // State 1: Plan Active (Clean, White, minimal)
    if (isPlanActive) {
        return (
            <div 
                onClick={handleOpenPlanner}
                className="bg-white border border-gray-100 p-5 rounded-3xl shadow-edu flex items-center justify-between cursor-pointer group hover:border-green-200 transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="text-4xl filter drop-shadow-sm group-hover:rotate-12 transition-transform duration-300">
                        🍱
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-brand-text text-lg leading-none">Cardápio</h3>
                        <p className="text-xs font-medium text-green-600 mt-1 bg-green-50 px-2 py-0.5 rounded-md inline-block">
                            {plannedMealsCount} refeições prontas
                        </p>
                    </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-full text-gray-300 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-colors">
                     <ChevronRight size={20} />
                </div>
            </div>
        );
    }

    // State 2: Plan Needed (Call to Action, Vibrant but Clean)
    return (
        <div 
            onClick={handleOpenPlanner}
            className="relative bg-brand-primary p-5 rounded-3xl shadow-lg shadow-brand-primary/20 cursor-pointer group overflow-hidden"
        >
            {/* Decorative circle */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                     <div className="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">
                        👨‍🍳
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-white text-lg leading-tight">
                            Planejar Semana
                        </h3>
                        <p className="text-white/80 text-xs font-medium mt-0.5">
                            IA pronta para ajudar
                        </p>
                    </div>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm group-hover:bg-white group-hover:text-brand-primary transition-all">
                    <ChevronRight size={18} />
                </div>
            </div>
        </div>
    );
};

export default WeeklyPlannerCard;
