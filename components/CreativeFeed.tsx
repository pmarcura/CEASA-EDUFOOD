
import React, { useContext, useState, useCallback } from 'react';
import { AppContext } from '../contexts/AppContext';
import { generateCreativeSuggestion } from '../services/geminiService';
import { Plus, Sparkles, LoaderCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import FeedPostCard from './FeedPostCard';

const CreativeFeed: React.FC = () => {
    const context = useContext(AppContext);
    const [suggestion, setSuggestion] = useState<{ title: string; description: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'liked' | 'disliked' | null>(null);

    const handleGenerateSuggestion = useCallback(async () => {
        if (!context || isLoading) return;
        setIsLoading(true);
        setError(null);
        setSuggestion(null);
        setFeedback(null);

        try {
            const healthyItems = context.pantry
                .filter(item => item.riskLevel === 'Baixo')
                .map(item => item.name);
            
            if (healthyItems.length < 2) {
                setError("Preciso de pelo menos 2 ingredientes saudáveis na sua despensa para criar uma sugestão mágica!");
                setIsLoading(false);
                return;
            }

            const result = await generateCreativeSuggestion(healthyItems);
            setSuggestion(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Não consegui pensar em nada... que tal tentar de novo?');
        } finally {
            setIsLoading(false);
        }
    }, [context, isLoading]);
    
    const handleAddPost = () => {
        // This is a mock post to demonstrate functionality
        context?.addPostToFeed({
            authorName: 'Você',
            authorAvatar: '/avatars/avatar-user.jpg',
            image: '/dishes/dish-3.jpg',
            caption: 'Fiz um lanche super divertido hoje e a criançada adorou! 🍓🐻',
        });
    };

    if (!context) return null;
    const { feedPosts } = context;

    return (
        <div className="relative">
            <div className="bg-brand-surface p-4 rounded-2xl shadow-edu mb-6">
                <div className="flex items-start">
                    <img src="/professor-nutri.png" alt="Chef Nutri" className="h-12 w-12 rounded-full mr-4" />
                    <div>
                        <h2 className="text-xl font-bold text-brand-text">Chef Nutri Criativo</h2>
                        <p className="text-sm text-brand-text-secondary">Sem ideias? Deixe-me criar algo divertido com o que você tem na despensa!</p>
                    </div>
                </div>
                <button 
                    onClick={handleGenerateSuggestion} 
                    disabled={isLoading}
                    className="w-full mt-4 bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors hover:bg-brand-dark disabled:bg-gray-400 disabled:opacity-70"
                >
                    {isLoading ? (
                        <LoaderCircle className="animate-spin mr-2" />
                    ) : (
                        <Sparkles className="mr-2" />
                    )}
                    {isLoading ? 'Pensando...' : 'Gerar Sugestão Criativa'}
                </button>
                {suggestion && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
                        <h3 className="font-bold text-brand-primary">{suggestion.title}</h3>
                        <p className="text-sm text-brand-text">{suggestion.description}</p>
                        <div className="flex justify-center gap-3 mt-3">
                            <button onClick={() => setFeedback('liked')} className={`p-2 rounded-full transition-colors ${feedback === 'liked' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-brand-text-secondary'}`}>
                                <ThumbsUp size={18} />
                            </button>
                             <button onClick={() => setFeedback('disliked')} className={`p-2 rounded-full transition-colors ${feedback === 'disliked' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-brand-text-secondary'}`}>
                                <ThumbsDown size={18} />
                            </button>
                        </div>
                    </div>
                )}
                {error && <p className="mt-4 text-sm text-red-600 bg-red-100 p-2 rounded-lg text-center">{error}</p>}
            </div>

            <div className="space-y-4">
                {feedPosts.map(post => (
                    <FeedPostCard key={post.id} post={post} />
                ))}
            </div>

            <button
                onClick={handleAddPost}
                className="fixed bottom-28 right-4 w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform hover:bg-brand-dark"
                aria-label="Adicionar novo post"
            >
                <Plus size={32} />
            </button>
        </div>
    );
};

export default CreativeFeed;
