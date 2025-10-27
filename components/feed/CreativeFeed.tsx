
import React, { useContext, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { Plus } from 'lucide-react';
import FeedPostCard from './FeedPostCard';
import CreatePostModal from './CreatePostModal';

const CreativeFeed: React.FC = () => {
    const context = useContext(AppContext);
    const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

    if (!context) return null;
    const { feedPosts } = context;

    return (
        <div className="relative pb-16">
            {isCreatePostOpen && <CreatePostModal onClose={() => setIsCreatePostOpen(false)} />}

            {feedPosts.length === 0 ? (
                <div className="text-center text-brand-text-secondary mt-10">
                    <h2 className="text-xl font-bold text-brand-text mb-2">O feed está vazio!</h2>
                    <p>Seja o primeiro a compartilhar uma criação culinária.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {feedPosts.map(post => (
                        <FeedPostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
           
            <button
                onClick={() => setIsCreatePostOpen(true)}
                className="fixed bottom-20 right-4 w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform hover:bg-brand-dark"
                aria-label="Adicionar novo post"
            >
                <Plus size={28} />
            </button>
        </div>
    );
};

export default CreativeFeed;
