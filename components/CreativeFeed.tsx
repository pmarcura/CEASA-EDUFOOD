

import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Plus, Heart, Sparkles, Utensils, Search } from 'lucide-react';
import FeedPostCard from './FeedPostCard';
import CreatePostModal from './modals/CreatePostModal';
import type { FeedPost } from '../types';

type SortMode = 'for_you' | 'popular' | 'pantry';

const calculatePantryMatch = (post: FeedPost, pantryNames: Set<string>): number => {
    if (!post.recipe) return -1; 
    const recipeIngredients = new Set(post.recipe.ingredients.flatMap(s => s.items.map(i => i.name.toLowerCase())));
    if (recipeIngredients.size === 0) return 0;

    let matchCount = 0;
    recipeIngredients.forEach(ing => {
        // Simple fuzzy match check
        if ([...pantryNames].some(pItem => ing.includes(pItem) || pItem.includes(ing))) {
            matchCount++;
        }
    });

    return (matchCount / recipeIngredients.size) * 100;
};

const CreativeFeed: React.FC = () => {
    const context = useContext(AppContext);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>('for_you');

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
            case 'for_you':
            default:
                return posts.sort((a, b) => b.timestamp - a.timestamp);
        }
    }, [context?.feedPosts, sortMode, pantryItemNames]);

    if (!context) return null;

    const sortOptions: { id: SortMode, label: string, icon: React.ElementType }[] = [
        { id: 'for_you', label: 'Para Você', icon: Sparkles },
        { id: 'pantry', label: 'Da Despensa', icon: Utensils },
        { id: 'popular', label: 'Populares', icon: Heart },
    ];

    return (
        <div className="relative pb-24">
            <div className="sticky top-0 z-10 bg-brand-background/95 backdrop-blur-md py-2 -mx-5 px-5 border-b border-gray-100/50">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {sortOptions.map(option => (
                         <button
                            key={option.id}
                            onClick={() => setSortMode(option.id)}
                            className={`flex-shrink-0 flex items-center gap-2 text-sm font-bold py-2 px-4 rounded-full transition-all border ${
                                sortMode === option.id
                                    ? 'bg-brand-text text-white border-brand-text shadow-md'
                                    : 'bg-white text-brand-text-secondary border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <option.icon size={14} />
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-4 space-y-6">
                {sortedFeed.map(post => (
                    <FeedPostCard key={post.id} post={post} />
                ))}
                
                {sortedFeed.length === 0 && (
                    <div className="text-center py-12 px-6">
                        <div className="bg-white p-4 rounded-full inline-block mb-4 shadow-sm">
                            <Search size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-brand-text">Nenhum post encontrado</h3>
                        <p className="text-brand-text-secondary text-sm mt-1">Seja o primeiro a compartilhar uma vitória!</p>
                    </div>
                )}
            </div>

            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed bottom-24 right-4 w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-primary/30 transform hover:scale-110 transition-all hover:bg-brand-dark z-30"
                aria-label="Adicionar novo post"
            >
                <Plus size={28} />
            </button>
            
            {isCreateModalOpen && <CreatePostModal onClose={() => setIsCreateModalOpen(false)} />}
        </div>
    );
};

export default CreativeFeed;