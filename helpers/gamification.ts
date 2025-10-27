
import type { UserProfile } from '../types';

export const POINTS_CONFIG = {
  COOK_RECIPE: 10,
  FEEDBACK_WITH_PHOTO: 15, // Bonus points
  CREATE_POST: 10,
  CREATE_POST_WITH_RECIPE: 25,
  LIKE_POST: 1,
  COMMENT_ON_POST: 2,
};

export const LEVELS = [
  { level: 1, points: 0, title: 'Novato(a) Nutri' },
  { level: 2, points: 50, title: 'Aprendiz da Cozinha' },
  { level: 3, points: 150, title: 'Aventureiro(a) Culinário' },
  { level: 4, points: 300, title: 'Mestre dos Temperos' },
  { level: 5, points: 500, title: 'Chef de Família' },
  { level: 6, points: 1000, title: 'Mestre Cuca' },
];

export const calculateLevelInfo = (points: number) => {
  let currentLevelInfo = LEVELS[0];
  let nextLevelInfo = LEVELS[1];

  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].points) {
      currentLevelInfo = LEVELS[i];
      if (i + 1 < LEVELS.length) {
        nextLevelInfo = LEVELS[i + 1];
      } else {
        // Max level
        nextLevelInfo = { ...LEVELS[i], points: LEVELS[i].points };
      }
    } else {
      break; // Found the correct level range
    }
  }

  const pointsInCurrentLevel = points - currentLevelInfo.points;
  const pointsForNextLevel = nextLevelInfo.points - currentLevelInfo.points;
  
  const progressPercentage = (pointsForNextLevel > 0) 
    ? Math.min((pointsInCurrentLevel / pointsForNextLevel) * 100, 100) 
    : 100;

  return {
    ...currentLevelInfo,
    nextLevelPoints: nextLevelInfo.points,
    progressPercentage,
    pointsForNextLevel,
    pointsInCurrentLevel,
  };
};
