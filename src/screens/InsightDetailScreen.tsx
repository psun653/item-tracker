import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency, costPerUse, dailyHoldingCost } from '../utils/calculations';
import { Typography, Spacing, Radii } from '../constants/theme';
import { ScreenBackground } from '../components/ScreenBackground';

export default function InsightDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { t } = useLanguage();
    const { items, usageLogs } = useStore();

    const [isUseExpanded, setIsUseExpanded] = useState(false);
    const [isDayExpanded, setIsDayExpanded] = useState(false);

    const { startDate: startStr, endDate: endStr } = route.params || {};
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    // Format Title: Feb 12 - Feb 18
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const screenTitle = `${formatDate(startDate)} — ${formatDate(endDate)}`;

    const { useContributors, dayContributors, useTotal, dayTotal, commonCurrency } = useMemo(() => {
        const useList: any[] = [];
        const dayList: any[] = [];
        let uTotal = 0;
        let dTotal = 0;
        let currency = 'USD';

        items.forEach(item => {
            currency = item.currency; // Assume common currency for simplicity, or grab from first
            let itemCost = 0;
            let logCount = 0;

            // 1. Calculate holding cost if active during this timeframe
            if (new Date(item.purchaseDate) <= endDate && (item.status !== 'retired' || (item.retiredAt && new Date(item.retiredAt) >= startDate))) {
                const itemStart = new Date(item.purchaseDate);
                const itemEnd = item.retiredAt ? new Date(item.retiredAt) : endDate;

                const actualStart = startDate > itemStart ? startDate : itemStart;
                const actualEnd = endDate < itemEnd ? endDate : itemEnd;

                if (actualStart < actualEnd) {
                    const diffDays = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) || 1;
                    itemCost += (dailyHoldingCost(item) * diffDays);
                }
            }

            // 2. Count logs in this timeframe
            const logsInPeriod = usageLogs.filter(l => {
                const d = new Date(l.date);
                return l.itemId === item.id && d >= startDate && d <= endDate;
            });
            logCount = logsInPeriod.length;

            if (item.costMethod !== 'daily-holding' && logCount > 0) {
                const totalUses = usageLogs.filter(l => l.itemId === item.id).length;
                const cost = (costPerUse(item, totalUses) || 0) * logCount;
                if (cost > 0) {
                    useList.push({ item, cost, logs: logCount });
                    uTotal += cost;
                }
            } else if (item.costMethod === 'daily-holding' && itemCost > 0) {
                dayList.push({ item, cost: itemCost });
                dTotal += itemCost;
            }
        });

        return {
            useContributors: useList.sort((a, b) => b.cost - a.cost),
            dayContributors: dayList.sort((a, b) => b.cost - a.cost),
            useTotal: uTotal,
            dayTotal: dTotal,
            commonCurrency: currency || 'USD'
        };
    }, [items, usageLogs, startDate, endDate]);

    const renderItem = (c: any) => (
        <TouchableOpacity
            key={c.item.id}
            style={[styles.itemRow, { borderBottomColor: colors.border }]}
            onPress={() => (navigation as any).navigate('ItemDetail', { itemId: c.item.id })}
        >
            <View style={styles.itemMain}>
                <Text style={styles.itemEmoji}>{c.item.emoji}</Text>
                <View style={styles.itemText}>
                    <Text style={[styles.itemName, { color: colors.textPrimary }]}>{c.item.name}</Text>
                    {c.logs && (
                        <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                            {c.logs} {t('usesInPeriod').toLowerCase()}
                        </Text>
                    )}
                </View>
            </View>
            <Text style={[styles.itemCost, { color: colors.textPrimary }]}>
                {formatCurrency(c.cost, c.item.currency)}
            </Text>
        </TouchableOpacity>
    );

    const renderSection = (title: string, data: any[], total: number, currency: string, isExpanded: boolean, onToggle: () => void) => (
        <View style={[styles.sectionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
                    <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                        {data.length} {data.length === 1 ? 'item' : 'items'}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginRight: Spacing.md }}>
                    <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{formatCurrency(total, currency)}</Text>
                    <Text style={[styles.totalLabel, { color: colors.textMuted }]}>{t('total').toUpperCase()}</Text>
                </View>
                <Text style={[styles.toggleIcon, { color: colors.primary }]}>
                    {isExpanded ? '▼' : '▶'}
                </Text>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.sectionContent}>
                    {data.length > 0 ? data.map(renderItem) : (
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noCostsRecord')}</Text>
                    )}
                </View>
            )}
        </View>
    );

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backBtn}>
                        <Text style={[styles.backText, { color: colors.primary }]}>{t('back')}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>{screenTitle}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scroll}>
                    {renderSection(t('perUse'), useContributors, useTotal, commonCurrency, isUseExpanded, () => setIsUseExpanded(!isUseExpanded))}
                    {renderSection(t('dailyHolding'), dayContributors, dayTotal, commonCurrency, isDayExpanded, () => setIsDayExpanded(!isDayExpanded))}
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
        paddingHorizontal: Spacing.base,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backBtn: { padding: Spacing.sm },
    backText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium },
    title: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
    scroll: { padding: Spacing.base, gap: Spacing.base, paddingBottom: 40 },
    sectionCard: {
        borderRadius: Radii.xl,
        borderWidth: 1,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    sectionTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
    sectionCount: { fontSize: Typography.sizes.xs, marginTop: 2 },
    toggleIcon: { fontSize: 16 },
    totalValue: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
    totalLabel: { fontSize: 8, fontWeight: Typography.weights.bold },
    sectionContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    itemMain: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
    itemEmoji: { fontSize: 24 },
    itemText: { flex: 1 },
    itemName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
    itemSub: { fontSize: Typography.sizes.xs },
    itemCost: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
    emptyText: { textAlign: 'center', paddingVertical: Spacing.base, fontSize: Typography.sizes.xs },
});
