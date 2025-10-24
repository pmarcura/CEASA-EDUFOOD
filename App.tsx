import React, { useState, useCallback, useMemo } from 'react';
import { Book, Award, BotMessageSquare, Home } from 'lucide-react';

import type { PantryItem, Recipe, Tab, ChatMessage, AnalysisState } from './types';
import { AppContext } from './contexts/AppContext';
import PantryDisplay from './components/PantryDisplay';
import HomeScreen from './components/HomeScreen';
import ProgressTracker from './components/ProgressTracker';
import ProfessorNutriChat from './components/ProfessorNutriChat';
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
      { role: 'system', text: 'Olá! Eu sou o Professor Nutri. Vamos juntos cuidar da alimentação da sua família! Que tal começar me enviando sua lista de compras?' }
  ]);

  const addItemsToPantry = useCallback((newItems: PantryItem[]) => {
    setPantry(prevPantry => {
      const existingNames = new Set(prevPantry.map(item => item.name.toLowerCase()));
      const uniqueNewItems = newItems.filter(item => !existingNames.has(item.name.toLowerCase()));
      return [...prevPantry, ...uniqueNewItems];
    });
  }, []);

  const removeItemFromPantry = useCallback((itemId: string) => {
    setPantry(prevPantry => prevPantry.filter(item => item.id !== itemId));
  }, []);

  const saveRecipe = useCallback((recipeToSave: Recipe) => {
    if (!savedRecipes.some(r => r.title === recipeToSave.title)) {
      setSavedRecipes(prev => [...prev, recipeToSave]);
    }
  }, [savedRecipes]);

  const addMessageToChat = useCallback((message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  }, []);

  const updateLastMessageAnalysis = useCallback((analysisUpdate: Partial<AnalysisState>) => {
    setChatHistory(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.role === 'model' && lastMessage.analysis) {
            const updatedMessage = {
                ...lastMessage,
                analysis: {
                    ...lastMessage.analysis,
                    ...analysisUpdate,
                    processedItems: analysisUpdate.processedItems ? analysisUpdate.processedItems : lastMessage.analysis.processedItems,
                }
            };
            return [...prev.slice(0, -1), updatedMessage];
        }
        return prev;
    });
  }, []);
  
  const clearChatQuickReplies = useCallback(() => {
    setChatHistory(prev => prev.map(msg => ({ ...msg, quickReplies: undefined })));
  }, []);


  const contextValue = useMemo(() => ({
    pantry,
    addItemsToPantry,
    removeItemFromPantry,
    savedRecipes,
    saveRecipe,
    chatHistory,
    addMessageToChat,
    updateLastMessageAnalysis,
    clearChatQuickReplies
  }), [pantry, addItemsToPantry, removeItemFromPantry, savedRecipes, saveRecipe, chatHistory, addMessageToChat, updateLastMessageAnalysis, clearChatQuickReplies]);

  const renderContent = () => {
    switch (activeTab) {
      case 'pantry':
        return <PantryDisplay />;
      case 'home':
        return <HomeScreen setActiveTab={setActiveTab} />;
      case 'progress':
        return <ProgressTracker />;
      case 'chat':
      default:
        return <ProfessorNutriChat />;
    }
  };

  const navItems = [
    { id: 'home' as Tab, label: 'Início', icon: Home },
    { id: 'pantry' as Tab, label: 'Despensa', icon: Book },
    { id: 'chat' as Tab, label: 'Chat', icon: BotMessageSquare },
    { id: 'progress' as Tab, label: 'Progresso', icon: Award },
  ];

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-brand-background font-sans text-brand-text flex flex-col">
        {activeTab !== 'chat' && (
             <header className="flex items-center justify-between p-4">
                <h1 className="text-2xl font-bold text-brand-text">
                  Olá! <br /> Como posso ajudar?
                </h1>
                <img 
                    src="/professor-nutri.png" 
                    alt="Professor Nutri Mascot" 
                    className="h-12 w-12 rounded-full object-cover border-2 border-brand-surface shadow-md"
                />
            </header>
        )}
        
        <main className={`flex-grow overflow-y-auto ${activeTab !== 'chat' ? 'p-4' : ''} pb-28`}>
          {renderContent()}
        </main>
        
        <BottomNav items={navItems} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </AppContext.Provider>
  );
};

export default App;