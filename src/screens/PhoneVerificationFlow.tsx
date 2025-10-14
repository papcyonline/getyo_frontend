import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

const { height } = Dimensions.get('window');

type PhoneVerificationNavigationProp = StackNavigationProp<RootStackParamList, 'PhoneInput'>;

interface Country {
  code: string;
  name: string;
  flag: string;
}

const countries: Country[] = [
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
];

const PhoneVerificationFlow: React.FC = () => {
  const navigation = useNavigation<PhoneVerificationNavigationProp>();

  // State
  const [currentStep, setCurrentStep] = useState<'phone' | 'otp' | 'email'>('phone');
  const [selectedCountry, setSelectedCountry] = useState({ code: '+1', name: 'United States', flag: '🇺🇸' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);

  // Animation
  const otpCardAnim = useRef(new Animated.Value(height)).current;
  const emailCardAnim = useRef(new Animated.Value(height)).current;

  // Phone validation
  const isValidPhone = () => phoneNumber.replace(/\D/g, '').length >= 10;
  const isValidEmail = () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Send verification
  const handleSendVerification = () => {
    if (!isValidPhone()) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentStep('otp');
      Animated.spring(otpCardAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }, 1000);
  };

  // Verify OTP
  const handleVerifyOTP = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentStep('email');
      Animated.spring(emailCardAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }, 1000);
  };

  // Submit email
  const handleEmailSubmit = () => {
    if (!isValidEmail()) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('AssistantNaming', {
        phone: phoneNumber,
        email: email,
      });
    }, 1000);
  };

  // Handle OTP input
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  return (
    <View style={styles.container}>
      {/* Background gradient flare */}
      

      {/* AI-themed background shapes */}
      <View style={styles.backgroundShapes}>
        {Array.from({ length: 12 }).map((_, i) => {
          const shapeType = i % 4;
          return (
            <View
              key={i}
              style={[
                styles.floatingShape,
                {
                  top: Math.random() * height,
                  left: Math.random() * 300,
                },
              ]}
            >
              {shapeType === 0 && <MaterialIcons name="mic" size={20} color="rgba(51, 150, 211, 0.3)" />}
              {shapeType === 1 && <MaterialIcons name="psychology" size={20} color="rgba(75, 0, 130, 0.3)" />}
              {shapeType === 2 && <MaterialIcons name="hub" size={20} color="rgba(25, 25, 112, 0.3)" />}
              {shapeType === 3 && <MaterialIcons name="memory" size={20} color="rgba(138, 43, 226, 0.3)" />}
            </View>
          );
        })}
      </View>

      <SafeAreaView style={styles.safeArea}>

        {/* Phone Input Screen (Base) */}
        <View style={styles.baseScreen}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFF7F5" />
            </TouchableOpacity>
            <Text style={styles.stepText}>Step 1 of 3</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Enter your phone number</Text>
            <Text style={styles.subtitle}>We'll send you a verification code</Text>

            {/* Country Selector */}
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountryModal(true)}
            >
              <Text style={styles.flagText}>{selectedCountry.flag}</Text>
              <Text style={styles.countryCode}>{selectedCountry.code}</Text>
              <Ionicons name="chevron-down" size={20} color="rgba(255, 247, 245, 0.6)" />
            </TouchableOpacity>

            {/* Phone Input */}
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="rgba(255, 247, 245, 0.5)"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.button, !isValidPhone() && styles.disabledButton]}
              onPress={handleSendVerification}
              disabled={!isValidPhone() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF7F5" />
              ) : (
                <Text style={styles.buttonText}>Send Verification</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* OTP Card */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: otpCardAnim }] }
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Animated.spring(otpCardAnim, {
                  toValue: height,
                  useNativeDriver: true,
                }).start(() => setCurrentStep('phone'));
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF7F5" />
            </TouchableOpacity>
            <Text style={styles.stepText}>Step 2 of 3</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>Sent to {phoneNumber}</Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  keyboardType="numeric"
                  maxLength={1}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, otp.join('').length !== 6 && styles.disabledButton]}
              onPress={handleVerifyOTP}
              disabled={otp.join('').length !== 6 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF7F5" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Email Card */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: emailCardAnim }] }
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                Animated.spring(emailCardAnim, {
                  toValue: height,
                  useNativeDriver: true,
                }).start(() => setCurrentStep('otp'));
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF7F5" />
            </TouchableOpacity>
            <Text style={styles.stepText}>Step 3 of 3</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Add your email</Text>
            <Text style={styles.subtitle}>We'll use this for important notifications</Text>

            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="rgba(255, 247, 245, 0.5)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, !isValidEmail() && styles.disabledButton]}
              onPress={handleEmailSubmit}
              disabled={!isValidEmail() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF7F5" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Country Selection Modal */}
        <Modal
          visible={showCountryModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCountryModal(false)}
              >
                <Ionicons name="close" size={24} color="#FFF7F5" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.countriesList}>
              {countries.map((country, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(country);
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                  <Text style={styles.countryCodeModal}>{country.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>

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
  backgroundShapes: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  floatingShape: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 247, 245, 0.02)',
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  baseScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  card: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.1)',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 16,
    color: '#FFF7F5',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF7F5',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 247, 245, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: 'rgba(255, 247, 245, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    color: '#FFF7F5',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.15)',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: 'rgba(255, 247, 245, 0.08)',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    color: '#FFF7F5',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.15)',
  },
  button: {
    backgroundColor: '#3396D3',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 30,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF7F5',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 247, 245, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.15)',
  },
  flagText: {
    fontSize: 24,
    marginRight: 12,
  },
  countryCode: {
    flex: 1,
    fontSize: 18,
    color: '#FFF7F5',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 247, 245, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF7F5',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countriesList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 247, 245, 0.05)',
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: '#FFF7F5',
    fontWeight: '500',
  },
  countryCodeModal: {
    fontSize: 16,
    color: 'rgba(255, 247, 245, 0.7)',
    fontWeight: '500',
  },
});

export default PhoneVerificationFlow;