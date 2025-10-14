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

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import ApiService from '../services/api';

const { height } = Dimensions.get('window');

type NewPasswordNavigationProp = StackNavigationProp<RootStackParamList, 'NewPassword'>;
type NewPasswordRouteProp = RouteProp<RootStackParamList, 'NewPassword'>;

const NewPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NewPasswordNavigationProp>();
  const route = useRoute<NewPasswordRouteProp>();
  const { email, resetCode } = route.params;
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, []);

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError('Password must contain uppercase, lowercase, and number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string): boolean => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) validatePassword(text);
    // Re-validate confirm password if it was previously entered
    if (confirmPassword && confirmPasswordError) {
      setTimeout(() => validateConfirmPassword(confirmPassword), 100);
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) validateConfirmPassword(text);
  };

  const handleResetPassword = async () => {
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${ApiService.getBaseURL()}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          resetCode,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      Alert.alert(
        'Password Reset Successful',
        'Your password has been successfully reset. You can now sign in with your new password.',
        [
          {
            text: 'Sign In Now',
            onPress: () => {
              // Navigate back to login screen
              navigation.navigate('Login');
            }
          }
        ]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          'Failed to reset password. Please try again.';

      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        Alert.alert(
          'Reset Code Expired',
          'Your reset code has expired. Please request a new one.',
          [
            {
              text: 'Request New Code',
              onPress: () => navigation.navigate('ForgotPassword')
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isFormValid = () => {
    return password &&
           confirmPassword &&
           !passwordError &&
           !confirmPasswordError;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background dotted pattern */}
      <View style={[styles.backgroundPattern, { opacity: theme.background === '#FFFFFF' ? 0.02 : 0.05 }]}>
        {Array.from({ length: 150 }).map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: theme.text }]} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Create New Password</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Set a strong password to keep your account secure
          </Text>
        </View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { backgroundColor: theme.surface, borderColor: theme.border },
            { transform: [{ translateY: slideAnim }] }
          ]}
        >

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoid}
            >
              <View style={styles.topBar}>
              <TouchableOpacity style={[styles.backButton, { backgroundColor: `${theme.text}10`, borderColor: theme.border }]} onPress={handleBack}>
                <Text style={[styles.backButtonText, { color: theme.text }]}>←</Text>
              </TouchableOpacity>
              <Text style={[styles.step, { color: theme.text }]}>Step 2 of 2</Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        { color: theme.text, backgroundColor: `${theme.text}08`, borderColor: theme.border },
                        passwordError ? styles.inputError : null,
                      ]}
                      placeholder="Enter new password"
                      placeholderTextColor={theme.textTertiary}
                      value={password}
                      onChangeText={handlePasswordChange}
                      onBlur={() => validatePassword(password)}
                      secureTextEntry={!showPassword}
                      returnKeyType="next"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={[styles.eyeIcon, { color: theme.text }]}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                  {passwordError ? (
                    <Text style={styles.errorText}>{passwordError}</Text>
                  ) : null}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[
                        styles.passwordInput,
                        { color: theme.text, backgroundColor: `${theme.text}08`, borderColor: theme.border },
                        confirmPasswordError ? styles.inputError : null,
                      ]}
                      placeholder="Confirm new password"
                      placeholderTextColor={theme.textTertiary}
                      value={confirmPassword}
                      onChangeText={handleConfirmPasswordChange}
                      onBlur={() => validateConfirmPassword(confirmPassword)}
                      secureTextEntry={!showConfirmPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleResetPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Text style={[styles.eyeIcon, { color: theme.text }]}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>
                  {confirmPasswordError ? (
                    <Text style={styles.errorText}>{confirmPasswordError}</Text>
                  ) : null}
                </View>

                <View style={[styles.requirementsContainer, { backgroundColor: `${theme.text}05`, borderColor: theme.border }]}>
                  <Text style={[styles.requirementsTitle, { color: theme.text }]}>Password Requirements:</Text>
                  <View style={styles.requirement}>
                    <Text style={[
                      styles.requirementDot,
                      { color: password.length >= 8 ? theme.success : theme.textSecondary },
                      password.length >= 8 && styles.requirementMet
                    ]}>•</Text>
                    <Text style={[
                      styles.requirementText,
                      { color: password.length >= 8 ? theme.success : theme.textSecondary },
                      password.length >= 8 && styles.requirementMet
                    ]}>At least 8 characters</Text>
                  </View>
                  <View style={styles.requirement}>
                    <Text style={[
                      styles.requirementDot,
                      { color: /[a-z]/.test(password) ? theme.success : theme.textSecondary },
                      /[a-z]/.test(password) && styles.requirementMet
                    ]}>•</Text>
                    <Text style={[
                      styles.requirementText,
                      { color: /[a-z]/.test(password) ? theme.success : theme.textSecondary },
                      /[a-z]/.test(password) && styles.requirementMet
                    ]}>One lowercase letter</Text>
                  </View>
                  <View style={styles.requirement}>
                    <Text style={[
                      styles.requirementDot,
                      { color: /[A-Z]/.test(password) ? theme.success : theme.textSecondary },
                      /[A-Z]/.test(password) && styles.requirementMet
                    ]}>•</Text>
                    <Text style={[
                      styles.requirementText,
                      { color: /[A-Z]/.test(password) ? theme.success : theme.textSecondary },
                      /[A-Z]/.test(password) && styles.requirementMet
                    ]}>One uppercase letter</Text>
                  </View>
                  <View style={styles.requirement}>
                    <Text style={[
                      styles.requirementDot,
                      { color: /\d/.test(password) ? theme.success : theme.textSecondary },
                      /\d/.test(password) && styles.requirementMet
                    ]}>•</Text>
                    <Text style={[
                      styles.requirementText,
                      { color: /\d/.test(password) ? theme.success : theme.textSecondary },
                      /\d/.test(password) && styles.requirementMet
                    ]}>One number</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.resetButton,
                  { backgroundColor: theme.accent },
                  (!isFormValid() || loading) && styles.disabledButton,
                ]}
                onPress={handleResetPassword}
                disabled={!isFormValid() || loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={theme.background} size="large" />
                ) : (
                  <Text style={[
                    styles.resetButtonText,
                    { color: theme.background },
                    !isFormValid() && [styles.disabledButtonText, { color: theme.textSecondary }],
                  ]}>
                    Reset Password
                  </Text>
                )}
              </TouchableOpacity>
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
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
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
  title: {
    fontSize: 32,
    fontWeight: '800',
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
  },
  slidingContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  gradientContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  keyboardAvoid: {
    flex: 1,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 22,
    fontWeight: '600',
  },
  step: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingRight: 60,
    fontSize: 16,
    fontWeight: '500',
    borderWidth: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 20,
    top: 18,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  requirementsContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementDot: {
    fontSize: 20,
    marginRight: 12,
    width: 20,
    textAlign: 'center',
  },
  requirementText: {
    fontSize: 14,
    fontWeight: '500',
  },
  requirementMet: {},
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
  },
  resetButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButtonText: {},
});

export default NewPasswordScreen;