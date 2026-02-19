import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { Typography, Spacing, Radii, CATEGORY_EMOJIS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { ScreenBackground } from '../components/ScreenBackground';

export default function CategoriesScreen() {
    const { categories, addCategory, deleteCategory, items } = useStore();
    const { colors } = useTheme();
    const [newName, setNewName] = useState('');

    const handleAdd = () => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
            Alert.alert('Duplicate', 'A category with that name already exists.');
            return;
        }
        addCategory(trimmed);
        setNewName('');
    };

    const handleDelete = (id: string, name: string) => {
        const inUse = items.some((i) => i.category === name);
        Alert.alert(
            'Delete Category',
            inUse
                ? `"${name}" is used by some items. Deleting it won't remove those items, but they'll show the old category name.`
                : `Delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(id) },
            ]
        );
    };

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Categories</Text>
                </View>

                {/* Add new */}
                <View style={styles.addRow}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.textPrimary, borderColor: colors.border }]}
                        placeholder="New category name..."
                        placeholderTextColor={colors.textMuted}
                        value={newName}
                        onChangeText={setNewName}
                        onSubmitEditing={handleAdd}
                        returnKeyType="done"
                    />
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={handleAdd}>
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={categories}
                    keyExtractor={(c) => c.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item: cat }) => {
                        const count = items.filter((i) => i.category === cat.name).length;
                        return (
                            <View style={[styles.catRow, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                                <View style={styles.catInfo}>
                                    <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat.name}</Text>
                                    <Text style={[styles.catCount, { color: colors.textMuted }]}>{count} item{count !== 1 ? 's' : ''}</Text>
                                </View>
                                {!cat.isDefault && (
                                    <TouchableOpacity onPress={() => handleDelete(cat.id, cat.name)}>
                                        <Text style={[styles.deleteBtn, { color: colors.danger }]}>✕</Text>
                                    </TouchableOpacity>
                                )}
                                {cat.isDefault && (
                                    <Text style={[styles.defaultBadge, { color: colors.primary, backgroundColor: colors.primary + '20' }]}>Default</Text>
                                )}
                            </View>
                        );
                    }}
                />
            </SafeAreaView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
    title: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.heavy },
    addRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: Spacing.base },
    input: {
        flex: 1,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        fontSize: Typography.sizes.base,
        borderWidth: 1,
    },
    addBtn: {
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.base,
        justifyContent: 'center',
    },
    addBtnText: { color: '#fff', fontWeight: Typography.weights.bold, fontSize: Typography.sizes.base },
    list: { paddingHorizontal: Spacing.base },
    catRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: Radii.lg,
        padding: Spacing.base,
        marginBottom: Spacing.sm,
        borderWidth: 1,
    },
    catInfo: { flex: 1 },
    catName: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold },
    catCount: { fontSize: Typography.sizes.xs, marginTop: 2 },
    deleteBtn: { fontSize: Typography.sizes.md, paddingHorizontal: Spacing.sm },
    defaultBadge: {
        fontSize: Typography.sizes.xs,
        fontWeight: Typography.weights.semibold,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radii.full,
    },
});
