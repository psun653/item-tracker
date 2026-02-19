import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Item, SortOption } from '../types';
import { useStore } from '../store/useStore';
import { daysSince, costPerUse, dailyHoldingCost, formatCurrency } from '../utils/calculations';
import { useLanguage } from '../context/LanguageContext';

interface ItemCardProps {
    item: Item;
    onPress: () => void;
    themeColors: any;
    isDark: boolean;
    sortOption?: SortOption | null;
}

export function ItemCard({ item, onPress, themeColors, isDark, sortOption }: ItemCardProps) {
    const { t } = useLanguage();
    // FIX: Safe access for store data
    const selector = (s: any) => s.usageLogs;
    const allLogs = useStore(selector) || [];

    // Safety check just in case
    if (!allLogs) return null;

    const usageLogs = allLogs.filter((log: any) => log.itemId === item.id);
    const count = usageLogs.length;
    const days = daysSince(item.purchaseDate);

    // Default colors protection
    const colors = themeColors || {
        surface: isDark ? '#1c1f1f' : '#fff',
        border: isDark ? '#2c3331' : '#E2E8F0',
        textPrimary: isDark ? '#F1F5F9' : '#0F172A',
        textSecondary: isDark ? '#94A3B8' : '#64748B',
        primary: '#84a49c',
        success: '#34C759',
    };

    const isDaily = item.costMethod === 'daily-holding';
    const cpu = costPerUse(item, count);
    const dhc = dailyHoldingCost(item);

    // Determine display based on active sort option
    let countLabel: string;
    let costValue: string;
    let costLabel: string;

    if (sortOption) {
        switch (sortOption) {
            case 'daysHeld':
                countLabel = `${days} ${t('daysHeld').toUpperCase()}`;
                costValue = formatCurrency(dhc, item.currency);
                costLabel = t('costPerDay');
                break;
            case 'totalUses':
                countLabel = `${count} ${t('totalUsesSort').toUpperCase()}`;
                costValue = cpu !== null ? formatCurrency(cpu, item.currency) : '\u2014';
                costLabel = t('costPerUse');
                break;
            case 'purchaseCost':
                countLabel = formatCurrency(item.purchasePrice, item.currency);
                costValue = '';
                costLabel = t('purchasePrice');
                break;
            case 'dailyCost':
                countLabel = `${days} ${t('daysHeld').toUpperCase()}`;
                costValue = formatCurrency(dhc, item.currency);
                costLabel = t('costPerDay');
                break;
            case 'costPerUse':
                countLabel = `${count} ${t('totalUsesSort').toUpperCase()}`;
                costValue = cpu !== null ? formatCurrency(cpu, item.currency) : '\u2014';
                costLabel = t('costPerUse');
                break;
            default:
                countLabel = isDaily
                    ? `${days} ${t('daysHeld').toUpperCase()}`
                    : `${count} ${t('totalUsesSort').toUpperCase()}`;
                costValue = isDaily
                    ? formatCurrency(dhc, item.currency)
                    : (cpu !== null ? formatCurrency(cpu, item.currency) : '\u2014');
                costLabel = isDaily ? t('costPerDay') : t('costPerUse');
        }
    } else {
        // Default: show based on item's costMethod
        costValue = isDaily
            ? formatCurrency(dhc, item.currency)
            : (cpu !== null ? formatCurrency(cpu, item.currency) : '\u2014');
        countLabel = isDaily
            ? `${days} ${t('daysHeld').toUpperCase()}`
            : `${count} ${t('totalUsesSort').toUpperCase()}`;
        costLabel = isDaily ? t('costPerDay') : t('costPerUse');
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Icon Box */}
            <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.iconImage} />
                ) : (
                    <Text style={styles.icon}>{item.emoji}</Text>
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>

                <View style={styles.metaRow}>
                    <Text style={[styles.metaText, { color: sortOption === 'purchaseCost' ? colors.success : colors.textSecondary, fontWeight: sortOption === 'purchaseCost' ? '700' : '300' }]}>{countLabel}</Text>
                    {costValue !== '' && (
                        <>
                            <Text style={[styles.dot, { color: colors.textSecondary }]}>\u2022</Text>
                            <Text style={[styles.metaText, { color: colors.success, fontWeight: '700' }]}>
                                {costValue}
                            </Text>
                        </>
                    )}
                    <Text style={[styles.metaText, { color: colors.textSecondary, marginLeft: 4 }]}>
                        {costLabel.toUpperCase()}
                    </Text>
                </View>
            </View>

        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        // Shadow (simulated)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
    },
    icon: {
        fontSize: 24,
    },
    iconImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    content: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '300', // font-light
        letterSpacing: -0.5, // tracking-tight
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    metaText: {
        fontSize: 10,
        fontWeight: '300', // font-light
        textTransform: 'uppercase',
        letterSpacing: 1.2, // tracking-wider
    },
    dot: {
        fontSize: 8,
        marginHorizontal: 6,
    },
    action: {
        padding: 6,
    },
    editIcon: {
        fontSize: 18,
    },
});
