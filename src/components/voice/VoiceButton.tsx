import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import VoiceService from '../../services/voice/VoiceService';

interface VoiceButtonProps {
  onPress: () => void;
  size?: number;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ onPress, size = 120 }) => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const voiceState = useSelector((state: RootState) => state.voice);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Breathing animation when idle
  useEffect(() => {
    if (!voiceState.isListening && !voiceState.isProcessing && !voiceState.isSpeaking) {
      const breathingAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      breathingAnimation.start();
      return () => breathingAnimation.stop();
    }
  }, [voiceState.isListening, voiceState.isProcessing, voiceState.isSpeaking]);

  // Pulse animation when listening
  useEffect(() => {
    if (voiceState.isListening) {
      const listeningAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      listeningAnimation.start();
      return () => listeningAnimation.stop();
    }
  }, [voiceState.isListening]);

  // Rotation animation when processing
  useEffect(() => {
    if (voiceState.isProcessing) {
      const processingAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      processingAnimation.start();
      return () => processingAnimation.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [voiceState.isProcessing]);

  // Audio level visualization
  useEffect(() => {
    if (voiceState.isListening && voiceState.audioLevel > 0) {
      Animated.timing(waveAnim, {
        toValue: voiceState.audioLevel,
        duration: 100,
        useNativeDriver: true,
      }).start();
    } else {
      waveAnim.setValue(0);
    }
  }, [voiceState.audioLevel, voiceState.isListening]);

  const getButtonText = () => {
    if (voiceState.isListening) return "I'm listening";
    if (voiceState.isProcessing) return "Processing...";
    if (voiceState.isSpeaking) return "Speaking";
    return "Tap me";
  };

  const getGradientColors = () => {
    if (voiceState.isListening) {
      return [theme.accent, theme.accentSecondary, '#FF6B6B'];
    }
    if (voiceState.isProcessing) {
      return [theme.accentSecondary, theme.accent];
    }
    if (voiceState.isSpeaking) {
      return ['#4ECDC4', theme.accent];
    }
    return [theme.accent, theme.accentSecondary];
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Audio level rings */}
      {voiceState.isListening && (
        <>
          <Animated.View
            style={[
              styles.waveRing,
              {
                width: size + 40,
                height: size + 40,
                borderRadius: (size + 40) / 2,
                opacity: waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.6],
                }),
                transform: [{
                  scale: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.waveRing,
              {
                width: size + 80,
                height: size + 80,
                borderRadius: (size + 80) / 2,
                opacity: waveAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.3],
                }),
                transform: [{
                  scale: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.4],
                  }),
                }],
              },
            ]}
          />
        </>
      )}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.buttonContainer, { width: size, height: size }]}
      >
        <Animated.View
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [
                { scale: pulseAnim },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={getGradientColors()}
            style={[styles.gradient, { borderRadius: size / 2 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.buttonContent}>
              <Text style={[styles.emoji, { fontSize: size * 0.3 }]}>
                {voiceState.isListening ? '🎙️' :
                 voiceState.isProcessing ? '🧠' :
                 voiceState.isSpeaking ? '🔊' : '💬'}
              </Text>
              <Text style={[styles.buttonText, { color: theme.text }]}>
                {getButtonText()}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {voiceState.error && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>
            {voiceState.error}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    marginBottom: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  waveRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  errorContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default VoiceButton;