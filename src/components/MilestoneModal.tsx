import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Typography, Spacing, Radii } from '../constants/theme';
import { MILESTONE_CONFIG } from '../utils/milestones';
import { PendingMilestone } from '../types';
import { useStore } from '../store/useStore';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

interface MilestoneModalProps {
    pending: PendingMilestone[];
    onDismissAll: () => void;
}

export function MilestoneModal({ pending, onDismissAll }: MilestoneModalProps) {
    const { colors } = useTheme();
    const { t, language } = useLanguage();
    const [index, setIndex] = React.useState(0);
    const acknowledgeMilestone = useStore((s) => s.acknowledgeMilestone);
    const scaleAnim = useRef(new Animated.Value(0.7)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // ViewShot ref
    const viewShotRef = useRef<ViewShot>(null);
    const [isSharing, setIsSharing] = useState(false);

    const current = pending[index];

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    }, [index]);

    if (!current) return null;

    const config = MILESTONE_CONFIG[current.milestone];

    const handleCelebrate = () => {
        acknowledgeMilestone(current.item.id, current.milestone);
        if (index + 1 < pending.length) {
            scaleAnim.setValue(0.7);
            opacityAnim.setValue(0);
            setIndex(index + 1);
        } else {
            onDismissAll();
        }
    };

    const handleShare = async () => {
        try {
            setIsSharing(true);
            if (viewShotRef.current?.capture) {
                const uri = await viewShotRef.current.capture();
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri);
                } else {
                    Alert.alert('Sharing not available', 'Sharing is not supported on this device');
                }
            }
        } catch (error) {
            console.error('Share failed', error);
            Alert.alert('Error', 'Failed to share milestone.');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <Modal transparent animationType="fade" visible>
            <View style={styles.overlay}>
                {/* Confetti dots */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <ConfettiDot key={i} index={i} color={config.color} />
                ))}

                <Animated.View
                    style={[styles.cardContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
                >
                    {/* Capture Area */}
                    <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
                        <View style={[styles.card, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                            <Text style={styles.bigEmoji}>{config.emoji}</Text>
                            <Text style={[styles.milestoneLabel, { color: config.color }]}>{config.label}</Text>
                            <Text style={[styles.itemName, { color: colors.textPrimary }]}>{current.item.name}</Text>
                            <Text style={[styles.message, { color: colors.textSecondary }]}>{config.message}</Text>

                            <View style={[styles.tagline, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.taglineText, { color: colors.textMuted }]}>✨ {t('appName')}</Text>
                            </View>
                        </View>
                    </ViewShot>

                    {/* Actions */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: config.color }]}
                            onPress={handleCelebrate}
                        >
                            <Text style={styles.buttonText}>
                                {index + 1 < pending.length ? `Celebrate! (${index + 1}/${pending.length})` : 'Celebrate! 🎉'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.shareBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                            onPress={handleShare}
                            disabled={isSharing}
                        >
                            <Text style={[styles.shareBtnText, { color: colors.textPrimary }]}>{isSharing ? '...' : 'Share 📸'}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

function ConfettiDot({ index, color }: { index: number; color: string }) {
    const anim = useRef(new Animated.Value(0)).current;
    const x = Math.random() * width;
    const delay = Math.random() * 600;
    const size = 6 + Math.random() * 10;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, { toValue: 1, duration: 1200 + Math.random() * 800, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, height + 20] });
    const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });
    const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 * (Math.random() > 0.5 ? 1 : -1)}deg`] });

    const colors = [color, '#FF6B9D', '#FBBF24', '#4ADE80', '#A89BFF'];
    const dotColor = colors[index % colors.length];

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: x,
                top: 0,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: dotColor,
                opacity,
                transform: [{ translateY }, { rotate }],
            }}
        />
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContainer: {
        width: width * 0.85,
        alignItems: 'center',
    },
    card: {
        borderRadius: Radii.xl,
        padding: Spacing.xxl,
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
    },
    bigEmoji: {
        fontSize: 80,
        marginBottom: Spacing.base,
    },
    milestoneLabel: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.bold,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: Spacing.sm,
    },
    itemName: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    message: {
        fontSize: Typography.sizes.base,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.lg,
    },
    tagline: {
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    taglineText: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.medium,
    },
    actionRow: {
        width: '100%',
        marginTop: Spacing.base,
        gap: Spacing.sm,
    },
    button: {
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.bold,
        color: '#000',
    },
    shareBtn: {
        borderRadius: Radii.full,
        paddingVertical: Spacing.md,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
    },
    shareBtnText: {
        fontSize: Typography.sizes.md,
        fontWeight: Typography.weights.semibold,
    },
});
