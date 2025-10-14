import { useState, useEffect, useCallback } from 'react';
import biometricAuth from '../services/biometricAuth';
import secureStorage from '../services/secureStorage';

interface UseBiometricResult {
  isAvailable: boolean;
  isEnabled: boolean;
  biometricType: string;
  loading: boolean;
  error: string | null;
  authenticate: (promptMessage?: string) => Promise<boolean>;
  enable: () => Promise<boolean>;
  disable: () => Promise<boolean>;
}

/**
 * Hook for biometric authentication
 * Manages biometric state and authentication flows
 */
export const useBiometric = (): UseBiometricResult => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check biometric capabilities on mount
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const capabilities = await biometricAuth.checkCapabilities();
        setIsAvailable(capabilities.isAvailable);
        setBiometricType(biometricAuth.getBiometricTypeName());

        // Check if user has enabled biometrics
        const enabled = await secureStorage.getItem('biometricEnabled');
        setIsEnabled(enabled === 'true');
      } catch (err) {
        console.error('Failed to check biometrics:', err);
        setError('Failed to check biometric availability');
      } finally {
        setLoading(false);
      }
    };

    checkBiometrics();
  }, []);

  /**
   * Authenticate user with biometrics
   */
  const authenticate = useCallback(async (promptMessage?: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      const result = await biometricAuth.authenticate({
        promptMessage: promptMessage || `Unlock with ${biometricType}`,
      });

      if (result.success) {
        return true;
      }

      if (result.error) {
        setError(result.error);
      }

      return false;
    } catch (err) {
      console.error('Biometric authentication error:', err);
      setError('Authentication failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, [biometricType]);

  /**
   * Enable biometric authentication
   */
  const enable = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) {
      setError('Biometric authentication is not available');
      return false;
    }

    setError(null);
    setLoading(true);

    try {
      // Test authentication before enabling
      const result = await biometricAuth.authenticate({
        promptMessage: `Enable ${biometricType}`,
      });

      if (result.success) {
        await secureStorage.setItem('biometricEnabled', 'true');
        setIsEnabled(true);
        return true;
      }

      if (result.error) {
        setError(result.error);
      }

      return false;
    } catch (err) {
      console.error('Failed to enable biometrics:', err);
      setError('Failed to enable biometric authentication');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAvailable, biometricType]);

  /**
   * Disable biometric authentication
   */
  const disable = useCallback(async (): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      await secureStorage.deleteItem('biometricEnabled');
      setIsEnabled(false);
      return true;
    } catch (err) {
      console.error('Failed to disable biometrics:', err);
      setError('Failed to disable biometric authentication');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isAvailable,
    isEnabled,
    biometricType,
    loading,
    error,
    authenticate,
    enable,
    disable,
  };
};
