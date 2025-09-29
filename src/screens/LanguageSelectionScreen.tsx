import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
  Alert,
  NativeModules,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Localization from 'expo-localization';
import { RootStackParamList } from '../types';
import AuthService from '../services/auth';
import { getTranslations } from '../utils/translations';

const { width, height } = Dimensions.get('window');

type LanguageSelectionNavigationProp = StackNavigationProp<RootStackParamList, 'LanguageSelection'>;

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

const ITEM_HEIGHT = 50;

const LanguageSelectionScreen: React.FC = () => {
  const navigation = useNavigation<LanguageSelectionNavigationProp>();
  const insets = useSafeAreaInsets();

  // Get device language and match to our supported languages
  const getDeviceLanguage = () => {
    try {
      // Get device locale (e.g., 'en-US', 'es-ES', 'zh-CN')
      const deviceLocale = Localization.locale;

      // Check if locale exists
      if (!deviceLocale) {
        console.log('No device locale found, defaulting to English');
        return languages[0];
      }

      // Extract language code (e.g., 'en' from 'en-US')
      const deviceLanguageCode = deviceLocale.split('-')[0].toLowerCase();

      // Find matching language or default to English
      const matchedLanguage = languages.find(lang => lang.code === deviceLanguageCode) || languages[0];

      console.log(`Device locale: ${deviceLocale}, Matched language: ${matchedLanguage.name}`);
      return matchedLanguage;
    } catch (error) {
      console.error('Error detecting device language:', error);
      return languages[0]; // Default to English on error
    }
  };

  const [selectedLanguage, setSelectedLanguage] = useState(getDeviceLanguage());
  const [isLoading, setIsLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Get translations for the currently selected language
  const t = getTranslations(selectedLanguage.code);

  // Check if the language is RTL (Right-to-Left)
  const isRTL = selectedLanguage.code === 'ar';

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  const handleContinue = async () => {
    setIsLoading(true);

    try {
      // Check if user is authenticated (if this is a settings update)
      const isAuthenticated = AuthService.isAuthenticated();

      if (isAuthenticated) {
        // Update user preferences with selected language
        const currentUser = AuthService.getCurrentUser();
        const updatedPreferences = {
          ...currentUser?.preferences,
          language: selectedLanguage.code,
        };

        await AuthService.updatePreferences(updatedPreferences);

        // Navigate without showing alert
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('WelcomeAuth');
        }
      } else {
        // For new users during onboarding, just navigate without any popups
        navigation.navigate('WelcomeAuth');
      }
    } catch (error) {
      console.error('Failed to update language:', error);
      // For new users during onboarding, ignore errors and just proceed
      const isAuthenticated = AuthService.isAuthenticated();
      if (isAuthenticated) {
        Alert.alert(
          t.error,
          t.errorMessage,
          [{ text: t.ok }]
        );
      } else {
        navigation.navigate('WelcomeAuth');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const renderLanguageItem = (language: Language, index: number) => {
    const isSelected = selectedLanguage.code === language.code;

    return (
      <TouchableOpacity
        key={`${language.code}-${index}`}
        style={styles.languageItem}
        onPress={() => handleLanguageSelect(language)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.languageContent,
          isSelected && styles.selectedLanguageContent,
          isRTL && styles.rtlLanguageContent
        ]}>
          <Text style={[styles.flag, isSelected && styles.selectedFlag]}>
            {language.flag}
          </Text>
          <View style={[styles.textContainer, isRTL && styles.rtlTextContainer]}>
            <Text style={[
              styles.languageName,
              isSelected && styles.selectedLanguageName,
              isRTL && styles.rtlText
            ]}>
              {language.name}
            </Text>
            <Text style={[
              styles.nativeName,
              isSelected && styles.selectedNativeName,
              isRTL && styles.rtlText
            ]}>
              {language.nativeName}
            </Text>
          </View>
          {isSelected && (
            <View style={styles.checkmarkContainer}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          )}
        </View>
        {index < languages.length - 1 && (
          <View style={styles.divider} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background gradient flare */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Background dotted pattern */}
      <View style={styles.backgroundPattern}>
        {Array.from({ length: 150 }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>

      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={[styles.title, isRTL && styles.rtlText]}>{t.title}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
            {t.subtitle}
          </Text>
        </View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Gradient overlay for visual effect */}
          <LinearGradient
            colors={['rgba(40, 40, 40, 0.2)', 'rgba(30, 30, 30, 0.6)', 'rgba(20, 20, 20, 0.95)']}
            style={styles.gradientOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
          />

          <View style={styles.pickerContainer}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {languages.map((language, index) => renderLanguageItem(language, index))}
            </ScrollView>
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.disabledButton]}
              onPress={handleContinue}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Text style={[styles.continueButtonText, isRTL && styles.rtlText]}>
                {isLoading ? t.saving : t.continue}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientFlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 1,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    opacity: 0.05,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    margin: 12,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
    zIndex: 2,
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 20,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#F7F2ED',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  pickerContainer: {
    flex: 1,
    paddingTop: 30,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  languageItem: {
    paddingVertical: 15,
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  selectedLanguageContent: {
    backgroundColor: 'transparent',
  },
  flag: {
    fontSize: 20,
    marginRight: 15,
  },
  selectedFlag: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  languageName: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  selectedLanguageName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3396D3',
  },
  nativeName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  selectedNativeName: {
    fontSize: 14,
    color: '#3396D3',
    fontWeight: '500',
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3396D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 30,
    paddingVertical: 30,
    zIndex: 1,
  },
  continueButton: {
    height: 56,
    backgroundColor: '#3396D3',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  skipButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.3,
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.7,
  },
  // RTL styles
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  rtlLanguageContent: {
    flexDirection: 'row-reverse',
  },
  rtlTextContainer: {
    alignItems: 'flex-end',
  },
});

export default LanguageSelectionScreen;