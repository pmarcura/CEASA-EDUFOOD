import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { PantryItem } from '../../types';
import { X, Globe, ThumbsUp, AlertTriangle, ClipboardList, BadgeCheck, Info, Sparkles, LoaderCircle } from 'lucide-react';
import { generateFoodStory } from '../../services/geminiService';

interface HealthTipModalProps {
  item: PantryItem;
  onClose: () => void;
}

const InfoCard: React.FC<{ icon: React.ElementType, title: string, colorClass: string, children: React.ReactNode }> = ({ icon: Icon, title, colorClass, children }) => (
    <div className="bg-brand-background p-3 rounded-xl border border-brand-border">
        <div className="flex items-center gap-2.5 mb-2">
            <div className={`p-1.5 rounded-full ${colorClass.replace('text-', 'bg-')}/10`}>
              <Icon size={18} className={colorClass} />
            </div>
            <h4 className={`font-bold text-base ${colorClass}`}>{title}</h4>
        </div>
        <div className="pl-3 text-brand-text-secondary text-sm space-y-1">
            {children}
        </div>
    </div>
);

const HealthTipModal: React.FC<HealthTipModalProps> = ({ item, onClose }) => {
  const { nutritionalInfo } = item;
  const [story, setStory] = useState<string | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(true);

  useEffect(() => {
    if (item.nutritionalInfo) {
      const fetchStory = async () => {
        setIsLoadingStory(true);
        try {
          const generatedStory = await generateFoodStory(item);
          setStory(generatedStory);
        } catch (e) {
          console.error("Failed to generate story", e);
          setStory("Não foi possível carregar a história no momento. Tente novamente mais tarde.");
        } finally {
          setIsLoadingStory(false);
        }
      };
      fetchStory();
    } else {
      setIsLoadingStory(false);
    }
  }, [item]);
  
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
        <div 
            className="bg-brand-surface rounded-2xl shadow-lg w-full max-w-sm flex flex-col max-h-[90vh] animate-slide-in-up"
            onClick={e => e.stopPropagation()}
        >
            <header className="p-4 border-b border-brand-border flex-shrink-0">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-brand-text capitalize">Detalhes: {item.name}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20}/></button>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
               {!nutritionalInfo ? (
                    <div className="text-center p-6 flex flex-col items-center justify-center h-full">
                        <Info size={40} className="text-brand-primary mx-auto mb-4" />
                        <h4 className="font-bold text-lg text-brand-text">Informações Antigas</h4>
                        <p className="text-sm text-brand-text-secondary mt-2">
                            Para ver os novos detalhes, edite o nome deste item na sua despensa e salve. O Professor Nutri irá analisá-lo novamente!
                        </p>
                    </div>
                ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={18} className="text-blue-600" />
                              <h4 className="font-bold text-base text-blue-800">Conte para a Criança</h4>
                          </div>
                          {isLoadingStory ? (
                             <div className="flex items-center justify-center py-4">
                               <LoaderCircle size={24} className="animate-spin text-blue-600" />
                             </div>
                          ) : (
                             <p className="text-sm text-blue-900 leading-relaxed">{story}</p>
                          )}
                      </div>

                      {nutritionalInfo.benefits && nutritionalInfo.benefits.length > 0 && (
                          <InfoCard icon={ThumbsUp} title="Por que faz bem?" colorClass="text-brand-primary">
                              <ul className="list-disc list-inside">
                                  {nutritionalInfo.benefits.map((benefit, i) => <li key={i}>{benefit}</li>)}
                              </ul>
                          </InfoCard>
                      )}
                       {nutritionalInfo.risks && nutritionalInfo.risks.length > 0 && (
                          <InfoCard icon={AlertTriangle} title="Pontos de Atenção" colorClass="text-brand-risk-medium">
                              <ul className="list-disc list-inside">
                                  {nutritionalInfo.risks.map((risk, i) => <li key={i}>{risk}</li>)}
                              </ul>
                          </InfoCard>
                      )}
                       {nutritionalInfo.origin && (
                          <InfoCard icon={Globe} title="Origem" colorClass="text-indigo-500">
                              <p>{nutritionalInfo.origin}</p>
                          </InfoCard>
                      )}
                       {nutritionalInfo.nutritionFacts && (
                          <InfoCard icon={ClipboardList} title="Resumo Nutricional" colorClass="text-purple-500">
                              <p>{nutritionalInfo.nutritionFacts}</p>
                          </InfoCard>
                      )}
                    </>
                )}
            </main>
            
            <footer className="p-3 bg-gray-50 border-t border-brand-border rounded-b-2xl flex-shrink-0">
                 <div className="flex items-center justify-center gap-2 text-xs text-brand-text-secondary">
                    <BadgeCheck size={16} className="text-brand-primary" />
                    <span>Informações validadas pelo Professor Nutri</span>
                </div>
            </footer>
        </div>
    </div>,
    modalRoot
  );
};

export default HealthTipModal;