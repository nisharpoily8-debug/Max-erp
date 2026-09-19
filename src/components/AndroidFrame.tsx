import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface AndroidFrameProps {
  children: React.ReactNode;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children }) => {
  const { themeMode } = useTheme();

  const containerBg =
    themeMode === 'midnight'
      ? 'bg-black text-stone-100'
      : themeMode === 'light'
      ? 'bg-stone-200/90 text-stone-900'
      : 'bg-stone-950 text-stone-100';

  return (
    <div className={`min-h-screen ${containerBg} flex flex-col w-full selection:bg-emerald-500/30`}>
      <div className="w-full flex-1 flex flex-col bg-stone-950 min-h-screen">
        {children}
      </div>
    </div>
  );
};

