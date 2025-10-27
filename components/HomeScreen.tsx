
import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ArrowRight, BotMessageSquare, Book } from 'lucide-react';
import type { Tab } from '../types';

interface HomeScreenProps {
  setActiveTab: (tab: Tab) => void;
}

const ActionCard: React.FC<{ onClick: () => void; icon: React.ElementType; title: string; }> = ({ onClick, icon: Icon, title }) => (
    <button 
        onClick={onClick} 
        className="bg-brand-surface rounded-xl p-3 w-full flex items-center justify-between text-left transition-transform transform hover:scale-[1.02] shadow-edu hover:shadow-edu-lg"
    >
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary-light rounded-full">
                 <Icon size={20} className="text-brand-primary" />
            </div>
            <h2 className="text-base font-bold text-brand-text leading-tight" dangerouslySetInnerHTML={{ __html: title }} />
        </div>
        <div className="p-1 bg-gray-100 rounded-full">
            <ArrowRight size={14} className="text-brand-text-secondary"/>
        </div>
    </button>
);


const HomeScreen: React.FC<HomeScreenProps> = ({ setActiveTab }) => {
    const context = useContext(AppContext);
    
    if (!context) return null;

    return (
        <div className="space-y-3">
            <ActionCard 
                onClick={() => setActiveTab('chat')} 
                icon={BotMessageSquare}
                title="Conversar com<br/>Professor Nutri"
            />
            <ActionCard 
                onClick={() => setActiveTab('pantry')} 
                icon={Book}
                title="Ver Despensa"
            />
        </div>
    );
};

export default HomeScreen;
