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
  Image,
  ScrollView,
} from 'react-native';

import { AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { getTranslations } from '../utils/translations';
import { MockNotificationScreen, MockAISuggestionsScreen, MockTasksScreen } from '../components/MockScreens';

const { height, width } = Dimensions.get('window');

type WelcomeAuthNavigationProp = StackNavigationProp<RootStackParamList, 'WelcomeAuth'>;

const WelcomeAuthScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeAuthNavigationProp>();
  const insets = useSafeAreaInsets();

  // Get current language from Redux store
  const currentLanguage = useSelector((state: RootState) => state.user?.user?.preferences?.language || 'en');
  const t = getTranslations(currentLanguage);

  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const mockScreens = [
    {
      component: MockNotificationScreen,
      title: 'Smart Notifications',
      description: 'Get timely reminders for calls, meetings, traffic & more'
    },
    {
      component: MockAISuggestionsScreen,
      title: 'AI-Powered Suggestions',
      description: 'Find cheap flights, optimize schedule, remember important dates'
    },
    {
      component: MockTasksScreen,
      title: 'Stay Organized',
      description: 'Manage tasks, track progress, never miss a deadline'
    },
  ];

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

  const handleScroll = (event: any) => {
    const slideSize = width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentSlide(index);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar - Fixed on black background */}
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 15) + 10 }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#FFF7F5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Welcome</Text>
          <Animated.View style={[
            styles.topLogo,
            { transform: [{ scale: pulseAnim }] }
          ]}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Carousel */}
          <View style={styles.carouselContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              snapToInterval={width}
              decelerationRate="fast"
            >
              {mockScreens.map((screen, index) => {
                const ScreenComponent = screen.component;
                return (
                  <View key={index} style={styles.screenshotSlide}>
                    <View style={styles.mockScreenWrapper}>
                      <ScreenComponent />
                      <View style={styles.screenshotOverlay}>
                        <Text style={styles.screenshotTitle}>{screen.title}</Text>
                        <Text style={styles.screenshotDescription}>{screen.description}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              {mockScreens.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentSlide === index && styles.activeDot
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >

          <View style={styles.authOptions}>
            {/* Sign Up Button */}
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={handleSignUp}
              activeOpacity={0.9}
            >
              <MaterialIcons name="person-add" size={20} color="#FFF7F5" />
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
              <MaterialIcons name="login" size={18} color="rgba(255, 247, 245, 0.9)" />
              <Text style={styles.signInButtonText}>{t.welcome.signIn}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t.welcome.footerText}
            </Text>
          </View>
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
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 247, 245, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    color: '#FFF7F5',
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  topLogo: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 36,
    height: 36,
  },
  content: {
    flex: 1,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  screenshotSlide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mockScreenWrapper: {
    alignItems: 'center',
  },
  screenshotOverlay: {
    marginTop: 12,
    alignItems: 'center',
  },
  screenshotTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF7F5',
    letterSpacing: 0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  screenshotDescription: {
    fontSize: 13,
    color: 'rgba(255, 247, 245, 0.7)',
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 18,
  },
  featureSlide: {
    width: width - 48,
    marginRight: 0,
  },
  featureCard: {
    backgroundColor: 'rgba(51, 150, 211, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(51, 150, 211, 0.2)',
    padding: 24,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(51, 150, 211, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF7F5',
    letterSpacing: 0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 247, 245, 0.7)',
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 247, 245, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#3396D3',
  },
  slidingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.28,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.1)',
    zIndex: 10,
  },
  authOptions: {
    paddingHorizontal: 30,
    paddingTop: 20,
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
    backgroundColor: 'rgba(255, 247, 245, 0.2)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(255, 247, 245, 0.5)',
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
  },
  signUpButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF7F5',
    letterSpacing: 0.4,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    opacity: 0.5,
  },
  signInButton: {
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 247, 245, 0.3)',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 247, 245, 0.9)',
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 247, 245, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '400',
  },
});

export default WelcomeAuthScreen;