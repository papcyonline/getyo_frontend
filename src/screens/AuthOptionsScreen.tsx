import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { getTranslations } from '../utils/translations';
import OAuthService from '../services/oauth';

const { height } = Dimensions.get('window');

type AuthOptionsNavigationProp = StackNavigationProp<RootStackParamList, 'TermsPrivacy'>;

const AuthOptionsScreen: React.FC = () => {
  const navigation = useNavigation<AuthOptionsNavigationProp>();
  const currentLanguage = useSelector((state: RootState) => state.user?.user?.preferences?.language || 'en');
  const theme = useSelector((state: RootState) => state.theme.theme);
  const t = getTranslations(currentLanguage);

  const [loading, setLoading] = useState<{ google: boolean; apple: boolean }>({
    google: false,
    apple: false,
  });
  const [appleAvailable, setAppleAvailable] = useState(false);

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

    // Check Apple Sign-In availability
    OAuthService.isAppleSignInAvailable().then(setAppleAvailable);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading({ ...loading, google: true });

      // Check if Google Sign-In is configured
      if (!OAuthService.isGoogleSignInConfigured()) {
        Alert.alert(
          'Configuration Required',
          'Google Sign-In is not yet configured. Please contact support or use email sign-up.'
        );
        return;
      }

      const { user } = await OAuthService.signInWithGoogle();

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      if (error.message?.includes('configure')) {
        // Configuration error - show friendly message
        Alert.alert(
          'Coming Soon',
          'Google Sign-In will be available soon! For now, please use email sign-up.'
        );
      } else {
        Alert.alert('Sign-In Error', error.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading({ ...loading, google: false });
    }
  };

  const handleEmailSignUp = () => {
    // Navigate to simplified email sign up screen
    navigation.navigate('SignUp');
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading({ ...loading, apple: true });

      if (!appleAvailable) {
        Alert.alert(
          'Not Available',
          'Apple Sign-In is only available on iOS 13 and later.'
        );
        return;
      }

      const { user } = await OAuthService.signInWithApple();

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error: any) {
      console.error('Apple sign-in error:', error);

      if (error.message?.includes('cancelled')) {
        // User cancelled - no need to show error
        return;
      }

      Alert.alert('Sign-In Error', error.message || 'Failed to sign in with Apple');
    } finally {
      setLoading({ ...loading, apple: false });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

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
            <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Choose how you'd like to sign up</Text>
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
            <View style={styles.optionsContainer}>
              {/* Google Sign In */}
              <TouchableOpacity
                style={[styles.optionButton, styles.googleButton, { backgroundColor: `${theme.text}10`, borderColor: theme.border }]}
                onPress={handleGoogleSignIn}
                activeOpacity={0.9}
                disabled={loading.google || loading.apple}
              >
                {loading.google ? (
                  <ActivityIndicator color={theme.text} />
                ) : (
                  <>
                    <View style={[styles.iconCircle, { backgroundColor: `${theme.text}08` }]}>
                      <MaterialCommunityIcons name="google" size={24} color="#4285F4" />
                    </View>
                    <Text style={[styles.optionButtonText, { color: theme.text }]}>Continue with Google</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                  </>
                )}
              </TouchableOpacity>

              {/* Email Sign Up */}
              <TouchableOpacity
                style={[styles.optionButton, styles.emailButton, { backgroundColor: `${theme.text}10`, borderColor: theme.border }]}
                onPress={handleEmailSignUp}
                activeOpacity={0.9}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${theme.text}08` }]}>
                  <MaterialCommunityIcons name="email-outline" size={24} color="#F44336" />
                </View>
                <Text style={[styles.optionButtonText, { color: theme.text }]}>Sign Up with Email</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              {/* Apple Sign In */}
              {(Platform.OS === 'ios' && appleAvailable) && (
                <TouchableOpacity
                  style={[styles.optionButton, styles.appleButton, { backgroundColor: `${theme.text}10`, borderColor: theme.border }]}
                  onPress={handleAppleSignIn}
                  activeOpacity={0.9}
                  disabled={loading.google || loading.apple}
                >
                  {loading.apple ? (
                    <ActivityIndicator color={theme.text} />
                  ) : (
                    <>
                      <View style={[styles.iconCircle, { backgroundColor: `${theme.text}08` }]}>
                        <MaterialCommunityIcons name="apple" size={24} color={theme.background === '#FFFFFF' ? '#000000' : '#FFFFFF'} />
                      </View>
                      <Text style={[styles.optionButtonText, { color: theme.text }]}>Continue with Apple</Text>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.textSecondary }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

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
          </View>
        </Animated.View>
      </SafeAreaView>
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
    paddingTop: 20,
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
    paddingTop: 40,
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
    height: height * 0.62,
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
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 30,
  },
  optionButton: {
    height: 64,
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
  },
  googleButton: {
    // Colors applied inline with theme
  },
  emailButton: {
    // Colors applied inline with theme
  },
  appleButton: {
    // Colors applied inline with theme
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  signInContainer: {
    alignItems: 'center',
    paddingVertical: 10,
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
    paddingBottom: 20,
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
});

export default AuthOptionsScreen;
