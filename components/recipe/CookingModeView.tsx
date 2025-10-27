
import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { X, ArrowLeft, ArrowRight, Play, Pause, RotateCcw, Sparkles, ChefHat, Heart, Baby, Shield, Utensils, ThumbsUp, Meh, Frown, Camera, UploadCloud, LoaderCircle } from 'lucide-react';
import type { RecipeStep, MealFeedback } from '../../types';

const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const CookingModeView: React.FC = () => {
    const context = useContext(AppContext);
    if (!context || !context.cookingRecipe) return null;

    const { cookingRecipe: recipe, logMealCompletion, setCookingRecipe, setIsCookingMode } = context;

    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [viewState, setViewState] = useState<'cooking' | 'feedback' | 'photo_upload' | 'submitting'>('cooking');
    const [selectedFeedback, setSelectedFeedback] = useState<MealFeedback | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);


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
        if (isFinished && viewState === 'cooking') {
            setViewState('feedback');
        }
    }, [isFinished, viewState]);

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
    
    const handleFeedbackSelect = (feedback: MealFeedback) => {
        setSelectedFeedback(feedback);
        setViewState('photo_upload');
    };
    
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageDataUrl = await fileToDataURL(file);
            setUploadedImage(imageDataUrl);
        }
    };
    
    const handleFinishFlow = async () => {
        if (!selectedFeedback) return;
        setViewState('submitting');
        await logMealCompletion(recipe, selectedFeedback, uploadedImage ?? undefined);
        // logMealCompletion will close the view
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

    const renderFinishScreen = () => {
        if (viewState === 'submitting') {
             return (
                <div className="text-center flex flex-col items-center justify-center h-full">
                    <LoaderCircle className="h-12 w-12 animate-spin text-brand-primary mb-4" />
                    <h2 className="text-xl font-bold text-brand-text">Registrando sua refeição...</h2>
                </div>
            );
        }

        if (viewState === 'photo_upload' && selectedFeedback) {
            return (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-brand-text mb-2">Ótimo trabalho!</h2>
                    <Sparkles size={48} className="text-yellow-500 mx-auto mb-4" />
                    <div className="bg-brand-surface rounded-xl p-4 shadow-edu mb-4">
                        <h3 className="font-bold text-base mb-2">Ganhe +15 pontos!</h3>
                        <p className="text-xs text-brand-text-secondary mb-3">Envie uma foto do prato para registrar sua conquista e inspirar outras famílias.</p>
                        
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-brand-border rounded-lg p-6 flex flex-col items-center justify-center text-brand-text-secondary hover:bg-gray-50 transition-colors"
                        >
                            {uploadedImage ? (
                                <img src={uploadedImage} alt="Prato pronto" className="w-24 h-24 object-cover rounded-lg mb-2" />
                            ) : (
                                <Camera size={32} className="mb-2" />
                            )}
                            <span className="text-sm font-semibold">{uploadedImage ? 'Trocar Foto' : 'Escolher Foto'}</span>
                        </button>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        <button onClick={handleFinishFlow} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-base shadow-lg transition-colors hover:bg-brand-dark">
                            <UploadCloud size={18} className="mr-2"/>
                            Concluir e Salvar
                        </button>
                        <button onClick={handleFinishFlow} className="text-sm text-brand-text-secondary font-semibold hover:underline">
                            Pular etapa da foto
                        </button>
                    </div>
                </div>
            );
        }

        // Default to feedback view
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-brand-text mb-2">Prato Pronto!</h2>
                <ChefHat size={48} className="text-brand-primary mx-auto mb-4" />
                <div className="bg-brand-surface rounded-xl p-4 shadow-edu">
                    <h3 className="font-bold text-base mb-1">A criança comeu bem?</h3>
                     <p className="text-xs text-brand-text-secondary mb-3">Sua resposta ajuda a personalizar sugestões e atualiza sua despensa!</p>
                    <div className="flex justify-around">
                         <button onClick={() => handleFeedbackSelect('disliked')} className="flex flex-col items-center gap-1.5 text-brand-text-secondary hover:text-red-600 transition-colors">
                            <div className="p-3 bg-gray-100 rounded-full"><Frown size={24}/></div>
                            <span className="text-xs font-semibold">Não quis</span>
                        </button>
                        <button onClick={() => handleFeedbackSelect('ok')} className="flex flex-col items-center gap-1.5 text-brand-text-secondary hover:text-yellow-600 transition-colors">
                            <div className="p-3 bg-gray-100 rounded-full"><Meh size={24}/></div>
                            <span className="text-xs font-semibold">Comeu um pouco</span>
                        </button>
                        <button onClick={() => handleFeedbackSelect('liked')} className="flex flex-col items-center gap-1.5 text-brand-text-secondary hover:text-brand-primary transition-colors">
                            <div className="p-3 bg-gray-100 rounded-full"><ThumbsUp size={24}/></div>
                            <span className="text-xs font-semibold">Aprovou!</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

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
                    <div 
                        className="bg-brand-primary h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(isFinished ? 1 : currentStepIndex / recipe.steps.length) * 100}%` }}
                    ></div>
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
