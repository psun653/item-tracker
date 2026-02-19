import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Item } from '../types';
import { useStore } from '../store/useStore';
import { daysSince, costPerUse, dailyHoldingCost, formatCurrency } from '../utils/calculations';
import { useLanguage } from '../context/LanguageContext';

interface ItemCardProps {
    item: Item;
    onPress: () => void;
    themeColors: any;
    isDark: boolean;
}

export function ItemCard({ item, onPress, themeColors, isDark }: ItemCardProps) {
    const { t } = useLanguage();
    // FIX: Safe access for store data
    const selector = (s: any) => s.usageLogs;
    const allLogs = useStore(selector) || [];

    // Safety check just in case
    if (!allLogs) return null;

    const usageLogs = allLogs.filter((log: any) => log.itemId === item.id);
    const count = usageLogs.length;
    const days = daysSince(item.purchaseDate);

    // Calculate today's uses
    const today = new Date().toDateString();
    const usesToday = usageLogs.filter((l: any) => new Date(l.date).toDateString() === today).length;

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

    const costValue = isDaily
        ? formatCurrency(dhc, item.currency)
        : (cpu !== null ? formatCurrency(cpu, item.currency) : '—');

    const countLabel = isDaily
        ? `${days} ${t('daysHeld').toUpperCase()}`
        : `${count} ${t('totalUsesSort').toUpperCase()}`;

    const costLabel = isDaily ? t('costPerDay') : t('costPerUse');

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
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{countLabel}</Text>
                    <Text style={[styles.dot, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.metaText, { color: colors.success, fontWeight: '700' }]}>
                        {costValue}
                    </Text>
                    <Text style={[styles.metaText, { color: colors.textSecondary, marginLeft: 4, fontSize: 8 }]}>
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
