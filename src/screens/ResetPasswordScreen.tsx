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
  ScrollView,
  SafeAreaView,
} from 'react-native';

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import AuthService from '../services/auth';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const { height } = Dimensions.get('window');

type ResetPasswordNavigationProp = StackNavigationProp<RootStackParamList, 'ResetPassword'>;

interface RouteParams {
  email: string;
  token: string;
}

const ResetPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ResetPasswordNavigationProp>();
  const route = useRoute();
  const { email, token: initialToken } = (route.params as RouteParams) || {};
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [resetToken, setResetToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const tokenInputRef = useRef<View>(null);
  const passwordInputRef = useRef<View>(null);
  const confirmPasswordInputRef = useRef<View>(null);

  const { alertConfig, isVisible, showError, showSuccess, hideAlert } = useCustomAlert();

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

  const isValidPassword = () => {
    return newPassword.length >= 6 && newPassword === confirmPassword;
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim()) {
      showError('Missing Code', 'Please enter the 6-digit code from your email');
      return;
    }

    if (!isValidPassword()) {
      showError('Invalid Password', 'Passwords must be at least 6 characters and match');
      return;
    }

    setLoading(true);

    try {
      await AuthService.resetPassword(email, resetToken.trim(), newPassword);

      showSuccess(
        'Success!',
        'Your password has been reset. You can now sign in with your new password.',
        () => {
          hideAlert();
          navigation.navigate('SignIn');
        }
      );
    } catch (error: any) {
      showError('Reset Failed', error.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const scrollToInput = (inputRef: React.RefObject<View>) => {
    setTimeout(() => {
      inputRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
        },
        () => {}
      );
    }, 100);
  };

  const getPasswordStrength = () => {
    if (newPassword.length === 0) return { text: '', color: 'transparent' };
    if (newPassword.length < 6) return { text: 'Too short', color: '#FF6B6B' };
    if (newPassword.length < 8) return { text: 'Fair', color: '#FFB347' };
    if (newPassword.length >= 8) return { text: 'Strong', color: '#51CF66' };
    return { text: '', color: 'transparent' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: `${theme.text}10`, borderColor: theme.border }]}
              onPress={handleBack}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.text }]}>Create New Password</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Your new password must be different from your previous password
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <View style={styles.formContainer}>
                {/* Reset Token Input */}
                <View style={styles.inputContainer} ref={tokenInputRef} collapsable={false}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Reset Token</Text>
                  <View style={[styles.inputRow, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                    <MaterialIcons name="vpn-key" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={theme.textTertiary}
                      value={resetToken}
                      onChangeText={setResetToken}
                      onFocus={() => scrollToInput(tokenInputRef)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                    Check your email for the reset code
                  </Text>
                </View>

                {/* New Password Input */}
                <View style={styles.inputContainer} ref={passwordInputRef} collapsable={false}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>New Password</Text>
                  <View style={[styles.inputRow, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                    <MaterialIcons name="lock" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Enter new password"
                      placeholderTextColor={theme.textTertiary}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      onFocus={() => scrollToInput(passwordInputRef)}
                      secureTextEntry={!showNewPassword}
                      autoComplete="password-new"
                      textContentType="newPassword"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <MaterialIcons
                        name={showNewPassword ? "visibility" : "visibility-off"}
                        size={20}
                        color={theme.accent}
                      />
                    </TouchableOpacity>
                  </View>
                  {newPassword.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                        {passwordStrength.text}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer} ref={confirmPasswordInputRef} collapsable={false}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Confirm Password</Text>
                  <View style={[styles.inputRow, { backgroundColor: `${theme.text}08`, borderColor: theme.border }]}>
                    <MaterialIcons name="lock" size={20} color={theme.accent} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder="Confirm new password"
                      placeholderTextColor={theme.textTertiary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => scrollToInput(confirmPasswordInputRef)}
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="password-new"
                      textContentType="newPassword"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <MaterialIcons
                        name={showConfirmPassword ? "visibility" : "visibility-off"}
                        size={20}
                        color={theme.accent}
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <Text style={styles.errorText}>Passwords don't match</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.resetButton,
                    { backgroundColor: theme.accent },
                    (!isValidPassword() || loading) && styles.disabledButton
                  ]}
                  onPress={handleResetPassword}
                  disabled={!isValidPassword() || loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.background} />
                  ) : (
                    <>
                      <MaterialIcons name="check-circle" size={20} color={theme.background} />
                      <Text style={[styles.resetButtonText, { color: theme.background }]}>Reset Password</Text>
                    </>
                  )}
                </TouchableOpacity>

                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  Make sure your password is at least 6 characters long and contains a mix of letters and numbers
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
    height: height * 0.65,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    zIndex: 10,
    marginBottom: 8,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 30,
    paddingBottom: 300, // Extra padding so keyboard doesn't cover inputs
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  inputContainer: {
    marginBottom: 24,
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
    borderRadius: 30,
    borderWidth: 1.5,
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
  eyeButton: {
    padding: 4,
  },
  helperText: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  strengthContainer: {
    marginTop: 8,
    marginLeft: 4,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: '#FF4757',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  resetButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ResetPasswordScreen;