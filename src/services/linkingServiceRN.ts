import { Linking, Platform } from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';

/**
 * Pure React Native Linking & Browser Service
 * Replaces expo-web-browser, expo-linking, and expo-auth-session
 */

export interface BrowserResult {
  type: 'cancel' | 'dismiss' | 'opened';
}

export interface AuthSessionResult {
  type: 'success' | 'cancel' | 'dismiss' | 'error';
  url?: string;
  params?: Record<string, string>;
  error?: string;
}

class LinkingServiceRN {
  /**
   * Open URL in browser
   */
  async openBrowserAsync(url: string, options?: {
    toolbarColor?: string;
    controlsColor?: string;
    showTitle?: boolean;
    enableUrlBarHiding?: boolean;
    enableDefaultShare?: boolean;
  }): Promise<BrowserResult> {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.open(url, {
          // iOS options
          dismissButtonStyle: 'close',
          preferredBarTintColor: options?.toolbarColor,
          preferredControlTintColor: options?.controlsColor,
          readerMode: false,
          animated: true,
          modalEnabled: true,
          enableBarCollapsing: false,
          // Android options
          showTitle: options?.showTitle !== false,
          toolbarColor: options?.toolbarColor,
          secondaryToolbarColor: options?.toolbarColor,
          enableUrlBarHiding: options?.enableUrlBarHiding !== false,
          enableDefaultShare: options?.enableDefaultShare !== false,
          forceCloseOnRedirection: false,
        });

        return { type: 'opened' };
      } else {
        // Fallback to system browser
        await Linking.openURL(url);
        return { type: 'opened' };
      }
    } catch (error) {
      console.error('❌ Failed to open browser:', error);
      return { type: 'dismiss' };
    }
  }

  /**
   * Close in-app browser
   */
  async dismissBrowser(): Promise<void> {
    try {
      if (await InAppBrowser.isAvailable()) {
        await InAppBrowser.close();
      }
    } catch (error) {
      console.error('❌ Failed to close browser:', error);
    }
  }

  /**
   * Open URL (deep link or external)
   */
  async openURL(url: string): Promise<boolean> {
    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
        return true;
      } else {
        console.warn(`⚠️ Cannot open URL: ${url}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to open URL:', error);
      return false;
    }
  }

  /**
   * Get initial URL (deep link that opened the app)
   */
  async getInitialURL(): Promise<string | null> {
    try {
      const url = await Linking.getInitialURL();
      return url;
    } catch (error) {
      console.error('❌ Failed to get initial URL:', error);
      return null;
    }
  }

  /**
   * Parse URL and extract query parameters
   */
  parseURL(url: string): { path?: string; queryParams: Record<string, string> } {
    try {
      const urlObj = new URL(url);
      const queryParams: Record<string, string> = {};

      urlObj.searchParams.forEach((value, key) => {
        queryParams[key] = value;
      });

      return {
        path: urlObj.pathname,
        queryParams,
      };
    } catch (error) {
      console.error('❌ Failed to parse URL:', error);
      return { queryParams: {} };
    }
  }

  /**
   * Create URL with query parameters
   */
  createURL(path: string, queryParams?: Record<string, string>): string {
    try {
      let url = path;

      if (queryParams && Object.keys(queryParams).length > 0) {
        const params = new URLSearchParams(queryParams);
        url += `?${params.toString()}`;
      }

      return url;
    } catch (error) {
      console.error('❌ Failed to create URL:', error);
      return path;
    }
  }

  /**
   * Add URL event listener
   */
  addEventListener(callback: (event: { url: string }) => void): { remove: () => void } {
    const subscription = Linking.addEventListener('url', callback);

    return {
      remove: () => subscription.remove(),
    };
  }

  /**
   * OAuth/Auth flow helper
   */
  async startAuthSessionAsync(
    authUrl: string,
    redirectUrl: string
  ): Promise<AuthSessionResult> {
    try {
      // Set up URL listener
      let urlListener: { remove: () => void } | null = null;

      const authResult = await new Promise<AuthSessionResult>((resolve) => {
        // Listen for redirect
        urlListener = this.addEventListener(({ url }) => {
          if (url.startsWith(redirectUrl)) {
            const parsed = this.parseURL(url);

            resolve({
              type: 'success',
              url,
              params: parsed.queryParams,
            });

            // Close browser
            this.dismissBrowser();
          }
        });

        // Open auth URL
        this.openBrowserAsync(authUrl).then((result) => {
          if (result.type !== 'opened') {
            resolve({ type: 'cancel' });
          }
        });

        // Timeout after 5 minutes
        setTimeout(() => {
          resolve({ type: 'cancel' });
        }, 300000);
      });

      // Clean up listener
      if (urlListener) {
        urlListener.remove();
      }

      return authResult;
    } catch (error: any) {
      console.error('❌ Auth session failed:', error);
      return {
        type: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Send email
   */
  async sendEmail(
    to: string,
    subject?: string,
    body?: string
  ): Promise<boolean> {
    const url = `mailto:${to}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
    return this.openURL(url);
  }

  /**
   * Make phone call
   */
  async makePhoneCall(phoneNumber: string): Promise<boolean> {
    const url = `tel:${phoneNumber}`;
    return this.openURL(url);
  }

  /**
   * Send SMS
   */
  async sendSMS(phoneNumber: string, body?: string): Promise<boolean> {
    const url = Platform.select({
      ios: `sms:${phoneNumber}${body ? `&body=${encodeURIComponent(body)}` : ''}`,
      android: `sms:${phoneNumber}${body ? `?body=${encodeURIComponent(body)}` : ''}`,
    }) || `sms:${phoneNumber}`;

    return this.openURL(url);
  }

  /**
   * Open maps with address
   */
  async openMaps(address: string): Promise<boolean> {
    const url = Platform.select({
      ios: `maps://app?address=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    }) || `https://maps.google.com/?q=${encodeURIComponent(address)}`;

    return this.openURL(url);
  }

  /**
   * Open app settings
   */
  async openSettings(): Promise<boolean> {
    try {
      await Linking.openSettings();
      return true;
    } catch (error) {
      console.error('❌ Failed to open settings:', error);
      return false;
    }
  }

  /**
   * Check if URL can be opened
   */
  async canOpenURL(url: string): Promise<boolean> {
    try {
      return await Linking.canOpenURL(url);
    } catch (error) {
      console.error('❌ Failed to check URL:', error);
      return false;
    }
  }
}

export const linkingServiceRN = new LinkingServiceRN();
export default linkingServiceRN;
