import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'unknown';

interface BiometricCapabilities {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: BiometricType[];
}

/**
 * BiometricAuthService
 *
 * Handles biometric authentication (Face ID, Touch ID, fingerprint)
 * Provides secure app access with fallback to device passcode
 */
class BiometricAuthService {
  private capabilities: BiometricCapabilities | null = null;

  /**
   * Check device biometric capabilities
   */
  async checkCapabilities(): Promise<BiometricCapabilities> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypesRaw = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const supportedTypes: BiometricType[] = supportedTypesRaw.map(type => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'facial';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'iris';
          default:
            return 'unknown';
        }
      });

      this.capabilities = {
        isAvailable: hasHardware && isEnrolled,
        hasHardware,
        isEnrolled,
        supportedTypes,
      };

      return this.capabilities;
    } catch (error) {
      console.error('Failed to check biometric capabilities:', error);
      return {
        isAvailable: false,
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
      };
    }
  }

  /**
   * Get cached capabilities (call checkCapabilities first)
   */
  getCapabilities(): BiometricCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get user-friendly biometric type name
   */
  getBiometricTypeName(): string {
    if (!this.capabilities) {
      return 'Biometric';
    }

    const { supportedTypes } = this.capabilities;

    if (supportedTypes.includes('facial')) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (supportedTypes.includes('fingerprint')) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (supportedTypes.includes('iris')) {
      return 'Iris Recognition';
    }

    return 'Biometric';
  }

  /**
   * Authenticate user with biometrics
   */
  async authenticate(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
  }): Promise<{
    success: boolean;
    error?: string;
    warning?: string;
  }> {
    try {
      // Check if biometrics are available
      const capabilities = await this.checkCapabilities();

      if (!capabilities.hasHardware) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      if (!capabilities.isEnrolled) {
        return {
          success: false,
          error: 'No biometrics enrolled. Please set up biometrics in device settings.',
        };
      }

      // Perform authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || `Unlock with ${this.getBiometricTypeName()}`,
        cancelLabel: options?.cancelLabel || 'Cancel',
        fallbackLabel: options?.fallbackLabel || 'Use Passcode',
        disableDeviceFallback: options?.disableDeviceFallback || false,
      });

      if (result.success) {
        return { success: true };
      }

      // Handle different error types
      if (result.error === 'user_cancel') {
        return {
          success: false,
          error: 'Authentication cancelled',
        };
      }

      if (result.error === 'lockout') {
        return {
          success: false,
          error: 'Too many attempts. Please try again later.',
        };
      }

      if (result.error === 'not_enrolled') {
        return {
          success: false,
          error: 'No biometrics enrolled. Please set up biometrics in device settings.',
        };
      }

      if (result.error === 'user_fallback') {
        return {
          success: false,
          warning: 'User chose to use device passcode',
        };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during authentication',
      };
    }
  }

  /**
   * Check if biometric authentication is available and configured
   */
  async isAvailable(): Promise<boolean> {
    const capabilities = await this.checkCapabilities();
    return capabilities.isAvailable;
  }

  /**
   * Get security level (for informational purposes)
   */
  async getSecurityLevel(): Promise<LocalAuthentication.SecurityLevel> {
    try {
      return await LocalAuthentication.getEnrolledLevelAsync();
    } catch (error) {
      console.error('Failed to get security level:', error);
      return LocalAuthentication.SecurityLevel.NONE;
    }
  }
}

export default new BiometricAuthService();
