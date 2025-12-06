
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
        const localEmoji = getFoodEmoji(name);
        
        // 1. If we have a 'database icon' (from AI or saved)
        if (icon && isEmoji(icon)) {
            // INTELLIGENT OVERRIDE:
            // Sometimes the AI returns generic icons like 📦, 🛍️, 🛒, 🥣.
            // If our local mapper found a SPECIFIC food icon (e.g., 🥩, 🥦, 🍎),
            // we should prioritize our local specific knowledge over the AI's generic guess.
            
            const genericIcons = ['📦', '🛍️', '🛒', '🥣', '🍽️', '🍴', '🥡', '📄', '🏷️', '🧊'];
            const isLocalGeneric = genericIcons.includes(localEmoji);
            const isRemoteGeneric = genericIcons.includes(icon);

            // If remote is generic AND local is specific, use local
            // Example: Remote says "📦" for "Patinho", Local says "🥩". Use "🥩".
            if (isRemoteGeneric && !isLocalGeneric) {
                return localEmoji;
            }
            
            // Otherwise trust the AI/Database (e.g., if AI found a specific sushi icon we don't have)
            return icon;
        }
        
        // 2. Fallback to local mapping based on name
        return localEmoji;
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
            <span className="filter drop-shadow-sm transform transition-transform hover:scale-110 cursor-default select-none">
                {displayEmoji}
            </span>
        </div>
    );
};

export default FoodIcon;
