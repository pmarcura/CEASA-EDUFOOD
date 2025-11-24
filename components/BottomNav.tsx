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
    <div className="relative">
      {/* Floating Dock Container */}
      <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-float p-1.5 flex justify-between items-center relative z-20 ring-1 ring-black/5">
          {/* Left Items */}
          <div className="flex flex-1 justify-around">
            {mainItems.slice(0, 2).map(item => {
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`relative group flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${isActive ? 'bg-brand-primary/10' : 'hover:bg-gray-100'}`}
                        aria-label={item.label}
                    >
                        <item.icon 
                            className={`h-6 w-6 transition-all duration-300 ${isActive ? 'text-brand-primary scale-110' : 'text-gray-400 group-hover:text-gray-600'}`} 
                            strokeWidth={isActive ? 2.5 : 2}
                        />
                        {isActive && (
                            <span className="absolute -bottom-1 w-1 h-1 bg-brand-primary rounded-full"></span>
                        )}
                    </button>
                )
            })}
          </div>

          {/* Center Spacer for Chat Button */}
          <div className="w-16"></div> 

          {/* Right Items */}
          <div className="flex flex-1 justify-around">
            {mainItems.slice(2).map(item => {
                 const isActive = activeTab === item.id;
                 return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`relative group flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${isActive ? 'bg-brand-primary/10' : 'hover:bg-gray-100'}`}
                        aria-label={item.label}
                    >
                        <item.icon 
                            className={`h-6 w-6 transition-all duration-300 ${isActive ? 'text-brand-primary scale-110' : 'text-gray-400 group-hover:text-gray-600'}`} 
                             strokeWidth={isActive ? 2.5 : 2}
                        />
                         {isActive && (
                            <span className="absolute -bottom-1 w-1 h-1 bg-brand-primary rounded-full"></span>
                        )}
                    </button>
                )
            })}
          </div>
      </div>
      
      {/* Floating Action Button (Chat) */}
      {chatItem && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-30">
             <button
              onClick={() => setActiveTab(chatItem.id)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-glow transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${activeTab === 'chat' ? 'bg-brand-primary ring-4 ring-white' : 'bg-brand-text ring-4 ring-brand-background'}`}
              aria-label={chatItem.label}
            >
              <chatItem.icon className="h-8 w-8" strokeWidth={2} />
            </button>
          </div>
      )}
    </div>
  );
};

export default BottomNav;