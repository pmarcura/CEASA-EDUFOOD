
import React, { useState, useContext, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { AppContext } from '../../contexts/AppContext';
import { X, Sparkles, LoaderCircle, Sun, Moon, Coffee, CalendarPlus, Edit, Trash2, PlusCircle, ArrowRight, ArrowLeft, Utensils, Heart, Leaf, Banknote, CheckCircle, Brain, ChefHat } from 'lucide-react';
import type { MealPlanRequest, PlannedMeal, Recipe, MealLogEntry } from '../../types';
import { generateMealPlan } from '../../services/geminiService';
import PlannerRecipeCard from '../PlannerRecipeCard';
import EditableRecipeModal from './EditableRecipeModal';
import { ACTION_XP_VALUES } from '../../services/gamificationService';

type PlannerStep = 'hub' | 'entry' | 'context' | 'finetuning' | 'loading' | 'overview' | 'summary' | 'shoppingList';
type Priority = 'use_pantry' | 'healthy' | 'new_foods' | 'economy';
type MealType = 'breakfast' | 'lunch' | 'dinner';

const getMealType = (timestamp: number): MealType => {
    const hour = new Date(timestamp).getHours();
    if (hour < 11) return 'breakfast';
    if (hour < 17) return 'lunch';
    return 'dinner';
};

const mealTypeDetails: Record<MealType, { label: string, icon: React.ElementType }> = {
    breakfast: { label: 'Café da Manhã', icon: Coffee },
    lunch: { label: 'Almoço', icon: Sun },
    dinner: { label: 'Jantar', icon: Moon },
};

// Helper to normalize day names
const normalizeDayName = (dayName: string): string => {
    const lower = dayName.toLowerCase();
    if (lower.includes('segunda')) return 'Segunda-feira';
    if (lower.includes('terça') || lower.includes('terca')) return 'Terça-feira';
    if (lower.includes('quarta')) return 'Quarta-feira';
    if (lower.includes('quinta')) return 'Quinta-feira';
    if (lower.includes('sexta')) return 'Sexta-feira';
    if (lower.includes('sábado') || lower.includes('sabado')) return 'Sábado';
    if (lower.includes('domingo')) return 'Domingo';
    return dayName; // Fallback
};


// HubScreen Component
const HubScreen: React.FC<{
    meals: MealLogEntry[],
    onEdit: (meal: MealLogEntry) => void,
    onRemove: (mealId: string) => void,
    onPlanNew: () => void,
}> = ({ meals, onEdit, onRemove, onPlanNew }) => {
    
    const nextSevenDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    }, []);

    const mealsByDay = useMemo(() => {
        return meals.reduce((acc, meal) => {
            const dayKey = new Date(meal.timestamp).toDateString();
            if (!acc[dayKey]) acc[dayKey] = [];
            acc[dayKey].push(meal);
            return acc;
        }, {} as Record<string, MealLogEntry[]>);
    }, [meals]);

    return (
        <div className="animate-fade-in">
             <div className="text-center mb-6">
                <h3 className="font-bold text-2xl text-brand-text">Seu Plano da Semana</h3>
                {meals.length === 0 && <p className="text-sm text-brand-text-secondary mt-2">Você ainda não tem refeições planejadas. Que tal começar agora?</p>}
            </div>
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {nextSevenDays.map(day => {
                    const dayKey = day.toDateString();
                    const mealsForDay = mealsByDay[dayKey] || [];
                    const mealsByType = mealsForDay.reduce((acc, meal) => {
                        acc[getMealType(meal.timestamp)] = meal;
                        return acc;
                    }, {} as Record<MealType, MealLogEntry>);

                    return (
                        <div key={dayKey}>
                            <h4 className="font-bold text-brand-text capitalize mb-2">{day.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}</h4>
                            <div className="space-y-2">
                                {(Object.keys(mealTypeDetails) as MealType[]).map(mealType => {
                                    const meal = mealsByType[mealType];
                                    const { label, icon: Icon } = mealTypeDetails[mealType];

                                    if (meal) {
                                        return (
                                            <div key={meal.id} className="bg-brand-surface p-2.5 rounded-lg border border-brand-border flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <Icon size={18} className="text-brand-primary flex-shrink-0" />
                                                    <div>
                                                      <p className="text-sm font-semibold text-brand-text">{meal.recipeTitle}</p>
                                                      <p className="text-xs text-brand-text-secondary">{label}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => onEdit(meal)} className="p-1.5 hover:bg-gray-100 rounded-full"><Edit size={14}/></button>
                                                    <button onClick={() => onRemove(meal.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-full"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <button key={mealType} onClick={onPlanNew} className="w-full bg-brand-surface p-2.5 rounded-lg border-2 border-dashed border-brand-border flex items-center gap-3 text-brand-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors">
                                                <PlusCircle size={18} />
                                                <div className="text-left">
                                                    <p className="text-sm font-semibold">Adicionar</p>
                                                    <p className="text-xs">{label}</p>
                                                </div>
                                            </button>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            
             <button onClick={onPlanNew} className="w-full mt-6 bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-base shadow-lg hover:bg-brand-dark">
                <CalendarPlus className="mr-2" size={18}/>
                {meals.length > 0 ? 'Adicionar ao Plano' : 'Planejar Semana com IA'}
            </button>
        </div>
    );
};


const PlanEntrySheet: React.FC<{ onSelect: (type: 'quick' | 'full') => void }> = ({ onSelect }) => (
    <div className="text-center animate-fade-in">
        <h3 className="font-bold text-2xl text-brand-text">Como você prefere planejar esta semana?</h3>
        <div className="mt-6 space-y-4">
            <div onClick={() => onSelect('quick')} className="bg-brand-surface p-4 rounded-xl border border-brand-border cursor-pointer hover:border-brand-primary">
                <p className="font-bold text-brand-text">Planejamento rápido</p>
                <p className="text-sm text-brand-text-secondary">Sugestões para 2 ou 3 jantares, em poucos toques.</p>
            </div>
            <div onClick={() => onSelect('full')} className="bg-brand-surface p-4 rounded-xl border border-brand-border cursor-pointer hover:border-brand-primary">
                <p className="font-bold text-brand-text">Semana completa</p>
                <p className="text-sm text-brand-text-secondary">Planejar mais dias e organizar melhor as compras.</p>
            </div>
        </div>
        <p className="text-xs text-brand-text-secondary mt-6 bg-yellow-50 text-yellow-800 px-3 py-2 rounded-lg">
            Planejar a semana rende <strong>Cenouras Douradas</strong> 🎯
        </p>
    </div>
);

const WeeklyContextScreen: React.FC<{ onNext: (data: Partial<MealPlanRequest>) => void, onSkip: () => void, initialData: Partial<MealPlanRequest> }> = ({ onNext, onSkip, initialData }) => {
    const [nightsToCook, setNightsToCook] = useState(initialData.nightsToCook || 3);
    const [busyDays, setBusyDays] = useState<string[]>(initialData.busyDays || []);
    const [priority, setPriority] = useState<Priority>(initialData.priority || 'use_pantry');

    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const priorities: { id: Priority, label: string, icon: React.ElementType }[] = [
        { id: 'use_pantry', label: 'Aproveitar o que já temos', icon: Utensils },
        { id: 'healthy', label: 'Comida saudável', icon: Leaf },
        { id: 'new_foods', label: 'Provar coisas novas', icon: Heart },
        { id: 'economy', label: 'Gastar menos', icon: Banknote },
    ];
    
    return (
        <div className="animate-fade-in">
            <h3 className="font-bold text-xl text-center mb-4 text-brand-text">Contexto da semana</h3>
            <div className="space-y-4">
                <div>
                    <p className="font-semibold text-sm mb-2 text-brand-text-secondary">Em quantas noites querem cozinhar?</p>
                    <div className="grid grid-cols-4 gap-2">
                        {[2,3,4,5].map(n => <button key={n} onClick={() => setNightsToCook(n)} className={`p-3 rounded-lg font-bold ${nightsToCook === n ? 'bg-brand-primary text-white' : 'bg-brand-surface'}`}>{n}{n === 5 ? '+' : ''}</button>)}
                    </div>
                </div>
                <div>
                    <p className="font-semibold text-sm mb-2 text-brand-text-secondary">Quais dias são mais corridos?</p>
                    <div className="grid grid-cols-4 gap-2">
                        {days.map(d => {
                            const isSelected = busyDays.includes(d);
                            return <button key={d} onClick={() => setBusyDays(b => isSelected ? b.filter(day => day !== d) : [...b, d])} className={`p-3 rounded-lg font-bold ${isSelected ? 'bg-brand-primary text-white' : 'bg-brand-surface'}`}>{d}</button>
                        })}
                    </div>
                </div>
                <div>
                    <p className="font-semibold text-sm mb-2 text-brand-text-secondary">Qual a prioridade da semana?</p>
                    <div className="space-y-2">
                        {priorities.map(p => <button key={p.id} onClick={() => setPriority(p.id)} className={`w-full text-left p-3 rounded-lg font-bold flex items-center gap-3 ${priority === p.id ? 'bg-brand-primary text-white' : 'bg-brand-surface'}`}><p.icon size={18}/> {p.label}</button>)}
                    </div>
                </div>
            </div>
            <button onClick={() => onNext({ nightsToCook, busyDays, priority })} className="w-full mt-6 bg-brand-primary text-white font-bold py-3 px-4 rounded-xl">Continuar</button>
        </div>
    );
};

const WeeklyFineTuningScreen: React.FC<{ onGenerate: (data: Partial<MealPlanRequest>) => void, onBack: () => void, pantry: any[] }> = ({ onGenerate, onBack, pantry }) => {
    const [specificIngredients, setSpecificIngredients] = useState<string[]>([]);
    const [avoidItems, setAvoidItems] = useState<string[]>([]);
    
    const pantryOptions = useMemo(() => pantry.slice(0, 5).map(i => i.name), [pantry]);
    const avoidOptions = ['Fritura', 'Doces', 'Refrigerante', 'Carne vermelha', 'Nada específico'];

    const toggleItem = (list: string[], setList: Function, item: string) => {
        setList((current: string[]) => current.includes(item) ? current.filter(i => i !== item) : [...current, item]);
    };

    return (
        <div className="animate-fade-in">
             <h3 className="font-bold text-xl text-center mb-4 text-brand-text">Ajustes Finais</h3>
             <div className="space-y-4">
                <div>
                    <p className="font-semibold text-sm mb-2 text-brand-text-secondary">Quer usar algo que já tem em casa?</p>
                    <div className="flex flex-wrap gap-2">
                        {pantryOptions.map(item => <button key={item} onClick={() => toggleItem(specificIngredients, setSpecificIngredients, item)} className={`px-3 py-1.5 rounded-full font-semibold text-sm ${specificIngredients.includes(item) ? 'bg-brand-primary text-white' : 'bg-brand-surface'}`}>{item}</button>)}
                    </div>
                </div>
                 <div>
                    <p className="font-semibold text-sm mb-2 text-brand-text-secondary">Quer pegar leve em algo?</p>
                    <div className="flex flex-wrap gap-2">
                        {avoidOptions.map(item => <button key={item} onClick={() => toggleItem(avoidItems, setAvoidItems, item)} className={`px-3 py-1.5 rounded-full font-semibold text-sm ${avoidItems.includes(item) ? 'bg-brand-primary text-white' : 'bg-brand-surface'}`}>{item}</button>)}
                    </div>
                </div>
             </div>
             <button onClick={() => onGenerate({ specificIngredients, avoidItems })} className="w-full mt-6 bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center"><Brain className="mr-2" size={18}/> Gerar Sugestões</button>
        </div>
    )
};

const WeeklyPlanOverviewScreen: React.FC<{ plan: PlannedMeal[], onConfirm: () => void, onRegenerate: () => void, onSelectRecipe: (recipe: Recipe) => void }> = ({ plan, onConfirm, onRegenerate, onSelectRecipe }) => (
    <div className="animate-fade-in">
        <h3 className="font-bold text-xl text-center mb-1 text-brand-text">Sugestões para esta semana</h3>
        <p className="text-center text-sm text-brand-text-secondary mb-4">Tudo aqui é um rascunho. Você pode trocar ou remover qualquer dia.</p>
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
            {plan.map((meal, index) => (
                <div key={index}>
                    <h4 className="font-bold text-sm mb-1 text-brand-text">{meal.dayOfWeek} - {mealTypeDetails[meal.mealType].label}</h4>
                    <PlannerRecipeCard recipe={meal.recipe} onView={() => onSelectRecipe(meal.recipe)} />
                </div>
            ))}
        </div>
        <button onClick={onConfirm} className="w-full mt-6 bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center"><CheckCircle className="mr-2" size={18}/> Confirmar Plano da Semana</button>
    </div>
);

const MealPlannerModal: React.FC = () => {
    const context = useContext(AppContext);
    
    const futureMeals = useMemo(() => {
        if (!context) return [];
        const now = new Date();
        now.setHours(0,0,0,0); // Start of today
        return context.mealLog
            .filter(log => log.timestamp >= now.getTime())
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [context?.mealLog]);

    const [step, setStep] = useState<PlannerStep>(futureMeals.length > 0 ? 'hub' : 'entry');
    const [request, setRequest] = useState<Partial<MealPlanRequest>>({ meals: ['dinner'] });
    const [plan, setPlan] = useState<PlannedMeal[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingMeal, setEditingMeal] = useState<MealLogEntry | null>(null);

    if (!context) return null;
    const { setIsMealPlannerOpen, userProfile, pantry, mealLog, addMealLogEntry, setViewingRecipe, awardGoldenCarrots, deleteMealLogEntry, updateMealLogEntry } = context;

    const handlePlanTypeSelect = (type: 'quick' | 'full') => {
        const newRequest: Partial<MealPlanRequest> = {
            ...request,
            nightsToCook: type === 'quick' ? 3 : 5,
        };
        setRequest(newRequest);
        setStep('context');
    };

    const handleGeneratePlan = async (data: Partial<MealPlanRequest>) => {
        const finalRequest = { ...request, ...data };
        setRequest(finalRequest);
        setStep('loading');
        try {
            const result = await generateMealPlan(finalRequest as MealPlanRequest, pantry, userProfile, mealLog);
            setPlan(result);
            setStep('overview');
        } catch (error) {
            console.error("Failed to generate plan:", error);
            setStep('context');
        }
    };

    const handleConfirmPlan = async () => {
        setIsSubmitting(true);
        const now = new Date();
        const currentDayOfWeek = now.getDay(); // Sunday: 0, Monday: 1...
        const dayMap: Record<string, number> = { 'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3, 'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6 };
    
        for (const plannedMeal of plan) {
            const normalizedDay = normalizeDayName(plannedMeal.dayOfWeek);
            const targetDayOfWeek = dayMap[normalizedDay];
            
            if (targetDayOfWeek === undefined) {
                console.warn("Dia da semana inválido:", plannedMeal.dayOfWeek);
                continue;
            }

            let dayDifference = targetDayOfWeek - currentDayOfWeek;
            // If the day has passed this week, schedule for next week
            if (dayDifference < 0) dayDifference += 7;
    
            const mealDate = new Date();
            mealDate.setDate(now.getDate() + dayDifference);
            
            if (plannedMeal.mealType === 'breakfast') mealDate.setHours(8, 0, 0, 0);
            else if (plannedMeal.mealType === 'lunch') mealDate.setHours(12, 30, 0, 0);
            else mealDate.setHours(19, 0, 0, 0);

            await addMealLogEntry({
                recipeTitle: plannedMeal.recipe.title,
                timestamp: mealDate.getTime(),
                recipe: plannedMeal.recipe,
            });
        }
    
        awardGoldenCarrots(15, "Plano da semana criado!");
        setIsSubmitting(false);
        setStep('hub');
    };
    
    const handleClose = () => setIsMealPlannerOpen(false);

    const handleUpdateMeal = async (updatedRecipe: Recipe) => {
        if (!editingMeal) return;
        await updateMealLogEntry(editingMeal.id, {
            recipe: updatedRecipe,
            recipeTitle: updatedRecipe.title,
        });
        setEditingMeal(null);
    };
    
    const handleSelectRecipe = (recipe: Recipe) => {
        setViewingRecipe(recipe);
        handleClose();
    };

    const renderContent = () => {
        switch(step) {
            case 'hub':
                return <HubScreen meals={futureMeals} onEdit={setEditingMeal} onRemove={deleteMealLogEntry} onPlanNew={() => setStep('entry')} />;
            case 'entry':
                return <PlanEntrySheet onSelect={handlePlanTypeSelect} />;
            case 'context':
                return <WeeklyContextScreen onNext={(data) => { setRequest(r => ({...r, ...data})); setStep('finetuning'); }} onSkip={() => handleGeneratePlan({})} initialData={request} />;
            case 'finetuning':
                return <WeeklyFineTuningScreen onGenerate={handleGeneratePlan} onBack={() => setStep('context')} pantry={pantry} />;
            case 'loading':
                return <div className="text-center p-8"><LoaderCircle className="h-10 w-10 animate-spin text-brand-primary mx-auto" /><p className="mt-2 text-brand-text-secondary">Gerando plano...</p></div>;
            case 'overview':
                return <WeeklyPlanOverviewScreen plan={plan} onConfirm={handleConfirmPlan} onRegenerate={() => handleGeneratePlan(request)} onSelectRecipe={handleSelectRecipe}/>
            default:
                 return <HubScreen meals={futureMeals} onEdit={setEditingMeal} onRemove={deleteMealLogEntry} onPlanNew={() => setStep('entry')} />;
        }
    };
    
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    return ReactDOM.createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={handleClose}>
                <div 
                    className="bg-brand-background rounded-t-2xl shadow-lg w-full max-h-[95vh] flex flex-col animate-slide-in-up"
                    onClick={e => e.stopPropagation()}
                >
                    <header className="p-4 border-b border-brand-border flex items-center justify-between flex-shrink-0">
                        <h2 className="text-lg font-bold text-brand-text flex items-center gap-2"><Sparkles className="text-brand-primary"/> Planejador Semanal</h2>
                        <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20}/></button>
                    </header>

                    <main className="flex-1 overflow-y-auto p-4">
                        {renderContent()}
                    </main>
                </div>
            </div>
            {editingMeal && editingMeal.recipe && (
                <EditableRecipeModal
                    recipe={editingMeal.recipe}
                    onClose={() => setEditingMeal(null)}
                    onUpdate={handleUpdateMeal}
                />
            )}
        </>,
        modalRoot
    );
};

export default MealPlannerModal;
