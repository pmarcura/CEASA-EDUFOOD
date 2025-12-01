
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { PantryItem } from '../../types';
import { X, LoaderCircle, BookOpen, ShoppingBag, ThermometerSnowflake, Clock, Star, BadgeCheck, Info } from 'lucide-react';
import { generateFoodStory, FoodStrategyContent } from '../../services/geminiService';
import { NOVA_CLASSIFICATION } from '../../constants/foodClassifications';
import FoodIcon from '../FoodIcon';
import { toTitleCase } from '../../utils/formatters';

interface HealthTipModalProps {
  item: PantryItem;
  onClose: () => void;
}

const HealthTipModal: React.FC<HealthTipModalProps> = ({ item, onClose }) => {
  const { novaClassification } = item;
  const [strategyContent, setStrategyContent] = useState<FoodStrategyContent | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(true);

  useEffect(() => {
    const fetchStory = async () => {
        setIsLoadingStory(true);
        try {
            const content = await generateFoodStory(item);
            setStrategyContent(content);
        } catch (e) {
            console.error("Failed to generate story", e);
        } finally {
            setIsLoadingStory(false);
        }
    };
    fetchStory();
  }, [item]);
  
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  // SAFETY CHECK: Ensure we have a valid key, default to 'processed' if missing/invalid
  const classification = (novaClassification && NOVA_CLASSIFICATION[novaClassification]) 
    ? novaClassification 
    : 'processed';
    
  const novaInfo = NOVA_CLASSIFICATION[classification] || NOVA_CLASSIFICATION['processed'];
  
  const headerColors = {
      'in_natura': 'bg-green-100 text-green-800 border-green-200',
      'culinary_ingredients': 'bg-blue-100 text-blue-800 border-blue-200',
      'processed': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ultra_processed': 'bg-red-100 text-red-800 border-red-200',
  }[classification] || 'bg-gray-100 text-gray-800 border-gray-200';

  const renderContent = () => {
      if (isLoadingStory) {
          return (
              <div className="flex flex-col items-center justify-center py-12 text-brand-text-secondary">
                  <LoaderCircle size={32} className="animate-spin mb-3 text-brand-primary" />
                  <p className="text-sm font-medium">Consultando o Professor Nutri...</p>
              </div>
          );
      }

      if (!strategyContent) {
           return (
              <div className="text-center py-8 px-4">
                  <p className="text-sm text-brand-text-secondary">Não foi possível carregar as dicas no momento. Tente novamente mais tarde.</p>
              </div>
          );
      }

      return (
      <div className="space-y-5 animate-fade-in pb-4">
          
          {/* 1. O Segredo Parental (Hero Section) */}
          <div className="bg-gradient-to-br from-brand-primary to-teal-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              
              <div className="flex items-start gap-3 relative z-10">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                      <Star size={24} className="text-yellow-300 fill-yellow-300" />
                  </div>
                  <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-white/80 mb-1">O Segredo para os Pais</h4>
                      <p className="font-bold text-lg leading-snug">
                          "{strategyContent.parentalSecret}"
                      </p>
                  </div>
              </div>
          </div>

          {/* 2. A Curiosidade Educativa para Criança */}
          <div className="bg-white border-l-4 border-blue-400 p-4 rounded-r-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                  <BookOpen size={18} />
                  <h4 className="font-bold text-sm">Conte para eles:</h4>
              </div>
              <p className="text-brand-text text-sm leading-relaxed italic">
                  "{strategyContent.story}"
              </p>
          </div>

          {/* 3. Grid de Dicas Práticas */}
          <div className="grid grid-cols-1 gap-3">
              {/* Compra */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm text-orange-500">
                      <ShoppingBag size={18} />
                  </div>
                  <div>
                      <h5 className="font-bold text-xs text-gray-500 uppercase mb-0.5">Como Escolher</h5>
                      <p className="text-sm text-gray-700 font-medium leading-tight">{strategyContent.buyingTip}</p>
                  </div>
              </div>

              {/* Armazenamento */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm text-blue-500">
                      <ThermometerSnowflake size={18} />
                  </div>
                  <div>
                      <h5 className="font-bold text-xs text-gray-500 uppercase mb-0.5">Como Guardar</h5>
                      <p className="text-sm text-gray-700 font-medium leading-tight">{strategyContent.storageTip}</p>
                  </div>
              </div>

              {/* Consumo */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-start gap-3">
                  <div className="bg-white p-2 rounded-full shadow-sm text-green-500">
                      <Clock size={18} />
                  </div>
                  <div>
                      <h5 className="font-bold text-xs text-gray-500 uppercase mb-0.5">Ponto Ideal</h5>
                      <p className="text-sm text-gray-700 font-medium leading-tight">{strategyContent.peakState}</p>
                  </div>
              </div>
          </div>
      </div>
  )};

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
            
            <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-center">
                 <h3 className="font-bold text-brand-primary flex items-center gap-2">
                    <Star size={18} className="fill-current" /> Estratégia Parental
                 </h3>
            </div>
            
            <main className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
                {renderContent()}
            </main>
            
            <footer className="p-4 bg-white border-t border-gray-100 flex-shrink-0 text-center">
                 <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-brand-text-secondary uppercase tracking-wide">
                    <BadgeCheck size={14} className="text-brand-primary" />
                    <span>Verificado pela IA Nutri</span>
                </div>
            </footer>
        </div>
    </div>,
    modalRoot
  );
};

export default HealthTipModal;
