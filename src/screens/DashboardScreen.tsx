import React, { useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../store/useStore';
import { getZenHero, getZenStats, getRandomZenQuote } from '../utils/zen';
import { ScreenBackground } from '../components/ScreenBackground';

export default function DashboardScreen() {
    const { colors, isDark, setThemeMode } = useTheme();
    const { t, language } = useLanguage();
    // Safety defaults
    const store = useStore() || {};
    const items = store.items || [];
    const usageLogs = store.usageLogs || [];

    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();

    // Translate zen hero metric labels (hardcoded in zen.ts)
    const translateMetricLabel = (label: string) => {
        if (label === 'Total Uses') return t('totalUsesDetail');
        if (label === 'Days Held') return t('daysOwned');
        if (label === 'Last Used') return t('lastUsed');
        return label;
    };

    // Append unit suffix to zen hero metric values
    const getMetricSuffix = (label: string) => {
        const isChinese = language === 'zh-CN';
        if (label === 'Days Held') return isChinese ? ' 日' : ' d';
        if (label === 'Total Uses') return isChinese ? ' 次' : ' x';
        return '';
    };

    // Derive data safely
    const hero = getZenHero(items, usageLogs);
    const stats = getZenStats(items, usageLogs);
    const quote = useMemo(() => getRandomZenQuote(), [hero?.id]);

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>

                {/* Header (Matching standard layout) */}
                <View style={styles.header}>
                    <View style={styles.headerSide}>
                        <TouchableOpacity
                            onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>
                                {isDark ? '☾' : '☀'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.appTitle, { color: colors.textSecondary, fontSize: language === 'zh-CN' ? 22 : 14 }]}>
                        {t('appName').toUpperCase()}
                    </Text>
                    <View style={styles.headerSide}>
                        <TouchableOpacity style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>✉</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.content}>

                    {/* Main Hero Card */}
                    {hero && hero.item ? (
                        <TouchableOpacity
                            style={[
                                styles.heroCard,
                                {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    shadowColor: isDark ? '#000' : '#ccc'
                                }
                            ]}
                            onPress={() => navigation.navigate('ItemDetail', { itemId: hero.item.id })}
                            activeOpacity={0.9}
                        >
                            {/* Icon Circle */}
                            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                                <Text style={styles.heroEmoji}>{hero.item.emoji}</Text>
                            </View>

                            {/* Item Name */}
                            <Text
                                style={[styles.heroItemName, { color: colors.textSecondary }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.5}
                            >
                                {hero.item.name.toUpperCase()}
                            </Text>

                            {/* Metric (Big Number) */}
                            <View style={styles.metricContainer}>
                                <Text style={[styles.heroMetricLabel, { color: colors.primary }]}>
                                    {translateMetricLabel(hero.metricLabel).toUpperCase()}
                                </Text>
                                <Text style={[styles.heroMetricValue, { color: colors.textPrimary }]}>
                                    {hero.metricValue === 'Today' ? t('today') : hero.metricValue}
                                    {getMetricSuffix(hero.metricLabel) !== '' && (
                                        <Text style={{ fontSize: 24, fontWeight: '500', letterSpacing: 3, color: colors.primary }}>
                                            {getMetricSuffix(hero.metricLabel)}
                                        </Text>
                                    )}
                                </Text>
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            {/* Bottom Label (Random Quote) */}
                            <Text style={[styles.heroFooter, { color: colors.textSecondary, textAlign: 'center', lineHeight: 16, maxWidth: '90%' }]}>
                                "{quote.text}"
                                {'\n'}
                                <Text style={{ fontSize: 9, opacity: 0.7, fontWeight: '400' }}>— {quote.author}</Text>
                            </Text>

                        </TouchableOpacity>
                    ) : (
                        <EmptyHero colors={colors} t={t} onAdd={() => navigation.navigate('AddItem')} quote={quote} />
                    )}

                    {/* Secondary Info Grid - Consolidated */}
                    <View style={styles.statsGrid}>
                        <StatBox
                            label={t('active').toUpperCase() + ' ' + t('items').toUpperCase()}
                            value={stats.activeItems}
                            colors={colors}
                        />
                        <StatBox
                            label={t('retired').toUpperCase()}
                            value={stats.retiredItems}
                            colors={colors}
                        />
                    </View>

                </View>
            </SafeAreaView>
        </ScreenBackground>
    );
}

