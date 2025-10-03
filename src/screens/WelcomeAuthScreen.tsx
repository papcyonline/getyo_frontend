import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { getTranslations } from '../utils/translations';

const { height, width } = Dimensions.get('window');

type WelcomeAuthNavigationProp = StackNavigationProp<RootStackParamList, 'WelcomeAuth'>;

const WelcomeAuthScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeAuthNavigationProp>();
  const insets = useSafeAreaInsets();

  // Get current language from Redux store
  const currentLanguage = useSelector((state: RootState) => state.user?.user?.preferences?.language || 'en');
  const t = getTranslations(currentLanguage);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Fade in animation for content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Gentle pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);


  const handleSignUp = () => {
    // Navigate to Terms & Privacy (mandatory before sign up)
    navigation.navigate('TermsPrivacy');
  };

  const handleSignIn = () => {
    navigation.navigate('SignIn');
  };

  const handleBack = () => {
    navigation.goBack();
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
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <Animated.View style={[
              styles.logoContainer,
              { transform: [{ scale: pulseAnim }, { translateY: floatAnim }] }
            ]}>
              <LinearGradient
                colors={['#3396D3', '#2578B5', '#1A5A97']}
                style={styles.logoCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons name="assistant" size={60} color="#FFFFFF" />
              </LinearGradient>

              {/* Glow effect */}
              <View style={styles.glowCircle} />
            </Animated.View>

            <Text style={styles.appName}>Yo!</Text>
            <Text style={styles.tagline}>Your Personal AI Assistant</Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <MaterialIcons name="chat" size={28} color="#3396D3" />
              </View>
              <Text style={styles.featureCardTitle}>Smart Conversations</Text>
              <Text style={styles.featureCardDesc}>Natural voice & text interactions</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <MaterialIcons name="schedule" size={28} color="#3396D3" />
              </View>
              <Text style={styles.featureCardTitle}>Task Management</Text>
              <Text style={styles.featureCardDesc}>Organize your day effortlessly</Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <MaterialIcons name="notifications-active" size={28} color="#3396D3" />
              </View>
              <Text style={styles.featureCardTitle}>Smart Reminders</Text>
              <Text style={styles.featureCardDesc}>Never miss what matters</Text>
            </View>
          </View>

          {/* Stats/Trust indicators */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="security" size={20} color="#3396D3" />
              <Text style={styles.statText}>Secure</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="cloud-done" size={20} color="#3396D3" />
              <Text style={styles.statText}>Cloud Sync</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="offline-bolt" size={20} color="#3396D3" />
              <Text style={styles.statText}>Always On</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.slidingContainer,
            {
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <LinearGradient
            colors={['rgba(40, 40, 40, 0.2)', 'rgba(30, 30, 30, 0.6)', 'rgba(20, 20, 20, 0.95)']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.authOptions}>
            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              activeOpacity={0.9}
            >
              <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
              <Text style={styles.signUpButtonText}>{t.welcome.signUp}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t.welcome.orContinueWith}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              activeOpacity={0.9}
            >
              <MaterialIcons name="login" size={18} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.signInButtonText}>{t.welcome.signIn}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t.welcome.footerText}
            </Text>
          </View>
          </LinearGradient>
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
    height: height * 0.5,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    zIndex: 2,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3396D3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  glowCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(51, 150, 211, 0.2)',
    top: -10,
    left: -10,
    zIndex: -1,
  },
  appName: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  featuresGrid: {
    gap: 12,
    marginBottom: 30,
  },
  featureCard: {
    backgroundColor: 'rgba(51, 150, 211, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(51, 150, 211, 0.2)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(51, 150, 211, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginBottom: 4,
    flex: 1,
  },
  featureCardDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
    letterSpacing: 0.2,
    position: 'absolute',
    left: 82,
    bottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  slidingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.32,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  gradientBackground: {
    flex: 1,
    paddingTop: 10,
    zIndex: 10,
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
  authOptions: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 10,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  signUpButton: {
    height: 56,
    backgroundColor: '#3396D3',
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#3396D3',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  signInButton: {
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '400',
  },
});

export default WelcomeAuthScreen;