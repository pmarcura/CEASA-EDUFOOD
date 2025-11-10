import type { Mission, Achievement, AppContextType } from '../types';
import { Leaf, CookingPot, HeartHandshake, BookOpen, Star, Camera, CheckSquare, Sun, Calendar } from 'lucide-react';
import { MISSION_REWARDS } from '../services/gamificationService';

// Helper to get the start of the current day
const getStartOfToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
};

// Helper to get the start of the current week (Sunday)
const getStartOfWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // Sunday = 0
    const diff = now.getDate() - dayOfWeek;
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek.getTime();
};


export const DAILY_MISSIONS: Mission[] = [
    {
        id: 'log-meal-1',
        title: 'Diário de Bordo',
        description: 'Registre 1 refeição feita hoje.',
        goal: 1,
        type: 'daily',
        reward: MISSION_REWARDS.DAILY,
        getCurrentProgress: (context: AppContextType) => {
             const startOfToday = getStartOfToday();
             return context.mealLog.filter(log => log.timestamp >= startOfToday).length;
        }
    },
    {
        id: 'read-tip-1',
        title: 'Leitura Nutritiva',
        description: 'Leia 1 "Dica do Nutri" de qualquer item.',
        goal: 1,
        type: 'daily',
        reward: MISSION_REWARDS.DAILY,
        getCurrentProgress: (context: AppContextType) => {
            // NOTE: This can't be truly "daily" without a schema change (timestamp on tipRead).
            // It counts total read tips within the mission's active day.
            // A user can complete this once per day by reading a new tip.
            return context.pantry.filter(i => i.tipRead).length;
        }
    },
];

export const WEEKLY_MISSIONS: Mission[] = [
    {
        id: 'cook-recipes-3',
        title: 'Chef da Semana',
        description: 'Cozinhe 3 receitas diferentes nesta semana.',
        goal: 3,
        type: 'weekly',
        reward: MISSION_REWARDS.WEEKLY,
        getCurrentProgress: (context: AppContextType) => {
             const startOfWeek = getStartOfWeek();
             const recentLogs = context.mealLog.filter(log => log.timestamp >= startOfWeek);
             const uniqueRecipes = new Set(recentLogs.map(log => log.recipeTitle));
             return uniqueRecipes.size;
        },
    },
    {
        id: 'healthy-routine-3',
        title: 'Rotina Saudável',
        description: 'Registre refeições em 3 dias diferentes da semana.',
        goal: 3,
        type: 'weekly',
        reward: MISSION_REWARDS.WEEKLY,
        getCurrentProgress: (context: AppContextType) => {
            const startOfWeek = getStartOfWeek();
            const recentLogs = context.mealLog.filter(log => log.timestamp >= startOfWeek);
            const uniqueDays = new Set(
                recentLogs.map(log => new Date(log.timestamp).toDateString())
            );
            return uniqueDays.size;
        },
    },
    {
        id: 'clean-week-1',
        title: 'Semana Limpa',
        description: 'Cozinhe 1 receita sem ingredientes ultraprocessados.',
        goal: 1,
        type: 'weekly',
        reward: MISSION_REWARDS.WEEKLY,
        getCurrentProgress: (context: AppContextType) => {
            const startOfWeek = getStartOfWeek();
            return context.mealLog.filter(log =>
                log.timestamp >= startOfWeek &&
                log.novaBreakdown?.ultra_processed === 0
            ).length;
        }
    }
];

export const ALL_MISSIONS = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS];

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first-item',
        title: 'Primeiro Passo',
        description: 'Adicione seu primeiro item à despensa!',
        icon: Leaf,
        isUnlocked: (context) => context.pantry.length > 0,
    },
    {
        id: 'first-recipe',
        title: 'Mestre Cuca',
        description: 'Salve sua primeira receita no livro!',
        icon: CookingPot,
        isUnlocked: (context) => context.savedRecipes.length > 0,
    },
    {
        id: 'healthy-choice',
        title: 'Escolha Saudável',
        description: 'Sua despensa tem mais itens saudáveis do que ultraprocessados.',
        icon: HeartHandshake,
        isUnlocked: (context) => {
            if (context.pantry.length === 0) return false;
            const inNatura = context.pantry.filter(i => i.novaClassification === 'in_natura' || i.novaClassification === 'culinary_ingredients').length;
            const ultra = context.pantry.filter(i => i.novaClassification === 'ultra_processed').length;
            return inNatura > ultra;
        },
    },
    {
        id: 'pantry-pro',
        title: 'Organizador Pro',
        description: 'Tenha 25 itens diferentes na despensa.',
        icon: CheckSquare,
        isUnlocked: (context) => context.pantry.length >= 25,
    },
    {
        id: 'first-post',
        title: 'Momento Criativo',
        description: 'Faça sua primeira publicação no Feed.',
        icon: Camera,
        isUnlocked: (context) => context.feedPosts.some(p => p.authorName === context.user?.displayName),
    },
    {
        id: 'tip-reader',
        title: 'Jovem Sábio',
        description: 'Leia 5 "Dicas do Nutri".',
        icon: BookOpen,
        isUnlocked: (context) => context.pantry.filter(i => i.tipRead).length >= 5,
    },
    {
        id: 'daily-mission-1',
        title: 'Ritmo Diário',
        description: 'Complete sua primeira missão diária.',
        icon: Sun,
        isUnlocked: (context) => context.userProfile?.dailyMission.completed ?? false, // Needs better tracking
    },
    {
        id: 'weekly-mission-1',
        title: 'Maratonista',
        description: 'Complete sua primeira missão semanal.',
        icon: Calendar,
        isUnlocked: (context) => context.userProfile?.weeklyMission.completed ?? false, // Needs better tracking
    }
];