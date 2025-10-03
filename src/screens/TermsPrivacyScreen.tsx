import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { getTranslations } from '../utils/translations';
import legalService, { LegalContent } from '../services/legalService';

const { width, height } = Dimensions.get('window');

type TermsPrivacyNavigationProp = StackNavigationProp<RootStackParamList, 'TermsPrivacy'>;

const TermsPrivacyScreen: React.FC = () => {
  const navigation = useNavigation<TermsPrivacyNavigationProp>();
  const insets = useSafeAreaInsets();
  const [hasReadComplete, setHasReadComplete] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [legalContent, setLegalContent] = useState<LegalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideToAcceptAnim = useRef(new Animated.Value(0)).current;

  // Get current language from Redux store
  const currentLanguage = useSelector((state: RootState) => state.user?.user?.preferences?.language || 'en');
  const t = getTranslations(currentLanguage);

  useEffect(() => {
    loadLegalContent();
  }, [currentLanguage]);

  useEffect(() => {
    if (legalContent) {
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Fade animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [legalContent]);

  const loadLegalContent = async () => {
    try {
      setLoading(true);
      const content = await legalService.getCombined(currentLanguage);
      if (content) {
        setLegalContent(content);
      } else {
        // Fallback to static content if API is not available
        Alert.alert(
          'Notice',
          'Unable to load the latest terms and privacy policy. Please try again later.',
          [
            { text: 'Retry', onPress: loadLegalContent },
            { text: 'Continue', onPress: () => setLegalContent({ content: { sections: [] } } as LegalContent) }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to load legal content:', error);
      Alert.alert(
        'Error',
        'Failed to load terms and privacy policy. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: loadLegalContent },
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Remove the button opacity useEffect since we're using slide-to-accept

  const handleBack = () => {
    navigation.goBack();
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50;
    const progress = Math.min(
      (contentOffset.y + layoutMeasurement.height) / contentSize.height,
      1
    );

    setScrollProgress(progress);

    // Check if user has scrolled to at least 95% of the content
    const isCloseToBottom = progress >= 0.95;

    if (isCloseToBottom && !hasReadComplete) {
      setHasReadComplete(true);
    }
  };

  const handleSlideToAccept = async (event: any) => {
    if (!hasReadComplete || accepting) return;

    const { translationX } = event.nativeEvent;
    const slideDistance = width - 76; // Full width minus padding and button size
    const threshold = slideDistance * 0.9; // 90% of slide distance

    if (translationX >= threshold) {
      try {
        setAccepting(true);

        // Record legal acceptance with API
        await legalService.acceptLegal('combined');

        // Terms and privacy accepted, navigate to user details (proper onboarding flow)
        setIsAccepted(true);
        setTimeout(() => {
          navigation.navigate('UserDetails');
        }, 300);
      } catch (error) {
        console.error('Failed to record legal acceptance:', error);
        Alert.alert(
          'Error',
          'Failed to record your acceptance. Please try again.',
          [
            { text: 'OK', onPress: () => {
              // Reset slide animation
              Animated.spring(slideToAcceptAnim, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
            }}
          ]
        );
      } finally {
        setAccepting(false);
      }
    } else {
      // Reset if not completed
      Animated.spring(slideToAcceptAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: slideToAcceptAnim } }],
    { useNativeDriver: true }
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Background gradient flare */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>{t.termsPrivacy.title}</Text>
            <Text style={styles.subtitle}>
              {t.termsPrivacy.subtitle || 'Please read and accept our terms and privacy policy'}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <LinearGradient
            colors={['rgba(40, 40, 40, 0.1)', 'rgba(30, 30, 30, 0.3)', 'rgba(20, 20, 20, 0.7)']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="chevron-back-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ width: 44 }} />
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: `${scrollProgress * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {hasReadComplete ? t.termsPrivacy.readyToContinue : `${Math.round(scrollProgress * 100)}${t.termsPrivacy.progressText}`}
              </Text>
            </View>

            {/* Combined Terms & Privacy Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 100 }]}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={100}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3396D3" />
                  <Text style={styles.loadingText}>Loading terms and privacy policy...</Text>
                </View>
              ) : (
                <View style={styles.contentInner}>
                  {legalContent && (
                    <View style={styles.section}>
                      <Text style={styles.mainTitle}>
                        {legalContent.content.mainTitle || legalContent.title}
                      </Text>
                      {legalContent.content.subtitle && (
                        <Text style={styles.subtitleInner}>
                          {legalContent.content.subtitle}
                        </Text>
                      )}

                    <Text style={styles.versionText}>
                      Version {legalContent.version} - {new Date(legalContent.effectiveDate).toLocaleDateString()}
                    </Text>

                    {legalContent.content.sections.map((section, index) => (
                      <View key={index} style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionText}>{section.content}</Text>

                        {section.subsections && section.subsections.map((subsection, subIndex) => (
                          <View key={subIndex} style={styles.subsectionContainer}>
                            <Text style={styles.subSectionTitle}>{subsection.title}</Text>
                            <Text style={styles.sectionText}>{subsection.content}</Text>
                          </View>
                        ))}
                      </View>
                    ))}

                    {/* Slide to Accept - Inside Content Area */}
                    {!loading && hasReadComplete && !isAccepted && (
                      <View style={styles.slideToAcceptContainer}>
                        <View style={styles.slideTrack}>
                          <PanGestureHandler
                            onGestureEvent={onGestureEvent}
                            onHandlerStateChange={handleSlideToAccept}
                            enabled={!accepting}
                          >
                            <Animated.View
                              style={[
                                styles.slideButton,
                                {
                                  transform: [
                                    {
                                      translateX: slideToAcceptAnim.interpolate({
                                        inputRange: [0, width - 76],
                                        outputRange: [0, width - 76],
                                        extrapolate: 'clamp',
                                      }),
                                    },
                                  ],
                                  opacity: accepting ? 0.7 : 1,
                                },
                              ]}
                            >
                              {accepting ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <MaterialIcons name="keyboard-arrow-right" size={24} color="#FFFFFF" />
                              )}
                            </Animated.View>
                          </PanGestureHandler>
                          <Text style={styles.slideTrackText}>
                            {accepting ? 'Recording acceptance...' : t.termsPrivacy.slideToAccept}
                          </Text>
                        </View>
                      </View>
                    )}

                    {isAccepted && (
                      <View style={styles.acceptedContainer}>
                        <MaterialIcons name="check-circle" size={48} color="#10B981" />
                        <Text style={styles.acceptedText}>{t.termsPrivacy.readyToContinueAfterAccept}</Text>
                      </View>
                    )}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
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
  headerTop: {
    alignItems: 'center',
    marginTop: 60,
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
  },
  slidingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.75,
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
    paddingTop: 8,
    paddingBottom: 8,
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
  progressContainer: {
    paddingHorizontal: 30,
    paddingTop: 5,
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#3396D3',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 25,
  },
  contentInner: {
    flex: 1,
  },
  subtitleInner: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 20,
    letterSpacing: 0.3,
  },
  sectionText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    fontWeight: '400',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 4,
  },
  highlightText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3396D3',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 10,
  },
  slideToAcceptContainer: {
    paddingHorizontal: 0,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  slideTrack: {
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  slideTrackText: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    zIndex: 1,
  },
  slideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3396D3',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 2,
  },
  acceptedContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  acceptedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    fontWeight: '500',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '400',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  subsectionContainer: {
    marginTop: 15,
    marginLeft: 15,
  },
});

export default TermsPrivacyScreen;