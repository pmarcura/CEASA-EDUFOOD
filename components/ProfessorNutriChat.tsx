
import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { Send, LoaderCircle, Camera, ArrowUp, ImagePlus, X } from 'lucide-react';
import { AppContext } from '../../contexts/AppContext';
import { processShoppingList, enrichFoodItemsBatch, generateConversationalRecipes, processReceiptImage, ImagePayload, EnrichedData } from '../../services/geminiService';
import type { PantryItem, AnalysisState, VerifiedItem } from '../../types';
import RecipeCard from './RecipeCard';
import AnalysisProgressCard from './AnalysisProgressCard';
import ItemVerificationCard from './ItemVerificationCard';
import { toTitleCase } from '../../utils/formatters';

const fileToDataURL = (file: File): Promise<ImagePayload> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64Data = reader.result.split(',')[1];
                resolve({ data: base64Data, mimeType: file.type });
            } else {
                reject(new Error("Failed to read file"));
            }
        };
        reader.onerror = error => reject(error);
    });
};

// Helper to split array into chunks
const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
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
            textarea.style.height = 'auto'; 
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [userInput]);

    if (!context) return null;
    const { 
        pantry, addItemsToPantry, addMessageToChat, chatHistory, 
        clearChatQuickReplies, updateMessage, setViewingRecipe,
        awardXpForNewItem, userProfile, mealLog, feedPosts
    } = context;
    
    const startEnrichmentProcess = useCallback(async (itemsToProcess: {name: string, quantity: number, unit: string, isFood: boolean}[]) => {
         // 1. Create the message container for the progress card
         const analysisMessageId = addMessageToChat({ 
            role: 'model', 
            analysis: { status: 'enriching', progress: 0, totalItems: itemsToProcess.length, processedItems: [] }
        });

        // Helper to update the specific message UI
        const updateAnalysis = (update: Partial<AnalysisState>) => {
            updateMessage(analysisMessageId, { 
                analysis: { 
                    status: update.status || 'enriching', 
                    progress: update.progress || 0, 
                    totalItems: itemsToProcess.length, 
                    processedItems: update.processedItems || [] 
                } 
            });
        };

        // Filter already at start based on user selection, but double check with enrichment later
        const foodItemsToEnrich = itemsToProcess.filter(item => item.isFood);
        
        // BATCH PROCESSING CONFIG
        const CHUNK_SIZE = 8; 
        const chunks = chunkArray(foodItemsToEnrich, CHUNK_SIZE);
        
        let processedCount = 0;
        let skippedCount = itemsToProcess.length - foodItemsToEnrich.length;
        const allNewPantryItems: Omit<PantryItem, 'id'>[] = [];

        // Process chunks sequentially
        try {
            for (const chunk of chunks) {
                const chunkNames = chunk.map(item => item.name);
                
                try {
                    // Call AI
                    const enrichedDataChunk = await enrichFoodItemsBatch(chunkNames);
                    
                    // Match logic
                    if (Array.isArray(enrichedDataChunk)) {
                        chunk.forEach(item => {
                            // Try exact match first, then fallback to finding by inclusion
                            // SAFEGUARD: Guard against undefined 'name' from AI response or item input
                            let enriched = enrichedDataChunk.find(e => 
                                (e?.name && item?.name) && (
                                    e.name.toLowerCase() === item.name.toLowerCase() || 
                                    item.name.toLowerCase().includes(e.name.toLowerCase())
                                )
                            );
                            
                            if (enriched) {
                                // SECONDARY SAFETY CHECK: If AI determines it's NON_FOOD, skip it
                                if (enriched.codexCategory === 'NON_FOOD') {
                                    skippedCount++;
                                    return;
                                }

                                const newItem: Omit<PantryItem, 'id'> = {
                                    name: toTitleCase(enriched.name || item.name), // Enforce Title Case
                                    quantity: item.quantity, 
                                    unit: item.unit, 
                                    novaClassification: enriched.novaClassification || 'processed',
                                    codexCategory: enriched.codexCategory || 'Outros',
                                    ageWarningTag: enriched.ageWarningTag || '', 
                                    riskLevel: enriched.riskLevel || 'Médio',
                                    icon: enriched.icon || '📦', // Use AI icon or fallback
                                    color: enriched.color || '#9CA3AF',
                                    nutritionalInfo: enriched.nutritionalInfo || { origin: '', benefits: [], risks: [], nutritionFacts: '' },
                                    tags: enriched.tags || [],
                                    tipRead: false,
                                    addedAt: Date.now(),
                                };
                                allNewPantryItems.push(newItem);
                                awardXpForNewItem(newItem); 
                            } else {
                                // Fallback if AI didn't return data for this specific item
                                allNewPantryItems.push({
                                    name: toTitleCase(item.name), // Enforce Title Case
                                    quantity: item.quantity,
                                    unit: item.unit,
                                    novaClassification: 'processed',
                                    codexCategory: 'Outros',
                                    ageWarningTag: '',
                                    riskLevel: 'Médio',
                                    icon: '📦',
                                    color: '#9CA3AF',
                                    nutritionalInfo: { origin: 'Desconhecida', benefits: [], risks: [], nutritionFacts: '' },
                                    tags: ['Item Adicionado'],
                                    tipRead: false,
                                    addedAt: Date.now(),
                                });
                            }
                        });
                    } else {
                        // If enrichedDataChunk is NOT an array (failed parsing), treat entire chunk as fallback
                         chunk.forEach(item => {
                             allNewPantryItems.push({
                                name: toTitleCase(item.name), 
                                quantity: item.quantity,
                                unit: item.unit,
                                novaClassification: 'processed',
                                codexCategory: 'Outros',
                                ageWarningTag: '',
                                riskLevel: 'Médio',
                                icon: '📦',
                                color: '#9CA3AF',
                                nutritionalInfo: { origin: 'Manual (Erro IA)', benefits: [], risks: [], nutritionFacts: '' },
                                tags: ['Erro na Análise'],
                                tipRead: false,
                                addedAt: Date.now(),
                            });
                        });
                    }

                } catch (chunkError) {
                    console.error("Chunk processing error, adding as generic:", chunkError);
                    // If chunk fails, add all as generic to avoid data loss
                    chunk.forEach(item => {
                         allNewPantryItems.push({
                            name: toTitleCase(item.name), // Enforce Title Case
                            quantity: item.quantity,
                            unit: item.unit,
                            novaClassification: 'processed',
                            codexCategory: 'Outros',
                            ageWarningTag: '',
                            riskLevel: 'Médio',
                            icon: '📦',
                            color: '#9CA3AF',
                            nutritionalInfo: { origin: 'Manual', benefits: [], risks: [], nutritionFacts: '' },
                            tags: ['Erro na Análise'],
                            tipRead: false,
                            addedAt: Date.now(),
                        });
                    });
                }

                processedCount += chunk.length;
                const currentProgress = Math.round((processedCount / foodItemsToEnrich.length) * 100);
                updateAnalysis({ progress: currentProgress, status: 'enriching' });
            }

            // FINAL STEP: Add to Firestore
            if (allNewPantryItems.length > 0) {
                await addItemsToPantry(allNewPantryItems);
            }
            
            updateAnalysis({ status: 'done', progress: 100 });
            
            let finalMessage = `Pronto! Adicionei ${allNewPantryItems.length} itens à sua despensa.`;
            if (skippedCount > 0) {
                finalMessage += ` (Ignorei ${skippedCount} itens que não pareciam comida).`;
            }
            
            setTimeout(() => {
                addMessageToChat({ 
                    role: 'model', 
                    text: finalMessage,
                    quickReplies: ['Sugerir receitas', 'Ver despensa'] 
                });
            }, 800);

        } catch (error) {
            console.error("Fatal enrichment error:", error);
            updateAnalysis({ status: 'error', progress: 0 });
            addMessageToChat({ role: 'model', text: "Tive um problema ao salvar os itens. Por favor, tente novamente com uma lista menor." });
        } finally {
            setIsProcessing(false);
        }

    }, [addItemsToPantry, addMessageToChat, updateMessage, awardXpForNewItem]);
    
    const processUserMessage = useCallback(async (message: string, intentContext?: string) => {
        if (!message.trim() || isProcessing) return;

        addMessageToChat({ role: 'user', text: message });
        setIsProcessing(true);
        const thinkingMessageId = addMessageToChat({ role: 'model', text: "Analisando..." });
        
        try {
            const lowerMsg = message.toLowerCase();
            
            // --- INTENT DETECTION ---
            
            // 1. Intent: Add to Pantry (Keywords)
            // Matches: "adicionar leite", "comprar pão", "põe na lista ovos", "faltou arroz"
            const addKeywords = ['adicionar', 'comprar', 'incluir', 'lista', 'faltou', 'bota'];
            const hasAddIntent = addKeywords.some(k => lowerMsg.includes(k));
            
            // 2. Intent: Suggest Recipes (Keywords)
            // Matches: "receita", "cozinhar", "fome", "sugestão", "jantar", "almoço"
            const recipeKeywords = ['receita', 'cozinhar', 'fome', 'sugestão', 'sugerir', 'jantar', 'almoço', 'café'];
            const hasRecipeIntent = recipeKeywords.some(k => lowerMsg.includes(k));

            // 3. Heuristic: Looks like a shopping list (numbers, units, or multiple lines)
            const isLikelyList = message.includes('\n') || message.match(/\d+\s+(un|kg|g|l|ml)/i) || message.split(',').length > 2;
            
            // --- ACTION ROUTING ---

            if ((hasAddIntent || isLikelyList) && !intentContext) {
                // Process as Shopping List
                const parsedItems = await processShoppingList(message);
                if (parsedItems.length > 0) {
                   presentVerificationCard(parsedItems, thinkingMessageId);
                   return; // Exit function, flow continues in verification
                } else if (hasAddIntent) {
                    // If intent was "add" but parsing returned empty, ask for clarification
                     updateMessage(thinkingMessageId, { text: "Entendi que você quer adicionar itens, mas não consegui identificar quais. Pode listar novamente? (Ex: '2 litros de leite')" });
                     setIsProcessing(false);
                     return;
                }
            }
            
            // Process as Recipe Request / Chat
            updateMessage(thinkingMessageId, { text: "Pensando em uma resposta..." });
            
            const pantryNames = pantry.map(item => item.name);
            const historyForModel = chatHistory
                .filter(m => m.role === 'user' || m.role === 'model')
                .map(m => ({ role: m.role as 'user' | 'model', text: m.text }));

            // Pass feedPosts to AI context for "Community" queries
            const response = await generateConversationalRecipes(
                message, 
                pantryNames, 
                historyForModel, 
                userProfile, 
                mealLog, 
                feedPosts, // Pass Feed Context
                intentContext || (hasRecipeIntent ? 'pantry_focus' : undefined) // Hint intent if detected
            );
            
            updateMessage(thinkingMessageId, { text: response.text, recipes: response.recipes });
            setIsProcessing(false); 

        } catch (error) {
            updateMessage(thinkingMessageId, { text: error instanceof Error ? error.message : "Ocorreu um erro desconhecido." });
            setIsProcessing(false);
        }
    }, [isProcessing, addMessageToChat, updateMessage, pantry, chatHistory, userProfile, mealLog, feedPosts]);

    const handleQuickReply = (reply: string) => {
        clearChatQuickReplies();
        
        if (reply === 'Sugerir receitas') {
            // INTERCEPT: Don't generate immediately. Ask for specific type.
            addMessageToChat({ role: 'user', text: reply });
            setTimeout(() => {
                addMessageToChat({
                    role: 'model',
                    text: 'Com certeza! Que tipo de sugestão você prefere hoje?',
                    quickReplies: ['Usar meu estoque', 'Da Comunidade', 'Me surpreenda']
                });
            }, 500);
            return;
        }

        if (reply === 'Usar meu estoque') {
            processUserMessage("Sugerir receitas usando o que tenho na despensa", 'pantry_focus');
            return;
        }

        if (reply === 'Da Comunidade') {
            processUserMessage("Sugerir uma receita popular da comunidade", 'community_focus');
            return;
        }

        if (reply === 'Me surpreenda') {
            processUserMessage("Sugerir uma receita criativa e diferente", 'surprise_focus');
            return;
        }

        // Default fallback
        processUserMessage(reply);
    };
    
    const presentVerificationCard = (parsedItems: (Partial<VerifiedItem> & { name: string, quantity: number, unit: string })[], messageId: string) => {
        const verificationItems: VerifiedItem[] = parsedItems.map(item => ({
            ...item,
            name: toTitleCase(item.name || ''), // Preview with Title Case
            id: `${item.name}-${Math.random()}`,
            isIncluded: item.isFood === false ? false : true, // Default exclusion if isFood is explicitly false
        }));

        updateMessage(messageId, {
            text: "Encontrei estes itens. Confirme antes de eu adicionar à despensa.",
            itemVerification: {
                status: 'pending',
                items: verificationItems,
            }
        });
        setIsProcessing(false); 
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
        const files = event.target.files;
        if (!files || files.length === 0 || isProcessing) return;

        setIsProcessing(true);
        const fileArray = Array.from(files);
        
        try {
            const payloadPromises = fileArray.map(fileToDataURL);
            const payloads = await Promise.all(payloadPromises);
            
            const previewUrl = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#555">${files.length} Imagens</text></svg>`)}`;

            addMessageToChat({ role: 'user', imageUrl: payloads.length === 1 ? `data:${payloads[0].mimeType};base64,${payloads[0].data}` : previewUrl, text: `Enviei ${payloads.length} fotos da nota fiscal.` });

            const parsingMessageId = addMessageToChat({ 
                role: 'model', 
                analysis: { status: 'parsing', progress: 0, totalItems: 0, processedItems: [] } 
            });

            const parsedItems = await processReceiptImage(payloads);
            
            if (parsedItems.length === 0) {
                 updateMessage(parsingMessageId, { text: "Não consegui encontrar itens nas imagens. Elas estão nítidas? Tente novamente, por favor.", analysis: undefined });
            } else {
                updateMessage(parsingMessageId, { 
                    analysis: { status: 'done', progress: 100, totalItems: parsedItems.length, processedItems: [] } 
                });
                
                const verifyMsgId = addMessageToChat({ role: 'model' });
                // Pass the parsedItems directly, keeping their isFood status
                presentVerificationCard(parsedItems.map(item => ({...item, isFood: item.isFood})), verifyMsgId);
            }
        } catch(error) {
            addMessageToChat({ role: 'model', text: error instanceof Error ? error.message : "Ocorreu um erro ao processar as imagens." });
        } finally {
            setIsProcessing(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleItemsConfirmed = async (messageId: string, verifiedItems: VerifiedItem[]) => {
        setIsProcessing(true);
        updateMessage(messageId, {
            itemVerification: { status: 'verified', items: verifiedItems }
        });
        
        const itemsToProcess = verifiedItems
            .filter(item => item.isIncluded)
            .map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit, isFood: item.isFood !== false }));
        
        if (itemsToProcess.length > 0) {
            await startEnrichmentProcess(itemsToProcess);
        } else {
            addMessageToChat({ role: 'model', text: "Nenhum item foi selecionado para adicionar." });
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-brand-background">
            <div className="flex-grow overflow-y-auto p-5 space-y-6 pb-40">
                 <div className="text-center py-4">
                    <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">Hoje</span>
                </div>

                {chatHistory.map((msg) => {
                    const isModelOrSystem = msg.role === 'model' || msg.role === 'system';
                    const isUser = msg.role === 'user';
                    
                    if (msg.role === 'system') {
                        return (
                            <div key={msg.id} className="text-center text-xs text-brand-text-secondary px-4 py-2 opacity-80">
                                {msg.text}
                            </div>
                        )
                    }

                    return (
                        <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
                           {isModelOrSystem && (
                               <div className="w-8 h-8 rounded-xl bg-brand-primary flex-shrink-0 flex items-center justify-center shadow-sm self-end mb-1">
                                   <img src="/professor-nutri-favicon.png" alt="Nutri" className="w-5 h-5" />
                               </div>
                           )}
                           
                           <div className={`flex flex-col max-w-[90%] sm:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                                <div 
                                    className={`shadow-sm text-sm leading-relaxed
                                    ${isUser 
                                        ? 'bg-brand-text text-white rounded-2xl rounded-tr-sm p-4' 
                                        : 'bg-transparent w-full' 
                                    }`}
                                >
                                    {isModelOrSystem && msg.text && !msg.itemVerification && !msg.recipes && !msg.analysis && (
                                         <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm">{msg.text}</div>
                                    )}
                                    
                                    {isUser && msg.imageUrl && (
                                        <div className="mb-2 overflow-hidden rounded-lg border border-white/20">
                                            <img src={msg.imageUrl} alt="Nota fiscal enviada" className="max-w-full h-auto" />
                                        </div>
                                    )}
                                    
                                    {isUser && msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                                    {msg.recipes && (
                                        <div className="w-full space-y-3 mt-2">
                                            {msg.recipes.map((recipe, i) => (
                                               <RecipeCard key={i} recipe={recipe} onSelect={() => setViewingRecipe(recipe)} />
                                            ))}
                                        </div>
                                    )}
                                    {msg.analysis && <AnalysisProgressCard analysis={msg.analysis} />}
                                    {msg.itemVerification && <ItemVerificationCard verificationState={msg.itemVerification} onConfirm={(items) => handleItemsConfirmed(msg.id, items)} />}
                               </div>

                                {msg.quickReplies && (
                                    <div className="flex flex-wrap gap-2 mt-3 animate-slide-in-up">
                                        {msg.quickReplies.map(reply => (
                                            <button key={reply} onClick={() => handleQuickReply(reply)} className="px-4 py-2 text-sm font-medium bg-white border border-brand-primary/20 text-brand-primary rounded-full hover:bg-brand-primary/5 shadow-sm transition-all">
                                                {reply}
                                            </button>
                                        ))}
                                    </div>
                                )}
                           </div>
                        </div>
                    );
                })}
                {isProcessing && !chatHistory[chatHistory.length - 1]?.analysis && (
                     <div className="flex gap-3 flex-row">
                        <div className="w-8 h-8 rounded-xl bg-brand-primary flex-shrink-0 flex items-center justify-center shadow-sm self-end mb-1">
                             <img src="/professor-nutri-favicon.png" alt="Nutri" className="w-5 h-5" />
                        </div>
                        <div className="bg-white border border-gray-100 self-start p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center">
                            <div className="typing-indicator">
                                <span/>
                                <span/>
                                <span/>
                            </div>
                        </div>
                     </div>
                )}
                <div ref={chatEndRef} />
                 <style>{`
                    .typing-indicator span {
                        height: 6px;
                        width: 6px;
                        float: left;
                        margin: 0 2px;
                        background-color: #10B981;
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
                        50% { opacity: 1; transform: scale(1.2); }
                    }
                `}</style>
            </div>
            
             <div className="fixed bottom-[90px] left-0 right-0 px-4 z-10 max-w-2xl mx-auto">
                <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl shadow-float p-2 pl-3 flex items-end gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="p-2.5 mb-0.5 text-brand-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl disabled:opacity-50 transition-colors"
                    >
                       <ImagePlus className="h-6 w-6" />
                    </button>
                    
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pergunte algo ou envie uma lista..."
                        className="flex-grow py-3 bg-transparent border-none focus:outline-none resize-none text-brand-text placeholder:text-gray-400 text-base max-h-32 leading-relaxed"
                        disabled={isProcessing}
                    />
                    
                    <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    
                    <button
                        onClick={(e) => handleSubmit(e as any)}
                        disabled={isProcessing || !userInput.trim()}
                        className="w-11 h-11 mb-0.5 flex items-center justify-center bg-brand-text text-white rounded-2xl shadow-lg disabled:bg-gray-300 disabled:shadow-none transform transition-all active:scale-95 hover:bg-brand-primary"
                    >
                        {isProcessing ? <LoaderCircle className="animate-spin h-5 w-5" /> : <ArrowUp className="h-5 w-5" strokeWidth={3} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfessorNutriChat;
