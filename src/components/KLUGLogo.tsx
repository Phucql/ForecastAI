import React from 'react';

interface KLUGLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const KLUGLogo: React.FC<KLUGLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Orange square with black K design */}
      <div className={`${sizeClasses[size]} bg-orange-500 rounded flex items-center justify-center`}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-3/4 h-3/4"
        >
          {/* Black K design with connection points */}
          <circle cx="6" cy="6" r="1.5" fill="black" />
          <circle cx="6" cy="18" r="1.5" fill="black" />
          <circle cx="18" cy="18" r="1.5" fill="black" />
          <path 
            d="M6 6 L6 18 M6 6 L18 18" 
            stroke="black" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </svg>
      </div>
      
      {/* Text part */}
      <div className="flex flex-col">
        <span className="text-gray-700 font-semibold text-sm leading-tight">KKLUG</span>
        <span className="text-orange-500 font-bold text-sm leading-tight">ForecastAI</span>
      </div>
    </div>
  );
};

export default KLUGLogo; 