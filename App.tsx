
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Book, Award, BotMessageSquare, Home, Camera, LoaderCircle, LogOut, Carrot } from 'lucide-react';
import { collection, doc, onSnapshot, query, where, getDocs, addDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import type { User, PantryItem, Recipe, Tab, ChatMessage, FeedPost, MealLogEntry, MealFeedback, NovaClassificationKey, Comment, Swap } from './types';
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
import { analyzeRecipeForFoodGroups, generateSwaps } from './services/geminiService';
import { useGamification } from './hooks/useGamification';
import LevelUpModal from './components/gamification/LevelUpModal';
import { getLevelForXp, ACTION_XP_VALUES } from './services/gamificationService';
import XpNotice from './components/gamification/XpNotice';

const sampleRecipe: Recipe = {
  title: 'Foguetes de Cenoura',
  total_time_min: 15,
  serves: "2 crianças",
  level: 'Fácil',
  context_tags: ["Lanche", "Infantil", "Saudável"],
  allergens: [],
  ingredients: [
    {
      section: "Ingredientes",
      items: [
        { name: "cenoura", quantity: 2, unit: "un", displayString: "2 cenouras médias" },
        { name: "gergelim", quantity: 1, unit: "colher de sopa", displayString: "1 colher de sopa de gergelim" },
        { name: "azeite", quantity: 1, unit: "colher de chá", displayString: "1 colher de chá de azeite" }
      ]
    }
  ],
  tools: ["Faca", "Tábua", "Assadeira"],
  steps: [
    { order: 1, title: "Preparar as cenouras", time_min: 5, instruction: "Lave e descasque as cenouras. Corte em formato de palitos grossos, como se fossem a base de um foguete.", child_friendly: "Com supervisão, as crianças podem ajudar a lavar as cenouras!" },
    { order: 2, title: "Montar os foguetes", time_min: 5, instruction: "Em uma assadeira, tempere os palitos de cenoura com azeite. Salpique o gergelim por cima para parecerem estrelas.", child_friendly: "Deixe as crianças salpicarem o gergelim. É super divertido!" },
    { order: 3, title: "Assar", time_min: 5, instruction: "Leve ao forno pré-aquecido a 180ºC por cerca de 10-15 minutos ou até ficarem macias. Sirva e decole para a diversão!", safety: "Cuidado ao manusear o forno quente." }
  ],
  presentation_suggestion: "Sirva os foguetes em um prato com um pequeno pote de iogurte natural como 'nuvem' para mergulhar.",
  storage: "Consumir imediatamente para manter a crocância.",
};


const initialFeedPosts: FeedPost[] = [
  {
    id: '1',
    authorName: 'Ana Silva',
    authorAvatar: '/avatars/avatar-1.jpg',
    image: '/dishes/dish-1.jpg',
    caption: 'Meu filho só comeu cenoura quando virou um foguete! 🚀🥕 Adicionamos gergelim como estrelas e ficou um sucesso!',
    likes: 25,
    likedBy: [],
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    recipe: sampleRecipe,
    comments: [],
  },
  {
    id: '2',
    authorName: 'Bruno Costa',
    authorAvatar: '/avatars/avatar-2.jpg',
    image: '/dishes/dish-2.jpg',
    caption: 'Panquecas de espinafre para um café da manhã de super-herói! O segredo é misturar tudo no liquidificador.',
    likes: 30,
    likedBy: [],
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    comments: [],
  },
];


// Helper functions for unit normalization and conversion
const normalizeUnit = (unit: string): string => {
    const u = unit.toLowerCase().trim();
    if (['g', 'grama', 'gramas'].includes(u)) return 'g';
    if (['kg', 'quilo', 'quilos', 'quilograma', 'quilogramas'].includes(u)) return 'kg';
    if (['ml', 'mililitro', 'mililitros'].includes(u)) return 'ml';
    if (['l', 'litro', 'litros'].includes(u)) return 'l';
    if (['un', 'unidade', 'unidades'].includes(u)) return 'un';
    return u; // Return original if not recognized
};

const convertToBaseUnit = (quantity: number, unit: string): { quantity: number; unit: string } => {
    const normalized = normalizeUnit(unit);
    switch (normalized) {
        case 'kg':
            return { quantity: quantity * 1000, unit: 'g' };
        case 'l':
            return { quantity: quantity * 1000, unit: 'ml' };
        default:
            return { quantity, unit: normalized };
    }
};


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  
  const gamification = useGamification(user);

  // Data states, now synced with Firestore
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [mealLog, setMealLog] = useState<MealLogEntry[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [isSwapsLoading, setIsSwapsLoading] = useState(true);

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
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);
  
  // Data Listeners (excluding profile, which is now in useGamification hook)
  useEffect(() => {
    if (!user) {
      setPantry([]);
      setSavedRecipes([]);
      setMealLog([]);
      setIsLoadingAuth(false); // Ensure loading stops if user signs out
      return;
    }
    // Auth is done, but profile might still be loading
    setIsLoadingAuth(false);

    const handleError = (error: Error, source: string) => {
        console.error(`Firestore error in ${source} listener:`, error);
    };
    
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
      pantryUnsub();
      recipesUnsub();
      mealLogUnsub();
    };
  }, [user]);

  // Memoize the key for the swaps useEffect dependency array to avoid unnecessary re-fetching
  const ultraProcessedItemsKey = useMemo(() => {
    const items = pantry
        .filter(i => i.novaClassification === 'ultra_processed')
        .map(i => i.name)
        .sort();
    return JSON.stringify(items);
  }, [pantry]);

  // Effect for fetching AI swaps. Only runs when the list of ultra-processed items changes.
  useEffect(() => {
    if (!user || !gamification.userProfile?.onboardingCompleted) return;
    
    const fetchAndSetSwaps = async () => {
        const ultraProcessedItems = JSON.parse(ultraProcessedItemsKey);
            
        if (ultraProcessedItems.length === 0) {
            setSwaps([]);
            setIsSwapsLoading(false);
            return;
        }

        setIsSwapsLoading(true);
        try {
            const generatedSwaps = await generateSwaps(ultraProcessedItems.slice(0, 3));
            setSwaps(generatedSwaps);
        } catch (e) {
            console.error("Failed to fetch swaps:", e);
            setSwaps([]);
        } finally {
            setIsSwapsLoading(false);
        }
    };
    
    fetchAndSetSwaps();
  }, [user, gamification.userProfile?.onboardingCompleted, ultraProcessedItemsKey]);


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
    
    gamification.awardXp(ACTION_XP_VALUES.RECIPE_COMPLETION, 'Receita Concluída!');
    if(feedback.text || feedback.image) {
        gamification.awardXp(ACTION_XP_VALUES.RECIPE_FEEDBACK, "Feedback enviado!");
    }
    
    const batch = writeBatch(db);
    const recipeIngredients = recipe.ingredients.flatMap(section => section.items);
    
    // Calculate NOVA breakdown
    const novaBreakdown: Record<NovaClassificationKey, number> = {
        in_natura: 0,
        culinary_ingredients: 0,
        processed: 0,
        ultra_processed: 0,
    };

    for (const ing of recipeIngredients) {
        const pantryItem = pantry.find(p => p.name.toLowerCase() === ing.name.toLowerCase());
        if (pantryItem) {
            novaBreakdown[pantryItem.novaClassification]++;
        }
    }
    
    // Log the meal
    const allIngredients = recipe.ingredients.flatMap(section => section.items.map(item => item.displayString));
    const foodGroupPortions = await analyzeRecipeForFoodGroups(allIngredients);
    const mealLogRef = collection(db, 'users', user.uid, 'mealLog');
    const newLogEntry: Omit<MealLogEntry, 'id'> = {
        recipeTitle: recipe.title,
        timestamp: Date.now(),
        feedbackRating: feedback.rating,
        feedbackText: feedback.text || '',
        feedbackImage: feedback.image || null,
        serves: recipe.serves,
        foodGroupPortions,
        novaBreakdown,
    };
    batch.set(doc(mealLogRef), newLogEntry);

    // Deduct ingredients from pantry with unit conversion logic
    for (const ing of recipeIngredients) {
        const pantryItem = pantry.find(p => p.name.toLowerCase() === ing.name.toLowerCase());

        if (pantryItem) {
            const itemRef = doc(db, 'users', user.uid, 'pantry', pantryItem.id);
            
            const pantryBase = convertToBaseUnit(pantryItem.quantity, pantryItem.unit);
            const recipeBase = convertToBaseUnit(ing.quantity, ing.unit);

            if (pantryBase.unit === recipeBase.unit) {
                const newBaseQuantity = pantryBase.quantity - recipeBase.quantity;

                if (newBaseQuantity <= 0.001) { // Use a small threshold for floating point
                    batch.delete(itemRef);
                } else {
                    let newPantryQuantity: number;
                    const originalPantryUnitNormalized = normalizeUnit(pantryItem.unit);

                    if (originalPantryUnitNormalized === 'kg') {
                        newPantryQuantity = newBaseQuantity / 1000;
                    } else if (originalPantryUnitNormalized === 'l') {
                        newPantryQuantity = newBaseQuantity / 1000;
                    } else {
                        newPantryQuantity = newBaseQuantity;
                    }
                    
                    batch.update(itemRef, { quantity: parseFloat(newPantryQuantity.toFixed(3)) });
                }
            } else {
                 console.warn(`Unit mismatch for ingredient "${ing.name}". Pantry has "${pantryItem.unit}", recipe needs "${ing.unit}". Not deducting.`);
            }
        } else {
            console.warn(`Ingredient "${ing.name}" not found in pantry. Not deducting.`);
        }
    }
    
    await batch.commit();
    
    // NEW LOGIC: Add feedback as a comment on the feed post.
    setFeedPosts(prevPosts => {
        const postIndex = prevPosts.findIndex(p => p.recipe?.title === recipe.title);
        if (postIndex === -1) return prevPosts;

        const updatedPosts = [...prevPosts];
        const targetPost = { ...updatedPosts[postIndex] };

        const newComment: Comment = {
            id: `${Date.now()}-${Math.random()}`,
            authorUid: user.uid,
            authorName: user.displayName || 'Usuário',
            authorAvatar: user.photoURL || '/avatars/avatar-user.jpg',
            text: feedback.text || '',
            rating: feedback.rating,
            image: feedback.image,
            timestamp: Date.now(),
        };

        const existingComments = targetPost.comments || [];
        targetPost.comments = [...existingComments, newComment];
        updatedPosts[postIndex] = targetPost;
        
        return updatedPosts;
    });

    setIsCookingMode(false);
    setCookingRecipe(null);
    setViewingRecipe(null);

    addMessageToChat({
        role: 'system',
        text: `Ótimo trabalho! A receita "${recipe.title}" foi concluída, sua despensa foi atualizada e seu comentário foi postado!`,
    });
}, [user, addMessageToChat, gamification, pantry]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const addPostToFeed = useCallback((post: Omit<FeedPost, 'id' | 'likes' | 'likedBy' | 'timestamp' | 'authorName' | 'authorAvatar'>) => {
    if (!user) return;
    const newPost: FeedPost = {
        ...post,
        id: Date.now().toString(),
        likes: 0,
        likedBy: [],
        timestamp: Date.now(),
        authorName: user.displayName || 'Usuário',
        authorAvatar: user.photoURL || '/avatars/avatar-user.jpg',
        comments: [],
    };
    setFeedPosts(prev => [newPost, ...prev]);
  }, [user]);

  const handleLikePost = useCallback((postId: string) => {
    if (!user) return;
    const userId = user.uid;

    setFeedPosts(prevPosts =>
        prevPosts.map(post => {
            if (post.id === postId) {
                const isLiked = post.likedBy.includes(userId);
                if (isLiked) {
                    // Unlike
                    return {
                        ...post,
                        likes: post.likes - 1,
                        likedBy: post.likedBy.filter(id => id !== userId),
                    };
                } else {
                    // Like
                    return {
                        ...post,
                        likes: post.likes + 1,
                        likedBy: [...post.likedBy, userId],
                    };
                }
            }
            return post;
        })
    );
  }, [user]);

  const contextValue = useMemo(() => ({
    user,
    userProfile: gamification.userProfile,
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
    handleLikePost,
    viewingRecipe,
    setViewingRecipe,
    isCookingMode,
    setIsCookingMode,
    cookingRecipe,
    setCookingRecipe,
    mealLog,
    logMealCompletion,
    swaps,
    isSwapsLoading,
    ...gamification,
  }), [user, pantry, addItemsToPantry, removeItemFromPantry, removeItemsFromPantry, updatePantryItemQuantity, updatePantryItemDetails, savedRecipes, saveRecipe, chatHistory, addMessageToChat, updateMessage, clearChatQuickReplies, feedPosts, addPostToFeed, handleLikePost, viewingRecipe, isCookingMode, cookingRecipe, mealLog, logMealCompletion, gamification, handleLogout, swaps, isSwapsLoading]);

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
  
  const isLoading = isLoadingAuth || gamification.isLoadingProfile;

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
  
  if (!gamification.userProfile?.onboardingCompleted) {
    return <OnboardingFlow user={user} />;
  }

  const showMainUI = !viewingRecipe && !isCookingMode;

  const { level, xpForNextLevel, xpInCurrentLevel } = getLevelForXp(gamification.userProfile?.xp || 0);
  const xpPercentage = xpForNextLevel > 0 ? (xpInCurrentLevel / xpForNextLevel) * 100 : 0;

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-brand-background font-sans text-brand-text flex flex-col">
        {gamification.xpNotice && <XpNotice notice={gamification.xpNotice} onClose={gamification.removeXpNotice} />}
        {gamification.levelUpInfo && <LevelUpModal levelUpInfo={gamification.levelUpInfo} close={gamification.closeLevelUpModal} />}
        
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
                <div className="flex items-center gap-2">
                    <img src="/professor-nutri-favicon.png" alt="EduFood Logo" className="h-8 w-8 rounded-lg" />
                    <h1 className="text-2xl font-bold text-brand-text tracking-tight">
                        EduFood
                    </h1>
                </div>
                <img 
                    src={user.photoURL || "/professor-nutri.png"}
                    alt="User Avatar" 
                    className="h-10 w-10 rounded-full object-cover border-2 border-brand-surface shadow-sm cursor-pointer"
                    onClick={handleLogout}
                />
            </header>
            
             <div className="px-4 mb-4">
                <div className="w-full bg-brand-surface p-2.5 rounded-xl border border-brand-border shadow-sm">
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">Nível {level}</span>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-orange-500 flex items-center gap-1">
                                <Carrot size={14} className="text-orange-400" />
                                {gamification.userProfile.goldenCarrots || 0}
                            </span>
                        </div>
                    </div>
                    <div className="w-full bg-brand-border rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-full rounded-full transition-all duration-500" style={{width: `${xpPercentage}%`}}></div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-brand-text-secondary font-semibold mt-1">{xpInCurrentLevel} / {xpForNextLevel} XP</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-4 pt-0 pb-20">
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