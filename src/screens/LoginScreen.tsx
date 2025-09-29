import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { completeOnboarding } from '../store/slices/userSlice';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../services/auth';
import ScreenContainer from '../components/common/ScreenContainer';
import CustomAlert from '../components/common/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isDark = useSelector((state: RootState) => state.theme.isDark);
  const { loading, error } = useSelector((state: RootState) => state.user);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (isLogin) {
        console.log('🔐 [DEBUG] Starting login process...');
        console.log('🔐 [DEBUG] Login credentials:', { email, hasPassword: !!password });

        const user = await AuthService.login(email, password);
        console.log('🔐 [DEBUG] Login response received:', {
          success: !!user,
          userExists: !!user,
          hasAssistantName: !!(user && user.assistantName),
          assistantName: user?.assistantName,
          userId: user?.id
        });

        // Check if user has completed assistant setup
        // If assistantName exists, they've completed setup
        if (user && user.assistantName) {
          console.log('✅ [DEBUG] User has assistantName, dispatching completeOnboarding()');
          // Mark onboarding as complete
          dispatch(completeOnboarding());
          console.log('✅ [DEBUG] completeOnboarding() dispatched successfully');
        } else {
          console.log('🔄 [DEBUG] User has NO assistantName, navigating to AssistantNaming');
          // Navigate to assistant setup
          navigation.navigate('AssistantNaming' as any);
          console.log('🔄 [DEBUG] Navigation to AssistantNaming triggered');
        }

        Alert.alert('Success', 'Login successful!');
        console.log('✅ [DEBUG] Success alert shown');
      } else {
        await AuthService.register({
          name,
          email,
          password,
          phone: phone || undefined,
        });
        Alert.alert('Success', 'Registration successful!');
      }
    } catch (error: any) {
      console.error('❌ [DEBUG] Auth error occurred:', {
        error: error,
        message: error.message,
        stack: error.stack,
        isLogin
      });
      Alert.alert(
        'Error',
        error.message || `${isLogin ? 'Login' : 'Registration'} failed`
      );
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  };

  return (
    <ScreenContainer backgroundColor={theme.background} statusBarStyle={isDark ? 'light-content' : 'dark-content'}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isLogin
              ? 'Sign in to your Yo! assistant'
              : 'Join the Yo! assistant community'
            }
          </Text>

          <View style={styles.form}>
            {!isLogin && (
              <>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text
                    }
                  ]}
                  placeholder="Full Name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text
                    }
                  ]}
                  placeholder="Phone (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text
                }
              ]}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text
                }
              ]}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error && (
              <Text style={[styles.error, { color: theme.error }]}>
                {error}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: theme.accent }]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleMode}
              disabled={loading}
            >
              <Text style={[styles.toggleText, { color: theme.accent }]}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Sign In'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  authButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    paddingVertical: 12,
  },
  toggleText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoginScreen;