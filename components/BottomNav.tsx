
import React from 'react';
import type { Tab } from '../types';

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ElementType;
}

interface BottomNavProps {
  items: NavItem[];
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ items, activeTab, setActiveTab }) => {
  const mainItems = items.filter(item => item.id !== 'chat');
  const chatItem = items.find(item => item.id === 'chat');

  const renderNavButton = (item: NavItem) => {
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`flex flex-col items-center justify-center w-1/4 h-full transition-colors duration-200 ${isActive ? 'text-brand-primary' : 'text-brand-text-secondary hover:text-brand-primary'}`}
        aria-label={item.label}
      >
        <item.icon className="h-5 w-5 mb-0.5" />
        <span className={`text-xs font-semibold ${isActive ? 'text-brand-primary' : 'text-brand-text-secondary'}`}>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[60px] z-20">
      {/* Background with blur */}
      <div className="absolute bottom-0 left-0 right-0 h-full bg-brand-surface/90 backdrop-blur-lg border-t border-brand-border">
         <div className="max-w-md mx-auto flex h-full justify-around items-center">
            {mainItems.slice(0, 2).map(renderNavButton)}
            {/* Placeholder for the central button */}
            <div className="w-14"></div> 
            {mainItems.slice(2).map(renderNavButton)}
        </div>
      </div>
      
      {/* Central Chat Button */}
      {chatItem && (
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4">
             <button
              onClick={() => setActiveTab(chatItem.id)}
              className="w-14 h-14 bg-gradient-to-br from-brand-primary to-emerald-400 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-105 transition-transform ring-4 ring-brand-background"
              aria-label={chatItem.label}
            >
              <chatItem.icon className="h-7 w-7" />
            </button>
          </div>
      )}
    </div>
  );
};

export default BottomNav;