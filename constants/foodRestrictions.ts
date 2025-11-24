import type { ReligiousDiet } from '../types';

export const RELIGIOUS_DIETS_OPTIONS: { id: ReligiousDiet; label: string; description: string }[] = [
    {
        id: 'halal',
        label: 'Halal',
        description: 'Segue as leis alimentares islâmicas, sem carne de porco e álcool.',
    },
    {
        id: 'kosher',
        label: 'Kosher',
        description: 'Segue as leis alimentares judaicas, com regras sobre carnes e laticínios.',
    },
];
