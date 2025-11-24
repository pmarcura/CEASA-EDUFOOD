
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';

const StreakCard: React.FC = () => {
    const context = useContext(AppContext);
    
    // Ensure we use defaults if profile is still loading or incomplete
    const streak = context?.userProfile?.streak || 0;

    // Gamification Logic: Calculate next milestone dynamically
    const nextMilestone = useMemo(() => {
        if (streak < 7) return 7;
        if (streak < 14) return 14;
        if (streak < 30) return 30;
        return Math.ceil((streak + 1) / 30) * 30;
    }, [streak]);

    const progress = nextMilestone > 0 ? (streak / nextMilestone) * 100 : 0;

    return (
        <div className="relative bg-white rounded-3xl p-5 shadow-edu border border-gray-100 overflow-hidden flex items-center justify-between group">
            {/* Background Progress Bar (Subtle) */}
            <div 
                className="absolute bottom-0 left-0 h-1.5 bg-orange-500 transition-all duration-1000 ease-out opacity-20"
                style={{ width: `${progress}%` }}
            />
            
            <div className="flex items-center gap-4 relative z-10">
                <div className="text-4xl filter drop-shadow-md animate-pulse-fire transform group-hover:scale-110 transition-transform duration-300">
                    🔥
                </div>
                <div className="flex flex-col">
                    <span className="text-2xl font-display font-extrabold text-brand-text leading-none">
                        {streak} {streak === 1 ? 'Dia' : 'Dias'}
                    </span>
                    <span className="text-xs font-medium text-brand-text-secondary uppercase tracking-wide mt-0.5">
                        Sequência
                    </span>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-end">
                <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
                    Meta: {nextMilestone} dias
                </div>
            </div>
        </div>
    );
};

export default StreakCard;
