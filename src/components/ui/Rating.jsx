import { Star } from 'lucide-react';

const Rating = ({
  value,
  reviewCount,
  showCount = true,
  size = 'md',
  className = ''
}) => {
  const sizes = {
    sm: { star: 12, text: 'text-xs' },
    md: { star: 14, text: 'text-sm' },
    lg: { star: 16, text: 'text-base' }
  };
  
  const { star: starSize, text } = sizes[size];
  
  // Generate stars
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star 
            key={`full-${i}`} 
            size={starSize} 
            className="text-amber-400 fill-amber-400" 
          />
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star size={starSize} className="text-slate-200" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={starSize} className="text-amber-400 fill-amber-400" />
            </div>
          </div>
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star 
            key={`empty-${i}`} 
            size={starSize} 
            className="text-slate-200" 
          />
        ))}
      </div>
      <span className={`text-slate-600 ${text}`}>
        {value.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && (
        <span className={`text-slate-400 ${text}`}>
          ({reviewCount} reviews)
        </span>
      )}
    </div>
  );
};

export default Rating;

