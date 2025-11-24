
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ChevronRight } from 'lucide-react';

const PantryReviewCard: React.FC = () => {
    const context = useContext(AppContext);
    
    if (!context || !context.userProfile) return null;

    const { userProfile, setIsPantryReviewOpen } = context;
    const lastReview = userProfile.lastPantryReview || 0;

    const status = useMemo(() => {
        const now = Date.now();
        const diffTime = Math.abs(now - lastReview);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays <= 1) return 'fresh'; 
        if (diffDays <= 7) return 'warning'; 
        return 'stale'; 
    }, [lastReview]);

    const isStale = status === 'stale';
    const isWarning = status === 'warning';
    const isFresh = status === 'fresh';

    return (
        <div 
            onClick={() => setIsPantryReviewOpen(true)}
            className={`
                relative p-5 rounded-3xl shadow-edu cursor-pointer transition-all flex items-center justify-between group border
                ${isStale ? 'bg-white border-red-100' : 'bg-white border-gray-100'}
            `}
        >
            <div className="flex items-center gap-4">
                <div className="text-4xl filter drop-shadow-sm group-hover:-rotate-12 transition-transform duration-300">
                    {isStale ? '🧐' : '🥑'}
                </div>
                
                <div>
                    <h3 className="font-display font-bold text-brand-text text-lg leading-none">
                        Despensa
                    </h3>
                    <div className="mt-1.5 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isFresh ? 'bg-green-500' : isWarning ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                        <span className={`text-xs font-bold ${isFresh ? 'text-green-600' : isWarning ? 'text-yellow-600' : 'text-red-600'}`}>
                            {isFresh ? 'Atualizada' : isWarning ? 'Verificar' : 'Revisão Necessária'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-50 p-2 rounded-full text-gray-300 group-hover:text-brand-text group-hover:bg-gray-100 transition-colors">
                <ChevronRight size={20} />
            </div>
        </div>
    );
};

export default PantryReviewCard;
