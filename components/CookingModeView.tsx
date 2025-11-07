
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { X, ArrowLeft, ArrowRight, Play, Pause, RotateCcw, Sparkles, ChefHat, Heart, Baby, Shield, Utensils, ThumbsUp, Meh, Frown } from 'lucide-react';
import type { RecipeStep, MealFeedback } from '../../types';

const CookingModeView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context || !context.cookingRecipe) return null;

    const { cookingRecipe: recipe, logMealCompletion, setCookingRecipe, setIsCookingMode } = context;

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    const currentStep: RecipeStep | null = recipe.steps[currentStepIndex];
    const isLastStep = currentStepIndex === recipe.steps.length - 1;
    const isFinished = currentStepIndex >= recipe.steps.length;

    useEffect(() => {
        if (currentStep) {
            setTimeLeft(currentStep.time_min * 60);
            setIsTimerActive(false);
        }
    }, [currentStep]);

    useEffect(() => {
        if (!isTimerActive || timeLeft <= 0) {
            if (timeLeft <= 0 && isTimerActive) {
                // Optional: auto-play a sound or vibrate
            }
            return;
        }
        const intervalId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isTimerActive, timeLeft]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleNext = () => {
        setCurrentStepIndex(prev => prev + 1);
    };

    const handlePrev = () => {
        setCurrentStepIndex(prev => Math.max(0, prev - 1));
    };

    const handleClose = () => {
        setCookingRecipe(null);
        setIsCookingMode(false);
    };
    
    const handleResetTimer = () => {
        if (currentStep) {
            setTimeLeft(currentStep.time_min * 60);
            setIsTimerActive(false);
        }
    };
    
    const handleFeedback = async (feedback: MealFeedback) => {
        if (feedbackGiven) return;
        setFeedbackGiven(true);
        await logMealCompletion(recipe, feedback);
        // The logMealCompletion function will handle closing the view
    };

    const renderStepContent = () => {
        if (!currentStep) return null;
        
        const tips = [
            { icon: Utensils, text: currentStep.utensil, color: 'text-gray-600', bg: 'bg-gray-100' },
            { icon: Heart, text: currentStep.tip, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Baby, text: currentStep.child_friendly, color: 'text-green-600', bg: 'bg-green-50' },
            { icon: Shield, text: currentStep.safety, color: 'text-red-600', bg: 'bg-red-50' },
        ].filter(tip => tip.text);

        return (
            <>
                <div className="text-center mb-4">
                    <p className="text-sm text-brand-text-secondary">Passo {currentStep.order} de {recipe.steps.length}</p>
                    <h2 className="text-xl font-bold text-brand-text mt-1">{currentStep.title}</h2>
                </div>

                <div className="bg-brand-surface rounded-xl p-4 text-center shadow-edu mb-4">
                    <p className="text-base font-medium">{currentStep.instruction}</p>
                </div>

                {/* Timer */}
                <div className="bg-brand-surface rounded-xl p-3 flex items-center justify-between shadow-edu mb-4">
                    <div className="font-mono text-3xl font-bold text-brand-text">{formatTime(timeLeft)}</div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsTimerActive(!isTimerActive)} className="p-2.5 bg-brand-primary text-white rounded-full shadow-lg">
                            {isTimerActive ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button onClick={handleResetTimer} className="p-2.5 bg-gray-200 text-brand-text-secondary rounded-full">
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>
                
                 {/* Tips Section */}
                {tips.length > 0 && (
                    <div className="space-y-2">
                        {tips.map((tip, index) => (
                            <div key={index} className={`p-2.5 rounded-lg flex items-start gap-2.5 ${tip.bg}`}>
                                <tip.icon size={18} className={`flex-shrink-0 mt-0.5 ${tip.color}`} />
                                <p className={`text-sm font-medium ${tip.color}`}>{tip.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    };

    const renderFinishScreen = () => (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-brand-text mb-2">Prato Pronto!</h2>
            <ChefHat size={48} className="text-brand-primary mx-auto mb-4" />
            
            <div className="bg-brand-surface rounded-xl p-4 shadow-edu mb-4">
                <h3 className="font-bold text-base mb-2 flex items-center justify-center"><Sparkles className="mr-2 text-brand-primary" size={18}/>Finalização</h3>
                {recipe.presentation_suggestion && <p className="text-sm mb-1"><strong>Apresentação:</strong> {recipe.presentation_suggestion}</p>}
                <p className="text-sm"><strong>Armazenamento:</strong> {recipe.storage}</p>
            </div>

            <div className="bg-brand-surface rounded-xl p-4 shadow-edu">
                <h3 className="font-bold text-base mb-1">A criança comeu bem?</h3>
                 <p className="text-xs text-brand-text-secondary mb-3">Sua resposta ajuda a personalizar sugestões e atualiza sua despensa!</p>
                <div className="flex justify-around">
                     <button onClick={() => handleFeedback('disliked')} disabled={feedbackGiven} className="flex flex-col items-center gap-1.5 text-brand-text-secondary hover:text-red-600 transition-colors disabled:opacity-50">
                        <div className="p-3 bg-gray-100 rounded-full"><Frown size={24}/></div>
                        <span className="text-xs font-semibold">Não quis</span>
                    </button>
                    <button onClick={() => handleFeedback('ok')} disabled={feedbackGiven} className="flex flex-col items-center gap-1.5 text-brand-text-secondary hover:text-yellow-600 transition-colors disabled:opacity-50">
                        <div className="p-3 bg-gray-100 rounded-full"><Meh size={24}/></div>
                        <span className="text-xs font-semibold">Comeu um pouco</span>
                    </button>
                    <button onClick={() => handleFeedback('liked')} disabled={feedbackGiven} className="flex flex-col items-center gap-1.5 text-brand-text-secondary hover:text-brand-primary transition-colors disabled:opacity-50">
                        <div className="p-3 bg-gray-100 rounded-full"><ThumbsUp size={24}/></div>
                        <span className="text-xs font-semibold">Aprovou!</span>
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-brand-background z-40 flex flex-col">
            <header className="p-3 flex items-center justify-between border-b border-brand-border flex-shrink-0">
                <div className="w-8">
                   {!isFinished && currentStepIndex > 0 && (
                        <button onClick={handlePrev} className="p-1.5 rounded-full hover:bg-gray-100">
                            <ArrowLeft size={20} />
                        </button>
                   )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-brand-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${((currentStepIndex + 1) / (recipe.steps.length + 1)) * 100}%` }}></div>
                </div>
                <div className="w-8 flex justify-end">
                    <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4">
                {isFinished ? renderFinishScreen() : renderStepContent()}
            </main>

            {!isFinished && (
                <footer className="p-3 border-t border-brand-border bg-brand-surface/80 backdrop-blur-sm flex-shrink-0">
                    <button 
                        onClick={handleNext}
                        className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-base shadow-lg transition-colors hover:bg-brand-dark"
                    >
                        {isLastStep ? 'Finalizar Prato' : 'Próximo Passo'}
                        <ArrowRight className="ml-2" size={20} />
                    </button>
                </footer>
            )}
        </div>
    );
};

export default CookingModeView;