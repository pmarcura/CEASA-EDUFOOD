
import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe, NovaClassificationKey, RiskLevel } from '../types';
import { CODEX_CATEGORIES } from "../constants/foodClassifications";

// Assume API_KEY is set in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper function to extract a useful error message from various error types.
function getErrorMessage(error: unknown): string {
    let message = 'Ocorreu um erro desconhecido.';
    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
        message = (error as any).message;
    } else if (typeof error === 'string') {
        message = error;
    }

    // Check for specific error codes for more user-friendly messages
    const errorCode = typeof error === 'object' && error !== null && 'code' in error ? String((error as any).code) : '';

    if (errorCode === 'not-found') {
        return "Não foi possível conectar ao banco de dados. Verifique sua configuração do Firebase e a conexão com a internet.";
    }
    if (message.includes('429') || message.toLowerCase().includes('quota')) {
        return "Recebemos muitas solicitações no momento. Por favor, aguarde um pouco e tente novamente.";
    }

    return message;
}


interface ParsedItem {
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
  healthTip: string;
  tags: string[];
  name:string;
}

export const processReceiptImage = async (base64Image: string, mimeType: string): Promise<Omit<ParsedItem, 'isFood'>[]> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType,
                data: base64Image,
            },
        };

        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: { 
                parts: [
                    { text: `You are a shopping receipt parser. Analyze this image. Extract each item, its quantity, and unit. If a unit is not specified, default to 'un'. Exclude non-food items, taxes, totals, or any other text that is not a product. Respond ONLY with a valid JSON array matching the provided schema. If the image is not a receipt or contains no items, return an empty array.` },
                    imagePart
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
                        },
                        required: ["name", "quantity", "unit"]
                    },
                },
            },
        });

        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (error) {
        console.error("Error processing receipt image:", error);
        throw new Error(`Error processing receipt image:\n${getErrorMessage(error)}`);
    }
};


export const processShoppingList = async (text: string): Promise<ParsedItem[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `You are a shopping list parser. Analyze the user's text: "${text}". Extract each item. For each item, provide its name, quantity, and unit (e.g., for "2 pacotes de arroz", quantity is 2 and unit is "pacote"). If quantity or unit is not specified for an item, default to quantity: 1 and unit: 'un'. Also determine if it's a food item. Respond ONLY with a valid JSON array matching the provided schema. If the text is empty or contains no items, return an empty array.`,
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
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;

    } catch (error) {
        console.error("Error processing shopping list:", error);
        throw new Error(`Error processing shopping list:\n${getErrorMessage(error)}`);
    }
};

export const enrichFoodItemsBatch = async (itemNames: string[]): Promise<EnrichedData[]> => {
    if (itemNames.length === 0) return [];
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `You are a food nutrition expert aligned with Brazilian food guides. For each food name in this list: [${itemNames.join(', ')}], provide a detailed analysis. Your response must be a valid JSON array. For each item, provide:
1.  'name': (string) exactly as provided in the input list.
2.  'novaClassification': (string) Classify according to the 4 NOVA groups. Must be one of: 'in_natura', 'culinary_ingredients', 'processed', 'ultra_processed'.
3.  'codexCategory': (string) Choose the most relevant category from this list: [${CODEX_CATEGORIES.join(', ')}].
4.  'ageWarningTag': (string) A short warning tag if the food is not recommended for certain age groups. Use "0-2 anos", "2-5 anos", or "0-5 anos". If safe for everyone, return an empty string "".
5.  'riskLevel': (string) 'Baixo', 'Médio', or 'Alto' based on nutritional value.
6.  'icon': (string) a single, relevant lucide-react icon name like 'Apple' or 'Milk'.
7.  'color': (string) a simple hex code like '#4ade80'.
8.  'healthTip': (string) A practical, context-aware health tip under 20 words. If the food is 'processed' or 'ultra_processed', the tip must be a warning about the risks of excessive consumption (e.g., "High in sodium, consume in moderation."). If it is 'in_natura' or a 'culinary_ingredient', explain its health benefit (e.g., "Rich in fiber, great for digestion.").
9.  'tags': (array of strings) 2-3 relevant keywords, including the Codex category.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            novaClassification: { type: Type.STRING },
                            codexCategory: { type: Type.STRING },
                            ageWarningTag: { type: Type.STRING },
                            riskLevel: { type: Type.STRING },
                            icon: { type: Type.STRING },
                            color: { type: Type.STRING },
                            healthTip: { type: Type.STRING },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ["name", "novaClassification", "codexCategory", "ageWarningTag", "riskLevel", "icon", "color", "healthTip", "tags"]
                    }
                },
            },
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (error) {
        console.error("Error enriching items batch:", error);
        throw new Error(`Error enriching items batch:\n${getErrorMessage(error)}`);
    }
};

export const generateRecipes = async (ingredients: string[]): Promise<Recipe[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `You are a creative chef and child nutrition expert specializing in simple, healthy, family-friendly meals. Your persona is "Professor Nutri," who is caring and practical. Based on these ingredients: ${ingredients.join(', ')}, create 2 simple and healthy recipes following a strict JSON structure.
            
            For each recipe:
            - **ingredients**: This is CRITICAL. For each ingredient, provide a 'displayString' (e.g., "1 cenoura média ralada") and also parse it into a structured object with 'name' (the core food item, e.g., 'cenoura'), 'quantity' (numeric, e.g., 1), and 'unit' (e.g., 'un', 'g', 'ml', 'xícara').
            - **title**: A fun, appealing name.
            - **total_time_min**: Total preparation and cooking time in minutes.
            - **serves**: A family-friendly serving size string (e.g., "2 adultos + 1 criança").
            - **level**: 'Fácil', 'Médio', or 'Difícil'.
            - **context_tags**: An array of 2-3 context tags (e.g., "Lanche escolar", "Jantar rápido", "Aproveita sobra").
            - **allergens**: An array of potential allergens present (e.g., "ovo", "leite"). Empty if none.
            - **tools**: An array of necessary kitchen tools.
            - **steps**: An array of step objects, each containing:
                - **order**: (number) The step number.
                - **title**: A short title for the step.
                - **time_min**: Estimated time in minutes for this step.
                - **instruction**: A short, imperative instruction.
                - **child_friendly**: (optional) A tip on how a child can safely participate.
                - **safety**: (optional) A safety warning for parents.
                - **tip**: (optional) A practical tip for parents (e.g., "Pode ser feito de véspera").
                - **utensil**: (optional) The main utensil for this step.
            - **presentation_suggestion**: (optional) A fun way to present the dish to a child.
            - **storage**: A short string on how to store leftovers.
            
            Your response must be a valid JSON array of these recipe objects.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            total_time_min: { type: Type.NUMBER },
                            serves: { type: Type.STRING },
                            level: { type: Type.STRING },
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
                                        },
                                    },
                                    required: ["section", "items"],
                                },
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
                                        child_friendly: { type: Type.STRING, nullable: true },
                                        safety: { type: Type.STRING, nullable: true },
                                        tip: { type: Type.STRING, nullable: true },
                                        utensil: { type: Type.STRING, nullable: true },
                                    },
                                    required: ["order", "title", "time_min", "instruction"],
                                },
                            },
                            presentation_suggestion: { type: Type.STRING, nullable: true },
                            storage: { type: Type.STRING },
                        },
                        required: ["title", "total_time_min", "serves", "level", "context_tags", "allergens", "ingredients", "tools", "steps", "storage"],
                    }
                }
            }
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (error) {
        console.error("Error generating recipes:", error);
        throw new Error(`Error generating recipes:\n${getErrorMessage(error)}`);
    }
};

