/**
 * API Key Manager - Handles multiple Gemini API keys with automatic fallback
 * When one key fails, automatically tries the next one
 */

// Load API keys from environment variable (comma-separated)
const loadApiKeys = (): string[] => {
    // Try new format first (VITE_GEMINI_API_KEYS with comma-separated values)
    const keysEnv = (import.meta as any).env?.VITE_GEMINI_API_KEYS;
    if (keysEnv) {
        const keys = keysEnv.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0);
        if (keys.length > 0) {
            console.log(`🔑 Loaded ${keys.length} Gemini API key(s) from VITE_GEMINI_API_KEYS`);
            return keys;
        }
    }
    
    // Fallback to individual keys (VITE_GEMINI_API_KEY_1, VITE_GEMINI_API_KEY_2, etc.)
    const fallbackKeys = [
        (import.meta as any).env?.VITE_GEMINI_API_KEY_1,
        (import.meta as any).env?.VITE_GEMINI_API_KEY_2,
        (import.meta as any).env?.VITE_GEMINI_API_KEY_3,
        (import.meta as any).env?.VITE_GEMINI_API_KEY_4,
        (import.meta as any).env?.VITE_GEMINI_API_KEY_5,
    ].filter(k => k && k.length > 0);
    
    if (fallbackKeys.length > 0) {
        console.log(`🔑 Loaded ${fallbackKeys.length} Gemini API key(s) from individual VITE_GEMINI_API_KEY_X variables`);
        return fallbackKeys;
    }
    
    console.error('❌ No Gemini API keys found! Please add VITE_GEMINI_API_KEY_1 through VITE_GEMINI_API_KEY_5');
    return [];
};

// List of API keys to try in order
const API_KEYS = loadApiKeys();

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
