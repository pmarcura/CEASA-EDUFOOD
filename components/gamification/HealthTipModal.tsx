
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { PantryItem } from '../../types';
import { X, Globe, ThumbsUp, AlertTriangle, ClipboardList, BadgeCheck, Info, Sparkles, LoaderCircle, MessageCircle, MapPin, Scale } from 'lucide-react';
import { generateFoodStory } from '../../services/geminiService';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';
import FoodIcon from '../FoodIcon';
import { toTitleCase } from '../../utils/formatters';

interface HealthTipModalProps {
  item: PantryItem;
  onClose: () => void;
}

const HealthTipModal: React.FC<HealthTipModalProps> = ({ item, onClose }) => {
  const { nutritionalInfo, novaClassification } = item;
  const [story, setStory] = useState<string | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(true);
  const [activeTab, setActiveTab] = useState<'strategy' | 'facts'>('strategy');

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

  const novaInfo = NOVA_CLASSIFICATION[novaClassification];
  
  // Determine header colors based on NOVA
  const headerColors = {
      'in_natura': 'bg-green-100 text-green-800 border-green-200',
      'culinary_ingredients': 'bg-blue-100 text-blue-800 border-blue-200',
      'processed': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ultra_processed': 'bg-red-100 text-red-800 border-red-200',
  }[novaClassification];

  const renderStrategyTab = () => (
      <div className="space-y-4 animate-fade-in">
          {/* Argumento Lúdico */}
          <div className="bg-white border border-brand-primary/20 p-5 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-primary"></div>
              <div className="flex items-center gap-2.5 mb-3">
                  <div className="bg-brand-primary/10 p-2 rounded-full">
                      <MessageCircle size={20} className="text-brand-primary" />
                  </div>
                  <h4 className="font-bold text-lg text-brand-text">O Segredo para os Pais</h4>
              </div>
              
              {isLoadingStory ? (
                  <div className="flex flex-col items-center justify-center py-6 text-brand-text-secondary">
                      <LoaderCircle size={28} className="animate-spin mb-2 text-brand-primary" />
                      <p className="text-xs">Criando argumento...</p>
                  </div>
              ) : (
                  <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-brand-text leading-relaxed font-medium italic">
                          "{story}"
                      </p>
                  </div>
              )}
          </div>

          {/* Benefícios e Riscos */}
          <div className="grid grid-cols-1 gap-3">
              {nutritionalInfo.benefits && nutritionalInfo.benefits.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                      <h5 className="flex items-center gap-2 font-bold text-green-800 mb-2 text-sm">
                          <ThumbsUp size={16} /> Pontos Fortes
                      </h5>
                      <ul className="space-y-1.5">
                          {nutritionalInfo.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-green-700 leading-tight">
                                  <span className="mt-1.5 w-1 h-1 bg-green-500 rounded-full flex-shrink-0"></span>
                                  {benefit}
                              </li>
                          ))}
                      </ul>
                  </div>
              )}

              {nutritionalInfo.risks && nutritionalInfo.risks.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                      <h5 className="flex items-center gap-2 font-bold text-red-800 mb-2 text-sm">
                          <AlertTriangle size={16} /> Atenção
                      </h5>
                      <ul className="space-y-1.5">
                          {nutritionalInfo.risks.map((risk, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-red-700 leading-tight">
                                  <span className="mt-1.5 w-1 h-1 bg-red-500 rounded-full flex-shrink-0"></span>
                                  {risk}
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
          </div>
      </div>
  );

  const renderFactsTab = () => (
      <div className="space-y-4 animate-fade-in">
          {/* Origem */}
          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 relative">
              <div className="flex items-center gap-2 mb-2 text-indigo-800">
                  <MapPin size={18} />
                  <h4 className="font-bold text-sm uppercase tracking-wide">Origem & Processo</h4>
              </div>
              <p className="text-sm text-indigo-900 leading-relaxed">
                  {nutritionalInfo.origin || "Informação de origem não disponível."}
              </p>
              <Globe className="absolute top-4 right-4 text-indigo-200" size={40} strokeWidth={1} />
          </div>

          {/* Nutrition Facts Label Style */}
          <div className="border-2 border-gray-800 p-4 rounded-xl bg-white">
              <h4 className="font-black text-xl border-b-4 border-gray-800 pb-1 mb-2">Fatos Nutricionais</h4>
              <div className="flex justify-between items-baseline mb-2 border-b border-gray-300 pb-2">
                  <span className="font-bold text-sm">Porção de referência</span>
                  <span className="text-xs text-gray-600">Usual</span>
              </div>
              
              <div className="py-2 text-sm text-gray-800 font-mono bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                  {nutritionalInfo.nutritionFacts || "Dados nutricionais detalhados indisponíveis."}
              </div>
              
              <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
                  <Scale size={12} />
                  <span>Os valores podem variar por marca.</span>
              </div>
          </div>
          
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-medium">
                          #{tag}
                      </span>
                  ))}
              </div>
          )}
      </div>
  );

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
        <div 
            className="bg-brand-surface rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] animate-pop overflow-hidden"
            onClick={e => e.stopPropagation()}
        >
            {/* Header Hero */}
            <div className={`p-6 pb-8 ${headerColors} relative`}>
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-700"
                >
                    <X size={20}/>
                </button>
                
                <div className="flex flex-col items-center text-center">
                    <div className="bg-white p-3 rounded-2xl shadow-lg mb-3 transform hover:scale-110 transition-transform duration-300">
                        <FoodIcon name={item.name} icon={item.icon} size="lg" />
                    </div>
                    <h2 className="text-2xl font-display font-bold leading-tight mb-1">
                        {toTitleCase(item.name)}
                    </h2>
                    <span className="text-xs font-bold uppercase tracking-wider bg-white/60 px-3 py-1 rounded-full border border-white/20">
                        {novaInfo.label}
                    </span>
                </div>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-white px-4">
                <button 
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'strategy' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    onClick={() => setActiveTab('strategy')}
                >
                    Estratégia
                </button>
                <button 
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'facts' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    onClick={() => setActiveTab('facts')}
                >
                    Fatos & Nutrição
                </button>
            </div>
            
            <main className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
               {!nutritionalInfo ? (
                    <div className="text-center p-8 flex flex-col items-center justify-center h-full opacity-60">
                        <Info size={48} className="text-gray-300 mb-4" />
                        <h4 className="font-bold text-lg text-brand-text">Sem dados detalhados</h4>
                        <p className="text-sm text-brand-text-secondary mt-2">
                            Edite este item na despensa para que o Professor Nutri possa analisá-lo novamente.
                        </p>
                    </div>
                ) : (
                    activeTab === 'strategy' ? renderStrategyTab() : renderFactsTab()
                )}
            </main>
            
            <footer className="p-4 bg-white border-t border-gray-100 flex-shrink-0 text-center">
                 <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-brand-text-secondary uppercase tracking-wide">
                    <BadgeCheck size={14} className="text-brand-primary" />
                    <span>Conteúdo verificado pela IA Nutri</span>
                </div>
            </footer>
        </div>
    </div>,
    modalRoot
  );
};

export default HealthTipModal;
