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

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-24 bg-transparent z-20">
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-brand-surface/80 backdrop-blur-lg border-t border-brand-border">
         <div className="max-w-md mx-auto flex h-full justify-around items-center">
            {mainItems.slice(0, 2).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center w-20 h-full transition-colors duration-200 ${isActive ? 'text-brand-primary' : 'text-brand-text-secondary hover:text-brand-primary'}`}
                  aria-label={item.label}
                >
                  <item.icon className="h-6 w-6" />
                  <span className={`text-xs mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                </button>
              );
            })}

            <div className="w-24"></div> 
            
            {mainItems.slice(2).map((item) => {
               const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                   className={`flex flex-col items-center justify-center w-20 h-full transition-colors duration-200 ${isActive ? 'text-brand-primary' : 'text-brand-text-secondary hover:text-brand-primary'}`}
                  aria-label={item.label}
                >
                   <item.icon className="h-6 w-6" />
                   <span className={`text-xs mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                </button>
              );
            })}
        </div>
      </div>
      
      {chatItem && (
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3">
             <button
              onClick={() => setActiveTab(chatItem.id)}
              className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform"
              aria-label={chatItem.label}
            >
              <chatItem.icon className="h-9 w-9" />
            </button>
          </div>
      )}
    </nav>
  );
};

export default BottomNav;