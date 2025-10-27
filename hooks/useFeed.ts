

import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/config';
import type { FeedPost, Comment, User, UserProfile, Recipe } from '../types';
import { POINTS_CONFIG } from '../helpers/gamification';

export const useFeed = (user: User | null, userProfile: UserProfile | null) => {
    const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);

    useEffect(() => {
        const feedRef = collection(db, 'feed');
        const q = query(feedRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const feedData = snapshot.docs.map(doc => {
                const data = doc.data();
                
                const rawLikes = data.likes;
                const likes = Array.isArray(rawLikes) ? rawLikes : [];

                const rawComments = data.comments;
                const comments = Array.isArray(rawComments) ? rawComments.map((c: any) => ({
                    id: c.id || `${c.authorId || 'unknown'}-${c.timestamp || 0}`,
                    authorId: c.authorId || '',
                    authorName: c.authorName || 'Usuário',
                    authorAvatar: c.authorAvatar || '/professor-nutri.png',
                    text: c.text || '',
                    timestamp: c.timestamp || 0,
                })) : [];

                return {
                    id: doc.id,
                    authorId: data.authorId || '',
                    authorName: data.authorName || 'Usuário Anônimo',
                    authorAvatar: data.authorAvatar || '/professor-nutri.png',
                    image: data.image || '',
                    caption: data.caption || '',
                    likes: likes,
                    comments: comments,
                    createdAt: data.createdAt, // This is handled safely by formatTimeAgo
                    recipe: data.recipe || undefined,
                } as FeedPost;
            });
            setFeedPosts(feedData);
        }, (error) => console.error("Firestore error in feed listener:", error));

        return () => unsubscribe();
    }, []);

    const createPost = useCallback(async (postData: { caption: string; image: string; recipe?: Recipe }) => {
        if (!user || !userProfile) throw new Error("Usuário não autenticado.");

        const { caption, image: imageDataUrl, recipe } = postData;
        
        // 1. Upload image to Storage
        const storage = getStorage();
        const imageRef = ref(storage, `feed_images/${user.uid}_${Date.now()}`);
        const uploadResult = await uploadString(imageRef, imageDataUrl, 'data_url');
        const imageUrl = await getDownloadURL(uploadResult.ref);

        // 2. Create post document in Firestore
        const newPost: Omit<FeedPost, 'id'> = {
            authorId: user.uid,
            authorName: user.displayName || 'Usuário EduFood',
            authorAvatar: user.photoURL || '/avatars/avatar-user.jpg',
            image: imageUrl,
            caption,
            likes: [],
            comments: [],
            createdAt: serverTimestamp(),
            ...(recipe && { recipe }),
        };
        await addDoc(collection(db, 'feed'), newPost);

        // 3. Award points
        const userDocRef = doc(db, 'users', user.uid);
        const pointsEarned = recipe ? POINTS_CONFIG.CREATE_POST_WITH_RECIPE : POINTS_CONFIG.CREATE_POST;
        await updateDoc(userDocRef, { points: (userProfile.points || 0) + pointsEarned });

    }, [user, userProfile]);

    const toggleLikePost = useCallback(async (postId: string) => {
        if (!user || !userProfile) return;

        const postRef = doc(db, 'feed', postId);
        const userDocRef = doc(db, 'users', user.uid);

        await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) throw "Post não encontrado!";

            const postData = postDoc.data() as FeedPost;
            const currentPoints = userProfile.points || 0;

            if (postData.likes.includes(user.uid)) {
                transaction.update(postRef, { likes: arrayRemove(user.uid) });
            } else {
                transaction.update(postRef, { likes: arrayUnion(user.uid) });
                transaction.update(userDocRef, { points: currentPoints + POINTS_CONFIG.LIKE_POST });
            }
        });
    }, [user, userProfile]);

    const addCommentToPost = useCallback(async (postId: string, text: string) => {
        if (!user || !userProfile) return;

        const postRef = doc(db, 'feed', postId);
        const newComment: Comment = {
            id: `${user.uid}-${Date.now()}`,
            authorId: user.uid,
            authorName: user.displayName || 'Usuário EduFood',
            authorAvatar: user.photoURL || '/avatars/avatar-user.jpg',
            text,
            timestamp: Date.now(),
        };
        
        await updateDoc(postRef, { comments: arrayUnion(newComment) });

        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { points: (userProfile.points || 0) + POINTS_CONFIG.COMMENT_ON_POST });
        
    }, [user, userProfile]);

    return useMemo(() => ({ feedPosts, createPost, toggleLikePost, addCommentToPost }),
        [feedPosts, createPost, toggleLikePost, addCommentToPost]);
};