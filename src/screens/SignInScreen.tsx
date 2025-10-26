import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';

import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import AuthService from '../services/auth';
import { getTranslations } from '../utils/translations';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const { height } = Dimensions.get('window');

type SignInNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<SignInNavigationProp>();
  const insets = useSafeAreaInsets();

  // Get current language from Redux store
  const currentLanguage = useSelector((state: RootState) => state.user?.user?.preferences?.language || 'en');
  const theme = useSelector((state: RootState) => state.theme.theme);
  const t = getTranslations(currentLanguage);

  // Custom alert hook
  const { alertConfig, isVisible, showError, showSuccess, hideAlert } = useCustomAlert();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const isValidForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && password.length >= 6;
  };

  const handleSignIn = async () => {
    if (!isValidForm()) {
      showError(t.signIn.invalidCredentials, t.signIn.fillAllFields);
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 [DEBUG] Starting login process...');
      console.log('🔐 [DEBUG] Login credentials:', { email, hasPassword: !!password });

      const user = await AuthService.login(email, password);
      console.log('🔐 [DEBUG] Login response received:', {
        success: !!user,
        userExists: !!user,
        hasCompletedOnboarding: user?.hasCompletedOnboarding,
        hasAssistantName: !!(user && user.assistantName),
        assistantName: user?.assistantName,
        userId: user?.id
      });

      // AuthService.login() already dispatches setUser() which syncs hasCompletedOnboarding
      // from the backend user object. No need to dispatch completeOnboarding() again.
      // The AppNavigator will automatically show MainAppNavigator if both isAuthenticated
      // and hasCompletedOnboarding are true, or OnboardingNavigator if hasCompletedOnboarding is false.

      if (user && user.hasCompletedOnboarding) {
        console.log('✅ [DEBUG] User has completed onboarding - AppNavigator will show MainApp');
      } else {
        console.log('🔄 [DEBUG] User has NOT completed onboarding - AppNavigator will show OnboardingNavigator');
        console.log('🔄 [DEBUG] OnboardingNavigator will start at AssistantNaming for authenticated users');
      }

      console.log('✅ [DEBUG] Login process completed successfully');
    } catch (error: any) {
      showError(
        t.signIn.signInFailed,
        error.message || t.signIn.invalidCredentials
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await AuthService.loginWithGoogle();
      // Navigation to main app is handled by auth service
    } catch (error: any) {
      showError(
        t.signIn.signInFailed,
        error.message || `Failed to sign in with ${t.signIn.google}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await AuthService.loginWithApple();
      // Navigation to main app is handled by auth service
    } catch (error: any) {
      showError(
        t.signIn.signInFailed,
        error.message || `Failed to sign in with ${t.signIn.apple}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background gradient */}
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{t.signIn.title}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t.signIn.subtitle}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.slidingContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >

            <View style={styles.topBar}>
              <TouchableOpacity style={[styles.backButton, { backgroundColor: `${theme.text}10`, borderColor: theme.border }]} onPress={handleBack}>
                <Ionicons name="chevron-back-outline" size={24} color={theme.text} />
              </TouchableOpacity>
              <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoid}
            >
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.formContainer}>
                {/* Email Input */}
                <View style={[styles.inputContainer, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                  <MaterialIcons name="email" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={t.signIn.emailPlaceholder}
                    placeholderTextColor={theme.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                {/* Password Input */}
                <View style={[styles.inputContainer, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                  <MaterialIcons name="lock" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={t.signIn.passwordPlaceholder}
                    placeholderTextColor={theme.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={22}
                      color={theme.textTertiary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberMeContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, { borderColor: theme.textSecondary }, rememberMe && [styles.checkboxChecked, { backgroundColor: theme.accent, borderColor: theme.accent }]]}>
                      {rememberMe && (
                        <MaterialIcons name="check" size={14} color={theme.background} />
                      )}
                    </View>
                    <Text style={[styles.rememberMeText, { color: theme.textSecondary }]}>{t.signIn.rememberMe}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={[styles.forgotPasswordText, { color: theme.text }]}>{t.signIn.forgotPassword}</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[styles.signInButton, { backgroundColor: theme.accent }, !isValidForm() && styles.disabledButton]}
                  onPress={handleSignIn}
                  disabled={!isValidForm() || loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.background} size="large" />
                  ) : (
                    <>
                      <MaterialIcons name="login" size={20} color={theme.background} />
                      <Text style={[styles.signInButtonText, { color: theme.background }]}>{t.signIn.signInButton}</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                  <Text style={[styles.dividerText, { color: theme.textSecondary }]}>{t.signIn.orContinueWith}</Text>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                </View>

                {/* Social Sign In Options */}
                <View style={styles.socialButtonsRow}>
                  <TouchableOpacity
                    style={[styles.googleButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-google" size={18} color={theme.text} />
                    <Text style={[styles.googleButtonText, { color: theme.text }]}>{t.signIn.google}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.appleButton, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                    onPress={handleAppleSignIn}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-apple" size={18} color={theme.text} />
                    <Text style={[styles.appleButtonText, { color: theme.text }]}>{t.signIn.apple}</Text>
                  </TouchableOpacity>
                </View>
                </View>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                  <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                    {t.signIn.noAccount}{' '}
                    <Text
                      style={[styles.signUpLink, { color: theme.text }]}
                      onPress={() => navigation.navigate('TermsPrivacy')}
                    >
                      {t.signIn.signUp}
                    </Text>
                  </Text>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={hideAlert}
          primaryButton={alertConfig.primaryButton}
          secondaryButton={alertConfig.secondaryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientFlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  slidingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.75,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    zIndex: 10,
  },
  gradientBackground: {
    flex: 1,
    paddingTop: 10,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  step: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    marginBottom: 20,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    minHeight: 56,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {},
  rememberMeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  signInButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  googleButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  appleButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  appleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 30,
    paddingTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },
  signUpLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;