import React, { useState, useContext } from 'react';
import type { FeedPost } from '../types';
import { Sparkles, Palette, Lightbulb, ChefHat } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';

interface FeedPostCardProps {
    post: FeedPost;
}

type ReactionType = 'inspiring' | 'colorful' | 'creative';

const FeedPostCard: React.FC<FeedPostCardProps> = ({ post }) => {
    const context = useContext(AppContext);
    const [reactions, setReactions] = useState(post.reactions);
    const [activeReaction, setActiveReaction] = useState<ReactionType | null>(null);

    const handleReaction = (type: ReactionType) => {
        if (activeReaction === type) {
            // Un-react
            setReactions(prev => ({ ...prev, [type]: prev[type] - 1 }));
            setActiveReaction(null);
        } else {
            let newReactions = { ...reactions };
            if (activeReaction) {
                // Switch reaction
                newReactions[activeReaction]--;
            }
            newReactions[type]++;
            setReactions(newReactions);
            setActiveReaction(type);
        }
    };
    
    const reactionConfig = [
        { type: 'inspiring' as ReactionType, icon: Sparkles, label: 'Inspirador' },
        { type: 'colorful' as ReactionType, icon: Palette, label: 'Colorido' },
        { type: 'creative' as ReactionType, icon: Lightbulb, label: 'Criativo' },
    ];
    
    const hasRecipe = post.recipe;

    return (
        <div className="bg-brand-surface rounded-2xl shadow-edu overflow-hidden">
            <div className="p-4 flex items-center gap-3">
                <img src={post.authorAvatar} alt={post.authorName} className="h-10 w-10 rounded-full object-cover" />
                <span className="font-bold text-brand-text">{post.authorName}</span>
            </div>
            
            <img src={post.image} alt="Foto do prato" className="w-full h-auto" />
            
            <div className="p-4">
                <p className="text-sm text-brand-text-secondary mb-4">{post.caption}</p>
                
                {hasRecipe && (
                    <button 
                        onClick={() => context?.setViewingRecipe(post.recipe!)}
                        className="w-full mb-4 bg-brand-primary/10 text-brand-primary font-bold py-2 px-4 rounded-xl flex items-center justify-center transition-colors hover:bg-brand-primary/20"
                    >
                        <ChefHat className="mr-2" size={18} />
                        Ver Receita Completa
                    </button>
                )}

                <div className="flex justify-around items-center border-t border-brand-border pt-3">
                    {reactionConfig.map(({ type, icon: Icon, label }) => {
                        const isActive = activeReaction === type;
                        return (
                             <button
                                key={type}
                                onClick={() => handleReaction(type)}
                                className={`flex items-center gap-2 text-sm transition-colors ${isActive ? 'text-brand-primary font-bold' : 'text-brand-text-secondary hover:text-brand-primary'}`}
                             >
                                <Icon size={18} className={`${isActive ? 'fill-current' : ''}`} />
                                <span>{reactions[type]}</span>
                             </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default FeedPostCard;