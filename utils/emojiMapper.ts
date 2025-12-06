
// Dictionary to map keywords to specific emojis
// Organized by category for easier maintenance with priority logic

const EMOJI_CATEGORIES: Record<string, string[]> = {
    // 1. FRUTAS
    '🍎': ['maçã', 'maca', 'maça vermelha', 'maça verde', 'red apple'],
    '🍌': ['banana', 'bananas', 'prata', 'nanica', 'caturra'],
    '🍇': ['uva', 'uvas', 'passas', 'rubi', 'thompson'],
    '🍉': ['melancia'],
    '🍓': ['morango', 'morangos'],
    '🍒': ['cereja'],
    '🍑': ['pêssego', 'pessego', 'nectarina'],
    '🍍': ['abacaxi'],
    '🍋': ['limão', 'limao', 'siciliano'],
    '🍊': ['tangerina', 'mexerica', 'laranja', 'ponkan', 'murcott'],
    '🍋‍🟩': ['lima', 'limão taiti', 'limao taiti'],
    '🥭': ['manga', 'mangas', 'palmer', 'tommy'],
    '🥥': ['coco', 'água de coco', 'coco seco', 'coco ralado'],
    '🥝': ['kiwi'],
    '🍈': ['melão', 'melao'],
    '🍐': ['pera', 'pêra', 'williams', 'portuguesa'],
    '🫐': ['mirtilo', 'blueberry'],
    '🫒': ['azeitona', 'oliva'],
    '🥑': ['abacate', 'avocado'],

    // 2. LEGUMES, VERDURAS E GRÃOS
    '🧄': ['alho'],
    '🧅': ['cebola', 'cebola roxa', 'cebola branca'],
    '🫚': ['gengibre'],
    '🌶️': ['pimenta', 'dedo de moça', 'biquinho', 'malagueta', 'pimenta do reino'],
    '🫜': ['beterraba', 'nabo', 'rabanete', 'vegetal de raiz'],
    '🥦': ['brócolis', 'brocolis', 'ninja'],
    '🥕': ['cenoura', 'cenouras'],
    '🌽': ['milho', 'espiga', 'milho verde'],
    '🥒': ['pepino', 'japonês', 'caipira'],
    '🍆': ['berinjela'],
    '🥬': ['alface', 'couve', 'rúcula', 'agrião', 'escarola', 'verdura', 'acelga', 'espinafre', 'folha'],
    '🫑': ['pimentão', 'pimentao', 'pimentão vermelho', 'pimentão amarelo', 'pimentão verde'],
    '🥔': ['batata', 'inglesa', 'monalisa', 'asterix', 'batata lavada'],
    '🍠': ['batata doce', 'inhame', 'cará', 'mandioca', 'aipim', 'macaxeira'],
    '🫛': ['vagem', 'ervilha torta', 'ervilha fresca'],
    '🫘': ['feijão', 'feijao', 'carioca', 'preto', 'branco', 'fradinho', 'lentilha', 'grão de bico', 'soja'],
    '🥜': ['amendoim', 'castanha', 'nozes'],
    '🍄‍🟫': ['cogumelo', 'shimeji', 'shitake', 'paris', 'funghi', 'cogumelo marrom', 'champignon'],
    '🍄': ['cogumelo vermelho', 'amanita'],
    '🌰': ['castanha portuguesa', 'noz', 'avelã'],

    // 3. PROTEÍNAS E CARNES (Cortes Específicos Brasileiros)
    '🥩': [
        'carne', 'bife', 'patinho', 'alcatra', 'picanha', 'maminha', 'acém', 'acem', 
        'lagarto', 'coxão', 'coxao', 'musculo', 'músculo', 'cupim', 'filé mignon', 
        'file mignon', 'contra filé', 'contra file', 'costela', 'fraldinha', 
        'moída', 'moida', 'roast beef', 'vitela', 'cordeiro', 'bisteca', 'chuleta',
        'fígado', 'figado', 'miúdos', 'miudos', 'bucho', 'rabada', 'ossobuco', 'paleta',
        'corte de carne', 'carne vermelha', 'carne de panela', 'carne assada'
    ],
    '🍗': [
        'frango', 'peito de frango', 'sobrecoxa', 'coxa', 'asa', 'asinha', 'tulipa', 'galinha', 'chester', 
        'peru', 'ave', 'pato', 'codorna', 'nugget', 'empanado', 'filezinho', 'sassami', 'coxinha da asa'
    ],
    '🍖': ['carne com osso', 'pernil', 'joelho', 'costelinha', 'lombo', 'bisteca de porco'],
    '🥓': ['bacon', 'panceta', 'toucinho', 'torresmo'],
    '🌭': ['salsicha', 'linguiça', 'linguica', 'calabresa', 'paio', 'mortadela', 'presunto', 'apresuntado', 'salami', 'salame', 'pepperoni', 'cachorro quente'],
    '🍔': ['hambúrguer', 'hamburguer', 'burger', 'burguer'],
    '🐟': [
        'peixe', 'tilápia', 'tilapia', 'salmão', 'salmao', 'bacalhau', 'merluza', 
        'sardinha', 'atum', 'truta', 'cação', 'cacao', 'linguado', 'pescada', 'tambana', 'pintado', 'filé de peixe'
    ],
    '🦐': ['camarão', 'camarao', 'gamba'],
    '🦀': ['caranguejo', 'siri'],
    '🍣': ['sushi', 'sashimi', 'niguiri', 'temaki', 'comida japonesa'],
    '🥚': ['ovo', 'ovos', 'clara', 'gema'],
    '🧀': ['queijo', 'mussarela', 'muçarela', 'prato', 'parmesão', 'parmesao', 'gorgonzola', 'provolone', 'minas', 'frescal', 'ricota', 'cotage', 'cottage', 'requeijão', 'requeijao', 'catupiry', 'cheddar', 'brie', 'camembert'],

    // 4. PADARIA E CARBOIDRATOS
    '🍞': ['pão', 'pao', 'forma', 'integral', 'caseiro', 'bisnaga'],
    '🥐': ['croissant'],
    '🥖': ['baguete', 'pão francês', 'pao frances'],
    '🥯': ['bagel', 'rosquinha salgada'],
    '🥨': ['pretzel'],
    '🥞': ['panqueca', 'panquecas'],
    '🧇': ['waffle'],
    '🍝': ['macarrão', 'macarrao', 'espaguete', 'massa', 'penne', 'fusilli', 'gravata', 'lasanha', 'noodle', 'miojo'],
    '🍚': ['arroz', 'cozido', 'risoto'],
    '🥪': ['sanduíche', 'sanduiche', 'misto quente'],
    '🍕': ['pizza', 'minipizza'],
    '🌮': ['taco'],
    '🌯': ['burrito', 'wrap'],
    '🥣': ['sopa', 'mingau', 'cereal', 'aveia em flocos', 'granola', 'caldo'],

    // 5. DOCES E SOBREMESAS
    '🎂': ['bolo', 'torta doce'],
    '🧁': ['cupcake', 'muffin'],
    '🍰': ['fatia de bolo', 'cheesecake'],
    '🍦': ['sorvete', 'casquinha', 'picolé', 'picole'],
    '🍩': ['rosquinha', 'donut', 'sonho'],
    '🍪': ['biscoito', 'bolacha', 'cookie', 'recheado', 'maisena'],
    '🍫': ['chocolate', 'barra', 'bombom', 'achocolatado', 'toddy', 'nescau'],
    '🍬': ['bala', 'doce', 'chiclete'],
    '🍯': ['mel', 'melado', 'glucose'],
    '🍮': ['pudim', 'flan', 'manjar'],
    '🍭': ['pirulito'],

    // 6. BEBIDAS
    '☕': ['café', 'cafe', 'espresso'],
    '🍵': ['chá', 'cha', 'matcha', 'mate'],
    '🫖': ['bule'],
    '🥛': ['leite', 'integral', 'desnatado', 'semi-desnatado', 'creme de leite', 'soro', 'bebida lactea'],
    '🧃': ['suco', 'caixinha', 'néctar', 'nectar', 'refresco', 'kapo'],
    '🥤': ['refrigerante', 'coca', 'guaraná', 'fanta', 'pepsi', 'sprite', 'milkshake', 'copo'],
    '🧋': ['bubble tea'],
    '🍺': ['cerveja', 'chope', 'beer'],
    '🍷': ['vinho', 'tinto', 'seco', 'suave'],
    '🍸': ['coquetel', 'drink'],
    '🥂': ['espumante', 'brinde'],
    '🍾': ['champanhe'],
    '🥃': ['whisky', 'destilado'],
    '🧊': ['gelo'],

    // 7. INGREDIENTES DE COZINHA E OUTROS
    '🧂': ['sal', 'tempero', 'sazon'],
    '🧈': ['manteiga', 'margarina', 'nata'],
    '🥫': ['molho de tomate', 'extrato', 'enlatado', 'milho em lata', 'ervilha em lata', 'conserva'],
    '🏺': ['óleo', 'oleo', 'azeite', 'vinagre', 'shoyu'],
    '🥡': ['marmita', 'delivery'],
    '📦': ['caixa', 'pacote', 'item', 'produto']
};

