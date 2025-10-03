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
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../types';
import ApiService from '../services/api';

const { height } = Dimensions.get('window');

type OTPVerificationNavigationProp = StackNavigationProp<RootStackParamList, 'OTPVerification'>;
type OTPVerificationRouteProp = RouteProp<RootStackParamList, 'OTPVerification'>;

const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<OTPVerificationNavigationProp>();
  const route = useRoute<OTPVerificationRouteProp>();
  const insets = useSafeAreaInsets();
  const { phone, email, verificationType, userDetails } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);

    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);

      // Focus last filled input or last input
      const lastFilledIndex = Math.min(index + pastedCode.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isValidOtp = () => {
    return otp.every(digit => digit !== '');
  };

  const handleVerifyOTP = async () => {
    if (!isValidOtp()) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits');
      return;
    }

    setLoading(true);
    try {
      const otpCode = otp.join('');
      const identifier = verificationType === 'phone' ? phone : email;

      if (!identifier) {
        Alert.alert('Error', 'Missing verification identifier');
        return;
      }

      const response = await ApiService.verifyOTP(identifier, otpCode, verificationType);

      if (response.success) {
        if (verificationType === 'phone' && phone) {
          // Move to email input
          navigation.navigate('EmailInput', { phone, userDetails });
        } else if (verificationType === 'email') {
          // Both phone and email verified - now collect password before registration
          navigation.navigate('PasswordCreation', { phone, email, userDetails });
        }
      } else {
        Alert.alert('Error', response.error || 'Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Invalid OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const identifier = verificationType === 'phone' ? phone : email;

      if (!identifier) {
        Alert.alert('Error', 'Missing verification identifier');
        return;
      }

      let response;
      if (verificationType === 'phone') {
        response = await ApiService.sendPhoneOTP(identifier);
      } else {
        response = await ApiService.sendEmailOTP(identifier);
      }

      if (response.success) {
        setResendTimer(30);
        Alert.alert('Success', 'OTP has been resent');
      } else {
        Alert.alert('Error', response.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to resend OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('WelcomeAuth');
    }
  };

  const displayValue = verificationType === 'phone' ? phone : email;
  const stepNumber = verificationType === 'phone' ? 2 : 3;

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
        <View style={styles.header}>
          <Text style={styles.title}>
            Verify Your {verificationType === 'phone' ? 'Phone' : 'Email'}
          </Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={styles.valueText}>{displayValue}</Text>
        </View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoid}
              keyboardVerticalOffset={-50}
            >
              <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.step}>Step {stepNumber} of 5</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.instructionText}>Enter code below</Text>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => { if (ref) inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      digit && styles.filledInput,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    returnKeyType="done"
                    selectionColor="#3396D3"
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.resendButton,
                  resendTimer > 0 && styles.disabledResendButton,
                ]}
                onPress={handleResendOTP}
                disabled={resendTimer > 0}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.resendText,
                  resendTimer > 0 && styles.disabledResendText,
                ]}>
                  {resendTimer > 0
                    ? `Resend code in ${resendTimer}s`
                    : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !isValidOtp() && styles.disabledButton,
                ]}
                onPress={handleVerifyOTP}
                disabled={!isValidOtp() || loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Text style={[
                    styles.continueButtonText,
                    !isValidOtp() && styles.disabledButtonText,
                  ]}>
                    Verify Code
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
    backgroundColor: '#000000',
  },
  gradientFlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
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
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '400',
  },
  valueText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 5,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 20,
    zIndex: 10,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  step: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 30,
    letterSpacing: 0.3,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 50,
    height: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    letterSpacing: 1,
  },
  filledInput: {
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderColor: '#FFFFFF',
    color: '#FFFFFF',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)',
  },
  disabledResendButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resendText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabledResendText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  continueButton: {
    height: 65,
    backgroundColor: '#3396D3',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
});

export default OTPVerificationScreen;