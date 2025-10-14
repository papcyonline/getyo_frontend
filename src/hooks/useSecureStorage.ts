import { useState, useCallback } from 'react';
import secureStorage from '../services/secureStorage';

/**
 * Hook for secure storage operations
 * Provides state management for stored values
 */
export const useSecureStorage = (key: string) => {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getItem = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const item = await secureStorage.getItem(key);
      setValue(item);
      return item;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [key]);

  const setItem = useCallback(async (newValue: string) => {
    setLoading(true);
    setError(null);
    try {
      await secureStorage.setItem(key, newValue);
      setValue(newValue);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [key]);

  const deleteItem = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await secureStorage.deleteItem(key);
      setValue(null);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [key]);

  return {
    value,
    loading,
    error,
    getItem,
    setItem,
    deleteItem,
  };
};
