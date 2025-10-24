import type { ElementType } from 'react';

export type Classification = 'in natura' | 'processado' | 'ultraprocessado';
export type RiskLevel = 'Baixo' | 'Médio' | 'Alto';
export type Tab = 'home' | 'chat' | 'pantry' | 'progress';

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  classification: Classification;
  riskLevel: RiskLevel;
  icon: string;
  color: string;
  healthTip: string;
  tags: string[];
}

export interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string;
}

export interface AnalysisState {
  status: 'idle' | 'parsing' | 'enriching' | 'done' | 'error';
  progress: number;
  totalItems: number;
  processedItems: {
    name: string;
    status: 'pending' | 'success' | 'error' | 'skipped';
    isFood: boolean;
    classification?: Classification;
    riskLevel?: RiskLevel;
  }[];
}


export interface ChatMessage {
    role: 'user' | 'model' | 'system';
    text?: string;
    recipes?: Recipe[];
    quickReplies?: string[];
    analysis?: AnalysisState;
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

export interface AppContextType {
  pantry: PantryItem[];
  addItemsToPantry: (items: PantryItem[]) => void;
  removeItemFromPantry: (itemId: string) => void;
  savedRecipes: Recipe[];
  saveRecipe: (recipe: Recipe) => void;
  chatHistory: ChatMessage[];
  addMessageToChat: (message: ChatMessage) => void;
  updateLastMessageAnalysis: (analysisUpdate: Partial<AnalysisState>) => void;
  clearChatQuickReplies: () => void;
}