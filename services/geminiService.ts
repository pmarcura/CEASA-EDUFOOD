
import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe, NovaClassificationKey, RiskLevel, NutritionalInfo, ChatMessage, PantryItem, UserProfile, MealLogEntry, MealPlanRequest, PlannedMeal, FeedPost, ProductAnalysisResult } from '../types';
import { CODEX_CATEGORIES, NOVA_CLASSIFICATION } from "../constants/foodClassifications";
import { FOOD_PERSONALITIES } from "../constants/profileOptions";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function cleanAndParseJSON(text: string): any {
    const firstOpenBracket = text.indexOf('[');
    const firstOpenBrace = text.indexOf('{');
    
    let startIndex = -1;
    let expectedEndChar = '';

    if (firstOpenBracket !== -1 && firstOpenBrace !== -1) {
        if (firstOpenBracket < firstOpenBrace) {
            startIndex = firstOpenBracket;
            expectedEndChar = ']';
        } else {
            startIndex = firstOpenBrace;
            expectedEndChar = '}';
        }
    } else if (firstOpenBracket !== -1) {
        startIndex = firstOpenBracket;
        expectedEndChar = ']';
    } else if (firstOpenBrace !== -1) {
        startIndex = firstOpenBrace;
        expectedEndChar = '}';
    }

    if (startIndex === -1) {
        try {
            return JSON.parse(text);
        } catch {
            console.error("No JSON structure found in text:", text);
            throw new Error("Não foi possível encontrar um JSON válido na resposta.");
        }
    }

    const lastEndIndex = text.lastIndexOf(expectedEndChar);
    
    if (lastEndIndex === -1 || lastEndIndex < startIndex) {
         throw new Error("JSON malformado: fim não encontrado.");
    }

    const jsonString = text.substring(startIndex, lastEndIndex + 1);

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON Parse Error (Cleaned):", jsonString);
        try {
             const sanitized = jsonString.replace(/[\u0000-\u001F]+/g, "");
             return JSON.parse(sanitized);
        } catch (e2) {
             throw new Error("Falha ao processar a resposta da IA (Parse Error).");
        }
    }
}

function getErrorMessage(error: unknown): string {
    let message = 'Ocorreu um erro desconhecido.';
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        message = (error as any).message;
    } else if (typeof error === 'string') {
        message = error;
    }

    const errorCode = typeof error === 'object' && error !== null && 'code' in error ? String((error as any).code) : '';

    if (errorCode === 'not-found') {
        return "Não foi possível conectar ao banco de dados. Verifique sua configuração do Firebase e a conexão com a internet.";
    }
    if (message.includes('429') || message.toLowerCase().includes('quota')) {
        return "Recebemos muitas solicitações no momento. Por favor, aguarde um pouco e tente novamente.";
    }

    return message;
}

function getMealTime(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Café da Manhã";
    if (hour >= 11 && hour < 15) return "Almoço";
    if (hour >= 15 && hour < 18) return "Lanche da Tarde";
    return "Jantar";
}

export interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  isFood: boolean;
}

export interface EnrichedData {
  novaClassification: NovaClassificationKey;
  codexCategory: string;
  ageWarningTag: string;
  riskLevel: RiskLevel;
  icon: string;
  color: string;
  nutritionalInfo: NutritionalInfo;
  tags: string[];
  name:string;
}

export interface ImagePayload {
    data: string;
    mimeType: string;
}

// --- LOCAL DICTIONARIES FOR OPTIMIZATION ---

const FOOD_GROUPS_KEYWORDS = {
    proteins: ['carne', 'frango', 'peixe', 'ovo', 'feijão', 'lentilha', 'grão de bico', 'soja', 'porco', 'boi', 'atum', 'sardinha', 'iogurte', 'queijo', 'leite', 'camarão', 'peru', 'presunto', 'bacon', 'linguiça', 'salsicha', 'tofu'],
    grains: ['arroz', 'batata', 'macarrão', 'pão', 'farinha', 'aveia', 'milho', 'mandioca', 'aipim', 'cará', 'inhame', 'trigo', 'massa', 'cuscuz', 'tapioca', 'bolacha', 'biscoito', 'cereal', 'granola', 'polenta'],
    vegetables: ['tomate', 'alface', 'cenoura', 'abóbora', 'abobrinha', 'berinjela', 'brócolis', 'couve', 'espinafre', 'rúcula', 'pepino', 'pimentão', 'cebola', 'alho', 'fruta', 'maçã', 'banana', 'laranja', 'limão', 'uva', 'morango', 'manga', 'abacaxi', 'mamão', 'melão', 'melancia', 'pera', 'pêssego', 'quiabo', 'vagem', 'beterraba', 'repolho', 'couve-flor', 'agrião', 'salada']
};

