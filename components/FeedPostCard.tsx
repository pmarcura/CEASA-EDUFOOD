
import React, { useContext, useMemo } from 'react';
import type { FeedPost, SuccessTag } from '../types';
import { Heart, MessageSquare, ChefHat, Ghost, Sparkles, Smile, Trophy, Box, CheckCircle2, ShoppingCart } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import StarRating from './StarRating';

interface FeedPostCardProps {
    post: FeedPost;
}

const SUCCESS_TAG_CONFIG: Record<SuccessTag, { label: string, icon: React.ElementType, color: string }> = {
    'hidden_veggies': { label: 'Legumes Escondidos', icon: Ghost, color: 'bg-purple-100 text-purple-700' },
    'fun_story': { label: 'História Lúdica', icon: Sparkles, color: 'bg-yellow-100 text-yellow-700' },
    'texture_win': { label: 'Aceitou Textura', icon: Smile, color: 'bg-blue-100 text-blue-700' },
    'first_time': { label: 'Provou 1ª Vez', icon: Trophy, color: 'bg-green-100 text-green-700' },
    'lunchbox': { label: 'Lancheira', icon: Box, color: 'bg-orange-100 text-orange-700' },
};

const FeedPostCard: React.FC<FeedPostCardProps> = ({ post }) => {
    const context = useContext(AppContext);
    
    if (!context || !context.user) return null;

    const { handleLikePost, setViewingRecipe, user, pantry } = context;

    const isLiked = post.likedBy.includes(user.uid);
    const hasRecipe = !!post.recipe;
    const hasComments = post.comments && post.comments.length > 0;
    const latestComment = hasComments ? post.comments![post.comments!.length - 1] : null;

    const successTag = post.successType ? SUCCESS_TAG_CONFIG[post.successType] : null;

    // Calculate Pantry Match
    const pantryMatch = useMemo(() => {
        if (!post.recipe || pantry.length === 0) return null;
        const recipeIngredients = post.recipe.ingredients.flatMap(s => s.items.map(i => i.name.toLowerCase()));
        if (recipeIngredients.length === 0) return 0;

        const pantryNames = new Set(pantry.map(i => i.name.toLowerCase()));
        // Simple matching logic (contains)
        let matchCount = 0;
        recipeIngredients.forEach(ing => {
            if ([...pantryNames].some((pItem: string) => ing.includes(pItem) || pItem.includes(ing))) {
                matchCount++;
            }
        });
        return Math.round((matchCount / recipeIngredients.length) * 100);
    }, [post.recipe, pantry]);

    return (
        <div className="bg-white rounded-3xl shadow-edu overflow-hidden animate-fade-in border border-gray-100 mb-6">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={post.authorAvatar} alt={post.authorName} className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" />
                    <div>
                        <span className="font-bold text-sm text-brand-text block leading-tight">{post.authorName}</span>
                        <span className="text-xs text-brand-text-secondary">compartilhou uma vitória</span>
                    </div>
                </div>
                {successTag && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${successTag.color}`}>
                        <successTag.icon size={12} />
                        {successTag.label}
                    </div>
                )}
            </div>
            
            {/* Image */}
            <div className="relative">
                <img src={post.image} alt="Foto do prato" className="w-full h-auto max-h-96 object-cover bg-gray-50" />
                
                {/* Pantry Match Badge (Floating) - Only if recipe exists */}
                {hasRecipe && pantryMatch !== null && (
                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                        {pantryMatch >= 80 ? (
                            <CheckCircle2 size={16} className="text-green-500" />
                        ) : (
                            <ShoppingCart size={16} className="text-orange-500" />
                        )}
                        <span className={`text-xs font-bold ${pantryMatch >= 80 ? 'text-green-700' : 'text-brand-text'}`}>
                            {pantryMatch}% da Despensa
                        </span>
                    </div>
                )}
            </div>
            
            <div className="p-4 space-y-3">
                {/* Actions Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleLikePost(post.id)} className="flex items-center gap-1.5 group">
                            <Heart 
                                size={26} 
                                className={`transition-all duration-200 group-hover:scale-110 ${isLiked ? 'text-red-500 fill-current' : 'text-brand-text-secondary hover:text-red-400'}`} 
                            />
                            <span className="text-sm font-semibold text-brand-text-secondary">{post.likes > 0 ? post.likes : ''}</span>
                        </button>
                        <div className="flex items-center gap-1.5 text-brand-text-secondary">
                            <MessageSquare size={26} />
                            <span className="text-sm font-semibold">{post.comments?.length || ''}</span>
                        </div>
                    </div>
                    
                    {/* Cook Button - Only if recipe exists */}
                    {hasRecipe && (
                        <button 
                            onClick={() => setViewingRecipe(post.recipe!)}
                            className="bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-full shadow-md hover:bg-brand-dark transition-transform transform active:scale-95 flex items-center gap-2"
                        >
                            <ChefHat size={16} />
                            Replicar Receita
                        </button>
                    )}
                </div>
                
                {/* Caption */}
                <div className="text-sm text-brand-text leading-relaxed">
                    <span className="font-bold mr-1.5">{post.authorName}</span>
                    {post.caption}
                </div>

                {/* Latest Comment (Condensed) */}
                {latestComment && (
                    <div className="pt-2 mt-1 border-t border-gray-50">
                        <p className="text-xs text-brand-text-secondary truncate">
                            <span className="font-bold text-brand-text mr-1">{latestComment.authorName}</span>
                            {latestComment.text}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedPostCard;
