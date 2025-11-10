import type { ElementType } from 'react';
import type { User } from 'firebase/auth';
import type { useGamification } from './hooks/useGamification';

export type { User };
export type NovaClassificationKey = 'in_natura' | 'culinary_ingredients' | 'processed' | 'ultra_processed';
export type RiskLevel = 'Baixo' | 'Médio' | 'Alto';
export type Tab = 'home' | 'chat' | 'pantry' | 'progress' | 'feed';

export interface MealFeedback {
  rating: number; // 1-5
  text?: string;
  image?: string | null;
}

// Onboarding Types
export type CookingResponsibility = 'self' | 'shared' | 'delivery';
export type PantryManagementHabit = 'organized' | 'tries' | 'chaotic';
export type FamilyGoal = 'eat_healthier' | 'organize_time' | 'reduce_waste' | 'kids_eat_better' | 'plan_menus';
export type FoodSelectivityLevel = 'low' | 'medium' | 'high';

export interface Child {
  id: string;
  name: string;
  age: number;
  restrictions: {
    religious: boolean;
    psychological: boolean;
    autism: boolean;
  };
  medicalConditions: string;
  foodSelectivity: FoodSelectivityLevel;
  dislikedFoods: string;
}

export interface MissionProgress {
  id: string;
  completed: boolean;
  lastReset: number;
}

export interface UserProfile {
  onboardingCompleted: boolean;
  cookingResponsibility?: CookingResponsibility;
  cookingFrequency?: number;
  familyMembers?: number; // Will be deprecated in favor of adultsCount + children.length
  children?: Child[];
  dietaryRestrictions?: string[]; // General family restrictions
  goals?: FamilyGoal[];
  pantryHabit?: PantryManagementHabit;
  // Gamification fields
  xp: number;
  level: number;
  goldenCarrots: number;
  dailyMission: MissionProgress;
  weeklyMission: MissionProgress;
}

export interface UserDocument extends UserProfile {
    // This could be expanded later with other top-level user data
}

export interface NutritionalInfo {
    origin: string;
    benefits: string[];
    risks: string[];
    nutritionFacts: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  novaClassification: NovaClassificationKey;
  codexCategory: string;
  ageWarningTag: string;
  riskLevel: RiskLevel;
  icon: string;
  color: string;
  nutritionalInfo: NutritionalInfo;
  tags: string[];
  tipRead?: boolean;
}
export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  displayString: string;
}

export interface RecipeIngredientSection {
  section: string;
  items: RecipeIngredient[];
}

export interface RecipeStep {
  order: number;
  title: string;
  time_min: number;
  instruction: string;
  child_friendly?: string;
  safety?: string;
  tip?: string;
  utensil?: string;
}

export interface Recipe {
  title: string;
  total_time_min: number;
  serves: string;
  level: 'Fácil' | 'Médio' | 'Difícil';
  context_tags: string[];
  allergens: string[];
  ingredients: RecipeIngredientSection[];
  tools: string[];
  steps: RecipeStep[];
  presentation_suggestion?: string;
  storage: string;
}

export interface MealLogEntry {
    id: string;
    recipeTitle: string;
    timestamp: number;
    feedbackRating: number;
    feedbackText?: string;
    feedbackImage?: string | null;
    serves: string;
    foodGroupPortions?: {
        proteins: number;
        grains: number;
        vegetables: number;
    };
    novaBreakdown?: {
        in_natura: number;
        culinary_ingredients: number;
        processed: number;
        ultra_processed: number;
    };
}

export interface AnalysisState {
  status: 'idle' | 'parsing' | 'enriching' | 'done' | 'error';
  progress: number;
  totalItems: number;
  processedItems: {
    name: string;
    status: 'pending' | 'success' | 'error' | 'skipped';
    isFood: boolean;
    novaClassification?: NovaClassificationKey;
    riskLevel?: RiskLevel;
  }[];
}

export interface VerifiedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  isIncluded: boolean;
  isFood?: boolean; // Added to handle non-food items in verification
}

export interface ItemVerificationState {
  status: 'pending' | 'verified';
  items: VerifiedItem[];
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model' | 'system';
    text?: string;
    recipes?: Recipe[];
    quickReplies?: string[];
    analysis?: AnalysisState;
    imageUrl?: string; 
    itemVerification?: ItemVerificationState;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  goal: number;
  type: 'daily' | 'weekly';
  reward: number;
  getCurrentProgress: (context: AppContextType) => number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: ElementType;
    isUnlocked: (context: AppContextType) => boolean;
}

export interface Comment {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  rating: number; // 1 to 5
  image?: string | null;
  timestamp: number;
}


export interface FeedPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  image: string; // Can be a URL or base64 data URL
  caption: string;
  likes: number;
  likedBy: string[]; // Array of user UIDs who liked the post
  timestamp: number;
  recipe?: Recipe;
  comments?: Comment[];
}

export interface XpNoticeInfo {
  id: number;
  xpGained: number;
  reason: string;
  oldXp: number;
  newXp: number;
}

export interface Swap {
    before: string;
    after: string;
    benefit: string;
}

export interface LeaderboardEntry {
    uid: string;
    name: string;
    avatar: string;
    xp: number;
}


type GamificationContextType = ReturnType<typeof useGamification>;

export interface AppContextType extends GamificationContextType {
  user: User | null;
  logout: () => void;
  pantry: PantryItem[];
  addItemsToPantry: (items: Omit<PantryItem, 'id'>[]) => Promise<void>;
  removeItemFromPantry: (itemId: string) => Promise<void>;
  removeItemsFromPantry: (itemIds: string[]) => Promise<void>;
  updatePantryItemQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  updatePantryItemDetails: (itemId: string, updates: Partial<Omit<PantryItem, 'id'>>) => Promise<void>;
  savedRecipes: Recipe[];
  saveRecipe: (recipe: Recipe) => Promise<void>;
  chatHistory: ChatMessage[];
  addMessageToChat: (message: Omit<ChatMessage, 'id'>) => string;
  updateMessage: (messageId: string, messageUpdate: Partial<ChatMessage>) => void;
  clearChatQuickReplies: () => void;
  feedPosts: FeedPost[];
  addPostToFeed: (post: Omit<FeedPost, 'id' | 'likes' | 'likedBy' | 'timestamp' | 'authorName' | 'authorAvatar'>) => void;
  handleLikePost: (postId: string) => void;
  viewingRecipe: Recipe | null;
  setViewingRecipe: (recipe: Recipe | null) => void;
  isCookingMode: boolean;
  setIsCookingMode: (isCooking: boolean) => void;
  cookingRecipe: Recipe | null;
  setCookingRecipe: (recipe: Recipe | null) => void;
  mealLog: MealLogEntry[];
  logMealCompletion: (recipe: Recipe, feedback: MealFeedback) => Promise<void>;
  swaps: Swap[];
  isSwapsLoading: boolean;
}