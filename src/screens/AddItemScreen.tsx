import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Image,
    ImageBackground,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { Typography, Spacing, Radii, CATEGORY_EMOJIS, CURRENCIES } from '../constants/theme';
import { CostMethod } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getEmojiForName } from '../utils/emoji';
import { ScreenBackground } from '../components/ScreenBackground';

const ITEM_EMOJIS = ['📱', '💻', '🎧', '📷', '⌚', '🎮', '📺', '🔧', '👟', '🎸', '📚', '✈️', '🏋️', '🍳', '📦'];

export default function AddItemScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const scrollRef = useRef<ScrollView>(null);
    const { addItem, updateItem, items, categories, addCategory } = useStore();
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();

    const { itemId, initialCategory } = route.params || {};
    const isEditing = !!itemId;

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [purchaseDate, setPurchaseDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [category, setCategory] = useState(initialCategory ?? categories[0]?.name ?? '');
    const [costMethod, setCostMethod] = useState<CostMethod>('per-use');
    const [emoji, setEmoji] = useState('📦');
    const [imageUri, setImageUri] = useState<string | undefined>(undefined);
    const [notes, setNotes] = useState('');
    const [expirationDate, setExpirationDate] = useState<string | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [isManualMedia, setIsManualMedia] = useState(false);

    // Category Modal
    const [showAddCatModal, setShowAddCatModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Load existing data if editing
    React.useEffect(() => {
        if (isEditing) {
            const item = items.find(i => i.id === itemId);
            if (item) {
                setName(item.name);
                setPrice(String(item.purchasePrice));
                setCurrency(item.currency || 'USD');
                setPurchaseDate(item.purchaseDate);
                setCategory(item.category);
                setCostMethod(item.costMethod);
                setEmoji(item.emoji);
                setImageUri(item.imageUri);
                setNotes(item.notes || '');
                setExpirationDate(item.expirationDate);
            }
        }
    }, [itemId, items]);

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setPurchaseDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    const onExpirationDateChange = (event: any, selectedDate?: Date) => {
        setShowExpirationDatePicker(false);
        if (selectedDate) {
            setExpirationDate(selectedDate.toISOString().split('T')[0]);
        }
    };

    const getValidDate = (dateStr?: string) => {
        const d = new Date(dateStr || new Date());
        return !isNaN(d.getTime()) ? d : new Date();
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            setIsManualMedia(true);
        }
    };

    const handleNameChange = (val: string) => {
        setName(val);
        if (!isManualMedia && !isEditing) {
            const suggested = getEmojiForName(val);
            if (suggested) {
                setEmoji(suggested);
            }
        }
    };

    const handleAddCategory = () => {
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
            Alert.alert('Duplicate', 'Category already exists.');
            return;
        }
        addCategory(trimmed);
        setCategory(trimmed);
        setNewCategoryName('');
        setShowAddCatModal(false);
    };

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Missing name', 'Please enter an item name.');
            return;
        }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            Alert.alert('Invalid price', 'Please enter a valid purchase price.');
            return;
        }
        if (!purchaseDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            Alert.alert('Invalid date', 'Please enter a date in YYYY-MM-DD format.');
            return;
        }

        const itemData = {
            name: name.trim(),
            purchasePrice: parsedPrice,
            purchaseDate,
            category,
            costMethod,
            emoji,
            imageUri,
            currency,
            notes: notes.trim() || undefined,
            expirationDate,
        };

        if (isEditing) {
            updateItem(itemId, itemData);
        } else {
            addItem(itemData);
        }

        navigation.goBack();
    };

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.safe} edges={['top']}>
                {/* Currency Modal */}
                <Modal visible={showCurrencyModal} transparent animationType="fade">
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowCurrencyModal(false)}
                    >
                        <View style={[styles.currencyModalContent, { backgroundColor: colors.surface }]}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('currency')}</Text>
                            <ScrollView style={{ maxHeight: 300 }}>
                                {CURRENCIES.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[
                                            styles.currencyOption,
                                            { borderBottomColor: colors.border },
                                            currency === c && { backgroundColor: colors.primary + '10' }
                                        ]}
                                        onPress={() => {
                                            setCurrency(c);
                                            setShowCurrencyModal(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.currencyOptionText,
                                            { color: colors.textSecondary },
                                            currency === c && { color: colors.primary, fontWeight: 'bold' }
                                        ]}>
                                            {c}
                                        </Text>
                                        {currency === c && <Text style={[styles.check, { color: colors.primary }]}>✓</Text>}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableOpacity>
                </Modal>

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
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('addCategory')}</Text>
                            <TextInput
                                style={[
                                    styles.modalInput,
                                    {
                                        backgroundColor: colors.inputBg,
                                        color: colors.textPrimary,
                                        borderColor: colors.border
                                    }
                                ]}
                                placeholder="Ex: Gear"
                                placeholderTextColor={colors.textMuted}
                                value={newCategoryName}
                                onChangeText={setNewCategoryName}
                                autoFocus
                            />
                            <View style={styles.modalBtns}>
                                <TouchableOpacity
                                    style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                                    onPress={() => setShowAddCatModal(false)}
                                >
                                    <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalAddBtn, { backgroundColor: colors.primary }]}
                                    onPress={handleAddCategory}
                                >
                                    <Text style={styles.modalAddText}>{t('create')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            ref={scrollRef}
                            contentContainerStyle={styles.content}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Header */}
                            <View style={styles.header}>
                                <TouchableOpacity onPress={() => navigation.goBack()}>
                                    <Text style={[styles.cancel, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <Text style={[styles.title, { color: colors.textPrimary }]}>
                                    {isEditing ? t('edit') : t('addNewItem')}
                                </Text>
                                <TouchableOpacity onPress={handleSave}>
                                    <Text style={[styles.save, { color: colors.primary }]}>{t('save')}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Picture Selection */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('picture')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
                                {/* Photo picker button — same size/style as emoji buttons */}
                                <TouchableOpacity
                                    style={[
                                        styles.emojiBtn,
                                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                                        imageUri && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
                                    ]}
                                    onPress={pickImage}
                                >
                                    {imageUri ? (
                                        <Image source={{ uri: imageUri }} style={styles.pickedImage} />
                                    ) : (
                                        <Text style={[styles.addPictureIcon, { color: colors.primary }]}>+</Text>
                                    )}
                                </TouchableOpacity>

                                {ITEM_EMOJIS.map((e) => (
                                    <TouchableOpacity
                                        key={e}
                                        style={[
                                            styles.emojiBtn,
                                            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                                            (!imageUri && emoji === e) && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }
                                        ]}
                                        onPress={() => {
                                            setEmoji(e);
                                            setImageUri(undefined);
                                            setIsManualMedia(true);
                                        }}
                                    >
                                        <Text style={styles.emojiText}>{e}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Name */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('itemName')} *</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="e.g. Sony WH-1000XM5"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={handleNameChange}
                                returnKeyType="done"
                                onSubmitEditing={Keyboard.dismiss}
                            />

                            {/* Price & Currency */}
                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('price')} *</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.textPrimary, borderColor: colors.border }]}
                                        placeholderTextColor={colors.textMuted}
                                        value={price}
                                        onChangeText={setPrice}
                                        keyboardType="decimal-pad"
                                        returnKeyType="done"
                                        onSubmitEditing={Keyboard.dismiss}
                                    />
                                </View>
                                <View>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('currency')}</Text>
                                    <TouchableOpacity
                                        style={[styles.currencyBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                                        onPress={() => setShowCurrencyModal(true)}
                                    >
                                        <Text style={[styles.currencyText, { color: colors.textPrimary }]}>{currency}</Text>
                                        <Text style={[styles.chevron, { color: colors.textSecondary }]}>⌄</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Purchase Date */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('purchaseDate')}</Text>
                            <View style={styles.dateRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, backgroundColor: colors.surfaceElevated, color: colors.textPrimary, borderColor: colors.border }]}
                                    placeholderTextColor={colors.textMuted}
                                    value={purchaseDate}
                                    onChangeText={setPurchaseDate}
                                    returnKeyType="done"
                                    onSubmitEditing={Keyboard.dismiss}
                                />
                                <TouchableOpacity
                                    style={[styles.dateBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateBtnText}>📅</Text>
                                </TouchableOpacity>
                            </View>
                            {Platform.OS === 'ios' ? (
                                <Modal visible={showDatePicker} transparent animationType="fade">
                                    <View style={styles.modalOverlay}>
                                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                                            <DateTimePicker
                                                value={getValidDate(purchaseDate)}
                                                mode="date"
                                                display="inline"
                                                onChange={onDateChange}
                                                style={{ height: 320, width: 320 }}
                                                themeVariant={isDark ? 'dark' : 'light'}
                                            />
                                            <TouchableOpacity
                                                style={[styles.modalCloseBtn, { backgroundColor: colors.primary }]}
                                                onPress={() => setShowDatePicker(false)}
                                            >
                                                <Text style={styles.modalCloseText}>{t('done')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Modal>
                            ) : (
                                showDatePicker && (
                                    <DateTimePicker
                                        value={getValidDate(purchaseDate)}
                                        mode="date"
                                        display="default"
                                        onChange={onDateChange}
                                    />
                                )
                            )}

                            {/* Expiration Date — always visible, blank = N/A */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('expirationDate')}</Text>
                            <View style={styles.dateRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, backgroundColor: colors.surfaceElevated, color: colors.textPrimary, borderColor: colors.border }]}
                                    placeholder="N/A"
                                    placeholderTextColor={colors.textMuted}
                                    value={expirationDate ?? ''}
                                    onChangeText={(val) => setExpirationDate(val.trim() === '' ? undefined : val)}
                                    returnKeyType="done"
                                    onSubmitEditing={Keyboard.dismiss}
                                />
                                <TouchableOpacity
                                    style={[styles.dateBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                                    onPress={() => setShowExpirationDatePicker(true)}
                                >
                                    <Text style={styles.dateBtnText}>📅</Text>
                                </TouchableOpacity>
                            </View>

                            {Platform.OS === 'ios' ? (
                                <Modal visible={showExpirationDatePicker} transparent animationType="fade">
                                    <View style={styles.modalOverlay}>
                                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                                            <DateTimePicker
                                                value={getValidDate(expirationDate)}
                                                mode="date"
                                                display="inline"
                                                onChange={onExpirationDateChange}
                                                style={{ height: 320, width: 320 }}
                                                themeVariant={isDark ? 'dark' : 'light'}
                                            />
                                            <TouchableOpacity
                                                style={[styles.modalCloseBtn, { backgroundColor: colors.primary }]}
                                                onPress={() => setShowExpirationDatePicker(false)}
                                            >
                                                <Text style={styles.modalCloseText}>{t('done')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </Modal>
                            ) : (
                                showExpirationDatePicker && (
                                    <DateTimePicker
                                        value={getValidDate(expirationDate)}
                                        mode="date"
                                        display="default"
                                        onChange={onExpirationDateChange}
                                    />
                                )
                            )}

                            {/* Category Selection (Updated) */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('category')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.chip,
                                            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                                            category === cat.name && { backgroundColor: colors.primary, borderColor: colors.primary }
                                        ]}
                                        onPress={() => setCategory(cat.name)}
                                    >
                                        <Text style={[
                                            styles.chipText,
                                            { color: colors.textSecondary },
                                            category === cat.name && { color: '#fff', fontWeight: 'bold' }
                                        ]}>
                                            {CATEGORY_EMOJIS[cat.name] ?? '📦'} {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {/* Add New Category Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderStyle: 'dashed', borderWidth: 1 }
                                    ]}
                                    onPress={() => setShowAddCatModal(true)}
                                >
                                    <Text style={[styles.chipText, { color: colors.primary }]}>+ New</Text>
                                </TouchableOpacity>
                            </ScrollView>

                            {/* Cost Method */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('costMethod')}</Text>
                            <View style={styles.methodRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.methodCard,
                                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                                        costMethod === 'per-use' && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }
                                    ]}
                                    onPress={() => setCostMethod('per-use')}
                                >
                                    <Text style={styles.methodEmoji}>🔁</Text>
                                    <Text style={[
                                        styles.methodTitle,
                                        { color: colors.textSecondary },
                                        costMethod === 'per-use' && { color: colors.primary }
                                    ]}>
                                        {t('costPerUse')}
                                    </Text>
                                    <Text style={[styles.methodDesc, { color: colors.textMuted }]}>{t('costPerUseDesc')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.methodCard,
                                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                                        costMethod === 'daily-holding' && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }
                                    ]}
                                    onPress={() => setCostMethod('daily-holding')}
                                >
                                    <Text style={styles.methodEmoji}>📅</Text>
                                    <Text style={[
                                        styles.methodTitle,
                                        { color: colors.textSecondary },
                                        costMethod === 'daily-holding' && { color: colors.primary }
                                    ]}>
                                        {t('dailyHolding')}
                                    </Text>
                                    <Text style={[styles.methodDesc, { color: colors.textMuted }]}>{t('dailyHoldingDesc')}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Notes */}
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('notes')}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceElevated, color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="Any notes about this item..."
                                placeholderTextColor={colors.textMuted}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                numberOfLines={3}
                                onFocus={() => {
                                    // Small delay to allow keyboard to show and layout to adjust
                                    setTimeout(() => {
                                        scrollRef.current?.scrollToEnd({ animated: true });
                                    }, 100);
                                }}
                            />
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    content: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
    },
    cancel: { fontSize: Typography.sizes.base, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
    title: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
    save: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm },
    label: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: Spacing.sm,
        marginTop: Spacing.base,
    },
    input: {
        borderRadius: Radii.md,
        padding: Spacing.base,
        fontSize: Typography.sizes.base,
        borderWidth: 1,
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    emojiScroll: { marginBottom: Spacing.sm },
    emojiBtn: {
        width: 48,
        height: 48,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
        borderWidth: 1,
    },
    emojiText: { fontSize: 24 },
    pictureContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
    addPictureBtn: {
        width: 48,
        height: 48,
        borderRadius: Radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    addPictureIcon: { fontSize: 24, fontWeight: 'bold', lineHeight: 28 },
    pickedImage: { width: 48, height: 48, borderRadius: Radii.md },
    chipScroll: { marginBottom: Spacing.sm },
    chip: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.full,
        marginRight: Spacing.sm,
        borderWidth: 1,
    },
    chipText: { fontSize: Typography.sizes.sm },
    methodRow: { flexDirection: 'row', gap: Spacing.sm },
    methodCard: {
        flex: 1,
        borderRadius: Radii.lg,
        padding: Spacing.base,
        alignItems: 'center',
        borderWidth: 2,
    },
    methodEmoji: { fontSize: 28, marginBottom: Spacing.sm },
    methodTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
    methodDesc: { fontSize: Typography.sizes.xs, marginTop: 4, textAlign: 'center' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    dateBtn: {
        borderRadius: Radii.md,
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    dateBtnText: { fontSize: 24 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: { ...StyleSheet.absoluteFillObject },
    modalContent: {
        borderRadius: Radii.xl,
        padding: Spacing.base,
        alignItems: 'center',
        width: '85%',
    },
    modalCloseBtn: {
        marginTop: Spacing.base,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        borderRadius: Radii.full,
    },
    modalCloseText: { color: '#fff', fontWeight: Typography.weights.bold },
    row: { flexDirection: 'row', gap: Spacing.base, alignItems: 'flex-start' },
    currencyBtn: {
        borderRadius: Radii.md,
        padding: Spacing.base, // same as input
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: 90,
    },
    currencyText: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold },
    chevron: { fontSize: 16 },
    currencyModalContent: {
        borderRadius: Radii.xl,
        padding: Spacing.base,
        width: '80%',
        maxHeight: '60%',
    },
    modalTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, marginBottom: Spacing.base, textAlign: 'center' },
    currencyOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    currencyOptionText: { fontSize: Typography.sizes.base },
    check: { fontWeight: Typography.weights.bold },

    // Add Category Modal Specifics
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
    expirationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.base,
        marginBottom: Spacing.sm,
    },
});
