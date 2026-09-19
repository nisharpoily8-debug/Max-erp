import React from 'react';
import { LetterheadConfig } from '../types';

interface LetterheadLogoProps {
  config?: LetterheadConfig;
  companyName: string;
  size?: 'compact' | 'standard' | 'large' | number;
}

export const LetterheadLogo: React.FC<LetterheadLogoProps> = ({
  config,
  companyName,
  size = 'standard',
}) => {
  if (config && !config.showLogo) {
    return null;
  }

  const heightPx =
    typeof size === 'number'
      ? size
      : size === 'compact'
      ? 36
      : size === 'large'
      ? 64
      : config?.logoHeight || 48;

  // Custom uploaded image or custom URL
  if (config?.logoType === 'custom' && config.logoUrl) {
    return (
      <div className="flex items-center">
        <img
          src={config.logoUrl}
          alt={`${companyName} Logo`}
          style={{ height: `${heightPx}px`, maxWidth: '240px' }}
          className="object-contain"
          onError={(e) => {
            // Fallback to default styling if custom image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  const preset = config?.presetId || 'diamond';
  const initialLetter = (companyName.trim()[0] || 'N').toUpperCase();

  // Preset Vector Logos
  if (preset === 'apex') {
    return (
      <div className="flex items-center" style={{ height: `${heightPx}px` }}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="22" fill="#0f172a" />
          <path
            d="M50 18L78 35V65L50 82L22 65V35L50 18Z"
            stroke="#10b981"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <path
            d="M50 32L68 43V60L50 71L32 60V43L50 32Z"
            fill="#059669"
            fillOpacity="0.4"
            stroke="#34d399"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="51" r="7" fill="#ffffff" />
        </svg>
      </div>
    );
  }

  if (preset === 'cube') {
    return (
      <div className="flex items-center" style={{ height: `${heightPx}px` }}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="22" fill="#18181b" />
          <path d="M50 20L80 37V67L50 84L20 67V37L50 20Z" fill="#27272a" />
          {/* Top Face */}
          <path d="M50 22L76 37L50 52L24 37L50 22Z" fill="#10b981" />
          {/* Left Face */}
          <path d="M24 40L50 55V80L24 65V40Z" fill="#047857" />
          {/* Right Face */}
          <path d="M50 55L76 40V65L50 80V55Z" fill="#059669" />
        </svg>
      </div>
    );
  }

  if (preset === 'leaf') {
    return (
      <div className="flex items-center" style={{ height: `${heightPx}px` }}>
        <svg
          viewBox="0 0 100 100"
          className="h-full w-auto"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="100" height="100" rx="22" fill="#064e3b" />
          <path
            d="M30 70C30 42 48 24 74 24C74 52 56 70 30 70Z"
            fill="#34d399"
          />
          <path
            d="M32 68C45 55 58 45 74 24"
            stroke="#064e3b"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M48 52C40 45 36 38 34 32"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (preset === 'monogram') {
    return (
      <div
        className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-black shadow-sm"
        style={{
          height: `${heightPx}px`,
          width: `${heightPx}px`,
          fontSize: `${Math.round(heightPx * 0.54)}px`,
        }}
      >
        <span>{initialLetter}</span>
      </div>
    );
  }

  // Default 'diamond'
  return (
    <div className="flex items-center" style={{ height: `${heightPx}px` }}>
      <svg
        viewBox="0 0 100 100"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100" height="100" rx="22" fill="#047857" />
        {/* Geometric Hex / Diamond Prism */}
        <polygon points="50,15 85,35 85,75 50,90 15,75 15,35" fill="#065f46" />
        <polygon points="50,15 85,35 50,55 15,35" fill="#34d399" />
        <polygon points="15,35 50,55 50,90 15,75" fill="#10b981" />
        <polygon points="50,55 85,35 85,75 50,90" fill="#059669" />
        <circle cx="50" cy="55" r="9" fill="#ffffff" />
      </svg>
    </div>
  );
};
