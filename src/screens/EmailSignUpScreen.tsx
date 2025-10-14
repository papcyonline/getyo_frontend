import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { getTranslations } from '../utils/translations';
import AuthService from '../services/auth';
import TermsPrivacyModal from '../components/modals/TermsPrivacyModal';

const { height } = Dimensions.get('window');

type EmailSignUpNavigationProp = StackNavigationProp<RootStackParamList, 'UserDetails'>;

const EmailSignUpScreen: React.FC = () => {
  const navigation = useNavigation<EmailSignUpNavigationProp>();
  const dispatch = useDispatch();
  const currentLanguage = useSelector((state: RootState) => state.user?.user?.preferences?.language || 'en');
  const theme = useSelector((state: RootState) => state.theme.theme);
  const t = getTranslations(currentLanguage);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; score: number; color: string } => {
    let score = 0;

    if (password.length === 0) return { strength: 'weak', score: 0, color: '#666666' };

    // Length check
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1; // lowercase
    if (/[A-Z]/.test(password)) score += 1; // uppercase
    if (/[0-9]/.test(password)) score += 1; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special characters

    if (score <= 2) return { strength: 'weak', score, color: '#FF4757' };
    if (score <= 4) return { strength: 'medium', score, color: '#FFA500' };
    return { strength: 'strong', score, color: '#10B981' };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSignUp = async () => {
    // Validate email
    if (!email.trim() || !validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    // Register with email, password, and terms acceptance
    setLoading(true);
    try {
      const user = await AuthService.register({
        name: 'User', // Temporary name, will be updated during assistant setup
        email: email.toLowerCase().trim(),
        password: password,
        acceptedTerms: true,
        termsVersion: '1.0',
        privacyVersion: '1.0',
      });

      // Navigate to Congratulations screen
      navigation.navigate('Congratulations', {
        phone: '',
        email: user.email,
        userDetails: {
          fullName: '',
          preferredName: '',
          title: '',
        },
        user: user,
        passwordGenerated: false,
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      const errorMessage = error.message || 'Failed to create account. Please try again.';
      Alert.alert('Sign Up Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isFormValid =
    validateEmail(email.trim()) &&
    password.length >= 6 &&
    password === confirmPassword;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: `${theme.text}10`, borderColor: theme.border }]} onPress={handleBack}>
              <MaterialCommunityIcons name="arrow-left" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.text }]}>Sign Up with Email</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Create your account to get started</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.slidingContent}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardAvoid}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="on-drag"
              >
                <View style={styles.formContainer}>
                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email Address</Text>
                  <View style={[styles.inputRow, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={theme.text} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="your.email@example.com"
                      placeholderTextColor={theme.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.underline} />
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Password</Text>
                  <View style={[styles.inputRow, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={theme.text} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={theme.textTertiary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      returnKeyType="next"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                        size={22}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.underline} />

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <View style={styles.passwordStrengthContainer}>
                      <View style={[styles.strengthBarContainer, { backgroundColor: `${theme.text}10` }]}>
                        <View
                          style={[
                            styles.strengthBar,
                            {
                              width: `${(passwordStrength.score / 6) * 100}%`,
                              backgroundColor: passwordStrength.color
                            }
                          ]}
                        />
                      </View>
                      <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                        Password strength: {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Confirm Password</Text>
                  <View style={[styles.inputRow, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={theme.text} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Re-enter your password"
                      placeholderTextColor={theme.textTertiary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleSignUp}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <MaterialCommunityIcons
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={22}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.underline} />

                  {/* Password Match Indicator */}
                  {confirmPassword.length > 0 && (
                    <View style={styles.passwordMatchContainer}>
                      {passwordsMatch ? (
                        <View style={styles.matchSuccess}>
                          <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                          <Text style={styles.matchSuccessText}>Passwords match</Text>
                        </View>
                      ) : (
                        <View style={styles.matchError}>
                          <MaterialCommunityIcons name="close-circle" size={16} color="#FF4757" />
                          <Text style={styles.matchErrorText}>Passwords do not match</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                  style={[styles.signUpButton, { backgroundColor: theme.accent }, (!isFormValid || loading) && styles.disabledButton]}
                  onPress={handleSignUp}
                  disabled={!isFormValid || loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.background} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="account-plus" size={20} color={theme.background} />
                      <Text style={[styles.signUpButtonText, { color: theme.background }]}>Create Account</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Sign In Link */}
                <View style={styles.signInContainer}>
                  <Text style={[styles.signInText, { color: theme.textSecondary }]}>
                    Already have an account?{' '}
                    <Text
                      style={[styles.signInLink, { color: theme.accent }]}
                      onPress={() => navigation.navigate('SignIn')}
                    >
                      Sign In
                    </Text>
                  </Text>
                </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Terms & Privacy Modal */}
      <TermsPrivacyModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  titleSection: {
    paddingHorizontal: 30,
    paddingTop: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  slidingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.70,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    zIndex: 10,
    marginBottom: 8,
  },
  slidingContent: {
    flex: 1,
    paddingTop: 40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 250,
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  inputWrapper: {
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 38,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 56,
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
    padding: 8,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpButton: {
    height: 56,
    borderRadius: 38,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signInContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  signInText: {
    fontSize: 15,
    fontWeight: '500',
  },
  signInLink: {
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    // Colors applied inline with theme
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  passwordStrengthContainer: {
    marginTop: 12,
  },
  strengthBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  passwordMatchContainer: {
    marginTop: 12,
  },
  matchSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchSuccessText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  matchError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchErrorText: {
    fontSize: 13,
    color: '#FF4757',
    fontWeight: '600',
  },
});

export default EmailSignUpScreen;
