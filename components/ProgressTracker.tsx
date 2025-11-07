import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ALL_MISSIONS, ACHIEVEMENTS } from '../constants/missions';
import { Target, Medal, Check, Carrot } from 'lucide-react';

const MissionCard: React.FC<{ type: 'daily' | 'weekly' }> = ({ type }) => {
    const context = useContext(AppContext);
    if (!context || !context.userProfile) return null;

    const missionProgress = type === 'daily' ? context.userProfile.dailyMission : context.userProfile.weeklyMission;
    const missionDef = ALL_MISSIONS.find(m => m.id === missionProgress.id);

    if (!missionDef) return <p>Carregando missão...</p>;

    const progress = missionDef.getCurrentProgress(context);
    const percentage = Math.min((progress / missionDef.goal) * 100, 100);
    const isCompleted = missionProgress.completed;
    const canClaim = percentage >= 100 && !isCompleted;

    const handleClaim = () => {
        if (canClaim) {
            context.claimMissionReward(type);
        }
    };
    
    return (
        <div className={`bg-brand-surface p-4 rounded-2xl shadow-edu transition-all ${isCompleted ? 'opacity-70' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-brand-text">{missionDef.title}</p>
                    <p className="text-sm text-brand-text-secondary">{missionDef.description}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-brand-text-secondary">{progress} / {missionDef.goal}</p>
                </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden my-3">
                <div className={`h-full rounded-full transition-all duration-500 ${percentage >= 100 ? 'bg-green-500' : 'bg-brand-primary'}`} style={{ width: `${percentage}%` }} />
            </div>

            {isCompleted ? (
                <button disabled className="w-full flex items-center justify-center gap-2 bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                    <Check size={16}/> Recompensa Coletada
                </button>
            ) : (
                <button onClick={handleClaim} disabled={!canClaim} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 transition-colors hover:bg-brand-dark">
                    <Carrot size={16}/> Coletar {missionDef.reward} Cenouras
                </button>
            )}
        </div>
    );
};

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
                <h3 className="text-xl font-semibold text-brand-text mb-3 flex items-center"><Target className="mr-3 text-brand-primary"/> Missões</h3>
                <div className="space-y-4">
                    <div>
                        <p className="font-semibold text-brand-text-secondary text-sm mb-1">Diária</p>
                        <MissionCard type="daily" />
                    </div>
                    <div>
                        <p className="font-semibold text-brand-text-secondary text-sm mb-1">Semanal</p>
                        <MissionCard type="weekly" />
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-brand-text mb-3 flex items-center"><Medal className="mr-3 text-brand-primary"/> Conquistas</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {ACHIEVEMENTS.map(ach => {
                        const unlocked = ach.isUnlocked(context);
                        return (
                            <div key={ach.id} className="relative group">
                                <div className={`p-4 rounded-2xl text-center transition-all duration-300 flex flex-col items-center justify-center aspect-square ${unlocked ? 'bg-green-100/50 shadow-edu' : 'bg-gray-100'}`}>
                                    <div className={`p-3 rounded-full mb-2 ${unlocked ? 'bg-brand-primary' : 'bg-gray-300'}`}>
                                        <ach.icon className={`h-8 w-8 transition-colors ${unlocked ? 'text-white' : 'text-gray-500'}`} />
                                    </div>
                                    <p className={`font-bold text-sm ${unlocked ? 'text-green-900' : 'text-brand-text-secondary'}`}>{ach.title}</p>
                                </div>
                                {!unlocked && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-brand-text text-white text-xs text-center rounded-lg py-1.5 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                                        {ach.description}
                                        <svg className="absolute text-brand-text h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ProgressTracker;