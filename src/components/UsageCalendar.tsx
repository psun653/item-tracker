import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UsageLog } from '../types';

interface UsageCalendarProps {
    logs: UsageLog[];
    purchaseDate: string;
    expirationDate?: string;
    colors: any;
    t: (key: any) => string;
    onDatePress?: (date: Date) => void;
}

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function UsageCalendar({ logs, purchaseDate, expirationDate, colors, t, onDatePress }: UsageCalendarProps) {
    const pDate = new Date(purchaseDate);
    const eDate = expirationDate ? new Date(expirationDate) : null;
    const [viewDate, setViewDate] = useState(new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startWeekday = firstDayOfMonth.getDay();

    const monthName = viewDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });

    // Usage map for current month
    const usageMap = new Set(
        logs
            .filter(l => {
                const d = new Date(l.date);
                return d.getFullYear() === year && d.getMonth() === month;
            })
            .map(l => new Date(l.date).getDate())
    );

    const handlePrev = () => setViewDate(new Date(year, month - 1, 1));
    const handleNext = () => setViewDate(new Date(year, month + 1, 1));
    const handleGoToPurchase = () => setViewDate(new Date(pDate.getFullYear(), pDate.getMonth(), 1));

    const today = new Date();
    const isToday = (day: number) =>
        today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

    const isPurchaseDay = (day: number) =>
        pDate.getFullYear() === year && pDate.getMonth() === month && pDate.getDate() === day;

    const isExpirationDay = (day: number) =>
        eDate && eDate.getFullYear() === year && eDate.getMonth() === month && eDate.getDate() === day;

    const renderDays = () => {
        const days = [];
        // Empty slots for start weekday
        for (let i = 0; i < startWeekday; i++) {
            days.push(<View key={`empty-${i}`} style={styles.dayBox} />);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const hasUsed = usageMap.has(d);
            const todayActive = isToday(d);
            const purchaseActive = isPurchaseDay(d);
            const expirationActive = isExpirationDay(d);

            days.push(
                <TouchableOpacity
                    key={`day-${d}`}
                    style={styles.dayBox}
                    onPress={() => onDatePress?.(new Date(year, month, d))}
                    disabled={!onDatePress}
                    activeOpacity={0.6}
                >
                    <View style={[
                        styles.dayCircle,
                        hasUsed && { backgroundColor: colors.primary },
                        purchaseActive && !hasUsed && { borderColor: colors.accent, borderWidth: 1 },
                        expirationActive && { borderColor: colors.danger, borderWidth: 1, borderStyle: 'dotted' }
                    ]}>
                        <Text style={[
                            styles.dayText,
                            { color: hasUsed ? '#FFF' : colors.textPrimary },
                            purchaseActive && !hasUsed && { color: colors.accent }
                        ]}>
                            {d}
                        </Text>
                        {todayActive && (
                            <View style={[
                                styles.dot,
                                { backgroundColor: hasUsed ? '#FFF' : colors.primary }
                            ]} />
                        )}
                    </View>
                </TouchableOpacity>
            );
        }
        return days;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handlePrev} style={styles.navBtn}>
                    <Text style={[styles.navText, { color: colors.primary }]}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGoToPurchase}>
                    <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>{monthName}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNext} style={styles.navBtn}>
                    <Text style={[styles.navText, { color: colors.primary }]}>›</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
                {DAYS_OF_WEEK.map((d, i) => (
                    <Text key={i} style={[styles.weekText, { color: colors.textMuted }]}>{d}</Text>
                ))}
            </View>

            <View style={styles.daysGrid}>
                {renderDays()}
            </View>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.smallCircle, { backgroundColor: colors.primary, borderWidth: 0 }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Used</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: colors.primary, position: 'relative', bottom: 0 }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Today</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.smallCircle, { borderColor: colors.accent }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>Purchased</Text>
                </View>
                {expirationDate && (
                    <View style={styles.legendItem}>
                        <View style={[styles.smallCircle, { borderColor: colors.danger, borderStyle: 'dotted' }]} />
                        <Text style={[styles.legendText, { color: colors.textSecondary }]}>Expired</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    navBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navText: {
        fontSize: 24,
        fontWeight: '300',
    },
    monthTitle: {
        fontSize: 15,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '700',
        opacity: 0.5,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayBox: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    dayCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    dayText: {
        fontSize: 12,
        fontWeight: '400',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        position: 'absolute',
        bottom: 2,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(150,150,150,0.1)',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '500',
    },
    smallCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1,
    },
});
