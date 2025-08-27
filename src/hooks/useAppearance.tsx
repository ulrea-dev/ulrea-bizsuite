import { useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useTheme } from '@/hooks/useTheme';
import { applyColorPalette, applyFont, getDefaultFont, getDefaultColorPalette } from '@/utils/appearance';

/**
 * Custom hook to manage application appearance (fonts and color palettes)
 * This ensures that appearance settings are applied consistently across theme changes
 */
export const useAppearance = () => {
  const { data } = useBusiness();
  const { theme } = useTheme();

  // Apply appearance settings whenever theme or settings change
  useEffect(() => {
    const currentFont = data.userSettings?.fontFamily || getDefaultFont();
    const currentPalette = data.userSettings?.colorPalette || getDefaultColorPalette();

    // Apply font
    applyFont(currentFont);

    // Apply color palette with current theme
    applyColorPalette(currentPalette, theme === 'dark');
  }, [data.userSettings?.fontFamily, data.userSettings?.colorPalette, theme]);

  // Initial load - apply settings on mount
  useEffect(() => {
    const currentFont = data.userSettings?.fontFamily || getDefaultFont();
    const currentPalette = data.userSettings?.colorPalette || getDefaultColorPalette();

    applyFont(currentFont);
    applyColorPalette(currentPalette, theme === 'dark');
  }, []); // Run once on mount
};