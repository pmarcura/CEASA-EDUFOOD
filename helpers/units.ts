import { UNITS } from '../constants/units';

/**
 * Safely gets the short display label for a given unit value.
 * @param unitValue The unit value from the pantry item (e.g., 'kg', 'un').
 * @returns The short label (e.g., 'kg') or the original value if not found.
 */
export const getUnitLabel = (unitValue: string | undefined): string => {
    if (!unitValue) return '';
    
    const unitObject = UNITS.find(u => u.value === unitValue);

    // If a unit is found in our constants, try to extract the short label (e.g., "kg" from "⚖️ kg").
    // If not found, or if the label is malformed, gracefully fall back to the original unit value.
    if (unitObject && unitObject.label) {
        return unitObject.label.split(' ')[1] || unitValue;
    }

    return unitValue;
};
