/**
 * API Key Manager - Handles multiple Gemini API keys with automatic fallback
 * When one key fails, automatically tries the next one
 */

// List of API keys to try in order
const API_KEYS = [
    process.env.GEMINI_API_KEY_1 || 'AIzaSyCjDLc3zO4tXIMu9uiOVMP_Q4eJwVz9HDc',
    process.env.GEMINI_API_KEY_2 || 'AIzaSyC99H2gTi9xNLdBL1EZKsdnTjkjAjN7UlU',
    process.env.GEMINI_API_KEY_3 || 'AIzaSyDtMvkS3dL67t9JlzyUA0BDLRp330W6Kas',
    process.env.GEMINI_API_KEY_4 || 'AIzaSyCcrdqUiJhzHojcgOLHpF_5kxRNUAD3F4A',
];

// Track which keys have failed
const failedKeys = new Set<string>();

// Current key index
let currentKeyIndex = 0;

/**
 * Get the next available API key
 * Skips keys that have recently failed
 */
export const getNextApiKey = (): string => {
    // Find a key that hasn't failed
    for (let i = 0; i < API_KEYS.length; i++) {
        const keyIndex = (currentKeyIndex + i) % API_KEYS.length;
        const key = API_KEYS[keyIndex];
        
        if (!failedKeys.has(key)) {
            currentKeyIndex = keyIndex;
            return key;
        }
    }
    
    // If all keys have failed, reset and try from the beginning
    failedKeys.clear();
    currentKeyIndex = 0;
    return API_KEYS[0];
};

/**
 * Mark an API key as failed
 * This will cause the system to skip it and try the next one
 */
export const markKeyAsFailed = (key: string): void => {
    console.warn(`⚠️ API Key failed: ${key.substring(0, 10)}...`);
    failedKeys.add(key);
    
    // If all keys have failed, reset after 5 minutes
    if (failedKeys.size === API_KEYS.length) {
        console.error('❌ All API keys have failed! Resetting in 5 minutes...');
        setTimeout(() => {
            failedKeys.clear();
            console.log('✅ API key cache reset. Trying again...');
        }, 5 * 60 * 1000);
    }
};

/**
 * Reset all failed keys (useful for manual retry)
 */
export const resetFailedKeys = (): void => {
    console.log('🔄 Resetting all failed API keys...');
    failedKeys.clear();
    currentKeyIndex = 0;
};

/**
 * Get current status of all API keys
 */
export const getKeyStatus = () => {
    return {
        totalKeys: API_KEYS.length,
        failedKeys: failedKeys.size,
        currentIndex: currentKeyIndex,
        failedKeysList: Array.from(failedKeys).map(k => k.substring(0, 10) + '...'),
    };
};

export default {
    getNextApiKey,
    markKeyAsFailed,
    resetFailedKeys,
    getKeyStatus,
};
