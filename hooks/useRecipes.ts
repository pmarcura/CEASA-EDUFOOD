import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, getDocs, addDoc, writeBatch, doc } from '@firebase/firestore';
import { db } from '../firebase/config';
import type { Recipe, MealLogEntry, MealFeedback, PantryItem, UserProfile } from '../types';
import { POINTS_CONFIG } from '../helpers/gamification';

// Fix: A required parameter cannot follow an optional parameter. Made `userProfile` optional.
export const useRecipes = (userId?: string, pantry: PantryItem[] = [], userProfile?: UserProfile | null) => {
    const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
    const [mealLog, setMealLog] = useState<MealLogEntry[]>([]);

    useEffect(() => {
        if (!userId) {
            setSavedRecipes([]);
            setMealLog([]);
            return;
        }

        const recipesRef = collection(db, 'users', userId, 'savedRecipes');
        const recipesUnsub = onSnapshot(recipesRef, (snapshot) => {
            const recipeData = snapshot.docs.map(doc => ({ ...doc.data() })) as Recipe[];
            setSavedRecipes(recipeData);
        }, (error) => console.error("Firestore error in saved recipes listener:", error));

        const mealLogRef = collection(db, 'users', userId, 'mealLog');
        const mealLogUnsub = onSnapshot(mealLogRef, (snapshot) => {
            const logData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MealLogEntry[];
            setMealLog(logData.sort((a, b) => b.timestamp - a.timestamp));
        }, (error) => console.error("Firestore error in meal log listener:", error));

        return () => {
            recipesUnsub();
            mealLogUnsub();
        };
    }, [userId]);

    const saveRecipe = useCallback(async (recipeToSave: Recipe) => {
        if (!userId) return;
        const recipesRef = collection(db, 'users', userId, 'savedRecipes');
        const q = query(recipesRef, where("title", "==", recipeToSave.title));
        const existing = await getDocs(q);
        if (existing.empty) {
            await addDoc(recipesRef, recipeToSave);
        }
    }, [userId]);

    const logMealCompletion = useCallback(async (recipe: Recipe, feedback: MealFeedback, imageUrl?: string) => {
        if (!userId || !userProfile) return;

        try {
            const batch = writeBatch(db);
            const userDocRef = doc(db, 'users', userId);

            // 1. Log the meal
            const mealLogRef = collection(db, 'users', userId, 'mealLog');
            const newLogEntry: Omit<MealLogEntry, 'id'> = {
                recipeTitle: recipe.title,
                timestamp: Date.now(),
                feedback,
                serves: recipe.serves,
                ...(imageUrl && { imageUrl }),
            };
            batch.set(doc(mealLogRef), newLogEntry);

            // 2. Deduct ingredients from pantry
            const ingredientsToDeduct = new Map<string, { quantity: number, unit: string }>();
            recipe.ingredients.flatMap(section => section.items).forEach(ing => {
                const key = `${ing.name.toLowerCase()}|${ing.unit}`;
                const existing = ingredientsToDeduct.get(key) || { quantity: 0, unit: ing.unit };
                ingredientsToDeduct.set(key, { ...existing, quantity: existing.quantity + ing.quantity });
            });
            
            const pantryRef = collection(db, 'users', userId, 'pantry');
            ingredientsToDeduct.forEach((ingData, key) => {
                const [name] = key.split('|');
                const matchingPantryItem = pantry.find(p => p.name.toLowerCase() === name && p.unit === ingData.unit);
                
                if (matchingPantryItem) {
                    const itemRef = doc(pantryRef, matchingPantryItem.id);
                    const newQuantity = matchingPantryItem.quantity - ingData.quantity;
                    if (newQuantity <= 0) {
                        batch.delete(itemRef);
                    } else {
                        batch.update(itemRef, { quantity: newQuantity });
                    }
                }
            });

            // 3. Update user points
            let pointsEarned = POINTS_CONFIG.COOK_RECIPE;
            if (imageUrl) pointsEarned += POINTS_CONFIG.FEEDBACK_WITH_PHOTO;
            
            const newTotalPoints = (userProfile.points || 0) + pointsEarned;
            batch.update(userDocRef, { points: newTotalPoints });

            await batch.commit();

        } catch (error) {
            console.error("Error in logMealCompletion:", error);
            throw error; // re-throw to be caught by caller
        }
    }, [userId, pantry, userProfile]);

    return { savedRecipes, saveRecipe, mealLog, logMealCompletion };
};