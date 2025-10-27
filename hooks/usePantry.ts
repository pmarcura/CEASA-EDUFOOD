

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, onSnapshot, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { PantryItem } from '../types';

export const usePantry = (userId?: string) => {
    const [pantry, setPantry] = useState<PantryItem[]>([]);

    useEffect(() => {
        if (!userId) {
            setPantry([]);
            return;
        }

        const pantryRef = collection(db, 'users', userId, 'pantry');
        const unsubscribe = onSnapshot(pantryRef, (snapshot) => {
            const pantryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PantryItem[];
            setPantry(pantryData);
        }, (error) => {
            console.error("Firestore error in pantry listener:", error);
        });

        return () => unsubscribe();
    }, [userId]);

    const addItemsToPantry = useCallback(async (newItems: Omit<PantryItem, 'id'>[]) => {
        if (!userId) return;
        const pantryRef = collection(db, 'users', userId, 'pantry');
        
        for (const newItem of newItems) {
            const q = query(pantryRef, where("name", "==", newItem.name), where("unit", "==", newItem.unit));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const existingDoc = querySnapshot.docs[0];
                const newQuantity = existingDoc.data().quantity + newItem.quantity;
                await updateDoc(existingDoc.ref, { quantity: newQuantity });
            } else {
                await addDoc(pantryRef, newItem);
            }
        }
    }, [userId]);

    const removeItemFromPantry = useCallback(async (itemId: string) => {
        if (!userId) return;
        const itemRef = doc(db, 'users', userId, 'pantry', itemId);
        await deleteDoc(itemRef);
    }, [userId]);

    const updatePantryItemQuantity = useCallback(async (itemId: string, newQuantity: number) => {
        if (!userId) return;
        const itemRef = doc(db, 'users', userId, 'pantry', itemId);
        await updateDoc(itemRef, { quantity: Math.max(0, newQuantity) });
    }, [userId]);

    const updatePantryItemDetails = useCallback(async (itemId: string, updates: Partial<Omit<PantryItem, 'id'>>) => {
        if (!userId) return;
        const itemRef = doc(db, 'users', userId, 'pantry', itemId);
        await updateDoc(itemRef, updates);
    }, [userId]);

    return useMemo(() => ({ pantry, addItemsToPantry, removeItemFromPantry, updatePantryItemQuantity, updatePantryItemDetails }),
        [pantry, addItemsToPantry, removeItemFromPantry, updatePantryItemQuantity, updatePantryItemDetails]);
};