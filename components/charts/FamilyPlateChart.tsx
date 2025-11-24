
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { Leaf, Wheat, Drumstick, Info } from 'lucide-react';

const FamilyPlateChart: React.FC = () => {
    const context = useContext(AppContext);

    // Calcular o progresso do dia baseado no Meal Log
    const dailyStats = useMemo(() => {
        const stats = { 
            proteins: { current: 0, target: 2, label: 'Proteínas', color: '#3B82F6', bg: 'bg-blue-500', text: 'text-blue-600' }, // Blue
            grains: { current: 0, target: 2, label: 'Carboidratos', color: '#F59E0B', bg: 'bg-orange-500', text: 'text-orange-600' }, // Orange
            vegetables: { current: 0, target: 3, label: 'Vegetais/Frutas', color: '#10B981', bg: 'bg-green-500', text: 'text-green-600' } // Green
        };

        if (!context || !context.mealLog) return stats;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfToday = today.getTime();

        context.mealLog
            .filter(log => log.timestamp >= startOfToday)
            .forEach(log => {
                if (log.foodGroupPortions) {
                    stats.proteins.current += log.foodGroupPortions.proteins || 0;
                    stats.grains.current += log.foodGroupPortions.grains || 0;
                    stats.vegetables.current += log.foodGroupPortions.vegetables || 0;
                }
            });

        return stats;
    }, [context?.mealLog]);

    // Helper para calcular o dasharray do SVG (círculo progressivo)
    const calculateStroke = (current: number, target: number, circumference: number) => {
        const percentage = Math.min(current / target, 1);
        return `${percentage * circumference} ${circumference}`;
    };

    // Definições geométricas do prato
    const size = 180;
    const center = size / 2;
    const radius = 80;
    
    // Segmentos do prato (simulando divisões reais)
    // Vegetais: Metade do prato (180 graus)
    // Proteínas: 1/4 (90 graus)
    // Carboidratos: 1/4 (90 graus)

    return (
        <div className="bg-white p-6 rounded-3xl shadow-edu border border-gray-100 flex flex-col items-center relative overflow-hidden">
            <div className="w-full flex justify-between items-start mb-4 px-2">
                <div>
                    <h3 className="text-lg font-bold text-brand-text">Prato do Dia</h3>
                    <p className="text-xs text-brand-text-secondary">Meta nutricional diária da família</p>
                </div>
                <div className="bg-brand-primary/10 p-2 rounded-full">
                    <Info size={16} className="text-brand-primary" />
                </div>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center mb-4">
                {/* O Prato (Container) */}
                <div className="absolute inset-0 rounded-full border-4 border-gray-100 bg-gray-50/50"></div>
                
                {/* Visualização Abstrata das Porções */}
                <div className="relative w-full h-full p-4 grid grid-cols-2 grid-rows-2 gap-1">
                    {/* Vegetais (Ocupa a metade esquerda inteira visualmente no conceito, mas aqui faremos setores) */}
                    
                    {/* Metade Esquerda: Vegetais */}
                    <div className="row-span-2 bg-white rounded-l-full border-r border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div 
                            className="absolute bottom-0 left-0 right-0 bg-green-100 transition-all duration-1000 ease-out"
                            style={{ height: `${Math.min((dailyStats.vegetables.current / dailyStats.vegetables.target) * 100, 100)}%` }}
                        />
                        <div className="relative z-10 text-center">
                            <Leaf className="mx-auto text-green-600 mb-1" size={24} />
                            <span className="text-xs font-bold text-green-800">{dailyStats.vegetables.current}/{dailyStats.vegetables.target}</span>
                            <span className="text-[10px] text-green-700 block">Vegetais</span>
                        </div>
                    </div>

                    {/* Quarto Superior Direito: Proteínas */}
                    <div className="bg-white rounded-tr-[4rem] border-b border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
                         <div 
                            className="absolute bottom-0 left-0 right-0 bg-blue-100 transition-all duration-1000 ease-out"
                            style={{ height: `${Math.min((dailyStats.proteins.current / dailyStats.proteins.target) * 100, 100)}%` }}
                        />
                        <div className="relative z-10 text-center">
                            <Drumstick className="mx-auto text-blue-600 mb-1" size={20} />
                            <span className="text-xs font-bold text-blue-800">{dailyStats.proteins.current}/{dailyStats.proteins.target}</span>
                            <span className="text-[10px] text-blue-700 block">Proteínas</span>
                        </div>
                    </div>

                    {/* Quarto Inferior Direito: Carboidratos */}
                    <div className="bg-white rounded-br-[4rem] flex flex-col items-center justify-center relative overflow-hidden">
                        <div 
                            className="absolute bottom-0 left-0 right-0 bg-orange-100 transition-all duration-1000 ease-out"
                            style={{ height: `${Math.min((dailyStats.grains.current / dailyStats.grains.target) * 100, 100)}%` }}
                        />
                        <div className="relative z-10 text-center">
                            <Wheat className="mx-auto text-orange-600 mb-1" size={20} />
                            <span className="text-xs font-bold text-orange-800">{dailyStats.grains.current}/{dailyStats.grains.target}</span>
                            <span className="text-[10px] text-orange-700 block">Carboidratos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legenda / Status */}
            <div className="w-full grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 p-2 rounded-xl">
                    <p className="text-[10px] text-green-800 font-bold">Vegetais</p>
                    <div className="w-full bg-green-200 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${Math.min((dailyStats.vegetables.current / dailyStats.vegetables.target) * 100, 100)}%` }}></div>
                    </div>
                </div>
                <div className="bg-blue-50 p-2 rounded-xl">
                    <p className="text-[10px] text-blue-800 font-bold">Proteínas</p>
                    <div className="w-full bg-blue-200 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${Math.min((dailyStats.proteins.current / dailyStats.proteins.target) * 100, 100)}%` }}></div>
                    </div>
                </div>
                <div className="bg-orange-50 p-2 rounded-xl">
                    <p className="text-[10px] text-orange-800 font-bold">Carbo</p>
                    <div className="w-full bg-orange-200 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div className="bg-orange-500 h-full" style={{ width: `${Math.min((dailyStats.grains.current / dailyStats.grains.target) * 100, 100)}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilyPlateChart;
