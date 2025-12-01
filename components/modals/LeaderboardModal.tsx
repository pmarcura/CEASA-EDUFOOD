import React, { useState, useEffect, useContext } from 'react';
import ReactDOM from 'react-dom';
import { db } from '../../firebase/config';
import { X, LoaderCircle, Trophy, ShieldAlert, UserPlus, Check } from 'lucide-react';
import type { LeaderboardEntry } from '../../types';
import { AppContext } from '../../contexts/AppContext';

interface LeaderboardModalProps {
    onClose: () => void;
}

const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} className="text-yellow-500" />;
    if (rank === 2) return <Trophy size={18} className="text-gray-400" />;
    if (rank === 3) return <Trophy size={18} className="text-orange-400" />;
    return <span className="text-sm font-bold w-[18px] text-center">{rank}</span>;
};


const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
    const context = useContext(AppContext);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const usersRef = db.collection('users');
                const querySnapshot = await usersRef.orderBy('xp', 'desc').limit(20).get();
                
                const currentUserFriends = context?.userProfile?.friends || [];

                const data = querySnapshot.docs.map(doc => ({
                    uid: doc.id,
                    name: doc.data().displayName || doc.data().name || 'Família Anônima',
                    avatar: doc.data().photoURL || '/professor-nutri.png',
                    xp: doc.data().xp || 0,
                    level: doc.data().level || 1,
                    isFriend: currentUserFriends.includes(doc.id)
                }));
                
                setLeaderboard(data);
            } catch (err: any) {
                console.error("Error fetching leaderboard:", err);
                if (err.code === 'permission-denied') {
                    setError("Você precisa de permissão para ver o ranking.");
                } else {
                    setError("Não foi possível carregar o leaderboard no momento.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [context?.userProfile?.friends]);

    const handleAddFriend = async (targetUid: string) => {
        if (!context?.sendFriendRequest) return;
        setSentRequests(prev => new Set(prev).add(targetUid));
        await context.sendFriendRequest(targetUid);
    };

    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return null;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-8">
                    <LoaderCircle className="h-8 w-8 animate-spin text-brand-primary" />
                    <p className="mt-2 text-brand-text-secondary">Carregando...</p>
                </div>
            );
        }
        if (error) {
             return (
                <div className="text-center text-brand-text-secondary p-8">
                    <ShieldAlert size={40} className="mx-auto mb-4 text-yellow-500"/>
                    <h4 className="font-bold text-brand-text mb-2">Ranking Indisponível</h4>
                    <p className="text-sm mb-4">{error}</p>
                    <p className="text-xs bg-gray-100 p-2 rounded-lg">Dica: Verifique as regras de segurança do Firebase.</p>
                </div>
            );
        }
        if (leaderboard.length === 0) {
            return <p className="text-center text-brand-text-secondary p-8">Nenhuma família no ranking ainda.</p>;
        }
        return (
             <ul className="space-y-2 pr-2">
                {leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = context?.user?.uid === entry.uid;
                    const isRequestSent = sentRequests.has(entry.uid);

                    return (
                        <li key={entry.uid} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isCurrentUser ? 'bg-brand-primary-light ring-2 ring-brand-primary' : 'bg-brand-background'}`}>
                            <div className="flex items-center justify-center w-6">{getRankIcon(rank)}</div>
                            <img src={entry.avatar} alt={entry.name} className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" />
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-brand-text truncate text-sm">{entry.name}</p>
                                <p className="text-xs text-brand-text-secondary">Nível {entry.level} • {entry.xp} XP</p>
                            </div>
                            
                            {!isCurrentUser && (
                                entry.isFriend ? (
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">Amigo</span>
                                ) : isRequestSent ? (
                                    <button disabled className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                                        <Check size={12} /> Enviado
                                    </button>
                                ) : (
                                    <button onClick={() => handleAddFriend(entry.uid)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                                        <UserPlus size={16} />
                                    </button>
                                )
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-brand-surface rounded-2xl shadow-lg w-full max-w-md flex flex-col max-h-[90vh] animate-slide-in-up"
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-brand-border flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
                        <Trophy className="text-yellow-500" />
                        Leaderboard de Famílias
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X size={20}/></button>
                </header>
                <main className="flex-1 overflow-y-auto p-4">
                    {renderContent()}
                </main>
            </div>
        </div>,
        modalRoot
    );
};

export default LeaderboardModal;