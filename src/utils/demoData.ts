import { Item, UsageLog, Category } from '../types';

const DEMO_CATEGORIES = [
    'Electronics', 'Clothing', 'Kitchen', 'Tools', 'Books', 'Sports', 'Travel', 'Music', 'Gaming', 'Office'
];

const DEMO_ITEMS = [
    { name: 'MacBook Pro', emoji: '💻', price: 2499, category: 'Electronics' },
    { name: 'Leather Jacket', emoji: '🧥', price: 350, category: 'Clothing' },
    { name: 'Espresso Machine', emoji: '☕', price: 600, category: 'Kitchen' },
    { name: 'Drill Set', emoji: '🔩', price: 120, category: 'Tools' },
    { name: 'Kindle Paperwhite', emoji: '📖', price: 140, category: 'Electronics' },
    { name: 'Running Shoes', emoji: '👟', price: 180, category: 'Sports' },
    { name: 'Noise Cancelling Headphones', emoji: '🎧', price: 350, category: 'Electronics' },
    { name: 'Mechanical Keyboard', emoji: '⌨️', price: 150, category: 'Electronics' },
    { name: 'Cast Iron Skillet', emoji: '🍳', price: 40, category: 'Kitchen' },
    { name: 'Hiking Backpack', emoji: '🎒', price: 200, category: 'Travel' },
    { name: 'Electric Guitar', emoji: '🎸', price: 800, category: 'Music' },
    { name: 'Yoga Mat', emoji: '🧘', price: 80, category: 'Sports' },
    { name: 'Gaming Console', emoji: '🎮', price: 500, category: 'Gaming' },
    { name: 'Office Chair', emoji: '🪑', price: 400, category: 'Office' },
    { name: 'Smart Watch', emoji: '⌚', price: 300, category: 'Electronics' },
    { name: 'Blender', emoji: '🥤', price: 100, category: 'Kitchen' },
    { name: 'Winter Coat', emoji: '❄️', price: 250, category: 'Clothing' },
    { name: 'Tennis Racket', emoji: '🎾', price: 180, category: 'Sports' },
    { name: 'Digital Camera', emoji: '📷', price: 1200, category: 'Electronics' },
    { name: 'Suitcase', emoji: '🧳', price: 220, category: 'Travel' },
    { name: 'Telescope', emoji: '🔭', price: 450, category: 'Hobbies' },
    { name: 'Mountain Bike', emoji: '🚴', price: 800, category: 'Sports' },
    { name: 'Sewing Machine', emoji: '🧵', price: 150, category: 'Hobbies' },
    { name: 'Air Fryer', emoji: '🍟', price: 120, category: 'Kitchen' },
    { name: 'Tablet', emoji: '📱', price: 600, category: 'Electronics' },
    { name: 'Drone', emoji: '🚁', price: 900, category: 'Electronics' },
    { name: 'Tent', emoji: '⛺', price: 250, category: 'Travel' },
    { name: 'Monitor', emoji: '🖥️', price: 350, category: 'Electronics' },
    { name: 'Ukulele', emoji: '🎼', price: 60, category: 'Music' },
    { name: 'Dumbbells', emoji: '💪', price: 100, category: 'Sports' },
];

function uuid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function generateDemoData(): { items: Item[], logs: UsageLog[] } {
    const items: Item[] = [];
    const logs: UsageLog[] = [];
    const now = new Date();

    DEMO_ITEMS.forEach((demo, index) => {
        // Random purchase date within last 2 years
        const daysAgo = Math.floor(Math.random() * 730);
        const purchaseDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

        const id = uuid() + index; // Ensure uniqueish

        items.push({
            id,
            name: demo.name,
            emoji: demo.emoji,
            purchasePrice: demo.price,
            currency: 'USD',
            purchaseDate,
            category: demo.category,
            costMethod: Math.random() > 0.8 ? 'daily-holding' : 'per-use', // Mostly per-use
            status: 'active',
            createdAt: purchaseDate, // Simplified
        });

        // Generate usage logs
        // Random number of uses based on age
        const maxUses = Math.min(daysAgo, 200); // Up to 200 uses
        const numUses = Math.floor(Math.random() * maxUses);

        for (let i = 0; i < numUses; i++) {
            // Random date between purchase and now
            const logDateVal = new Date(purchaseDate).getTime() + Math.random() * (now.getTime() - new Date(purchaseDate).getTime());
            logs.push({
                id: uuid() + i,
                itemId: id,
                date: new Date(logDateVal).toISOString(),
            });
        }
    });

    return { items, logs };
}
