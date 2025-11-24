
import React from 'react';
import NovaDonutChart from './charts/NovaDonutChart';
import ImpactSwaps from './charts/ImpactSwaps';
import FamilyPlateChart from './charts/FamilyPlateChart';
import HabitTrendChart from './charts/HabitTrendChart';
import type { Tab } from '../../types';

interface HomeScreenProps {
  setActiveTab: (tab: Tab) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ setActiveTab }) => {
    return (
        <div className="space-y-6 animate-fade-in pb-8">
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
