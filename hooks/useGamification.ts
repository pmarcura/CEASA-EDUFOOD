import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { User, UserProfile, PantryItem, XpNoticeInfo } from '../types';
import { getLevelForXp, getXpForNewItem, ACTION_XP_VALUES, MISSION_REWARDS } from '../services/gamificationService';
import { DAILY_MISSIONS, WEEKLY_MISSIONS } from '../constants/missions';

export interface LevelUpInfo {
  oldLevel: number;
  newLevel: number;
}

const isSameDay = (ts1: number, ts2: number) => {
    const d1 = new Date(ts1);
    const d2 = new Date(ts2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const isSameWeek = (ts1: number, ts2: number) => {
    const d1 = new Date(ts1);
    const d2 = new Date(ts2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    // Sunday in current week decides the start of the week
    const day1 = d1.getDay();
    const day2 = d2.getDay();
    const startOfWeek1 = new Date(d1.getTime() - day1 * 24 * 60 * 60 * 1000);
    const startOfWeek2 = new Date(d2.getTime() - day2 * 24 * 60 * 60 * 1000);
    return startOfWeek1.getTime() === startOfWeek2.getTime();
};

export const useGamification = (user: User | null) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [xpNotice, setXpNotice] = useState<XpNoticeInfo | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);

  // Mission Reset Logic
  const checkAndResetMissions = useCallback(async (profile: UserProfile) => {
    if (!user) return;
    const now = Date.now();
    const userDocRef = doc(db, 'users', user.uid);
    const updates: Partial<UserProfile> = {};

    // Check Daily Mission
    if (!profile.dailyMission || !isSameDay(profile.dailyMission.lastReset, now)) {
        const newDailyMission = DAILY_MISSIONS[Math.floor(Math.random() * DAILY_MISSIONS.length)];
        updates.dailyMission = {
            id: newDailyMission.id,
            completed: false,
            lastReset: now
        };
    }

    // Check Weekly Mission
    if (!profile.weeklyMission || !isSameWeek(profile.weeklyMission.lastReset, now)) {
         const newWeeklyMission = WEEKLY_MISSIONS[Math.floor(Math.random() * WEEKLY_MISSIONS.length)];
        updates.weeklyMission = {
            id: newWeeklyMission.id,
            completed: false,
            lastReset: now
        };
    }
    
    if (Object.keys(updates).length > 0) {
        await updateDoc(userDocRef, updates);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setIsLoadingProfile(false);
      return;
    }
    
    setIsLoadingProfile(true);
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserProfile;
        // Ensure default values for gamification fields
        const profileWithDefaults: UserProfile = {
          ...data,
          xp: data.xp ?? 0,
          level: data.level ?? 1,
          goldenCarrots: data.goldenCarrots ?? 0,
          dailyMission: data.dailyMission ?? { id: 'add-in-natura-1', completed: true, lastReset: 0 },
          weeklyMission: data.weeklyMission ?? { id: 'cook-recipes-3', completed: true, lastReset: 0 },
        };
        setUserProfile(profileWithDefaults);
        checkAndResetMissions(profileWithDefaults); // Check for resets after loading
      } else {
        setUserProfile({
          onboardingCompleted: false,
          xp: 0,
          level: 1,
          goldenCarrots: 0,
          dailyMission: { id: 'add-in-natura-1', completed: true, lastReset: 0 },
          weeklyMission: { id: 'cook-recipes-3', completed: true, lastReset: 0 },
        });
      }
      setIsLoadingProfile(false);
    }, (error) => {
        console.error("Error fetching user profile:", error);
        setIsLoadingProfile(false);
    });

    return () => unsubscribe();
  }, [user, checkAndResetMissions]);

  const awardXp = useCallback(async (xp: number, reason: string) => {
    if (!user || !userProfile || xp === 0) return;
    
    const oldXp = userProfile.xp || 0;
    const newXp = oldXp + xp;
    const { level: oldLevel } = getLevelForXp(oldXp);
    const { level: newLevel } = getLevelForXp(newXp);

    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      xp: newXp,
      level: newLevel,
    });
    
    setXpNotice({ id: Date.now(), xpGained: xp, reason, oldXp, newXp });

    if (newLevel > oldLevel) {
      setLevelUpInfo({ oldLevel, newLevel });
    }
  }, [user, userProfile]);
  
  const awardGoldenCarrots = useCallback(async (amount: number) => {
    if (!user || amount <= 0) return;
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
        goldenCarrots: increment(amount)
    });
  }, [user]);

  const claimMissionReward = useCallback(async (type: 'daily' | 'weekly') => {
      if (!user || !userProfile) return;
      const missionField = type === 'daily' ? 'dailyMission' : 'weeklyMission';
      const missionReward = type === 'daily' ? MISSION_REWARDS.DAILY : MISSION_REWARDS.WEEKLY;

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
          [`${missionField}.completed`]: true
      });
      await awardGoldenCarrots(missionReward);
  }, [user, userProfile, awardGoldenCarrots]);


  const awardXpForNewItem = useCallback((item: Omit<PantryItem, 'id'>) => {
    const { xp, reason } = getXpForNewItem(item.novaClassification);
    if (xp !== 0) {
      awardXp(xp, reason);
    }
  }, [awardXp]);
  
  const awardXpForRecipeCompletion = useCallback(() => {
    awardXp(ACTION_XP_VALUES.RECIPE_COMPLETION, 'Receita Concluída!');
  }, [awardXp]);

  const markTipAsRead = useCallback(async (itemId: string) => {
    if (!user) return;
    const itemDocRef = doc(db, 'users', user.uid, 'pantry', itemId);
    await updateDoc(itemDocRef, { tipRead: true });
    awardXp(ACTION_XP_VALUES.READ_TIP, 'Dica do Nutri lida!');
  }, [user, awardXp]);

  const removeXpNotice = useCallback(() => {
    setXpNotice(null);
  }, []);

  const closeLevelUpModal = useCallback(() => {
    setLevelUpInfo(null);
  }, []);

  return {
    userProfile,
    isLoadingProfile,
    awardXp,
    awardGoldenCarrots,
    claimMissionReward,
    awardXpForNewItem,
    awardXpForRecipeCompletion,
    markTipAsRead,
    xpNotice,
    removeXpNotice,
    levelUpInfo,
    closeLevelUpModal,
  };
};