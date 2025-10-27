
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from '@firebase/auth';
import { doc, onSnapshot, setDoc } from '@firebase/firestore';
import { auth, db } from '../firebase/config';
import type { User, UserProfile } from '../types';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setUserProfile(null);
                setIsLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) {
            return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
            } else {
                setUserProfile({ onboardingCompleted: false });
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Firestore error in user profile listener:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
        if (!user) return;
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, data, { merge: true });
        } catch (error) {
            console.error("Error updating user profile:", error);
        }
    }, [user]);

    const logout = useCallback(async () => {
        await signOut(auth);
    }, []);

    return { user, userProfile, isLoading, updateUserProfile, logout };
};
