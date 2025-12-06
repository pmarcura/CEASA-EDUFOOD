
// Fixes floating point errors (e.g., 0.1 + 0.2 = 0.30000000004)
// Rounds to a max of 3 decimal places, stripping trailing zeros.
export const formatQuantity = (quantity: number): number => {
    if (quantity === null || quantity === undefined || isNaN(quantity)) return 0;
    return Math.round((quantity + Number.EPSILON) * 1000) / 1000;
};

export const normalizeUnit = (unit: string): string => {
    if (!unit || typeof unit !== 'string') return 'un';
    
    const u = unit.toLowerCase().trim();
    if (['g', 'grama', 'gramas'].includes(u)) return 'g';
    if (['kg', 'quilo', 'quilos', 'quilograma', 'quilogramas'].includes(u)) return 'kg';
    if (['ml', 'mililitro', 'mililitros'].includes(u)) return 'ml';
    if (['l', 'litro', 'litros'].includes(u)) return 'l';
    if (['un', 'unidade', 'und'].includes(u)) return 'un';
    if (['cx', 'caixa'].includes(u)) return 'caixa';
    if (['pc', 'pct', 'pacote'].includes(u)) return 'pacote';
    if (['lt', 'lata'].includes(u)) return 'lata';
    return u;
};

export const toTitleCase = (str: string): string => {
    if (!str || typeof str !== 'string') return '';
    
    const lower = str.toLowerCase();
    const exceptions = ['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'com', 'por', 'para', 'a', 'o', 'as', 'os'];
    
    return lower.split(' ').map((word, i) => {
        // Always capitalize the first word, otherwise check exceptions
        if (i !== 0 && exceptions.includes(word)) {
            return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};
