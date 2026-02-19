import { Item, UsageLog, SortOption, SortDirection } from '../types';
import { daysSince, dailyHoldingCost, costPerUse } from './calculations';

/**
 * Sorts items based on specified criteria and groups them if necessary.
 */
export function sortItems(
    items: Item[],
    logs: UsageLog[],
    option: SortOption,
    direction: SortDirection
): Item[] {
    const logsCountMap = new Map<string, number>();
    logs.forEach(log => {
        logsCountMap.set(log.itemId, (logsCountMap.get(log.itemId) || 0) + 1);
    });

    const getSortValue = (item: Item): number => {
        const usageCount = logsCountMap.get(item.id) || 0;
        switch (option) {
            case 'daysHeld':
                return daysSince(item.purchaseDate);
            case 'totalUses':
                return usageCount;
            case 'purchaseCost':
                return item.purchasePrice;
            case 'dailyCost':
                return dailyHoldingCost(item);
            case 'costPerUse':
                const cpu = costPerUse(item, usageCount);
                return cpu === null ? (direction === 'asc' ? Infinity : -1) : cpu;
            default:
                return new Date(item.createdAt).getTime();
        }
    };

    // Grouping logic as requested by user
    const primaryGroup: Item[] = [];
    const closedGroup: Item[] = [];

    items.forEach(item => {
        let isMismatched = false;
        if (option === 'totalUses' && item.costMethod === 'daily-holding') isMismatched = true;
        if (option === 'dailyCost' && item.costMethod === 'per-use') isMismatched = true;
        if (option === 'costPerUse' && item.costMethod === 'daily-holding') isMismatched = true;

        if (isMismatched) closedGroup.push(item);
        else primaryGroup.push(item);
    });

    const compareFn = (a: Item, b: Item) => {
        const valA = getSortValue(a);
        const valB = getSortValue(b);
        if (direction === 'asc') return valA - valB;
        return valB - valA;
    };

    return [...primaryGroup.sort(compareFn), ...closedGroup.sort(compareFn)];
}
