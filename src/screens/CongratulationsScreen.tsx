import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');

type CongratulationsNavigationProp = StackNavigationProp<RootStackParamList, 'Congratulations'>;
type CongratulationsRouteProp = RouteProp<RootStackParamList, 'Congratulations'>;

const CongratulationsScreen: React.FC = () => {
  const navigation = useNavigation<CongratulationsNavigationProp>();
  const route = useRoute<CongratulationsRouteProp>();
  const insets = useSafeAreaInsets();
  const { phone, email, userDetails, user, token, passwordGenerated } = route.params || {};

  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animation values for each feature item
  const featureAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Scale and fade animations for checkmark
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After checkmark animation, start feature animations
      animateFeatures();
    });
  }, []);

  const animateFeatures = () => {
    // Animate each feature with a delay
    featureAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 200, // 200ms delay between each item
        useNativeDriver: true,
      }).start();
    });
  };

  const handleContinue = () => {
    // If coming from onboarding flow, continue to assistant naming
    if (phone || email) {
      navigation.navigate('AssistantNaming', {
        phone,
        email,
        userDetails,
        user,
        token,
        passwordGenerated
      });
    } else {
      // If coming from personalization, go to home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
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
          <Text style={styles.title}>Congratulations!</Text>
          <Text style={styles.subtitle}>
            Your account has been successfully verified
          </Text>
        </View>

        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Checkmark at top of sliding container */}
          <Animated.View
            style={[
              styles.checkmarkContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.dottedBorder}>
              <View style={styles.checkmarkCircle}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>
          </Animated.View>

          <View style={styles.content}>

            <Animated.View
              style={[
                styles.messageContainer,
                { opacity: fadeAnim },
              ]}
            >
              <Text style={styles.mainMessage}>Let's finish setting up your PA</Text>
              <Text style={styles.subMessage}>
                Here's what your personal assistant will do for you:
              </Text>
            </Animated.View>

            <View style={styles.featuresContainer}>
              <View style={styles.featuresList}>
                {[
                  'Answer questions and provide information',
                  'Help with daily tasks and reminders',
                  'Learn your preferences over time',
                  'Provide personalized recommendations',
                  'Available 24/7 whenever you need help'
                ].map((feature, index) => (
                  <Animated.View key={index}>
                    <Animated.View
                      style={[
                        styles.featureItem,
                        {
                          opacity: featureAnims[index],
                          transform: [
                            {
                              translateX: featureAnims[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [-50, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Animated.Text
                        style={[
                          styles.checkIcon,
                          {
                            opacity: featureAnims[index],
                            transform: [
                              {
                                scale: featureAnims[index].interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 1],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        ✓
                      </Animated.Text>
                      <Text style={styles.featureText}>{feature}</Text>
                    </Animated.View>
                    {index < 4 && <View style={styles.divider} />}
                  </Animated.View>
                ))}
              </View>
            </View>
          </View>

          <Animated.View
            style={[
              styles.footer,
              { opacity: fadeAnim },
            ]}
          >
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <Text style={styles.continueButtonText}>Continue Setup</Text>
            </TouchableOpacity>
          </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkmarkContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: -50,
    position: 'relative',
    zIndex: 15,
  },
  dottedBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3396D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 50,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  mainMessage: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  featuresContainer: {
    width: '100%',
    flex: 1,
    marginBottom: 30,
  },
  featuresList: {
    paddingHorizontal: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  checkIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 12,
    width: 22,
    height: 22,
    backgroundColor: '#3396D3',
    borderRadius: 11,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 22,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 0.2,
    lineHeight: 22,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(201, 169, 110, 0.2)',
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
  },
  continueButton: {
    height: 65,
    backgroundColor: '#3396D3',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default CongratulationsScreen;