export const getFoodEmoji = (itemName: string): string => {
    if (!itemName) return '📦';
    
    const lowerName = itemName.toLowerCase().trim();
    
    // First pass: Check for exact matches or high-priority substrings
    // We prioritize longer matches to avoid partial confusion (e.g., "batata doce" > "batata")
    
    let bestMatchEmoji = '📦';
    let maxMatchLength = 0;

    for (const [emoji, keywords] of Object.entries(EMOJI_CATEGORIES)) {
        for (const keyword of keywords) {
            // Check if the item name contains the keyword
            if (lowerName.includes(keyword)) {
                // If it matches, check if it's a longer/more specific match than what we have
                if (keyword.length > maxMatchLength) {
                    maxMatchLength = keyword.length;
                    bestMatchEmoji = emoji;
                }
            }
        }
    }

    return bestMatchEmoji;
};

export const getCategoryColor = (emoji: string): string => {
    // Defines background colors for categories based on the emoji returned
    // Proteins
    if (['🥩', '🍗', '🍖', '🥓', '🌭', '🍔', '🐟', '🦐', '🦀', '🍣', '🥚'].includes(emoji)) return '#FEE2E2'; // Red-100
    // Fruits & Veggies
    if (['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍑', '🍍', '🍋', '🍊', '🍋‍🟩', '🥭', '🥥', '🥝', '🍈', '🍐', '🫐', '🫒', '🥑', '🥦', '🥕', '🌽', '🥒', '🍆', '🥬', '🫑', '🥔', '🍠', '🫛', '🫘', '🥜', '🍄', '🍄‍🟫', '🌰', '🧄', '🧅', '🫚', '🌶️', '🫜'].includes(emoji)) return '#DCFCE7'; // Green-100
    // Dairy & Bakery
    if (['🥛', '🧀', '🧈', '🍞', '🥐', '🥖', '🥯', '🥨', '🥞', '🧇', '🥪'].includes(emoji)) return '#FEF3C7'; // Yellow-100
    // Sweets & Processed
    if (['🎂', '🧁', '🍰', '🍦', '🍩', '🍪', '🍫', '🍬', '🍯', '🍮', '🍭', '🥤', '🍕', '🍟'].includes(emoji)) return '#F3E8FF'; // Purple-100
    
    return '#F3F4F6'; // Gray-100 default
};
