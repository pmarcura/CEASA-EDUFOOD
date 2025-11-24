
import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe, NovaClassificationKey, RiskLevel, NutritionalInfo, ChatMessage, PantryItem, UserProfile, MealLogEntry, MealPlanRequest, PlannedMeal, FeedPost } from '../types';
import { CODEX_CATEGORIES, NOVA_CLASSIFICATION } from "../constants/foodClassifications";

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
    if (hour >= 5 && hour < 12) return "Café da Manhã";
    if (hour >= 12 && hour < 18) return "Almoço ou Lanche da Tarde";
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
    proteins: ['carne', 'frango', 'peixe', 'ovo', 'feijão', 'lentilha', 'grão de bico', 'soja', 'porco', 'boi', 'atum', 'sardinha', 'iogurte', 'queijo', 'leite', 'camarão', 'peru', 'presunto', 'bacon', 'linguiça', 'salsicha'],
    grains: ['arroz', 'batata', 'macarrão', 'pão', 'farinha', 'aveia', 'milho', 'mandioca', 'aipim', 'cará', 'inhame', 'trigo', 'massa', 'cuscuz', 'tapioca', 'bolacha', 'biscoito', 'cereal', 'granola'],
    vegetables: ['tomate', 'alface', 'cenoura', 'abóbora', 'abobrinha', 'berinjela', 'brócolis', 'couve', 'espinafre', 'rúcula', 'pepino', 'pimentão', 'cebola', 'alho', 'fruta', 'maçã', 'banana', 'laranja', 'limão', 'uva', 'morango', 'manga', 'abacaxi', 'mamão', 'melão', 'melancia', 'pera', 'pêssego', 'quiabo', 'vagem', 'beterraba', 'repolho', 'couve-flor']
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
            contents: `Você é um Nutricionista e Engenheiro de Alimentos Sênior (Especialista em NOVA e Tabela TACO/USDA).
            ENTRADA: ${JSON.stringify(itemNames)}

            SUA MISSÃO É PREENCHER OS DADOS NUTRICIONAIS E DE CLASSIFICAÇÃO. 
            NÃO GASTE TOKENS COM EMOJIS OU FORMATAÇÃO DE TEXTO.

            **1. IDENTIFICAÇÃO:**
            - Traduza abreviações: "BL FERM" -> "Bebida Láctea", "BISC" -> "Biscoito", "SOB" -> "Sobremesa".
            - O campo 'icon' deve vir VAZIO string (""). O app cuidará disso.
            - O campo 'name' deve ser o nome correto do produto, sem formatação de maiúsculas/minúsculas (o app cuidará disso).

            **2. CLASSIFICAÇÃO NOVA (Regras Absolutas)**
            - **in_natura**: Frutas, Verduras, Legumes, Ovos, Carnes Cruas, Leite Pasteurizado, Arroz, Feijão. (Mesmo embalados).
            - **processed**: Conservas, Queijos Artesanais, Pães fermentação natural, Frutas em calda.
            - **ultra_processed**: Salsicha, Nuggets, Refrigerante, Biscoito Recheado, Iogurte Saborizado (com corante/aroma), Miojo, Bebida Láctea.

            **3. DADOS TÉCNICOS OBRIGATÓRIOS (ORIGEM E NUTRIÇÃO)**
            Se o Google Search não retornar a marca exata, **USE SEU CONHECIMENTO DE ENGENHARIA** para descrever o alimento genérico.
            
            - **origin**:
              - In Natura: Descreva o cultivo ou origem animal. Ex: "Cultivado em hortas..." ou "Corte bovino..."
              - Ultraprocessado: Descreva o processo industrial padrão. Ex: "Produzido industrialmente através da mistura de soro de leite, açúcar e aditivos."
              - **NUNCA** deixe vazio ou "Desconhecida".

            - **nutritionFacts**:
              - Se não achar a tabela exata, **ESTIME** os valores para 100g de um produto padrão dessa categoria.
              - **Formato:** "Cal: X kcal | Carb: Xg | Prot: Xg | Gord: Xg".
              - **NUNCA** deixe vazio ou "Indisponível".

            **SAÍDA JSON:**
            Retorne EXATAMENTE um array JSON válido.
            NÃO use blocos de código markdown (\`\`\`json). Apenas o texto cru do JSON.`,
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

// ... rest of the file remains unchanged ...
const buildFamilyContext = (userProfile: UserProfile | null): string => {
    if (!userProfile || !userProfile.children || userProfile.children.length === 0) {
        return "Contexto Familiar: O usuário não forneceu detalhes sobre as crianças.";
    }

    const childrenContext = userProfile.children.map((child, index) => {
        let context = `  - Criança ${index + 1}: ${child.name} (${child.age} anos).\n`;
        context += `    - Seletividade: ${child.foodSelectivity.level}. Contexto: ${child.foodSelectivity.context || 'Não especificado.'}\n`;
        if (child.dislikedFoods) {
            context += `    - Não gosta: ${child.dislikedFoods}\n`;
        }
        if (child.religiousDiets?.length) {
            const diets = child.religiousDiets.map(d => d === 'other' ? child.otherReligiousDiet : d).filter(Boolean).join(', ');
            context += `    - Dietas: ${diets}\n`;
        }
        if (child.medicalConditions) {
             context += `    - Condições Médicas: ${child.medicalConditions}\n`;
        }
        return context;
    }).join('');

    return `Contexto Familiar (IMPORTANTE - Siga as restrições):\n${childrenContext}`;
};

const buildMealContext = (mealLog: MealLogEntry[]): string => {
    if (!mealLog || mealLog.length === 0) {
        return "Histórico de Refeições: Nenhuma refeição recente.";
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const threeDaysHence = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 - 1);

    const relevantMeals = mealLog
        .filter(log => log.timestamp >= threeDaysAgo.getTime() && log.timestamp <= threeDaysHence.getTime())
        .sort((a, b) => a.timestamp - b.timestamp);

    if (relevantMeals.length === 0) {
        return "Histórico de Refeições: Nenhuma refeição registrada nos últimos 3 dias.";
    }

    const groupedByDay = relevantMeals.reduce((acc, meal) => {
        const dateKey = new Date(meal.timestamp).toDateString();
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(meal.recipeTitle);
        return acc;
    }, {} as Record<string, string[]>);

    let contextString = "Histórico de Refeições Recentes (Evite repetir):\n";
    for (const dateKey in groupedByDay) {
        const date = new Date(dateKey);
        const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        let dayLabel;
        if (diffDays === 0) dayLabel = 'Hoje';
        else if (diffDays === -1) dayLabel = 'Ontem';
        else if (diffDays === 1) dayLabel = 'Amanhã';
        else dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'long' });

        contextString += `  - ${dayLabel}: ${[...new Set(groupedByDay[dateKey])].join(', ')}\n`;
    }

    return contextString;
};

