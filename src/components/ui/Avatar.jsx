const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
};

const Avatar = ({
  src,
  alt = '',
  name,
  size = 'md',
  className = ''
}) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }
  
  return (
    <div 
      className={`
        rounded-full flex items-center justify-center 
        bg-primary-100 text-primary-700 font-semibold
        ${sizeClasses[size]} ${className}
      `}
      aria-label={alt || name}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;


