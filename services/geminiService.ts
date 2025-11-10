import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe, NovaClassificationKey, RiskLevel, NutritionalInfo, ChatMessage, PantryItem } from '../types';
import { CODEX_CATEGORIES, NOVA_CLASSIFICATION } from "../constants/foodClassifications";

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

function getMealTime(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Café da Manhã";
    if (hour >= 12 && hour < 18) return "Almoço ou Lanche da Tarde";
    return "Jantar";
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
  nutritionalInfo: NutritionalInfo;
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
            contents: `You are a shopping list parser. Your ONLY job is to identify and extract items from a list. Analyze the user's text: "${text}".
- Extract each item, its name, quantity, and unit (e.g., for "2 pacotes de arroz", name is "arroz", quantity is 2, unit is "pacote").
- If quantity or unit is not specified, default to quantity: 1 and unit: 'un'.
- Also determine if each item is a food item ('isFood': true/false).
- CRUCIALLY: If the user's text is NOT a shopping list, but is a question, a command, a request for a recipe, or a conversation starter (e.g., "o que eu faço para o almoço?", "queria uma receita com frango", "arroz é saudável?"), you MUST return an empty array [].
- Respond ONLY with a valid JSON array matching the provided schema.`,
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
        
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;

    } catch (error) {
        console.error("Error parsing shopping list:", error);
        throw new Error(`Error parsing shopping list:\n${getErrorMessage(error)}`);
    }
};


export const enrichFoodItemsBatch = async (itemNames: string[]): Promise<EnrichedData[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `You are a food item data enrichment specialist for a family nutrition app called "EduFood".
For each food item in this list: [${itemNames.join(', ')}], provide a JSON object with the following details.
- novaClassification: Classify using one of these keys: 'in_natura', 'culinary_ingredients', 'processed', 'ultra_processed'.
- codexCategory: Choose the best fit from: ${CODEX_CATEGORIES.join(', ')}.
- ageWarningTag: If the item is not recommended for a certain age (e.g., honey for under 1s), provide a short tag (e.g., "Após 1 ano"). Otherwise, return an empty string.
- riskLevel: 'Baixo', 'Médio', or 'Alto' based on nutritional value for a family context.
- icon: A relevant and simple icon name from the lucide-react library (e.g., "Carrot", "Milk", "Cookie"). Use single, clear names.
- color: A hex code for a color representing the food (e.g., apple -> "#FF4136").
- nutritionalInfo: An object with origin (string), benefits (array of strings), risks (array of strings), and nutritionFacts (a brief string summary).
- tags: An array of 3-5 relevant keywords for searching (e.g., "fruta", "lanche", "vitamina C").
- name: The original item name, corrected for spelling if necessary.
Respond ONLY with a valid JSON array of these objects.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            novaClassification: { type: Type.STRING, enum: ['in_natura', 'culinary_ingredients', 'processed', 'ultra_processed'] },
                            codexCategory: { type: Type.STRING, enum: CODEX_CATEGORIES },
                            ageWarningTag: { type: Type.STRING },
                            riskLevel: { type: Type.STRING, enum: ['Baixo', 'Médio', 'Alto'] },
                            icon: { type: Type.STRING },
                            color: { type: Type.STRING },
                            nutritionalInfo: {
                                type: Type.OBJECT,
                                properties: {
                                    origin: { type: Type.STRING },
                                    benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    nutritionFacts: { type: Type.STRING },
                                },
                                required: ["origin", "benefits", "risks", "nutritionFacts"]
                            },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["name", "novaClassification", "codexCategory", "ageWarningTag", "riskLevel", "icon", "color", "nutritionalInfo", "tags"]
                    },
                },
            },
        });
        
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;

    } catch (error) {
        console.error("Error enriching food items:", error);
        throw new Error(`Error enriching food items:\n${getErrorMessage(error)}`);
    }
};

export const generateConversationalRecipes = async (
    userInput: string,
    pantryItems: string[],
    chatHistory: { role: 'user' | 'model'; text?: string }[]
): Promise<{ text: string; recipes: Recipe[] }> => {
    const mealTime = getMealTime();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `You are Professor Nutri, an AI family nutrition assistant. A user is asking for help.
- User's message: "${userInput}"
- Current time suggests it is for: ${mealTime}
- Pantry has: ${pantryItems.join(', ')}. Prioritize using these.
- Recent conversation: ${JSON.stringify(chatHistory.slice(-4))}

Your tasks:
1. Write a friendly, encouraging, and brief conversational response.
2. Generate 1 to 3 simple, healthy, and creative recipes that match the user's request and pantry. The recipes should be appealing to both kids and adults.
3. For each recipe, provide a complete, structured JSON object.

Respond ONLY with a valid JSON object matching the provided schema.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING, description: "Your conversational response to the user." },
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
                                required: ["title", "total_time_min", "serves", "level", "ingredients", "tools", "steps", "storage"]
                            }
                        }
                    },
                    required: ["text", "recipes"]
                },
            },
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (error) {
        console.error("Error generating conversational recipes:", error);
        throw new Error(`Error generating recipes:\n${getErrorMessage(error)}`);
    }
};

export const analyzeRecipeForFoodGroups = async (ingredients: string[]): Promise<{ proteins: number; grains: number; vegetables: number; }> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `Analyze the ingredient list for a single serving of a recipe: [${ingredients.join(', ')}].
Estimate the number of standard portions for each food group.
- 'proteins': e.g., meat, fish, eggs, legumes.
- 'grains': e.g., rice, pasta, bread, potatoes.
- 'vegetables': e.g., vegetables, fruits.
Return a simple JSON object with the count for each. A standard portion is about the size of a fist or a deck of cards.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        proteins: { type: Type.NUMBER },
                        grains: { type: Type.NUMBER },
                        vegetables: { type: Type.NUMBER }
                    },
                    required: ["proteins", "grains", "vegetables"]
                },
            },
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (error) {
        console.error("Error analyzing recipe for food groups:", error);
        return { proteins: 0, grains: 0, vegetables: 0 };
    }
};

export const generateSwaps = async (itemNames: string[]): Promise<{ before: string; after: string; benefit: string; }[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `For the following ultra-processed items [${itemNames.join(', ')}], suggest healthier, simple swaps. For each, provide the original item ('before'), the suggested swap ('after'), and a brief, impactful benefit ('benefit'). Respond ONLY with a valid JSON array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            before: { type: Type.STRING },
                            after: { type: Type.STRING },
                            benefit: { type: Type.STRING }
                        },
                        required: ["before", "after", "benefit"]
                    },
                },
            },
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (error) {
        console.error("Error generating swaps:", error);
        throw new Error(`Error generating swaps:\n${getErrorMessage(error)}`);
    }
};

export const generateFoodStory = async (item: PantryItem): Promise<string> => {
    try {
        const { name, nutritionalInfo, novaClassification } = item;
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `You are Professor Nutri, an AI that explains nutrition to children in an engaging way, like a school teacher for early elementary grades (ages 6-9).
A parent wants to explain the food "${name}" to their child.
Use these facts to create a short, educational explanation (2-3 paragraphs max).
- Origin: ${nutritionalInfo.origin}
- Benefits: ${nutritionalInfo.benefits.join(', ')}
- Risks/Attention Points: ${nutritionalInfo.risks.join(', ')}
- NOVA Classification: ${NOVA_CLASSIFICATION[novaClassification].label}

Your goal is to be factual but use simple analogies. Avoid fantasy or magical elements like "superpowers".
- For a healthy food like a carrot, you can explain that it contains "beta-carotene," which our body turns into Vitamin A. Describe Vitamin A as a "super helper" for our eyes, keeping our vision sharp for playing and reading.
- For an unhealthy food like a cookie, explain that it's a "sometimes food" because it has lots of sugar and fat that give us a super-fast, but short, burst of energy. Mention that it doesn't have many "building blocks" (like vitamins and proteins) that our bodies need to grow strong and have energy for the whole day.
- Keep the language positive and clear.
Respond ONLY with a valid JSON object with a single key "story".`,
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
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.story;
    } catch (error) {
        console.error("Error generating food story:", error);
        throw new Error(`Error generating food story:\n${getErrorMessage(error)}`);
    }
};


export const analyzeUserRecipe = async (
    title: string,
    ingredientsText: string,
    stepsText: string
): Promise<Recipe> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: `Analyze the user's recipe and structure it as a JSON object.
            User Input:
            - Title: "${title}"
            - Ingredients: "${ingredientsText}"
            - Steps: "${stepsText}"

            Your task is to generate a complete recipe object. Infer values where necessary (e.g., time, servings, level). Be creative with suggestions.
            - Parse ingredients into sections (e.g., "Massa", "Recheio") if applicable, otherwise use a single section named "Ingredientes". Each ingredient should have name, quantity, unit, and the original displayString.
            - Parse steps into an ordered list. For each step, provide a short title, the full instruction, and an estimated time in minutes. Add child-friendly tips, safety warnings, or general tips where appropriate.
            - Infer total time, servings, difficulty level ('Fácil', 'Médio', 'Difícil'), context tags (e.g., "Lanche Rápido", "Saudável"), common allergens, necessary tools, a presentation suggestion, and storage instructions.
            Respond ONLY with a valid JSON object matching the provided schema.`,
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
                    required: ["title", "total_time_min", "serves", "level", "ingredients", "tools", "steps", "storage"]
                }
            }
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse as Recipe;
    } catch (error) {
        console.error("Error analyzing user recipe:", error);
        throw new Error(`Error analyzing user recipe:\n${getErrorMessage(error)}`);
    }
};