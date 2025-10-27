
import React, { useState, useMemo } from 'react';
import { Camera, Book, BotMessageSquare, Compass, Ticket, LoaderCircle } from 'lucide-react';

import type { Tab, Recipe } from './types';
import { AppContext } from './contexts/AppContext';

// Custom Hooks for logic separation
import { useAuth } from './hooks/useAuth';
import { usePantry } from './hooks/usePantry';
import { useRecipes } from './hooks/useRecipes';
import { useFeed } from './hooks/useFeed';
import { useChat } from './hooks/useChat';

// Component Imports from new structure
import AuthScreen from './components/AuthScreen';
// Fix: Corrected import path for OnboardingFlow which exists in components/ not components/onboarding/
import OnboardingFlow from './components/OnboardingFlow';
import ProfileScreen from './components/profile/ProfileScreen';
import RecipeDetailView from './components/recipe/RecipeDetailView';
import CookingModeView from './components/recipe/CookingModeView';
import PantryDisplay from './components/pantry/PantryDisplay';
import ExploreScreen from './components/explore/ExploreScreen';
import OffersScreen from './components/offers/OffersScreen';
import CreativeFeed from './components/feed/CreativeFeed';
import ProfessorNutriChat from './components/chat/ProfessorNutriChat';
import BottomNav from './components/common/BottomNav';

const App: React.FC = () => {
  const { user, userProfile, isLoading: isAuthLoading, updateUserProfile, logout } = useAuth();
  const pantryData = usePantry(user?.uid);
  const recipesData = useRecipes(user?.uid, pantryData.pantry, userProfile);
  const feedData = useFeed(user, userProfile);
  const chatData = useChat();

  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Local UI states for navigation
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);

  const contextValue = useMemo(() => ({
    user,
    userProfile,
    updateUserProfile,
    logout,
    ...pantryData,
    ...recipesData,
    ...feedData,
    ...chatData,
    viewingRecipe,
    setViewingRecipe,
    isCookingMode,
    setIsCookingMode,
    cookingRecipe,
    setCookingRecipe,
  }), [
    user, userProfile, updateUserProfile, logout,
    pantryData, recipesData, feedData, chatData,
    viewingRecipe, isCookingMode, cookingRecipe
  ]);
  
  const renderContent = () => {
    switch (activeTab) {
      case 'pantry': return <PantryDisplay />;
      case 'explore': return <ExploreScreen />;
      case 'offers': return <OffersScreen />;
      case 'feed': return <CreativeFeed />;
      case 'chat': default: return <ProfessorNutriChat />;
    }
  };

  const navItems = [
    { id: 'feed' as Tab, label: 'Feed', icon: Camera },
    { id: 'pantry' as Tab, label: 'Despensa', icon: Book },
    { id: 'chat' as Tab, label: 'Chat', icon: BotMessageSquare },
    { id: 'explore' as Tab, label: 'Explorar', icon: Compass },
    { id: 'offers' as Tab, label: 'Ofertas', icon: Ticket },
  ];
  
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }
  
  if (!userProfile?.onboardingCompleted) {
    return <OnboardingFlow user={user} />;
  }

  const showMainUI = !viewingRecipe && !isCookingMode;

  return (
    <AppContext.Provider value={contextValue}>
      {isProfileOpen && <ProfileScreen onClose={() => setIsProfileOpen(false)} />}
      <div className="min-h-screen bg-brand-background font-sans text-brand-text flex flex-col">
        {viewingRecipe && !isCookingMode && <RecipeDetailView />}
        {cookingRecipe && isCookingMode && <CookingModeView />}
        
        <div className={showMainUI ? 'flex flex-col flex-1 w-full max-w-7xl mx-auto' : 'hidden'}>
          {activeTab !== 'chat' && (
              <header className="flex items-start justify-between p-4">
                  <div>
                      <div className="flex items-center gap-2">
                         <h1 className="text-2xl font-bold text-brand-text">
                           Olá, {user.displayName?.split(' ')[0] || 'Família'}!
                         </h1>
                      </div>
                      <p className="text-sm text-brand-text-secondary">Como posso ajudar hoje?</p>
                  </div>
                  <img 
                      src={user.photoURL || "/professor-nutri.png"}
                      alt="User Avatar" 
                      onClick={() => setIsProfileOpen(true)}
                      className="h-12 w-12 rounded-full object-cover border-2 border-brand-surface shadow-md cursor-pointer transition-transform hover:scale-105"
                  />
              </header>
          )}
          
          <main className={`flex-1 overflow-y-auto ${activeTab !== 'chat' ? 'p-4' : ''} pb-16`}>
            {renderContent()}
          </main>
          
          <BottomNav items={navItems} activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </AppContext.Provider>
  );
};

export default App;