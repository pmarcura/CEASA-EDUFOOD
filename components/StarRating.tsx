import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  setRating?: (rating: number) => void; // Optional: makes it read-only if not provided
  size?: number;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, size = 24, className }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isInteractive = !!setRating;
        return (
          <Star
            key={star}
            size={size}
            className={`transition-all duration-200 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            } ${isInteractive ? 'cursor-pointer hover:scale-110' : ''}`}
            onClick={() => setRating?.(star)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;
