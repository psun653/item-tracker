import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme, Platform, LayoutAnimation, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, ThemeColors } from '../constants/theme';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
    themeMode: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
    setThemeMode: (mode: ThemeMode) => void;
}

const THEME_STORAGE_KEY = '@useItWell:themeMode';

const ThemeContext = createContext<ThemeContextType>({
    themeMode: 'system',
    isDark: true,
    colors: DarkColors,
    setThemeMode: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isReady, setIsReady] = useState(false);

    // Load saved theme on mount
    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (saved) {
                    setThemeModeState(saved as ThemeMode);
                }
            } catch (e) {
                console.error('Failed to load theme', e);
            } finally {
                setIsReady(true);
            }
        })();
    }, []);

    const setThemeMode = async (mode: ThemeMode) => {
        // High-fidelity smooth fade transition
        const config = {
            duration: 600, // Longer duration for a "gradient" feel
            update: {
                type: LayoutAnimation.Types.easeInEaseOut,
            },
            delete: {
                type: LayoutAnimation.Types.easeInEaseOut,
                property: LayoutAnimation.Properties.opacity,
            },
        };

        LayoutAnimation.configureNext(config);

        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (e) {
            console.error('Failed to save theme', e);
        }
    };
    // Enable LayoutAnimation for Android
    useEffect(() => {
        if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }, []);

    const isDark =
        themeMode === 'system'
            ? systemColorScheme === 'dark'
            : themeMode === 'dark';

    const colors = isDark ? DarkColors : LightColors;

    if (!isReady) {
        return null; // Or a splash screen
    }

    return (
        <ThemeContext.Provider value={{ themeMode, isDark, colors, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
