import * as RNLocalize from 'react-native-localize';
import i18n from 'i18next';

/**
 * Pure React Native Localization Service
 * Replaces expo-localization with react-native-localize
 */

class LocaleServiceRN {
  private currentLocale: string = 'en-US';

  /**
   * Initialize localization
   */
  async initialize(): Promise<void> {
    try {
      console.log('🌐 Initializing localization service...');

      // Get device locale
      const locales = RNLocalize.getLocales();
      if (locales && locales.length > 0) {
        this.currentLocale = locales[0].languageTag;
        console.log('📍 Device locale:', this.currentLocale);
      }

      // Listen for locale changes
      RNLocalize.addEventListener('change', this.handleLocaleChange);

      console.log('✅ Localization service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize localization:', error);
    }
  }

  /**
   * Handle locale change
   */
  private handleLocaleChange = () => {
    const locales = RNLocalize.getLocales();
    if (locales && locales.length > 0) {
      const newLocale = locales[0].languageTag;
      if (newLocale !== this.currentLocale) {
        console.log('🔄 Locale changed from', this.currentLocale, 'to', newLocale);
        this.currentLocale = newLocale;

        // Update i18n if configured
        if (i18n.isInitialized) {
          i18n.changeLanguage(this.getLanguageCode());
        }
      }
    }
  };

  /**
   * Get current locale (e.g., "en-US")
   */
  getLocale(): string {
    return this.currentLocale;
  }

  /**
   * Get language code (e.g., "en" from "en-US")
   */
  getLanguageCode(): string {
    return this.currentLocale.split('-')[0];
  }

  /**
   * Get region code (e.g., "US" from "en-US")
   */
  getRegionCode(): string | null {
    const parts = this.currentLocale.split('-');
    return parts.length > 1 ? parts[1] : null;
  }

  /**
   * Get all locales
   */
  getLocales(): RNLocalize.Locale[] {
    return RNLocalize.getLocales();
  }

  /**
   * Get currency information
   */
  getCurrency(): string | null {
    const currencies = RNLocalize.getCurrencies();
    return currencies && currencies.length > 0 ? currencies[0] : null;
  }

  /**
   * Get country code
   */
  getCountry(): string | null {
    return RNLocalize.getCountry();
  }

  /**
   * Get timezone
   */
  getTimezone(): string {
    return RNLocalize.getTimeZone();
  }

  /**
   * Get calendar type
   */
  getCalendar(): string {
    return RNLocalize.getCalendar();
  }

  /**
   * Check if device uses 24-hour format
   */
  uses24HourClock(): boolean {
    return RNLocalize.uses24HourClock();
  }

  /**
   * Check if device uses metric system
   */
  usesMetricSystem(): boolean {
    return RNLocalize.usesMetricSystem();
  }

  /**
   * Find best available language
   */
  findBestAvailableLanguage(languageTags: string[]): {
    languageTag: string;
    isRTL: boolean;
  } | null {
    const result = RNLocalize.findBestLanguageTag(languageTags);
    return result || null;
  }

  /**
   * Get number format settings
   */
  getNumberFormatSettings(): RNLocalize.NumberFormatSettings {
    return RNLocalize.getNumberFormatSettings();
  }

  /**
   * Format number according to locale
   */
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(this.currentLocale, options).format(num);
    } catch (error) {
      console.error('❌ Failed to format number:', error);
      return num.toString();
    }
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
    } catch (error) {
      console.error('❌ Failed to format date:', error);
      return date.toString();
    }
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(amount: number, currencyCode?: string): string {
    try {
      const currency = currencyCode || this.getCurrency() || 'USD';
      return new Intl.NumberFormat(this.currentLocale, {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      console.error('❌ Failed to format currency:', error);
      return amount.toString();
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    RNLocalize.removeEventListener('change', this.handleLocaleChange);
    console.log('✅ Localization service destroyed');
  }
}

export const localeServiceRN = new LocaleServiceRN();
export default localeServiceRN;
