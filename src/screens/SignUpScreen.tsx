import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../store';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { getTranslations } from '../utils/translations';

const { height } = Dimensions.get('window');

type SignUpNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

const SignUpScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation<SignUpNavigationProp>();
  const insets = useSafeAreaInsets();
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

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setErrors(prev => ({ ...prev, name: 'Full name is required' }));
      return false;
    }
    if (name.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: '' }));
    return true;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    }
    if (password.length < 6) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string): boolean => {
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      return false;
    }
    if (confirmPassword !== formData.password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return false;
    }
    setErrors(prev => ({ ...prev, confirmPassword: '' }));
    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSignUp = async () => {
    const isNameValid = validateName(formData.name);
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(formData.confirmPassword);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    // Navigate to proper onboarding flow - registration happens AFTER OTP verification
    navigation.navigate('TermsPrivacy', {
      signUpData: {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      }
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleGoogleSignIn = () => {
    Alert.alert('Coming Soon', 'Google Sign-In will be available soon.');
  };

  const handleAppleSignIn = () => {
    Alert.alert('Coming Soon', 'Apple Sign-In will be available soon.');
  };

  const isFormValid = () => {
    return formData.name.trim() &&
           formData.email.trim() &&
           formData.password &&
           formData.confirmPassword &&
           !Object.values(errors).some(error => error !== '');
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

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{t.signUp?.title || 'Create Account'}</Text>
            <Text style={styles.subtitle}>
              {t.signUp?.subtitle || 'Join us and get your personal AI assistant'}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: slideAnim }] }
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
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formContainer}>
                  {/* Name Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputRow}>
                      <MaterialIcons name="person" size={20} color="#3396D3" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder={t.signUp?.namePlaceholder || 'Full Name'}
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        value={formData.name}
                        onChangeText={(text) => handleInputChange('name', text)}
                        onBlur={() => validateName(formData.name)}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                    <View style={styles.underline} />
                    {errors.name ? (
                      <Text style={styles.errorText}>{errors.name}</Text>
                    ) : null}
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputRow}>
                      <MaterialIcons name="email" size={20} color="#3396D3" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder={t.signUp?.emailPlaceholder || 'Email Address'}
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        value={formData.email}
                        onChangeText={(text) => handleInputChange('email', text)}
                        onBlur={() => validateEmail(formData.email)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        returnKeyType="next"
                      />
                    </View>
                    <View style={styles.underline} />
                    {errors.email ? (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    ) : null}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputRow}>
                      <MaterialIcons name="lock" size={20} color="#3396D3" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder={t.signUp?.passwordPlaceholder || 'Password'}
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        value={formData.password}
                        onChangeText={(text) => handleInputChange('password', text)}
                        onBlur={() => validatePassword(formData.password)}
                        secureTextEntry={!showPassword}
                        autoComplete="password"
                        returnKeyType="next"
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <MaterialIcons
                          name={showPassword ? "visibility" : "visibility-off"}
                          size={20}
                          color="rgba(255, 255, 255, 0.6)"
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.underline} />
                    {errors.password ? (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    ) : null}
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputWrapper}>
                    <View style={styles.inputRow}>
                      <MaterialIcons name="lock" size={20} color="#3396D3" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder={t.signUp?.confirmPasswordPlaceholder || 'Confirm Password'}
                        placeholderTextColor="rgba(255, 255, 255, 0.4)"
                        value={formData.confirmPassword}
                        onChangeText={(text) => handleInputChange('confirmPassword', text)}
                        onBlur={() => validateConfirmPassword(formData.confirmPassword)}
                        secureTextEntry={!showConfirmPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleSignUp}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <MaterialIcons
                          name={showConfirmPassword ? "visibility" : "visibility-off"}
                          size={20}
                          color="rgba(255, 255, 255, 0.6)"
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.underline} />
                    {errors.confirmPassword ? (
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    ) : null}
                  </View>

                  {/* Sign Up Button */}
                  <TouchableOpacity
                    style={[styles.signUpButton, !isFormValid() && styles.disabledButton]}
                    onPress={handleSignUp}
                    disabled={!isFormValid()}
                    activeOpacity={0.9}
                  >
                    <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                    <Text style={styles.signUpButtonText}>{t.signUp?.signUpButton || 'Create Account'}</Text>
                  </TouchableOpacity>

                  {/* OR Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Google Sign In Button */}
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={handleGoogleSignIn}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="login" size={20} color="#FFFFFF" />
                    <Text style={styles.socialButtonText}>Continue with Google</Text>
                  </TouchableOpacity>

                  {/* Apple Sign In Button */}
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={handleAppleSignIn}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="apple" size={20} color="#FFFFFF" />
                    <Text style={styles.socialButtonText}>Continue with Apple</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <Text style={styles.footerText}>
                  {t.signUp?.haveAccount || 'Already have an account?'}{' '}
                  <Text
                    style={styles.signInLink}
                    onPress={() => navigation.navigate('SignIn')}
                  >
                    {t.signUp?.signIn || 'Sign In'}
                  </Text>
                </Text>
              </View>
            </KeyboardAvoidingView>
          </LinearGradient>
        </Animated.View>
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
  headerTop: {
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 10,
  },
  formContainer: {
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 25,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
  underline: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 6,
    marginLeft: 32,
    fontWeight: '500',
  },
  signUpButton: {
    height: 56,
    backgroundColor: '#3396D3',
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: 'rgba(51, 150, 211, 0.3)',
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
  },
  signInLink: {
    color: '#3396D3',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: '600',
  },
  socialButton: {
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

export default SignUpScreen;
