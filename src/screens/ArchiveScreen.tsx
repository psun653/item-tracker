import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { Typography, Spacing, Radii } from '../constants/theme';
import { EmptyState } from '../components/EmptyState';
import { formatCurrency, costPerUse, dailyHoldingCost } from '../utils/calculations';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ScreenBackground } from '../components/ScreenBackground';

export default function ArchiveScreen() {
    const navigation = useNavigation<any>();
    const { items, usageLogs } = useStore();
    const { colors } = useTheme();
    const { t } = useLanguage();
    const [search, setSearch] = useState('');

    const retiredItems = items
        .filter((i) => i.status === 'retired')
        .filter((i) =>
            search.trim() === '' ||
            i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.category.toLowerCase().includes(search.toLowerCase())
        )
        // Sort by retiredAt (descending), fallback to createdAt
        .sort((a, b) => {
            const dateA = a.retiredAt ? new Date(a.retiredAt).getTime() : new Date(a.createdAt).getTime();
            const dateB = b.retiredAt ? new Date(b.retiredAt).getTime() : new Date(b.createdAt).getTime();
            return dateB - dateA;
        });

    const getRetirementConfig = (reason: string) => {
        const configs: Record<string, { label: string; emoji: string; color: string }> = {
            lost: { label: t('lost'), emoji: '❓', color: colors.warning },
            broken: { label: t('broken'), emoji: '💔', color: colors.danger },
            donated: { label: t('gifted'), emoji: '🎁', color: colors.primary },
            recycled: { label: 'Recycled', emoji: '♻️', color: colors.textSecondary },
            other: { label: 'Other', emoji: '📝', color: colors.textMuted },
            sold: { label: t('sold'), emoji: '💰', color: colors.success },
            gifted: { label: t('gifted'), emoji: '🎁', color: colors.primaryLight },
            stolen: { label: t('stolen'), emoji: '🚨', color: colors.accent },
            expired: { label: t('expired'), emoji: '⏳', color: '#94A3B8' },
        };
        return configs[reason] || configs.other;
    };


    return (
        <ScreenBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={[styles.backText, { color: colors.primary }]}>{t('back')}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>{t('archivedItems')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Search Row */}
                <View style={styles.actionRow}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.inputBg }]}>
                        <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
                        <TextInput
                            style={[styles.searchInput, { color: colors.textPrimary }]}
                            placeholder={t('searchPlaceholder')}
                            placeholderTextColor={colors.textMuted}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                <FlatList
                    data={retiredItems}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const logs = usageLogs.filter((l) => l.itemId === item.id);
                        const count = logs.length;
                        const isSold = item.retirementReason === 'sold';

                        // Stats
                        const avgCostLabel = item.costMethod === 'per-use' ? t('costPerUse') : t('costPerDay');
                        const cpu = costPerUse(item, count);
                        const dhc = dailyHoldingCost(item);

                        const avgCostVal = item.costMethod === 'per-use'
                            ? (cpu !== null ? formatCurrency(cpu, item.currency) : '—')
                            : formatCurrency(dhc, item.currency);

                        const reasonConfig = item.retirementReason ? getRetirementConfig(item.retirementReason) : getRetirementConfig('other');

                        return (
                            <TouchableOpacity
                                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                                activeOpacity={0.7}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={styles.cardTitleRow}>
                                        <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                                            <Text style={styles.emoji}>{item.emoji}</Text>
                                        </View>
                                        <View style={styles.itemText}>
                                            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                                            <Text style={[styles.category, { color: colors.textSecondary }]}>{item.category.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    {reasonConfig && (
                                        <View style={[styles.badge, { backgroundColor: reasonConfig.color + '15' }]}>
                                            <Text style={[styles.badgeText, { color: reasonConfig.color }]}>
                                                {reasonConfig.label.toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                                <View style={styles.statsRow}>
                                    <View style={styles.statCol}>
                                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('purchasePrice').toUpperCase()}</Text>
                                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCurrency(item.purchasePrice, item.currency)}</Text>
                                    </View>
                                    {isSold && (
                                        <View style={styles.statCol}>
                                            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('sold').toUpperCase()}</Text>
                                            <Text style={[styles.statValue, { color: colors.success }]}>{formatCurrency(item.salePrice || 0, item.currency)}</Text>
                                        </View>
                                    )}
                                    <View style={styles.statCol}>
                                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{avgCostLabel.toUpperCase()}</Text>
                                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{avgCostVal}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <EmptyState
                            emoji="🗄️"
                            title={t('noArchivedItems')}
                            subtitle={t('archivedItems')}
                        />
                    }
                />
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
        paddingBottom: Spacing.base,
    },
    backBtn: { padding: Spacing.sm },
    backText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.medium },
    title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    actionRow: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.base,
        paddingBottom: Spacing.base,
        gap: 12,
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        height: 44,
        borderRadius: Radii.sm,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    searchIcon: { marginRight: 8, fontSize: 18 },
    searchInput: { flex: 1, height: '100%', fontSize: 14 },
    list: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },
    card: {
        borderRadius: Radii.md,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, marginRight: Spacing.sm },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: { fontSize: 24 },
    itemText: { flex: 1 },
    name: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.light,
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    category: {
        fontSize: 10,
        fontWeight: Typography.weights.medium,
        letterSpacing: 1.5,
        opacity: 0.6,
    },
    badge: {
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    badgeText: { fontSize: 9, fontWeight: Typography.weights.bold, letterSpacing: 1 },
    divider: { height: 1, marginVertical: Spacing.lg, opacity: 0.5 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statCol: { alignItems: 'flex-start' },
    statLabel: { fontSize: 8, fontWeight: Typography.weights.bold, letterSpacing: 1, marginBottom: 4 },
    statValue: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.light },
});
