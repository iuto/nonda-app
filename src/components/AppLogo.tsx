import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'md', showText = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center space-x-2 select-none">
      {/* 服薬×時間を象徴するグラデーションSVGロゴマーク */}
      <div className={`relative flex items-center justify-center ${iconSizes[size]} transition-transform hover:scale-105 duration-200`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="capsuleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d1fae5" />
            </linearGradient>
          </defs>

          <rect x="2" y="2" width="96" height="96" rx="28" fill="url(#logoGrad)" />
          <circle cx="50" cy="50" r="34" stroke="white" strokeOpacity="0.25" strokeWidth="4" strokeDasharray="6 4" />

          <g transform="rotate(-35 50 50)">
            <rect x="34" y="22" width="32" height="56" rx="16" fill="url(#capsuleGrad)" />
            <path d="M34 38 C34 29.16 41.16 22 50 22 C58.84 22 66 29.16 66 38 L66 50 L34 50 Z" fill="#047857" opacity="0.9" />
            <line x1="34" y1="50" x2="66" y2="50" stroke="#ffffff" strokeWidth="2.5" />
          </g>

          <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
          <line x1="50" y1="50" x2="38" y2="38" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="50" x2="65" y2="42" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>

      {/* 新アプリ名：のんだ？ (Nonda?) */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-black tracking-tight leading-none ${textSizes[size]}`}>
            <span className="text-emerald-700">のんだ</span>
            <span className="text-emerald-500 ml-0.5">？</span>
          </span>
        </div>
      )}
    </div>
  );
};
