
import { useState, useEffect, useCallback, useRef } from 'react';
import { db, increment } from '../firebase/config';
import type { User, UserProfile, PantryItem, XpNoticeInfo, MissionProgress } from '../types';
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

const getNewMissions = (
  existingMissionIds: string[],
  allMissions: typeof DAILY_MISSIONS | typeof WEEKLY_MISSIONS,
  count: number
): { id: string, completed: boolean, lastReset: number }[] => {
  const now = Date.now();
  const availableMissions = allMissions.filter(m => !existingMissionIds.includes(m.id));
  
  // Shuffle available missions
  for (let i = availableMissions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableMissions[i], availableMissions[j]] = [availableMissions[j], availableMissions[i]];
  }

  return availableMissions.slice(0, count).map(mission => ({
    id: mission.id,
    completed: false,
    lastReset: now,
  }));
};

export const useGamification = (user: User | null) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [xpNotice, setXpNotice] = useState<XpNoticeInfo | null>(null);
  const [levelUpInfo, setLevelUpInfo] = useState<LevelUpInfo | null>(null);
  const [dailyCheckCompleted, setDailyCheckCompleted] = useState(false);

  const userProfileRef = useRef(userProfile);
  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);


  const awardXp = useCallback(async (xp: number, reason: string) => {
    if (!user || !userProfileRef.current || xp === 0) return;
    
    const oldXp = userProfileRef.current.xp || 0;
    const newXp = Math.max(0, oldXp + xp);
    const { level: oldLevel } = getLevelForXp(oldXp);
    const { level: newLevel } = getLevelForXp(newXp);

    const userDocRef = db.collection('users').doc(user.uid);
    await userDocRef.update({
      xp: newXp,
      level: newLevel,
    });
    
    setXpNotice({ id: Date.now(), xpGained: xp, reason, oldXp, newXp });

    if (newLevel > oldLevel) {
      setLevelUpInfo({ oldLevel, newLevel });
    }
  }, [user]);

  const runDailyChecks = useCallback(async (profile: UserProfile) => {
    if (!user) return;
    const now = Date.now();
    const userDocRef = db.collection('users').doc(user.uid);
    const updates: Partial<UserProfile> = {};

    // --- Streak Logic ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastLoginDate = new Date(profile.lastLogin || 0);
    lastLoginDate.setHours(0, 0, 0, 0);
    
    let newStreak = profile.streak || 0;

    if (today.getTime() !== lastLoginDate.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLoginDate.getTime() === yesterday.getTime()) {
        newStreak++;
        updates.streak = newStreak;
      } else {
        newStreak = 1;
        updates.streak = 1;
      }
      updates.lastLogin = today.getTime();
      
      if (newStreak > 1) {
        awardXp(5 * newStreak, `${newStreak} dias de ofensiva!`);
      }
    }

    // --- Daily Missions Reset ---
    const activeDailyMissions = profile.dailyMissions.filter(m => isSameDay(m.lastReset, now));
    if (activeDailyMissions.length < 2) {
      const existingIds = activeDailyMissions.map(m => m.id);
      const missionsToAdd = 2 - activeDailyMissions.length;
      updates.dailyMissions = [...activeDailyMissions, ...getNewMissions(existingIds, DAILY_MISSIONS, missionsToAdd)];
    }

    // --- Weekly Missions Reset ---
    const activeWeeklyMissions = profile.weeklyMissions.filter(m => isSameWeek(m.lastReset, now));
     if (activeWeeklyMissions.length < 2) {
      const existingIds = activeWeeklyMissions.map(m => m.id);
      const missionsToAdd = 2 - activeWeeklyMissions.length;
      updates.weeklyMissions = [...activeWeeklyMissions, ...getNewMissions(existingIds, WEEKLY_MISSIONS, missionsToAdd)];
    }

    if (Object.keys(updates).length > 0) {
      await userDocRef.update(updates);
    }
  }, [user, awardXp]);

  // Handle data listening and migration
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setIsLoadingProfile(false);
      setDailyCheckCompleted(false); // Reset on logout
      return;
    }
    
    setIsLoadingProfile(true);
    const userDocRef = db.collection('users').doc(user.uid);

    const unsubscribe = userDocRef.onSnapshot((docSnapshot) => {
      if (docSnapshot.exists) {
        const data = docSnapshot.data() as UserProfile;
        
        let profileToProcess: UserProfile = { ...data };
        let needsMigrationUpdate = false;
        
        if (data.dailyMission && !data.dailyMissions) {
            profileToProcess.dailyMissions = [data.dailyMission];
            delete profileToProcess.dailyMission;
            needsMigrationUpdate = true;
        }
         if (data.weeklyMission && !data.weeklyMissions) {
            profileToProcess.weeklyMissions = [data.weeklyMission];
            delete profileToProcess.weeklyMission;
            needsMigrationUpdate = true;
        }

        const profileWithDefaults: UserProfile = {
            ...profileToProcess,
            xp: profileToProcess.xp ?? 0,
            level: profileToProcess.level ?? 1,
            goldenCarrots: profileToProcess.goldenCarrots ?? 0,
            dailyMissions: profileToProcess.dailyMissions ?? [],
            weeklyMissions: profileToProcess.weeklyMissions ?? [],
            streak: profileToProcess.streak ?? 0,
            lastLogin: profileToProcess.lastLogin ?? 0,
        };

        setUserProfile(profileWithDefaults);
        
        if (needsMigrationUpdate) {
            const { dailyMission, weeklyMission, ...restOfProfile } = profileWithDefaults;
            userDocRef.update(restOfProfile);
        }

        if (!dailyCheckCompleted && profileWithDefaults.onboardingCompleted) {
          runDailyChecks(profileWithDefaults);
          setDailyCheckCompleted(true);
        }

      } else {
         setUserProfile({
          onboardingCompleted: false,
          xp: 0,
          level: 1,
          goldenCarrots: 0,
          dailyMissions: [],
          weeklyMissions: [],
          streak: 0,
          lastLogin: 0,
        });
      }
      setIsLoadingProfile(false);
    }, (error) => {
        console.error("Error fetching user profile:", error);
        setIsLoadingProfile(false);
    });

    return () => unsubscribe();
  }, [user, runDailyChecks, dailyCheckCompleted]);
  
  const awardGoldenCarrots = useCallback(async (amount: number, reason: string) => {
    if (!user || amount <= 0) return;
    const userDocRef = db.collection('users').doc(user.uid);
    await userDocRef.update({
        goldenCarrots: increment(amount)
    });
    // This uses the XP notice system to show a "carrot" notice.
    // We can create a separate notice system for carrots if needed.
    // For now, let's just show a toast-like message in the console.
    console.log(`Awarded ${amount} Golden Carrots for: ${reason}`);
  }, [user]);

  const claimMissionReward = useCallback(async (missionId: string) => {
      if (!user || !userProfile) return;
      const userDocRef = db.collection('users').doc(user.uid);

      let missionType: 'daily' | 'weekly' | null = null;
      let missionReward = 0;
      let missionTitle = '';

      const newDailyMissions = userProfile.dailyMissions.map(m => {
          if (m.id === missionId) {
              const missionDef = DAILY_MISSIONS.find(def => def.id === missionId);
              if (missionDef) {
                missionType = 'daily';
                missionReward = missionDef.reward;
                missionTitle = missionDef.title;
                return { ...m, completed: true };
              }
          }
          return m;
      });

      const newWeeklyMissions = userProfile.weeklyMissions.map(m => {
           if (m.id === missionId) {
                const missionDef = WEEKLY_MISSIONS.find(def => def.id === missionId);
                if (missionDef) {
                    missionType = 'weekly';
                    missionReward = missionDef.reward;
                    missionTitle = missionDef.title;
                    return { ...m, completed: true };
                }
          }
          return m;
      });

      if (missionType) {
        await userDocRef.update({
            dailyMissions: newDailyMissions,
            weeklyMissions: newWeeklyMissions
        });
        await awardGoldenCarrots(missionReward, `Missão Concluída: ${missionTitle}`);
      }
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
    const itemDocRef = db.collection('users').doc(user.uid).collection('pantry').doc(itemId);
    await itemDocRef.update({ tipRead: true });
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
