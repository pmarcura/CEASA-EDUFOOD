
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Book, Award, BotMessageSquare, Home, Camera, LoaderCircle, LogOut } from 'lucide-react';
import { collection, doc, onSnapshot, query, where, getDocs, addDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import type { User, PantryItem, Recipe, Tab, ChatMessage, FeedPost, MealLogEntry, MealFeedback, UserProfile } from './types';
import { AppContext } from './contexts/AppContext';
import PantryDisplay from './components/PantryDisplay';
import HomeScreen from './components/HomeScreen';
import ProgressTracker from './components/ProgressTracker';
import ProfessorNutriChat from './components/ProfessorNutriChat';
import BottomNav from './components/BottomNav';
import CreativeFeed from './components/CreativeFeed';
import RecipeDetailView from './components/RecipeDetailView';
import CookingModeView from './components/CookingModeView';
import AuthScreen from './components/AuthScreen';
import { auth, db } from './firebase/config';
import OnboardingFlow from './components/OnboardingFlow';
import { analyzeRecipeForFoodGroups } from './services/geminiService';


// Mock data for initial feed posts - this can later be moved to Firestore as well
const initialFeedPosts: FeedPost[] = [
  {
    id: '1',
    authorName: 'Ana Silva',
    authorAvatar: '/avatars/avatar-1.jpg',
    image: '/dishes/dish-1.jpg',
    caption: 'Meu filho só comeu cenoura quando virou um foguete! 🚀🥕 Adicionamos gergelim como estrelas e ficou um sucesso!',
    reactions: { inspiring: 12, colorful: 25, creative: 18 },
  },
  {
    id: '2',
    authorName: 'Bruno Costa',
    authorAvatar: '/avatars/avatar-2.jpg',
    image: '/dishes/dish-2.jpg',
    caption: 'Panquecas de espinafre para um café da manhã de super-herói! O segredo é misturar tudo no liquidificador.',
    reactions: { inspiring: 8, colorful: 30, creative: 15 },
  },
];


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // Data states, now synced with Firestore
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [mealLog, setMealLog] = useState<MealLogEntry[]>([]);

  // Local UI states
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(initialFeedPosts);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
      { id: 'initial-system-message', role: 'system', text: 'Olá! Eu sou o Professor Nutri. Vamos juntos cuidar da alimentação da sua família! Que tal começar me enviando sua lista de compras ou a foto da sua nota fiscal?' }
  ]);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsLoading(false);
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);
  
  // User Profile and Data Listeners
  useEffect(() => {
    if (!user) {
      setPantry([]);
      setSavedRecipes([]);
      setMealLog([]);
      return;
    }
    const handleError = (error: Error, source: string) => {
        console.error(`Firestore error in ${source} listener:`, error);
        // Optionally, you could set an app-wide error state here
    };

    // User profile listener
    const userDocRef = doc(db, 'users', user.uid);
    const profileUnsub = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
        } else {
            setUserProfile({ onboardingCompleted: false }); // User exists but has no profile doc yet
        }
        setIsLoading(false); // Stop loading once we know the profile status
    }, (error) => handleError(error, 'user profile'));

    const pantryRef = collection(db, 'users', user.uid, 'pantry');
    const pantryUnsub = onSnapshot(pantryRef, (snapshot) => {
        const pantryData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as PantryItem[];
        setPantry(pantryData);
    }, (error) => handleError(error, 'pantry'));
    
    const recipesRef = collection(db, 'users', user.uid, 'savedRecipes');
    const recipesUnsub = onSnapshot(recipesRef, (snapshot) => {
        const recipeData = snapshot.docs.map(doc => ({ ...doc.data() })) as Recipe[];
        setSavedRecipes(recipeData);
    }, (error) => handleError(error, 'saved recipes'));

    const mealLogRef = collection(db, 'users', user.uid, 'mealLog');
    const mealLogUnsub = onSnapshot(mealLogRef, (snapshot) => {
        const logData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MealLogEntry[];
        setMealLog(logData.sort((a, b) => b.timestamp - a.timestamp));
    }, (error) => handleError(error, 'meal log'));

    // Cleanup listeners on unmount or user change
    return () => {
      profileUnsub();
      pantryUnsub();
      recipesUnsub();
      mealLogUnsub();
    };
  }, [user]);

  const addItemsToPantry = useCallback(async (newItems: Omit<PantryItem, 'id'>[]) => {
    if (!user) return;
    const pantryRef = collection(db, 'users', user.uid, 'pantry');
    
    const batch = writeBatch(db);

    for (const newItem of newItems) {
        const q = query(pantryRef, where("name", "==", newItem.name), where("unit", "==", newItem.unit));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0];
            const newQuantity = existingDoc.data().quantity + newItem.quantity;
            batch.update(existingDoc.ref, { quantity: newQuantity });
        } else {
            const newDocRef = doc(pantryRef);
            batch.set(newDocRef, newItem);
        }
    }
    await batch.commit();
  }, [user]);

  const removeItemFromPantry = useCallback(async (itemId: string) => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'pantry', itemId);
    await deleteDoc(itemRef);
  }, [user]);

   const removeItemsFromPantry = useCallback(async (itemIds: string[]) => {
    if (!user || itemIds.length === 0) return;
    const batch = writeBatch(db);
    itemIds.forEach(id => {
        const itemRef = doc(db, 'users', user.uid, 'pantry', id);
        batch.delete(itemRef);
    });
    await batch.commit();
  }, [user]);

  const updatePantryItemQuantity = useCallback(async (itemId: string, newQuantity: number) => {
     if (!user) return;
     const itemRef = doc(db, 'users', user.uid, 'pantry', itemId);
     await updateDoc(itemRef, { quantity: Math.max(0, newQuantity) });
  }, [user]);

  const updatePantryItemDetails = useCallback(async (itemId: string, updates: Partial<Omit<PantryItem, 'id'>>) => {
     if (!user) return;
     const itemRef = doc(db, 'users', user.uid, 'pantry', itemId);
     await updateDoc(itemRef, updates);
  }, [user]);

  const saveRecipe = useCallback(async (recipeToSave: Recipe) => {
    if (!user) return;
    const recipesRef = collection(db, 'users', user.uid, 'savedRecipes');
    const q = query(recipesRef, where("title", "==", recipeToSave.title));
    const existing = await getDocs(q);
    if (existing.empty) {
        await addDoc(recipesRef, recipeToSave);
    }
  }, [user]);
  
  // Chat-related functions (remain local state)
  const addMessageToChat = useCallback((message: Omit<ChatMessage, 'id'>) => {
    const newMessage = { ...message, id: `${Date.now()}-${Math.random()}` };
    setChatHistory(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((messageId: string, messageUpdate: Partial<ChatMessage>) => {
    setChatHistory(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, ...messageUpdate } : msg
      )
    );
  }, []);
  
  const clearChatQuickReplies = useCallback(() => {
    setChatHistory(prev => prev.map(msg => ({ ...msg, quickReplies: undefined })));
  }, []);

  const logMealCompletion = useCallback(async (recipe: Recipe, feedback: MealFeedback) => {
    if (!user) return;
    
    const batch = writeBatch(db);

    // 1. Analyze recipe for food groups
    const allIngredients = recipe.ingredients.flatMap(section => section.items.map(item => item.displayString));
    const foodGroupPortions = await analyzeRecipeForFoodGroups(allIngredients);

    // 2. Log the meal
    const mealLogRef = collection(db, 'users', user.uid, 'mealLog');
    const newLogEntry: Omit<MealLogEntry, 'id'> = {
        recipeTitle: recipe.title,
        timestamp: Date.now(),
        feedback,
        serves: recipe.serves,
        foodGroupPortions,
    };
    batch.set(doc(mealLogRef), newLogEntry);

    // 3. Deduct ingredients from pantry
    const recipeIngredients = recipe.ingredients.flatMap(section => section.items);
    const pantryRef = collection(db, 'users', user.uid, 'pantry');
    
    for (const ing of recipeIngredients) {
        const q = query(pantryRef, where("name", "==", ing.name), where("unit", "==", ing.unit));
        const pantrySnapshot = await getDocs(q);
        if (!pantrySnapshot.empty) {
            const pantryDoc = pantrySnapshot.docs[0];
            const currentQuantity = pantryDoc.data().quantity;
            const newQuantity = currentQuantity - ing.quantity;
            if (newQuantity <= 0) {
                batch.delete(pantryDoc.ref);
            } else {
                batch.update(pantryDoc.ref, { quantity: newQuantity });
            }
        } else {
            console.warn(`Ingredient "${ing.name}" not found in pantry. Not deducting.`);
        }
    }

    await batch.commit();

    // 4. Clean up cooking state
    setIsCookingMode(false);
    setCookingRecipe(null);
    setViewingRecipe(null);

    // 5. Give feedback to user
    addMessageToChat({
        role: 'system',
        text: `Ótimo trabalho! A receita "${recipe.title}" foi concluída e sua despensa foi atualizada.`,
    });
}, [user, addMessageToChat]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const addPostToFeed = useCallback((post: Omit<FeedPost, 'id' | 'reactions'>) => {
    const newPost: FeedPost = { ...post, id: Date.now().toString(), reactions: { inspiring: 0, colorful: 0, creative: 0 }};
    setFeedPosts(prev => [newPost, ...prev]);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    userProfile,
    logout: handleLogout,
    pantry,
    addItemsToPantry,
    removeItemFromPantry,
    removeItemsFromPantry,
    updatePantryItemQuantity,
    updatePantryItemDetails,
    savedRecipes,
    saveRecipe,
    chatHistory,
    addMessageToChat,
    updateMessage,
    clearChatQuickReplies,
    feedPosts,
    addPostToFeed,
    viewingRecipe,
    setViewingRecipe,
    isCookingMode,
    setIsCookingMode,
    cookingRecipe,
    setCookingRecipe,
    mealLog,
    logMealCompletion,
  }), [user, userProfile, handleLogout, pantry, addItemsToPantry, removeItemFromPantry, removeItemsFromPantry, updatePantryItemQuantity, updatePantryItemDetails, savedRecipes, saveRecipe, chatHistory, addMessageToChat, updateMessage, clearChatQuickReplies, feedPosts, addPostToFeed, viewingRecipe, isCookingMode, cookingRecipe, mealLog, logMealCompletion]);

  const renderContent = () => {
    switch (activeTab) {
      case 'pantry': return <PantryDisplay />;
      case 'home': return <HomeScreen setActiveTab={setActiveTab} />;
      case 'progress': return <ProgressTracker />;
      case 'feed': return <CreativeFeed />;
      case 'chat': default: return <ProfessorNutriChat />;
    }
  };

  const navItems = [
    { id: 'home' as Tab, label: 'Início', icon: Home },
    { id: 'pantry' as Tab, label: 'Despensa', icon: Book },
    { id: 'chat' as Tab, label: 'Chat', icon: BotMessageSquare },
    { id: 'feed' as Tab, label: 'Feed', icon: Camera },
    { id: 'progress' as Tab, label: 'Progresso', icon: Award },
  ];
  
  if (isLoading) {
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
      <div className="min-h-screen bg-brand-background font-sans text-brand-text flex flex-col">
        {viewingRecipe && !isCookingMode && <RecipeDetailView />}
        {cookingRecipe && isCookingMode && <CookingModeView />}
        
        {activeTab === 'chat' ? (
           <div className="flex flex-col h-full flex-1">
             <ProfessorNutriChat />
             <div className="flex-shrink-0">
                <BottomNav items={navItems} activeTab={activeTab} setActiveTab={setActiveTab} />
             </div>
          </div>
        ) : (
          <div className={showMainUI ? 'flex flex-col flex-1 w-full max-w-7xl mx-auto' : 'hidden'}>
            <header className="flex items-center justify-between p-4">
                <div>
                    <div className="flex items-center gap-2">
                       <h1 className="text-2xl font-bold text-brand-text">
                         Olá, {user.displayName?.split(' ')[0] || 'Família'}!
                       </h1>
                       <button onClick={handleLogout} className="p-1.5 bg-brand-surface rounded-full border border-brand-border hover:bg-gray-100 transition-colors">
                           <LogOut size={14} className="text-brand-text-secondary" />
                       </button>
                    </div>
                    <p className="text-sm text-brand-text-secondary">Como posso ajudar hoje?</p>
                </div>
                <img 
                    src={user.photoURL || "/professor-nutri.png"}
                    alt="User Avatar" 
                    className="h-12 w-12 rounded-full object-cover border-2 border-brand-surface shadow-md"
                />
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 pb-20">
              {renderContent()}
            </main>
            
            <BottomNav items={navItems} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
