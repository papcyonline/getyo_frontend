import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { getTranslations } from '../utils/translations';

const { width, height } = Dimensions.get('window');

type UserDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'UserDetails'>;

const UserDetailsScreen: React.FC = () => {
  const navigation = useNavigation<UserDetailsNavigationProp>();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [title, setTitle] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get current language from Redux store
  const currentLanguage = useSelector((state: RootState) => state.user?.user?.preferences?.language || 'en');
  const t = getTranslations(currentLanguage);

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContinue = () => {
    if (!fullName.trim()) {
      Alert.alert(t.userDetails.requiredField, t.userDetails.enterFullName);
      return;
    }

    if (!preferredName.trim()) {
      Alert.alert(t.userDetails.requiredField, t.userDetails.enterPreferredName);
      return;
    }

    // Navigate to PhoneInput with user details
    navigation.navigate('PhoneInput', {
      userDetails: {
        fullName: fullName.trim(),
        preferredName: preferredName.trim(),
        title: title.trim(),
      },
    });
  };

  const isFormValid = fullName.trim().length > 0 && preferredName.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Background gradient flare */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Animated.View
            style={[
              styles.slidingContainer,
              { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
            ]}
          >
            {/* Top Bar - Fixed */}
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.step}>{t.userDetails.title}</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Scrollable Content */}
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.headerSection}>
                <Text style={styles.title}>{t.userDetails.mainTitle}</Text>
                <Text style={styles.subtitle}>
                  {t.userDetails.subtitle}
                </Text>
              </View>

              <View style={styles.formSection}>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.userDetails.fullName}</Text>
                  <Text style={styles.inputDescription}>
                    {t.userDetails.fullNameDescription}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder={t.userDetails.fullNamePlaceholder}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    autoCapitalize="words"
                    autoCorrect={false}
                    selectTextOnFocus={false}
                    blurOnSubmit={false}
                    returnKeyType="next"
                  />
                </View>

                {/* Preferred Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.userDetails.preferredName}</Text>
                  <Text style={styles.inputDescription}>
                    {t.userDetails.preferredNameDescription}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={preferredName}
                    onChangeText={setPreferredName}
                    placeholder={t.userDetails.preferredNamePlaceholder}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    autoCapitalize="words"
                    autoCorrect={false}
                    selectTextOnFocus={false}
                    blurOnSubmit={false}
                    returnKeyType="next"
                  />
                </View>

                {/* Title (Optional) */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.userDetails.titleOptional}</Text>
                  <Text style={styles.inputDescription}>
                    {t.userDetails.titleDescription}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t.userDetails.titlePlaceholder}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    autoCapitalize="words"
                    autoCorrect={false}
                    selectTextOnFocus={false}
                    blurOnSubmit={false}
                    returnKeyType="done"
                  />
                </View>

                {/* Extra spacing when keyboard is visible */}
                {keyboardVisible && <View style={styles.keyboardSpacer} />}
              </View>
            </ScrollView>

            {/* Continue Button - Fixed at bottom when keyboard is hidden */}
            {!keyboardVisible && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.continueButton,
                    { backgroundColor: isFormValid ? '#3396D3' : 'rgba(255, 255, 255, 0.2)' }
                  ]}
                  onPress={handleContinue}
                  disabled={!isFormValid}
                >
                  <Text style={[
                    styles.continueButtonText,
                    { color: isFormValid ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)' }
                  ]}>
                    {t.continue}
                  </Text>
                  <MaterialIcons
                    name="keyboard-arrow-right"
                    size={24}
                    color={isFormValid ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>

        {/* Continue Button - Floating when keyboard is visible */}
        {keyboardVisible && isFormValid && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={styles.floatingContinueButton}
              onPress={handleContinue}
            >
              <Text style={styles.floatingContinueButtonText}>{t.continue}</Text>
              <MaterialIcons
                name="keyboard-arrow-right"
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
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
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  step: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    fontWeight: '400',
  },
  formSection: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  inputDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
    lineHeight: 18,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  keyboardSpacer: {
    height: 100, // Extra space when keyboard is visible
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  // Floating button when keyboard is visible
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 30,
    zIndex: 1000,
  },
  floatingContinueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3396D3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingContinueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 6,
  },
});

export default UserDetailsScreen;