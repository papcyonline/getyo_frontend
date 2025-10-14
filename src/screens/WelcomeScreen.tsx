import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { getTranslations } from '../utils/translations';

const { height, width } = Dimensions.get('window');

type WelcomeNavigationProp = StackNavigationProp<RootStackParamList, 'WelcomeAuth'>;

interface SlideData {
  title: string;
  description: string;
  icon: string;
  gradient: string[];
}

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeNavigationProp>();
  const currentLanguage = useSelector((state: RootState) => state.user?.user?.preferences?.language || 'en');
  const theme = useSelector((state: RootState) => state.theme.theme);
  const t = getTranslations(currentLanguage);

  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const slides: SlideData[] = [
    {
      title: t.welcome.title,
      description: t.welcome.subtitle,
      icon: 'assistant',
      gradient: ['#3396D3', '#2578B5'],
    },
    {
      title: t.welcome.features.naturalConversations,
      description: t.welcome.features.naturalConversationsDesc,
      icon: 'chat-bubble',
      gradient: ['#667EEA', '#764BA2'],
    },
    {
      title: t.welcome.features.smartTaskManagement,
      description: t.welcome.features.smartTaskManagementDesc,
      icon: 'event-note',
      gradient: ['#F093FB', '#F5576C'],
    },
    {
      title: t.welcome.features.intelligentScheduling,
      description: t.welcome.features.intelligentSchedulingDesc,
      icon: 'psychology',
      gradient: ['#4FACFE', '#00F2FE'],
    },
  ];

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleScroll = (event: any) => {
    const slideSize = width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentSlide(index);
  };

  const handleCreateAccount = () => {
    navigation.navigate('TermsPrivacy');
  };

  const handleSignIn = () => {
    navigation.navigate('SignIn');
  };

  const renderSlide = (slide: SlideData, index: number) => (
    <View key={index} style={[styles.slide, { width }]}>
      <View style={[styles.iconContainer, { borderColor: theme.accent, backgroundColor: `${theme.accent}15` }]}>
        <MaterialIcons name={slide.icon as any} size={80} color={theme.accent} />
      </View>
      <Text style={[styles.slideTitle, { color: theme.text }]}>{slide.title}</Text>
      <Text style={[styles.slideDescription, { color: theme.textSecondary }]}>{slide.description}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Slider */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.slider}
            contentContainerStyle={styles.sliderContent}
          >
            {slides.map((slide, index) => renderSlide(slide, index))}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { backgroundColor: theme.border },
                  currentSlide === index && [styles.paginationDotActive, { backgroundColor: theme.accent }],
                ]}
              />
            ))}
          </View>

          {/* Action Buttons - More spacing from bottom */}
          <View style={styles.actionContainer}>
            {/* Create Account Button */}
            <TouchableOpacity
              style={[styles.createAccountButton, { backgroundColor: theme.accent }]}
              onPress={handleCreateAccount}
              activeOpacity={0.9}
            >
              <MaterialIcons name="person-add" size={20} color={theme.background} />
              <Text style={[styles.createAccountText, { color: theme.background }]}>{t.welcome.getStarted}</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, { borderColor: theme.border }]}
              onPress={handleSignIn}
              activeOpacity={0.9}
            >
              <MaterialIcons name="login" size={18} color={theme.text} />
              <Text style={[styles.signInText, { color: theme.text }]}>{t.welcome.signIn}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer - More spacing from bottom */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
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
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 40,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  slider: {
    flex: 1,
  },
  sliderContent: {
    alignItems: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  slideDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
  },
  actionContainer: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  createAccountButton: {
    height: 56,
    borderRadius: 28,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  createAccountText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signInButton: {
    height: 56,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signInText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default WelcomeScreen;
