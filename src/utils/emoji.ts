const EMOJI_MAP: Record<string, string> = {
    // Electronics / Tech
    'phone': '📱',
    'iphone': '📱',
    'pixel': '📱',
    'samsung': '📱',
    'android': '📱',
    'laptop': '💻',
    'macbook': '💻',
    'computer': '💻',
    'desktop': '🖥️',
    'monitor': '🖥️',
    'screen': '🖥️',
    'tablet': '📱',
    'ipad': '📱',
    'watch': '⌚',
    'apple watch': '⌚',
    'garmin': '⌚',
    'kindle': '📖',
    'ebook': '📖',

    // Audio
    'headphone': '🎧',
    'sony': '🎧',
    'bose': '🎧',
    'earphone': '🎧',
    'airpod': '🎧',
    'speaker': '🔊',
    'music': '🎶',

    // Photography / Video
    'camera': '📷',
    'canon': '📷',
    'sony a': '📷',
    'fuji': '📷',
    'nikon': '📷',
    'lumix': '📷',
    'lens': '📸',
    'gopro': '📹',
    'drone': '🛸',

    // Gaming
    'game': '🎮',
    'playstation': '🎮',
    'ps5': '🎮',
    'xbox': '🎮',
    'switch': '🎮',
    'nintendo': '🎮',
    'console': '🎮',

    // Kitchen / Household
    'coffee': '☕',
    'espresso': '☕',
    'kettle': '🫖',
    'knife': '🔪',
    'pan': '🍳',
    'pot': '🍲',
    'blender': '🌪️',
    'oven': '🍞',
    'fridge': '🧊',
    'lamp': '💡',
    'vacuum': '🧹',

    // Travel / Bags
    'bag': '🎒',
    'backpack': '🎒',
    'peak design': '🎒',
    'suitcase': '🧳',
    'travel': '✈️',
    'passport': '🛂',

    // Clothing / Shoes
    'shoe': '👟',
    'sneaker': '👟',
    'nike': '👟',
    'adidas': '👟',
    'boot': '🥾',
    'jacket': '🧥',
    'coat': '🧥',
    'shirt': '👕',
    't-shirt': '👕',
    'hat': '🧢',

    // Tools / Sports
    'tool': '🔧',
    'drill': '🔨',
    'bike': '🚲',
    'bicycle': '🚲',
    'scooter': '🛴',
    'car': '🚗',
    'gym': '🏋️',
    'weights': '🏋️',
    'yoga': '🧘',
    'tent': '⛺',
    'camp': '⛺',

    // Chinese keywords
    '手机': '📱',
    '电脑': '💻',
    '耳机': '🎧',
    '相机': '📷',
    '手表': '⌚',
    '书': '📚',
    '包': '🎒',
    '鞋': '👟',
    '衣服': '👕',
    '工具': '🔧',
    '咖啡': '☕',
    '游戏': '🎮',
};

export function getEmojiForName(name: string): string | null {
    const lower = name.toLowerCase().trim();
    if (!lower) return null;

    // Direct match
    if (EMOJI_MAP[lower]) return EMOJI_MAP[lower];

    // Priority matches for multi-word or partial matches
    for (const key in EMOJI_MAP) {
        if (lower.includes(key)) {
            return EMOJI_MAP[key];
        }
    }

    return null;
}
