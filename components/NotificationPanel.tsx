import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { X, Bell, UserPlus, Trophy, Utensils, Camera, Flame, Check } from 'lucide-react';
import type { AppNotification } from '../types';

interface NotificationPanelProps {
    onClose: () => void;
}

const NotificationIcon: React.FC<{ type: AppNotification['type'] }> = ({ type }) => {
    switch (type) {
        case 'friend_request': return <UserPlus size={18} className="text-blue-500" />;
        case 'level_up': return <Trophy size={18} className="text-yellow-500" />;
        case 'meal': return <Utensils size={18} className="text-green-500" />;
        case 'post': return <Camera size={18} className="text-purple-500" />;
        case 'streak': return <Flame size={18} className="text-orange-500" />;
        default: return <Bell size={18} className="text-gray-500" />;
    }
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
    const context = useContext(AppContext);
    
    if (!context) return null;
    const { notifications, markNotificationAsRead, acceptFriendRequest } = context;

    const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);

    const handleAccept = async (notif: AppNotification) => {
        await acceptFriendRequest(notif);
    };

    const handleRead = async (notif: AppNotification) => {
        if (!notif.read) {
            await markNotificationAsRead(notif.id);
        }
    };

    return (
        <div className="absolute top-16 right-4 w-80 bg-brand-surface rounded-2xl shadow-2xl border border-brand-border z-50 animate-fade-in overflow-hidden flex flex-col max-h-[70vh]">
            <header className="p-3 bg-white border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                <h3 className="font-bold text-brand-text flex items-center gap-2">
                    <Bell size={16} className="text-brand-primary" /> Notificações
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={18}/></button>
            </header>

            <div className="overflow-y-auto flex-1">
                {sortedNotifications.length === 0 ? (
                    <div className="p-8 text-center text-brand-text-secondary">
                        <Bell size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Tudo tranquilo por aqui.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {sortedNotifications.map(notif => {
                            const isFriendRequest = notif.type === 'friend_request' && !notif.data?.isAcceptance;
                            
                            return (
                                <div 
                                    key={notif.id} 
                                    className={`p-3 hover:bg-gray-50 transition-colors ${notif.read ? 'opacity-60' : 'bg-blue-50/30'}`}
                                    onClick={() => !isFriendRequest && handleRead(notif)}
                                >
                                    <div className="flex gap-3">
                                        <div className="relative">
                                            <img src={notif.senderAvatar} alt={notif.senderName} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                <NotificationIcon type={notif.type} />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-brand-text leading-tight">
                                                <span className="font-bold">{notif.senderName}</span> {notif.content}
                                            </p>
                                            <p className="text-[10px] text-brand-text-secondary mt-1">
                                                {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                            
                                            {isFriendRequest && (
                                                <div className="mt-2 flex gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleAccept(notif); }}
                                                        className="flex-1 bg-brand-primary text-white text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-brand-dark"
                                                    >
                                                        <Check size={12} /> Aceitar
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); markNotificationAsRead(notif.id); }}
                                                        className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-1.5 rounded-lg hover:bg-gray-200"
                                                    >
                                                        Ignorar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {!notif.read && <div className="w-2 h-2 bg-brand-primary rounded-full mt-2"></div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;