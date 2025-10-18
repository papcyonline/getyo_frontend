import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface HomeHeaderProps {
  unreadNotifications: number;
  notificationPulse: Animated.Value;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  unreadNotifications,
  notificationPulse,
  onMenuPress,
  onNotificationsPress,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onMenuPress();
        }}
        activeOpacity={0.7}
        accessibilityLabel="Open settings menu"
        accessibilityHint="Opens the settings panel from the left"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.3)']}
          style={styles.headerIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onNotificationsPress();
        }}
        activeOpacity={0.7}
        accessibilityLabel={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
        accessibilityHint="View your notifications and updates"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.3)']}
          style={styles.headerIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="notifications" size={24} color="#FFFFFF" />
        </LinearGradient>
        {/* Unread notification indicator */}
        {unreadNotifications > 0 && (
          <Animated.View
            style={[
              styles.notificationIndicator,
              {
                transform: [{ scale: notificationPulse }],
              },
            ]}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4757',
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default React.memo(HomeHeader);