const EmptyHero = ({ colors, t, onAdd, quote }: { colors: any; t: (k: any) => string; onAdd: () => void; quote: any }) => (
    <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: 'center' }]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
            <Text style={{ fontSize: 32 }}>🌱</Text>
        </View>
        <Text style={[styles.heroItemName, { color: colors.textSecondary, marginTop: 16 }]}>{t('noItems').toUpperCase()}</Text>
        <Text style={[styles.heroFooter, { color: colors.textMuted, marginTop: 8, marginBottom: 32 }]}>{t('addFirstItem').toUpperCase()}</Text>

        <TouchableOpacity
            style={[styles.emptyAddBtn, { backgroundColor: colors.primary, marginBottom: 40 }]}
            onPress={onAdd}
        >
            <Text style={[styles.emptyAddBtnText, { color: '#fff' }]}>{t('addNewItem').toUpperCase()}</Text>
        </TouchableOpacity>

        {/* Restore Quote to Empty State */}
        <View style={[styles.divider, { backgroundColor: colors.border, marginBottom: 24, opacity: 0.5 }]} />
        <Text style={[styles.heroFooter, { color: colors.textSecondary, textAlign: 'center', lineHeight: 16, maxWidth: '90%' }]}>
            "{quote.text}"
            {'\n'}
            <Text style={{ fontSize: 9, opacity: 0.7, fontWeight: '400' }}>— {quote.author}</Text>
        </Text>
    </View>
);

const StatBox = ({ label, value, colors }: { label: string, value: string | number, colors: any }) => (
    <View style={[
        styles.statBox,
        {
            backgroundColor: colors.surface + '80', // Transparent opacity
            borderColor: colors.border
        }
    ]}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    safe: { flex: 1 },
    content: {
        padding: 24,
        alignItems: 'center', // Center content like HTML main tag
        paddingBottom: 100
    },

    // Header
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
        letterSpacing: 3, // tracking-[0.2em]
        textTransform: 'uppercase',
        flex: 1,
        textAlign: 'center',
    },

    // Hero Card
    heroCard: {
        width: '100%',
        minHeight: 460, // Fixed height to prevent layout jumping
        borderRadius: 20, // rounded-xl
        padding: 30, // Reduced from 40
        alignItems: 'center',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 24, // Reduced from 48
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    heroEmoji: { fontSize: 40 },
    heroItemName: {
        fontSize: 14,
        fontWeight: '300',
        letterSpacing: 4, // tracking-[0.4em]
        marginBottom: 8,
    },
    metricContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    heroMetricValue: {
        fontSize: 84, // Reduced from 96 for single-page fit
        fontWeight: '100', // font-thin
        letterSpacing: -4, // tracking-tighter
        lineHeight: 120,
        fontVariant: ['tabular-nums'],
    },
    heroMetricLabel: {
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 3, // tracking-[0.3em]
        marginTop: 8,
    },
    divider: {
        width: 64,
        height: 1,
        marginBottom: 32,
    },
    heroFooter: {
        fontSize: 11, // Slightly smaller
        fontWeight: '400',
        letterSpacing: 0.5,
        fontStyle: 'italic',
        opacity: 0.9,
    },

    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
        marginBottom: 16,
    },
    statBox: {
        flex: 1,
        padding: 24,
        borderRadius: 12, // rounded-lg
        borderWidth: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        letterSpacing: 2, // tracking-widest
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 24, // text-xl
        fontWeight: '300', // font-light
    },
    emptyAddBtn: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyAddBtnText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
});
