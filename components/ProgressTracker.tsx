
import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import type { Mission, Achievement } from '../types';
import { Target, Medal, Leaf, HeartHandshake, CookingPot } from 'lucide-react';

const missions: Mission[] = [
    {
        id: 'eat-5-fruits',
        title: 'Salada de Frutas',
        description: 'Adicione 5 tipos diferentes de frutas à sua despensa.',
        goal: 5,
        getCurrentProgress: (context) => {
            const fruitNames = ['maçã', 'banana', 'laranja', 'morango', 'uva', 'abacaxi', 'mamão', 'manga', 'pêra', 'melancia', 'limão', 'abacate', 'kiwi'];
            const fruitItems = context.pantry.filter(item => fruitNames.some(fruit => item.name.toLowerCase().includes(fruit)));
            return new Set(fruitItems.map(item => item.name)).size;
        },
    },
    {
        id: 'cook-2-recipes',
        title: 'Cozinheiro da Semana',
        description: 'Salve 2 receitas saudáveis no seu livro de receitas.',
        goal: 2,
        getCurrentProgress: (context) => context.savedRecipes.length,
    },
     {
        id: 'healthy-pantry-50',
        title: 'Despensa Campeã',
        description: 'Tenha pelo menos 50% de itens "in natura" na despensa.',
        goal: 50,
        getCurrentProgress: (context) => {
           if(context.pantry.length === 0) return 0;
           const inNaturaCount = context.pantry.filter(i => i.novaClassification === 'in_natura').length;
           return Math.round((inNaturaCount / context.pantry.length) * 100);
        },
    },
];

const achievements: Achievement[] = [
    {
        id: 'first-item',
        title: 'Primeiro Passo',
        description: 'Adicionou seu primeiro item à despensa!',
        icon: Leaf,
        isUnlocked: (context) => context.pantry.length > 0,
    },
    {
        id: 'first-recipe',
        title: 'Mestre Cuca',
        description: 'Salvou sua primeira receita no livro!',
        icon: CookingPot,
        isUnlocked: (context) => context.savedRecipes.length > 0,
    },
    {
        id: 'healthy-choice',
        title: 'Escolha Saudável',
        description: 'Sua despensa tem mais itens saudáveis do que ultraprocessados.',
        icon: HeartHandshake,
        isUnlocked: (context) => {
            if (context.pantry.length === 0) return false;
            const inNatura = context.pantry.filter(i => i.novaClassification === 'in_natura').length;
            const ultra = context.pantry.filter(i => i.novaClassification === 'ultra_processed').length;
            return inNatura > ultra;
        },
    },
];


const ProgressTracker: React.FC = () => {
    const context = useContext(AppContext);

    if (!context) return null;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-brand-text">Sua Jornada Saudável</h2>
                <p className="text-brand-text-secondary">Acompanhe suas missões e conquistas!</p>
            </div>
            
            <div>
                <h3 className="text-xl font-semibold text-brand-text mb-3 flex items-center"><Target className="mr-3 text-brand-primary"/> Missões Atuais</h3>
                <div className="space-y-4">
                    {missions.map(mission => {
                        const progress = mission.getCurrentProgress(context);
                        const percentage = Math.min((progress / mission.goal) * 100, 100);
                        return (
                            <div key={mission.id} className="bg-brand-surface p-4 rounded-2xl shadow-edu">
                                <div className="flex justify-between items-center">
                                    <p className="font-bold text-brand-text">{mission.title}</p>
                                    <p className="text-sm font-medium text-brand-text-secondary">{progress} / {mission.goal}</p>
                                </div>
                                <p className="text-sm text-brand-text-secondary mb-3">{mission.description}</p>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 bg-brand-primary`} style={{ width: `${percentage}%` }}>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-brand-text mb-3 flex items-center"><Medal className="mr-3 text-brand-primary"/> Conquistas</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {achievements.map(ach => {
                        const unlocked = ach.isUnlocked(context);
                        return (
                            <div key={ach.id} className={`p-4 rounded-2xl text-center transition-all duration-300 flex flex-col items-center justify-center aspect-square ${unlocked ? 'bg-green-100/50 shadow-edu' : 'bg-gray-100'}`}>
                                <div className={`p-3 rounded-full mb-2 ${unlocked ? 'bg-brand-primary' : 'bg-gray-300'}`}>
                                    <ach.icon className={`h-8 w-8 transition-colors ${unlocked ? 'text-white' : 'text-gray-500'}`} />
                                </div>
                                <p className={`font-bold text-sm ${unlocked ? 'text-green-900' : 'text-brand-text-secondary'}`}>{ach.title}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ProgressTracker;
