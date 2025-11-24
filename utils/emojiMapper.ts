
// Dictionary to map keywords to specific emojis
const EMOJI_MAP: Record<string, string> = {
    // Frutas
    'banana': '🍌', 'maçã': '🍎', 'maca': '🍎', 'pera': '🍐', 'pêra': '🍐',
    'laranja': '🍊', 'limão': '🍋', 'limao': '🍋', 'uva': '🍇', 'melancia': '🍉',
    'melão': '🍈', 'melao': '🍈', 'morango': '🍓', 'cereja': '🍒', 'pêssego': '🍑',
    'pessego': '🍑', 'manga': '🥭', 'abacaxi': '🍍', 'coco': '🥥', 'kiwi': '🥝',
    'tomate': '🍅', 'abacate': '🥑', 'azeitona': '🫒', 'mirtilo': '🫐',

    // Vegetais e Legumes
    'cenoura': '🥕', 'batata': '🥔', 'milho': '🌽', 'pimenta': '🌶️', 'pimentão': '🫑',
    'pepino': '🥒', 'alface': '🥬', 'brócolis': '🥦', 'brocolis': '🥦', 'alho': '🧄',
    'cebola': '🧅', 'cogumelo': '🍄', 'amendoim': '🥜', 'feijão': '🫘', 'feijao': '🫘',
    'ervilha': '🫛', 'batata doce': '🍠', 'berinjela': '🍆', 'espinafre': '🥬',
    'rúcula': '🥬', 'couve': '🥬', 'abóbora': '🎃', 'abobora': '🎃',

    // Carboidratos e Grãos
    'pão': '🍞', 'pao': '🍞', 'baguete': '🥖', 'pretzel': '🥨', 'bagel': '🥯',
    'panqueca': '🥞', 'waffle': '🧇', 'macarrão': '🍝', 'macarrao': '🍝', 'noodle': '🍜',
    'arroz': '🍚', 'curry': '🍛', 'sushi': '🍣', 'bento': '🍱', 'trigo': '🌾',
    'farinha': '🥡', 'cereal': '🥣', 'aveia': '🥣', 'biscoito': '🍪', 'bolacha': '🍪',
    'croissant': '🥐',

    // Carnes e Proteínas
    'carne': '🥩', 'bife': '🥩', 'frango': '🍗', 'peru': '🦃', 'bacon': '🥓',
    'hambúrguer': '🍔', 'hamburguer': '🍔', 'salsicha': '🌭', 'linguiça': '🌭',
    'ovo': '🥚', 'ovos': '🥚', 'peixe': '🐟', 'salmão': '🍣', 'camarão': '🦐',
    'camarao': '🦐', 'lagosta': '🦞', 'caranguejo': '🦀', 'lula': '🦑', 'ostra': '🦪',

    // Laticínios e Derivados
    'leite': '🥛', 'queijo': '🧀', 'manteiga': '🧈', 'iogurte': '🍦', 'requeijão': '🧀',
    'creme de leite': '🥛',

    // Doces e Sobremesas
    'sorvete': '🍨', 'bolo': '🍰', 'torta': '🥧', 'chocolate': '🍫', 'bombom': '🍬',
    'bala': '🍬', 'pirulito': '🍭', 'mel': '🍯', 'pudim': '🍮', 'donut': '🍩',
    'cookie': '🍪', 'gelatina': '🍮',

    // Bebidas
    'café': '☕', 'cafe': '☕', 'chá': '🍵', 'cha': '🍵', 'suco': '🧃', 'refrigerante': '🥤',
    'coca': '🥤', 'água': '💧', 'agua': '💧', 'vinho': '🍷', 'cerveja': '🍺',
    'champanhe': '🍾', 'drink': '🍹',

    // Temperos e Outros
    'sal': '🧂', 'açúcar': '🍚', 'acucar': '🍚', 'óleo': '🌻', 'oleo': '🌻',
    'azeite': '🫒', 'vinagre': '🏺', 'molho': '🥫', 'maionese': '🥚', 'ketchup': '🍅',
    
    // Categorias Genéricas
    'lanche': '🥪', 'sanduíche': '🥪', 'pizza': '🍕', 'frita': '🍟', 'salgadinho': '🥨',
    'sopa': '🍲', 'congelado': '🧊', 'limpeza': '🧹', 'sabão': '🧼', 'papel': '🧻'
};

export const getFoodEmoji = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    // 1. Direct Word Match (Check if the item name contains any key)
    for (const key in EMOJI_MAP) {
        // We check boundaries to avoid matching 'alface' inside 'alfaceira' (rare, but good practice)
        // Or simply check includes for flexibility
        if (lowerName.includes(key)) {
            return EMOJI_MAP[key];
        }
    }

    // 2. Fallback based on common substrings or categories if simple match fails
    if (lowerName.includes('caixa') || lowerName.includes('pacote')) return '📦';
    if (lowerName.includes('garrafa') || lowerName.includes('bebida')) return '🍾';
    if (lowerName.includes('lata')) return '🥫';
    if (lowerName.includes('doce')) return '🍬';
    if (lowerName.includes('molho')) return '🥫';

    // 3. Default
    return '🛍️';
};

export const getCategoryColor = (emoji: string): string => {
    // Returns a background color class based on the emoji type (heuristic)
    const fruits = ['🍌','🍎','🍐','🍊','🍋','🍇','🍉','🍈','🍓','🍒','🍑','🥭','🍍','🥥','🥝'];
    const veggies = ['🥕','🥔','🌽','🌶️','🫑','🥒','🥬','🥦','🧄','🧅','🍄','🫘','🫛','🍠','🍆','🎃'];
    const meat = ['🥩','🍗','🦃','🥓','🍔','🌭'];
    const seafood = ['🐟','🍣','🦐','🦞','🦀','🦑','🦪'];
    const dairy = ['🥛','🧀','🧈','🍦'];
    const drinks = ['☕','🍵','🧃','🥤','🍷','🍺','🍾','🍹','💧'];
    const sweets = ['🍨','🍰','🥧','🍫','🍬','🍭','🍯','🍮','🍩','🍪'];

    if (fruits.includes(emoji)) return '#FEF3C7'; // Yellow/Orange
    if (veggies.includes(emoji)) return '#D1FAE5'; // Green
    if (meat.includes(emoji)) return '#FEE2E2'; // Red
    if (seafood.includes(emoji)) return '#E0F2FE'; // Blue
    if (dairy.includes(emoji)) return '#F3F4F6'; // Gray/White
    if (drinks.includes(emoji)) return '#DBEAFE'; // Blue
    if (sweets.includes(emoji)) return '#FCE7F3'; // Pink

    return '#F3F4F6'; // Default Gray
};
