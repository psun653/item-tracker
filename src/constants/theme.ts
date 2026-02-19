// Color palette — dark-mode first
export const DarkColors = {
    background: '#121414',
    backgroundGradientStart: '#0F1111',
    backgroundGradientEnd: '#1C1F1F',
    surface: '#1c1f1f',
    surfaceElevated: '#2c3331', // slate-border generic
    border: '#2c3331',     // slate-border
    primary: '#84a49c',    // primary Sage
    primaryLight: '#A3B18A',
    accent: '#84a49c',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    textPrimary: '#F1F5F9', // slate-100
    textSecondary: '#94A3B8', // slate-400
    textMuted: '#64748B', // slate-500
    cardGradientStart: '#1c1f1f',
    cardGradientEnd: '#121414',
    // New Vault specifics from HTML
    switcherBg: 'rgba(28, 31, 31, 0.5)',
    inputBg: '#1c1f1f',
};

export const LightColors = {
    background: '#f7f7f7',
    backgroundGradientStart: '#F1F5F9',
    backgroundGradientEnd: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E2E8F0', // Slate 200
    primary: '#84a49c', // Sage Green
    primaryLight: '#A3B18A',
    accent: '#84a49c',
    success: '#34C759',
    warning: '#FBBF24',
    danger: '#EF4444',
    textPrimary: '#0F172A', // Slate 900
    textSecondary: '#64748B', // Slate 500
    textMuted: '#94A3B8', // Slate 400
    cardGradientStart: '#FFFFFF',
    cardGradientEnd: '#F6F6F8',
    // New Vault specifics
    switcherBg: 'rgba(226, 232, 240, 0.5)',
    inputBg: '#FFFFFF',
};

export type ThemeColors = typeof DarkColors; // Export type explicitly

// Default Colors for backwards compat if needed, but ThemeProvider uses named imports
export const Colors = DarkColors;

export const Typography = {
    fontFamily: undefined, // System default (Inter if loaded, else standard)
    sizes: {
        xs: 11,
        sm: 13,
        base: 15,
        md: 17,
        lg: 20,
        xl: 24,
        xxl: 30,
        xxxl: 38,
        display: 48,
    },
    weights: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
        heavy: '800' as const,
        light: '300' as const,
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 48,
};

export const Radii = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
};

export const RETIREMENT_CONFIG = {
    broken: { emoji: '🔧', label: 'Broken', color: '#F87171' },
    sold: { emoji: '💰', label: 'Sold', color: '#4ADE80' },
    gifted: { emoji: '🎁', label: 'Gifted', color: '#A89BFF' },
    lost: { emoji: '🕵️', label: 'Lost', color: '#FBBF24' },
    stolen: { emoji: '🚨', label: 'Stolen', color: '#FF6B9D' },
    expired: { emoji: '⏳', label: 'Expired', color: '#94A3B8' },
} as const;

export const CATEGORY_EMOJIS: Record<string, string> = {
    Clothing: '👕',
    Tools: '🔨',
    Sports: '⚽',
    Books: '📚',
    Music: '🎸',
    Kitchen: '🍳',
    Travel: '✈️',
    Fitness: '🏋️',
    Default: '📦',
};

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR', 'KRW', 'BRL', 'MXN', 'SGD', 'HKD', 'NZD'];
