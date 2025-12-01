
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Book, Award, BotMessageSquare, Home, Camera, LoaderCircle, Carrot, Bell } from 'lucide-react';

import type { User, PantryItem, Recipe, Tab, ChatMessage, FeedPost, MealLogEntry, MealFeedback, NovaClassificationKey, Comment, Swap, UserProfile, PantryReviewChange, AppNotification } from './types';
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
import StreakCard from './components/StreakCard';
import ProfileScreen from './components/ProfileScreen';
import WeeklyPlannerCard from './components/WeeklyPlannerCard';
import MealPlannerModal from './components/modals/MealPlannerModal';
import UpcomingMealCard from './components/UpcomingMealCard';
import PantryReviewCard from './components/PantryReviewCard';
import PantryReviewModal from './components/modals/PantryReviewModal';
import NotificationPanel from './components/NotificationPanel';
import CookNowModal from './components/modals/CookNowModal';
import { formatQuantity, normalizeUnit, toTitleCase } from './utils/formatters';
import { calculateDeduction } from './utils/unitConversion';
import { notifyFriends, sendFriendRequest, acceptFriendRequest } from './services/socialService';

// ... (keeping sampleRecipe and initialFeedPosts same as before - implicit) ...
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
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
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
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    comments: [],
  },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  
  const gamification = useGamification(user);

  // Data states
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [mealLog, setMealLog] = useState<MealLogEntry[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [isSwapsLoading, setIsSwapsLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Local UI states
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(initialFeedPosts);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
      { id: 'initial-system-message', role: 'system', text: 'Olá! Eu sou o Professor Nutri. Vamos juntos cuidar da alimentação da sua família! Que tal começar me enviando sua lista de compras ou a foto da sua nota fiscal?' }
  ]);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [isViewingProfile, setIsViewingProfile] = useState(false);
  const [isMealPlannerOpen, setIsMealPlannerOpen] = useState(false);
  const [isPantryReviewOpen, setIsPantryReviewOpen] = useState(false);
  const [isCookNowOpen, setIsCookNowOpen] = useState(false);
  const [upcomingMeal, setUpcomingMeal] = useState<MealLogEntry | null>(null);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);
  
  // Data Listeners
  useEffect(() => {
    if (!user) {
      setPantry([]);
      setSavedRecipes([]);
      setMealLog([]);
      setNotifications([]);
      setIsLoadingAuth(false);
      return;
    }
    setIsLoadingAuth(false);

    const handleError = (error: Error, source: string) => {
        console.error(`Firestore error in ${source} listener:`, error);
        if(source === 'notifications' && error.message.includes('Missing or insufficient permissions')) {
            // Fail gracefully for notifications if permissions are wrong
            setNotifications([]); 
        }
    };
    
    const pantryRef = db.collection('users').doc(user.uid).collection('pantry');
    const pantryUnsub = pantryRef.onSnapshot((snapshot) => {
        const pantryData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as PantryItem[];
        setPantry(pantryData);
    }, (error) => handleError(error, 'pantry'));
    
    const recipesRef = db.collection('users').doc(user.uid).collection('savedRecipes');
    const recipesUnsub = recipesRef.onSnapshot((snapshot) => {
        const recipeData = snapshot.docs.map(doc => ({ ...doc.data() })) as Recipe[];
        setSavedRecipes(recipeData);
    }, (error) => handleError(error, 'saved recipes'));

    const mealLogRef = db.collection('users').doc(user.uid).collection('mealLog');
    const mealLogUnsub = mealLogRef.onSnapshot((snapshot) => {
        const logData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MealLogEntry[];
        setMealLog(logData.sort((a, b) => b.timestamp - a.timestamp));
    }, (error) => handleError(error, 'meal log'));

    // Listener for Notifications
    const notificationsRef = db.collection('notifications').where('recipientUid', '==', user.uid);
    const notificationsUnsub = notificationsRef.onSnapshot((snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppNotification[];
        setNotifications(notifs);
    }, (error) => handleError(error, 'notifications'));

    return () => {
      pantryUnsub();
      recipesUnsub();
      mealLogUnsub();
      notificationsUnsub();
    };
  }, [user]);

  // ... (Swap logic, Upcoming Meal Logic - kept same)
  const ultraProcessedItemsKey = useMemo(() => {
    const items = pantry
        .filter(i => i.novaClassification === 'ultra_processed')
        .map(i => i.name)
        .sort();
    return JSON.stringify(items);
  }, [pantry]);

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
  
  useEffect(() => {
    const checkUpcomingMeal = () => {
        if (!mealLog || mealLog.length === 0) {
            setUpcomingMeal(null);
            return;
        }

        const now = Date.now();
        const threeHoursFromNow = now + 3 * 60 * 60 * 1000;

        const upcoming = mealLog
            .filter(log => log.timestamp > now && log.timestamp <= threeHoursFromNow)
            .sort((a, b) => a.timestamp - b.timestamp);
        
        const nextMeal = upcoming.length > 0 ? upcoming[0] : null;
        
        setUpcomingMeal(currentUpcoming => {
            if (currentUpcoming?.id === nextMeal?.id) {
                return currentUpcoming;
            }
            return nextMeal;
        });
    };

    const intervalId = setInterval(checkUpcomingMeal, 60 * 1000);
    checkUpcomingMeal();

    return () => clearInterval(intervalId);
  }, [mealLog]);


  // --- Action Handlers (Pantry, etc.) ---
  // ... (Keeping pantry handlers same)
  const addItemsToPantry = useCallback(async (newItems: Omit<PantryItem, 'id'>[]) => {
    if (!user) return;
    const pantryRef = db.collection('users').doc(user.uid).collection('pantry');
    const batch = db.batch();
    for (const newItem of newItems) {
        const normalizedName = toTitleCase(newItem.name);
        const normalizedUnit = normalizeUnit(newItem.unit);
        const existingItem = pantry.find(
            p => p.name && 
                 p.name.toLowerCase() === normalizedName.toLowerCase() && 
                 normalizeUnit(p.unit) === normalizedUnit
        );
        const cleanNewItem = {
            ...newItem,
            name: normalizedName,
            unit: normalizedUnit,
            quantity: formatQuantity(newItem.quantity)
        };
        if (existingItem) {
            const itemRef = pantryRef.doc(existingItem.id);
            const currentQty = existingItem.quantity || 0;
            const newQuantity = formatQuantity(currentQty + cleanNewItem.quantity);
            batch.update(itemRef, { quantity: newQuantity });
        } else {
            const newDocRef = pantryRef.doc();
            batch.set(newDocRef, cleanNewItem);
        }
    }
    await batch.commit();
  }, [user, pantry]);

  const removeItemFromPantry = useCallback(async (itemId: string) => {
    if (!user) return;
    const itemRef = db.collection('users').doc(user.uid).collection('pantry').doc(itemId);
    await itemRef.delete();
  }, [user]);

   const removeItemsFromPantry = useCallback(async (itemIds: string[]) => {
    if (!user || itemIds.length === 0) return;
    const batch = db.batch();
    itemIds.forEach(id => {
        const itemRef = db.collection('users').doc(user.uid).collection('pantry').doc(id);
        batch.delete(itemRef);
    });
    await batch.commit();
  }, [user]);

  const updatePantryItemQuantity = useCallback(async (itemId: string, newQuantity: number) => {
     if (!user) return;
     const itemRef = db.collection('users').doc(user.uid).collection('pantry').doc(itemId);
     await itemRef.update({ quantity: formatQuantity(Math.max(0, newQuantity)) });
  }, [user]);

  const updatePantryItemDetails = useCallback(async (itemId: string, updates: Partial<Omit<PantryItem, 'id'>>) => {
     if (!user) return;
     const itemRef = db.collection('users').doc(user.uid).collection('pantry').doc(itemId);
     if (updates.quantity !== undefined) {
         updates.quantity = formatQuantity(updates.quantity);
     }
     if (updates.unit !== undefined) {
         updates.unit = normalizeUnit(updates.unit);
     }
     await itemRef.update(updates);
  }, [user]);
  
  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = db.collection('users').doc(user.uid);
    await userDocRef.update(updates);
  }, [user]);

  const updateUserAvatar = useCallback(async (photoURL: string) => {
    if (!user || !auth.currentUser) return;
    await auth.currentUser.updateProfile({ photoURL });
  }, [user]);


  const saveRecipe = useCallback(async (recipeToSave: Recipe) => {
    if (!user) return;
    const recipesRef = db.collection('users').doc(user.uid).collection('savedRecipes');
    const existing = await recipesRef.where("title", "==", recipeToSave.title).get();
    if (existing.empty) {
        await recipesRef.add(recipeToSave);
    }
  }, [user]);
  
  const completePantryReview = useCallback(async (changes: PantryReviewChange[]) => {
    if (!user) return;
    const batch = db.batch();
    let totalXp = 0;
    changes.forEach(change => {
        const itemRef = db.collection('users').doc(user.uid).collection('pantry').doc(change.itemId);
        
        const updatePayload: Partial<PantryItem> = {};

        // Update preference rating map (childPreferences)
        if (change.newChildPreferences) {
             updatePayload.childPreferences = change.newChildPreferences;
        }

        switch (change.action) {
            case 'update':
                updatePayload.quantity = formatQuantity(change.newQuantity!);
                if (change.newUnit) updatePayload.unit = normalizeUnit(change.newUnit);
                
                batch.update(itemRef, updatePayload);
                totalXp += ACTION_XP_VALUES.PANTRY_REVIEW_UPDATE;
                break;
            case 'remove':
                batch.delete(itemRef);
                totalXp += ACTION_XP_VALUES.PANTRY_REVIEW_REMOVE;
                break;
            case 'keep':
                if (Object.keys(updatePayload).length > 0) {
                    batch.update(itemRef, updatePayload);
                }
                totalXp += ACTION_XP_VALUES.PANTRY_REVIEW_KEEP;
                break;
        }
    });
    const userDocRef = db.collection('users').doc(user.uid);
    batch.update(userDocRef, { lastPantryReview: Date.now() });
    await batch.commit();
    if (totalXp > 0) gamification.awardXp(totalXp + ACTION_XP_VALUES.PANTRY_REVIEW_BONUS, "Revisão da Despensa Concluída!");
  }, [user, gamification]);

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

  // --- Social Actions ---
  
  const handleSendFriendRequest = useCallback(async (targetUid: string) => {
      if (!user) return;
      await sendFriendRequest(user, targetUid);
  }, [user]);

  const handleAcceptFriendRequest = useCallback(async (notification: AppNotification) => {
      if (!user) return;
      await acceptFriendRequest(user, notification);
  }, [user]);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
      await db.collection('notifications').doc(notificationId).delete(); // or update({ read: true })
  }, []);

  const addMealLogEntry = useCallback(async (entry: Omit<MealLogEntry, 'id'>) => {
    if (!user) return;
    const mealLogRef = db.collection('users').doc(user.uid).collection('mealLog');
    await mealLogRef.add(entry);
    gamification.awardXp(ACTION_XP_VALUES.RECIPE_FEEDBACK, 'Refeição Planejada!');
  }, [user, gamification]);

  const updateMealLogEntry = useCallback(async (entryId: string, updates: Partial<Omit<MealLogEntry, 'id'>>) => {
    if (!user) return;
    const entryRef = db.collection('users').doc(user.uid).collection('mealLog').doc(entryId);
    await entryRef.update(updates);
  }, [user]);

  const deleteMealLogEntry = useCallback(async (entryId: string) => {
    if (!user) return;
    const entryRef = db.collection('users').doc(user.uid).collection('mealLog').doc(entryId);
    await entryRef.delete();
  }, [user]);

  const logMealCompletion = useCallback(async (recipe: Recipe, feedback: MealFeedback) => {
    if (!user || !gamification.userProfile) return;
    
    gamification.awardXp(ACTION_XP_VALUES.RECIPE_COMPLETION, 'Receita Concluída!');
    if(feedback.text || feedback.image) {
        gamification.awardXp(ACTION_XP_VALUES.RECIPE_FEEDBACK, "Feedback enviado!");
    }
    
    // Notify friends about meal completion
    notifyFriends(user, gamification.userProfile, 'meal', `cozinhou ${recipe.title}! 🥘`);

    const batch = db.batch();
    const recipeIngredients = recipe.ingredients.flatMap(section => section.items);
    const novaBreakdown: Record<NovaClassificationKey, number> = { in_natura: 0, culinary_ingredients: 0, processed: 0, ultra_processed: 0 };
    for (const ing of recipeIngredients) {
        const pantryItem = pantry.find(p => p.name.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(p.name.toLowerCase()));
        if (pantryItem) novaBreakdown[pantryItem.novaClassification]++;
    }
    
    const allIngredients = recipe.ingredients.flatMap(section => section.items.map(item => item.displayString));
    const foodGroupPortions = await analyzeRecipeForFoodGroups(allIngredients);
    const mealLogRef = db.collection('users').doc(user.uid).collection('mealLog');
    const newLogEntry: Omit<MealLogEntry, 'id'> = {
        recipeTitle: recipe.title,
        timestamp: Date.now(),
        feedbackRating: feedback.rating,
        feedbackText: feedback.text || '',
        feedbackImage: feedback.image || null,
        serves: recipe.serves,
        foodGroupPortions,
        novaBreakdown,
        recipe: recipe,
    };
    batch.set(mealLogRef.doc(), newLogEntry);

    // Deduct ingredients logic
    for (const ing of recipeIngredients) {
        const pantryItem = pantry.find(p => p.name.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(p.name.toLowerCase()));
        if (pantryItem) {
            const itemRef = db.collection('users').doc(user.uid).collection('pantry').doc(pantryItem.id);
            const deductionAmount = calculateDeduction(ing.quantity, ing.unit, pantryItem.unit, pantryItem.name);
            if (deductionAmount !== null) {
                const newPantryQuantity = pantryItem.quantity - deductionAmount;
                if (newPantryQuantity <= 0.001) { 
                    batch.delete(itemRef);
                } else {
                    batch.update(itemRef, { quantity: formatQuantity(newPantryQuantity) });
                }
            }
        }
    }
    await batch.commit();
    
    // Feed post logic (simplified local update, real app would trigger a feed refresh)
    setFeedPosts(prevPosts => {
        // ... logic to add feedback to feed if needed ...
        return prevPosts;
    });

    setIsCookingMode(false);
    setCookingRecipe(null);
    setViewingRecipe(null);

    addMessageToChat({ role: 'system', text: `Ótimo trabalho! A receita "${recipe.title}" foi concluída!` });
  }, [user, addMessageToChat, gamification, pantry]);

  // ... (Logout, etc)
  const handleLogout = useCallback(async () => {
    await auth.signOut();
    setIsViewingProfile(false);
  }, []);

  const addPostToFeed = useCallback((post: Omit<FeedPost, 'id' | 'likes' | 'likedBy' | 'timestamp' | 'authorName' | 'authorAvatar'>) => {
    if (!user || !gamification.userProfile) return;
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
    
    // Notify friends about new post
    notifyFriends(user, gamification.userProfile, 'post', 'compartilhou uma nova vitória no Feed!');
  }, [user, gamification.userProfile]);

  const handleLikePost = useCallback((postId: string) => {
    if (!user) return;
    const userId = user.uid;
    setFeedPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
            const isLiked = post.likedBy.includes(userId);
            if (isLiked) return { ...post, likes: post.likes - 1, likedBy: post.likedBy.filter(id => id !== userId) };
            else return { ...post, likes: post.likes + 1, likedBy: [...post.likedBy, userId] };
        }
        return post;
    }));
  }, [user]);

  const contextValue = useMemo(() => ({
    user, userProfile: gamification.userProfile, updateUserProfile, updateUserAvatar, logout: handleLogout,
    pantry, addItemsToPantry, removeItemFromPantry, removeItemsFromPantry, updatePantryItemQuantity, updatePantryItemDetails, completePantryReview,
    savedRecipes, saveRecipe,
    chatHistory, addMessageToChat, updateMessage, clearChatQuickReplies,
    feedPosts, addPostToFeed, handleLikePost,
    viewingRecipe, setViewingRecipe, isCookingMode, setIsCookingMode, cookingRecipe, setCookingRecipe,
    mealLog, logMealCompletion, addMealLogEntry, updateMealLogEntry, deleteMealLogEntry,
    swaps, isSwapsLoading, isViewingProfile, setIsViewingProfile, isMealPlannerOpen, setIsMealPlannerOpen, upcomingMeal, isPantryReviewOpen, setIsPantryReviewOpen, isCookNowOpen, setIsCookNowOpen,
    notifications, markNotificationAsRead, sendFriendRequest: handleSendFriendRequest, acceptFriendRequest: handleAcceptFriendRequest,
    setActiveTab,
    ...gamification,
  }), [user, gamification.userProfile, updateUserProfile, updateUserAvatar, handleLogout, pantry, addItemsToPantry, removeItemFromPantry, removeItemsFromPantry, updatePantryItemQuantity, updatePantryItemDetails, completePantryReview, savedRecipes, saveRecipe, chatHistory, addMessageToChat, updateMessage, clearChatQuickReplies, feedPosts, addPostToFeed, handleLikePost, viewingRecipe, isCookingMode, cookingRecipe, mealLog, logMealCompletion, addMealLogEntry, updateMealLogEntry, deleteMealLogEntry, gamification, swaps, isSwapsLoading, isViewingProfile, isMealPlannerOpen, upcomingMeal, isPantryReviewOpen, notifications, markNotificationAsRead, handleSendFriendRequest, handleAcceptFriendRequest, isCookNowOpen, setIsCookNowOpen, setActiveTab]);


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
  
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const isLoading = isLoadingAuth || gamification.isLoadingProfile;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  if (!gamification.userProfile?.onboardingCompleted) return <OnboardingFlow user={user} />;

  const showMainUI = !viewingRecipe && !isCookingMode && !isViewingProfile;
  const { level, xpForNextLevel, xpInCurrentLevel } = getLevelForXp(gamification.userProfile?.xp || 0);
  const xpPercentage = xpForNextLevel > 0 ? (xpInCurrentLevel / xpForNextLevel) * 100 : 0;

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-brand-background font-sans text-brand-text flex flex-col pb-24 md:pb-0 relative">
        {gamification.xpNotice && <XpNotice notice={gamification.xpNotice} onClose={gamification.removeXpNotice} />}
        {gamification.levelUpInfo && <LevelUpModal levelUpInfo={gamification.levelUpInfo} close={gamification.closeLevelUpModal} />}
        
        {viewingRecipe && !isCookingMode && <RecipeDetailView />}
        {cookingRecipe && isCookingMode && <CookingModeView />}
        {isViewingProfile && <ProfileScreen />}
        {isMealPlannerOpen && <MealPlannerModal />}
        {isPantryReviewOpen && <PantryReviewModal />}
        {isCookNowOpen && <CookNowModal onClose={() => setIsCookNowOpen(false)} />}
        
        {/* Notification Panel Overlay */}
        {isNotificationPanelOpen && (
            <>
                <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsNotificationPanelOpen(false)}></div>
                <NotificationPanel onClose={() => setIsNotificationPanelOpen(false)} />
            </>
        )}
        
        {activeTab === 'chat' ? (
           <div className="flex flex-col h-full flex-1 relative">
             <ProfessorNutriChat />
             <div className="fixed bottom-6 left-4 right-4 z-50">
                <BottomNav items={navItems} activeTab={activeTab} setActiveTab={setActiveTab} />
             </div>
          </div>
        ) : (
          <div className={showMainUI ? 'flex flex-col flex-1 w-full max-w-2xl mx-auto' : 'hidden'}>
            {/* Header Moderno / Sticky */}
            <header className="sticky top-0 z-30 bg-brand-background/90 backdrop-blur-md border-b border-transparent transition-all duration-200 px-5 py-3">
                <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-glow">
                             <img src="/professor-nutri-favicon.png" alt="Logo" className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-brand-text leading-tight font-display">
                                Olá, {user.displayName?.split(' ')[0] || 'Família'}!
                            </h1>
                            <span className="text-xs font-medium text-brand-text-secondary">Vamos comer bem hoje?</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
                            className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-brand-text-secondary relative hover:bg-gray-50 transition-colors"
                         >
                            <Bell size={20} />
                            {unreadNotifications > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                         </button>
                        <img 
                            src={user.photoURL || "/professor-nutri.png"}
                            alt="User" 
                            className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer ring-2 ring-brand-border"
                            onClick={() => setIsViewingProfile(true)}
                        />
                    </div>
                </div>

                {/* Gamification Bar Compact */}
                <div className="bg-white rounded-full p-1.5 pr-4 shadow-sm border border-brand-border flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-brand-background flex items-center justify-center relative">
                         <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                             <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                             <path className="text-brand-primary transition-all duration-1000 ease-out" strokeDasharray={`${xpPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                         </svg>
                         <span className="text-xs font-bold text-brand-primary relative z-10">{level}</span>
                     </div>
                     <div className="flex-1">
                         <div className="flex justify-between items-baseline">
                            <span className="text-xs font-bold text-brand-text">Nível {level}</span>
                            <span className="text-[10px] font-semibold text-brand-text-secondary">{xpInCurrentLevel}/{xpForNextLevel} XP</span>
                         </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div className="bg-gradient-to-r from-brand-primary to-teal-400 h-full rounded-full transition-all duration-500" style={{width: `${xpPercentage}%`}}></div>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 pl-2 border-l border-gray-100">
                        <Carrot size={16} className="text-orange-500 fill-orange-500" />
                        <span className="font-bold text-sm text-brand-text">{gamification.userProfile?.goldenCarrots || 0}</span>
                     </div>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Main Dashboard Widgets - Stacked Layout */}
                <div className="flex flex-col gap-4">
                     <StreakCard />
                     <WeeklyPlannerCard />
                     <PantryReviewCard />
                </div>
                
                {/* Upcoming Context */}
                <UpcomingMealCard />

                {renderContent()}
                
                {/* Bottom Padding for Floating Nav */}
                <div className="h-24"></div>
            </main>
            
            <div className="fixed bottom-6 left-4 right-4 z-50 max-w-2xl mx-auto">
                <BottomNav items={navItems} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
