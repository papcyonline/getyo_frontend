import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const { width: screenWidth } = Dimensions.get('window');

interface VoiceVisualizerProps {
  barCount?: number;
  height?: number;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  barCount = 20,
  height = 60,
}) => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const { isListening, audioLevel } = useSelector((state: RootState) => state.voice);

  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.1))
  ).current;

  useEffect(() => {
    if (isListening && audioLevel > 0) {
      // Create dynamic animation based on audio level
      const animations = animatedValues.map((animValue, index) => {
        const delay = index * 50;
        const randomHeight = Math.random() * audioLevel + 0.1;

        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: randomHeight,
              duration: 150 + Math.random() * 100,
              useNativeDriver: false,
            }),
            Animated.timing(animValue, {
              toValue: 0.1,
              duration: 150 + Math.random() * 100,
              useNativeDriver: false,
            }),
          ])
        );
      });

      animations.forEach(anim => anim.start());

      return () => {
        animations.forEach(anim => anim.stop());
      };
    } else {
      // Reset to baseline when not listening
      const resetAnimations = animatedValues.map(animValue =>
        Animated.timing(animValue, {
          toValue: 0.1,
          duration: 200,
          useNativeDriver: false,
        })
      );

      Animated.parallel(resetAnimations).start();
    }
  }, [isListening, audioLevel]);

  if (!isListening) {
    return null;
  }

  const barWidth = (screenWidth * 0.8) / barCount;

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.visualizer}>
        {animatedValues.map((animValue, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                width: barWidth - 2,
                backgroundColor: theme.accent,
                height: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [4, height],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '80%',
  },
  bar: {
    marginHorizontal: 1,
    borderRadius: 2,
    opacity: 0.8,
  },
});

export default VoiceVisualizer;