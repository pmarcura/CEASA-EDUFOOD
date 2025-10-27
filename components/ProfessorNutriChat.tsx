
import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { Send, LoaderCircle, Camera } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { processShoppingList, enrichFoodItemsBatch, generateRecipes, processReceiptImage } from '../services/geminiService';
import type { PantryItem, AnalysisState, VerifiedItem } from '../types';
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

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [context?.chatHistory, isProcessing]);

    if (!context) return null;
    const { 
        pantry, addItemsToPantry, addMessageToChat, chatHistory, 
        clearChatQuickReplies, updateMessage, setViewingRecipe
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

        const newPantryItems: PantryItem[] = [];
        let finalProcessedItems = [...initialProcessedItems];
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
                    novaClassification: enriched.novaClassification,
                    codexCategory: enriched.codexCategory,
                    notRecommendedFor: enriched.notRecommendedFor,
                    riskLevel: enriched.riskLevel,
                    icon: enriched.icon,
                    color: enriched.color,
                    healthTip: enriched.healthTip,
                    tags: enriched.tags,
                });
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
    }, [addItemsToPantry, addMessageToChat, updateMessage, context.chatHistory]);


    const handleGenerateRecipes = async () => {
        setIsProcessing(true);
        addMessageToChat({ role: 'model', text: 'Ótima ideia! Deixe-me ver o que posso criar com os ingredientes saudáveis que você tem...' });

        try {
            const healthyItems = pantry.filter(item => item.riskLevel === 'Baixo').map(item => item.name);
            if (healthyItems.length < 2) {
                addMessageToChat({ role: 'model', text: "Hmm, para criar receitas saborosas, preciso de pelo menos 2 ingredientes de baixo risco na sua despensa. Que tal adicionar mais alguns?" });
                setIsProcessing(false);
                return;
            }
            const newRecipes = await generateRecipes(healthyItems);
            addMessageToChat({ role: 'model', recipes: newRecipes, text: "Aqui estão algumas sugestões que preparei para você:" });
        } catch (e) {
            addMessageToChat({ role: 'model', text: e instanceof Error ? e.message : "Ocorreu um erro desconhecido." });
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
        if (!userInput.trim() || isProcessing) return;

        const userMessage = userInput;
        addMessageToChat({ role: 'user', text: userMessage });
        setUserInput('');
        setIsProcessing(true);
        
        if (userMessage.toLowerCase().includes('receita')) {
             await handleGenerateRecipes();
             setIsProcessing(false);
             return;
        }

        const parsingMessageId = addMessageToChat({ role: 'model', text: "Analisando sua lista..." });
        try {
            const parsedItems = await processShoppingList(userMessage);
            if (parsedItems.length === 0) {
              updateMessage(parsingMessageId, { text: 'Não encontrei itens na sua mensagem. Você pode tentar de novo? Ex: "2 maçãs, 1 litro de leite e pão de forma".' });
            } else {
               presentVerificationCard(parsedItems, parsingMessageId);
            }
        } catch (error) {
            updateMessage(parsingMessageId, { text: error instanceof Error ? error.message : "Ocorreu um erro desconhecido." });
        } finally {
            setIsProcessing(false);
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
                                           <RecipeCard key={i} recipe={recipe} onSelect={() => setViewingRecipe(recipe)} />
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
