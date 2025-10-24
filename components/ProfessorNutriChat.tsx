import React, { useState, useContext, useRef, useEffect } from 'react';
import { Send, LoaderCircle } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { processShoppingList, enrichFoodItemsBatch, generateRecipes } from '../services/geminiService';
import type { PantryItem, Recipe, AnalysisState } from '../types';
import RecipeChatCard from './RecipeChatCard';
import AnalysisProgressCard from './AnalysisProgressCard';


const ProfessorNutriChat: React.FC = () => {
    const context = useContext(AppContext);
    const [userInput, setUserInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [context?.chatHistory, isProcessing]);

    if (!context) return null;
    const { 
        pantry, addItemsToPantry, addMessageToChat, chatHistory, 
        saveRecipe, savedRecipes, clearChatQuickReplies, updateLastMessageAnalysis
    } = context;
    
    const isRecipeSaved = (recipeTitle: string) => savedRecipes.some(r => r.title === recipeTitle);

    const handleGenerateRecipes = async () => {
        setIsProcessing(true);
        addMessageToChat({ role: 'model', text: 'Ótima ideia! Deixe-me ver o que posso criar com os ingredientes saudáveis que você tem...' });

        try {
            const healthyItems = pantry
                .filter(item => item.riskLevel === 'Baixo')
                .map(item => item.name);
            
            if (healthyItems.length < 2) {
                addMessageToChat({ role: 'model', text: "Hmm, para criar receitas saborosas, preciso de pelo menos 2 ingredientes de baixo risco na sua despensa. Que tal adicionar mais alguns?" });
                setIsProcessing(false);
                return;
            }

            const newRecipes = await generateRecipes(healthyItems);
            addMessageToChat({ role: 'model', recipes: newRecipes, text: "Aqui estão algumas sugestões que preparei para você:" });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            addMessageToChat({ role: 'model', text: errorMessage });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQuickReply = (reply: string) => {
        clearChatQuickReplies();
        addMessageToChat({ role: 'user', text: reply });
        if (reply.toLowerCase().includes('sim')) {
            handleGenerateRecipes();
        } else {
            addMessageToChat({ role: 'model', text: 'Tudo bem! Se mudar de ideia, é só pedir.' });
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || isProcessing) return;

        const userMessage = userInput;
        addMessageToChat({ role: 'user', text: userMessage });
        setUserInput('');
        setIsProcessing(true);
        
        if (userMessage.toLowerCase().includes('receita')) {
             await handleGenerateRecipes();
             return;
        }

        try {
            const initialAnalysisState: AnalysisState = {
                status: 'parsing', progress: 0, totalItems: 0, processedItems: []
            };
            addMessageToChat({ role: 'model', analysis: initialAnalysisState });
            
            const parsedItems = await processShoppingList(userMessage);
            
            if (parsedItems.length === 0) {
              updateLastMessageAnalysis({ status: 'error' });
              addMessageToChat({ role: 'model', text: 'Não encontrei itens na sua mensagem. Você pode tentar de novo? Ex: "2 maçãs, 1 litro de leite e pão de forma".' });
              setIsProcessing(false);
              return;
            }
            
            const initialProcessedItems: AnalysisState['processedItems'] = parsedItems.map(p => ({ 
                name: p.name, 
                status: p.isFood ? 'pending' : 'skipped', 
                isFood: p.isFood 
            }));
            updateLastMessageAnalysis({ 
                status: 'enriching', 
                progress: 5, 
                totalItems: parsedItems.length,
                processedItems: initialProcessedItems
            });

            const foodItemsToEnrich = parsedItems.filter(item => item.isFood);
            const foodItemNames = foodItemsToEnrich.map(item => item.name);
            
            const enrichedData = await enrichFoodItemsBatch(foodItemNames);
            updateLastMessageAnalysis({ progress: 50 });

            const newPantryItems: PantryItem[] = [];
            const finalProcessedItems = [...initialProcessedItems];

            const enrichedMap = new Map(enrichedData.map(e => [e.name.toLowerCase(), e]));

            foodItemsToEnrich.forEach(item => {
                const enriched = enrichedMap.get(item.name.toLowerCase());
                const itemIndex = finalProcessedItems.findIndex(p => p.name === item.name);

                if (itemIndex === -1) return;

                if (enriched) {
                    newPantryItems.push({
                        id: `${item.name}-${Date.now()}`,
                        name: item.name,
                        quantity: item.quantity,
                        unit: item.unit,
                        ...enriched
                    });
                    finalProcessedItems[itemIndex] = {
                        ...finalProcessedItems[itemIndex],
                        status: 'success',
                        classification: enriched.classification,
                        riskLevel: enriched.riskLevel
                    };
                } else {
                    finalProcessedItems[itemIndex] = {
                        ...finalProcessedItems[itemIndex],
                        status: 'error',
                    };
                }
            });

            if (newPantryItems.length > 0) {
              addItemsToPantry(newPantryItems);
            }
            
            updateLastMessageAnalysis({ 
                status: 'done', 
                progress: 100, 
                processedItems: finalProcessedItems 
            });
            
            const nonFoodItemsFound = parsedItems.some(item => !item.isFood);
            let finalMessage = 'Prontinho! Adicionei tudo na sua Despensa Inteligente.';
            if (nonFoodItemsFound) {
                finalMessage = 'Prontinho! Adicionei os alimentos à sua Despensa. Notei alguns itens que não são comida e os ignorei.'
            }
            addMessageToChat({ role: 'model', text: finalMessage });
            
            setTimeout(() => {
                addMessageToChat({ role: 'model', text: 'Agora que temos ingredientes novos, que tal eu sugerir algumas receitas saudáveis?', quickReplies: ['Sim, por favor!', 'Agora não'] });
            }, 1000);


        } catch (error) {
            updateLastMessageAnalysis({ status: 'error' });
            const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
            addMessageToChat({ role: 'model', text: errorMessage });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-brand-background">
            <div className="flex-grow overflow-y-auto p-4 space-y-6">
                {chatHistory.map((msg, index) => {
                    const isModelOrSystem = msg.role === 'model' || msg.role === 'system';
                    return (
                        <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                           {isModelOrSystem && <img src="/professor-nutri.png" alt="Professor Nutri" className="h-10 w-10 rounded-full flex-shrink-0" />}
                           <div className="flex flex-col w-full">
                                {msg.text && (
                                     <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 px-4 rounded-2xl ${msg.role === 'user' ? 'bg-brand-text text-white rounded-br-none self-end' : msg.role === 'system' ? 'bg-brand-accent-lime/50 text-brand-text w-full text-center italic' : 'bg-brand-surface text-brand-text rounded-bl-none self-start border border-brand-border'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                )}
                                {msg.recipes && (
                                    <div className="w-full space-y-3 mt-2 self-start">
                                        {msg.recipes.map((recipe, i) => (
                                            <RecipeChatCard key={i} recipe={recipe} onSave={saveRecipe} isSaved={isRecipeSaved(recipe.title)} />
                                        ))}
                                    </div>
                                )}
                                {msg.quickReplies && (
                                    <div className="flex gap-2 mt-2 self-start">
                                        {msg.quickReplies.map(reply => (
                                            <button key={reply} onClick={() => handleQuickReply(reply)} className="px-4 py-2 text-sm bg-brand-surface border border-brand-border text-brand-text-secondary rounded-full hover:bg-gray-100">
                                                {reply}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {msg.analysis && <AnalysisProgressCard analysis={msg.analysis} />}
                           </div>
                           {msg.role === 'user' && <div className="w-10 flex-shrink-0"></div>}
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-brand-background/90 backdrop-blur-sm border-t border-brand-border">
                <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Adicione sua lista de compras..."
                        className="flex-grow p-4 bg-brand-surface border border-brand-border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-sm"
                        disabled={isProcessing}
                    />
                    <button
                        type="submit"
                        disabled={isProcessing || !userInput.trim()}
                        className="bg-gradient-to-br from-brand-primary to-brand-secondary text-white p-4 rounded-full disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 shadow-lg transform hover:scale-110"
                        aria-label="Enviar mensagem"
                    >
                        {isProcessing ? <LoaderCircle className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfessorNutriChat;