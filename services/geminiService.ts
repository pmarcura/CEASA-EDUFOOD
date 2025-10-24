
import { GoogleGenAI, Type } from "@google/genai";
import type { PantryItem, Classification, RiskLevel, Recipe } from '../types';

// Assume API_KEY is set in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper function to extract a useful error message from various error types.
function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        // Look for rate limit error in the message
        if (error.message.includes('429') || error.message.toLowerCase().includes('quota')) {
            return "Recebemos muitas solicitações no momento. Por favor, aguarde um pouco e tente novamente.";
        }
        return error.message;
    }
    // Try to stringify for other object types, also checking for rate limit error
    try {
        const stringified = JSON.stringify(error);
        if (stringified.includes('429') || stringified.toLowerCase().includes('quota')) {
            return "Recebemos muitas solicitações no momento. Por favor, aguarde um pouco e tente novamente.";
        }
        if (stringified && stringified !== '{}' && stringified !== 'null') {
            return stringified;
        }
    } catch (e) {
        // Fallback for circular structures or other errors
    }
    return String(error);
}


interface ParsedItem {
  name: string;
  quantity: number;
  unit: string;
  isFood: boolean;
}

export interface EnrichedData {
  classification: Classification;
  riskLevel: RiskLevel;
  icon: string;
  color: string;
  healthTip: string;
  tags: string[];
  name: string;
}

export const processShoppingList = async (text: string): Promise<ParsedItem[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are a shopping list parser. Analyze the user's text: "${text}". Extract each item. For each item, provide its name, quantity, unit, and determine if it's a food item or not (e.g., 'detergent' is not food). Respond ONLY with a valid JSON array matching the provided schema. If the text is empty or contains no items, return an empty array.`,
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
            model: "gemini-2.5-flash",
            contents: `You are a food nutrition expert. For each food name in this list: [${itemNames.join(', ')}], provide a nutritional analysis. Your response must be a valid JSON array. For each item, provide: 'name' (exactly as provided), 'classification' ('in natura', 'processado', or 'ultraprocessado'), 'riskLevel' ('Baixo', 'Médio', or 'Alto'), 'icon' (a single, relevant lucide-react icon name like 'Apple' or 'Milk'), 'color' (a simple hex code like '#4ade80'), 'healthTip' (a short, encouraging tip under 15 words), and 'tags' (an array of 2-3 relevant keywords like 'Laticínio', 'Cálcio').`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            classification: { type: Type.STRING },
                            riskLevel: { type: Type.STRING },
                            icon: { type: Type.STRING },
                            color: { type: Type.STRING },
                            healthTip: { type: Type.STRING },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ["name", "classification", "riskLevel", "icon", "color", "healthTip", "tags"]
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
            model: "gemini-2.5-flash",
            contents: `You are a creative chef specializing in simple, healthy family meals. Based on these ingredients: ${ingredients.join(', ')}, create 2 simple and healthy recipes. Your response must be a valid JSON array, where each object has 'title', 'ingredients' (an array of strings), and 'instructions' (a string with steps).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                            instructions: { type: Type.STRING },
                        },
                        required: ["title", "ingredients", "instructions"]
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
