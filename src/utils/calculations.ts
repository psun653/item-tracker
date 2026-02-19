import { Item } from '../types';

export function daysSince(dateStr: string): number {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function netCost(item: Item): number {
    const purchase = item.purchasePrice;
    const sale = item.salePrice ?? 0;
    return Math.max(0, purchase - sale);
}

export function costPerUse(item: Item, usageCount: number): number | null {
    if (usageCount === 0) return null;
    return netCost(item) / usageCount;
}

export function dailyHoldingCost(item: Item): number {
    const endDate = item.retiredAt ?? new Date().toISOString();
    const start = new Date(item.purchaseDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return netCost(item) / days;
}

export function recoveryRate(item: Item): number {
    if (!item.salePrice || item.purchasePrice === 0) return 0;
    return (item.salePrice / item.purchasePrice) * 100;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    } catch (e) {
        return `$${amount.toFixed(2)}`;
    }
}

export function formatCostLabel(item: Item, usageCount: number): string {
    const currency = item.currency || 'USD';
    if (item.costMethod === 'per-use') {
        const c = costPerUse(item, usageCount);
        return c === null ? 'No uses yet' : `${formatCurrency(c, currency)} / use`;
    } else {
        const c = dailyHoldingCost(item);
        return `${formatCurrency(c, currency)} / day`;
    }
}
