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

type EmailInputNavigationProp = StackNavigationProp<RootStackParamList, 'EmailInput'>;
type EmailInputRouteProp = RouteProp<RootStackParamList, 'EmailInput'>;

const EmailInputScreen: React.FC = () => {
  const navigation = useNavigation<EmailInputNavigationProp>();
  const route = useRoute<EmailInputRouteProp>();
  const insets = useSafeAreaInsets();
  const { phone, userDetails } = route.params;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const emailInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Focus input after animation
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 300);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidEmail = () => {
    return validateEmail(email.trim());
  };

  const handleSendOTP = async () => {
    if (!isValidEmail()) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // SIMPLIFIED: Skip OTP, go directly to password creation
    navigation.navigate('PasswordCreation', {
      phone: null,
      email: email.trim(),
      userDetails
    });
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('WelcomeAuth');
    }
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
        <View style={styles.header}>
          <Text style={styles.title}>Enter Your Email</Text>
          <Text style={styles.subtitle}>
            We'll send you a verification code to confirm your email address
          </Text>
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
              <Text style={styles.step}>Step 3 of 5</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.instructionText}>Enter your email address</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  ref={emailInputRef}
                  style={styles.emailInput}
                  placeholder="your.email@example.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSendOTP}
                  selectionColor="#FFFFFF"
                />
              </View>

            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  !isValidEmail() && styles.disabledButton,
                ]}
                onPress={handleSendOTP}
                disabled={!isValidEmail() || loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Text style={[
                    styles.continueButtonText,
                    !isValidEmail() && styles.disabledButtonText,
                  ]}>
                    Send Verification Code
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
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 24,
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
    paddingTop: 30,
    paddingBottom: 20,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
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
  inputContainer: {
    marginBottom: 30,
  },
  emailInput: {
    height: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    fontWeight: '500',
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

export default EmailInputScreen;