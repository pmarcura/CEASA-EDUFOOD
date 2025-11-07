
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Plus, Heart, Clock, Utensils } from 'lucide-react';
import FeedPostCard from './FeedPostCard';
import CreatePostModal from './modals/CreatePostModal';
import type { FeedPost } from '../types';

type SortMode = 'recent' | 'popular' | 'pantry';

const calculatePantryMatch = (post: FeedPost, pantryNames: Set<string>): number => {
    if (!post.recipe) return -1; // Posts without recipes are sorted last
    const recipeIngredients = new Set(post.recipe.ingredients.flatMap(s => s.items.map(i => i.name.toLowerCase())));
    if (recipeIngredients.size === 0) return 0;

    let matchCount = 0;
    recipeIngredients.forEach(ing => {
        if (pantryNames.has(ing)) {
            matchCount++;
        }
    });

    return (matchCount / recipeIngredients.size) * 100;
};

const CreativeFeed: React.FC = () => {
    const context = useContext(AppContext);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>('recent');

    const pantryItemNames = useMemo(() => {
        if (!context) return new Set<string>();
        return new Set(context.pantry.map(item => item.name.toLowerCase()));
    }, [context?.pantry]);

    const sortedFeed = useMemo(() => {
        if (!context) return [];
        const posts = [...context.feedPosts];

        switch (sortMode) {
            case 'popular':
                return posts.sort((a, b) => b.likes - a.likes);
            case 'pantry':
                return posts.sort((a, b) => {
                    const scoreA = calculatePantryMatch(a, pantryItemNames);
                    const scoreB = calculatePantryMatch(b, pantryItemNames);
                    return scoreB - scoreA;
                });
            case 'recent':
            default:
                return posts.sort((a, b) => b.timestamp - a.timestamp);
        }
    }, [context?.feedPosts, sortMode, pantryItemNames]);

    if (!context) return null;

    const sortOptions: { id: SortMode, label: string, icon: React.ElementType }[] = [
        { id: 'recent', label: 'Recentes', icon: Clock },
        { id: 'popular', label: 'Populares', icon: Heart },
        { id: 'pantry', label: 'Da Despensa', icon: Utensils },
    ];

    return (
        <div className="relative">
            <div className="flex gap-2 mb-4 bg-brand-surface p-1 rounded-full border border-brand-border">
                {sortOptions.map(option => (
                     <button
                        key={option.id}
                        onClick={() => setSortMode(option.id)}
                        className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2 px-3 rounded-full transition-colors ${
                            sortMode === option.id
                                ? 'bg-brand-primary text-white shadow'
                                : 'text-brand-text-secondary hover:bg-gray-100'
                        }`}
                    >
                        <option.icon size={16} />
                        <span>{option.label}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {sortedFeed.map(post => (
                    <FeedPostCard key={post.id} post={post} />
                ))}
            </div>

            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed bottom-24 right-4 w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform hover:bg-brand-dark"
                aria-label="Adicionar novo post"
            >
                <Plus size={28} />
            </button>
            
            {isCreateModalOpen && <CreatePostModal onClose={() => setIsCreateModalOpen(false)} />}
        </div>
    );
};

export default CreativeFeed;
