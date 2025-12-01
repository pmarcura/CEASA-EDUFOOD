
import { db, increment } from '../firebase/config';
import firebase from 'firebase/compat/app';
import type { AppNotification, NotificationType, UserProfile } from '../types';

// Helper to create a notification object
const createNotification = (
    senderUid: string,
    senderName: string,
    senderAvatar: string,
    type: NotificationType,
    content: string,
    data?: any
): Omit<AppNotification, 'id' | 'recipientUid'> => ({
    senderUid,
    senderName,
    senderAvatar,
    type,
    content,
    timestamp: Date.now(),
    read: false,
    // FIX: Firestore throws error on 'undefined'. We must use 'null' or spread conditionally.
    data: data || null 
});

// --- Friend Management ---

export const sendFriendRequest = async (currentUser: firebase.User, targetUid: string) => {
    if (!currentUser) return;

    // Create a notification for the target user
    const notificationData = createNotification(
        currentUser.uid,
        currentUser.displayName || 'Usuário',
        currentUser.photoURL || '/professor-nutri.png',
        'friend_request',
        'enviou um pedido de amizade.'
    );

    await db.collection('notifications').add({
        ...notificationData,
        recipientUid: targetUid
    });
};

export const acceptFriendRequest = async (currentUser: firebase.User, notification: AppNotification) => {
    if (!currentUser) return;

    const batch = db.batch();

    // 1. Add sender to current user's friend list
    const currentUserRef = db.collection('users').doc(currentUser.uid);
    batch.update(currentUserRef, {
        friends: firebase.firestore.FieldValue.arrayUnion(notification.senderUid)
    });

    // 2. Add current user to sender's friend list
    const senderUserRef = db.collection('users').doc(notification.senderUid);
    batch.update(senderUserRef, {
        friends: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
    });

    // 3. Mark notification as read (or delete it)
    const notificationRef = db.collection('notifications').doc(notification.id);
    batch.delete(notificationRef); 

    // 4. Send a "Accepted" notification back to the sender
    const confirmNotification = createNotification(
        currentUser.uid,
        currentUser.displayName || 'Usuário',
        currentUser.photoURL || '/professor-nutri.png',
        'friend_request', // Using same type, logic will handle display
        'aceitou seu pedido de amizade!',
        { isAcceptance: true } // Pass data explicitly here
    );

    const newNotifRef = db.collection('notifications').doc();
    batch.set(newNotifRef, {
        ...confirmNotification,
        recipientUid: notification.senderUid
    });

    await batch.commit();
};

// --- Broadcasters (Fan-out) ---

export const notifyFriends = async (
    currentUser: firebase.User, 
    userProfile: UserProfile,
    type: NotificationType, 
    content: string,
    data?: any
) => {
    if (!userProfile.friends || userProfile.friends.length === 0) return;

    const friends = userProfile.friends;
    const batch = db.batch();

    friends.forEach(friendUid => {
        const ref = db.collection('notifications').doc();
        const notification = {
            recipientUid: friendUid,
            ...createNotification(
                currentUser.uid,
                currentUser.displayName || 'Usuário',
                currentUser.photoURL || '/professor-nutri.png',
                type,
                content,
                data
            )
        };
        batch.set(ref, notification);
    });

    await batch.commit();
};
