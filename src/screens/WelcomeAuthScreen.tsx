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
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
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
  const [loadingStates, setLoadingStates] = useState([false, false, false, false, false, false]);
  const [completedStates, setCompletedStates] = useState([false, false, false, false, false, false]);

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

    // Start sequential loading animation
    startSequentialLoading();
  }, []);

  const startSequentialLoading = () => {
    const loadFeature = (index: number) => {
      if (index >= 6) return;

      // Start loading
      setLoadingStates(prev => {
        const newStates = [...prev];
        newStates[index] = true;
        return newStates;
      });

      // Complete after 2 seconds
      setTimeout(() => {
        setLoadingStates(prev => {
          const newStates = [...prev];
          newStates[index] = false;
          return newStates;
        });
        setCompletedStates(prev => {
          const newStates = [...prev];
          newStates[index] = true;
          return newStates;
        });

        // Start next feature
        setTimeout(() => loadFeature(index + 1), 300);
      }, 2000);
    };

    // Start with first feature after initial fade in
    setTimeout(() => loadFeature(0), 1000);
  };


  const handleSignUp = () => {
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

      {/* AI-themed background shapes */}
      <View style={styles.backgroundShapes}>
        {Array.from({ length: 20 }).map((_, i) => {
          const shapeType = i % 4;
          const isEven = i % 2 === 0;
          return (
            <View
              key={i}
              style={[
                styles.aiShape,
                shapeType === 0 && styles.microphoneIcon,
                shapeType === 1 && styles.brainIcon,
                shapeType === 2 && styles.connectionIcon,
                shapeType === 3 && styles.chipIcon,
                {
                  top: Math.random() * (height * 0.8),
                  left: Math.random() * (width - 40),
                  opacity: isEven ? 0.08 : 0.04,
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
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.welcome.meetTitle}</Text>
            <Text style={styles.subtitle}>
              {t.welcome.subtitle}
            </Text>
            <Text style={styles.description}>
              {t.welcome.description}
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {[
              { title: t.welcome.features.smartTaskManagement, description: t.welcome.features.smartTaskManagementDesc },
              { title: t.welcome.features.naturalConversations, description: t.welcome.features.naturalConversationsDesc },
              { title: t.welcome.features.intelligentScheduling, description: t.welcome.features.intelligentSchedulingDesc },
              { title: t.welcome.features.seamlessIntegration, description: t.welcome.features.seamlessIntegrationDesc },
              { title: t.welcome.features.proactiveReminders, description: t.welcome.features.proactiveRemindersDesc },
              { title: t.welcome.features.deadlineTracking, description: t.welcome.features.deadlineTrackingDesc }
            ].map((feature, index) => (
              <View key={index} style={styles.feature}>
                <View style={styles.checkmarkIcon}>
                  {loadingStates[index] ? (
                    <ActivityIndicator size="small" color="#3396D3" />
                  ) : completedStates[index] ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : (
                    <View style={styles.emptyIcon} />
                  )}
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={[
                    styles.featureTitle,
                    { opacity: loadingStates[index] || completedStates[index] ? 1 : 0.3 }
                  ]}>
                    {feature.title}
                  </Text>
                  <Text style={[
                    styles.featureDescription,
                    { opacity: loadingStates[index] || completedStates[index] ? 0.8 : 0.2 }
                  ]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
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
              <Text style={styles.backButtonText}>←</Text>
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
              <MaterialIcons name="login" size={18} color="#FFFFFF" />
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
    height: height * 0.4,
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
  aiShape: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  microphoneIcon: {
    backgroundColor: 'rgba(51, 150, 211, 0.05)',
  },
  brainIcon: {
    backgroundColor: 'rgba(75, 0, 130, 0.05)',
  },
  connectionIcon: {
    backgroundColor: 'rgba(25, 25, 112, 0.05)',
  },
  chipIcon: {
    backgroundColor: 'rgba(138, 43, 226, 0.05)',
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 25,
    position: 'relative',
    height: 120,
  },
  assistantContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 169, 110, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3396D3',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deviceRow: {
    flexDirection: 'row',
    gap: 16,
  },
  deviceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingShape1: {
    position: 'absolute',
    top: 5,
    left: 15,
  },
  floatingShape2: {
    position: 'absolute',
    top: 30,
    right: 20,
  },
  floatingShape3: {
    position: 'absolute',
    bottom: 15,
    left: 30,
  },
  floatingCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingDiamond: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(201, 169, 110, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  featuresContainer: {
    marginTop: 30,
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  checkmarkIcon: {
    width: 28,
    height: 28,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#3396D3',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyIcon: {
    width: 16,
    height: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  slidingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
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
  step: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  authOptions: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 20,
  },
  primaryAuthSection: {
    flexDirection: 'row',
    gap: 12,
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
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  googleButton: {
    flex: 1,
    height: 42,
    backgroundColor: '#3396D3',
    borderRadius: 21,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    letterSpacing: 0.2,
  },
  facebookButton: {
    flex: 1,
    height: 42,
    backgroundColor: '#1877F2',
    borderRadius: 21,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(24, 119, 242, 0.2)',
    shadowColor: '#1877F2',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  facebookButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 0.2,
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
    backgroundColor: '#3396D3',
    borderWidth: 1,
    borderColor: '#3396D3',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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