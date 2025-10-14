import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from './auth';

// Google OAuth configuration
const GOOGLE_WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID'; // Replace with your Google Web Client ID
const GOOGLE_IOS_CLIENT_ID = 'YOUR_GOOGLE_IOS_CLIENT_ID'; // Replace with your Google iOS Client ID
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_GOOGLE_ANDROID_CLIENT_ID'; // Replace with your Google Android Client ID

WebBrowser.maybeCompleteAuthSession();

class OAuthService {
  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<{ user: any; token: string }> {
    try {
      const config = {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
      };

      // Note: This is a simplified implementation
      // In production, you'll need to use expo-auth-session properly
      throw new Error('Please configure Google OAuth credentials in src/services/oauth.ts');

      // Example flow (implement after configuration):
      // 1. Get Google auth token
      // 2. Send to backend
      // 3. Backend validates and creates/finds user
      // 4. Return user and JWT token
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Apple
   */
  async signInWithApple(): Promise<{ user: any; token: string }> {
    try {
      // Check if Apple Authentication is available (iOS 13+)
      const isAvailable = await AppleAuthentication.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Extract user data
      const { identityToken, email, fullName } = credential;

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Send to backend for verification and user creation
      const response = await AuthService.authenticateWithApple({
        identityToken,
        email: email || undefined,
        fullName: fullName ? {
          firstName: fullName.givenName || undefined,
          lastName: fullName.familyName || undefined,
        } : undefined,
      });

      return response;
    } catch (error: any) {
      console.error('Apple sign-in error:', error);

      if (error.code === 'ERR_CANCELED') {
        throw new Error('Apple Sign-In was cancelled');
      }

      throw error;
    }
  }

  /**
   * Check if Apple Sign-In is available on this device
   */
  async isAppleSignInAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      return await AppleAuthentication.isAvailableAsync();
    } catch {
      return false;
    }
  }

  /**
   * Check if Google Sign-In is configured
   */
  isGoogleSignInConfigured(): boolean {
    return (
      GOOGLE_WEB_CLIENT_ID !== 'YOUR_GOOGLE_WEB_CLIENT_ID' &&
      GOOGLE_IOS_CLIENT_ID !== 'YOUR_GOOGLE_IOS_CLIENT_ID' &&
      GOOGLE_ANDROID_CLIENT_ID !== 'YOUR_GOOGLE_ANDROID_CLIENT_ID'
    );
  }
}

export default new OAuthService();
