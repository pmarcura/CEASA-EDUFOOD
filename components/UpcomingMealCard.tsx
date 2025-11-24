

import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Clock, Users, ArrowRight } from 'lucide-react';

// Helper to get meal category and formatted time
const getMealCategoryAndTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${hour}:${minutes}`;

    let name = 'Jantar';
    if (hour < 11) name = 'Café da Manhã';
    else if (hour < 15) name = 'Almoço';
    else if (hour < 18) name = 'Lanche';
    
    return { name, time: timeString };
};

const UpcomingMealCard: React.FC = () => {
    const context = useContext(AppContext);

    if (!context || !context.upcomingMeal || !context.upcomingMeal.recipe) {
        return null;
    }

    const { upcomingMeal, setViewingRecipe } = context;
    const { name, time } = getMealCategoryAndTime(upcomingMeal.timestamp);

    const handleViewRecipe = () => {
        if (upcomingMeal.recipe) {
            setViewingRecipe(upcomingMeal.recipe);
        }
    };

    return (
        <div 
            onClick={handleViewRecipe}
            className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:shadow-md hover:border-brand-primary/50 animate-fade-in"
        >
            <div className="text-4xl flex-shrink-0">
               🍽️
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-brand-primary">
                    PRÓXIMA REFEIÇÃO: {name} (às {time})
                </p>
                <h3 className="font-bold text-brand-text truncate">{upcomingMeal.recipe.title}</h3>
                <div className="flex items-center gap-3 text-xs text-brand-text-secondary mt-1">
                    {upcomingMeal.recipe.total_time_min && (
                        <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{upcomingMeal.recipe.total_time_min} min</span>
                        </div>
                    )}
                    {upcomingMeal.recipe.serves && (
                        <div className="flex items-center gap-1">
                            <Users size={12} />
                            <span>{upcomingMeal.recipe.serves}</span>
                        </div>
                    )}
                </div>
            </div>
            <ArrowRight className="h-5 w-5 text-brand-text-secondary flex-shrink-0" />
        </div>
    );
};

export default UpcomingMealCard;
