
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { applyColorPalette, applyFont } from '@/utils/appearance';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('bizsuite-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(systemPrefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('bizsuite-theme', theme);
    
    // Re-apply current color palette and font when theme changes
    const applyCurrentSettings = () => {
      const storedData = localStorage.getItem('bizsuite-data');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          if (data.userSettings?.colorPalette) {
            applyColorPalette(data.userSettings.colorPalette, theme === 'dark');
          }
          if (data.userSettings?.fontFamily) {
            applyFont(data.userSettings.fontFamily);
          }
        } catch (error) {
          console.error('Error applying theme settings:', error);
        }
      }
    };

    // Apply settings after a short delay to ensure DOM is ready
    setTimeout(applyCurrentSettings, 100);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
