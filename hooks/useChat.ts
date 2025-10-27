
import { useState, useCallback, useMemo } from 'react';
import { processShoppingList, enrichFoodItemsBatch, generateRecipes, processReceiptImage } from '../services/geminiService';
import type { ChatMessage, PantryItem, AnalysisState, VerifiedItem, Recipe } from '../types';

export const useChat = (
    addItemsToPantry: (items: Omit<PantryItem, 'id'>[]) => Promise<void>,
    pantry: PantryItem[]
) => {
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
        { id: 'initial-system-message', role: 'system', text: 'Olá! Eu sou o Professor Nutri. Vamos juntos cuidar da alimentação da sua família! Que tal começar me enviando sua lista de compras ou a foto da sua nota fiscal?' }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);

    const addMessageToChat = useCallback((message: Omit<ChatMessage, 'id'>) => {
        const newMessage = { ...message, id: `${Date.now()}-${Math.random()}` };
        setChatHistory(prev => [...prev, newMessage]);
        return newMessage.id;
    }, []);

    const updateMessage = useCallback((messageId: string, update: Partial<ChatMessage>) => {
        setChatHistory(prev =>
            prev.map(msg => msg.id === messageId ? { ...msg, ...update } : msg)
        );
    }, []);

    const clearChatQuickReplies = useCallback(() => {
        setChatHistory(prev => prev.map(msg => ({ ...msg, quickReplies: undefined })));
    }, []);
    
    const startEnrichmentProcess = useCallback(async (itemsToProcess: {name: string, quantity: number, unit: string, isFood: boolean}[]) => {
        if (!addItemsToPantry) return;

         const analysisMessageId = addMessageToChat({ 
            role: 'model', 
            analysis: { status: 'enriching', progress: 5, totalItems: itemsToProcess.length, processedItems: [] }
        });

        const updateAnalysis = (id: string, update: Partial<AnalysisState>) => {
            setChatHistory(prev => prev.map(msg => {
                if (msg.id === id && msg.analysis) {
                    const newAnalysisState = {
                        ...msg.analysis,
                        ...update,
                        processedItems: update.processedItems || msg.analysis.processedItems,
                    };
                    return { ...msg, analysis: newAnalysisState };
                }
                return msg;
            }));
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
                newPantryItems.push({ 
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
    }, [addItemsToPantry, addMessageToChat]);


    const handleGenerateRecipes = useCallback(async () => {
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
    }, [pantry, addMessageToChat]);

    const handleQuickReply = useCallback((reply: string) => {
        clearChatQuickReplies();
        addMessageToChat({ role: 'user', text: reply });
        if (reply.toLowerCase().includes('sim')) {
            handleGenerateRecipes();
        } else {
            addMessageToChat({ role: 'model', text: 'Tudo bem! Se mudar de ideia, é só pedir.' });
        }
    }, [addMessageToChat, clearChatQuickReplies, handleGenerateRecipes]);
    
    const presentVerificationCard = useCallback((parsedItems: (Partial<VerifiedItem> & { name: string, quantity: number, unit: string })[], messageId: string) => {
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
    }, [updateMessage]);

    const sendMessage = useCallback(async (userMessage: string) => {
        addMessageToChat({ role: 'user', text: userMessage });
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
    }, [addMessageToChat, handleGenerateRecipes, presentVerificationCard, updateMessage]);
    
    const handleImageSend = useCallback(async (imageDataUrl: string, file: File) => {
        setIsProcessing(true);
        try {
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
        }
    }, [addMessageToChat, presentVerificationCard, updateMessage]);

    const handleItemsConfirmed = useCallback(async (messageId: string, verifiedItems: VerifiedItem[]) => {
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
    }, [addMessageToChat, startEnrichmentProcess, updateMessage]);

    return useMemo(() => ({
        chatHistory, isProcessing, sendMessage, handleImageSend, handleQuickReply, handleItemsConfirmed, addMessageToChat, updateMessage, clearChatQuickReplies
    }), [chatHistory, isProcessing, sendMessage, handleImageSend, handleQuickReply, handleItemsConfirmed, addMessageToChat, updateMessage, clearChatQuickReplies]);
};
