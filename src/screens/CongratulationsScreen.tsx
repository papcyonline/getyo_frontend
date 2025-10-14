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
import { useSelector } from 'react-redux';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { RootState } from '../store';

const { width, height } = Dimensions.get('window');

type CongratulationsNavigationProp = StackNavigationProp<RootStackParamList, 'Congratulations'>;
type CongratulationsRouteProp = RouteProp<RootStackParamList, 'Congratulations'>;

const CongratulationsScreen: React.FC = () => {
  const navigation = useNavigation<CongratulationsNavigationProp>();
  const route = useRoute<CongratulationsRouteProp>();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const { phone, email, userDetails, user, token, passwordGenerated } = route.params || {};

  const slideAnim = useRef(new Animated.Value(height)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Sparkle animations
  const sparkleAnims = useRef([
    new Animated.Value(0),
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

    // Sequence of animations for dramatic effect
    Animated.sequence([
      // 1. Fade in background
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // 2. Circle appears with elastic bounce
      Animated.spring(circleScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      // 3. Checkmark pops in with delay
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After main animation, start sparkles and pulse
      animateSparkles();
      startPulse();
    });

    // Auto-advance to AssistantNaming after 5 seconds
    const autoAdvanceTimer = setTimeout(() => {
      handleContinue();
    }, 5000);

    return () => clearTimeout(autoAdvanceTimer);
  }, []);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateSparkles = () => {
    // Animate sparkles with staggered timing
    sparkleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 800,
            delay: index * 150,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const handleContinue = () => {
    // Navigate to AssistantNaming (name your PA + photo)
    navigation.navigate('AssistantNaming', {
      phone,
      email,
      userDetails,
      user,
      token,
      passwordGenerated
    });
  };

  const sparklePositions = [
    { top: -20, left: -30, rotation: '0deg' },
    { top: -30, right: -20, rotation: '45deg' },
    { top: 60, right: -40, rotation: '90deg' },
    { bottom: 60, right: -30, rotation: '135deg' },
    { bottom: -20, left: -20, rotation: '180deg' },
    { top: 60, left: -40, rotation: '225deg' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Animated Checkmark Container */}
          <View style={styles.checkmarkWrapper}>
            {/* Pulsing Glow Effect */}
            <Animated.View
              style={[
                styles.glowCircle,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.3, 0.6],
                  }),
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />

            {/* Main Circle Background */}
            <Animated.View
              style={[
                styles.checkmarkCircle,
                { backgroundColor: theme.success || '#4CAF50' },
                {
                  transform: [{ scale: circleScale }],
                },
              ]}
            />

            {/* Checkmark Icon */}
            <Animated.View
              style={[
                styles.checkmarkIcon,
                {
                  transform: [{ scale: checkScale }],
                },
              ]}
            >
              <MaterialCommunityIcons name="check" size={120} color={theme.background} />
            </Animated.View>

            {/* Sparkles */}
            {sparkleAnims.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.sparkle,
                  sparklePositions[index],
                  {
                    opacity: anim,
                    transform: [
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1.2],
                        }),
                      },
                      { rotate: sparklePositions[index].rotation },
                    ],
                  },
                ]}
              >
                <MaterialCommunityIcons name="star-four-points" size={24} color="#FFD700" />
              </Animated.View>
            ))}
          </View>

          {/* Congratulations Text */}
          <Animated.View
            style={[
              styles.textContainer,
              { opacity: fadeAnim },
            ]}
          >
            <Text style={[styles.congratsText, { color: theme.text }]}>Congratulations!</Text>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>Your account has been created</Text>
          </Animated.View>

          {/* Continue Button */}
          <Animated.View
            style={[
              styles.buttonContainer,
              { opacity: fadeAnim },
            ]}
          >
            <TouchableOpacity
              style={[styles.continueButton, { backgroundColor: theme.accent }]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={[styles.continueButtonText, { color: theme.background }]}>Setup Personal Assistant</Text>
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
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  checkmarkWrapper: {
    position: 'relative',
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  glowCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#4CAF50',
  },
  checkmarkCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  checkmarkIcon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  congratsText: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  subText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  continueButton: {
    height: 60,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default CongratulationsScreen;