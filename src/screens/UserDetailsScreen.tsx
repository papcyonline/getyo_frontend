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
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { getTranslations } from '../utils/translations';
import ApiService from '../services/api';
import { setUser, setToken } from '../store/slices/userSlice';

const { width, height } = Dimensions.get('window');

type UserDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'UserDetails'>;

const UserDetailsScreen: React.FC = () => {
  const navigation = useNavigation<UserDetailsNavigationProp>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = async () => {
    if (!fullName.trim()) {
      Alert.alert(t.userDetails.requiredField, t.userDetails.enterFullName);
      return;
    }

    if (!preferredName.trim()) {
      Alert.alert(t.userDetails.requiredField, t.userDetails.enterPreferredName);
      return;
    }

    if (!email.trim() || !validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    // Register user directly without OTP
    setLoading(true);
    try {
      const registerResponse = await ApiService.registerEnhanced({
        userDetails: {
          fullName: fullName.trim(),
          preferredName: preferredName.trim(),
          title: title.trim() || undefined,
        },
        email: email.toLowerCase().trim(),
        phone: '', // Empty phone for now - can be added later if needed
        assistantName: '', // Will be set later in AssistantNaming screen
        password: password,
        preferences: {
          language: currentLanguage,
        },
      });

      // Save user and token to Redux store
      dispatch(setUser(registerResponse.user));
      dispatch(setToken(registerResponse.token));

      // Navigate to Congratulations/Welcome screen
      navigation.navigate('Congratulations', {
        phone: '',
        email: registerResponse.user.email,
        userDetails: {
          fullName: fullName.trim(),
          preferredName: preferredName.trim(),
          title: title.trim(),
        },
        user: registerResponse.user,
        token: registerResponse.token,
        passwordGenerated: registerResponse.passwordGenerated,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create account. Please try again.';
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    fullName.trim().length > 0 &&
    preferredName.trim().length > 0 &&
    validateEmail(email.trim()) &&
    password.length >= 6 &&
    password === confirmPassword;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar - Fixed on black background */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 15) + 10 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#FFF7F5" />
          </TouchableOpacity>
          <Text style={styles.step}>{t.userDetails.title}</Text>
          <View style={styles.placeholder} />
        </View>

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
                    placeholderTextColor="rgba(255, 247, 245, 0.5)"
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
                    placeholderTextColor="rgba(255, 247, 245, 0.5)"
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
                    placeholderTextColor="rgba(255, 247, 245, 0.5)"
                    autoCapitalize="words"
                    autoCorrect={false}
                    selectTextOnFocus={false}
                    blurOnSubmit={false}
                    returnKeyType="next"
                  />
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <Text style={styles.inputDescription}>
                    We'll send a verification code to this email
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@example.com"
                    placeholderTextColor="rgba(255, 247, 245, 0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectTextOnFocus={false}
                    blurOnSubmit={false}
                    returnKeyType="next"
                  />
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Create Password</Text>
                  <Text style={styles.inputDescription}>
                    Must be at least 6 characters
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      placeholderTextColor="rgba(255, 247, 245, 0.5)"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectTextOnFocus={false}
                      blurOnSubmit={false}
                      returnKeyType="next"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialIcons
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        size={22}
                        color="rgba(255, 247, 245, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <Text style={styles.inputDescription}>
                    Re-enter your password
                  </Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm password"
                      placeholderTextColor="rgba(255, 247, 245, 0.5)"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      selectTextOnFocus={false}
                      blurOnSubmit={false}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <MaterialIcons
                        name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                        size={22}
                        color="rgba(255, 247, 245, 0.6)"
                      />
                    </TouchableOpacity>
                  </View>
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
                    { backgroundColor: (isFormValid && !loading) ? '#3396D3' : 'rgba(255, 247, 245, 0.2)' }
                  ]}
                  onPress={handleContinue}
                  disabled={!isFormValid || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF7F5" size="large" />
                  ) : (
                    <>
                      <Text style={[
                        styles.continueButtonText,
                        { color: isFormValid ? '#FFF7F5' : 'rgba(255, 247, 245, 0.5)' }
                      ]}>
                        Create Account
                      </Text>
                      <MaterialIcons
                        name="keyboard-arrow-right"
                        size={24}
                        color={isFormValid ? '#FFF7F5' : 'rgba(255, 247, 245, 0.5)'}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Continue Button - Floating when keyboard is visible */}
          {keyboardVisible && isFormValid && !loading && (
            <View style={styles.floatingButtonContainer}>
              <TouchableOpacity
                style={styles.floatingContinueButton}
                onPress={handleContinue}
              >
                <Text style={styles.floatingContinueButtonText}>Create Account</Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={18}
                  color="#FFF7F5"
                />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 247, 245, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  step: {
    fontSize: 24,
    color: '#FFF7F5',
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  placeholder: {
    width: 40,
  },
  keyboardContainer: {
    flex: 1,
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.1)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 30,
  },
  headerSection: {
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF7F5',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 247, 245, 0.7)',
    lineHeight: 22,
    fontWeight: '400',
  },
  formSection: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF7F5',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputDescription: {
    fontSize: 13,
    color: 'rgba(255, 247, 245, 0.6)',
    marginBottom: 8,
    lineHeight: 18,
  },
  textInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 247, 245, 0.08)',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 247, 245, 0.15)',
    paddingHorizontal: 18,
    height: 56,
    fontSize: 16,
    color: '#FFF7F5',
    fontWeight: '500',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: 'rgba(255, 247, 245, 0.08)',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 247, 245, 0.15)',
    paddingHorizontal: 18,
    paddingRight: 50,
    height: 56,
    fontSize: 16,
    color: '#FFF7F5',
    fontWeight: '500',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  keyboardSpacer: {
    height: 100, // Extra space when keyboard is visible
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  continueButton: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 1000,
  },
  floatingContinueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3396D3',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    elevation: 8,
    shadowColor: '#3396D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingContinueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF7F5',
  },
});

export default UserDetailsScreen;