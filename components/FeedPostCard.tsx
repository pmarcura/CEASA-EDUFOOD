
import React, { useContext } from 'react';
import type { FeedPost } from '../types';
import { Heart, MessageSquare } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import StarRating from './StarRating';

interface FeedPostCardProps {
    post: FeedPost;
}

const FeedPostCard: React.FC<FeedPostCardProps> = ({ post }) => {
    const context = useContext(AppContext);
    
    if (!context || !context.user) return null;

    const { handleLikePost, setViewingRecipe, user } = context;

    const isLiked = post.likedBy.includes(user.uid);
    const hasRecipe = !!post.recipe;
    const hasComments = post.comments && post.comments.length > 0;
    const latestComment = hasComments ? post.comments![post.comments!.length - 1] : null;

    return (
        <div className="bg-brand-surface rounded-xl shadow-edu overflow-hidden animate-fade-in border border-brand-border">
            {/* Header */}
            <div className="p-3 flex items-center gap-3">
                <img src={post.authorAvatar} alt={post.authorName} className="h-8 w-8 rounded-full object-cover" />
                <span className="font-bold text-sm text-brand-text">{post.authorName}</span>
            </div>
            
            {/* Image */}
            <img src={post.image} alt="Foto do prato" className="w-full h-auto bg-gray-100" />
            
            <div className="p-3 space-y-2">
                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button onClick={() => handleLikePost(post.id)} className="flex items-center gap-1.5 group">
                        <Heart 
                            size={24} 
                            className={`transition-all duration-200 group-hover:text-red-500 group-hover:scale-110 ${isLiked ? 'text-red-500 fill-current' : 'text-brand-text-secondary'}`} 
                        />
                    </button>
                    <div className="flex items-center gap-1.5 text-brand-text-secondary">
                        <MessageSquare size={24} />
                        <span className="text-sm font-semibold">{post.comments?.length || 0}</span>
                    </div>
                </div>
                
                {/* Likes */}
                {post.likes > 0 && (
                    <p className="text-sm font-bold text-brand-text">{post.likes} curtida{post.likes !== 1 ? 's' : ''}</p>
                )}
                
                {/* Caption */}
                <p className="text-sm text-brand-text">
                    <span className="font-bold text-brand-text mr-1.5">{post.authorName}</span>
                    {post.caption}
                </p>

                {/* Latest Comment */}
                {latestComment && (
                    <div className="pt-2 mt-2 border-t border-brand-border">
                         {post.comments!.length > 1 && (
                            <p className="text-xs text-brand-text-secondary font-semibold mb-1.5">Ver todos os {post.comments!.length} comentários</p>
                        )}
                        <div className="flex items-start gap-2">
                             <img src={latestComment.authorAvatar} alt={latestComment.authorName} className="h-6 w-6 rounded-full object-cover mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">{latestComment.authorName}</span>
                                    <StarRating rating={latestComment.rating} size={14} />
                                </div>
                                <p className="text-sm text-brand-text-secondary">{latestComment.text}</p>
                                {latestComment.image && <img src={latestComment.image} alt="comentário do usuário" className="mt-2 rounded-lg max-w-full h-auto w-24 h-24 object-cover" />}
                            </div>
                        </div>
                    </div>
                )}

                {/* Recipe Button */}
                {hasRecipe && (
                    <button 
                        onClick={() => setViewingRecipe(post.recipe!)}
                        className="text-sm font-semibold text-brand-text-secondary hover:text-brand-text transition-colors mt-2"
                    >
                        Ver receita
                    </button>
                )}
            </div>
        </div>
    );
};

export default FeedPostCard;