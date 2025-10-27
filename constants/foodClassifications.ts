export const NOVA_CLASSIFICATION = {
  in_natura: {
    label: 'In Natura ou Minimamente Processado',
    description: 'Alimentos em seu estado natural ou com mínimas alterações, sem adição de sal, açúcar ou óleos.',
    color: 'bg-green-100 text-green-800',
    borderColor: 'border-green-500',
  },
  culinary_ingredients: {
    label: 'Ingrediente Culinário Processado',
    description: 'Substâncias extraídas de alimentos in natura, como óleos, gorduras, açúcar e sal.',
    color: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-500',
  },
  processed: {
    label: 'Alimento Processado',
    description: 'Produtos feitos com adição de sal, açúcar ou óleos a alimentos in natura.',
    color: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-500',
  },
  ultra_processed: {
    label: 'Alimento Ultraprocessado',
    description: 'Formulações industriais com múltiplos ingredientes e aditivos.',
    color: 'bg-red-100 text-red-800',
    borderColor: 'border-red-500',
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