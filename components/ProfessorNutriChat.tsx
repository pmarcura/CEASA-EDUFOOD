
import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { Send, LoaderCircle, Camera, ArrowUp, ImagePlus, X, MessageSquare, ScanBarcode, Mic, MicOff } from 'lucide-react';
import { AppContext } from '../../contexts/AppContext';
import { processShoppingList, enrichFoodItemsBatch, generateConversationalRecipes, processReceiptImage, analyzeProductLabel, ImagePayload, EnrichedData } from '../../services/geminiService';
import type { PantryItem, AnalysisState, VerifiedItem, ProductAnalysisResult } from '../../types';
import RecipeCard from './RecipeCard';
import AnalysisProgressCard from './AnalysisProgressCard';
import ItemVerificationCard from './ItemVerificationCard';
import ProductAnalysisCard from './ProductAnalysisCard';
import { toTitleCase } from '../../utils/formatters';
import { useGeminiLive } from '../../hooks/useGeminiLive';

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
    const labelInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Gemini Live Integration
    const { isLive, isSpeaking, volume, startSession, stopSession } = useGeminiLive({ context: context! });

    // Ensure auto-scroll happens on chat history update
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [context?.chatHistory, isProcessing, isLive]); // Added isLive to scroll when live session updates
    
     useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; 
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${Math.min(scrollHeight, 120)}px`;
        }
    }, [userInput]);

    if (!context) return null;
    const { 
        pantry, addItemsToPantry, addMessageToChat, chatHistory, 
        clearChatQuickReplies, updateMessage, setViewingRecipe,
        awardXpForNewItem, userProfile, mealLog, feedPosts
    } = context;
    
    const startEnrichmentProcess = useCallback(async (itemsToProcess: {name: string, quantity: number, unit: string, isFood: boolean}[]) => {
         const analysisMessageId = addMessageToChat({ 
            role: 'model', 
            analysis: { status: 'enriching', progress: 0, totalItems: itemsToProcess.length, processedItems: [] }
        });

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

        const foodItemsToEnrich = itemsToProcess.filter(item => item.isFood);
        const CHUNK_SIZE = 8; 
        const chunks = chunkArray(foodItemsToEnrich, CHUNK_SIZE);
        
        let processedCount = 0;
        let skippedCount = itemsToProcess.length - foodItemsToEnrich.length;
        const allNewPantryItems: Omit<PantryItem, 'id'>[] = [];

        try {
            for (const chunk of chunks) {
                const chunkNames = chunk.map(item => item.name);
                try {
                    const enrichedDataChunk = await enrichFoodItemsBatch(chunkNames);
                    if (Array.isArray(enrichedDataChunk)) {
                        chunk.forEach(item => {
                            let enriched = enrichedDataChunk.find(e => 
                                (e?.name && item?.name) && (
                                    e.name.toLowerCase() === item.name.toLowerCase() || 
                                    item.name.toLowerCase().includes(e.name.toLowerCase())
                                )
                            );
                            
                            if (enriched) {
                                if (enriched.codexCategory === 'NON_FOOD') {
                                    skippedCount++;
                                    return;
                                }
                                const newItem: Omit<PantryItem, 'id'> = {
                                    name: toTitleCase(enriched.name || item.name),
                                    quantity: item.quantity, 
                                    unit: item.unit, 
                                    novaClassification: enriched.novaClassification || 'processed',
                                    codexCategory: enriched.codexCategory || 'Outros',
                                    ageWarningTag: enriched.ageWarningTag || '', 
                                    riskLevel: enriched.riskLevel || 'Médio',
                                    icon: enriched.icon || '📦',
                                    color: enriched.color || '#9CA3AF',
                                    nutritionalInfo: enriched.nutritionalInfo || { origin: '', benefits: [], risks: [], nutritionFacts: '' },
                                    tags: enriched.tags || [],
                                    tipRead: false,
                                    addedAt: Date.now(),
                                };
                                allNewPantryItems.push(newItem);
                                awardXpForNewItem(newItem); 
                            } else {
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
                                    nutritionalInfo: { origin: 'Desconhecida', benefits: [], risks: [], nutritionFacts: '' },
                                    tags: ['Item Adicionado'],
                                    tipRead: false,
                                    addedAt: Date.now(),
                                });
                            }
                        });
                    } else {
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

            if (allNewPantryItems.length > 0) {
                await addItemsToPantry(allNewPantryItems);
            }
            updateAnalysis({ status: 'done', progress: 100 });
            let finalMessage = `Pronto! Adicionei ${allNewPantryItems.length} itens à sua despensa.`;
            if (skippedCount > 0) finalMessage += ` (Ignorei ${skippedCount} itens que não pareciam comida).`;
            
            setTimeout(() => {
                addMessageToChat({ 
                    role: 'model', 
                    text: finalMessage,
                    quickReplies: ['Sugerir receitas', 'Ver despensa'] 
                });
            }, 800);

        } catch (error) {
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
            const addKeywords = ['adicionar', 'comprar', 'incluir', 'lista', 'faltou', 'bota'];
            const hasAddIntent = addKeywords.some(k => lowerMsg.includes(k));
            const recipeKeywords = ['receita', 'cozinhar', 'fome', 'sugestão', 'sugerir', 'jantar', 'almoço', 'café'];
            const hasRecipeIntent = recipeKeywords.some(k => lowerMsg.includes(k));
            const isLikelyList = message.includes('\n') || message.match(/\d+\s+(un|kg|g|l|ml)/i) || message.split(',').length > 2;
            
            if ((hasAddIntent || isLikelyList) && !intentContext && !hasRecipeIntent) {
                const parsedItems = await processShoppingList(message);
                if (parsedItems.length > 0) {
                   presentVerificationCard(parsedItems, thinkingMessageId);
                   return; 
                }
            }
            
            updateMessage(thinkingMessageId, { text: "Pensando..." });
            const historyForModel = chatHistory
                .filter(m => m.role === 'user' || m.role === 'model')
                .map(m => ({ role: m.role as 'user' | 'model', text: m.text }));

            const response = await generateConversationalRecipes(
                message, pantry, historyForModel, userProfile, mealLog, feedPosts, 
                intentContext || (hasRecipeIntent ? 'pantry_focus' : undefined)
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
        if (reply === 'Escanear Rótulo') { labelInputRef.current?.click(); return; }
        if (reply === 'Usar meu estoque') { processUserMessage("Sugira uma receita usando o que tenho na despensa", 'pantry_focus'); return; }
        if (reply === 'Da Comunidade') { processUserMessage("Sugira uma receita popular da comunidade", 'community_focus'); return; }
        if (reply === 'Me surpreenda') { processUserMessage("Sugira uma receita criativa e diferente", 'surprise_focus'); return; }
        processUserMessage(reply);
    };
    
    const presentVerificationCard = (parsedItems: (Partial<VerifiedItem> & { name: string, quantity: number, unit: string })[], messageId: string) => {
        const verificationItems: VerifiedItem[] = parsedItems.map(item => ({
            ...item,
            name: toTitleCase(item.name || ''), 
            id: `${item.name}-${Math.random()}`,
            isIncluded: item.isFood === false ? false : true, 
        }));
        updateMessage(messageId, {
            text: "Encontrei estes itens. Confirme antes de eu adicionar à despensa.",
            itemVerification: { status: 'pending', items: verificationItems }
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

    // Handlers for Image Upload and Label Scan
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
            const parsingMessageId = addMessageToChat({ role: 'model', analysis: { status: 'parsing', progress: 0, totalItems: 0, processedItems: [] } });
            const parsedItems = await processReceiptImage(payloads);
            if (parsedItems.length === 0) {
                 updateMessage(parsingMessageId, { text: "Não consegui encontrar itens nas imagens. Elas estão nítidas? Tente novamente, por favor.", analysis: undefined });
            } else {
                updateMessage(parsingMessageId, { analysis: { status: 'done', progress: 100, totalItems: parsedItems.length, processedItems: [] } });
                const verifyMsgId = addMessageToChat({ role: 'model' });
                presentVerificationCard(parsedItems.map(item => ({...item, isFood: item.isFood})), verifyMsgId);
            }
        } catch(error) {
            addMessageToChat({ role: 'model', text: error instanceof Error ? error.message : "Ocorreu um erro ao processar as imagens." });
        } finally {
            setIsProcessing(false);
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleLabelScan = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || isProcessing) return;
        setIsProcessing(true);
        const fileArray = Array.from(files);
        try {
            const payloadPromises = fileArray.map(fileToDataURL);
            const payloads = await Promise.all(payloadPromises);
            const imagePayload = payloads[0];
            addMessageToChat({ role: 'user', imageUrl: `data:${imagePayload.mimeType};base64,${imagePayload.data}`, text: "Analise este rótulo, por favor." });
            const analyzingMessageId = addMessageToChat({ role: 'model', text: "🔍 Analisando rótulo e tabela nutricional..."});
            const analysisResult = await analyzeProductLabel([imagePayload]);
            updateMessage(analyzingMessageId, { text: `Aqui está a análise do ${analysisResult.productName}!`, productAnalysis: analysisResult });
        } catch (error) {
            addMessageToChat({ role: 'model', text: error instanceof Error ? error.message : "Erro ao analisar o rótulo." });
        } finally {
            setIsProcessing(false);
            if(labelInputRef.current) labelInputRef.current.value = "";
        }
    };

    const handleAddAnalyzedProduct = async (messageId: string, packCount: number) => {
        setIsProcessing(true);
        try {
            const msg = chatHistory.find(m => m.id === messageId);
            if (!msg || !msg.productAnalysis) return;
            const baseQuantity = msg.productAnalysis.scannedItem.quantity || 1;
            const totalQuantity = baseQuantity * packCount;
            const itemToAdd = { ...msg.productAnalysis.scannedItem, quantity: totalQuantity, tipRead: false, addedAt: Date.now() };
            await addItemsToPantry([itemToAdd]);
            const xp = Math.round(msg.productAnalysis.healthScore / 2);
            awardXpForNewItem(itemToAdd); 
            updateMessage(messageId, { text: `Adicionado à despensa: ${totalQuantity} ${itemToAdd.unit} (${packCount}x pacotes) - Ganhou ${xp} XP pela escolha consciente.` });
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleItemsConfirmed = async (messageId: string, verifiedItems: VerifiedItem[]) => {
        setIsProcessing(true);
        updateMessage(messageId, { itemVerification: { status: 'verified', items: verifiedItems } });
        const itemsToProcess = verifiedItems.filter(item => item.isIncluded).map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit, isFood: item.isFood !== false }));
        if (itemsToProcess.length > 0) {
            await startEnrichmentProcess(itemsToProcess);
        } else {
            addMessageToChat({ role: 'model', text: "Nenhum item foi selecionado para adicionar." });
            setIsProcessing(false);
        }
    };

    const handleToggleLive = () => {
        if (isLive) {
            stopSession();
        } else {
            startSession();
        }
    };

    return (
        <div className="flex flex-col h-full bg-brand-background relative">
            {/* IN-CHAT LIVE HEADER */}
            {isLive && (
                <div className="bg-red-50 border-b border-red-100 p-2 flex items-center justify-center gap-3 animate-fade-in sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <span className="w-3 h-3 bg-red-500 rounded-full block animate-pulse"></span>
                            <span className="w-3 h-3 bg-red-500 rounded-full block absolute top-0 left-0 animate-ping opacity-30"></span>
                        </div>
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Modo Voz Ativo</span>
                    </div>
                    {/* Minimal Visualizer */}
                    <div className="flex items-end gap-0.5 h-4">
                        {[...Array(8)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-1 bg-red-400 rounded-full transition-all duration-75"
                                style={{ height: `${Math.max(20, Math.min(100, (volume * 1000) * (Math.random() + 0.5)))}%` }}
                            ></div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-grow overflow-y-auto p-5 space-y-6 pb-40 scroll-smooth">
                 {/* Chat History Rendering */}
                 {chatHistory.length > 1 && <div className="text-center py-4"><span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">Hoje</span></div>}
                 {chatHistory.length <= 1 && !isLive && (
                    <div className="flex flex-col items-center justify-center mt-10">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-3"><MessageSquare size={32} className="text-brand-primary" /></div>
                        <h3 className="font-bold text-brand-text mb-1">Olá! Sou o Professor Nutri.</h3>
                        <p className="text-sm text-brand-text-secondary text-center max-w-xs mb-6">Posso te ajudar a planejar refeições, analisar rótulos ou escanear sua nota fiscal.</p>
                        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                            <button onClick={() => handleQuickReply('Sugerir receitas')} className="bg-white border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-colors text-left">🍳 O que cozinhar hoje?</button>
                             <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-200 p-3 rounded-xl text-xs font-semibold text-gray-600 hover:border-brand-primary hover:text-brand-primary transition-colors text-left">🧾 Ler nota fiscal</button>
                            <button onClick={() => labelInputRef.current?.click()} className="col-span-2 bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"><ScanBarcode size={16} /> Escanear Rótulo de Produto</button>
                        </div>
                    </div>
                 )}

                {chatHistory.map((msg) => {
                    const isModelOrSystem = msg.role === 'model' || msg.role === 'system';
                    const isUser = msg.role === 'user';
                    if (msg.role === 'system') { if (msg.id === 'initial-system-message') return null; return (<div key={msg.id} className="text-center text-xs text-brand-text-secondary px-4 py-2 opacity-80">{msg.text}</div>) }
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
                           {isModelOrSystem && (<div className="w-8 h-8 rounded-xl bg-brand-primary flex-shrink-0 flex items-center justify-center shadow-sm self-end mb-1"><img src="/professor-nutri-favicon.png" alt="Nutri" className="w-5 h-5" /></div>)}
                           <div className={`flex flex-col max-w-[90%] sm:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`shadow-sm text-sm leading-relaxed ${isUser ? 'bg-brand-text text-white rounded-2xl rounded-tr-sm p-4' : 'bg-transparent w-full' }`}>
                                    {isModelOrSystem && msg.text && !msg.itemVerification && !msg.recipes && !msg.analysis && !msg.productAnalysis && (<div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm">{msg.text}</div>)}
                                    {isUser && msg.imageUrl && (<div className="mb-2 overflow-hidden rounded-lg border border-white/20"><img src={msg.imageUrl} alt="Nota fiscal enviada" className="max-w-full h-auto" /></div>)}
                                    {isUser && msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                                    {msg.recipes && (<div className="w-full space-y-3 mt-2">{msg.recipes.map((recipe, i) => (<RecipeCard key={i} recipe={recipe} onSelect={() => setViewingRecipe(recipe)} />))}</div>)}
                                    {msg.analysis && <AnalysisProgressCard analysis={msg.analysis} />}
                                    {msg.itemVerification && <ItemVerificationCard verificationState={msg.itemVerification} onConfirm={(items) => handleItemsConfirmed(msg.id, items)} />}
                                    {msg.productAnalysis && (<ProductAnalysisCard analysis={msg.productAnalysis} onConfirm={(packCount) => handleAddAnalyzedProduct(msg.id, packCount)} />)}
                               </div>
                                {msg.quickReplies && (<div className="flex flex-wrap gap-2 mt-3 animate-slide-in-up">{msg.quickReplies.map(reply => (<button key={reply} onClick={() => handleQuickReply(reply)} className="px-4 py-2 text-sm font-medium bg-white border border-brand-primary/20 text-brand-primary rounded-full hover:bg-brand-primary/5 shadow-sm transition-all">{reply}</button>))}</div>)}
                           </div>
                        </div>
                    );
                })}
                
                {/* Indicator when Model is processing logic or generating audio */}
                {(isProcessing || (isLive && isSpeaking)) && !chatHistory[chatHistory.length - 1]?.analysis && (
                     <div className="flex gap-3 flex-row ml-2">
                        <div className="w-8 h-8 rounded-xl bg-brand-primary flex-shrink-0 flex items-center justify-center shadow-sm self-end mb-1"><img src="/professor-nutri-favicon.png" alt="Nutri" className="w-5 h-5" /></div>
                        <div className="bg-white border border-gray-100 self-start p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center">
                            <div className="typing-indicator"><span/><span/><span/></div>
                        </div>
                     </div>
                )}
                <div ref={chatEndRef} />
                 <style>{`
                    .typing-indicator span { height: 6px; width: 6px; float: left; margin: 0 2px; background-color: #10B981; display: block; border-radius: 50%; opacity: 0.4; animation: 1s blink infinite; }
                    .typing-indicator span:nth-child(2) { animation-delay: .2s; }
                    .typing-indicator span:nth-child(3) { animation-delay: .4s; }
                    @keyframes blink { 50% { opacity: 1; transform: scale(1.2); } }
                `}</style>
            </div>
            
             <div className="fixed bottom-[90px] left-0 right-0 px-4 z-10 max-w-2xl mx-auto">
                <div className={`bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-float p-2 pl-3 flex items-end gap-2 transition-all duration-300 ${isLive ? 'ring-2 ring-red-400 bg-red-50/90' : ''}`}>
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="p-2.5 mb-0.5 text-brand-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl disabled:opacity-50 transition-colors" title="Escanear Nota Fiscal"><ImagePlus className="h-6 w-6" /></button>
                    <button type="button" onClick={() => labelInputRef.current?.click()} disabled={isProcessing} className="p-2.5 mb-0.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl disabled:opacity-50 transition-colors" title="Escanear Rótulo de Produto"><ScanBarcode className="h-6 w-6" /></button>
                    
                    {/* Text Input */}
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isLive ? "Fale com o Nutri..." : "Pergunte algo ou envie uma lista..."}
                        className="flex-grow py-3 bg-transparent border-none focus:outline-none resize-none text-brand-text placeholder:text-gray-400 text-base max-h-32 leading-relaxed"
                        disabled={isProcessing}
                    />
                    
                    <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                    <input type="file" accept="image/*" ref={labelInputRef} onChange={handleLabelScan} className="hidden" />
                    
                    {/* Mic Toggle */}
                    <button
                        onClick={handleToggleLive}
                        className={`p-2.5 mb-0.5 rounded-xl transition-all transform active:scale-95 ${isLive ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse' : 'text-brand-text-secondary hover:text-brand-primary hover:bg-brand-primary/10'}`}
                        title={isLive ? "Parar Conversa" : "Conversar por Voz"}
                    >
                        {isLive ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                    </button>

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
