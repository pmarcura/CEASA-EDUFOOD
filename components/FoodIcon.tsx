
import React, { useMemo } from 'react';
import { getFoodEmoji, getCategoryColor } from '../utils/emojiMapper';

interface FoodIconProps {
    name: string;
    icon?: string; // Original icon from database (might be an emoji or a keyword)
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    forceColor?: string; // Hex color override
}

// Helper to check if string is a single emoji
const isEmoji = (str: string) => {
    const regex = /\p{Extended_Pictographic}/u;
    return regex.test(str);
};

const FoodIcon: React.FC<FoodIconProps> = ({ name, icon, size = 'md', className = '', forceColor }) => {
    
    const displayEmoji = useMemo(() => {
        // 1. If 'icon' prop is provided and is a valid emoji, use it.
        if (icon && isEmoji(icon)) {
            return icon;
        }
        // 2. Otherwise, fallback to mapping based on name.
        return getFoodEmoji(name);
    }, [name, icon]);

    const bgColor = useMemo(() => {
        if (forceColor) return forceColor;
        return getCategoryColor(displayEmoji);
    }, [displayEmoji, forceColor]);

    const sizeClasses = {
        sm: 'w-8 h-8 text-lg',
        md: 'w-10 h-10 text-xl',
        lg: 'w-12 h-12 text-2xl',
    };

    return (
        <div 
            className={`rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 ${sizeClasses[size]} ${className}`}
            style={{ backgroundColor: bgColor }}
        >
            <span className="filter drop-shadow-sm transform transition-transform hover:scale-110 cursor-default">
                {displayEmoji}
            </span>
        </div>
    );
};

export default FoodIcon;
