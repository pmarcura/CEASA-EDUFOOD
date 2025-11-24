import type { PantryItem } from '../types';

export const LEVEL_THRESHOLDS = [
    0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000, // Levels 1-10
];

export const ACTION_XP_VALUES = {
    NEW_IN_NATURA: 15,
    NEW_CULINARY: 10,
    NEW_PROCESSED: 2, // Reduced reward
    NEW_ULTRAPROCESSED: -10, // Increased penalty
    READ_TIP: 10,
    RECIPE_STEP: 5,
    RECIPE_COMPLETION: 50,
    RECIPE_FEEDBACK: 20,
    HEALTHY_EDIT: 25,
    PANTRY_REVIEW_UPDATE: 5,
    PANTRY_REVIEW_KEEP: 1,
    PANTRY_REVIEW_REMOVE: 2,
    PANTRY_REVIEW_BONUS: 20,
};

export const MISSION_REWARDS = {
    DAILY: 25,
    WEEKLY: 100,
};

export const getLevelForXp = (xp: number) => {
    let level = 1;
    // Find the current level based on XP thresholds
    while (level < LEVEL_THRESHOLDS.length && xp >= LEVEL_THRESHOLDS[level]) {
        level++;
    }
    // Adjust because levels are 1-based and arrays are 0-based
    level = Math.min(level, LEVEL_THRESHOLDS.length);

    const xpForCurrentLevelStart = LEVEL_THRESHOLDS[level - 1];
    const xpForNextLevelStart = LEVEL_THRESHOLDS[level] ?? xp;
    
    const xpInCurrentLevel = xp - xpForCurrentLevelStart;
    const xpForNextLevel = xpForNextLevelStart - xpForCurrentLevelStart;

    return {
        level,
        xp,
        xpInCurrentLevel,
        xpForNextLevel,
    };
};

export const getXpForNewItem = (novaClassification: PantryItem['novaClassification']): { xp: number, reason: string } => {
    switch (novaClassification) {
        case 'in_natura':
            return { xp: ACTION_XP_VALUES.NEW_IN_NATURA, reason: 'Alimento In Natura' };
        case 'culinary_ingredients':
            return { xp: ACTION_XP_VALUES.NEW_CULINARY, reason: 'Ingrediente Culinário' };
        case 'processed':
            return { xp: ACTION_XP_VALUES.NEW_PROCESSED, reason: 'Alimento Processado' };
        case 'ultra_processed':
            return { xp: ACTION_XP_VALUES.NEW_ULTRAPROCESSED, reason: 'Ultraprocessado' };
        default:
            return { xp: 0, reason: '' };
    }
};