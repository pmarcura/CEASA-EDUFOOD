
import { normalizeUnit } from './formatters';

// Volume base in ml
const CULINARY_VOLUMES: Record<string, number> = {
    'xicara': 240,
    'xícara': 240,
    'copo': 200,
    'colher de sopa': 15,
    'colher de cha': 5,
    'colher de chá': 5,
    'cs': 15,
    'csp': 15,
    'cc': 5,
    'ml': 1,
    'l': 1000,
    'litro': 1000,
};

// Average density (g/ml) for common ingredients
// Value < 1 means lighter than water (flour), > 1 means heavier (honey/salt)
const INGREDIENT_DENSITIES: Record<string, number> = {
    // Basics
    'agua': 1,
    'leite': 1.03,
    'oleo': 0.9,
    'azeite': 0.9,
    'vinagre': 1,
    'manteiga': 0.9,
    'margarina': 0.9,
    
    // Dry Goods
    'farinha': 0.6, // 1 cup ~ 140g
    'trigo': 0.6,
    'acucar': 0.85, // 1 cup ~ 200g
    'açúcar': 0.85,
    'sal': 1.2,
    'arroz': 0.85,
    'feijao': 0.8,
    'feijão': 0.8,
    'aveia': 0.4,
    'fuba': 0.65,
    'amido': 0.6,
    'maizena': 0.6,
    'cacau': 0.5,
    'chocolate em po': 0.5,
    'cafe': 0.4,
    'café': 0.4,
    
    // Pastes/Sauces
    'mel': 1.4,
    'molho': 1.1,
    'ketchup': 1.1,
    'maionese': 0.95,
    'creme de leite': 1,
    'leite condensado': 1.3,
    
    // Generic fallback
    'default': 1 // Assume water density if unknown
};

const getDensity = (itemName: string): number => {
    const lowerName = itemName.toLowerCase();
    for (const key in INGREDIENT_DENSITIES) {
        if (lowerName.includes(key)) {
            return INGREDIENT_DENSITIES[key];
        }
    }
    return 1.0; // Default to 1g/ml
};

// Normalize any unit string to a standard key
const standardizeUnitKey = (unit: string): string | null => {
    const lower = unit.toLowerCase().trim();
    if (['kg', 'kilo', 'quilograma'].includes(lower)) return 'kg';
    if (['g', 'gr', 'grama'].includes(lower)) return 'g';
    if (['l', 'litro'].includes(lower)) return 'l';
    if (['ml', 'mililitro'].includes(lower)) return 'ml';
    if (['un', 'unidade', 'und'].includes(lower)) return 'un';
    
    // Culinary matches
    if (lower.includes('xícara') || lower.includes('xicara')) return 'xicara';
    if (lower.includes('sopa') || lower === 'cs') return 'colher de sopa';
    if (lower.includes('chá') || lower.includes('cha') || lower === 'cc') return 'colher de cha';
    if (lower.includes('copo')) return 'copo';
    
    return null;
};

export const calculateDeduction = (
    recipeQty: number,
    recipeUnit: string,
    pantryUnit: string,
    itemName: string
): number | null => {
    const stdRecipeUnit = standardizeUnitKey(recipeUnit);
    const stdPantryUnit = standardizeUnitKey(pantryUnit);

    if (!stdRecipeUnit || !stdPantryUnit) return null;

    // Case 0: Unit to Unit (Simple)
    if (stdRecipeUnit === 'un' && stdPantryUnit === 'un') {
        return recipeQty;
    }

    // Case 1: Weight to Weight (Easy)
    if (['kg', 'g'].includes(stdRecipeUnit) && ['kg', 'g'].includes(stdPantryUnit)) {
        const recipeInGrams = stdRecipeUnit === 'kg' ? recipeQty * 1000 : recipeQty;
        return stdPantryUnit === 'kg' ? recipeInGrams / 1000 : recipeInGrams;
    }

    // Case 2: Volume to Volume (Easy)
    if ((CULINARY_VOLUMES[stdRecipeUnit] || stdRecipeUnit === 'l' || stdRecipeUnit === 'ml') && 
        (['l', 'ml'].includes(stdPantryUnit))) {
        
        const recipeInMl = stdRecipeUnit === 'l' 
            ? recipeQty * 1000 
            : (CULINARY_VOLUMES[stdRecipeUnit] ? recipeQty * CULINARY_VOLUMES[stdRecipeUnit] : recipeQty);
            
        return stdPantryUnit === 'l' ? recipeInMl / 1000 : recipeInMl;
    }

    // Case 3: Cross-Domain (Volume to Weight or Weight to Volume)
    // Use Density
    const density = getDensity(itemName); // g/ml

    // Scenario A: Recipe is Volume (cup), Pantry is Weight (kg)
    // 1 cup flour -> ? kg flour
    if (CULINARY_VOLUMES[stdRecipeUnit] || ['l', 'ml'].includes(stdRecipeUnit)) {
        if (['kg', 'g'].includes(stdPantryUnit)) {
            const recipeInMl = stdRecipeUnit === 'l' 
                ? recipeQty * 1000 
                : (CULINARY_VOLUMES[stdRecipeUnit] ? recipeQty * CULINARY_VOLUMES[stdRecipeUnit] : recipeQty);
            
            const estimatedGrams = recipeInMl * density;
            return stdPantryUnit === 'kg' ? estimatedGrams / 1000 : estimatedGrams;
        }
    }

    // Scenario B: Recipe is Weight (g), Pantry is Volume (l) - Rare but possible (e.g. 500g milk)
    if (['kg', 'g'].includes(stdRecipeUnit)) {
        if (['l', 'ml'].includes(stdPantryUnit)) {
            const recipeInGrams = stdRecipeUnit === 'kg' ? recipeQty * 1000 : recipeQty;
            const estimatedMl = recipeInGrams / density;
            return stdPantryUnit === 'l' ? estimatedMl / 1000 : estimatedMl;
        }
    }

    // Fallback: Incompatible types (e.g. 'un' vs 'kg')
    return null;
};
