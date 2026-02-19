import { create } from 'zustand';
import { Item, UsageLog, Category, MilestoneRecord, CostMethod, RetirementReason } from '../types';
import { storage } from '../utils/storage';

interface StoreState {
    items: Item[];
    usageLogs: UsageLog[];
    categories: Category[];
    milestoneRecords: MilestoneRecord[];
    isLoaded: boolean;

    // Init
    loadAll: () => Promise<void>;

    // Items
    addItem: (item: Omit<Item, 'id' | 'createdAt' | 'status'>) => void;
    updateItem: (id: string, updates: Partial<Item>) => void;
    retireItem: (id: string, reason: RetirementReason, salePrice?: number) => void;
    deleteItem: (id: string) => void;

    // Bulk Import (Demo Data)
    importData: (items: Item[], logs: UsageLog[]) => void;

    // Usage Logs
    addUsageLog: (itemId: string, notes?: string, date?: string) => void;
    deleteUsageLog: (logId: string) => void;
    getUsageLogsForItem: (itemId: string) => UsageLog[];

    // Categories
    addCategory: (name: string) => void;
    updateCategory: (id: string, newName: string) => void;
    deleteCategory: (id: string) => void;

    // Milestones
    acknowledgeMilestone: (itemId: string, milestone: MilestoneRecord['milestone']) => void;

    // Reset
    clearAllData: () => Promise<void>;
}

function uuid(): string {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useStore = create<StoreState>((set, get) => ({
    items: [],
    usageLogs: [],
    categories: [],
    milestoneRecords: [],
    isLoaded: false,

    loadAll: async () => {
        const [items, usageLogs, categories, milestoneRecords] = await Promise.all([
            storage.loadItems(),
            storage.loadUsageLogs(),
            storage.loadCategories(),
            storage.loadMilestones(),
        ]);
        set({ items, usageLogs, categories, milestoneRecords, isLoaded: true });
    },

    addItem: (itemData) => {
        const newItem: Item = {
            ...itemData,
            id: uuid(),
            status: 'active',
            createdAt: new Date().toISOString(),
        };
        const items = [...get().items, newItem];
        set({ items });
        storage.saveItems(items);
    },

    updateItem: (id, updates) => {
        const items = get().items.map((item) => (item.id === id ? { ...item, ...updates } : item));
        set({ items });
        storage.saveItems(items);
    },

    retireItem: (id, reason, salePrice) => {
        const items = get().items.map((item) =>
            item.id === id
                ? {
                    ...item,
                    status: 'retired' as const,
                    retiredAt: new Date().toISOString(),
                    retirementReason: reason,
                    salePrice: reason === 'sold' ? salePrice : undefined,
                }
                : item
        );
        set({ items });
        storage.saveItems(items);
    },

    deleteItem: (id) => {
        const items = get().items.filter((item) => item.id !== id);
        const usageLogs = get().usageLogs.filter((log) => log.itemId !== id);
        set({ items, usageLogs });
        storage.saveItems(items);
        storage.saveUsageLogs(usageLogs);
    },

    // New Bulk Import Action
    importData: (newItems: Item[], newLogs: UsageLog[]) => {
        const items = [...get().items, ...newItems];
        const usageLogs = [...get().usageLogs, ...newLogs];
        set({ items, usageLogs });
        storage.saveItems(items);
        storage.saveUsageLogs(usageLogs);
    },

    addUsageLog: (itemId, notes, date) => {
        const newLog: UsageLog = {
            id: uuid(),
            itemId,
            date: date || new Date().toISOString(),
            notes,
        };
        const usageLogs = [...get().usageLogs, newLog];
        set({ usageLogs });
        storage.saveUsageLogs(usageLogs);
    },

    deleteUsageLog: (logId) => {
        const usageLogs = get().usageLogs.filter((log) => log.id !== logId);
        set({ usageLogs });
        storage.saveUsageLogs(usageLogs);
    },

    getUsageLogsForItem: (itemId) => {
        return get().usageLogs.filter((log) => log.itemId === itemId);
    },

    addCategory: (name) => {
        const newCat: Category = {
            id: uuid(),
            name: name.trim(),
            isDefault: false,
        };
        const categories = [...get().categories, newCat];
        set({ categories });
        storage.saveCategories(categories);
    },

    updateCategory: (id, newName) => {
        const trimmed = newName.trim();
        const oldCat = get().categories.find((c) => c.id === id);
        if (!oldCat) return;

        const categories = get().categories.map((c) =>
            c.id === id ? { ...c, name: trimmed } : c
        );

        // Sync items that used the old category name
        const items = get().items.map((item) =>
            item.category === oldCat.name ? { ...item, category: trimmed } : item
        );

        set({ categories, items });
        storage.saveCategories(categories);
        storage.saveItems(items);
    },

    deleteCategory: (id) => {
        const catToDelete = get().categories.find((c) => c.id === id);
        if (!catToDelete) return;

        const categories = get().categories.filter((c) => c.id !== id);

        // Clear category from items (don't delete items)
        const items = get().items.map((item) =>
            item.category === catToDelete.name ? { ...item, category: '' } : item
        );

        set({ categories, items });
        storage.saveCategories(categories);
        storage.saveItems(items);
    },

    acknowledgeMilestone: (itemId, milestone) => {
        const record: MilestoneRecord = {
            itemId,
            milestone,
            acknowledgedAt: new Date().toISOString(),
        };
        const milestoneRecords = [...get().milestoneRecords, record];
        set({ milestoneRecords });
        storage.saveMilestones(milestoneRecords);
    },

    clearAllData: async () => {
        await storage.clearAll();
        set({
            items: [],
            usageLogs: [],
            milestoneRecords: [],
            categories: [],
        });
    },
}));