const SWAP_DICTIONARY: Record<string, { after: string, benefit: string }> = {
    'achocolatado': { after: 'Cacau em pó 70% ou 100%', benefit: 'Menos açúcar, mais antioxidantes e sabor intenso de chocolate.' },
    'nescau': { after: 'Cacau em pó com pouco açúcar', benefit: 'Redução drástica de açúcar e aditivos.' },
    'toddy': { after: 'Cacau em pó com mel', benefit: 'Opção mais natural sem excesso de açúcares industriais.' },
    'refrigerante': { after: 'Água com gás e limão/frutas', benefit: 'Hidratação sem calorias vazias ou excesso de açúcar.' },
    'coca': { after: 'Água com gás e rodela de laranja', benefit: 'Refrescante e livre de corantes e ácido fosfórico.' },
    'guaraná': { after: 'Chá gelado natural', benefit: 'Menos açúcar e sem corantes artificiais.' },
    'salsicha': { after: 'Carne moída ou Frango desfiado', benefit: 'Proteína real sem nitritos e conservantes nocivos.' },
    'presunto': { after: 'Peito de frango assado fatiado', benefit: 'Menos sódio e processamento químico.' },
    'nuggets': { after: 'Iscas de frango caseiras (frango empanado)', benefit: 'Carne de verdade, sem sobras industriais.' },
    'hambúrguer congelado': { after: 'Hambúrguer caseiro', benefit: 'Controle total dos ingredientes e menos aditivos.' },
    'biscoito recheado': { after: 'Biscoito caseiro ou Fruta com pasta de amendoim', benefit: 'Menos gordura hidrogenada e açúcar.' },
    'bolacha recheada': { after: 'Bolo caseiro simples', benefit: 'Ingredientes conhecidos e menos conservantes.' },
    'suco de caixinha': { after: 'Suco da fruta natural ou Água', benefit: 'Vitaminas preservadas e sem xarope de açúcar.' },
    'suco em pó': { after: 'Água saborizada com frutas reais', benefit: 'Livre de corantes artificiais e sódio excessivo.' },
    'tempero pronto': { after: 'Ervas naturais, alho e cebola', benefit: 'Sabor real sem excesso de sódio e glutamato.' },
    'caldo knorr': { after: 'Caldo caseiro ou ervas finas', benefit: 'Saúde cardiovascular protegida do excesso de sódio.' },
    'sazon': { after: 'Páprica, Cúrcuma e Orégano', benefit: 'Antioxidantes naturais em vez de realçadores químicos.' },
    'miojo': { after: 'Macarrão cabelo de anjo com tempero caseiro', benefit: 'Fica pronto rápido igual, mas sem a gordura da fritura.' },
    'macarrão instantâneo': { after: 'Cuscus ou Macarrão fininho', benefit: 'Opção rápida e muito mais nutritiva.' },
    'salgadinho': { after: 'Pipoca de panela', benefit: 'Fibra integral e menos gordura saturada.' },
    'chips': { after: 'Chips de batata doce caseiro', benefit: 'Assado em vez de frito, preservando nutrientes.' },
    'iogurte saborizado': { after: 'Iogurte natural com fruta picada', benefit: 'Menos corantes e açúcar, mais probióticos reais.' },
    'danoninho': { after: 'Inhame batido com morango', benefit: 'Textura igual, mas rico em vitaminas e sem corantes.' },
    'margarina': { after: 'Manteiga ou Azeite', benefit: 'Gorduras mais naturais e menos processadas.' },
    'óleo de soja': { after: 'Azeite de oliva ou banha', benefit: 'Melhor perfil lipídico e estabilidade térmica.' }
};

// --- AI FUNCTIONS ---

export const processReceiptImage = async (images: ImagePayload[]): Promise<ParsedItem[]> => {
    try {
        const imageParts = images.map(img => ({
            inlineData: {
                mimeType: img.mimeType,
                data: img.data,
            },
        }));

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { 
                parts: [
                    { text: `Você é um Analista Forense de Cupons Fiscais Brasileiros (NFC-e/SAT).
                    
                    PROBLEMA: Os sistemas de caixa registram "1 UN" na linha do nome, mas o peso real está na linha de baixo (cálculo do preço).
                    
                    EXEMPLO DE LEITURA CORRETA:
                    Linha 1: "QUEIJO MUSSARELA" (Ignorar código 57192502)
                    Linha 2: "0,300 X 17,49" -> AQUI ESTÁ A VERDADE. A quantidade é 0.300 e a unidade é KG.
                    
                    SUA MISSÃO:
                    1. **Prioridade Absoluta ao Peso Decimal:** Se você vir um número decimal (0,### ou 1,###) seguido de 'X' (multiplicação de preço) logo abaixo ou ao lado do item, ESSA é a quantidade. Ignore o "1 UN" genérico.
                    2. **Unidades:**
                       - Se o peso for decimal (ex: 0.200), a unidade é quase sempre 'kg'.
                       - Se for unitário (ex: 3 LATAS), a unidade é 'un' ou 'lata'.
                    3. **Limpeza de Nome:**
                       - Remova códigos numéricos do início (ex: "00123 ALCATRA" -> "ALCATRA").
                       - Remova "KG", "UN", "PC" do final do nome se você já extraiu isso como unidade.
                    4. **Filtro de Comida (isFood):**
                       - "DESOD", "SANIT", "SABAO", "DET", "LIXO", "ALCOOL", "HIGIENE" -> isFood: false.
                       - Comida/Bebida -> isFood: true.

                    Retorne um JSON Array estrito.` },
                    ...imageParts
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            unit: { type: Type.STRING },
                            isFood: { type: Type.BOOLEAN },
                        },
                        required: ["name", "quantity", "unit", "isFood"]
                    },
                },
            },
        });

        return cleanAndParseJSON(response.text);
    } catch (error) {
        console.error("Error processing receipt images:", error);
        throw new Error(`Erro ao processar imagens:\n${getErrorMessage(error)}`);
    }
};

