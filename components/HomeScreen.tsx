
import React from 'react';
import NovaDonutChart from './charts/NovaDonutChart';
import ImpactSwaps from './charts/ImpactSwaps';
import BalancedPlateChart from './charts/BalancedPlateChart';
import type { Tab } from '../../types';

interface HomeScreenProps {
  setActiveTab: (tab: Tab) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ setActiveTab }) => {
    return (
        <div className="space-y-6">
            <NovaDonutChart />
            <BalancedPlateChart />
            <ImpactSwaps />
        </div>
    );
};

export default HomeScreen;
