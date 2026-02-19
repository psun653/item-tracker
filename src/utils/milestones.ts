import { Item, Milestone, MilestoneRecord, PendingMilestone } from '../types';
import { daysSince } from './calculations';

export const MILESTONE_THRESHOLDS: Record<Milestone, number> = {
    '1m': 30,
    '3m': 90,
    '6m': 180,
    '1yr': 365,
};

export const MILESTONE_CONFIG: Record<
    Milestone,
    { label: string; emoji: string; message: string; color: string }
> = {
    '1m': {
        label: '1 Month',
        emoji: '🌱',
        message: "One month in — you're building a great habit!",
        color: '#4CAF50',
    },
    '3m': {
        label: '3 Months',
        emoji: '🌿',
        message: "3 months strong. You're using it well!",
        color: '#2196F3',
    },
    '6m': {
        label: '6 Months',
        emoji: '🌳',
        message: 'Half a year! This item has truly earned its place.',
        color: '#9C27B0',
    },
    '1yr': {
        label: '1 Year',
        emoji: '🏆',
        message: 'One whole year — a true keeper. Less is more!',
        color: '#FF9800',
    },
};

// Simplified logic: Only return the highest unacknowledged milestone for each item.
// And to prevent overwhelming the user (and loops), let's just return the ONE most important pending milestone across all items.
export function getPendingMilestones(
    items: Item[],
    acknowledged: MilestoneRecord[]
): PendingMilestone[] {
    const candidates: PendingMilestone[] = [];

    for (const item of items) {
        if (item.status !== 'active') continue;
        const days = daysSince(item.purchaseDate);

        // Check thresholds in descending order (highest first)
        const thresholds = Object.entries(MILESTONE_THRESHOLDS) as [Milestone, number][];
        // Sort by days desc
        thresholds.sort((a, b) => b[1] - a[1]);

        for (const [key, threshold] of thresholds) {
            if (days >= threshold) {
                // Check if THIS specific milestone is acknowledged
                const isDone = acknowledged.some(
                    (r) => r.itemId === item.id && r.milestone === key
                );

                if (!isDone) {
                    // Found the highest unacknowledged milestone for this item.
                    // Add to candidates and break (ignore lower milestones for this item)
                    candidates.push({ item, milestone: key });
                    break;
                }
            }
        }
    }

    // Now we have the highest pending milestone for each item.
    // Let's pick 'The Latest' one globally? Or just return all of them?
    // User said: "only prompt the latest one".
    // I will sort candidates by milestone magnitude (highest first) and return top 1.
    // This ensures we only celebrate the biggest achievement right now.

    if (candidates.length === 0) return [];

    const order: Milestone[] = ['1m', '3m', '6m', '1yr'];
    // Sort descending by magnitude
    candidates.sort((a, b) => order.indexOf(b.milestone) - order.indexOf(a.milestone));

    // Return ONLY the single most important one
    return [candidates[0]];
}
