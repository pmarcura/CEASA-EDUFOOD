
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, LoaderCircle, Camera } from 'lucide-react';

import { AppContext } from '../../contexts/AppContext';
import RecipeCard from './RecipeCard';
import AnalysisProgressCard from './AnalysisProgressCard';
import ItemVerificationCard from './ItemVerificationCard';

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


const ProfessorNutriChat: React.FC = () => {
    const context = useContext(AppContext);
    const [userInput, setUserInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!context) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoaderCircle className="animate-spin" />
            </div>
        );
    }

    const {
        chatHistory,
        isProcessing,
        sendMessage,
        handleImageSend,
        handleQuickReply,
        handleItemsConfirmed,
    } = context;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isProcessing]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isProcessing) return;
        sendMessage(userInput);
        setUserInput('');
    };
    
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isProcessing) return;
        
        try {
            const imageDataUrl = await fileToDataURL(file);
            handleImageSend(imageDataUrl, file);
        } catch(error) {
            console.error("Error converting file to data URL", error)
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col h-full bg-brand-background">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg) => {
                    const isModelOrSystem = msg.role === 'model' || msg.role === 'system';
                    return (
                        <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                           {isModelOrSystem && <img src="/professor-nutri.png" alt="Professor Nutri" className="h-8 w-8 rounded-full flex-shrink-0 self-end" />}
                           <div className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.imageUrl && (
                                    <div className="mb-1 max-w-xs">
                                        <img src={msg.imageUrl} alt="Nota fiscal enviada" className="rounded-lg border-2 border-brand-primary/50 shadow-md" />
                                    </div>
                                )}
                                {msg.text && (
                                     <div className={`max-w-[85%] sm:max-w-md p-2.5 px-3.5 rounded-xl ${msg.role === 'user' ? 'bg-brand-text text-white rounded-br-none' : msg.role === 'system' ? 'bg-green-50 text-brand-text w-full text-center italic' : 'bg-brand-surface text-brand-text rounded-bl-none border border-brand-border'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                )}
                                {msg.recipes && (
                                    <div className="w-full max-w-md space-y-2 mt-2">
                                        {msg.recipes.map((recipe, i) => (
                                           <RecipeCard key={i} recipe={recipe} />
                                        ))}
                                    </div>
                                )}
                                {msg.quickReplies && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {msg.quickReplies.map(reply => (
                                            <button key={reply} onClick={() => handleQuickReply(reply)} className="px-3 py-1.5 text-sm bg-brand-surface border border-brand-border text-brand-text-secondary rounded-full hover:bg-gray-100">
                                                {reply}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {msg.analysis && <AnalysisProgressCard analysis={msg.analysis} />}
                                {msg.itemVerification && <ItemVerificationCard verificationState={msg.itemVerification} onConfirm={(items) => handleItemsConfirmed(msg.id, items)} />}
                           </div>
                           {msg.role === 'user' && <div className="w-8 flex-shrink-0"></div>}
                        </div>
                    );
                })}
                {isProcessing && (
                     <div className="flex gap-2.5 flex-row">
                        <img src="/professor-nutri.png" alt="Professor Nutri" className="h-8 w-8 rounded-full flex-shrink-0" />
                        <div className="bg-brand-surface text-brand-text rounded-bl-none self-start border border-brand-border p-2.5 px-3.5 rounded-xl flex items-center">
                            <LoaderCircle className="animate-spin h-5 w-5 text-brand-primary" />
                        </div>
                     </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="p-2.5 bg-brand-background/90 backdrop-blur-sm border-t border-brand-border">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Adicione sua lista de compras..."
                        className="flex-grow p-2.5 px-4 bg-brand-surface border border-brand-border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-sm text-brand-text placeholder:text-brand-text-secondary"
                        disabled={isProcessing}
                    />
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="bg-brand-surface border border-brand-border text-brand-text-secondary p-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-200 shadow-sm"
                        aria-label="Enviar imagem da nota fiscal"
                    >
                       <Camera className="h-5 w-5" />
                    </button>
                    <button
                        type="submit"
                        disabled={isProcessing || !userInput.trim()}
                        className="bg-brand-primary text-white p-2.5 rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors duration-200 shadow-lg flex-shrink-0"
                        aria-label="Enviar mensagem"
                    >
                        {isProcessing ? <LoaderCircle className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfessorNutriChat;