export const analyzeProductLabel = async (images: ImagePayload[]): Promise<ProductAnalysisResult> => {
    try {
        const imageParts = images.map(img => ({
            inlineData: {
                mimeType: img.mimeType,
                data: img.data,
            },
        }));

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { text: `Você é um Nutricionista Infantil e Detetive de Rótulos.
                    
                    ANALISE A IMAGEM DO PRODUTO (Rótulo/Embalagem).
                    
                    MISSÃO:
                    1. IDENTIFICAÇÃO PRECISA: Extraia Nome, Marca e **Tamanho/Peso Exato** (ex: "2 Litros", "350g", "200ml").
                       *IMPORTANTE:* Se a foto estiver ruim, USE A FERRAMENTA 'Google Search' com o nome/marca que você identificar para descobrir os ingredientes e tabela nutricional oficiais.
                    
                    2. TRADUÇÃO EDUCATIVA (ESTILO PAI/MÃE INFORMADO):
                       - Se for ULTRAPROCESSADO: Seja brutalmente honesto. Identifique os aditivos químicos e explique o risco (ex: "Glutamato: engana o cérebro", "Corante Amarelo: risco de hiperatividade", "Xarope de milho: sobrecarga de açúcar"). Não suavize.
                       - Se for IN NATURA: Exalte a natureza. Destaque a pureza e os benefícios diretos para o crescimento e biologia.

                    3. PREPARAR PARA DESPENSA (scannedItem):
                       - **REGRA DE QUANTIDADE:** A 'quantity' DEVE SER O PESO LÍQUIDO DE **UM ÚNICO PACOTE**.
                       - Ex: Se a foto mostra um pacote de 500g, quantity = 500, unit = 'g'.
                       - Ex: Se é uma garrafa de 2L, quantity = 2, unit = 'l'.
                       - NÃO tente adivinhar quantos pacotes a pessoa comprou. Assuma 1 pacote. O usuário dirá quantos comprou depois.

                    SAÍDA OBRIGATÓRIA (JSON):
                    {
                        "productName": "string",
                        "brand": "string",
                        "size": "string",
                        "novaClassification": "in_natura" | "culinary_ingredients" | "processed" | "ultra_processed",
                        "healthScore": number,
                        "additivesExplained": [{ "term": "string", "explanation": "string", "risk": "low" | "medium" | "high" }],
                        "positivePoints": ["string"],
                        "negativePoints": ["string"],
                        "scannedItem": {
                            "name": "string",
                            "quantity": number, // Peso de UMA unidade/pacote
                            "unit": "string",
                            "novaClassification": "string",
                            "codexCategory": "string",
                            "ageWarningTag": "string",
                            "riskLevel": "string",
                            "icon": "string",
                            "color": "string",
                            "nutritionalInfo": { ... },
                            "tags": ["string"]
                        }
                    }
                    
                    Não use markdown. Retorne JSON cru.` },
                    ...imageParts
                ]
            },
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        return cleanAndParseJSON(response.text);
    } catch (error) {
        console.error("Error analyzing product label:", error);
        throw new Error(`Erro ao analisar rótulo:\n${getErrorMessage(error)}`);
    }
};

export const processShoppingList = async (text: string): Promise<ParsedItem[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analise esta lista de compras digitada manualmente: "${text}".
            
            Regras:
            1. Extraia: Nome, Quantidade (padrão 1), Unidade (padrão 'un').
            2. Identifique se é comida ('isFood').
               - Produtos de limpeza, higiene, remédios, utensílios, ração = false.
               - Comida, bebida = true.
            3. Retorne JSON Array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            unit: { type: Type.STRING },
                            isFood: { type: Type.BOOLEAN }
                        },
                        required: ["name", "quantity", "unit", "isFood"]
                    },
                },
            },
        });
        
        return cleanAndParseJSON(response.text);

    } catch (error) {
        console.error("Error parsing shopping list:", error);
        return [];
    }
};

