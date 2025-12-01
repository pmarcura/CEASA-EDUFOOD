
import type { FoodPersonality } from '../types';
import { Utensils, Heart, Smile, BatteryCharging, Shield, Search, Clock, Trophy, HelpCircle } from 'lucide-react';

export const FOOD_PERSONALITIES: { id: FoodPersonality; label: string; diagnosticQuestion: string; description: string; category: string; icon: any; aiInstruction: string }[] = [
    // 1. Aproximação da Comida (Food Approach)
    {
        id: 'food_responsive',
        label: 'Responsivo à Comida',
        diagnosticQuestion: 'Pede comida ou quer comer sempre que vê algo gostoso (mesmo sem fome)?',
        description: 'Come em resposta a estímulos externos (visão, cheiro).',
        category: 'Interesse Alto',
        icon: Utensils,
        aiInstruction: 'CRIANÇA RESPONSIVA À COMIDA: Risco de comer em excesso. Evite travessas na mesa (sirva empratado). Não deixe guloseimas à vista. Foque em alimentos ricos em fibra para saciedade.'
    },
    {
        id: 'emotional_overeater',
        label: 'Comedor Emocional',
        diagnosticQuestion: 'Costuma pedir comida quando está triste, ansioso ou entediado?',
        description: 'Busca comida como conforto emocional.',
        category: 'Emocional',
        icon: Heart,
        aiInstruction: 'CRIANÇA COMEDOR EMOCIONAL: Nunca use comida como prêmio ou consolo. Ensine a diferenciar fome física de emocional. Sugira atividades não alimentares para lidar com sentimentos.'
    },
    {
        id: 'enjoyment_of_food',
        label: 'Apreciador de Comida',
        diagnosticQuestion: 'Demonstra grande prazer e alegria na hora de comer?',
        description: 'A comida é uma grande fonte de recompensa.',
        category: 'Interesse Alto',
        icon: Smile,
        aiInstruction: 'CRIANÇA APRECIADORA: O prazer é positivo, mas monitore a qualidade. Use esse interesse para apresentar vegetais complexos e preparações saudáveis gourmet.'
    },

    // 2. Evitação da Comida (Food Avoidance)
    {
        id: 'satiety_responsive',
        label: 'Responsivo à Saciedade',
        diagnosticQuestion: 'Deixa comida no prato e diz que "encheu" rápido?',
        description: 'Para de comer ao menor sinal de estômago cheio.',
        category: 'Interesse Baixo',
        icon: BatteryCharging,
        aiInstruction: 'CRIANÇA RESPONSIVA À SACIEDADE: Respeite a saciedade, não force a "limpar o prato". Ofereça porções menores e mais frequentes com alta densidade nutricional.'
    },
    {
        id: 'neophobic',
        label: 'Neofóbico',
        diagnosticQuestion: 'Tem medo ou recusa total em provar alimentos novos/desconhecidos?',
        description: 'Medo inato do novo (mecanismo de defesa).',
        category: 'Recusa',
        icon: Shield,
        aiInstruction: 'CRIANÇA NEOFÓBICA: O novo assusta. Use a estratégia do "Porto Seguro": sempre sirva algo novo (minúsculo) ao lado de algo favorito. Apenas exponha, não force provar.'
    },
    {
        id: 'food_fussiness',
        label: 'Seletivo / Exigente',
        diagnosticQuestion: 'Rejeita alimentos conhecidos se a textura, cor ou marca mudar?',
        description: 'Exigente com detalhes e variedade restrita.',
        category: 'Recusa',
        icon: Search,
        aiInstruction: 'CRIANÇA SELETIVA: Sensível a texturas. Mantenha consistência nos favoritos, mas varie levemente a apresentação (corte, temperatura) para expandir a flexibilidade gradualmente.'
    },
    {
        id: 'slowness_in_eating',
        label: 'Comedor Lento',
        diagnosticQuestion: 'Demora muito para terminar o prato e perde o interesse no meio?',
        description: 'Comer é uma tarefa lenta e desinteressante.',
        category: 'Interesse Baixo',
        icon: Clock,
        aiInstruction: 'CRIANÇA COMEDOR LENTO: Remova distrações (telas). Estabeleça limite de tempo (30min) sem pressão. Se não comeu, encerre a refeição tranquilamente. A fome virá na próxima.'
    },

    // 3. Meta
    {
        id: 'eating_competent',
        label: 'Competente Alimentar',
        diagnosticQuestion: 'Tem uma relação tranquila, variada e positiva com a comida?',
        description: 'Come bem, respeita a saciedade e aceita novidades.',
        category: 'Meta',
        icon: Trophy,
        aiInstruction: 'CRIANÇA COMPETENTE: Modelo ideal. Continue mantendo a variedade e o ambiente positivo. Envolva no planejamento para manter a autonomia.'
    },

    // 4. Fallback
    {
        id: 'unknown',
        label: 'Não sei / Em observação',
        diagnosticQuestion: 'Ainda não consegui identificar um padrão claro.',
        description: 'Em fase de observação.',
        category: 'Outro',
        icon: HelpCircle,
        aiInstruction: 'PERFIL DESCONHECIDO: Aplique a Divisão de Responsabilidades (Satter): Pais decidem o quê, quando e onde; Criança decide o quanto e se vai comer.'
    }
];
