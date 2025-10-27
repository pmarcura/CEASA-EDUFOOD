
import type { FeedPost } from '../types';

export const formatTimeAgo = (timestamp: FeedPost['createdAt']) => {
    if (!timestamp || typeof (timestamp as any).toDate !== 'function') {
        return 'agora';
    }
    const date = (timestamp as any).toDate();
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 5) return "agora";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "a";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
};
