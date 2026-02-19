import React, { useState, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import { SimpleLineChart } from '../components/SimpleLineChart';
import { costPerUse, dailyHoldingCost } from '../utils/calculations';
import { useLanguage } from '../context/LanguageContext';
import { ScreenBackground } from '../components/ScreenBackground';

type TimeRange = '1W' | '1M' | '3M' | '1Y' | 'All';

export default function StatisticsScreen() {
    const navigation = useNavigation<any>();
    const { colors, isDark, setThemeMode } = useTheme();
    const { t, language } = useLanguage();

    const store = useStore();
    const items = store?.items || [];
    const usageLogs = store?.usageLogs || [];

    const [timeRange, setTimeRange] = useState<TimeRange>('1W');
    const viewShotRef = useRef<View>(null);

    // --- Chart Data ---
    const chartData = useMemo(() => {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const data: { label: string; value: number; startDate: Date; endDate: Date; event?: string }[] = [];
        let daysToLookBack = 7;

        switch (timeRange) {
            case '1W': daysToLookBack = 7; break;
            case '1M': daysToLookBack = 30; break;
            case '3M': daysToLookBack = 90; break;
            case '1Y': daysToLookBack = 365; break;
            case 'All': daysToLookBack = 365; break;
        }

        let binCount = 7;
        if (timeRange === '1M') binCount = 15;
        if (timeRange === '3M') binCount = 12;
        if (timeRange === '1Y') binCount = 12;
        if (timeRange === 'All') binCount = 12;

        const intervalDays = Math.max(1, Math.ceil(daysToLookBack / binCount));

        for (let i = binCount - 1; i >= 0; i--) {
            const endDate = new Date(today);
            endDate.setDate(today.getDate() - (i * intervalDays));
            endDate.setHours(23, 59, 59, 999);

            const startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - intervalDays + 1);
            startDate.setHours(0, 0, 0, 0);

            let vaultTotalCost = 0;
            let vaultTotalDays = 0;

            items.forEach(item => {
                const purchaseDate = new Date(item.purchaseDate);
                if (purchaseDate > endDate) return;

                let effectiveEndDate = endDate;
                if (item.status === 'retired' && item.retiredAt) {
                    const retiredAt = new Date(item.retiredAt);
                    if (retiredAt < endDate) {
                        effectiveEndDate = retiredAt;
                    }
                }

                const diff = effectiveEndDate.getTime() - purchaseDate.getTime();
                const daysHeld = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));

                vaultTotalCost += item.purchasePrice;
                vaultTotalDays += daysHeld;
            });

            const value = vaultTotalDays > 0 ? vaultTotalCost / vaultTotalDays : 0;

            let label = '';
            if (intervalDays === 1) {
                label = endDate.toLocaleDateString('en-US', { weekday: 'short' });
            } else {
                label = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            let event: string | undefined;
            const purchasedItems = items.filter(item => {
                const p = new Date(item.purchaseDate);
                // Check if purchased within this bin's window (inclusive)
                return p >= startDate && p <= endDate;
            });

            if (purchasedItems.length > 0) {
                const first = purchasedItems[0];
                const count = purchasedItems.length;
                if (language === 'zh-CN') {
                    event = `\u8D2D\u5165 ${first.emoji} ${first.name}${count > 1 ? ` \u7B49${count}\u4EF6\u7269\u54C1` : ''}`;
                } else {
                    event = `Purchased ${first.emoji} ${first.name}${count > 1 ? ` +${count - 1} more` : ''}`;
                }
            }

            data.push({ label, value, startDate, endDate, event });
        }
        return data;
    }, [usageLogs, items, timeRange]);

    const handlePointPress = (point: any) => {
        navigation.navigate('InsightDetail', {
            startDate: point.startDate.toISOString(),
            endDate: point.endDate.toISOString(),
            label: point.label
        });
    };

    // --- Lifespan Data ---
    const avgLifespan = useMemo(() => {
        const activeItems = items.filter(i => i.status === 'active');
        if (activeItems.length === 0) return 0;

        const totalDays = activeItems.reduce((acc, item) => {
            const purchase = new Date(item.purchaseDate);
            const now = new Date();
            const diff = Math.max(0, Math.floor((now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24)));
            return acc + diff;
        }, 0);

        return Math.round(totalDays / activeItems.length);
    }, [items]);

    // --- Longest-Held Active Item ---
    const longestHeldItem = useMemo(() => {
        const activeItems = items.filter(i => i.status === 'active');
        if (activeItems.length === 0) return null;
        const now = new Date();
        return activeItems.reduce((best, item) => {
            const days = Math.floor((now.getTime() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
            const bestDays = Math.floor((now.getTime() - new Date(best.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
            return days > bestDays ? item : best;
        });
    }, [items]);

    const longestHeldDays = useMemo(() => {
        if (!longestHeldItem) return 0;
        return Math.floor((new Date().getTime() - new Date(longestHeldItem.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
    }, [longestHeldItem]);

    // --- Usage Ratio Data ---
    const usageStats = useMemo(() => {
        const activeItems = items.filter(i => i.status === 'active');
        const wellUsed = activeItems.filter(i => {
            const count = usageLogs.filter(l => l.itemId === i.id).length;
            return count >= 3;
        }).length;
        const rarelyUsed = activeItems.length - wellUsed;
        return { wellUsed, rarelyUsed, total: activeItems.length };
    }, [items, usageLogs]);

    const handleShare = async () => {
        try {
            const uri = await captureRef(viewShotRef, { format: 'jpg', quality: 0.9 });
            await Share.share({ url: uri, message: 'Check out my minimalist item tracking insights! \uD83D\uDCCA' });
        } catch {
            Alert.alert('Error', 'Failed to generate share image.');
        }
    };

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>
                <ViewShot ref={viewShotRef as any} style={{ flex: 1 }} options={{ format: 'jpg', quality: 0.9 }}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerSide}>
                            <TouchableOpacity onPress={() => setThemeMode(isDark ? 'light' : 'dark')}>
                                <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>{isDark ? '\u263E' : '\u2600'}</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.appTitle, { color: colors.textSecondary, fontSize: language === 'zh-CN' ? 22 : 14 }]}>
                            {t('insights').toUpperCase()}
                        </Text>
                        <View style={styles.headerSide}>
                            <TouchableOpacity style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>\u2709</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Module 1: Time Is Working for You */}
                        <View style={[styles.module, { backgroundColor: colors.surface + '40', borderColor: colors.border }]}>
                            <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>{t('timeIsWorking').toUpperCase()}</Text>

                            <View style={styles.rangeSelectorContainer}>
                                {(['1W', '1M', '3M', '1Y', 'All'] as TimeRange[]).map((range) => (
                                    <TouchableOpacity
                                        key={range}
                                        style={[
                                            styles.rangeBtn,
                                            timeRange === range && { backgroundColor: isDark ? '#334155' : '#E5E5EA' }
                                        ]}
                                        onPress={() => setTimeRange(range)}
                                    >
                                        <Text style={[
                                            styles.rangeText,
                                            { color: timeRange === range ? colors.textPrimary : colors.textMuted }
                                        ]}>{range}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.chartWrapper}>
                                <SimpleLineChart
                                    data={chartData}
                                    height={180}
                                    color="#84a49c"
                                    textColor={colors.textMuted}
                                    showValues={false}
                                    onPointPress={handlePointPress}
                                />
                            </View>
                            <Text style={[styles.moduleCaption, { color: colors.textSecondary }]}>
                                \u201C{t('costOverTime')}\u201D
                            </Text>
                        </View>

                        {/* Module 2: Used, Not Wasted */}
                        <View style={[styles.module, { backgroundColor: colors.surface + '40', borderColor: colors.border }]}>
                            <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>{t('usedNotWasted').toUpperCase()}</Text>

                            <View style={styles.ratioContainer}>
                                <View style={styles.ratioItem}>
                                    <Text style={[styles.ratioValue, { color: colors.textPrimary }]}>{usageStats.wellUsed}</Text>
                                    <Text style={[styles.ratioLabel, { color: colors.textMuted }]}>{t('wellUsed').toUpperCase()}</Text>
                                </View>
                                <View style={styles.ratioDivider} />
                                <View style={styles.ratioItem}>
                                    <Text style={[styles.ratioValue, { color: colors.textPrimary }]}>{usageStats.rarelyUsed}</Text>
                                    <Text style={[styles.ratioLabel, { color: colors.textMuted }]}>{t('rarelyUsed').toUpperCase()}</Text>
                                </View>
                            </View>

                            <Text style={[styles.moduleCaption, { color: colors.textSecondary }]}>
                                \u201C{t('tendToUse')}\u201D
                            </Text>
                        </View>

                        {/* Module 3: Things That Stay */}
                        <View style={[styles.module, { backgroundColor: colors.surface + '40', borderColor: colors.border }]}>
                            <Text style={[styles.moduleTitle, { color: colors.textSecondary }]}>{t('thingsThatStay').toUpperCase()}</Text>

                            <View style={styles.lifespanContent}>
                                <Text style={[styles.lifespanLabel, { color: colors.textSecondary }]}>{t('avgLifespan').toUpperCase()}</Text>
                                <Text style={[styles.lifespanValue, { color: colors.textPrimary }]}>
                                    {avgLifespan} <Text style={{ fontSize: 24, fontWeight: '300', color: colors.primary }}>{language === 'zh-CN' ? '\u65E5' : 'DAYS'}</Text>
                                </Text>
                            </View>

                            {longestHeldItem && (
                                <View style={[styles.longestHeldRow, { borderTopColor: colors.border }]}>
                                    <Text style={[styles.longestHeldText, { color: colors.textSecondary }]}>
                                        {language === 'zh-CN'
                                            ? `\u4F60\u5DF2\u4E0E `
                                            : `You've lived with `}
                                        <Text style={{ color: colors.primary, fontWeight: '700' }}>{longestHeldItem.emoji} {longestHeldItem.name}</Text>
                                        {language === 'zh-CN'
                                            ? ` \u76F8\u4F34 ${longestHeldDays} \u5929\u4E86`
                                            : ` for ${longestHeldDays} days`}
                                    </Text>
                                </View>
                            )}

                            <Text style={[styles.moduleCaption, { color: colors.textSecondary }]}>
                                \u201C{t('ownershipSuccess')}\u201D
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.shareBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={handleShare}
                        >
                            <Text style={[styles.shareBtnText, { color: colors.textPrimary }]}>{t('shareReport').toUpperCase()}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </ViewShot>
            </SafeAreaView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scrollContent: { paddingBottom: 60, paddingTop: 10 },

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

    module: {
        marginHorizontal: 24,
        padding: 30,
        marginBottom: 48, // Increased from 32
        borderRadius: 28, // Slightly more rounded
        borderWidth: 1,
        alignItems: 'center',
    },
    moduleTitle: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 24,
        textTransform: 'uppercase',
        opacity: 0.6,
    },
    moduleCaption: {
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 24,
        fontWeight: '300',
        opacity: 0.6,
        textAlign: 'center',
    },

    rangeSelectorContainer: {
        flexDirection: 'row',
        width: '100%',
        marginBottom: 24,
        justifyContent: 'space-between',
    },
    rangeBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    rangeText: { fontSize: 12, fontWeight: '500' },
    chartWrapper: {
        width: '100%',
        alignItems: 'center',
    },

    ratioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 10,
    },
    ratioItem: {
        alignItems: 'center',
        flex: 1,
    },
    ratioValue: {
        fontSize: 48,
        fontWeight: '200',
        letterSpacing: -1,
    },
    ratioLabel: {
        fontSize: 8,
        letterSpacing: 1.5,
        marginTop: 4,
        fontWeight: '600',
    },
    ratioDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#ccc',
        opacity: 0.2,
        marginHorizontal: 10,
    },

    lifespanContent: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    lifespanLabel: {
        fontSize: 10,
        letterSpacing: 2,
        fontWeight: '600',
        marginBottom: 10,
    },
    lifespanValue: {
        fontSize: 64,
        fontWeight: '100',
        letterSpacing: -2,
    },

    shareBtn: {
        marginHorizontal: 40,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
    },
    shareBtnText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 2,
    },

    longestHeldRow: {
        width: '100%',
        borderTopWidth: 1,
        marginTop: 12,
        paddingTop: 12,
        alignItems: 'center',
    },
    longestHeldText: {
        fontSize: 13,
        fontWeight: '400',
        textAlign: 'center',
        lineHeight: 20,
    },
});
