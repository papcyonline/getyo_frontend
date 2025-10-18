import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');

interface BottomNavProps {
  user: any;
  pendingCount: number;
  arrowOpacity: Animated.Value;
  onSettingsPress: () => void;
  onSettingsLongPress: () => void;
  onDashboardPress: () => void;
  onDashboardLongPress: () => void;
  onMicPress: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({
  user,
  pendingCount,
  arrowOpacity,
  onSettingsPress,
  onSettingsLongPress,
  onDashboardPress,
  onDashboardLongPress,
  onMicPress,
}) => {
  return (
    <Animated.View
      style={[
        styles.bottomNavContainer,
        {
          opacity: arrowOpacity,
          transform: [{
            translateY: arrowOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0]
            })
          }]
        }
      ]}
    >
      <LinearGradient
        colors={['rgba(42, 42, 42, 0.95)', 'rgba(26, 26, 26, 0.98)']}
        style={styles.bottomNavGradient}
      >
        {/* Wake Word Prompt with Mic Button */}
        <View style={styles.wakeWordContainerBottom}>
          <Text style={styles.wakeWordPrompt}>Say</Text>
          <Text style={styles.wakeWordText}>
            "Yo {user?.assistantName || 'PA'}"
          </Text>
          <Text style={styles.wakeWordPrompt}>or tap the mic below</Text>

          {/* Mic Button */}
          <TouchableOpacity
            style={styles.micButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onMicPress();
            }}
            activeOpacity={0.7}
            accessibilityLabel="Voice input"
            accessibilityHint="Tap to start voice input"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['#C9A96E', '#E5C794']}
              style={styles.micButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="mic" size={32} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Navigation Buttons - Edge positioned */}
        {/* Settings Button - Left Edge (40% cut off) */}
        <TouchableOpacity
          style={styles.navButtonLeft}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSettingsPress();
          }}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSettingsLongPress();
          }}
          activeOpacity={0.8}
          accessibilityLabel="Settings"
          accessibilityHint="Tap to open settings panel, long press for privacy settings"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={['#C9A96E', '#E5C794']}
            style={styles.navButtonGradientLeft}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="settings-outline" size={26} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Dashboard Button - Right Edge (40% cut off) */}
        <TouchableOpacity
          style={styles.navButtonRight}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDashboardPress();
          }}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDashboardLongPress();
          }}
          activeOpacity={0.8}
          accessibilityLabel={`Dashboard${pendingCount > 0 ? `, ${pendingCount} pending items` : ''}`}
          accessibilityHint="Tap to open dashboard, long press for tasks"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={['#C9A96E', '#E5C794']}
            style={styles.navButtonGradientRight}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="grid-outline" size={26} color="#FFFFFF" />
          </LinearGradient>
          {/* Pending count badge */}
          {pendingCount > 0 && (
            <View style={styles.dashboardBadge}>
              <Text style={styles.dashboardBadgeText}>
                {pendingCount > 99 ? '99+' : pendingCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomNavGradient: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  wakeWordContainerBottom: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
  },
  wakeWordPrompt: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  wakeWordText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#C9A96E',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(201, 169, 110, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  navButtonLeft: {
    position: 'absolute',
    left: -28,
    bottom: 80,
    width: 70,
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  navButtonRight: {
    position: 'absolute',
    right: -28,
    bottom: 80,
    width: 70,
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  navButtonGradientLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  navButtonGradientRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  dashboardBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  dashboardBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  micButton: {
    marginTop: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(BottomNav);