export const enrichFoodItemsBatch = async (itemNames: string[]): Promise<EnrichedData[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Você é um Engenheiro de Alimentos Sênior e Nutricionista (Especialista em NOVA e Ciência dos Alimentos).
            ENTRADA: ${JSON.stringify(itemNames)}

            SUA MISSÃO É FORNECER UMA "FICHA TÉCNICA" DETALHADA, EDUCATIVA E DISTINTA PARA CADA TIPO DE ALIMENTO.
            
            **REGRA DE OURO (DADOS AUSENTES):** 
            Se não encontrar a marca exata, **USE SEU CONHECIMENTO TÉCNICO** para descrever o alimento genérico. 
            NUNCA responda "Desconhecido", "N/A" ou deixe vazio.

            **1. IDENTIFICAÇÃO (Name & Icon):**
            - Traduza abreviações: "BL FERM" -> "Bebida Láctea", "BISC" -> "Biscoito".
            - **name**: Nome correto e limpo.
            - **icon**: Escolha UM emoji preciso (ex: 🥒, 🍎, 🥩).

            **2. CLASSIFICAÇÃO NOVA (Rigorosa):**
            - **in_natura**: Frutas, Legumes, Carnes, Ovos, Leite, Arroz, Feijão.
            - **processed**: Conservas, Queijos, Pães artesanais.
            - **ultra_processed**: Salsicha, Nuggets, Refrigerante, Biscoito Recheado, Iogurte com corante, Miojo.

            **3. ORIGEM E PROCESSO (origin) - EXTREMA IMPORTÂNCIA:**
            - **SE FOR IN NATURA/MINIMAMENTE PROCESSADO:** Exalte a natureza. Descreva a origem botânica ou animal e como ele é rico naturalmente em vitaminas específicas (cite quais). Fale como se fosse um tesouro da terra.
              *Ex: "Fruto da planta Fragaria, colhido manualmente. Uma bomba biológica de Vitamina C e antioxidantes que protegem as células."*
            
            - **SE FOR ULTRAPROCESSADO:** SEJA BRUTALMENTE HONESTO e EDUCATIVO. Não use eufemismos. Explique que é uma formulação industrial. Mencione a "engenharia" para viciar o paladar. Cite os aditivos genéricos prováveis (emulsificantes, corantes).
              *Ex: "Produto de bioengenharia industrial. Massa feita de farinha refinada (pobre em nutrientes), misturada com gordura vegetal hidrogenada, aromatizantes sintéticos para simular sabor e conservantes para durar anos na prateleira. Baixíssimo valor nutricional."*

            **4. FATOS NUTRICIONAIS (nutritionFacts) - CRIE UM RÓTULO:**
            - Gere uma estimativa baseada em 100g do alimento padrão (Tabela TACO/USDA).
            - Formato OBRIGATÓRIO (Texto rico):
              "Porção de 100g (Estimada):\n• Energia: 15 kcal\n• Carboidratos: 3.6g\n• Proteínas: 0.7g\n• Gorduras: 0.1g\n• Fibras: 0.5g"

            **SAÍDA JSON:**
            Retorne EXATAMENTE um array JSON válido. Sem markdown.`,
            config: {
                tools: [{ googleSearch: {} }], 
            },
        });
        
        return cleanAndParseJSON(response.text || "[]");

    } catch (error) {
        console.error("Error enriching food items:", error);
        throw new Error(`Erro ao enriquecer itens:\n${getErrorMessage(error)}`);
    }
};

// --- CONTEXT BUILDING HELPERS ---

const buildFamilyContext = (userProfile: UserProfile | null): string => {
    if (!userProfile || !userProfile.children || userProfile.children.length === 0) {
        return "Contexto Familiar: O usuário não forneceu detalhes sobre as crianças.";
    }

    let contextString = "CONTEXTO CRÍTICO DAS CRIANÇAS (LEIA COM ATENÇÃO):\n";

    userProfile.children.forEach((child, index) => {
        contextString += `\n[CRIANÇA ${index + 1}]: ${child.name} (${child.age} anos)\n`;
        
        // Process Food Personalities (Array)
        const personalities = Array.isArray(child.foodPersonality) ? child.foodPersonality : (child.foodPersonality ? [child.foodPersonality] : []);
        
        if (personalities.length > 0) {
            contextString += `  - Comportamento Alimentar:\n`;
            personalities.forEach(pId => {
                const personalityDef = FOOD_PERSONALITIES.find(p => p.id === pId);
                if (personalityDef) {
                    contextString += `    * ${personalityDef.label} (Definição: ${personalityDef.description}). Instrução para IA: ${personalityDef.aiInstruction}\n`;
                }
            });
        } else {
             contextString += `  - Comportamento Alimentar: Padrão/Não informado. Instrução: Ofereça variedade sem pressão.\n`;
        }
        
        if (child.dislikedFoods) {
            contextString += `  - ⚠️ ALIMENTOS ODIADOS (EVITAR): ${child.dislikedFoods}\n`;
        }
        
        // Seletividade
        const selectivity = child.foodSelectivity;
        if (selectivity.level !== 'low' || selectivity.context) {
            contextString += `  - Seletividade: ${selectivity.level === 'high' ? 'ALTA (Cuidado redobrado)' : 'Média'}. ${selectivity.context ? `Detalhe: "${selectivity.context}"` : ''}\n`;
        }

        // Restrições Médicas/Religiosas
        const restrictions = [];
        if (child.restrictions.autism) restrictions.push('Sensibilidade (TEA) - Atenção a texturas misturadas');
        if (child.restrictions.psychological) restrictions.push('Fatores comportamentais');
        if (child.religiousDiets?.length) restrictions.push(...child.religiousDiets);
        if (child.medicalConditions) restrictions.push(child.medicalConditions);
        
        if (restrictions.length > 0) {
            contextString += `  - 🛑 RESTRIÇÕES RIGOROSAS: ${restrictions.join(', ')}.\n`;
        }
    });

    return contextString;
};

const buildMealContext = (mealLog: MealLogEntry[]): string => {
    if (!mealLog || mealLog.length === 0) {
        return "Histórico de Refeições: Nenhuma refeição recente.";
    }

    // Filter relevant meals (recent or heavily criticized/praised)
    const relevantMeals = mealLog
        .sort((a, b) => b.timestamp - a.timestamp) // Newest first
        .slice(0, 15); // Last 15 meals

    if (relevantMeals.length === 0) {
        return "Histórico: Nenhuma refeição recente.";
    }

    let contextString = "HISTÓRICO DE REFEIÇÕES E FEEDBACK (APRENDA COM ISSO):\n";
    
    relevantMeals.forEach(meal => {
        const date = new Date(meal.timestamp).toLocaleDateString('pt-BR', { weekday: 'short' });
        let feedbackSummary = "";
        let sentiment = "NEUTRO";
        
        if (meal.feedbackRating) {
            const stars = "⭐".repeat(meal.feedbackRating);
            feedbackSummary = `Nota: ${meal.feedbackRating}/5 ${stars}`;
            if (meal.feedbackText) feedbackSummary += ` | Comentário: "${meal.feedbackText}"`;
            
            if(meal.feedbackRating >= 4) sentiment = "SUCESSO";
            if(meal.feedbackRating <= 2) sentiment = "FALHA";
        }

        contextString += `  - [${sentiment}] ${date}: "${meal.recipeTitle}". ${feedbackSummary}\n`;
        
        // Add explicit instruction based on rating
        if (sentiment === "FALHA") {
            contextString += `    >>> INSTRUÇÃO: A família rejeitou isso. Analise os ingredientes e NÃO repita esse padrão/textura.\n`;
        } else if (sentiment === "SUCESSO") {
            contextString += `    >>> INSTRUÇÃO: A família amou. Tente receitas com perfil similar.\n`;
        }
    });

    return contextString;
};

export const generateInstantRecipe = async (
    pantryItems: string[],
    newIngredientsImages: ImagePayload[],
    extraText: string,
    userProfile: UserProfile | null,
    mealLog: MealLogEntry[]
): Promise<Recipe> => {
    const familyContext = buildFamilyContext(userProfile);
    const mealContext = buildMealContext(mealLog);
    
    const inputs = [
        { text: `Você é um Chef de Cozinha e Nutricionista Pediátrico Focado em EFICIÊNCIA.
        
        MISSÃO: Criar uma receita "Mágica" INSTANTÂNEA com o que o usuário tem agora.
        
        ENTRADAS:
        - Despensa Selecionada: ${pantryItems.join(', ')}
        - Texto Extra do Usuário: "${extraText}"
        - Imagens: (Anexadas) - Podem ser ingredientes novos.
        
        CONTEXTO FAMILIAR OBRIGATÓRIO:
        ${familyContext}
        ${mealContext}
        
        REGRAS DE OURO:
        1. **RAPIDEZ:** Foque em "One Pot Meal", "Assadeira Única" ou algo de 20-30min.
        2. **SEM GERAÇÃO DE IMAGEM DEMORADA:** Para os passos, NÃO descreva imagens complexas. Use EMOJIS específicos (🔪, 🍳, ⏲️) no início de cada instrução.
        3. **EXPLICAÇÃO PARENTAL (CRUCIAL):** No campo "chefNote" (ou no início da "presentation_suggestion"), você DEVE explicar explicitamente POR QUE fez certas escolhas baseadas no perfil da criança.
           - Exemplo: "Separei o molho porque vi que o João (Seletivo) rejeitou misturas na semana passada."
           - Exemplo: "Escolhi assar para ficar crocante, já que a Maria gosta de texturas."
        
        SAÍDA: JSON estrito do objeto Recipe.` }
    ];

    if (newIngredientsImages.length > 0) {
        newIngredientsImages.forEach(img => {
            inputs.push({
                inlineData: {
                    mimeType: img.mimeType,
                    data: img.data
                }
            } as any);
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: inputs },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        total_time_min: { type: Type.NUMBER },
                        serves: { type: Type.STRING },
                        level: { type: Type.STRING, enum: ['Fácil', 'Médio', 'Difícil'] },
                        context_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    section: { type: Type.STRING },
                                    items: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: { type: Type.STRING },
                                                quantity: { type: Type.NUMBER },
                                                unit: { type: Type.STRING },
                                                displayString: { type: Type.STRING }
                                            },
                                            required: ["name", "quantity", "unit", "displayString"]
                                        }
                                    }
                                },
                                required: ["section", "items"]
                            }
                        },
                        tools: { type: Type.ARRAY, items: { type: Type.STRING } },
                        steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    order: { type: Type.NUMBER },
                                    title: { type: Type.STRING },
                                    time_min: { type: Type.NUMBER },
                                    instruction: { type: Type.STRING },
                                    child_friendly: { type: Type.STRING },
                                    safety: { type: Type.STRING },
                                    tip: { type: Type.STRING },
                                    utensil: { type: Type.STRING }
                                },
                                required: ["order", "title", "time_min", "instruction"]
                            }
                        },
                        presentation_suggestion: { type: Type.STRING, description: "Inclua aqui a explicação da adaptação para os pais se não houver campo chefNote." },
                        storage: { type: Type.STRING }
                    },
                    required: ["title", "total_time_min", "serves", "level", "ingredients", "tools", "steps", "storage", "allergens", "context_tags", "presentation_suggestion"]
                }
            }
        });
        
        const recipe = cleanAndParseJSON(response.text) as Recipe;
        
        // Force injection of adaptation note if AI put it in presentation suggestion uniquely or missed it
        // We rely on the prompt instructions heavily here.
        
        return recipe;
    } catch (error) {
        console.error("Error generating instant recipe:", error);
        throw new Error("Não foi possível criar a receita mágica agora. Tente novamente.");
    }
};

export const generateConversationalRecipes = async (
    userInput: string,
    pantryItems: PantryItem[], 
    chatHistory: { role: 'user' | 'model'; text?: string }[],
    userProfile: UserProfile | null,
    mealLog: MealLogEntry[],
    feedPosts: FeedPost[] = [], 
    intentContext?: string 
): Promise<{ text: string; recipes?: Recipe[] }> => {
    const mealTime = getMealTime();
    const familyContext = buildFamilyContext(userProfile);
    const mealContext = buildMealContext(mealLog);
    
    // Create a richer representation of the pantry with quantity and PREFERENCES
    const pantryContext = pantryItems.map(i => {
        let details = `- ${i.name} (${i.quantity} ${i.unit})`;
        
        // Append preference data if available - CRITICAL STEP
        if (i.childPreferences && userProfile?.children) {
            const prefs = userProfile.children.map(c => {
                const rating = i.childPreferences?.[c.id];
                if (rating) {
                    const feeling = rating <= 2 ? 'ODEIA' : rating >= 4 ? 'AMA' : 'Neutro';
                    return `${c.name}: ${rating}⭐ (${feeling})`;
                }
                return null;
            }).filter(Boolean).join(', ');
            
            if (prefs) {
                details += ` [PREFERÊNCIAS REAIS: ${prefs}]`;
            }
        }
        return details;
    }).join('\n');

    let feedContext = "";
    if (intentContext === 'community_focus' && feedPosts.length > 0) {
        feedContext = "Destaques da Comunidade (Use para inspirar a resposta):\n" + 
            feedPosts.slice(0, 5).map(p => `- ${p.recipe?.title || 'Prato'} por ${p.authorName}: ${p.caption}`).join('\n');
    }

    let systemInstruction = `Você é o Professor Nutri, um Nutricionista Pediátrico, Cientista de Alimentos e Parceiro dos Pais.
    
    SUA PERSONA:
    - **Conversacional e Carismático:** Você não é um robô de receitas. Você conversa, explica, tira dúvidas e conta curiosidades.
    - **Linguagem:** Acessível ("Português de Pai/Mãe"), empática, mas com base científica sólida. Use emojis moderadamente.
    - **Educador:** Se perguntarem "qual o alimento mais saudável?", não dê apenas um nome. Explique o conceito (ex: "O leite materno é o único completo, mas para crianças maiores, o segredo é a variedade/cores...").
    
    SEUS MODOS DE OPERAÇÃO:
    1. **Modo Chef (Pedido de Receita/Ajuda Prática):**
       - Se o usuário pedir "o que cozinhar", "tenho fome", "receita de X": Gere o objeto JSON preenchendo o campo "recipes".
       - Analise a despensa e o histórico para personalizar (ex: "Vi que o João não gostou de berinjela, então...").
    
    2. **Modo Consultor (Dúvidas/Curiosidades/Conversa):**
       - Se o usuário perguntar "refrigerante faz mal?", "como fazer meu filho comer salada?", "qual a fruta mais doce?":
       - Responda APENAS no campo "text". NÃO invente receitas se não pedirem.
       - Dê uma resposta direta, educativa e prática. Use psicologia comportamental para dicas de seletividade.

    FORMATO DA RESPOSTA (JSON):
    Retorne SEMPRE um objeto JSON.
    - "text": Sua resposta falada/escrita (Obrigatório).
    - "recipes": Array de receitas (Opcional, apenas se o usuário pedir ou precisar).
    `;
    
    if (intentContext === 'pantry_focus') {
        systemInstruction += ` PRIORIDADE: O usuário quer cozinhar AGORA. Use o que tem na despensa.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${systemInstruction}

--- DADOS DA FAMÍLIA (CRUCIAL) ---
${familyContext}

--- HISTÓRICO DE SUCESSOS E FRACASSOS ---
${mealContext}

--- DESPENSA E AVALIAÇÕES (ESTRELAS) ---
${pantryContext || "Despensa vazia."}

--- ESTADO ATUAL ---
- Mensagem do usuário: "${userInput}"
- Horário: ${mealTime}
- Histórico Chat Recente: ${JSON.stringify(chatHistory.slice(-3))}
${feedContext}

--- INSTRUÇÃO FINAL ---
Analise a intenção do usuário. 
- É uma dúvida teórica? Responda com sabedoria e simpatia no "text".
- É um pedido de ação/comida? Responda no "text" e inclua "recipes".

Responda APENAS com JSON válido.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING, description: "Sua resposta conversacional, natural e educativa." },
                        recipes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    total_time_min: { type: Type.NUMBER },
                                    serves: { type: Type.STRING },
                                    level: { type: Type.STRING, enum: ['Fácil', 'Médio', 'Difícil'] },
                                    context_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    ingredients: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                section: { type: Type.STRING },
                                                items: {
                                                    type: Type.ARRAY,
                                                    items: {
                                                        type: Type.OBJECT,
                                                        properties: {
                                                            name: { type: Type.STRING },
                                                            quantity: { type: Type.NUMBER },
                                                            unit: { type: Type.STRING },
                                                            displayString: { type: Type.STRING }
                                                        },
                                                        required: ["name", "quantity", "unit", "displayString"]
                                                    }
                                                }
                                            },
                                            required: ["section", "items"]
                                        }
                                    },
                                    tools: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    steps: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                order: { type: Type.NUMBER },
                                                title: { type: Type.STRING },
                                                time_min: { type: Type.NUMBER },
                                                instruction: { type: Type.STRING },
                                                child_friendly: { type: Type.STRING },
                                                safety: { type: Type.STRING },
                                                tip: { type: Type.STRING },
                                                utensil: { type: Type.STRING }
                                            },
                                            required: ["order", "title", "time_min", "instruction"]
                                        }
                                    },
                                    presentation_suggestion: { type: Type.STRING },
                                    storage: { type: Type.STRING }
                                },
                                required: ["title", "total_time_min", "serves", "level", "ingredients", "tools", "steps", "storage", "allergens", "context_tags"]
                            }
                        }
                    },
                    required: ["text"]
                },
            },
        });
        return cleanAndParseJSON(response.text);
    } catch (error) {
        console.error("Error generating conversational recipes:", error);
        throw new Error(`Erro ao gerar resposta:\n${getErrorMessage(error)}`);
    }
};

