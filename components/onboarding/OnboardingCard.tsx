
import React from 'react';

interface OnboardingCardProps {
  icon: React.ElementType;
  text: string;
  isSelected: boolean;
  onClick: () => void;
  isTall?: boolean;
  isWide?: boolean;
}

const OnboardingCard: React.FC<OnboardingCardProps> = ({ icon: Icon, text, isSelected, onClick, isTall, isWide }) => {
  const baseClasses = "bg-brand-surface p-3 rounded-xl flex items-center justify-center transition-all duration-200 border-2 cursor-pointer shadow-sm";
  const selectedClasses = "border-brand-primary bg-green-50 text-brand-primary font-bold ring-2 ring-brand-primary/50";
  const unselectedClasses = "border-transparent hover:border-brand-primary/50 text-brand-text-secondary";
  
  const layoutClasses = isTall 
    ? "flex-col aspect-square" 
    : "flex-row text-left justify-start";
    
  const textClasses = isWide ? "ml-3" : "mt-2";
  const iconSize = isWide ? "20" : "24";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${isSelected ? selectedClasses : unselectedClasses} ${layoutClasses}`}
    >
      <Icon size={iconSize} className="flex-shrink-0"/>
      <span className={`text-sm leading-tight ${textClasses}`}>{text}</span>
    </div>
  );
};

export default OnboardingCard;