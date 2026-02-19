import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface EmptyStateProps {
    emoji: string;
    title: string;
    subtitle?: string;
}

export function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.xxxl,
    },
    emoji: {
        fontSize: 56,
        marginBottom: Spacing.base,
    },
    title: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.semibold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: Typography.sizes.base,
        textAlign: 'center',
        lineHeight: 22,
    },
});
