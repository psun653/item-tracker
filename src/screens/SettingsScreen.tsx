import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../store/useStore';
import { generateDemoData } from '../utils/demoData';
import { Language } from '../i18n/translations';
import { ScreenBackground } from '../components/ScreenBackground';

export default function SettingsScreen() {
    const { colors, themeMode, setThemeMode, isDark } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const { importData, clearAllData } = useStore();

    const renderThemeOption = (labelKey: 'automatic' | 'lightMode' | 'darkMode', value: 'system' | 'light' | 'dark', icon: string) => {
        const isSelected = themeMode === value;
        return (
            <TouchableOpacity
                style={[
                    styles.optionRow,
                    { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border }
                ]}
                onPress={() => setThemeMode(value)}
                activeOpacity={0.7}
            >
                <View style={styles.optionLeft}>
                    <Text style={styles.optionIcon}>{icon}</Text>
                    <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{t(labelKey)}</Text>
                </View>
                {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                        <Text style={styles.checkIcon}>✓</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderLanguageOption = (label: string, nativeLabel: string, value: Language, flag: string) => {
        const isSelected = language === value;
        return (
            <TouchableOpacity
                style={[
                    styles.optionRow,
                    { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border }
                ]}
                onPress={() => setLanguage(value)}
                activeOpacity={0.7}
            >
                <View style={styles.optionLeft}>
                    <Text style={styles.optionIcon}>{flag}</Text>
                    <View>
                        <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{label}</Text>
                        <Text style={[styles.optionSublabel, { color: colors.textMuted }]}>{nativeLabel}</Text>
                    </View>
                </View>
                {isSelected && (
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                        <Text style={styles.checkIcon}>✓</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const handleGenerateDemo = () => {
        Alert.alert(
            t('generateDemoTitle'),
            t('generateDemoMsg'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('generate'),
                    onPress: () => {
                        const { items: newItems, logs } = generateDemoData();
                        importData(newItems, logs);
                        Alert.alert('✓', t('demoSuccess'));
                    }
                }
            ]
        );
    };

    const handleClearData = () => {
        Alert.alert(
            t('clearDataConfirm'),
            t('clearDataMsg'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('clearAllData'),
                    style: 'destructive',
                    onPress: async () => {
                        await clearAllData();
                        Alert.alert('✓', t('clearDataSuccess'));
                    }
                }
            ]
        );
    };

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.header}>
                    <View style={styles.headerSide}>
                        <TouchableOpacity onPress={() => setThemeMode(isDark ? 'light' : 'dark')}>
                            <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>{isDark ? '☾' : '☀'}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.appTitle, { color: colors.textSecondary, fontSize: language === 'zh-CN' ? 22 : 14 }]}>
                        {t('settings').toUpperCase()}
                    </Text>
                    <View style={styles.headerSide}>
                        <TouchableOpacity style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>✉</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('appearance').toUpperCase()}</Text>
                    {renderThemeOption('automatic', 'system', '🌓')}
                    {renderThemeOption('lightMode', 'light', '☀')}
                    {renderThemeOption('darkMode', 'dark', '☾')}

                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('language').toUpperCase()}</Text>
                    {renderLanguageOption('English', 'English', 'en', '🇺🇸')}
                    {renderLanguageOption('中文', '简体中文', 'zh-CN', '🇨🇳')}

                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('data').toUpperCase()}</Text>
                    <TouchableOpacity
                        style={[styles.dangerButton, { borderColor: colors.border }]}
                        onPress={handleGenerateDemo}
                    >
                        <Text style={[styles.dangerButtonText, { color: colors.primary }]}>{t('loadDemoData').toUpperCase()}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.dangerButton, { borderColor: colors.danger + '40' }]}
                        onPress={handleClearData}
                    >
                        <Text style={[styles.dangerButtonText, { color: colors.danger }]}>{t('clearAllData').toUpperCase()}</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        marginBottom: 24,
    },
    headerSide: {
        width: 44,
        justifyContent: 'center',
    },
    menuIcon: { fontSize: 24 },
    appTitle: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 3,
        textTransform: 'uppercase',
        flex: 1,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 2,
        marginTop: 24,
        marginBottom: 12,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionIcon: {
        fontSize: 20,
        marginRight: 16,
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    optionSublabel: {
        fontSize: 12,
        marginTop: 2,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkIcon: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    dangerButton: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        marginTop: 12,
    },
    dangerButtonText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
