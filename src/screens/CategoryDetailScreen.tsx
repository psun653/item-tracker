import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { Typography, Spacing, Radii } from '../constants/theme';
import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useState } from 'react';
import { SortOption, SortDirection } from '../types';
import SortModal from '../components/SortModal';
import { sortItems } from '../utils/sorting';
import { ScreenBackground } from '../components/ScreenBackground';

export default function CategoryDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { category } = route.params;
    const { items, usageLogs } = useStore();
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();

    const [search, setSearch] = useState('');
    const [sortOption, setSortOption] = useState<SortOption>('daysHeld');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [showSortModal, setShowSortModal] = useState(false);

    const filteredItems = items
        .filter((i) => i.category === category && i.status === 'active')
        .filter((i) =>
            search.trim() === '' ||
            i.name.toLowerCase().includes(search.toLowerCase())
        );

    const sortedItems = sortItems(filteredItems, usageLogs, sortOption, sortDirection);

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={[styles.backText, { color: colors.primary }]}>{t('back')}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>{category}</Text>
                    <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('AddItem', { initialCategory: category })}
                    >
                        <Text style={styles.addBtnText}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Search & Sort Row */}
                <View style={styles.actionRow}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.inputBg || (isDark ? '#1c1f1f' : '#FFF') }]}>
                        <Text style={[styles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
                        <TextInput
                            style={[styles.searchInput, { color: colors.textPrimary }]}
                            placeholder={t('searchPlaceholder')}
                            placeholderTextColor={colors.textMuted}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: colors.inputBg || (isDark ? '#1c1f1f' : '#FFF') }]}
                        onPress={() => setShowSortModal(true)}
                    >
                        <Text style={[styles.btnIcon, { color: colors.textSecondary }]}>📶</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={sortedItems}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <ItemCard
                            item={item}
                            onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
                            isDark={isDark}
                            themeColors={colors}
                        />
                    )}
                    ListEmptyComponent={
                        <EmptyState
                            emoji="📂"
                            title={t('noItems')}
                            subtitle={search ? "No matches found." : `You haven't added any items to ${category} yet.`}
                        />
                    }
                />

                <SortModal
                    visible={showSortModal}
                    onClose={() => setShowSortModal(false)}
                    currentOption={sortOption}
                    currentDirection={sortDirection}
                    onSelect={(opt, dir) => {
                        setSortOption(opt);
                        setSortDirection(dir);
                    }}
                    colors={colors}
                    t={t}
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
    list: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xxxl },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: Radii.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addBtnText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '300',
        marginTop: -2,
    },
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
        borderRadius: Radii.md,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.1)',
    },
    searchIcon: { marginRight: 8, fontSize: 18 },
    searchInput: { flex: 1, height: '100%', fontSize: 14 },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(150,150,150,0.1)',
    },
    btnIcon: { fontSize: 20 },
});
