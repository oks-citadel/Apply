// import { STORAGE_KEYS } - imported but not used from './types';

/**
 * Chrome Storage API Wrapper
 * Provides type-safe access to Chrome's storage API
 */

export class Storage {
  /**
   * Get item from Chrome sync storage
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key] ?? null;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return null;
    }
  }

  /**
   * Set item in Chrome sync storage
   */
  static async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      throw error;
    }
  }

  /**
   * Remove item from Chrome sync storage
   */
  static async remove(key: string): Promise<void> {
    try {
      await chrome.storage.sync.remove(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      throw error;
    }
  }

  /**
   * Clear all items from Chrome sync storage
   */
  static async clear(): Promise<void> {
    try {
      await chrome.storage.sync.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get multiple items from Chrome sync storage
   */
  static async getMultiple<T extends Record<string, any>>(
    keys: string[]
  ): Promise<Partial<T>> {
    try {
      const result = await chrome.storage.sync.get(keys);
      return result as Partial<T>;
    } catch (error) {
      console.error('Error getting multiple items from storage:', error);
      return {};
    }
  }

  /**
   * Set multiple items in Chrome sync storage
   */
  static async setMultiple<T extends Record<string, any>>(
    items: T
  ): Promise<void> {
    try {
      await chrome.storage.sync.set(items);
    } catch (error) {
      console.error('Error setting multiple items in storage:', error);
      throw error;
    }
  }
}

export class LocalStorage {
  /**
   * Get item from Chrome local storage (larger quota than sync)
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] ?? null;
    } catch (error) {
      console.error(`Error getting ${key} from local storage:`, error);
      return null;
    }
  }

  /**
   * Set item in Chrome local storage
   */
  static async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`Error setting ${key} in local storage:`, error);
      throw error;
    }
  }

  /**
   * Remove item from Chrome local storage
   */
  static async remove(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key);
    } catch (error) {
      console.error(`Error removing ${key} from local storage:`, error);
      throw error;
    }
  }

  /**
   * Clear all items from Chrome local storage
   */
  static async clear(): Promise<void> {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error('Error clearing local storage:', error);
      throw error;
    }
  }

  /**
   * Get multiple items from Chrome local storage
   */
  static async getMultiple<T extends Record<string, any>>(
    keys: string[]
  ): Promise<Partial<T>> {
    try {
      const result = await chrome.storage.local.get(keys);
      return result as Partial<T>;
    } catch (error) {
      console.error('Error getting multiple items from local storage:', error);
      return {};
    }
  }

  /**
   * Set multiple items in Chrome local storage
   */
  static async setMultiple<T extends Record<string, any>>(
    items: T
  ): Promise<void> {
    try {
      await chrome.storage.local.set(items);
    } catch (error) {
      console.error('Error setting multiple items in local storage:', error);
      throw error;
    }
  }
}

/**
 * Cached storage with expiration
 */
interface CachedItem<T> {
  value: T;
  timestamp: number;
  expiresIn?: number;
}

export class CachedStorage {
  /**
   * Set item with optional expiration
   */
  static async set<T>(
    key: string,
    value: T,
    expiresIn?: number
  ): Promise<void> {
    const item: CachedItem<T> = {
      value,
      timestamp: Date.now(),
      expiresIn,
    };
    await LocalStorage.set(key, item);
  }

  /**
   * Get item if not expired
   */
  static async get<T>(key: string): Promise<T | null> {
    const item = await LocalStorage.get<CachedItem<T>>(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expiresIn) {
      const age = Date.now() - item.timestamp;
      if (age > item.expiresIn) {
        await LocalStorage.remove(key);
        return null;
      }
    }

    return item.value;
  }

  /**
   * Remove cached item
   */
  static async remove(key: string): Promise<void> {
    await LocalStorage.remove(key);
  }

  /**
   * Clear expired items
   */
  static async clearExpired(): Promise<void> {
    try {
      const allItems = await chrome.storage.local.get(null);
      const now = Date.now();

      for (const [key, value] of Object.entries(allItems)) {
        if (this.isCachedItem(value)) {
          if (value.expiresIn && now - value.timestamp > value.expiresIn) {
            await LocalStorage.remove(key);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired items:', error);
    }
  }

  private static isCachedItem(value: any): value is CachedItem<any> {
    return (
      value &&
      typeof value === 'object' &&
      'value' in value &&
      'timestamp' in value
    );
  }
}

/**
 * Listen to storage changes
 */
export function onStorageChange(
  callback: (changes: {
    [key: string]: chrome.storage.StorageChange;
  }) => void
): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' || areaName === 'local') {
      callback(changes);
    }
  });
}

/**
 * Get storage usage
 */
export async function getStorageUsage(): Promise<{
  sync: { bytesInUse: number; quota: number };
  local: { bytesInUse: number; quota: number };
}> {
  const syncBytesInUse = await chrome.storage.sync.getBytesInUse();
  const localBytesInUse = await chrome.storage.local.getBytesInUse();

  return {
    sync: {
      bytesInUse: syncBytesInUse,
      quota: chrome.storage.sync.QUOTA_BYTES,
    },
    local: {
      bytesInUse: localBytesInUse,
      quota: chrome.storage.local.QUOTA_BYTES,
    },
  };
}
