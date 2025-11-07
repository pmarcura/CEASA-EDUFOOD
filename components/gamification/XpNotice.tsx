
import React, { useEffect, useState } from 'react';
import type { XpNoticeInfo } from '../../types';
import { getLevelForXp } from '../../services/gamificationService';
import { Sparkles } from 'lucide-react';

interface XpNoticeProps {
  notice: XpNoticeInfo;
  onClose: () => void;
}

const XpNotice: React.FC<XpNoticeProps> = ({ notice, onClose }) => {
  const { xpGained, reason, oldXp, newXp } = notice;

  const [oldPercentage, setOldPercentage] = useState(0);
  const [newPercentage, setNewPercentage] = useState(0);
  const [level, setLevel] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const oldLevelInfo = getLevelForXp(oldXp);
    const newLevelInfo = getLevelForXp(newXp);
    
    setLevel(oldLevelInfo.level);

    const oldP = oldLevelInfo.xpForNextLevel > 0 ? (oldLevelInfo.xpInCurrentLevel / oldLevelInfo.xpForNextLevel) * 100 : 0;
    const newP = newLevelInfo.xpForNextLevel > 0 ? (newLevelInfo.xpInCurrentLevel / newLevelInfo.xpForNextLevel) * 100 : 0;
    
    setOldPercentage(oldP);
    
    // Trigger animation after initial render
    const animationTimeout = setTimeout(() => {
      setNewPercentage(newP);
      setIsAnimating(true);
    }, 100);
    
    // Auto-close the notice
    const closeTimeout = setTimeout(() => {
        setIsAnimating(false); // Animate out
        setTimeout(onClose, 500); // Remove from DOM after animation
    }, 4000);

    return () => {
      clearTimeout(animationTimeout);
      clearTimeout(closeTimeout);
    };
  }, [notice, onClose, oldXp, newXp]);

  const xpSign = xpGained > 0 ? '+' : '';
  const xpColor = xpGained > 0 ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 transition-all duration-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
      <div className="bg-brand-surface/90 backdrop-blur-lg rounded-xl shadow-lg p-3 w-full max-w-md mx-auto border border-brand-border">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-yellow-500" size={20} />
            <div>
              <span className={`font-bold ${xpColor}`}>{xpSign}{xpGained} XP</span>
              <span className="text-sm text-brand-text-secondary ml-2">{reason}</span>
            </div>
          </div>
          <div className="relative w-full bg-brand-border rounded-full h-2">
            <div 
                className="absolute top-0 left-0 bg-yellow-400 h-full rounded-full" 
                style={{ width: `${oldPercentage}%` }}
            />
            <div 
                className="absolute top-0 left-0 bg-yellow-400 h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${newPercentage}%` }}
            />
          </div>
           <div className="flex justify-between text-xs font-bold text-brand-text-secondary mt-1">
              <span>Nível {level}</span>
              <span>Nível {level + 1}</span>
          </div>
      </div>
    </div>
  );
};

export default XpNotice;
