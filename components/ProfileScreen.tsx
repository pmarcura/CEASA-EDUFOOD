
import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { X, LogOut, Award, CookingPot, BookOpen, ThumbsUp, Meh, Frown } from 'lucide-react';
import { calculateLevelInfo } from '../helpers/gamification';

interface ProfileScreenProps {
  onClose: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose }) => {
  const context = useContext(AppContext);
  if (!context || !context.user || !context.userProfile) return null;

  const { user, userProfile, logout, mealLog, pantry } = context;

  const userPoints = userProfile.points || 0;
  const levelInfo = calculateLevelInfo(userPoints);

  const stats = [
      { icon: CookingPot, value: mealLog.length, label: 'Receitas Preparadas' },
      { icon: BookOpen, value: pantry.length, label: 'Itens na Despensa' },
      { icon: ThumbsUp, value: mealLog.filter(m => m.feedback === 'liked').length, label: 'Refeições Aprovadas' },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex flex-col items-center justify-end animate-fade-in" onClick={onClose}>
      <div 
        className="bg-brand-background rounded-t-2xl w-full max-w-lg p-4 shadow-edu-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between pb-3 border-b border-brand-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src={user.photoURL || "/professor-nutri.png"}
              alt="User Avatar" 
              className="h-12 w-12 rounded-full object-cover border-2 border-brand-surface shadow-md"
            />
            <div>
              <h2 className="text-lg font-bold text-brand-text">{user.displayName || 'Meu Perfil'}</h2>
              <p className="text-sm text-brand-text-secondary">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={20} className="text-brand-text-secondary" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Gamification Section */}
          <div className="bg-brand-surface p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <Award className="text-yellow-500" size={20} />
                    <span className="font-bold text-brand-text">{levelInfo.title}</span>
                </div>
                <span className="text-sm font-semibold text-brand-text-secondary">Nível {levelInfo.level}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${levelInfo.progressPercentage}%` }}></div>
            </div>
            <div className="flex justify-between items-center mt-1 text-xs text-brand-text-secondary">
                <span>{userPoints} pts</span>
                {levelInfo.nextLevelPoints > userPoints && <span>{levelInfo.nextLevelPoints} pts para o Nível {levelInfo.level + 1}</span>}
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {stats.map(stat => (
                <div key={stat.label} className="bg-brand-surface p-3 rounded-xl shadow-sm">
                    <stat.icon className="mx-auto mb-1.5 text-brand-primary" size={24} />
                    <p className="text-xl font-bold text-brand-text">{stat.value}</p>
                    <p className="text-[10px] leading-tight font-medium text-brand-text-secondary">{stat.label}</p>
                </div>
            ))}
          </div>

          {/* Meal History Section */}
          <div>
            <h3 className="text-lg font-bold text-brand-text mb-3">Histórico de Refeições</h3>
            {mealLog.length > 0 ? (
                <div className="space-y-3">
                    {mealLog.slice(0, 5).map(meal => (
                        <div key={meal.id} className="bg-brand-surface p-2.5 rounded-xl shadow-sm flex items-center gap-3">
                            {meal.imageUrl ? (
                                <img src={meal.imageUrl} alt={meal.recipeTitle} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <CookingPot size={24} className="text-gray-400" />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="font-bold text-sm text-brand-text">{meal.recipeTitle}</p>
                                <p className="text-xs text-brand-text-secondary">{new Date(meal.timestamp).toLocaleDateString()}</p>
                            </div>
                            <div className={`p-2 rounded-full ${meal.feedback === 'liked' ? 'bg-green-100' : meal.feedback === 'ok' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                {meal.feedback === 'liked' && <ThumbsUp size={16} className="text-green-600"/>}
                                {meal.feedback === 'ok' && <Meh size={16} className="text-yellow-600"/>}
                                {meal.feedback === 'disliked' && <Frown size={16} className="text-red-600"/>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-brand-text-secondary bg-brand-surface p-4 rounded-xl">Nenhuma refeição registrada ainda. Prepare uma receita para começar!</p>
            )}
          </div>
        </main>
        
        <footer className="pt-3 border-t border-brand-border flex-shrink-0">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-brand-risk-high bg-red-50 font-bold py-3 px-4 rounded-xl hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ProfileScreen;
