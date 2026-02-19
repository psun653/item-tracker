import { Item, UsageLog } from '../types';

export type ZenAchievement = {
    id: string;
    type: 'long-held' | 'recently-used' | 'most-used' | 'milestone';
    title: string;
    subtitle: string;
    emoji: string;
    item: Item;
    // New metrics for Zen Dashboard
    metricValue: string;
    metricLabel: string;
};

export type ZenStatsResult = {
    activeItems: number;
    retiredItems: number;
    totalUses: number;
    avgDaysHeld: number;
};

// Helper to get random item from array with weighted probability (0 = first item most likely)
function weightedRandom<T>(items: T[], weightBias: number = 2): T | null {
    if (!items || items.length === 0) return null;
    // Higher weightBias means more likely to pick from start of array
    const index = Math.floor(Math.pow(Math.random(), weightBias) * items.length);
    return items[Math.min(index, items.length - 1)];
}

export function getZenHero(items: Item[], usageLogs: UsageLog[]): ZenAchievement | null {
    if (!items || items.length === 0) return null;
    // Safety check for usageLogs
    const safeLogs = usageLogs || [];

    const activeItems = items.filter(i => i.status === 'active');
    if (activeItems.length === 0) return null;

    const strategies = ['long-held', 'recently-used', 'most-used'];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];

    if (strategy === 'long-held') {
        const sorted = [...activeItems].sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
        const item = weightedRandom(sorted, 1.5);

        if (item) {
            const daysHeld = Math.floor((Date.now() - new Date(item.purchaseDate).getTime()) / (1000 * 60 * 60 * 24));
            return {
                id: `held-${item.id}`,
                type: 'long-held',
                title: 'Longevity Master',
                subtitle: `Held for ${daysHeld} days`,
                emoji: item.emoji,
                item: item,
                metricValue: String(daysHeld),
                metricLabel: 'Days Held'
            };
        }
    }

    if (strategy === 'recently-used') {
        const recentLogs = safeLogs
            .filter(l => Date.now() - new Date(l.date).getTime() < 7 * 24 * 60 * 60 * 1000)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const log = weightedRandom(recentLogs, 1.5);
        if (log) {
            const item = items.find(i => i.id === log.itemId);
            if (item) {
                // Calculate days since specific use or just "Today"
                const date = new Date(log.date);
                const isToday = date.toDateString() === new Date().toDateString();
                const value = isToday ? 'Today' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                return {
                    id: `recent-${item.id}`,
                    type: 'recently-used',
                    title: 'Recently Enjoyed',
                    subtitle: 'Used recently',
                    emoji: item.emoji,
                    item: item,
                    metricValue: value,
                    metricLabel: 'Last Used'
                };
            }
        }
    }

    // Most used (fallback)
    const sortedByUsage = [...activeItems].sort((a, b) => {
        const countA = safeLogs.filter(l => l.itemId === a.id).length;
        const countB = safeLogs.filter(l => l.itemId === b.id).length;
        return countB - countA;
    });

    const popularItem = weightedRandom(sortedByUsage, 1.5);
    if (popularItem) {
        const count = safeLogs.filter(l => l.itemId === popularItem.id).length;
        return {
            id: `popular-${popularItem.id}`,
            type: 'most-used',
            title: 'Utility Champion',
            subtitle: `Used ${count} times`,
            emoji: popularItem.emoji,
            item: popularItem,
            metricValue: String(count),
            metricLabel: 'Total Uses'
        };
    }

    return null;
}

export function getZenStats(items: Item[], usageLogs: UsageLog[]): ZenStatsResult {
    const safeItems = items || [];
    const safeLogs = usageLogs || [];

    const activeItems = safeItems.filter(i => i.status === 'active');
    const retiredItems = safeItems.filter(i => i.status === 'retired');
    const totalUses = safeLogs.length;

    // Avg Days Held (for active items)
    let totalDays = 0;
    const now = Date.now();
    activeItems.forEach(i => {
        const diff = now - new Date(i.purchaseDate).getTime();
        totalDays += diff;
    });

    const avgDaysHeld = activeItems.length > 0
        ? Math.floor((totalDays / activeItems.length) / (1000 * 60 * 60 * 24))
        : 0;

    return {
        activeItems: activeItems.length,
        retiredItems: retiredItems.length,
        totalUses,
        avgDaysHeld
    };
}

export const ZEN_QUOTES = [
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "Have nothing in your house that you do not know to be useful, or believe to be beautiful.", author: "William Morris" },
    { text: "The more inherent value we can find in a possession, the less we need to replace it.", author: "Joshua Becker" },
    { text: "My goal is no longer to get more done, but to have less to do.", author: "Francine Jay" },
    { text: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry" },
    { text: "Reduce the complexity of life by eliminating the needless wants of life.", author: "Edwin Way Teale" },
    { text: "The ability to simplify means to eliminate the unnecessary so that the necessary may speak.", author: "Hans Hofmann" },
    { text: "Keep only those things that speak to your heart.", author: "Marie Kondo" },
    { text: "Minimalism is not about having nothing. It's about having everything you need.", author: "Unknown" },
    { text: "Edit your life frequently and ruthlessly. It's your masterpiece after all.", author: "Nathan W. Morris" }
];

export function getRandomZenQuote() {
    return ZEN_QUOTES[Math.floor(Math.random() * ZEN_QUOTES.length)];
}
