
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ALL_MISSIONS, ACHIEVEMENTS, DAILY_MISSIONS, WEEKLY_MISSIONS } from '../constants/missions';
import type { Mission, MissionProgress } from '../types';
import { Target, Medal, Check, Carrot, Trophy, Clock, Gift } from 'lucide-react';
import LeaderboardModal from './modals/LeaderboardModal';

const formatTimeLeft = (ms: number) => {
    if (ms <= 0) return 'Terminou';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 23) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${Math.floor(totalSeconds % 60)}s`;
    }
    return `${Math.floor(totalSeconds % 60)}s`;
};


interface MissionCardProps {
    missionProgress: MissionProgress;
    missionDef: Mission;
}

const MissionCard: React.FC<MissionCardProps> = ({ missionProgress, missionDef }) => {
    const context = useContext(AppContext);
    const [timeLeft, setTimeLeft] = useState('');

    const isCompleted = missionProgress.completed;

    useEffect(() => {
        if (isCompleted) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            let endDate: Date;

            if (missionDef.type === 'daily') {
                endDate = new Date(missionProgress.lastReset);
                endDate.setHours(23, 59, 59, 999);
            } else { // weekly
                endDate = new Date(missionProgress.lastReset);
                const dayOfWeek = endDate.getDay(); // Sunday = 0
                const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
                endDate.setDate(endDate.getDate() + daysUntilSaturday);
                endDate.setHours(23, 59, 59, 999);
            }

            const diff = endDate.getTime() - now.getTime();
            setTimeLeft(formatTimeLeft(diff));
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [missionDef, isCompleted, missionProgress.lastReset]);


    if (!context) return null;

    const progress = missionDef.getCurrentProgress(context);
    const percentage = Math.min((progress / missionDef.goal) * 100, 100);
    const canClaim = percentage >= 100 && !isCompleted;

    const handleClaim = () => {
        if (canClaim) {
            context.claimMissionReward(missionDef.id);
        }
    };
    
    return (
        <div className={`bg-brand-surface p-4 rounded-2xl shadow-edu transition-all ${isCompleted ? 'opacity-70' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-brand-text">{missionDef.title}</p>
                    <p className="text-sm text-brand-text-secondary">{missionDef.description}</p>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ml-2 ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-brand-text-secondary'}`}>
                    {isCompleted ? (
                        <>
                            <Check size={14} />
                            <span>Concluída</span>
                        </>
                    ) : (
                        <>
                            <Clock size={14} />
                            <span>{timeLeft}</span>
                        </>
                    )}
                </div>
            </div>
            
            <div className="text-right mt-2">
                <p className="text-sm font-bold text-brand-text-secondary">{Math.min(progress, missionDef.goal)} / {missionDef.goal}</p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden my-1.5">
                <div className={`h-full rounded-full transition-all duration-500 ${percentage >= 100 ? 'bg-green-500' : 'bg-brand-primary'}`} style={{ width: `${percentage}%` }} />
            </div>

            <div className="mt-3">
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
        </div>
    );
};

const ProgressTracker: React.FC = () => {
    const context = useContext(AppContext);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

    if (!context || !context.userProfile) return null;

    const { userProfile } = context;
    const { dailyMissions, weeklyMissions, goldenCarrots } = userProfile;
    
    const findMissionDef = (id: string, type: 'daily' | 'weekly') => {
        const source = type === 'daily' ? DAILY_MISSIONS : WEEKLY_MISSIONS;
        return source.find(m => m.id === id);
    };

    const nextCouponCost = 150; // Example cost
    const carrotsForNextCoupon = Math.max(0, nextCouponCost - goldenCarrots);
    const couponProgress = Math.min((goldenCarrots / nextCouponCost) * 100, 100);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-brand-text">Sua Jornada Saudável</h2>
                <p className="text-brand-text-secondary">Conquiste recompensas e acompanhe seu progresso!</p>
            </div>
            
            <div className="bg-brand-surface p-4 rounded-2xl shadow-edu">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-brand-text mb-1 flex items-center">
                        <Carrot className="mr-2 text-orange-500" /> Cenouras Douradas
                    </h3>
                    <span className="text-2xl font-bold text-orange-500">{goldenCarrots}</span>
                </div>
                 <div className="w-full bg-orange-100 rounded-full h-3 overflow-hidden my-2">
                    <div className="bg-gradient-to-r from-orange-300 to-orange-500 h-full rounded-full transition-all duration-500" style={{width: `${couponProgress}%`}}></div>
                </div>
                <p className="text-xs text-center text-brand-text-secondary font-semibold">
                    {carrotsForNextCoupon > 0 ? `Faltam ${carrotsForNextCoupon} cenouras para o próximo cupom!` : "Você pode resgatar um cupom!"}
                </p>
                <button 
                    // onClick={() => ...} // This will open the new Rewards Modal
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-yellow-400 text-yellow-900 font-bold py-2.5 px-4 rounded-lg transition-colors hover:bg-yellow-500"
                >
                    <Gift size={18}/> Resgatar Cupons
                </button>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-brand-text mb-3 flex items-center"><Target className="mr-3 text-brand-primary"/> Como Ganhar Cenouras</h3>
                <div className="space-y-4">
                    <div>
                        <p className="font-semibold text-brand-text-secondary text-sm mb-2">Missões Diárias</p>
                        <div className="space-y-3">
                            {dailyMissions.map(mProg => {
                                const mDef = findMissionDef(mProg.id, 'daily');
                                return mDef ? <MissionCard key={mProg.id} missionProgress={mProg} missionDef={mDef} /> : null;
                            })}
                        </div>
                    </div>
                    <div>
                        <p className="font-semibold text-brand-text-secondary text-sm mt-4 mb-2">Missões Semanais</p>
                         <div className="space-y-3">
                            {weeklyMissions.map(mProg => {
                                const mDef = findMissionDef(mProg.id, 'weekly');
                                return mDef ? <MissionCard key={mProg.id} missionProgress={mProg} missionDef={mDef} /> : null;
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-semibold text-brand-text flex items-center"><Medal className="mr-3 text-brand-primary"/> Conquistas</h3>
                    <button 
                        onClick={() => setIsLeaderboardOpen(true)}
                        className="flex items-center gap-1.5 bg-gray-100 text-brand-text-secondary font-bold py-1.5 px-3 rounded-full text-sm hover:bg-gray-200 transition-opacity"
                    >
                        <Trophy size={14} />
                        Leaderboard
                    </button>
                </div>
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
             {isLeaderboardOpen && <LeaderboardModal onClose={() => setIsLeaderboardOpen(false)} />}
        </div>
    );
};

export default ProgressTracker;
