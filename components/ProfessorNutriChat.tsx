
import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { Send, LoaderCircle, Camera, ArrowUp } from 'lucide-react';
import { AppContext } from '../../contexts/AppContext';
import { processShoppingList, enrichFoodItemsBatch, generateConversationalRecipes, processReceiptImage } from '../../services/geminiService';
import type { PantryItem, AnalysisState, VerifiedItem } from '../../types';
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
    const [isProcessing, setIsProcessing] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [context?.chatHistory, isProcessing]);
    
     useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height to recalculate
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [userInput]);


    if (!context) return null;
    const { 
        pantry, addItemsToPantry, addMessageToChat, chatHistory, 
        clearChatQuickReplies, updateMessage, setViewingRecipe,
        awardXpForNewItem
    } = context;
    
    const startEnrichmentProcess = useCallback(async (itemsToProcess: {name: string, quantity: number, unit: string, isFood: boolean}[]) => {
         const analysisMessageId = addMessageToChat({ 
            role: 'model', 
            analysis: { status: 'enriching', progress: 5, totalItems: itemsToProcess.length, processedItems: [] }
        });

        const findMessage = (id: string) => context.chatHistory.find(m => m.id === id);

        const updateAnalysis = (id: string, update: Partial<AnalysisState>) => {
            const currentMsg = findMessage(id);
            if (currentMsg?.analysis) {
                const newAnalysisState = {
                    ...currentMsg.analysis,
                    ...update,
                    processedItems: update.processedItems || currentMsg.analysis.processedItems,
                };
                updateMessage(id, { analysis: newAnalysisState });
            }
        };

        const initialProcessedItems: AnalysisState['processedItems'] = itemsToProcess.map(p => ({ 
            name: p.name, 
            status: p.isFood ? 'pending' : 'skipped', 
            isFood: p.isFood 
        }));
        updateAnalysis(analysisMessageId, { processedItems: initialProcessedItems });

        const foodItemsToEnrich = itemsToProcess.filter(item => item.isFood);
        const foodItemNames = foodItemsToEnrich.map(item => item.name);
        
        const enrichedData = await enrichFoodItemsBatch(foodItemNames);
        updateAnalysis(analysisMessageId, { progress: 50 });

        const newPantryItems: Omit<PantryItem, 'id'>[] = [];
        let finalProcessedItems = [...initialProcessedItems];
        const enrichedMap = new Map(enrichedData.map(e => [e.name.toLowerCase(), e]));

        foodItemsToEnrich.forEach(item => {
            const enriched = enrichedMap.get(item.name.toLowerCase());
            const itemIndex = finalProcessedItems.findIndex(p => p.name === item.name);
            if (itemIndex === -1) return;

            if (enriched) {
                const newItem: Omit<PantryItem, 'id'> = {
                    name: item.name,
                    quantity: item.quantity, 
                    unit: item.unit, 
                    novaClassification: enriched.novaClassification,
                    codexCategory: enriched.codexCategory,
                    ageWarningTag: enriched.ageWarningTag,
                    riskLevel: enriched.riskLevel,
                    icon: enriched.icon,
                    color: enriched.color,
                    nutritionalInfo: enriched.nutritionalInfo,
                    tags: enriched.tags,
                    tipRead: false,
                };
                newPantryItems.push(newItem);
                // Award XP for each new item
                awardXpForNewItem(newItem);
                finalProcessedItems[itemIndex] = { ...finalProcessedItems[itemIndex], status: 'success', novaClassification: enriched.novaClassification, riskLevel: enriched.riskLevel };
            } else {
                finalProcessedItems[itemIndex] = { ...finalProcessedItems[itemIndex], status: 'error' };
            }
        });

        if (newPantryItems.length > 0) await addItemsToPantry(newPantryItems);
        
        updateAnalysis(analysisMessageId, { status: 'done', progress: 100, processedItems: finalProcessedItems });
        
        const nonFoodItemsFound = itemsToProcess.some(item => !item.isFood);
        let finalMessage = 'Prontinho! Adicionei tudo na sua Despensa Inteligente.';
        if (nonFoodItemsFound) {
            finalMessage = 'Prontinho! Adicionei os alimentos à sua Despensa. Notei alguns itens que não são comida e os ignorei.'
        }
        addMessageToChat({ role: 'model', text: finalMessage });
        
        setTimeout(() => {
            addMessageToChat({ role: 'model', text: 'Agora que temos ingredientes novos, que tal eu sugerir algumas receitas saudáveis?', quickReplies: ['Sim, por favor!', 'Agora não'] });
        }, 1000);
    }, [addItemsToPantry, addMessageToChat, updateMessage, context.chatHistory, awardXpForNewItem]);
    
    const processUserMessage = useCallback(async (message: string) => {
        if (!message.trim() || isProcessing) return;

        addMessageToChat({ role: 'user', text: message });
        setIsProcessing(true);
        const thinkingMessageId = addMessageToChat({ role: 'model', text: "Analisando..." });
        
        try {
            // First, try to interpret the message as a shopping list
            const parsedItems = await processShoppingList(message);
            
            if (parsedItems.length > 0) {
               // It's a shopping list, present verification card
               presentVerificationCard(parsedItems, thinkingMessageId);
            } else {
               // Not a shopping list, treat as a conversational message
               updateMessage(thinkingMessageId, { text: "Pensando em uma resposta..." });
               
               const pantryNames = pantry.map(item => item.name);
               // FIX: Filter out system messages and cast the role to satisfy the function signature.
               const historyForModel = chatHistory
                  .filter(m => m.role === 'user' || m.role === 'model')
                  .map(m => ({ role: m.role as 'user' | 'model', text: m.text }));

               const response = await generateConversationalRecipes(message, pantryNames, historyForModel);
               
               updateMessage(thinkingMessageId, { text: response.text, recipes: response.recipes });
            }
        } catch (error) {
            updateMessage(thinkingMessageId, { text: error instanceof Error ? error.message : "Ocorreu um erro desconhecido." });
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, addMessageToChat, updateMessage, pantry, chatHistory]);

    const handleQuickReply = (reply: string) => {
        clearChatQuickReplies();
        // The user's reply is processed as a new conversational message
        processUserMessage(reply);
    };
    
    const presentVerificationCard = (parsedItems: (Partial<VerifiedItem> & { name: string, quantity: number, unit: string })[], messageId: string) => {
        const verificationItems: VerifiedItem[] = parsedItems.map(item => ({
            ...item,
            id: `${item.name}-${Math.random()}`,
            isIncluded: item.isFood === false ? false : true,
        }));

        updateMessage(messageId, {
            text: "Verifique os itens que encontrei. Desmarque ou edite o que for necessário antes de adicionar à despensa.",
            itemVerification: {
                status: 'pending',
                items: verificationItems,
            }
        });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const message = userInput;
        setUserInput('');
        await processUserMessage(message);
    };

     const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isProcessing) return;

        setIsProcessing(true);
        try {
            const imageDataUrl = await fileToDataURL(file);
            addMessageToChat({ role: 'user', imageUrl: imageDataUrl });

            const parsingMessageId = addMessageToChat({ role: 'model', text: "Analisando sua nota fiscal..." });

            const base64Data = imageDataUrl.split(',')[1];
            const parsedItems = await processReceiptImage(base64Data, file.type);
            
            if (parsedItems.length === 0) {
                 updateMessage(parsingMessageId, { text: "Não consegui encontrar itens na imagem. A foto está nítida? Tente novamente, por favor." });
            } else {
                presentVerificationCard(parsedItems.map(item => ({...item, isFood: true})), parsingMessageId);
            }
        } catch(error) {
            addMessageToChat({ role: 'model', text: error instanceof Error ? error.message : "Ocorreu um erro ao processar a imagem." });
        } finally {
            setIsProcessing(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleItemsConfirmed = async (messageId: string, verifiedItems: VerifiedItem[]) => {
        setIsProcessing(true);
        updateMessage(messageId, {
            text: "Itens confirmados! Analisando informações nutricionais...",
            itemVerification: { status: 'verified', items: verifiedItems }
        });
        
        try {
            const itemsToProcess = verifiedItems
                .filter(item => item.isIncluded)
                .map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit, isFood: item.isFood !== false }));
            
            if (itemsToProcess.length > 0) {
                await startEnrichmentProcess(itemsToProcess);
            } else {
                addMessageToChat({ role: 'model', text: "Nenhum item foi selecionado para adicionar à despensa." });
            }
        } catch (error) {
             addMessageToChat({ role: 'model', text: error instanceof Error ? error.message : "Ocorreu um erro desconhecido." });
        } finally {
             setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-brand-background">
            <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-40">
                {chatHistory.map((msg) => {
                    const isModelOrSystem = msg.role === 'model' || msg.role === 'system';
                    const isUser = msg.role === 'user';
                    
                    if (msg.role === 'system') {
                        return (
                            <div key={msg.id} className="text-center text-xs text-brand-text-secondary px-4 py-2">
                                {msg.text}
                            </div>
                        )
                    }

                    return (
                        <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                           {isModelOrSystem && <img src="/professor-nutri.png" alt="Professor Nutri" className="h-7 w-7 rounded-full flex-shrink-0 self-end" />}
                           <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`p-3 px-4 rounded-2xl ${isUser ? 'bg-brand-primary text-white' : 'bg-brand-surface border border-brand-border text-brand-text'}`}>
                                    {msg.imageUrl && (
                                        <div className="mb-1">
                                            <img src={msg.imageUrl} alt="Nota fiscal enviada" className="rounded-lg max-w-full h-auto" />
                                        </div>
                                    )}
                                    {msg.text && (
                                         <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    )}
                                    {msg.recipes && (
                                        <div className="w-full space-y-2 mt-2">
                                            {msg.recipes.map((recipe, i) => (
                                               <RecipeCard key={i} recipe={recipe} onSelect={() => setViewingRecipe(recipe)} />
                                            ))}
                                        </div>
                                    )}
                                    {msg.analysis && <AnalysisProgressCard analysis={msg.analysis} />}
                                    {msg.itemVerification && <ItemVerificationCard verificationState={msg.itemVerification} onConfirm={(items) => handleItemsConfirmed(msg.id, items)} />}
                               </div>

                                {msg.quickReplies && (
                                    <div className="flex flex-wrap gap-2 mt-2 self-start">
                                        {msg.quickReplies.map(reply => (
                                            <button key={reply} onClick={() => handleQuickReply(reply)} className="px-3 py-1.5 text-sm bg-brand-surface border border-brand-border text-brand-primary rounded-full hover:bg-gray-100">
                                                {reply}
                                            </button>
                                        ))}
                                    </div>
                                )}
                           </div>
                        </div>
                    );
                })}
                {isProcessing && (
                     <div className="flex gap-2.5 flex-row">
                        <img src="/professor-nutri.png" alt="Professor Nutri" className="h-7 w-7 rounded-full flex-shrink-0 self-end" />
                        <div className="bg-brand-surface text-brand-text border border-brand-border self-start p-3 px-4 rounded-2xl flex items-center">
                            <div className="typing-indicator">
                                <span/>
                                <span/>
                                <span/>
                            </div>
                        </div>
                     </div>
                )}
                <div ref={chatEndRef} />
                 {/* FIX: Removed non-standard "jsx" prop from style tag. */}
                 <style>{`
                    .typing-indicator span {
                        height: 8px;
                        width: 8px;
                        float: left;
                        margin: 0 1px;
                        background-color: #9E9EA1;
                        display: block;
                        border-radius: 50%;
                        opacity: 0.4;
                        animation: 1s blink infinite;
                    }
                    .typing-indicator span:nth-child(2) {
                        animation-delay: .2s;
                    }
                    .typing-indicator span:nth-child(3) {
                        animation-delay: .4s;
                    }
                    @keyframes blink {
                        50% {
                            opacity: 1;
                        }
                    }
                `}</style>
            </div>
            
             <div className="fixed bottom-[70px] left-0 right-0 p-3 bg-transparent z-10">
                <div className="bg-brand-surface/90 backdrop-blur-lg border border-brand-border rounded-2xl shadow-2xl max-w-2xl mx-auto p-2">
                    <form onSubmit={handleSubmit} className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="p-2.5 text-brand-text-secondary hover:text-brand-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
                            aria-label="Enviar imagem da nota fiscal"
                        >
                           <Camera className="h-5 w-5" />
                        </button>
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Converse com o Professor Nutri..."
                            className="flex-grow p-2 bg-transparent border-none rounded-lg focus:outline-none focus:ring-0 resize-none text-brand-text placeholder:text-brand-text-secondary/70 text-sm max-h-32"
                            disabled={isProcessing}
                        />
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                        <button
                            type="submit"
                            disabled={isProcessing || !userInput.trim()}
                            className="w-9 h-9 flex items-center justify-center bg-brand-primary text-white rounded-xl disabled:bg-brand-ios-gray-dark disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 hover:bg-brand-dark"
                            aria-label="Enviar mensagem"
                        >
                            {isProcessing ? <LoaderCircle className="animate-spin h-5 w-5" /> : <ArrowUp className="h-5 w-5" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfessorNutriChat;