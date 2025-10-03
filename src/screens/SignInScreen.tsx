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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState, AppDispatch } from '../store';
import { completeOnboarding } from '../store/slices/userSlice';
import AuthService from '../services/auth';
import { getTranslations } from '../utils/translations';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const { height } = Dimensions.get('window');

type SignInNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<SignInNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();

  // Get current language from Redux store
  const currentLanguage = useSelector((state: RootState) => state.user?.user?.preferences?.language || 'en');
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
        hasAssistantName: !!(user && user.assistantName),
        assistantName: user?.assistantName,
        userId: user?.id
      });

      // Check if user has completed onboarding
      // Use the hasCompletedOnboarding flag from backend
      if (user && user.hasCompletedOnboarding) {
        console.log('✅ [DEBUG] User has completed onboarding, dispatching completeOnboarding()');
        // Mark onboarding as complete
        dispatch(completeOnboarding());
        console.log('✅ [DEBUG] completeOnboarding() dispatched successfully');
      } else {
        console.log('🔄 [DEBUG] User has NOT completed onboarding');
        // Determine where to resume onboarding based on what's missing
        if (!user.assistantName) {
          console.log('🔄 [DEBUG] Missing assistantName, navigating to AssistantNaming');
          navigation.navigate('AssistantNaming' as any);
        } else if (!user.agentConfiguration?.setupCompleted) {
          console.log('🔄 [DEBUG] Missing agent setup, navigating to AgentPersonality');
          navigation.navigate('AgentPersonality' as any);
        } else {
          // Fallback to assistant naming if we're not sure
          console.log('🔄 [DEBUG] Uncertain state, navigating to AssistantNaming');
          navigation.navigate('AssistantNaming' as any);
        }
        console.log('🔄 [DEBUG] Navigation triggered');
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
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.signIn.title}</Text>
            <Text style={styles.subtitle}>
              {t.signIn.subtitle}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.slidingContainer,
            {
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(40, 40, 40, 0.1)', 'rgba(30, 30, 30, 0.3)', 'rgba(20, 20, 20, 0.7)']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoid}
            >
              <View style={styles.formContainer}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t.signIn.emailPlaceholder}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color="rgba(255, 255, 255, 0.7)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t.signIn.passwordPlaceholder}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
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
                      size={20}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                  </TouchableOpacity>
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberMeContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe && (
                        <MaterialIcons name="check" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={styles.rememberMeText}>{t.signIn.rememberMe}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotPasswordText}>{t.signIn.forgotPassword}</Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[styles.signInButton, !isValidForm() && styles.disabledButton]}
                  onPress={handleSignIn}
                  disabled={!isValidForm() || loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="large" />
                  ) : (
                    <>
                      <MaterialIcons name="login" size={20} color="#FFFFFF" />
                      <Text style={styles.signInButtonText}>{t.signIn.signInButton}</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>{t.signIn.orContinueWith}</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Sign In Options */}
                <View style={styles.socialButtonsRow}>
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-google" size={18} color="#333333" />
                    <Text style={styles.googleButtonText}>{t.signIn.google}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
                    <Text style={styles.appleButtonText}>{t.signIn.apple}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <Text style={styles.footerText}>
                  {t.signIn.noAccount}{' '}
                  <Text
                    style={styles.signUpLink}
                    onPress={() => navigation.navigate('TermsPrivacy')}
                  >
                    {t.signIn.signUp}
                  </Text>
                </Text>
              </View>
            </KeyboardAvoidingView>
          </LinearGradient>
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
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  step: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  eyeButton: {
    padding: 4,
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
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'transparent',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3396D3',
    borderColor: '#3396D3',
  },
  rememberMeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  signInButton: {
    height: 56,
    backgroundColor: '#3396D3',
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    shadowColor: '#3396D3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
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
    backgroundColor: '#3396D3',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  appleButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  appleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 30,
    paddingTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
  },
  signUpLink: {
    color: '#FFFFFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignInScreen;