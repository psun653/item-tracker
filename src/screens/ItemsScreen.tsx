import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
    LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { daysSince } from '../utils/calculations';
import { EmptyState } from '../components/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ItemCard } from '../components/ItemCard';
import SortModal from '../components/SortModal';
import { sortItems } from '../utils/sorting';
import { SortOption, SortDirection, Category } from '../types';
import { ScrollView } from 'react-native';

// type ViewMode = 'items' | 'categories'; // Removed

import { ScreenBackground } from '../components/ScreenBackground';

export default function ItemsScreen() {
    const navigation = useNavigation<any>();
    const { colors, isDark, setThemeMode } = useTheme();
    const { t, language } = useLanguage();
    const { items, categories, addCategory, deleteCategory, usageLogs } = useStore();

    // UI state
    const [selectedCategory, setSelectedCategory] = useState<string | 'all' | 'retired'>('all');
    const [search, setSearch] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Sorting state
    const [sortOption, setSortOption] = useState<SortOption>('daysHeld');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [showSortModal, setShowSortModal] = useState(false);

    // Modal state
    const [showAddCatModal, setShowAddCatModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // --- Items Logic ---
    const filteredItems = items
        .filter((i) => {
            if (selectedCategory === 'retired') return i.status === 'retired';
            if (selectedCategory === 'all') return i.status === 'active';
            return i.status === 'active' && i.category === selectedCategory;
        })
        .filter((i) =>
            search.trim() === '' ||
            i.name.toLowerCase().includes(search.toLowerCase()) ||
            i.category.toLowerCase().includes(search.toLowerCase())
        );

    const sortedItems = sortItems(filteredItems, usageLogs, sortOption, sortDirection);

    // --- Categories Logic ---
    const handleSaveCategory = () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;

        if (editingCategory) {
            // Update
            if (categories.some((c) => c.id !== editingCategory.id && c.name.toLowerCase() === trimmed.toLowerCase())) {
                Alert.alert('Duplicate', 'A category with that name already exists.');
                return;
            }
            useStore.getState().updateCategory(editingCategory.id, trimmed);
        } else {
            // Create
            if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
                Alert.alert('Duplicate', 'A category with that name already exists.');
                return;
            }
            addCategory(trimmed);
        }

        setNewCategoryName('');
        setEditingCategory(null);
        setShowAddCatModal(false);
    };

    const handleLongPressCategory = (cat: Category) => {
        if (cat.isDefault) return;
        setEditingCategory(cat);
        setNewCategoryName(cat.name);
        setShowAddCatModal(true);
    };

    const handleDeleteCategory = (id: string, name: string) => {
        const inUse = items.some((i) => i.category === name);
        Alert.alert(
            'Delete Category',
            inUse
                ? `"${name}" is used by some items. Deleting it won't remove those items.`
                : `Delete "${name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(id) },
            ]
        );
    };

    const filteredCategories = categories.filter(c =>
        search.trim() === '' || c.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleHeaderAddPress = () => {
        navigation.navigate('AddItem');
    };

    const toggleSidebar = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>

                {/* Standard Header */}
                <View style={styles.header}>
                    <View style={styles.headerSide}>
                        <TouchableOpacity onPress={() => setThemeMode(isDark ? 'light' : 'dark')}>
                            <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>{isDark ? '☾' : '☀'}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.appTitle, { color: colors.textSecondary, fontSize: language === 'zh-CN' ? 22 : 14 }]}>
                        {t('items').toUpperCase()}
                    </Text>
                    <View style={styles.headerSide}>
                        <TouchableOpacity style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.menuIcon, { color: colors.textSecondary }]}>✉</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Action Row: Search & Add/Filter */}
                <View style={styles.actionRow}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.inputBg }]}>
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
                        style={[styles.iconBtn, { backgroundColor: colors.primaryLight }]}
                        onPress={() => setShowSortModal(true)}
                    >
                        <Text style={[styles.btnIcon, { color: '#FFF', fontSize: 18 }]}>▽</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: colors.primary }]}
                        onPress={handleHeaderAddPress}
                    >
                        <Text style={[styles.btnIcon, { color: '#FFF' }]}>+</Text>
                    </TouchableOpacity>
                </View>

                {/* Split Content */}
                <View style={styles.splitContent}>
                    {/* Items List (Left Column) */}
                    <View style={styles.mainColumn}>
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
                                    emoji={selectedCategory === 'retired' ? "📦" : "🔍"}
                                    title={t('noItems')}
                                    subtitle={search ? "No matches found." : t('addFirstItem')}
                                />
                            }
                        />
                    </View>

                    {/* Categories Sidebar (Right Column) */}
                    <View style={[
                        styles.sidebar,
                        { borderLeftColor: colors.border },
                        !isSidebarOpen && { width: 0, borderLeftWidth: 0, paddingHorizontal: 0 }
                    ]}>
                        {isSidebarOpen && (
                            <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    style={{ flex: 1, width: '100%' }}
                                    contentContainerStyle={{ alignItems: 'center', paddingTop: 12 }}
                                >
                                    {/* All Gear */}
                                    <TouchableOpacity
                                        style={[styles.sidebarItem, selectedCategory === 'all' && { backgroundColor: colors.primary + '15' }]}
                                        onPress={() => setSelectedCategory('all')}
                                    >
                                        <Text style={[styles.sidebarEmoji]}>🌐</Text>
                                        <Text numberOfLines={2} style={[styles.sidebarLabel, { color: selectedCategory === 'all' ? colors.primary : colors.textSecondary }]}>
                                            {t('allGear')}
                                        </Text>
                                        <Text style={[styles.sidebarCount, { color: selectedCategory === 'all' ? colors.primary : colors.textSecondary }]}>{items.filter(i => i.status === 'active').length}</Text>
                                    </TouchableOpacity>

                                    {/* User Categories */}
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[styles.sidebarItem, selectedCategory === cat.name && { backgroundColor: colors.primary + '15' }]}
                                            onPress={() => setSelectedCategory(cat.name)}
                                            onLongPress={() => handleLongPressCategory(cat)}
                                        >
                                            <Text style={styles.sidebarEmoji}>🏷️</Text>
                                            <Text numberOfLines={2} style={[styles.sidebarLabel, { color: selectedCategory === cat.name ? colors.primary : colors.textSecondary }]}>
                                                {cat.name}
                                            </Text>
                                            <Text style={[styles.sidebarCount, { color: selectedCategory === cat.name ? colors.primary : colors.textSecondary }]}>{items.filter(i => i.category === cat.name && i.status === 'active').length}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <View style={[styles.sidebarDivider, { backgroundColor: colors.border }]} />

                                {/* Sidebar Footer (Fixed) */}
                                <View style={styles.sidebarFooter}>
                                    {/* Retired Items */}
                                    <TouchableOpacity
                                        style={[styles.sidebarItem, selectedCategory === 'retired' && { backgroundColor: colors.primary + '15' }]}
                                        onPress={() => setSelectedCategory('retired')}
                                    >
                                        <Text style={styles.sidebarEmoji}>📦</Text>
                                        <Text numberOfLines={2} style={[styles.sidebarLabel, { color: selectedCategory === 'retired' ? colors.primary : colors.textSecondary }]}>
                                            {t('archive')}
                                        </Text>
                                        <Text style={[styles.sidebarCount, { color: selectedCategory === 'retired' ? colors.primary : colors.textSecondary }]}>{items.filter(i => i.status === 'retired').length}</Text>
                                    </TouchableOpacity>

                                    {/* Add Category */}
                                    <TouchableOpacity
                                        style={styles.sidebarAdd}
                                        onPress={() => {
                                            setEditingCategory(null);
                                            setNewCategoryName('');
                                            setShowAddCatModal(true);
                                        }}
                                    >
                                        <Text style={[styles.sidebarEmoji, { color: colors.primary }]}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                    {/* Side Docking Tab - Centered & Animated */}
                    <TouchableOpacity
                        style={[
                            styles.dockingTab,
                            {
                                backgroundColor: isSidebarOpen ? colors.primary : (isDark ? '#2C2C2E' : '#F2F2F7'),
                                borderColor: colors.border,
                                right: isSidebarOpen ? 60 : 0, // Moves WITH the sidebar
                            }
                        ]}
                        onPress={toggleSidebar}
                        activeOpacity={0.8}
                        hitSlop={{ top: 40, bottom: 40, left: 40, right: 20 }}
                    >
                        <Text style={[styles.dockingIcon, { color: isSidebarOpen ? '#FFF' : colors.textSecondary }]}>
                            {isSidebarOpen ? '》' : '《'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Add Category Modal */}
                <Modal visible={showAddCatModal} transparent animationType="fade">
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <TouchableOpacity
                            style={styles.modalBackdrop}
                            activeOpacity={1}
                            onPress={() => setShowAddCatModal(false)}
                        />
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                {editingCategory ? t('editCategory') : t('addCategory')}
                            </Text>
                            <TextInput
                                style={[
                                    styles.modalInput,
                                    {
                                        backgroundColor: colors.inputBg,
                                        color: colors.textPrimary,
                                        borderColor: colors.border
                                    }
                                ]}
                                placeholder="Ex: Essential"
                                placeholderTextColor={colors.textMuted}
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                                autoFocus
                            />
                            <View style={styles.modalBtns}>
                                <TouchableOpacity
                                    style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                                    onPress={() => {
                                        setShowAddCatModal(false);
                                        setEditingCategory(null);
                                    }}
                                >
                                    <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalAddBtn, { backgroundColor: colors.primary }]}
                                    onPress={handleSaveCategory}
                                >
                                    <Text style={styles.modalAddText}>{editingCategory ? t('update') : t('create')}</Text>
                                </TouchableOpacity>
                            </View>

                            {editingCategory && (
                                <TouchableOpacity
                                    style={[styles.modalDeleteBtn, { marginTop: 16 }]}
                                    onPress={() => {
                                        handleDeleteCategory(editingCategory.id, editingCategory.name);
                                        setShowAddCatModal(false);
                                        setEditingCategory(null);
                                    }}
                                >
                                    <Text style={{ color: '#FF3B30', fontWeight: '600' }}>{t('delete').toUpperCase()}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                {/* Sort Modal */}
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
        paddingHorizontal: 24,
        paddingTop: 20,
        marginBottom: 24,
    },
    headerSide: {
        width: 44,
        justifyContent: 'center',
    },
    menuIcon: { fontSize: 24 },
    appTitle: {
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 3,
        textTransform: 'uppercase',
        flex: 1,
        textAlign: 'center',
    },

    // Top Tabs
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Action Row
    actionRow: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        height: 44,
        borderRadius: 8, // rounded-lg
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    searchIcon: { marginRight: 8, fontSize: 18 },
    searchInput: { flex: 1, height: '100%', fontSize: 14 },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 8, // rounded-lg
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnIcon: { fontSize: 20 },

    list: { paddingHorizontal: 16, paddingBottom: 100 },

    // Item Card (Matching HTML)
    itemCard: {
        padding: 24, // p-6 roughly
        borderRadius: 8, // rounded-lg
        borderWidth: 1,
        marginBottom: 8, // space-y-2
        justifyContent: 'center',
        minHeight: 80,
    },
    itemTitle: {
        fontSize: 20, // text-xl
        fontWeight: '200', // font-extralight
        letterSpacing: -0.5, // tracking-tight
        marginBottom: 4,
    },
    itemMeta: {
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 2, // tracking-widest
        textTransform: 'uppercase',
        opacity: 0.7,
    },


    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: { ...StyleSheet.absoluteFillObject },
    modalContent: {
        borderRadius: 24,
        padding: 24,
        width: '85%',
        alignItems: 'center',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    modalInput: {
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        width: '100%',
        marginBottom: 24,
    },
    modalBtns: { flexDirection: 'row', gap: 16, width: '100%' },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 999,
        borderWidth: 1,
    },
    modalCancelText: { fontWeight: '600' },
    modalAddBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 999,
    },
    modalAddText: { color: '#fff', fontWeight: 'bold' },

    // Split Layout
    splitContent: {
        flex: 1,
        flexDirection: 'row',
    },
    mainColumn: {
        flex: 1,
    },
    sidebar: {
        width: 60,
        borderLeftWidth: 1,
        alignItems: 'center',
    },
    sidebarItem: {
        width: 48,
        paddingVertical: 10,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    sidebarEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    sidebarLabel: {
        fontSize: 7.5,
        textAlign: 'center',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
        paddingHorizontal: 2,
    },
    sidebarCount: {
        fontSize: 10,
        opacity: 1,
        marginTop: 2,
        fontWeight: '900',
    },
    sidebarDivider: {
        width: 40,
        height: 1,
        marginVertical: 16,
        opacity: 0.2,
    },
    sidebarAdd: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(150,150,150,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    sidebarFooter: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 20,
    },
    modalDeleteBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dockingTab: {
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: [{ translateY: -20 }], // Perfectly centered vertically
        height: 40,
        width: 24,
        paddingLeft: 4,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        borderWidth: 1,
        borderRightWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1000,
    },
    dockingIcon: {
        fontSize: 12,
        fontWeight: 'bold',
    },
});
