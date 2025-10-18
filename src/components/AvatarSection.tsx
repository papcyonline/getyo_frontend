import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import ReadyPlayerMeAvatar from './ReadyPlayerMeAvatar';
import AvatarErrorBoundary from './AvatarErrorBoundary';

const { width } = Dimensions.get('window');

type RobotState = 'idle' | 'listening' | 'talking' | 'thinking';

interface GreetingData {
  timeGreeting: string;
  userName: string;
  contextMessage?: string;
}

interface AvatarSectionProps {
  user: any;
  robotState: RobotState;
  avatarPulse: Animated.Value;
  waveformBars: Animated.Value[];
  avatarLoadFailed: boolean;
  greeting: GreetingData;
  useReadyPlayerMe: boolean;
  avatarUrl: string;
  lottieRef: React.RefObject<LottieView>;
  onAvatarPress: () => void;
  onAvatarLongPress: () => void;
  onAvatarError: () => void;
  getRobotAnimation: () => any;
}

const AvatarSection: React.FC<AvatarSectionProps> = ({
  user,
  robotState,
  avatarPulse,
  waveformBars,
  avatarLoadFailed,
  greeting,
  useReadyPlayerMe,
  avatarUrl,
  lottieRef,
  onAvatarPress,
  onAvatarLongPress,
  onAvatarError,
  getRobotAnimation,
}) => {
  return (
    <>
      {/* Greeting Message */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingTime}>{greeting.timeGreeting}</Text>
        <Text style={styles.greetingName}>{greeting.userName}</Text>
        {greeting.contextMessage && (
          <Text style={styles.greetingContext}>{greeting.contextMessage}</Text>
        )}
      </View>

      {/* Center Content - Avatar */}
      <View style={styles.centerContent}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={onAvatarPress}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onAvatarLongPress();
          }}
          activeOpacity={0.8}
          accessibilityLabel={`${user?.assistantName || 'Assistant'} avatar, currently ${robotState}`}
          accessibilityHint="Double tap for quick voice input, long press to configure assistant"
          accessibilityRole="button"
        >
          <Animated.View
            style={[
              styles.characterContainer,
              {
                transform: [{ scale: avatarPulse }],
              },
            ]}
          >
            {/* Audio Waveform Bars - Show during listening */}
            {robotState === 'listening' && (
              <View style={styles.waveformContainer}>
                {waveformBars.map((bar, index) => {
                  const angle = (index * 60) - 30;
                  const radius = 180;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;

                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.waveformBar,
                        {
                          left: '50%',
                          top: '50%',
                          transform: [
                            { translateX: x },
                            { translateY: y },
                            { scaleY: bar },
                          ],
                        },
                      ]}
                    />
                  );
                })}
              </View>
            )}

            {useReadyPlayerMe && !avatarLoadFailed ? (
              /* Ready Player Me 3D Avatar with Error Boundary */
              <>
                <AvatarErrorBoundary onError={onAvatarError}>
                  <ReadyPlayerMeAvatar
                    avatarUrl={avatarUrl}
                    animationState={robotState}
                    onError={onAvatarError}
                  />
                </AvatarErrorBoundary>
                {/* Greeting text bubble */}
                {robotState === 'talking' && (
                  <View style={styles.greetingBubble}>
                    <Text style={styles.greetingText}>
                      Hey! I'm {user?.assistantName || 'Yo!'}
                    </Text>
                  </View>
                )}
              </>
            ) : avatarLoadFailed ? (
              /* Fallback UI when avatar fails to load */
              <View style={styles.avatarFallback}>
                <LinearGradient
                  colors={['#C9A96E', '#E5C794']}
                  style={styles.avatarFallbackGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="person-circle" size={120} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.avatarFallbackText}>
                  {user?.assistantName || 'Assistant'}
                </Text>
              </View>
            ) : (
              /* Fallback: Lottie Animation */
              <>
                <LottieView
                  key={robotState}
                  ref={lottieRef}
                  source={getRobotAnimation()}
                  autoPlay
                  loop
                  style={styles.characterAnimation}
                  speed={1}
                  resizeMode="contain"
                />
                {/* Greeting text bubble */}
                {robotState === 'talking' && (
                  <View style={styles.greetingBubble}>
                    <Text style={styles.greetingText}>
                      Hey! I'm {user?.assistantName || 'Yo!'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  greetingContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 15,
  },
  greetingTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  greetingName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  greetingContext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C9A96E',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,
  },
  avatarContainer: {
    marginBottom: 4,
  },
  characterContainer: {
    width: width * 0.95,
    height: 480,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  characterAnimation: {
    width: width * 0.95,
    height: 480,
  },
  waveformContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  waveformBar: {
    position: 'absolute',
    width: 4,
    height: 60,
    backgroundColor: '#C9A96E',
    borderRadius: 2,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  greetingBubble: {
    position: 'absolute',
    top: 10,
    backgroundColor: 'rgba(201, 169, 110, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  greetingText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackGradient: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C9A96E',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default React.memo(AvatarSection);
