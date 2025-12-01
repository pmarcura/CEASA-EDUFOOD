
import React, { useContext } from 'react';
import NovaDonutChart from './charts/NovaDonutChart';
import ImpactSwaps from './charts/ImpactSwaps';
import FamilyPlateChart from './charts/FamilyPlateChart';
import HabitTrendChart from './charts/HabitTrendChart';
import { Sparkles, ChefHat } from 'lucide-react';
import { AppContext } from '../../contexts/AppContext';
import type { Tab } from '../../types';

interface HomeScreenProps {
  setActiveTab: (tab: Tab) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ setActiveTab }) => {
    const context = useContext(AppContext);

    return (
        <div className="space-y-6 animate-fade-in pb-8">
            {/* Hero Action: Cook Now */}
            <button 
                onClick={() => context?.setIsCookNowOpen(true)}
                className="w-full relative overflow-hidden bg-gradient-to-br from-brand-primary to-teal-600 rounded-3xl p-6 text-left shadow-lg shadow-brand-primary/30 group transition-transform active:scale-95"
            >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="text-yellow-300 fill-yellow-300 animate-pulse" size={18} />
                            <span className="text-xs font-bold text-white/90 uppercase tracking-wider">Chef Mágico IA</span>
                        </div>
                        <h2 className="text-2xl font-display font-bold text-white leading-tight mb-1">
                            Cozinhar Agora
                        </h2>
                        <p className="text-white/80 text-sm font-medium">
                            Receita rápida com o que você tem!
                        </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                        <ChefHat className="text-white h-8 w-8" strokeWidth={1.5} />
                    </div>
                </div>
            </button>

            {/* Section 1: Behavioral (Actionable) */}
            <section>
                <FamilyPlateChart />
                <HabitTrendChart />
            </section>

            {/* Section 2: Inventory & Swaps */}
            <section>
                <div className="flex items-center justify-between mb-4 px-1 mt-8">
                    <h3 className="text-lg font-bold text-brand-text">Gestão da Despensa</h3>
                </div>
                <div className="space-y-6">
                    <NovaDonutChart />
                    <ImpactSwaps />
                </div>
            </section>
        </div>
    );
};

export default HomeScreen;
