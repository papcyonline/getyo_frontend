import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocaleInfo {
  locale: string;
  language: string;
  region?: string;
  currency?: string;
  timezone: string;
  isRTL: boolean;
}

class LocaleService {
  private currentLocale: LocaleInfo | null = null;

  async initialize(): Promise<LocaleInfo> {
    try {
      console.log('🌐 Initializing locale service...');

      // Try to get saved locale preference first
      const savedLocale = await AsyncStorage.getItem('userLocale');

      if (savedLocale) {
        console.log('📱 Using saved locale preference:', savedLocale);
        this.currentLocale = JSON.parse(savedLocale);
        return this.currentLocale;
      }

      // Get device locale information
      const deviceLocales = Localization.getLocales();
      const deviceLocale = deviceLocales[0];

      if (!deviceLocale) {
        console.warn('⚠️ No device locale found, using fallback');
        this.currentLocale = this.getFallbackLocale();
        await this.saveLocalePreference(this.currentLocale);
        return this.currentLocale;
      }

      // Extract locale information
      this.currentLocale = {
        locale: deviceLocale.languageTag || 'en-US',
        language: deviceLocale.languageCode || 'en',
        region: deviceLocale.regionCode || 'US',
        currency: deviceLocale.currencyCode || 'USD',
        timezone: Localization.getCalendars()[0]?.timeZone || 'UTC',
        isRTL: deviceLocale.textDirection === 'rtl'
      };

      console.log('✅ Device locale detected:', this.currentLocale);

      // Save for future use
      await this.saveLocalePreference(this.currentLocale);

      return this.currentLocale;
    } catch (error) {
      console.error('❌ Failed to initialize locale service:', error);

      // Use fallback locale
      this.currentLocale = this.getFallbackLocale();
      await this.saveLocalePreference(this.currentLocale);

      return this.currentLocale;
    }
  }

  private getFallbackLocale(): LocaleInfo {
    return {
      locale: 'en-US',
      language: 'en',
      region: 'US',
      currency: 'USD',
      timezone: 'UTC',
      isRTL: false
    };
  }

  private async saveLocalePreference(locale: LocaleInfo): Promise<void> {
    try {
      await AsyncStorage.setItem('userLocale', JSON.stringify(locale));
      console.log('💾 Locale preference saved');
    } catch (error) {
      console.error('Failed to save locale preference:', error);
    }
  }

  getCurrentLocale(): LocaleInfo | null {
    return this.currentLocale;
  }

  getLanguage(): string {
    return this.currentLocale?.language || 'en';
  }

  getRegion(): string {
    return this.currentLocale?.region || 'US';
  }

  getCurrency(): string {
    return this.currentLocale?.currency || 'USD';
  }

  getTimezone(): string {
    return this.currentLocale?.timezone || 'UTC';
  }

  isRTL(): boolean {
    return this.currentLocale?.isRTL || false;
  }

  getFullLocale(): string {
    return this.currentLocale?.locale || 'en-US';
  }

  // Change locale preference
  async setLocale(locale: string): Promise<LocaleInfo> {
    try {
      const [language, region] = locale.split('-');

      this.currentLocale = {
        locale,
        language: language || 'en',
        region: region || 'US',
        currency: this.getCurrencyForRegion(region || 'US'),
        timezone: this.currentLocale?.timezone || 'UTC',
        isRTL: this.isRTLLanguage(language || 'en')
      };

      await this.saveLocalePreference(this.currentLocale);
      console.log('🌐 Locale changed to:', this.currentLocale);

      return this.currentLocale;
    } catch (error) {
      console.error('Failed to set locale:', error);
      throw error;
    }
  }

  private getCurrencyForRegion(region: string): string {
    const currencyMap: Record<string, string> = {
      'US': 'USD',
      'CA': 'CAD',
      'GB': 'GBP',
      'EU': 'EUR',
      'JP': 'JPY',
      'AU': 'AUD',
      'IN': 'INR',
      'CN': 'CNY',
      'KR': 'KRW',
      'BR': 'BRL',
      'MX': 'MXN',
      'ZA': 'ZAR',
    };

    return currencyMap[region] || 'USD';
  }

  private isRTLLanguage(language: string): boolean {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'ku', 'yi'];
    return rtlLanguages.includes(language);
  }

  // Get supported locales for the app
  getSupportedLocales(): string[] {
    return [
      'en-US', // English (US)
      'en-GB', // English (UK)
      'es-ES', // Spanish (Spain)
      'es-MX', // Spanish (Mexico)
      'fr-FR', // French (France)
      'fr-CA', // French (Canada)
      'de-DE', // German
      'it-IT', // Italian
      'pt-BR', // Portuguese (Brazil)
      'pt-PT', // Portuguese (Portugal)
      'ja-JP', // Japanese
      'ko-KR', // Korean
      'zh-CN', // Chinese (Simplified)
      'zh-TW', // Chinese (Traditional)
      'ar-SA', // Arabic (Saudi Arabia)
      'hi-IN', // Hindi (India)
      'ru-RU', // Russian
      'nl-NL', // Dutch
      'sv-SE', // Swedish
      'no-NO', // Norwegian
      'da-DK', // Danish
      'fi-FI', // Finnish
    ];
  }

  // Format currency
  formatCurrency(amount: number): string {
    try {
      const locale = this.getFullLocale();
      const currency = this.getCurrency();

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return `$${amount.toFixed(2)}`; // Fallback
    }
  }

  // Format date
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      const locale = this.getFullLocale();
      return new Intl.DateTimeFormat(locale, {
        timeZone: this.getTimezone(),
        ...options
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return date.toLocaleDateString(); // Fallback
    }
  }

  // Format time
  formatTime(date: Date): string {
    try {
      const locale = this.getFullLocale();
      return new Intl.DateTimeFormat(locale, {
        timeZone: this.getTimezone(),
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Time formatting error:', error);
      return date.toLocaleTimeString(); // Fallback
    }
  }

  // Get locale-specific number format
  formatNumber(number: number): string {
    try {
      const locale = this.getFullLocale();
      return new Intl.NumberFormat(locale).format(number);
    } catch (error) {
      console.error('Number formatting error:', error);
      return number.toString(); // Fallback
    }
  }
}

export default new LocaleService();