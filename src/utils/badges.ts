import { Item, UsageLog } from '../types';

export interface ZenBadge {
    id: string;
    title: string;
    description: string;
    icon: string;
    isUnlocked: boolean;
    progress: number; // 0 to 1
    displayProgress: string; // e.g. "5/10 Items"
}

export function getBadges(items: Item[], usageLogs: UsageLog[]): ZenBadge[] {
    const activeItems = items.filter(i => i.status === 'active');

    // 1. Collector: Total Items > 10
    const itemCount = activeItems.length;
    const collectorProgress = Math.min(itemCount / 10, 1);

    // 2. Longevity: Held an item > 1 year (365 days)
    const oldestItem = [...activeItems].sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime())[0];
    const maxDaysHeld = oldestItem
        ? Math.floor((Date.now() - new Date(oldestItem.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const longevityProgress = Math.min(maxDaysHeld / 365, 1);

    // 3. Commitment: Held an item > 1 month (30 days)
    const commitmentProgress = Math.min(maxDaysHeld / 30, 1);

    // 4. Power User: Total Uses > 100
    const totalUses = usageLogs.length;
    const powerUserProgress = Math.min(totalUses / 100, 1);

    // 5. Minimalist: < 5 items total (if user has at least 1)
    const minimalistCondition = itemCount > 0 && itemCount <= 5;

    return [
        {
            id: 'commitment',
            title: 'Commitment',
            description: 'Hold an item for 1 month',
            icon: '🌱',
            isUnlocked: maxDaysHeld >= 30,
            progress: commitmentProgress,
            displayProgress: `${maxDaysHeld}/30 days`
        },
        {
            id: 'longevity',
            title: 'Longevity',
            description: 'Hold an item for 1 year',
            icon: '🌳',
            isUnlocked: maxDaysHeld >= 365,
            progress: longevityProgress,
            displayProgress: `${maxDaysHeld}/365 days`
        },
        {
            id: 'collector',
            title: 'Collector',
            description: 'Own 10+ items',
            icon: '🎒',
            isUnlocked: itemCount >= 10,
            progress: collectorProgress,
            displayProgress: `${itemCount}/10 items`
        },
        {
            id: 'power_user',
            title: 'Power User',
            description: 'Log 100+ uses',
            icon: '⚡',
            isUnlocked: totalUses >= 100,
            progress: powerUserProgress,
            displayProgress: `${totalUses}/100 uses`
        },
    ];
}
