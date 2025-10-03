import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { Platform } from 'react-native';

/**
 * Pure React Native Biometric Service
 * Replaces expo-local-authentication with react-native-biometrics
 */

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export interface BiometricCapabilities {
  available: boolean;
  biometryType: 'TouchID' | 'FaceID' | 'Biometrics' | null;
}

class BiometricServiceRN {
  private rnBiometrics: ReactNativeBiometrics;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      return available;
    } catch (error) {
      console.error('❌ Failed to check biometric availability:', error);
      return false;
    }
  }

  /**
   * Get biometric capabilities
   */
  async getCapabilities(): Promise<BiometricCapabilities> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();

      let type: 'TouchID' | 'FaceID' | 'Biometrics' | null = null;

      if (biometryType === BiometryTypes.TouchID) {
        type = 'TouchID';
      } else if (biometryType === BiometryTypes.FaceID) {
        type = 'FaceID';
      } else if (biometryType === BiometryTypes.Biometrics) {
        type = 'Biometrics';
      }

      return {
        available,
        biometryType: type,
      };
    } catch (error) {
      console.error('❌ Failed to get biometric capabilities:', error);
      return {
        available: false,
        biometryType: null,
      };
    }
  }

  /**
   * Authenticate with biometrics
   */
  async authenticate(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
  }): Promise<BiometricResult> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();

      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication not available',
        };
      }

      const result = await this.rnBiometrics.simplePrompt({
        promptMessage: options?.promptMessage || 'Authenticate to continue',
        cancelButtonText: options?.cancelLabel || 'Cancel',
      });

      if (result.success) {
        console.log('✅ Biometric authentication successful');
        return { success: true };
      } else {
        console.log('❌ Biometric authentication failed');
        return {
          success: false,
          error: 'Authentication failed',
        };
      }
    } catch (error: any) {
      console.error('❌ Biometric authentication error:', error);
      return {
        success: false,
        error: error.message || 'Authentication error',
      };
    }
  }

  /**
   * Create biometric keys (for advanced usage)
   */
  async createKeys(): Promise<{ publicKey: string } | null> {
    try {
      const result = await this.rnBiometrics.createKeys();
      return result;
    } catch (error) {
      console.error('❌ Failed to create biometric keys:', error);
      return null;
    }
  }

  /**
   * Check if biometric keys exist
   */
  async biometricKeysExist(): Promise<boolean> {
    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();
      return keysExist;
    } catch (error) {
      console.error('❌ Failed to check biometric keys:', error);
      return false;
    }
  }

  /**
   * Delete biometric keys
   */
  async deleteKeys(): Promise<boolean> {
    try {
      const result = await this.rnBiometrics.deleteKeys();
      return result.keysDeleted;
    } catch (error) {
      console.error('❌ Failed to delete biometric keys:', error);
      return false;
    }
  }

  /**
   * Create signature (for advanced authentication)
   */
  async createSignature(payload: string): Promise<{ signature: string } | null> {
    try {
      const result = await this.rnBiometrics.createSignature({
        promptMessage: 'Sign in',
        payload,
      });

      if (result.success) {
        return { signature: result.signature };
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to create signature:', error);
      return null;
    }
  }

  /**
   * Get supported authentication types
   */
  async getSupportedAuthenticationTypes(): Promise<string[]> {
    try {
      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();

      if (!available) return [];

      const types: string[] = [];

      if (Platform.OS === 'ios') {
        if (biometryType === BiometryTypes.TouchID) {
          types.push('TouchID');
        } else if (biometryType === BiometryTypes.FaceID) {
          types.push('FaceID');
        }
      } else if (Platform.OS === 'android') {
        if (biometryType === BiometryTypes.Biometrics) {
          types.push('Fingerprint');
        }
      }

      return types;
    } catch (error) {
      console.error('❌ Failed to get authentication types:', error);
      return [];
    }
  }

  /**
   * Check if device has hardware support
   */
  async hasHardwareAsync(): Promise<boolean> {
    return this.isAvailable();
  }

  /**
   * Check if biometrics are enrolled
   */
  async isEnrolledAsync(): Promise<boolean> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      return available;
    } catch (error) {
      console.error('❌ Failed to check enrollment:', error);
      return false;
    }
  }

  /**
   * Authenticate with fallback to passcode (compatibility method)
   */
  async authenticateAsync(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    return this.authenticate(options);
  }
}

export const biometricServiceRN = new BiometricServiceRN();
export default biometricServiceRN;
