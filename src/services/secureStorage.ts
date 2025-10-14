import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * SecureStorageService
 *
 * Provides encrypted storage for sensitive data (tokens, credentials)
 * Falls back to AsyncStorage if SecureStore is unavailable (web/unsupported platforms)
 */
class SecureStorageService {
  private isSecureStoreAvailable: boolean = true;

  constructor() {
    this.checkAvailability();
  }

  private async checkAvailability() {
    try {
      // Test if SecureStore is available
      await SecureStore.setItemAsync('test_key', 'test_value');
      await SecureStore.deleteItemAsync('test_key');
      this.isSecureStoreAvailable = true;
    } catch (error) {
      console.warn('SecureStore not available, falling back to AsyncStorage');
      this.isSecureStoreAvailable = false;
    }
  }

  /**
   * Store sensitive data securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isSecureStoreAvailable) {
        await SecureStore.setItemAsync(key, value);
      } else {
        // Fallback to AsyncStorage (less secure, but better than nothing)
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
      throw new Error(`Failed to securely store ${key}`);
    }
  }

  /**
   * Retrieve sensitive data
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isSecureStoreAvailable) {
        return await SecureStore.getItemAsync(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete sensitive data
   */
  async deleteItem(key: string): Promise<void> {
    try {
      if (this.isSecureStoreAvailable) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to delete ${key}:`, error);
    }
  }

  /**
   * Store multiple items at once
   */
  async setMultiple(items: Record<string, string>): Promise<void> {
    const promises = Object.entries(items).map(([key, value]) =>
      this.setItem(key, value)
    );
    await Promise.all(promises);
  }

  /**
   * Delete multiple items at once
   */
  async deleteMultiple(keys: string[]): Promise<void> {
    const promises = keys.map(key => this.deleteItem(key));
    await Promise.all(promises);
  }

  /**
   * Clear all secure storage (use with caution!)
   */
  async clear(): Promise<void> {
    try {
      // SecureStore doesn't have a clear method, so we need to track keys separately
      // For now, we'll just delete known keys
      const knownKeys = ['authToken', 'refreshToken', 'biometricEnabled', 'user'];
      await this.deleteMultiple(knownKeys);
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
    }
  }

  /**
   * Check if SecureStore is available
   */
  isAvailable(): boolean {
    return this.isSecureStoreAvailable;
  }
}

export default new SecureStorageService();
