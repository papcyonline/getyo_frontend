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
  const theme = useSelector((state: RootState) => state.theme.theme);
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

    // Navigate directly to UserDetails - terms already accepted in footer
    navigation.navigate('UserDetails', {
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background gradient flare */}
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: theme.text }]}>{t.signUp?.title || 'Create Account'}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t.signUp?.subtitle || 'Join us and get your personal AI assistant'}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
            { transform: [{ translateY: slideAnim }] }
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
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formContainer}>
                  {/* Name Input */}
                  <View style={styles.inputWrapper}>
                    <View style={[styles.inputRow, { backgroundColor: `${theme.text}05`, borderColor: theme.border }]}>
                      <MaterialIcons name="person" size={20} color="#2196F3" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder={t.signUp?.namePlaceholder || 'Full Name'}
                        placeholderTextColor={theme.textTertiary}
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
                    <View style={[styles.inputRow, { backgroundColor: `${theme.text}05`, borderColor: theme.border }]}>
                      <MaterialIcons name="email" size={20} color="#F44336" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder={t.signUp?.emailPlaceholder || 'Email Address'}
                        placeholderTextColor={theme.textTertiary}
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
                    <View style={[styles.inputRow, { backgroundColor: `${theme.text}05`, borderColor: theme.border }]}>
                      <MaterialIcons name="lock" size={20} color="#FFC107" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder={t.signUp?.passwordPlaceholder || 'Password'}
                        placeholderTextColor={theme.textTertiary}
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
                          color={theme.textSecondary}
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
                    <View style={[styles.inputRow, { backgroundColor: `${theme.text}05`, borderColor: theme.border }]}>
                      <MaterialIcons name="lock" size={20} color="#FFC107" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder={t.signUp?.confirmPasswordPlaceholder || 'Confirm Password'}
                        placeholderTextColor={theme.textTertiary}
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
                          color={theme.textSecondary}
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
                    style={[styles.signUpButton, { backgroundColor: theme.accent }, !isFormValid() && styles.disabledButton]}
                    onPress={handleSignUp}
                    disabled={!isFormValid()}
                    activeOpacity={0.9}
                  >
                    <MaterialIcons name="person-add" size={20} color={theme.background} />
                    <Text style={[styles.signUpButtonText, { color: theme.background }]}>{t.signUp?.signUpButton || 'Create Account'}</Text>
                  </TouchableOpacity>

                  {/* OR Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                    <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR</Text>
                    <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                  </View>

                  {/* Google Sign In Button */}
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: `${theme.text}10`, borderColor: theme.border }]}
                    onPress={handleGoogleSignIn}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="login" size={20} color="#4285F4" />
                    <Text style={[styles.socialButtonText, { color: theme.text }]}>Continue with Google</Text>
                  </TouchableOpacity>

                  {/* Apple Sign In Button */}
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: `${theme.text}10`, borderColor: theme.border }]}
                    onPress={handleAppleSignIn}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="apple" size={20} color={theme.background === '#FFFFFF' ? '#000000' : '#FFFFFF'} />
                    <Text style={[styles.socialButtonText, { color: theme.text }]}>Continue with Apple</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                  {t.signUp?.haveAccount || 'Already have an account?'}{' '}
                  <Text
                    style={[styles.signInLink, { color: theme.text }]}
                    onPress={() => navigation.navigate('SignIn')}
                  >
                    {t.signUp?.signIn || 'Sign In'}
                  </Text>
                </Text>
              </View>
            </KeyboardAvoidingView>
        </Animated.View>
      </SafeAreaView>
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
  headerTop: {
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
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 38,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  underline: {
    height: 0,
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
    borderRadius: 38,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: 30,
    paddingTop: 10,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  signInLink: {
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
  },
  dividerText: {
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: '600',
  },
  socialButton: {
    height: 52,
    borderRadius: 35,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default SignUpScreen;