export const generateConversationalRecipes = async (
    userInput: string,
    pantryItems: string[],
    chatHistory: { role: 'user' | 'model'; text?: string }[],
    userProfile: UserProfile | null,
    mealLog: MealLogEntry[],
    feedPosts: FeedPost[] = [], 
    intentContext?: string 
): Promise<{ text: string; recipes: Recipe[] }> => {
    const mealTime = getMealTime();
    const familyContext = buildFamilyContext(userProfile);
    const mealContext = buildMealContext(mealLog);
    
    let feedContext = "";
    if (intentContext === 'community_focus' && feedPosts.length > 0) {
        feedContext = "Destaques da Comunidade (Use para inspirar a resposta):\n" + 
            feedPosts.slice(0, 5).map(p => `- ${p.recipe?.title || 'Prato'} por ${p.authorName}: ${p.caption}`).join('\n');
    }

    let systemInstruction = `Você é o Professor Nutri, um assistente de nutrição familiar focado em ajudar PAIS e MÃES.`;
    
    if (intentContext === 'pantry_focus') {
        systemInstruction += ` PRIORIDADE MÁXIMA: Use APENAS ou PRINCIPALMENTE itens que estão na despensa do usuário. Evite sugerir compras.`;
    } else if (intentContext === 'community_focus') {
        systemInstruction += ` PRIORIDADE: Sugira receitas baseadas no que é popular na comunidade (feed). Cite o nome do autor se usar uma referência do feed.`;
    } else if (intentContext === 'surprise_focus') {
        systemInstruction += ` PRIORIDADE: Seja criativo! Sugira algo diferente, exótico ou divertido, mas que ainda seja adequado para crianças.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${systemInstruction}
- Mensagem do usuário: "${userInput}"
- Horário sugerido: ${mealTime}
- Despensa contém: ${pantryItems.join(', ')}.
- Histórico recente: ${JSON.stringify(chatHistory.slice(-4))}
- ${familyContext}
- ${mealContext}
${feedContext}

Suas tarefas:
1. Escreva uma resposta conversacional curta, amigável e encorajadora para o adulto responsável, em Português do Brasil.
2. Gere de 1 a 3 receitas simples, saudáveis e criativas.
3. CRÍTICO: O array 'allergens' e 'context_tags' DEVE estar presente em cada receita, mesmo que vazio.
4. Evite repetir pratos recentes.
5. Se houver crianças com restrições/seletividade no contexto, mencione como a receita ajuda nisso.

Responda APENAS com um objeto JSON válido.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING, description: "Sua resposta conversacional." },
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
                    required: ["text", "recipes"]
                },
            },
        });
        return cleanAndParseJSON(response.text);
    } catch (error) {
        console.error("Error generating conversational recipes:", error);
        throw new Error(`Erro ao gerar receitas:\n${getErrorMessage(error)}`);
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

    const prompt = `Você é o Professor Nutri, um assistente para pais planejarem a semana.
Gere um plano de refeições estruturado com base nas escolhas do usuário. TUDO em Português do Brasil.

- Configuração:
  - Refeições: ${request.meals.join(', ')}.
  - Quantidade: ${nightsToCook} dias.
  - Dias corridos (receitas rápidas): ${busyDays.join(', ') || 'Nenhum'}.
  - Prioridade: "${priorityMapping[request.priority || 'use_pantry']}".
  - Ingredientes Extras: ${request.specificIngredients?.join(', ') || 'Nenhum'}.
  - Evitar: ${request.avoidItems?.join(', ') || 'Nenhum'}.
- Despensa: [${pantryContext}].
- ${familyContext}
- ${mealContext}

Tarefas:
1. Crie ${nightsToCook} refeições para os dias solicitados.
2. Receitas completas e detalhadas.
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
                            mealType: { type: Type.STRING, enum: ['breakfast', 'lunch', 'dinner'] },
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

export const generateFoodStory = async (item: PantryItem): Promise<string> => {
    try {
        const { name, nutritionalInfo, novaClassification } = item;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Você é o Professor Nutri, assistindo um pai/mãe. O usuário é um ADULTO.
Objetivo: Crie um mini-roteiro lúdico que o pai pode usar para explicar o alimento "${name}" para uma criança de 6-9 anos.
Fatos:
- Benefícios: ${nutritionalInfo.benefits.join(', ')}
- Classificação: ${NOVA_CLASSIFICATION[novaClassification].label}

Instruções:
- Escreva como se fosse uma "dica para o pai falar".
- Use analogias simples (ex: "Fala pro seu filho que a cenoura ajuda a ver no escuro").
- O tom deve ser de ferramenta de apoio parental.
- TUDO EM PORTUGUÊS DO BRASIL.

Retorne JSON: {"story": "..."}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        story: { type: Type.STRING }
                    },
                    required: ["story"]
                },
            },
        });
        const json = cleanAndParseJSON(response.text);
        return json.story;
    } catch (error) {
        console.error("Error generating food story:", error);
        throw new Error("Não foi possível gerar a história agora.");
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
