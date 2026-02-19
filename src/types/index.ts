export type CostMethod = 'per-use' | 'daily-holding';

export type RetirementReason = 'broken' | 'sold' | 'gifted' | 'lost' | 'stolen' | 'expired';

export type ItemStatus = 'active' | 'retired';

export type SortOption = 'daysHeld' | 'totalUses' | 'purchaseCost' | 'dailyCost' | 'costPerUse';
export type SortDirection = 'asc' | 'desc';

export type Milestone = '1m' | '3m' | '6m' | '1yr';

export interface Item {
    id: string;
    name: string;
    category: string;
    purchasePrice: number;
    purchaseDate: string; // ISO date string
    costMethod: CostMethod;
    emoji: string;
    notes?: string;
    expirationDate?: string; // ISO date string
    status: ItemStatus;
    retiredAt?: string;
    retirementReason?: RetirementReason;
    salePrice?: number;
    currency?: string;
    createdAt: string;
    imageUri?: string;
}

export interface UsageLog {
    id: string;
    itemId: string;
    date: string; // ISO datetime
    notes?: string;
}

export interface Category {
    id: string;
    name: string;
    isDefault: boolean;
}

export interface MilestoneRecord {
    itemId: string;
    milestone: Milestone;
    acknowledgedAt: string;
}

export interface PendingMilestone {
    item: Item;
    milestone: Milestone;
}
