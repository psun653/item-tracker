import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform,
    Switch, // Keep Switch as it might be used in other parts not shown in diff
    Modal,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { RETIREMENT_CONFIG } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import {
    formatCurrency,
    formatCostLabel,
    daysSince,
    costPerUse,
    dailyHoldingCost,
    netCost,
    recoveryRate,
} from '../utils/calculations';
import UsageCalendar from '../components/UsageCalendar';
import { ScreenBackground } from '../components/ScreenBackground';

export default function ItemDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { itemId } = route.params;
    const { colors } = useTheme();
    const { t, isChinese } = useLanguage();

    const { items, usageLogs, addUsageLog, deleteUsageLog, deleteItem, updateItem, categories } = useStore();
    const item = items.find((i) => i.id === itemId);

    // Logging State
    const [logNote, setLogNote] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [detailEvent, setDetailEvent] = useState<{ date: Date; type: 'purchase' | 'usage' | 'expiration'; notes?: string } | null>(null);
    const [logConfirmationDate, setLogConfirmationDate] = useState<Date | null>(null);


    if (!item) {
        return (
            <ScreenBackground>
                <SafeAreaView style={styles.safe}>
                    <Text style={{ color: colors.textPrimary, padding: 20 }}>Item not found.</Text>
                </SafeAreaView>
            </ScreenBackground>
        );
    }

    const itemLogs = usageLogs
        .filter((l) => l.itemId === item.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const count = itemLogs.length;
    const days = daysSince(item.purchaseDate);
    const costLabel = formatCostLabel(item, count);
    const isRetired = item.status === 'retired';
    const isDailyHolding = item.costMethod === 'daily-holding';

    const cpuVal = costPerUse(item, count);
    const dhcVal = dailyHoldingCost(item);
    const netVal = netCost(item);
    const recovery = recoveryRate(item);

    // Find category for display
    const category = categories.find(cat => cat.id === item.category);


    const handleDatePress = (date: Date) => {
        const dateStr = date.toDateString();
        const year = date.getFullYear();
        const month = date.getMonth();
        const d = date.getDate();

        // Check for events
        const isPurchase = new Date(item.purchaseDate).toDateString() === dateStr;
        const isExpiration = item.expirationDate && new Date(item.expirationDate).toDateString() === dateStr;
        const logsOnDate = itemLogs.filter(l => new Date(l.date).toDateString() === dateStr);

        if (isPurchase) {
            setDetailEvent({ date, type: 'purchase' });
        } else if (isExpiration) {
            setDetailEvent({ date, type: 'expiration' });
        } else if (logsOnDate.length > 0) {
            setDetailEvent({ date, type: 'usage', notes: logsOnDate[0].notes });
        } else {
            setLogConfirmationDate(date);
        }
    };

    const handleSaveEdit = () => {
        navigation.navigate('AddItem', { itemId: item.id });
    };

    const handleDelete = () => {
        Alert.alert('Delete Item', `Delete "${item.name}" and all its usage history?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    deleteItem(item.id);
                    navigation.goBack();
                },
            },
        ]);
    };

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>
                <ScrollView style={styles.content}>
                    {/* Header: Back - Edit */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={[styles.back, { color: colors.primary }]}>{t('back')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('AddItem', { itemId: item.id })}>
                            <Text style={[styles.editBtn, { color: colors.primary }]}>{t('edit')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Centered Hero section with fixed height for stability */}
                    <View style={styles.hero}>
                        <View style={styles.heroMediaContainer}>
                            {item.imageUri ? (
                                <Image source={{ uri: item.imageUri }} style={styles.heroImage} />
                            ) : (
                                <Text style={styles.heroEmoji}>{item.emoji}</Text>
                            )}
                        </View>
                        <View style={styles.heroTextContainer}>
                            <Text style={[styles.heroName, { color: colors.textPrimary }]}>{item.name}</Text>
                            <Text style={[styles.heroCategory, { color: colors.primary }]}>
                                {category ? (isChinese ? category.nameZh : category.nameEn) : t('uncategorized')}
                                {item.status === 'retired' && ` • ${t('retired')}`}
                            </Text>
                        </View>
                    </View>

                    {/* Stats grid — tailored per cost method */}
                    {isDailyHolding ? (
                        <View style={styles.statsGrid}>
                            <StatBox label={t('purchasePrice')} value={formatCurrency(item.purchasePrice, item.currency)} colors={colors} />
                            <StatBox label={t('daysOwned')} value={String(days)} colors={colors} />
                            <StatBox label={t('costPerDay')} value={formatCurrency(dhcVal, item.currency)} highlight fullWidth colors={colors} />
                        </View>
                    ) : (
                        <View style={styles.statsGrid}>
                            <StatBox label={t('purchasePrice')} value={formatCurrency(item.purchasePrice, item.currency)} colors={colors} />
                            <StatBox label={t('daysOwned')} value={String(days)} colors={colors} />
                            <StatBox label={t('totalUsesDetail')} value={String(count)} colors={colors} />
                            <StatBox label={t('costPerUse')} value={cpuVal !== null ? formatCurrency(cpuVal, item.currency) : '—'} highlight colors={colors} />
                        </View>
                    )}

                    {/* Usage history — TIGHTER */}
                    {!isDailyHolding && (
                        <View style={{ marginBottom: 4 }}>
                            <UsageCalendar
                                logs={itemLogs}
                                purchaseDate={item.purchaseDate}
                                expirationDate={item.expirationDate}
                                colors={colors}
                                t={t}
                                onDatePress={handleDatePress}
                            />
                        </View>
                    )}

                    {/* Notes Section — Show only if notes exist */}
                    {item.notes && item.notes.trim().length > 0 && (
                        <View style={[styles.notesCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                            <Text style={[styles.notesTitle, { color: colors.textSecondary }]}>{t('notes')}</Text>
                            <Text style={[styles.notesText, { color: colors.textPrimary }]}>{item.notes}</Text>
                        </View>
                    )}

                    {/* Actions (Retire) */}
                    {item.status === 'active' ? (
                        <TouchableOpacity
                            style={[
                                styles.retireBtn,
                                { backgroundColor: colors.surfaceElevated, borderColor: colors.danger, marginTop: 8 }
                            ]}
                            onPress={() => navigation.navigate('RetireItem', { itemId: item.id })}
                        >
                            <Text style={[styles.retireBtnText, { color: colors.danger }]}>{t('retireItem').toUpperCase()}</Text>
                        </TouchableOpacity>
                    ) : (
                        item.retirementReason === 'sold' && item.salePrice != null && (
                            <View style={[styles.soldCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.success + '40', marginTop: 12 }]}>
                                <Text style={[styles.soldTitle, { color: colors.success }]}>{t('saleSummary')}</Text>
                                <View style={styles.soldRow}>
                                    <View style={styles.soldItem}>
                                        <Text style={[styles.soldLabel, { color: colors.textSecondary }]}>{t('salePrice')}</Text>
                                        <Text style={[styles.soldValue, { color: colors.textPrimary }]}>{formatCurrency(item.salePrice, item.currency)}</Text>
                                    </View>
                                    <View style={styles.soldItem}>
                                        <Text style={[styles.soldLabel, { color: colors.textSecondary }]}>{t('netCost')}</Text>
                                        <Text style={[styles.soldValue, { color: colors.textPrimary }]}>{formatCurrency(item.purchasePrice - item.salePrice, item.currency)}</Text>
                                    </View>
                                </View>
                            </View>
                        )
                    )}
                </ScrollView>

                {/* Event Detail Modal */}
                <Modal visible={!!detailEvent} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface, width: '80%' }]}>
                            <Text style={[styles.modalTitle, { color: colors.textSecondary }]}>
                                {detailEvent?.date.toLocaleDateString()}
                            </Text>
                            <Text style={[styles.eventLabel, { color: colors.textPrimary }]}>
                                {detailEvent?.type === 'purchase' ? t('purchaseDate') : detailEvent?.type === 'expiration' ? t('expirationDate') : t('usageLog')}
                            </Text>
                            {detailEvent?.notes && (
                                <Text style={[styles.eventNote, { color: colors.textSecondary }]}>"{detailEvent.notes}"</Text>
                            )}
                            <TouchableOpacity
                                style={[styles.modalCloseBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
                                onPress={() => setDetailEvent(null)}
                            >
                                <Text style={styles.modalCloseText}>{t('close')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Usage Log Confirmation Modal */}
                <Modal visible={!!logConfirmationDate} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.surface, width: '85%' }]}>
                            <Text style={[styles.logConfirmPrompt, { color: colors.textPrimary }]}>
                                {t('logUsePromptPrefix')}
                                <Text style={{ color: colors.success, fontWeight: '700' }}>
                                    {logConfirmationDate ? `${logConfirmationDate.getFullYear()}/${String(logConfirmationDate.getMonth() + 1).padStart(2, '0')}/${String(logConfirmationDate.getDate()).padStart(2, '0')}` : ''}
                                </Text>
                                {t('logUsePromptSuffix')}
                            </Text>

                            <View style={styles.modalBtns}>
                                <TouchableOpacity
                                    style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                                    onPress={() => setLogConfirmationDate(null)}
                                >
                                    <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalAddBtn, { backgroundColor: colors.primary }]}
                                    onPress={() => {
                                        if (logConfirmationDate) {
                                            addUsageLog(item.id, undefined, logConfirmationDate.toISOString());
                                            setLogConfirmationDate(null);
                                        }
                                    }}
                                >
                                    <Text style={styles.modalAddText}>{t('confirm')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView >
        </ScreenBackground>
    );
}

function StatBox({ label, value, highlight, fullWidth, colors }: { label: string; value: string; highlight?: boolean; fullWidth?: boolean; colors: any }) {
    const bg = highlight ? (colors.primary + '15') : colors.surfaceElevated;
    const border = highlight ? colors.primary : colors.border;
    const valColor = highlight ? colors.primary : colors.textPrimary;

    return (
        <View style={[statStyles.box, { backgroundColor: bg, borderColor: border }, fullWidth && statStyles.boxFull]}>
            <Text style={[statStyles.value, { color: valColor }]}>{value}</Text>
            <Text style={[statStyles.label, { color: colors.textSecondary }]}>{label}</Text>
        </View>
    );
}

function Row({ label, value, highlight, colors }: { label: string; value: string; highlight?: boolean; colors: any }) {
    return (
        <View style={rowStyles.row}>
            <Text style={[rowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[
                rowStyles.value,
                { color: colors.textPrimary },
                highlight && { color: colors.success, fontWeight: 'bold' }
            ]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    content: { flex: 1, padding: 20, paddingTop: 10, paddingBottom: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
    back: { fontSize: 16, fontWeight: '500' },
    deleteBtn: { fontSize: 14, fontWeight: '500' },
    editBtn: { fontSize: 14, fontWeight: '500' },
    saveBtn: { fontSize: 14, fontWeight: '600' },

    // Notes
    notesCard: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    notesTitle: {
        fontSize: 10,
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
        opacity: 0.6,
    },
    notesText: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '300',
    },

    // Hero (Centered & Dense)
    hero: { alignItems: 'center', marginBottom: 16, marginTop: -8 },
    heroMediaContainer: { height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    heroImage: { width: 80, height: 80, borderRadius: 16 },
    heroEmoji: { fontSize: 50 },
    heroTextContainer: { alignItems: 'center' },
    heroName: { fontSize: 24, fontWeight: '300', letterSpacing: -0.5, marginBottom: 2 },
    heroCategory: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600', opacity: 0.6 },

    // Stats Grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },

    // Sold Card
    soldCard: {
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    soldTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    soldRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    soldItem: { flex: 1 },
    soldLabel: { fontSize: 10, textTransform: 'uppercase', marginBottom: 2, opacity: 0.6 },
    soldValue: { fontSize: 14, fontWeight: '600' },
    metricCardActive: {},
    metricLabel: { fontSize: 11, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5, fontWeight: '600', opacity: 0.8 },
    metricValue: { fontSize: 24, fontWeight: '300', letterSpacing: -0.5 },
    metricSub: { fontSize: 12, marginTop: 6, textAlign: 'center', opacity: 0.7 },

    // Actions
    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    logBtn: {
        flex: 2,
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    logBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
    retireBtn: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    retireBtnText: { fontWeight: '600', fontSize: 14 },

    // Log Input
    logInputCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
    },
    logInput: {
        fontSize: 16,
        marginBottom: 16,
        borderBottomWidth: 1,
        paddingBottom: 8,
    },
    logConfirmBtn: {
        borderRadius: 999,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    logConfirmText: { color: '#fff', fontWeight: 'bold' },

    // Section Titles
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 16,
        marginTop: 8,
        opacity: 0.6,
    },
    noLogs: { textAlign: 'center', marginTop: 32, fontSize: 14, opacity: 0.6 },

    // Date/Modals
    dateToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        opacity: 0.8,
    },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateToggleLabel: { fontSize: 14 },
    datePickerBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    datePickerText: { fontSize: 13 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    modalCloseBtn: {
        marginTop: 24,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 999,
    },
    modalCloseText: { color: '#fff', fontWeight: 'bold' },
    modalTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: '700' },
    eventIconContainer: { marginBottom: 16 },
    eventLabel: { fontSize: 20, fontWeight: '300', marginBottom: 8 },
    eventNote: { fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },

    // Log Confirmation Specific
    logConfirmPrompt: {
        fontSize: 18,
        fontWeight: '300',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 26,
    },
    modalBtns: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 1,
    },
    modalCancelText: {
        fontWeight: '600',
    },
    modalAddBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 999,
    },
    modalAddText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

const statStyles = StyleSheet.create({
    box: {
        width: '48%',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1.6,
    },
    boxFull: {
        width: '100%',
        aspectRatio: undefined,
        paddingVertical: 16,
    },
    value: { fontSize: 20, fontWeight: '400', marginBottom: 4, textAlign: 'center' },
    label: { fontSize: 11, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 },
});

const rowStyles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    label: { fontSize: 14, opacity: 0.8 },
    value: { fontSize: 14, fontWeight: '500' },
});
