import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language, TranslationKey } from '../i18n/translations';

const LANG_KEY = '@app_language';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
    t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');

    // Load persisted language on mount
    React.useEffect(() => {
        AsyncStorage.getItem(LANG_KEY).then((saved) => {
            if (saved === 'en' || saved === 'zh-CN') {
                setLanguageState(saved);
            }
        });
    }, []);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        AsyncStorage.setItem(LANG_KEY, lang);
    }, []);

    const t = useCallback(
        (key: TranslationKey): string => {
            return (translations[language] as Record<string, string>)[key] ?? (translations['en'] as Record<string, string>)[key] ?? key;
        },
        [language]
    );

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
