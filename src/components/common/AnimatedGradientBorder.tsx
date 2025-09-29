import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface AnimatedGradientBorderProps {
  children: React.ReactNode;
}

const AnimatedGradientBorder: React.FC<AnimatedGradientBorderProps> = ({ children }) => {
  // Animation values for each corner gradient
  const topLeftAnim = useRef(new Animated.Value(0)).current;
  const topRightAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create looping animations for gradient movement
    const createAnimation = () => {
      // Top left corner animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(topLeftAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: false,
          }),
          Animated.timing(topLeftAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Top right corner animation (offset timing)
      Animated.loop(
        Animated.sequence([
          Animated.timing(topRightAnim, {
            toValue: 1,
            duration: 3500,
            useNativeDriver: false,
          }),
          Animated.timing(topRightAnim, {
            toValue: 0,
            duration: 3500,
            useNativeDriver: false,
          }),
        ])
      ).start();

      // Rotation animation for gradient effect
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation for glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    createAnimation();
  }, []);

  // Interpolate animation values for colors
  const topLeftColors = topLeftAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      'rgba(0, 255, 0, 0.6)',    // Green
      'rgba(255, 0, 0, 0.6)',     // Red
      'rgba(255, 255, 0, 0.6)',   // Yellow
      'rgba(0, 100, 255, 0.6)',   // Blue
      'rgba(0, 255, 0, 0.6)',     // Back to Green
    ],
  });

  const topRightColors = topRightAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      'rgba(255, 0, 0, 0.6)',     // Red
      'rgba(255, 255, 0, 0.6)',   // Yellow
      'rgba(0, 100, 255, 0.6)',   // Blue
      'rgba(0, 255, 0, 0.6)',     // Green
      'rgba(255, 0, 0, 0.6)',     // Back to Red
    ],
  });

  const rotationInterpolate = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const opacityInterpolate = pulseAnim.interpolate({
    inputRange: [1, 1.2],
    outputRange: [0.6, 0.9],
  });

  return (
    <View style={styles.container}>
      {/* Top Left Gradient Light */}
      <Animated.View
        style={[
          styles.topLeftGradient,
          {
            opacity: opacityInterpolate,
            transform: [{ rotate: rotationInterpolate }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(0, 255, 0, 0.8)', 'rgba(255, 255, 0, 0.6)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBox}
        />
      </Animated.View>

      {/* Top Right Gradient Light */}
      <Animated.View
        style={[
          styles.topRightGradient,
          {
            opacity: opacityInterpolate,
            transform: [{ rotate: rotationInterpolate }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 0, 0, 0.8)', 'rgba(0, 100, 255, 0.6)', 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBox}
        />
      </Animated.View>

      {/* Additional animated light streaks */}
      <Animated.View
        style={[
          styles.topLeftStreak,
          {
            opacity: topLeftAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.2, 0.8, 0.2],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(0, 255, 100, 0.9)', 'rgba(255, 200, 0, 0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={styles.streakBox}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.topRightStreak,
          {
            opacity: topRightAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.2, 0.8, 0.2],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 50, 50, 0.9)', 'rgba(50, 100, 255, 0.5)', 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
          style={styles.streakBox}
        />
      </Animated.View>

      {/* Moving border lights */}
      <Animated.View
        style={[
          styles.topBorderLight,
          {
            transform: [
              {
                translateX: topLeftAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, width + 100],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0, 255, 150, 0.8)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.movingLight}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.topBorderLight,
          {
            transform: [
              {
                translateX: topRightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [width + 100, -100],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 100, 0, 0.8)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.movingLight}
        />
      </Animated.View>

      {/* Children content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topLeftGradient: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    zIndex: 1,
  },
  topRightGradient: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    zIndex: 1,
  },
  gradientBox: {
    flex: 1,
    borderRadius: 100,
  },
  topLeftStreak: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 150,
    height: 150,
    zIndex: 2,
  },
  topRightStreak: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 150,
    height: 150,
    zIndex: 2,
  },
  streakBox: {
    flex: 1,
  },
  topBorderLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 200,
    height: 4,
    zIndex: 3,
  },
  movingLight: {
    flex: 1,
  },
});

export default AnimatedGradientBorder;