export const NOVA_CLASSIFICATION = {
  in_natura: {
    label: 'In Natura ou Minimamente Processado',
    simpleLabel: 'In Natura',
    description: 'Alimentos em seu estado natural ou com mínimas alterações, sem adição de sal, açúcar ou óleos.',
    color: 'bg-green-100 text-green-800',
    borderColor: 'border-green-500',
    chartColor: '#22C55E',
  },
  culinary_ingredients: {
    label: 'Ingrediente Culinário Processado',
    simpleLabel: 'Ingredientes',
    description: 'Substâncias extraídas de alimentos in natura, como óleos, gorduras, açúcar e sal.',
    color: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-500',
    chartColor: '#22C55E', // Grouped with in_natura for color
  },
  processed: {
    label: 'Alimento Processado',
    simpleLabel: 'Processado',
    description: 'Produtos feitos com adição de sal, açúcar ou óleos a alimentos in natura.',
    color: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-500',
    chartColor: '#F59E0B',
  },
  ultra_processed: {
    label: 'Alimento Ultraprocessado',
    simpleLabel: 'Ultraprocessado',
    description: 'Formulações industriais com múltiplos ingredientes e aditivos.',
    color: 'bg-red-100 text-red-800',
    borderColor: 'border-red-500',
    chartColor: '#EF4444',
  },
};

export const CODEX_CATEGORIES = [
  'Laticínios e análogos',
  'Gorduras e óleos',
  'Frutas e vegetais',
  'Confeitaria',
  'Cereais e produtos à base de cereais',
  'Produtos de panificação',
  'Carnes e produtos cárneos',
  'Peixes e produtos da pesca',
  'Doces, incluindo mel',
  'Bebidas',
  'Outros'
];