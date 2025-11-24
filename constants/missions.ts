
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
        reward: 5, // Carrots
        getCurrentProgress: (context: AppContextType) => {
             const startOfToday = getStartOfToday();
             return context.mealLog.filter(log => log.timestamp >= startOfToday).length;
        }
    },
    {
        id: 'read-tip-1',
        title: 'Leitura Nutritiva',
        description: 'Leia 1 "Dica do Nutri" de um item da despensa.',
        goal: 1,
        type: 'daily',
        reward: 2, // Carrots
        getCurrentProgress: (context: AppContextType) => {
            const startOfToday = getStartOfToday();
            // This is a proxy - we can't easily track which tip was read when.
            // We check if ANY tip was read. A more robust solution would require logging tip reads with timestamps.
            return context.pantry.filter(item => item.tipRead).length > 0 ? 1 : 0;
        }
    },
    {
        id: 'add-in-natura-2',
        title: 'Caçador de Rótulos',
        description: 'Adicione 2 itens in natura à sua despensa.',
        goal: 2,
        type: 'daily',
        reward: 5, // Carrots
        // This is tricky without tracking when items were added. We'll check the current count as a proxy.
        getCurrentProgress: (context: AppContextType) => {
            return context.pantry.filter(i => i.novaClassification === 'in_natura').length;
        }
    },
    {
        id: 'cook-easy-recipe-1',
        title: 'Pequeno Chef',
        description: 'Cozinhe 1 receita de nível "Fácil".',
        goal: 1,
        type: 'daily',
        reward: 10, // Carrots
        getCurrentProgress: (context: AppContextType) => {
            const startOfToday = getStartOfToday();
            // This assumes recipe details are available. In this app, they are attached to feed posts.
            const cookedRecipeTitles = new Set(context.mealLog.filter(log => log.timestamp >= startOfToday).map(log => log.recipeTitle));
            let easyRecipesCooked = 0;
            context.feedPosts.forEach(post => {
                if (post.recipe && post.recipe.level === 'Fácil' && cookedRecipeTitles.has(post.recipe.title)) {
                    easyRecipesCooked++;
                }
            });
            // Also check saved recipes if possible
            context.savedRecipes.forEach(recipe => {
                 if (recipe.level === 'Fácil' && cookedRecipeTitles.has(recipe.title)) {
                    easyRecipesCooked++;
                }
            })
            return easyRecipesCooked;
        }
    },
    {
        id: 'rate-meal-1',
        title: 'Crítico Culinário',
        description: 'Avalie 1 refeição com estrelas e comentário.',
        goal: 1,
        type: 'daily',
        reward: 5, // Carrots
        getCurrentProgress: (context: AppContextType) => {
            const startOfToday = getStartOfToday();
            return context.mealLog.filter(log => log.timestamp >= startOfToday && log.feedbackRating > 0 && !!log.feedbackText).length;
        }
    },
];

export const WEEKLY_MISSIONS: Mission[] = [
    {
        id: 'log-meal-3-days',
        title: 'Rotina Saudável',
        description: 'Registre refeições em 3 dias diferentes da semana.',
        goal: 3,
        type: 'weekly',
        reward: 25, // Carrots
        getCurrentProgress: (context: AppContextType) => {
            const startOfWeek = getStartOfWeek();
            const mealDays = new Set(
                context.mealLog
                    .filter(log => log.timestamp >= startOfWeek)
                    .map(log => new Date(log.timestamp).toDateString())
            );
            return mealDays.size;
        }
    },
    {
        id: 'cook-recipes-3',
        title: 'Mestre Cuca da Semana',
        description: 'Cozinhe 3 receitas diferentes.',
        goal: 3,
        type: 'weekly',
        reward: 30, // Carrots
        getCurrentProgress: (context: AppContextType) => {
            const startOfWeek = getStartOfWeek();
            const uniqueRecipes = new Set(
                context.mealLog
                    .filter(log => log.timestamp >= startOfWeek)
                    .map(log => log.recipeTitle)
            );
            return uniqueRecipes.size;
        }
    },
    {
        id: 'no-ultraprocessed-meal-1',
        title: 'Semana Limpa',
        description: 'Cozinhe 1 receita sem usar ultraprocessados.',
        goal: 1,
        type: 'weekly',
        reward: 20, // Carrots
        getCurrentProgress: (context: AppContextType) => {
            const startOfWeek = getStartOfWeek();
            return context.mealLog.filter(log => log.timestamp >= startOfWeek && log.novaBreakdown?.ultra_processed === 0).length;
        }
    },
     {
        id: 'pantry-variety-5',
        title: 'Orgulho da Horta',
        description: 'Tenha 5 tipos de vegetais ou frutas na despensa.',
        goal: 5,
        type: 'weekly',
        reward: 15, // Carrots
        getCurrentProgress: (context: AppContextType) => {
            return context.pantry.filter(item => item.codexCategory === 'Frutas e vegetais').length;
        }
    },
    {
        id: 'post-on-feed-1',
        title: 'Chef Social',
        description: 'Poste uma criação sua no Feed da comunidade.',
        goal: 1,
        type: 'weekly',
        reward: 20, // Carrots
        getCurrentProgress: (context: AppContextType) => {
            const startOfWeek = getStartOfWeek();
            return context.feedPosts.filter(post => post.timestamp >= startOfWeek && post.authorName === (context.user?.displayName || 'Usuário')).length;
        }
    }
];

// Combine all missions for easier lookup
export const ALL_MISSIONS = [...DAILY_MISSIONS, ...WEEKLY_MISSIONS];


export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first-pantry',
        title: 'Despensa Cheia',
        description: 'Adicione seus primeiros 10 itens na despensa.',
        icon: Leaf,
        isUnlocked: (context) => context.pantry.length >= 10
    },
    {
        id: 'first-recipe',
        title: 'Pequeno Chef',
        description: 'Cozinhe sua primeira receita do app.',
        icon: CookingPot,
        isUnlocked: (context) => context.mealLog.length > 0
    },
    {
        id: 'first-feedback',
        title: 'Crítico Culinário',
        description: 'Deixe sua primeira avaliação em uma receita.',
        icon: Star,
        isUnlocked: (context) => context.mealLog.some(log => log.feedbackRating > 0)
    },
    {
        id: 'read-5-tips',
        title: 'Mente Sã',
        description: 'Leia 5 Dicas do Nutri diferentes.',
        icon: BookOpen,
        isUnlocked: (context) => context.pantry.filter(item => item.tipRead).length >= 5
    },
    {
        id: 'healthy-week',
        title: 'Semana Saudável',
        description: 'Registre refeições em 5 dias de uma semana.',
        icon: Calendar,
        isUnlocked: (context) => {
            const startOfWeek = getStartOfWeek();
            const mealDays = new Set(
                context.mealLog
                    .filter(log => log.timestamp >= startOfWeek)
                    .map(log => new Date(log.timestamp).toDateString())
            );
            return mealDays.size >= 5;
        }
    },
     {
        id: 'first-post',
        title: 'Chef Social',
        description: 'Faça sua primeira postagem no feed.',
        icon: Camera,
        isUnlocked: (context) => context.feedPosts.some(p => p.authorName === (context.user?.displayName || 'Usuário'))
    },
];
