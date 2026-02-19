import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SortOption, SortDirection } from '../types';
import { Typography, Spacing, Radii } from '../constants/theme';

interface SortModalProps {
    visible: boolean;
    onClose: () => void;
    currentOption: SortOption | null;
    currentDirection: SortDirection;
    onSelect: (option: SortOption | null, direction: SortDirection) => void;
    colors: any;
    t: (key: any) => string;
}

export default function SortModal({ visible, onClose, currentOption, currentDirection, onSelect, colors, t }: SortModalProps) {
    const options: { labelKey: string; option: SortOption }[] = [
        { labelKey: 'daysHeld', option: 'daysHeld' },
        { labelKey: 'totalUsesSort', option: 'totalUses' },
        { labelKey: 'purchaseCost', option: 'purchaseCost' },
        { labelKey: 'dailyCost', option: 'dailyCost' },
        { labelKey: 'costPerUseSort', option: 'costPerUse' },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                <View style={[styles.content, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>{t('sortBy')}</Text>

                    <ScrollView style={styles.optionsList}>
                        {options.map((opt) => (
                            <View key={opt.option} style={styles.optionContainer}>
                                <Text style={[styles.optionLabel, { color: colors.textSecondary }]}>{t(opt.labelKey as any)}</Text>
                                <View style={styles.directionRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.dirBtn,
                                            { borderColor: colors.border },
                                            currentOption === opt.option && currentDirection === 'asc' && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => {
                                            // Toggle off if already selected
                                            if (currentOption === opt.option && currentDirection === 'asc') {
                                                onSelect(null, 'asc');
                                            } else {
                                                onSelect(opt.option, 'asc');
                                            }
                                            onClose();
                                        }}
                                    >
                                        <Text style={[
                                            styles.dirText,
                                            { color: colors.textPrimary },
                                            currentOption === opt.option && currentDirection === 'asc' && { color: '#FFF' }
                                        ]}>
                                            {t('sortAZ')}
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.dirBtn,
                                            { borderColor: colors.border },
                                            currentOption === opt.option && currentDirection === 'desc' && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => {
                                            // Toggle off if already selected
                                            if (currentOption === opt.option && currentDirection === 'desc') {
                                                onSelect(null, 'desc');
                                            } else {
                                                onSelect(opt.option, 'desc');
                                            }
                                            onClose();
                                        }}
                                    >
                                        <Text style={[
                                            styles.dirText,
                                            { color: colors.textPrimary },
                                            currentOption === opt.option && currentDirection === 'desc' && { color: '#FFF' }
                                        ]}>
                                            {t('sortZA')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
                        <Text style={styles.closeBtnText}>{t('done')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject },
    content: { width: '85%', borderRadius: Radii.xl, padding: Spacing.xl, maxHeight: '80%' },
    title: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, marginBottom: Spacing.lg, textAlign: 'center' },
    optionsList: { marginBottom: Spacing.lg },
    optionContainer: { marginBottom: Spacing.lg },
    optionLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, textTransform: 'uppercase', marginBottom: Spacing.sm, letterSpacing: 0.5 },
    directionRow: { flexDirection: 'row', gap: Spacing.sm },
    dirBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radii.md, borderWidth: 1, alignItems: 'center' },
    dirText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
    closeBtn: { paddingVertical: Spacing.md, borderRadius: Radii.full, alignItems: 'center' },
    closeBtnText: { color: '#FFF', fontWeight: Typography.weights.bold },
});
