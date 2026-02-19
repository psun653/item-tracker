import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item, UsageLog, Category, MilestoneRecord } from '../types';

const KEYS = {
    ITEMS: '@useItWell:items',
    USAGE_LOGS: '@useItWell:usageLogs',
    CATEGORIES: '@useItWell:categories',
    MILESTONES: '@useItWell:milestones',
};

async function load<T>(key: string, fallback: T): Promise<T> {
    try {
        const raw = await AsyncStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

async function save<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
    loadItems: () => load<Item[]>(KEYS.ITEMS, []),
    saveItems: (items: Item[]) => save(KEYS.ITEMS, items),

    loadUsageLogs: () => load<UsageLog[]>(KEYS.USAGE_LOGS, []),
    saveUsageLogs: (logs: UsageLog[]) => save(KEYS.USAGE_LOGS, logs),

    loadCategories: () => load<Category[]>(KEYS.CATEGORIES, []),
    saveCategories: (cats: Category[]) => save(KEYS.CATEGORIES, cats),

    loadMilestones: () => load<MilestoneRecord[]>(KEYS.MILESTONES, []),
    saveMilestones: (records: MilestoneRecord[]) => save(KEYS.MILESTONES, records),

    clearAll: async () => {
        await AsyncStorage.multiRemove(Object.values(KEYS));
    },
};
