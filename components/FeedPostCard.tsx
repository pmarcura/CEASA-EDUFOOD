
import React, { useState, useContext, useMemo } from 'react';
import type { FeedPost } from '../types';
import { Heart, MessageCircle, Send, ChefHat } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';

interface FeedPostCardProps {
    post: FeedPost;
}

const formatTimeAgo = (timestamp: FeedPost['createdAt']) => {
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

const FeedPostCard: React.FC<FeedPostCardProps> = ({ post }) => {
    const context = useContext(AppContext);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    
    const currentUser = context?.user;
    const isLiked = useMemo(() => currentUser ? post.likes.includes(currentUser.uid) : false, [post.likes, currentUser]);

    const handleLike = () => {
        context?.toggleLikePost(post.id);
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            context?.addCommentToPost(post.id, newComment.trim());
            setNewComment('');
        }
    };

    return (
        <div className="bg-brand-surface rounded-2xl shadow-edu overflow-hidden">
            <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={post.authorAvatar} alt={post.authorName} className="h-10 w-10 rounded-full object-cover" />
                    <span className="font-bold text-brand-text text-sm">{post.authorName}</span>
                </div>
                <span className="text-xs text-brand-text-secondary">{formatTimeAgo(post.createdAt)}</span>
            </div>
            
            <img src={post.image} alt="Foto do prato" className="w-full aspect-square object-cover" />
            
            <div className="p-3">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={handleLike} className="flex items-center gap-1.5 text-brand-text-secondary hover:text-red-500 transition-colors">
                        <Heart size={24} className={isLiked ? 'text-red-500 fill-current' : ''} />
                    </button>
                    <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-brand-text-secondary hover:text-brand-text transition-colors">
                        <MessageCircle size={24} />
                    </button>
                </div>

                {post.likes.length > 0 && <p className="text-sm font-semibold text-brand-text mb-2">{post.likes.length} curtida{post.likes.length > 1 && 's'}</p>}
                
                <p className="text-sm text-brand-text-secondary">
                    <span className="font-bold text-brand-text mr-1.5">{post.authorName}</span>
                    {post.caption}
                </p>

                {post.recipe && (
                    <button 
                        onClick={() => context?.setViewingRecipe(post.recipe!)}
                        className="w-full mt-2 bg-brand-primary/10 text-brand-primary font-bold py-2 px-3 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-brand-primary/20"
                    >
                        <ChefHat className="mr-2" size={16} />
                        Ver Receita Completa
                    </button>
                )}

                {showComments && (
                    <div className="mt-3 space-y-2">
                         <div className="border-t border-brand-border pt-2 space-y-2 max-h-40 overflow-y-auto">
                            {post.comments.length > 0 ? post.comments.map(comment => (
                                <div key={comment.id} className="text-sm flex items-start gap-2">
                                    <img src={comment.authorAvatar} className="h-6 w-6 rounded-full mt-0.5" />
                                    <p className="bg-gray-100 px-2 py-1 rounded-lg">
                                        <span className="font-bold text-brand-text mr-1.5">{comment.authorName}</span>
                                        {comment.text}
                                    </p>
                                </div>
                            )) : <p className="text-xs text-center text-brand-text-secondary">Nenhum comentário ainda.</p>}
                        </div>
                        <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-brand-border">
                            <img src={currentUser?.photoURL || '/avatars/avatar-user.jpg'} className="h-7 w-7 rounded-full" />
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Adicione um comentário..."
                                className="flex-grow bg-gray-100 border-none rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                            <button type="submit" className="text-brand-primary font-semibold text-sm disabled:text-gray-400" disabled={!newComment.trim()}>
                                <Send size={20}/>
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedPostCard;
