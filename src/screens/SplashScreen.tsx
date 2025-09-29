import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

const { width, height } = Dimensions.get('window');

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Fade in and scale animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for the logo
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

    // Navigate after 2.5 seconds
    const timer = setTimeout(() => {
      navigation.replace('LanguageSelection');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* AI-themed floating elements */}
      <View style={styles.backgroundShapes}>
        {Array.from({ length: 12 }).map((_, i) => {
          const shapeType = i % 4;
          const randomDelay = Math.random() * 2000;
          return (
            <Animated.View
              key={i}
              style={[
                styles.floatingShape,
                {
                  top: Math.random() * height,
                  left: Math.random() * width,
                  opacity: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.1],
                  }),
                  transform: [{
                    rotate: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: ['0deg', '5deg'],
                    })
                  }]
                },
              ]}
            >
              {shapeType === 0 && <MaterialIcons name="mic" size={24} color="rgba(51, 150, 211, 0.3)" />}
              {shapeType === 1 && <MaterialIcons name="psychology" size={24} color="rgba(75, 0, 130, 0.3)" />}
              {shapeType === 2 && <MaterialIcons name="hub" size={24} color="rgba(25, 25, 112, 0.3)" />}
              {shapeType === 3 && <MaterialIcons name="memory" size={24} color="rgba(138, 43, 226, 0.3)" />}
            </Animated.View>
          );
        })}
      </View>

      {/* Main logo with enhanced design */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
          },
        ]}
      >
        <LinearGradient
          colors={['#3396D3', '#5DADE2', '#85C1E9']}
          style={styles.logoCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoText}>Yo!</Text>
          <View style={styles.aiIndicator}>
            <MaterialIcons name="auto-awesome" size={20} color="rgba(255, 255, 255, 0.8)" />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Enhanced tagline with AI focus */}
      <Animated.View
        style={[
          styles.taglineContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            })}],
          },
        ]}
      >
        <Text style={styles.tagline}>Your AI Personal Assistant</Text>
        <View style={styles.aiFeatures}>
          <View style={styles.featureItem}>
            <MaterialIcons name="chat" size={16} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.featureText}>Smart Conversations</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="schedule" size={16} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.featureText}>Intelligent Scheduling</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="notifications_active" size={16} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.featureText}>Proactive Assistance</Text>
          </View>
        </View>
      </Animated.View>

      {/* Loading indicator */}
      <Animated.View
        style={[
          styles.loadingContainer,
          { opacity: fadeAnim },
        ]}
      >
        <View style={styles.loadingDots}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.loadingDot,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.3, 1],
                  }),
                  transform: [{
                    scale: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [1, 1.2],
                    })
                  }]
                }
              ]}
            />
          ))}
        </View>
        <Text style={styles.loadingText}>Initializing AI...</Text>
      </Animated.View>

      {/* Footer with version */}
      <Animated.View
        style={[
          styles.footer,
          { opacity: fadeAnim },
        ]}
      >
        <Text style={styles.footerText}>Powered by Advanced AI • v1.0</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientFlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  floatingShape: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  logoContainer: {
    marginBottom: 80,
    zIndex: 10,
  },
  logoCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3396D3',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  logoText: {
    fontSize: 64,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  aiIndicator: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 5,
  },
  taglineContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 40,
    zIndex: 10,
  },
  tagline: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 1,
  },
  aiFeatures: {
    alignItems: 'center',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 120,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3396D3',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    zIndex: 10,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;