export const generateCreativeSuggestion = async (ingredients: string[]): Promise<{ title: string, description: string }> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `You are a fun and creative family chef. Based on these healthy ingredients: ${ingredients.join(', ')}, invent one very creative, fun, and simple dish for kids. Give it a playful name. Your response must be a valid JSON object with 'title' (the playful name) and 'description' (a short, exciting sentence about the dish). Example: {"title": "Foguetes de Cenoura", "description": "Cenouras-foguete com pasta de amendoim e gergelim para uma aventura espacial no lanche!"}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ["title", "description"]
                }
            }
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (error) {
        console.error("Error generating creative suggestion:", error);
        throw new Error(`Error generating creative suggestion:\n${getErrorMessage(error)}`);
    }
};

export const analyzeRecipeForFoodGroups = async (ingredients: string[]): Promise<{ proteins: number, grains: number, vegetables: number }> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `You are a nutritionist. Analyze this list of ingredients for a recipe: [${ingredients.join(', ')}]. Based on Brazilian dietary guidelines, count how many distinct portions of the main food groups are present. The groups are 'proteins' (meats, eggs, legumes like beans), 'grains' (rice, pasta, bread, tubers like potatoes), and 'vegetables' (vegetables, fruits, greens). One portion is roughly 80-100g. Return a JSON object with the count for each group. Example response: {"proteins": 1, "grains": 1, "vegetables": 2}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        proteins: { type: Type.NUMBER },
                        grains: { type: Type.NUMBER },
                        vegetables: { type: Type.NUMBER },
                    },
                    required: ["proteins", "grains", "vegetables"],
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error analyzing food groups:", error);
        // Return a default value on error to avoid breaking the meal log
        return { proteins: 0, grains: 0, vegetables: 0 };
    }
};

export const generateSwaps = async (itemNames: string[]): Promise<{ before: string, after: string, benefit: string }[]> => {
    if (itemNames.length === 0) return [];
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `You are a family nutritionist. A user has these ultra-processed items in their pantry: [${itemNames.join(', ')}]. Suggest up to 2 practical and healthier swaps for these items. For each swap, provide the original item name, a healthier alternative, and the main benefit. Respond ONLY with a valid JSON array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            before: { type: Type.STRING, description: "The original ultra-processed item name." },
                            after: { type: Type.STRING, description: "The suggested healthier alternative." },
                            benefit: { type: Type.STRING, description: "A short, clear benefit of the swap (e.g., '- Açúcar, + Fibras')." },
                        },
                        required: ["before", "after", "benefit"],
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error generating swaps:", error);
        throw new Error(`Error generating swaps:\n${getErrorMessage(error)}`);
    }
};
