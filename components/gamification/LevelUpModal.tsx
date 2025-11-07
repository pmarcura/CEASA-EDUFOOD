
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Award, ArrowUp } from 'lucide-react';
import type { LevelUpInfo } from '../../hooks/useGamification';

interface LevelUpModalProps {
  levelUpInfo: LevelUpInfo;
  close: () => void;
}

const ConfettiPiece: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div className="absolute w-2 h-4" style={style}></div>
);

const LevelUpModal: React.FC<LevelUpModalProps> = ({ levelUpInfo, close }) => {
  const [confetti, setConfetti] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    // Generate confetti particles
    const newConfetti = Array.from({ length: 50 }).map(() => ({
      left: `${Math.random() * 100}%`,
      animation: `confetti-rain ${1 + Math.random() * 2}s linear ${Math.random() * 2}s infinite`,
      backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'][Math.floor(Math.random() * 4)],
      transform: `rotate(${Math.random() * 360}deg)`,
    }));
    setConfetti(newConfetti);

    const timer = setTimeout(close, 5000); // Auto-close after 5 seconds
    return () => clearTimeout(timer);
  }, [close]);
  
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={close}
    >
      {confetti.map((style, index) => <ConfettiPiece key={index} style={style} />)}
      <div 
        className="relative bg-brand-surface rounded-3xl p-8 text-center w-full max-w-sm flex flex-col items-center shadow-2xl animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-12 w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center border-8 border-brand-surface">
            <Award size={48} className="text-yellow-900" />
        </div>
        <p className="text-lg font-semibold text-yellow-600 mt-12">PARABÉNS!</p>
        <h2 className="text-4xl font-extrabold text-brand-text my-2">Você subiu de nível!</h2>
        <div className="flex items-center justify-center gap-4 my-4">
            <span className="text-3xl font-bold text-brand-text-secondary">{levelUpInfo.oldLevel}</span>
            <ArrowUp size={32} className="text-brand-primary animate-bounce"/>
            <span className="text-5xl font-extrabold text-brand-primary">{levelUpInfo.newLevel}</span>
        </div>
        <button
          onClick={close}
          className="mt-6 w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-xl"
        >
          Continuar!
        </button>
      </div>
    </div>,
    modalRoot
  );
};

export default LevelUpModal;
