
// Utilitários para manipulação de áudio PCM para a Gemini Live API

export const b64ToUint8Array = (b64: string): Uint8Array => {
  const binaryString = atob(b64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Converte Float32 (AudioContext padrão) para Int16 (Gemini Input)
export const float32ToInt16 = (float32Array: Float32Array): Int16Array => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
};

// Converte Int16 (Gemini Output) para Float32 (AudioContext Output)
export const int16ToFloat32 = (int16Array: Int16Array): Float32Array => {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    const int = int16Array[i];
    float32Array[i] = int >= 0 ? int / 0x7fff : int / 0x8000;
  }
  return float32Array;
};

// Audio Worklet simplificado (ScriptProcessor) para capturar chunks de áudio
// Nota: Em produção, recomenda-se AudioWorklet, mas ScriptProcessor é mais simples para este exemplo.
export const createAudioProcessor = (
  audioContext: AudioContext,
  sourceNode: MediaStreamAudioSourceNode,
  onAudioData: (base64PCM: string) => void
) => {
  const bufferSize = 4096;
  const scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);

  scriptNode.onaudioprocess = (e) => {
    const inputData = e.inputBuffer.getChannelData(0);
    // Downsample logic se necessário, mas aqui assumimos que o contexto já está em 16k ou o modelo aceita
    // O Gemini Live recomenda 16000Hz.
    const int16Data = float32ToInt16(inputData);
    const base64Data = arrayBufferToBase64(int16Data.buffer);
    onAudioData(base64Data);
  };

  sourceNode.connect(scriptNode);
  scriptNode.connect(audioContext.destination); // Necessário para o fluxo, mesmo que volume seja 0

  return scriptNode;
};
