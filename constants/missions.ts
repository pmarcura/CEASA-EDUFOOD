import type { Mission, Achievement, AppContextType } from '../types';
import { Leaf, CookingPot, HeartHandshake, BookOpen, Star, Camera, CheckSquare, Sun, Calendar } from 'lucide-react';
import { MISSION_REWARDS } from '../services/gamificationService';

export const DAILY_MISSIONS: Mission[] = [
    {
        id: 'add-in-natura-2',
        title: 'Natureza no Prato',
        description: 'Adicione 2 itens "In Natura" à despensa.',
        goal: 2,
        type: 'daily',
        reward: MISSION_REWARDS.DAILY,
        getCurrentProgress: (context: AppContextType) => {
             const startOfToday = new Date();
             startOfToday.setHours(0, 0, 0, 0);
             // This is a proxy. A real implementation would track additions by day.
             // For now, we'll count how many in natura items exist.
             return context.pantry.filter(i => i.novaClassification === 'in_natura').length;
        },
    },
    {
        id: 'read-tip-1',
        title: 'Leitura Nutritiva',
        description: 'Leia 1 "Dica do Nutri" de qualquer item.',
        goal: 1,
        type: 'daily',
        reward: MISSION_REWARDS.DAILY,
        getCurrentProgress: (context: AppContextType) => {
            return context.pantry.filter(i => i.tipRead).length;
        }
    },
    {
        id: 'log-meal-1',
        title: 'Diário de Bordo',
        description: 'Registre 1 refeição feita hoje.',
        goal: 1,
        type: 'daily',
        reward: MISSION_REWARDS.DAILY,
        getCurrentProgress: (context: AppContextType) => {
             const startOfToday = new Date();
             startOfToday.setHours(0, 0, 0, 0);
             return context.mealLog.filter(log => log.timestamp >= startOfToday.getTime()).length;
        }
    },
];

export const WEEKLY_MISSIONS: Mission[] = [
    {
        id: 'cook-recipes-3',
        title: 'Chef da Semana',
        description: 'Cozinhe 3 receitas diferentes.',
        goal: 3,
        type: 'weekly',
        reward: MISSION_REWARDS.WEEKLY,
        getCurrentProgress: (context: AppContextType) => {
             const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
             const recentLogs = context.mealLog.filter(log => log.timestamp >= oneWeekAgo);
             return new Set(recentLogs.map(log => log.recipeTitle)).size;
        },
    },
    {
        id: 'healthy-pantry-75',
        title: 'Despensa de Elite',
        description: 'Alcance 75% de "Comida de Verdade" na despensa.',
        goal: 75,
        type: 'weekly',
        reward: MISSION_REWARDS.WEEKLY,
        getCurrentProgress: (context: AppContextType) => {
            if (context.pantry.length === 0) return 0;
            const healthyCount = context.pantry.filter(i => i.novaClassification === 'in_natura' || i.novaClassification === 'culinary_ingredients').length;
            return Math.round((healthyCount / context.pantry.length) * 100);
        },
    },
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