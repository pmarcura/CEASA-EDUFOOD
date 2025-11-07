
import type { ElementType } from 'react';
import type { User } from 'firebase/auth';

export type { User };
export type NovaClassificationKey = 'in_natura' | 'culinary_ingredients' | 'processed' | 'ultra_processed';
export type RiskLevel = 'Baixo' | 'Médio' | 'Alto';
export type Tab = 'home' | 'chat' | 'pantry' | 'progress' | 'feed';
export type MealFeedback = 'disliked' | 'ok' | 'liked';

// Onboarding Types
export type CookingResponsibility = 'self' | 'shared' | 'delivery';
export type PantryManagementHabit = 'organized' | 'tries' | 'chaotic';
export type FamilyGoal = 'eat_healthier' | 'organize_time' | 'reduce_waste' | 'kids_eat_better' | 'plan_menus';

export interface Child {
  age: number;
}

export interface UserProfile {
  onboardingCompleted: boolean;
  cookingResponsibility?: CookingResponsibility;
  cookingFrequency?: number;
  familyMembers?: number;
  children?: Child[];
  dietaryRestrictions?: string[];
  goals?: FamilyGoal[];
  pantryHabit?: PantryManagementHabit;
}
export interface UserDocument extends UserProfile {
    // This could be expanded later with other top-level user data
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
  healthTip: string;
  tags: string[];
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
    feedback: MealFeedback;
    serves: string;
    foodGroupPortions?: {
        proteins: number;
        grains: number;
        vegetables: number;
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
  getCurrentProgress: (context: AppContextType) => number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: ElementType;
    isUnlocked: (context: AppContextType) => boolean;
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  image: string;
  caption: string;
  reactions: {
    inspiring: number;
    colorful: number;
    creative: number;
  };
  recipe?: Recipe;
}

export interface AppContextType {
  user: User | null;
  userProfile: UserProfile | null;
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
  addPostToFeed: (post: Omit<FeedPost, 'id' | 'reactions'>) => void;
  viewingRecipe: Recipe | null;
  setViewingRecipe: (recipe: Recipe | null) => void;
  isCookingMode: boolean;
  setIsCookingMode: (isCooking: boolean) => void;
  cookingRecipe: Recipe | null;
  setCookingRecipe: (recipe: Recipe | null) => void;
  mealLog: MealLogEntry[];
  logMealCompletion: (recipe: Recipe, feedback: MealFeedback) => Promise<void>;
}