export const generateMealPlan = async (
    request: MealPlanRequest,
    pantryItems: PantryItem[],
    userProfile: UserProfile | null,
    mealLog: MealLogEntry[]
): Promise<PlannedMeal[]> => {
    const familyContext = buildFamilyContext(userProfile);
    const mealContext = buildMealContext(mealLog);
    const pantryContext = pantryItems.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ') || "A despensa está vazia.";

    const priorityMapping = {
        use_pantry: "Aproveitar o que já temos em casa",
        healthy: "Comida o mais saudável possível",
        new_foods: "Introduzir alimentos saudáveis novos",
        economy: "Gastar o menos possível"
    };

    const daysOfWeek = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
    const nightsToCook = request.nightsToCook || 3;
    const busyDays = request.busyDays || [];
    
    // Extract requested meals (breakfast, lunch, snack, dinner)
    const requestedMeals = request.meals || ['dinner'];

    const prompt = `Você é o Professor Nutri, um estrategista alimentar familiar.
Gere um plano de refeições INTELIGENTE que respeite profundamente o perfil das crianças.

--- PERFIL E ESTRATÉGIA ---
${familyContext}

--- HISTÓRICO ---
${mealContext}

--- PEDIDO ---
  - REFEIÇÕES A PLANEJAR: ${requestedMeals.join(', ')}. (IMPORTANTE: Gere APENAS para estes tipos).
  - Contexto 'snack' (Lanche da Tarde): Se solicitado, sugira opções leves, práticas e lúdicas para crianças (frutas, iogurtes caseiros, sanduíches naturais, bolos saudáveis). Diferente de almoço/jantar.
  - Quantidade de dias: ${nightsToCook} dias.
  - Dias corridos (receitas < 20min): ${busyDays.join(', ') || 'Nenhum'}.
  - Prioridade: "${priorityMapping[request.priority || 'use_pantry']}".
  - Ingredientes Extras: ${request.specificIngredients?.join(', ') || 'Nenhum'}.
  - Evitar: ${request.avoidItems?.join(', ') || 'Nenhum'}.
  - Despensa: [${pantryContext}].

Tarefas:
1. Crie um plano cobrindo os ${nightsToCook} dias seguintes.
2. Para CADA dia, gere UMA receita para CADA tipo de refeição solicitada (${requestedMeals.join(', ')}).
3. Analise a Despensa para 'pantryStatus' (complete/partial/missing) e liste 'missingItems'.
4. Respeite TODAS as restrições alimentares e gostos das crianças.
5. Evite repetições recentes.
6. Use os dias da semana: ${daysOfWeek.join(', ')}.
7. GARANTA que 'allergens' e 'context_tags' estejam presentes.

Responda APENAS com um array JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            dayOfWeek: { type: Type.STRING, enum: daysOfWeek },
                            mealType: { type: Type.STRING, enum: ['breakfast', 'lunch', 'snack', 'dinner'] },
                            recipe: {
                                type: Type.OBJECT,
                                description: "A receita completa.",
                                properties: {
                                    title: { type: Type.STRING },
                                    total_time_min: { type: Type.NUMBER },
                                    serves: { type: Type.STRING },
                                    level: { type: Type.STRING, enum: ['Fácil', 'Médio', 'Difícil'] },
                                    context_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    pantryStatus: { type: Type.STRING, enum: ['complete', 'partial', 'missing'] },
                                    missingItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    ingredients: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                section: { type: Type.STRING },
                                                items: {
                                                    type: Type.ARRAY,
                                                    items: {
                                                        type: Type.OBJECT,
                                                        properties: {
                                                            name: { type: Type.STRING },
                                                            quantity: { type: Type.NUMBER },
                                                            unit: { type: Type.STRING },
                                                            displayString: { type: Type.STRING }
                                                        },
                                                        required: ["name", "quantity", "unit", "displayString"]
                                                    }
                                                }
                                            },
                                            required: ["section", "items"]
                                        }
                                    },
                                    tools: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    steps: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                order: { type: Type.NUMBER },
                                                title: { type: Type.STRING },
                                                time_min: { type: Type.NUMBER },
                                                instruction: { type: Type.STRING },
                                                child_friendly: { type: Type.STRING },
                                                safety: { type: Type.STRING },
                                                tip: { type: Type.STRING },
                                                utensil: { type: Type.STRING }
                                            },
                                            required: ["order", "title", "time_min", "instruction"]
                                        }
                                    },
                                    presentation_suggestion: { type: Type.STRING },
                                    storage: { type: Type.STRING }
                                },
                                required: ["title", "total_time_min", "serves", "level", "ingredients", "tools", "steps", "storage", "pantryStatus", "allergens", "context_tags"]
                            }
                        },
                        required: ["dayOfWeek", "mealType", "recipe"]
                    }
                },
            },
        });
        return cleanAndParseJSON(response.text);
    } catch (error) {
        console.error("Error generating meal plan:", error);
        throw new Error(`Erro ao gerar plano:\n${getErrorMessage(error)}`);
    }
};


// --- LOCAL IMPLEMENTATION FOR FOOD GROUPS ---
export const analyzeRecipeForFoodGroups = async (ingredients: string[]): Promise<{ proteins: number; grains: number; vegetables: number; }> => {
    const portions = { proteins: 0, grains: 0, vegetables: 0 };
    
    ingredients.forEach(ingredientLine => {
        const lowerLine = ingredientLine.toLowerCase();
        
        // Basic logic using dictionaries
        let found = false;
        if (FOOD_GROUPS_KEYWORDS.proteins.some(k => lowerLine.includes(k))) {
            portions.proteins += 1;
            found = true;
        }
        if (!found && FOOD_GROUPS_KEYWORDS.grains.some(k => lowerLine.includes(k))) {
            portions.grains += 1;
            found = true;
        }
        if (!found && FOOD_GROUPS_KEYWORDS.vegetables.some(k => lowerLine.includes(k))) {
            portions.vegetables += 1;
        }
    });

    return portions;
};

// --- LOCAL IMPLEMENTATION FOR SWAPS ---
export const generateSwaps = async (itemNames: string[]): Promise<{ before: string; after: string; benefit: string; }[]> => {
    const swaps: { before: string; after: string; benefit: string; }[] = [];
    
    itemNames.forEach(item => {
        const lowerItem = item.toLowerCase();
        for (const key in SWAP_DICTIONARY) {
            if (lowerItem.includes(key)) {
                swaps.push({
                    before: item,
                    after: SWAP_DICTIONARY[key].after,
                    benefit: SWAP_DICTIONARY[key].benefit
                });
                break; 
            }
        }
    });
    
    return swaps;
};

export interface FoodStrategyContent {
    story: string;
    parentalSecret: string;
    buyingTip: string;
    storageTip: string;
    peakState: string;
}

export const generateFoodStory = async (item: PantryItem): Promise<FoodStrategyContent> => {
    try {
        const { name, nutritionalInfo, novaClassification } = item;
        
        // --- SAFETY CHECKS START ---
        const safeNova = novaClassification || 'processed';
        const novaDef = NOVA_CLASSIFICATION[safeNova];
        const novaLabel = novaDef ? novaDef.label : 'Alimento Processado';
        
        const safeNutritionalInfo = nutritionalInfo || { benefits: [], risks: [] };
        const benefits = Array.isArray(safeNutritionalInfo.benefits) ? safeNutritionalInfo.benefits : [];
        const risks = Array.isArray(safeNutritionalInfo.risks) ? safeNutritionalInfo.risks : [];
        const infoData = benefits.length > 0 ? benefits.join(', ') : risks.join(', ');
        // --- SAFETY CHECKS END ---

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Você é um Professor de Ciências e Nutricionista Pediátrico Sincero (Estilo "Show da Luna" misturado com Dr. Drauzio Varella).
            Analise o alimento: "${name || 'Alimento Desconhecido'}".
            Classificação NOVA: ${novaLabel}
            Benefícios ou Riscos conhecidos: ${infoData}

            Gere um JSON ESTRUTURADO com estratégias para pais e curiosidades para crianças.
            TUDO EM PORTUGUÊS DO BRASIL.

            DIRETRIZ DE TOM DE VOZ (SEGURANÇA E CLAREZA):
            
            1. **PARA ULTRAPROCESSADOS (Vermelho/Perigo):** 
               - **story (Criança):** Fale a verdade brutal: "Isso é uma imitação de comida feita em fábrica. Tem corantes que enganam o cérebro e não deixam você ficar forte de verdade."
               - **parentalSecret (Pais):** SEJA DURO e EDUCATIVO. "Produto industrial com perfil nutricional pobre. Excesso de calorias vazias, aditivos químicos e palatabilidade artificial projetada para viciar o paladar infantil. Evite e prefira opções caseiras."

            2. **PARA IN NATURA (Verde/Excelente):** 
               - **story (Criança):** Fale de magia e biologia com entusiasmo: "A natureza demorou meses preparando isso com água, sol e terra para te dar superpoderes reais de velocidade e inteligência. É pura energia vital!"
               - **parentalSecret (Pais):** EXALTE. "Fonte bio disponível de vitaminas reais e fibras. Essencial para o desenvolvimento cognitivo, imunidade e formação de hábitos saudáveis a longo prazo."

            3. **PARA PROCESSADOS (Amarelo/Atenção):**
               - **story:** "Era natural, mas tomou um banho de sal ou açúcar para durar mais tempo na prateleira. Não é o vilão, mas não é o herói."
               - **parentalSecret:** "Opção conveniente, mas monitore o sódio/açúcar adicionado. Use com moderação junto com alimentos frescos."

            Campos Obrigatórios:
            1. story: A explicação para a criança (curta e impactante).
            2. parentalSecret: O argumento técnico para os pais.
            3. buyingTip: Dica de compra (ex: "Olhe o primeiro ingrediente").
            4. storageTip: Armazenamento.
            5. peakState: Como saber se está bom.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        story: { type: Type.STRING },
                        parentalSecret: { type: Type.STRING },
                        buyingTip: { type: Type.STRING },
                        storageTip: { type: Type.STRING },
                        peakState: { type: Type.STRING }
                    },
                    required: ["story", "parentalSecret", "buyingTip", "storageTip", "peakState"]
                },
            },
        });
        const json = cleanAndParseJSON(response.text);
        return json as FoodStrategyContent;
    } catch (error) {
        console.error("Error generating food story:", error);
        return {
            story: "Este alimento tem uma história interessante!",
            parentalSecret: "Verifique sempre a lista de ingredientes.",
            buyingTip: "Observe a data de validade.",
            storageTip: "Mantenha em local fresco.",
            peakState: "Consuma se estiver com boa aparência."
        };
    }
};


export const analyzeUserRecipe = async (
    title: string,
    ingredientsText: string,
    stepsText: string
): Promise<Recipe> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analise esta receita de usuário e estruture como JSON (Português BR).
            Título: "${title}"
            Ingredientes: "${ingredientsText}"
            Passos: "${stepsText}"

            Infira tempo, porções, nível, tags, alérgenos, ferramentas.
            Retorne objeto Recipe válido.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        total_time_min: { type: Type.NUMBER },
                        serves: { type: Type.STRING },
                        level: { type: Type.STRING, enum: ['Fácil', 'Médio', 'Difícil'] },
                        context_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    section: { type: Type.STRING },
                                    items: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: { type: Type.STRING },
                                                quantity: { type: Type.NUMBER },
                                                unit: { type: Type.STRING },
                                                displayString: { type: Type.STRING }
                                            },
                                            required: ["name", "quantity", "unit", "displayString"]
                                        }
                                    }
                                },
                                required: ["section", "items"]
                            }
                        },
                        tools: { type: Type.ARRAY, items: { type: Type.STRING } },
                        steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    order: { type: Type.NUMBER },
                                    title: { type: Type.STRING },
                                    time_min: { type: Type.NUMBER },
                                    instruction: { type: Type.STRING },
                                    child_friendly: { type: Type.STRING },
                                    safety: { type: Type.STRING },
                                    tip: { type: Type.STRING },
                                    utensil: { type: Type.STRING }
                                },
                                required: ["order", "title", "time_min", "instruction"]
                            }
                        },
                        presentation_suggestion: { type: Type.STRING },
                        storage: { type: Type.STRING }
                    },
                    required: ["title", "total_time_min", "serves", "level", "ingredients", "tools", "steps", "storage", "allergens", "context_tags"]
                }
            }
        });
        return cleanAndParseJSON(response.text) as Recipe;
    } catch (error) {
        console.error("Error analyzing user recipe:", error);
        throw new Error("Erro ao analisar receita.");
    }
};

export const generateRecipeFromTitle = async (title: string): Promise<Recipe> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Gere uma receita completa e familiar para: "${title}" em Português do Brasil.
            Seja criativo e detalhista.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        total_time_min: { type: Type.NUMBER },
                        serves: { type: Type.STRING },
                        level: { type: Type.STRING, enum: ['Fácil', 'Médio', 'Difícil'] },
                        context_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        allergens: { type: Type.ARRAY, items: { type: Type.STRING } },
                        ingredients: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    section: { type: Type.STRING },
                                    items: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                name: { type: Type.STRING },
                                                quantity: { type: Type.NUMBER },
                                                unit: { type: Type.STRING },
                                                displayString: { type: Type.STRING }
                                            },
                                            required: ["name", "quantity", "unit", "displayString"]
                                        }
                                    }
                                },
                                required: ["section", "items"]
                            }
                        },
                        tools: { type: Type.ARRAY, items: { type: Type.STRING } },
                        steps: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    order: { type: Type.NUMBER },
                                    title: { type: Type.STRING },
                                    time_min: { type: Type.NUMBER },
                                    instruction: { type: Type.STRING },
                                    child_friendly: { type: Type.STRING },
                                    safety: { type: Type.STRING },
                                    tip: { type: Type.STRING },
                                    utensil: { type: Type.STRING }
                                },
                                required: ["order", "title", "time_min", "instruction"]
                            }
                        },
                        presentation_suggestion: { type: Type.STRING },
                        storage: { type: Type.STRING }
                    },
                    required: ["title", "total_time_min", "serves", "level", "ingredients", "tools", "steps", "storage", "allergens", "context_tags"]
                }
            }
        });
        return cleanAndParseJSON(response.text) as Recipe;
    } catch (error) {
        console.error("Error generating recipe from title:", error);
        throw new Error("Erro ao gerar receita.");
    }
};
