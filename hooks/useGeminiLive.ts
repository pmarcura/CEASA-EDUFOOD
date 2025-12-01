
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Type, FunctionDeclaration } from '@google/genai';
import { b64ToUint8Array, float32ToInt16, arrayBufferToBase64, int16ToFloat32 } from '../utils/audioUtils';
import type { AppContextType, PantryItem, Recipe } from '../types';
import { generateRecipeFromTitle } from '../services/geminiService';
import { toTitleCase } from '../utils/formatters';

interface UseGeminiLiveProps {
  context: AppContextType;
}

export const useGeminiLive = ({ context }: UseGeminiLiveProps) => {
  const [isLive, setIsLive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [volume, setVolume] = useState(0); // For visualizer

  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  
  // Session refs
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  
  // Transcription accumulation
  const currentInputTranscription = useRef<string>("");

  // --- Tools Definitions ---
  const tools: FunctionDeclaration[] = [
    {
      name: 'addToPantry',
      description: 'Adicionar itens à despensa. Use quando o usuário disser "comprei", "adicione", "tenho" ou listar compras.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'Nome do alimento' },
                quantity: { type: Type.NUMBER, description: 'Quantidade numérica' },
                unit: { type: Type.STRING, description: 'Unidade (kg, g, l, un, pacote, lata)' }
              },
              required: ['name', 'quantity', 'unit']
            }
          }
        },
        required: ['items']
      }
    },
    {
        name: 'suggestRecipe',
        description: 'Sugerir uma receita completa. Use quando o usuário pedir sugestão de prato, almoço ou jantar.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: 'Título sugerido para a receita (ex: "Frango com Batatas")' }
            },
            required: ['title']
        }
    }
  ];

  // --- Audio Playback Logic ---
  const playAudioChunk = useCallback((float32Data: Float32Array) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    const buffer = ctx.createBuffer(1, float32Data.length, 24000); // Gemini output is usually 24kHz
    buffer.copyToChannel(float32Data, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);
    
    nextStartTimeRef.current = startTime + buffer.duration;
    
    setIsSpeaking(true);
    source.onended = () => {
       if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
           setIsSpeaking(false);
       }
    };
  }, []);

  // --- Main Connect Function ---
  const startSession = async () => {
    if (isLive) return;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      // 1. Setup Audio Input
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Navegador não suporta captura de áudio.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
      }});
      mediaStreamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // 2. Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          tools: [{ functionDeclarations: tools }],
          responseModalities: ['AUDIO'], // Focus on audio for speed
          inputAudioTranscription: { model: 'google-search-v1' }, // IMPORTANT: Enable user speech transcription to see chat bubbles
          systemInstruction: `Você é o Professor Nutri, um assistente divertido e educativo para famílias.
          IMPORTANTE:
          1. Responda de forma curta, falada e natural (max 2 frases por vez).
          2. Se o usuário falar que comprou algo, CHAME A FUNÇÃO 'addToPantry'.
          3. Se o usuário pedir ideia de comida, CHAME A FUNÇÃO 'suggestRecipe'.
          4. Não leia listas longas em voz alta, diga "adicionei sua lista".
          5. Seja carismático e use gírias leves de pai/mãe.`,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setIsLive(true);
            
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const outputData = e.outputBuffer.getChannelData(0);

                // CRITICAL FIX: Zero out the output buffer to prevent microphone feedback (echo)
                for (let i = 0; i < outputData.length; i++) {
                    outputData[i] = 0;
                }
                
                // Volume for visualizer
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length));

                // Send to API
                const int16Data = float32ToInt16(inputData);
                const base64Data = arrayBufferToBase64(int16Data.buffer);
                
                if (sessionPromiseRef.current) {
                    sessionPromiseRef.current.then(session => {
                        session.sendRealtimeInput({
                            media: {
                                mimeType: 'audio/pcm;rate=' + audioCtx.sampleRate,
                                data: base64Data
                            }
                        });
                    });
                }
            };
            
            source.connect(processor);
            processor.connect(audioCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const { serverContent, toolCall } = msg;

            // 1. Audio Output
            const audioData = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
                const uint8 = b64ToUint8Array(audioData);
                const int16 = new Int16Array(uint8.buffer);
                const float32 = int16ToFloat32(int16);
                playAudioChunk(float32);
            }

            // 2. User Transcription (Accumulate text chunks)
            if (serverContent?.inputTranscription) {
                const textChunk = serverContent.inputTranscription.text;
                if (textChunk) {
                    currentInputTranscription.current += textChunk;
                }
            }
            
            // 3. End of User Turn (Flush transcription to chat)
            if (serverContent?.turnComplete) {
                 if (currentInputTranscription.current.trim()) {
                     context.addMessageToChat({ role: 'user', text: currentInputTranscription.current.trim() });
                     currentInputTranscription.current = ""; // Reset buffer
                 }
            }

            // 4. Tool Calls (The Visual Cards) - Handle SAFELY
            if (toolCall) {
                const responses = [];
                for (const fc of toolCall.functionCalls) {
                    let result: any = { status: 'ok' };
                    
                    try {
                        if (fc.name === 'addToPantry') {
                            const args = fc.args as any;
                            // Validation: Ensure args exists, items is array
                            if (args && typeof args === 'object' && Array.isArray(args.items)) {
                                const validItems = args.items.map((i: any) => ({
                                    name: typeof i.name === 'string' ? i.name : 'Item desconhecido',
                                    quantity: typeof i.quantity === 'number' ? i.quantity : parseFloat(i.quantity) || 1,
                                    unit: typeof i.unit === 'string' ? i.unit : 'un'
                                })).filter((i: any) => i.name !== 'Item desconhecido');
                                
                                if (validItems.length > 0) {
                                    // Execute logic
                                    await context.addItemsToPantry(validItems);
                                    
                                    // VISUAL FEEDBACK: Add a system message to chat mimicking a card
                                    context.addMessageToChat({
                                        role: 'model',
                                        text: `📝 Adicionei ${validItems.length} itens à sua despensa:`,
                                        itemVerification: {
                                            status: 'verified',
                                            items: validItems.map((i: any) => ({
                                                id: Math.random().toString(),
                                                name: toTitleCase(i.name),
                                                quantity: i.quantity,
                                                unit: i.unit,
                                                isIncluded: true,
                                                isFood: true
                                            }))
                                        }
                                    });
                                    result = { success: true, message: `${validItems.length} itens adicionados com sucesso.` };
                                } else {
                                    result = { error: "Nenhum item válido identificado." };
                                }
                            } else {
                                 result = { error: "Formato de itens inválido." };
                            }
                        } else if (fc.name === 'suggestRecipe') {
                            const args = fc.args as any;
                            const title = args?.title;
                            
                            if (typeof title === 'string' && title.trim().length > 0) {
                                // VISUAL FEEDBACK: Show "Thinking" card first
                                const thinkingId = context.addMessageToChat({ role: 'model', text: `👨‍🍳 Criando receita especial: ${title}...` });
                                
                                try {
                                    const recipe = await generateRecipeFromTitle(title);
                                    // Update message with card
                                    context.updateMessage(thinkingId, {
                                        text: `Aqui está uma sugestão deliciosa!`,
                                        recipes: [recipe]
                                    });
                                    result = { success: true, message: "Receita exibida na tela." };
                                } catch (e) {
                                    context.updateMessage(thinkingId, { text: `Tive um problema ao criar a receita de ${title}.` });
                                    result = { error: "Failed to generate visual recipe" };
                                }
                            } else {
                                 result = { error: "Título da receita inválido." };
                            }
                        }
                    } catch (toolError) {
                        console.error("Tool execution error:", toolError);
                        result = { error: "Internal error executing tool" };
                    }

                    responses.push({
                        id: fc.id,
                        name: fc.name,
                        response: result
                    });
                }
                
                // Send tool response back to model so it knows it succeeded
                if (sessionPromiseRef.current) {
                    sessionPromiseRef.current.then(session => {
                        session.sendToolResponse({ functionResponses: responses });
                    });
                }
            }
            
            if (serverContent?.interrupted) {
                console.log("Model interrupted");
                // Stop current audio if user interrupts
                nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
                setIsSpeaking(false);
                currentInputTranscription.current = "";
            }
          },
          onclose: () => {
            console.log("Session Closed");
            stopSession();
          },
          onerror: (e) => {
            console.error("Gemini Live Error", e);
            stopSession();
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (error: any) {
      console.error("Failed to start live session", error);
      alert("Erro ao iniciar áudio. Verifique se o microfone está permitido.");
      setIsLive(false);
    }
  };

  const stopSession = () => {
    setIsLive(false);
    setIsSpeaking(false);
    setVolume(0);
    currentInputTranscription.current = "";

    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
    }
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }
    
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
  };

  return {
    isLive,
    isSpeaking,
    volume,
    startSession,
    stopSession
  };
};
