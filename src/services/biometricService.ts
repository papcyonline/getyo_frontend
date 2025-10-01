import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface BiometricConfig {
  enabled: boolean;
  type?: 'fingerprint' | 'face' | 'iris' | 'none';
  lastUsed?: Date;
}

class BiometricService {
  private BIOMETRIC_KEY = '@yo_biometric_config';
  private isAvailable: boolean = false;
  private supportedTypes: LocalAuthentication.AuthenticationType[] = [];

  async initialize(): Promise<boolean> {
    try {
      // Check if device supports biometrics
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        console.log('⚠️ Device does not support biometric authentication');
        return false;
      }

      // Check if biometrics are enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        console.log('⚠️ No biometric records enrolled on device');
        return false;
      }

      // Get supported biometric types
      this.supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      this.isAvailable = true;
      console.log('✅ Biometric authentication available', {
        types: this.supportedTypes.map(type => {
          switch (type) {
            case LocalAuthentication.AuthenticationType.FINGERPRINT: return 'Fingerprint';
            case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION: return 'Face ID';
            case LocalAuthentication.AuthenticationType.IRIS: return 'Iris';
            default: return 'Unknown';
          }
        })
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize biometric service:', error);
      return false;
    }
  }

  async isBiometricAvailable(): Promise<boolean> {
    if (!this.isAvailable) {
      await this.initialize();
    }
    return this.isAvailable;
  }

  async getSupportedBiometricTypes(): Promise<string[]> {
    if (!this.isAvailable) {
      await this.initialize();
    }

    return this.supportedTypes.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris Scan';
        default:
          return 'Unknown';
      }
    });
  }

  async getBiometricTypeDisplay(): Promise<string> {
    const types = await this.getSupportedBiometricTypes();

    if (types.length === 0) {
      return 'Biometric Authentication';
    }

    if (types.includes('Face ID')) {
      return 'Face ID';
    }

    if (types.includes('Touch ID')) {
      return 'Touch ID';
    }

    if (types.includes('Fingerprint')) {
      return 'Fingerprint';
    }

    return types[0] || 'Biometric Authentication';
  }

  async authenticate(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isAvailable) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'Biometric authentication not available on this device'
          };
        }
      }

      const biometricType = await this.getBiometricTypeDisplay();

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || `Authenticate with ${biometricType}`,
        cancelLabel: options?.cancelLabel || 'Cancel',
        disableDeviceFallback: options?.disableDeviceFallback ?? false,
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        // Update last used timestamp
        await this.updateLastUsed();

        console.log('✅ Biometric authentication successful');
        return { success: true };
      } else {
        console.log('❌ Biometric authentication failed:', result.error);
        return {
          success: false,
          error: this.getErrorMessage(result.error)
        };
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed. Please try again.'
      };
    }
  }

  private getErrorMessage(error: string): string {
    switch (error) {
      case 'user_cancel':
        return 'Authentication cancelled';
      case 'lockout':
        return 'Too many failed attempts. Please try again later.';
      case 'not_enrolled':
        return 'No biometric credentials enrolled. Please set up biometrics in your device settings.';
      case 'system_cancel':
        return 'Authentication was cancelled by the system';
      case 'not_available':
        return 'Biometric authentication is not available on this device';
      case 'passcode_not_set':
        return 'Please set up a device passcode first';
      default:
        return 'Authentication failed. Please try again.';
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const config = await this.getBiometricConfig();
      return config.enabled;
    } catch (error) {
      return false;
    }
  }

  async enableBiometric(): Promise<boolean> {
    try {
      // First, test if biometric authentication works
      const result = await this.authenticate({
        promptMessage: 'Authenticate to enable biometric login',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return false;
      }

      // If successful, save config
      const config: BiometricConfig = {
        enabled: true,
        type: await this.getActiveBiometricType(),
        lastUsed: new Date(),
      };

      await AsyncStorage.setItem(this.BIOMETRIC_KEY, JSON.stringify(config));
      console.log('✅ Biometric authentication enabled');
      return true;
    } catch (error) {
      console.error('❌ Failed to enable biometric authentication:', error);
      return false;
    }
  }

  async disableBiometric(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.BIOMETRIC_KEY);
      console.log('✅ Biometric authentication disabled');
    } catch (error) {
      console.error('❌ Failed to disable biometric authentication:', error);
    }
  }

  private async getBiometricConfig(): Promise<BiometricConfig> {
    try {
      const configStr = await AsyncStorage.getItem(this.BIOMETRIC_KEY);
      if (!configStr) {
        return { enabled: false };
      }

      const config = JSON.parse(configStr);
      // Convert date string back to Date object
      if (config.lastUsed) {
        config.lastUsed = new Date(config.lastUsed);
      }

      return config;
    } catch (error) {
      console.error('Error getting biometric config:', error);
      return { enabled: false };
    }
  }

  private async updateLastUsed(): Promise<void> {
    try {
      const config = await this.getBiometricConfig();
      config.lastUsed = new Date();
      await AsyncStorage.setItem(this.BIOMETRIC_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error updating biometric last used:', error);
    }
  }

  private async getActiveBiometricType(): Promise<'fingerprint' | 'face' | 'iris' | 'none'> {
    if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    }
    if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (this.supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
    return 'none';
  }

  // Quick authentication for app foreground
  async quickAuthenticate(): Promise<boolean> {
    const isEnabled = await this.isBiometricEnabled();
    if (!isEnabled) {
      return true; // If not enabled, allow access
    }

    const result = await this.authenticate({
      promptMessage: 'Authenticate to access Yo!',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  }

  // For sensitive operations (e.g., viewing passwords, deleting account)
  async authenticateForSensitiveOperation(operation: string): Promise<boolean> {
    const result = await this.authenticate({
      promptMessage: `Authenticate to ${operation}`,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  }

  async getBiometricStats(): Promise<{
    enabled: boolean;
    available: boolean;
    type: string;
    lastUsed?: Date;
  }> {
    const config = await this.getBiometricConfig();
    const biometricType = await this.getBiometricTypeDisplay();

    return {
      enabled: config.enabled,
      available: this.isAvailable,
      type: biometricType,
      lastUsed: config.lastUsed,
    };
  }
}

export default new BiometricService();