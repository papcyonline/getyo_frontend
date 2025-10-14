import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const TwoFactorAuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<'initial' | 'method-select' | 'phone-verify' | 'verify' | 'complete'>('initial');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'sms'>('email');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch 2FA status on mount
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        setInitialLoading(true);
        const status = await ApiService.get2FAStatus();
        setTwoFactorEnabled(status.enabled);
      } catch (error: any) {
        console.error('Failed to fetch 2FA status:', error);
        // Don't show error to user on mount, just log it
      } finally {
        setInitialLoading(false);
      }
    };

    fetch2FAStatus();
  }, []);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleToggle2FA = async (value: boolean) => {
    if (value) {
      // Enable 2FA - show method selection
      setSetupStep('method-select');
    } else {
      // Disable 2FA - require password
      Alert.prompt(
        'Disable Two-Factor Authentication',
        'Enter your password to confirm:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async (password?: string) => {
              if (!password) {
                Alert.alert('Error', 'Password is required');
                return;
              }

              try {
                setLoading(true);
                await ApiService.disable2FA(password);
                setTwoFactorEnabled(false);
                setSetupStep('initial');
                Alert.alert('Success', 'Two-factor authentication has been disabled');
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to disable 2FA');
                // Re-enable the switch if it failed
                setTwoFactorEnabled(true);
              } finally {
                setLoading(false);
              }
            }
          }
        ],
        'secure-text'
      );
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      await ApiService.verify2FA(verificationCode);

      setTwoFactorEnabled(true);
      setSetupStep('complete');
      setVerificationCode('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSetup = () => {
    setSetupStep('initial');
    setVerificationCode('');
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      const response = await ApiService.setup2FA(selectedMethod);

      // Show OTP in development mode
      if (__DEV__ && response.otp) {
        Alert.alert(
          'Code Sent',
          `A new verification code has been sent to your ${selectedMethod === 'email' ? 'email' : 'phone'}.\n\nDEV MODE - Your code: ${response.otp}`
        );
      } else {
        Alert.alert('Code Sent', `A new verification code has been sent to your ${selectedMethod === 'email' ? 'email' : 'phone'}.`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleMethodSelect = async (method: 'email' | 'sms') => {
    setSelectedMethod(method);

    if (method === 'sms') {
      // Check if phone needs verification
      setSetupStep('phone-verify');
    } else {
      // Email method - proceed directly to 2FA verification
      try {
        setLoading(true);
        const response = await ApiService.setup2FA('email');
        setSetupStep('verify');

        if (__DEV__ && response.otp) {
          Alert.alert(
            'Code Sent',
            `A verification code has been sent to your email.\n\nDEV MODE - Your code: ${response.otp}`
          );
        } else {
          Alert.alert('Code Sent', 'A verification code has been sent to your email.');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to send verification code');
        setSetupStep('method-select');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendPhoneVerification = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.sendPhoneVerificationOTP(phoneNumber);

      if (__DEV__ && response.otp) {
        Alert.alert(
          'Code Sent',
          `A verification code has been sent to ${phoneNumber}.\n\nDEV MODE - Your code: ${response.otp}`
        );
      } else {
        Alert.alert('Code Sent', `A verification code has been sent to ${phoneNumber}.`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    if (!phoneVerificationCode || phoneVerificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      await ApiService.verifyPhoneOTP(phoneNumber, phoneVerificationCode);

      // Phone verified, now send 2FA code
      const response = await ApiService.setup2FA('sms');
      setSetupStep('verify');
      setPhoneVerificationCode('');

      if (__DEV__ && response.otp) {
        Alert.alert(
          '2FA Code Sent',
          `A 2FA verification code has been sent to ${phoneNumber}.\n\nDEV MODE - Your code: ${response.otp}`
        );
      } else {
        Alert.alert('Code Sent', `A 2FA verification code has been sent to ${phoneNumber}.`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify phone number');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Two-Factor Auth</Text>
          <View style={styles.headerRight} />
        </View>

        {setupStep === 'initial' && (
          <>
            {/* Info Section */}
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.infoIconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                <Ionicons name="shield-checkmark" size={32} color="#C9A96E" />
              </View>
              <Text style={[styles.infoTitle, { color: theme.text }]}>
                Secure Your Account
              </Text>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Two-factor authentication adds an extra layer of security by requiring a verification code in addition to your password.
              </Text>
            </View>

            {/* Toggle Section */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                    <Ionicons name="lock-closed" size={20} color="#C9A96E" />
                  </View>
                  <View style={styles.toggleTextContainer}>
                    <Text style={[styles.toggleTitle, { color: theme.text }]}>
                      Enable 2FA
                    </Text>
                    <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                      {twoFactorEnabled ? 'Currently enabled' : 'Currently disabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={twoFactorEnabled}
                  onValueChange={handleToggle2FA}
                  trackColor={{ false: 'rgba(201, 169, 110, 0.3)', true: '#C9A96E' }}
                  thumbColor="#C9A96E"
                  ios_backgroundColor="rgba(201, 169, 110, 0.3)"
                  disabled={loading || initialLoading}
                />
              </View>
            </View>

            {/* How It Works Section */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>HOW IT WORKS</Text>
              <View style={styles.stepContainer}>
                <View style={[styles.stepNumber, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    Enable 2FA
                  </Text>
                  <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                    Toggle the switch above to start the setup process
                  </Text>
                </View>
              </View>
              <View style={styles.stepContainer}>
                <View style={[styles.stepNumber, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    Verify Your Identity
                  </Text>
                  <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                    Enter the 6-digit code sent to your registered phone or email
                  </Text>
                </View>
              </View>
              <View style={styles.stepContainer}>
                <View style={[styles.stepNumber, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>
                    You're Protected
                  </Text>
                  <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                    Each time you sign in, you'll need your password and verification code
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {setupStep === 'method-select' && (
          <>
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.infoIconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                <Ionicons name="options" size={32} color="#C9A96E" />
              </View>
              <Text style={[styles.infoTitle, { color: theme.text }]}>
                Choose Your Method
              </Text>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Select how you'd like to receive your verification codes
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <TouchableOpacity
                style={[styles.methodOption, selectedMethod === 'email' && styles.methodOptionSelected]}
                onPress={() => handleMethodSelect('email')}
                disabled={loading}
              >
                <Ionicons name="mail" size={24} color={selectedMethod === 'email' ? '#C9A96E' : theme.text} />
                <View style={styles.methodTextContainer}>
                  <Text style={[styles.methodTitle, { color: theme.text }]}>Email</Text>
                  <Text style={[styles.methodSubtitle, { color: theme.textSecondary }]}>
                    Receive codes via email
                  </Text>
                </View>
                {selectedMethod === 'email' && (
                  <Ionicons name="checkmark-circle" size={24} color="#C9A96E" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodOption, selectedMethod === 'sms' && styles.methodOptionSelected, { marginTop: 12 }]}
                onPress={() => handleMethodSelect('sms')}
                disabled={loading}
              >
                <Ionicons name="phone-portrait" size={24} color={selectedMethod === 'sms' ? '#C9A96E' : theme.text} />
                <View style={styles.methodTextContainer}>
                  <Text style={[styles.methodTitle, { color: theme.text }]}>SMS</Text>
                  <Text style={[styles.methodSubtitle, { color: theme.textSecondary }]}>
                    Receive codes via text message
                  </Text>
                </View>
                {selectedMethod === 'sms' && (
                  <Ionicons name="checkmark-circle" size={24} color="#C9A96E" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setSetupStep('initial')}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {setupStep === 'phone-verify' && (
          <>
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.infoIconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                <Ionicons name="phone-portrait" size={32} color="#C9A96E" />
              </View>
              <Text style={[styles.infoTitle, { color: theme.text }]}>
                Verify Your Phone
              </Text>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                Enter your phone number to receive SMS verification codes
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PHONE NUMBER</Text>
              <TextInput
                style={[styles.phoneInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={theme.textTertiary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={20}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#C9A96E', marginTop: 16 }]}
                onPress={handleSendPhoneVerification}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Sending...' : 'Send Code'}
                </Text>
              </TouchableOpacity>

              {phoneVerificationCode.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>VERIFICATION CODE</Text>
                  <TextInput
                    style={[styles.codeInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="000000"
                    placeholderTextColor={theme.textTertiary}
                    value={phoneVerificationCode}
                    onChangeText={setPhoneVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#C9A96E' }]}
                    onPress={handleVerifyPhone}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Verifying...' : 'Verify Phone'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setSetupStep('method-select')}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Back</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {setupStep === 'verify' && (
          <>
            {/* Verification Section */}
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.infoIconContainer, { backgroundColor: 'rgba(201, 169, 110, 0.1)' }]}>
                <Ionicons name="mail" size={32} color="#C9A96E" />
              </View>
              <Text style={[styles.infoTitle, { color: theme.text }]}>
                Verify Your Identity
              </Text>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                We've sent a 6-digit verification code to your registered email. Please enter it below.
              </Text>
            </View>

            {/* Code Input */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>VERIFICATION CODE</Text>
              <TextInput
                style={[styles.codeInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="000000"
                placeholderTextColor={theme.textTertiary}
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={loading}
              >
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.verifyButton, { backgroundColor: '#C9A96E' }]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: theme.border }]}
                onPress={handleCancelSetup}
                disabled={loading}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {setupStep === 'complete' && (
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            </View>
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              All Set!
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Two-factor authentication has been successfully enabled for your account.
            </Text>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: '#C9A96E' }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 48,
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 13,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9A96E',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    lineHeight: 18,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9A96E',
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButton: {},
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 20,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodOptionSelected: {
    borderColor: '#C9A96E',
    backgroundColor: 'rgba(201, 169, 110, 0.05)',
  },
  methodTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  methodSubtitle: {
    fontSize: 13,
  },
  phoneInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

export default TwoFactorAuthScreen;
