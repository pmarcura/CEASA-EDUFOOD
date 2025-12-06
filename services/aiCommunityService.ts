
import { GoogleGenAI, Type } from "@google/genai";
import type { FeedPost, Recipe } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface AIPersona {
    id: string;
    name: string;
    avatar: string;
    rolePrompt: string;
    imageStylePrompt: string;
}

const PERSONAS: AIPersona[] = [
    {
        id: 'ai-bot-dad',
        name: 'Ricardo (Pai Prático)',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo&backgroundColor=c0aede',
        rolePrompt: `Você é o Ricardo, um pai brasileiro focado em praticidade e nutrição. 
        Crie um post sobre um jantar rápido (max 20min) e saudável que você acabou de fazer.
        Foque em "esconder legumes" ou facilidade.`,
        imageStylePrompt: "A professional food photography shot of a healthy homemade dinner for kids, warm lighting, realistic, 4k, high detail, cozy kitchen background."
    },
    {
        id: 'ai-bot-chef',
        name: 'Luna (Chef Criativa)',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ffdfbf',
        rolePrompt: `Você é a Luna, uma mãe que ama transformar comida em arte. 
        Crie um post sobre um prato colorido e divertido (tipo bento box ou prato decorado com carinhas) que você fez.
        Foque na beleza, cores e diversão.`,
        imageStylePrompt: "A bright, colorful, artistic food photography shot of a fun kids lunch meal, bento style, cute shapes, natural lighting, realistic, 8k resolution."
    }
];

const STORAGE_KEY = 'last_ai_post_timestamp';

export const checkAndGenerateAIPosts = async (currentFeed: FeedPost[]): Promise<FeedPost[]> => {
    const lastPostStr = localStorage.getItem(STORAGE_KEY);
    const lastPostTime = lastPostStr ? parseInt(lastPostStr) : 0;
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // Check if 24h have passed (or if it's the first run)
    if (now - lastPostTime < twentyFourHours && lastPostStr) {
        return [];
    }

    // Update timestamp immediately to prevent double firing and quota burning
    localStorage.setItem(STORAGE_KEY, now.toString());

    const newPosts: FeedPost[] = [];

    // Generate post for each persona
    for (const persona of PERSONAS) {
        try {
            // 1. Generate Caption, Dish Idea AND Full Recipe in one go
            const textResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `${persona.rolePrompt}
                
                Gere um JSON contendo:
                1. "caption": A legenda do Instagram (curta, com emojis).
                2. "imagePrompt": Descrição visual em inglês para gerar a foto EXATA deste prato.
                3. "recipe": A receita COMPLETA e funcional deste prato exato.
                
                IMPORTANTE: A receita deve corresponder exatamente ao que será descrito na imagem.`,
                config: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            caption: { type: Type.STRING },
                            imagePrompt: { type: Type.STRING },
                            recipe: {
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
                                required: ["title", "total_time_min", "serves", "level", "ingredients", "tools", "steps", "storage", "allergens", "context_tags", "presentation_suggestion"]
                            }
                        },
                        required: ["caption", "imagePrompt", "recipe"]
                    }
                }
            });

            const content = JSON.parse(textResponse.text || '{}');
            const caption = content.caption || "Olha o que eu fiz hoje!";
            const specificImagePrompt = content.imagePrompt || "Delicious food";
            const recipeData = content.recipe;

            // 2. Generate Realistic Image using Gemini Flash Image
            // We use the specific prompt generated by the AI to match the recipe details
            const finalImagePrompt = `${specificImagePrompt}. ${persona.imageStylePrompt} Make it look exactly like the recipe described.`;
            
            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: finalImagePrompt }]
                }
            });

            let base64Image = null;
            if (imageResponse.candidates?.[0]?.content?.parts) {
                for (const part of imageResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        base64Image = part.inlineData.data;
                        break;
                    }
                }
            }
            
            if (base64Image) {
                const newPost: FeedPost = {
                    id: `ai-${persona.id}-${now}`,
                    authorName: persona.name,
                    authorAvatar: persona.avatar,
                    image: `data:image/jpeg;base64,${base64Image}`,
                    caption: caption,
                    likes: Math.floor(Math.random() * 20) + 5, // Random initial likes
                    likedBy: [],
                    timestamp: now,
                    recipe: recipeData, // Attach the full recipe here
                    comments: []
                };
                newPosts.push(newPost);
            }

        } catch (error) {
            console.error(`Erro ao gerar post para ${persona.name}:`, error);
        }
    }

    return newPosts;
};
