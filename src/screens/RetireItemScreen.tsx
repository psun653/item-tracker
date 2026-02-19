import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { Typography, Spacing, Radii, RETIREMENT_CONFIG } from '../constants/theme';
import { RetirementReason } from '../types';
import { formatCurrency, costPerUse, netCost } from '../utils/calculations';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ScreenBackground } from '../components/ScreenBackground';

const REASONS: RetirementReason[] = ['broken', 'sold', 'gifted', 'lost', 'stolen', 'expired'];

export default function RetireItemScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { itemId } = route.params;
    const { colors } = useTheme();
    const { t } = useLanguage();

    const { items, usageLogs, retireItem } = useStore();
    const item = items.find((i) => i.id === itemId);

    const [reason, setReason] = useState<RetirementReason | null>(null);
    const [salePrice, setSalePrice] = useState('');

    if (!item) return null;

    const itemLogs = usageLogs.filter((l) => l.itemId === item.id);
    const count = itemLogs.length;

    const parsedSalePrice = parseFloat(salePrice) || 0;
    const previewNetCost = reason === 'sold' ? Math.max(0, item.purchasePrice - parsedSalePrice) : item.purchasePrice;
    const previewCPU = count > 0 ? previewNetCost / count : null;
    const recovery = item.purchasePrice > 0 ? (parsedSalePrice / item.purchasePrice) * 100 : 0;

    const handleRetire = () => {
        if (!reason) {
            Alert.alert(t('selectReason'), t('pleaseSelectReason'));
            return;
        }
        if (reason === 'sold') {
            const sp = parseFloat(salePrice);
            if (isNaN(sp) || sp < 0) {
                Alert.alert(t('error'), t('invalidSalePrice'));
                return;
            }
        }

        Alert.alert(
            t('retireItemTitle'),
            `${t('retireItemTitle')} "${item.name}"?`,
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('retireItemTitle'),
                    style: 'destructive',
                    onPress: () => {
                        retireItem(item.id, reason, reason === 'sold' ? parseFloat(salePrice) : undefined);
                        navigation.popToTop();
                    },
                },
            ]
        );
    };

    return (
        <ScreenBackground>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <SafeAreaView style={styles.safe} edges={['top']}>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <ScrollView contentContainerStyle={styles.content}>
                            <View style={styles.header}>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                    <Text style={[styles.back, { color: colors.primary }]}>{t('back')}</Text>
                                </TouchableOpacity>
                                <Text style={[styles.title, { color: colors.textPrimary }]}>{t('retireItemTitle')}</Text>
                                <View style={{ width: 50 }} />
                            </View>

                            {/* Item summary */}
                            <View style={styles.itemSummary}>
                                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                                <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
                                <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>{formatCurrency(item.purchasePrice)} · {count} uses</Text>
                            </View>

                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('whatHappened')}</Text>
                            <View style={styles.reasonGrid}>
                                {REASONS.map((r) => {
                                    const cfg = RETIREMENT_CONFIG[r];
                                    return (
                                        <TouchableOpacity
                                            key={r}
                                            style={[
                                                styles.reasonCard,
                                                { backgroundColor: colors.surfaceElevated, borderColor: reason === r ? cfg.color : colors.border },
                                                reason === r && styles.reasonCardActive
                                            ]}
                                            onPress={() => setReason(r)}
                                        >
                                            <Text style={styles.reasonEmoji}>{cfg.emoji}</Text>
                                            <Text style={[styles.reasonLabel, { color: reason === r ? cfg.color : colors.textSecondary }]}>{t(r as any)}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Sale price input */}
                            {reason === 'sold' && (
                                <View style={styles.saleSection}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('salePrice')}</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.textPrimary, borderColor: colors.border }]}
                                        placeholder="e.g. 80.00"
                                        placeholderTextColor={colors.textMuted}
                                        value={salePrice}
                                        onChangeText={setSalePrice}
                                        keyboardType="decimal-pad"
                                        returnKeyType="done"
                                        onSubmitEditing={Keyboard.dismiss}
                                    />

                                    {/* Live preview */}
                                    {parsedSalePrice > 0 && (
                                        <View style={[styles.previewCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.success + '40' }]}>
                                            <Text style={[styles.previewTitle, { color: colors.success }]}>{t('saleSummary')}</Text>
                                            <PreviewRow label={t('purchasePrice')} value={formatCurrency(item.purchasePrice)} colors={colors} />
                                            <PreviewRow label={t('sold')} value={`- ${formatCurrency(parsedSalePrice)}`} colors={colors} />
                                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                            <PreviewRow label={t('netCost')} value={formatCurrency(previewNetCost)} highlight colors={colors} />
                                            <PreviewRow label={t('recoveryRate')} value={`${recovery.toFixed(1)}%`} colors={colors} />
                                            {previewCPU !== null && (
                                                <PreviewRow label={t('adjustedCostPerUse')} value={formatCurrency(previewCPU)} colors={colors} />
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.retireBtn, !reason && styles.retireBtnDisabled, { backgroundColor: colors.danger }]}
                                onPress={handleRetire}
                            >
                                <Text style={styles.retireBtnText}>{t('retireThisItem')}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </TouchableWithoutFeedback>
        </ScreenBackground>
    );
}

function PreviewRow({ label, value, highlight, colors }: { label: string; value: string; highlight?: boolean; colors: any }) {
    return (
        <View style={previewStyles.row}>
            <Text style={[previewStyles.label, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[previewStyles.value, { color: highlight ? colors.success : colors.textPrimary }, highlight && previewStyles.highlight]}>{value}</Text>
        </View>
    );
}

const previewStyles = StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    label: { fontSize: Typography.sizes.sm },
    value: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
    highlight: { fontWeight: Typography.weights.bold },
});

const styles = StyleSheet.create({
    safe: { flex: 1 },
    content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
    back: { fontSize: Typography.sizes.md },
    title: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
    itemSummary: { alignItems: 'center', marginBottom: Spacing.xl },
    itemEmoji: { fontSize: 52, marginBottom: Spacing.sm },
    itemName: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
    itemPrice: { fontSize: Typography.sizes.sm, marginTop: 4 },
    label: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: Spacing.sm,
        marginTop: Spacing.base,
    },
    reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    reasonCard: {
        width: '30%',
        borderRadius: Radii.lg,
        padding: Spacing.base,
        alignItems: 'center',
        borderWidth: 2,
    },
    reasonCardActive: {}, // handled in style prop via borderColor priority
    reasonEmoji: { fontSize: 28, marginBottom: 6 },
    reasonLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold, textAlign: 'center' },
    saleSection: { marginTop: Spacing.base },
    input: {
        borderRadius: Radii.md,
        padding: Spacing.base,
        fontSize: Typography.sizes.base,
        borderWidth: 1,
    },
    previewCard: {
        borderRadius: Radii.lg,
        padding: Spacing.base,
        marginTop: Spacing.base,
        borderWidth: 1,
    },
    previewTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, marginBottom: Spacing.sm },
    divider: { height: 1, marginVertical: Spacing.sm },
    retireBtn: {
        borderRadius: Radii.full,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    retireBtnDisabled: { opacity: 0.4 },
    retireBtnText: { color: '#fff', fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base },
});
