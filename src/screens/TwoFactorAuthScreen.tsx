import React, { useState } from 'react';
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

const TwoFactorAuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<'initial' | 'verify' | 'complete'>('initial');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleToggle2FA = async (value: boolean) => {
    if (value) {
      // Enable 2FA - start setup process
      setSetupStep('verify');
    } else {
      // Disable 2FA
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable 2FA? This will reduce your account security.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                // TODO: Implement disable 2FA API call
                // await ApiService.disable2FA();
                setTwoFactorEnabled(false);
                setSetupStep('initial');
                Alert.alert('Success', 'Two-factor authentication has been disabled');
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to disable 2FA');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
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
      // TODO: Implement verify 2FA code API call
      // await ApiService.verify2FACode(verificationCode);

      setTwoFactorEnabled(true);
      setSetupStep('complete');
      Alert.alert('Success', 'Two-factor authentication has been enabled');
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
                  disabled={loading}
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
              <TouchableOpacity style={styles.resendButton}>
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
});

export default TwoFactorAuthScreen;
