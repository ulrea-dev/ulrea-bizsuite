import { FontOption, ColorPalette } from '@/types/business';

// Predefined fonts
export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'atkinson',
    name: 'Atkinson Hyperlegible',
    family: 'Atkinson Hyperlegible',
    weights: ['400', '700'],
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap'
  },
  {
    id: 'inter',
    name: 'Inter',
    family: 'Inter',
    weights: ['300', '400', '500', '600', '700'],
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
  },
  {
    id: 'sora',
    name: 'Sora',
    family: 'Sora',
    weights: ['300', '400', '500', '600', '700'],
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap'
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: 'Poppins',
    weights: ['300', '400', '500', '600', '700'],
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    family: 'Roboto',
    weights: ['300', '400', '500', '700'],
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
  },
  {
    id: 'opensans',
    name: 'Open Sans',
    family: 'Open Sans',
    weights: ['300', '400', '500', '600', '700'],
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap'
  },
  {
    id: 'lato',
    name: 'Lato',
    family: 'Lato',
    weights: ['300', '400', '700'],
    googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap'
  }
];

// Predefined color palettes
export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'monochrome',
    name: 'Monochrome (Default)',
    type: 'predefined',
    colors: {
      background: '0 0% 100%',
      foreground: '0 0% 5%',
      card: '0 0% 100%',
      cardForeground: '0 0% 5%',
      popover: '0 0% 100%',
      popoverForeground: '0 0% 5%',
      primary: '0 0% 10%',
      primaryForeground: '0 0% 98%',
      secondary: '0 0% 96%',
      secondaryForeground: '0 0% 20%',
      muted: '0 0% 95%',
      mutedForeground: '0 0% 45%',
      accent: '0 0% 93%',
      accentForeground: '0 0% 15%',
      destructive: '0 0% 25%',
      destructiveForeground: '0 0% 98%',
      border: '0 0% 88%',
      input: '0 0% 88%',
      ring: '0 0% 20%'
    }
  },
  {
    id: 'blue-professional',
    name: 'Blue Professional',
    type: 'predefined',
    colors: {
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      card: '0 0% 100%',
      cardForeground: '222 47% 11%',
      popover: '0 0% 100%',
      popoverForeground: '222 47% 11%',
      primary: '221 83% 53%',
      primaryForeground: '210 40% 98%',
      secondary: '210 40% 96%',
      secondaryForeground: '222 47% 11%',
      muted: '210 40% 96%',
      mutedForeground: '215 16% 47%',
      accent: '210 40% 94%',
      accentForeground: '222 47% 11%',
      destructive: '0 84% 60%',
      destructiveForeground: '210 40% 98%',
      border: '214 32% 91%',
      input: '214 32% 91%',
      ring: '221 83% 53%'
    }
  },
  {
    id: 'green-nature',
    name: 'Green Nature',
    type: 'predefined',
    colors: {
      background: '0 0% 100%',
      foreground: '120 27% 8%',
      card: '0 0% 100%',
      cardForeground: '120 27% 8%',
      popover: '0 0% 100%',
      popoverForeground: '120 27% 8%',
      primary: '142 76% 36%',
      primaryForeground: '355 20% 97%',
      secondary: '120 60% 97%',
      secondaryForeground: '120 27% 8%',
      muted: '120 60% 97%',
      mutedForeground: '120 10% 50%',
      accent: '120 60% 94%',
      accentForeground: '120 27% 8%',
      destructive: '0 84% 60%',
      destructiveForeground: '355 20% 97%',
      border: '120 45% 89%',
      input: '120 45% 89%',
      ring: '142 76% 36%'
    }
  },
  {
    id: 'purple-creative',
    name: 'Purple Creative',
    type: 'predefined',
    colors: {
      background: '0 0% 100%',
      foreground: '280 30% 9%',
      card: '0 0% 100%',
      cardForeground: '280 30% 9%',
      popover: '0 0% 100%',
      popoverForeground: '280 30% 9%',
      primary: '263 70% 50%',
      primaryForeground: '280 17% 98%',
      secondary: '270 20% 96%',
      secondaryForeground: '280 30% 9%',
      muted: '270 20% 96%',
      mutedForeground: '280 15% 50%',
      accent: '270 20% 94%',
      accentForeground: '280 30% 9%',
      destructive: '0 84% 60%',
      destructiveForeground: '280 17% 98%',
      border: '270 30% 91%',
      input: '270 30% 91%',
      ring: '263 70% 50%'
    }
  }
];

// Apply font to document
export const applyFont = (font: FontOption) => {
  // Load Google Font if needed
  if (font.googleFontUrl) {
    const existingLink = document.querySelector(`link[href="${font.googleFontUrl}"]`);
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = font.googleFontUrl;
      document.head.appendChild(link);
    }
  }

  // Apply font to CSS custom property
  document.documentElement.style.setProperty('--font-family', `'${font.family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`);
};

// Apply color palette to document
export const applyColorPalette = (palette: ColorPalette, isDark: boolean = false) => {
  const root = document.documentElement;
  
  // Apply base colors
  Object.entries(palette.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  // For dark mode, we need to create darker versions
  if (isDark) {
    // Convert light colors to dark equivalents
    const darkColors = convertToDarkMode(palette.colors);
    Object.entries(darkColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }
};

// Convert light colors to dark mode equivalents
const convertToDarkMode = (lightColors: ColorPalette['colors']) => {
  // This is a simplified conversion - in practice, you'd want more sophisticated logic
  return {
    background: '0 0% 8%',
    foreground: '0 0% 95%',
    card: '0 0% 10%',
    cardForeground: '0 0% 95%',
    popover: '0 0% 8%',
    popoverForeground: '0 0% 95%',
    primary: lightColors.primary, // Keep primary color similar
    primaryForeground: '0 0% 10%',
    secondary: '0 0% 15%',
    secondaryForeground: '0 0% 85%',
    muted: '0 0% 12%',
    mutedForeground: '0 0% 60%',
    accent: '0 0% 18%',
    accentForeground: '0 0% 90%',
    destructive: lightColors.destructive,
    destructiveForeground: '0 0% 8%',
    border: '0 0% 18%',
    input: '0 0% 18%',
    ring: lightColors.ring
  };
};

// Get default font and palette
export const getDefaultFont = (): FontOption => FONT_OPTIONS[0];
export const getDefaultColorPalette = (): ColorPalette => COLOR_PALETTES[0];

// Validate color palette for accessibility
export const validateColorPalette = (palette: ColorPalette): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  // Basic validation - you could expand this with actual contrast ratio calculations
  if (!palette.colors.background || !palette.colors.foreground) {
    warnings.push('Background and foreground colors are required');
  }
  
  if (!palette.colors.primary || !palette.colors.primaryForeground) {
    warnings.push('Primary and primary foreground colors are required');
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
};