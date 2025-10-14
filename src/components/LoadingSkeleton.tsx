import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * LoadingSkeleton Component
 *
 * Animated placeholder for loading content
 * Better UX than spinners
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * TaskCardSkeleton - Skeleton for task list items
 */
export const TaskCardSkeleton: React.FC = () => {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <LoadingSkeleton width={24} height={24} borderRadius={12} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <LoadingSkeleton width="70%" height={16} style={{ marginBottom: 8 }} />
          <LoadingSkeleton width="40%" height={12} />
        </View>
      </View>
    </View>
  );
};

/**
 * EventCardSkeleton - Skeleton for calendar events
 */
export const EventCardSkeleton: React.FC = () => {
  return (
    <View style={styles.eventCard}>
      <LoadingSkeleton width={4} height={60} borderRadius={2} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <LoadingSkeleton width="80%" height={16} style={{ marginBottom: 8 }} />
        <LoadingSkeleton width="50%" height={12} style={{ marginBottom: 6 }} />
        <LoadingSkeleton width="30%" height={12} />
      </View>
    </View>
  );
};

/**
 * ConversationCardSkeleton - Skeleton for conversation list
 */
export const ConversationCardSkeleton: React.FC = () => {
  return (
    <View style={styles.conversationCard}>
      <LoadingSkeleton width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <LoadingSkeleton width="60%" height={16} style={{ marginBottom: 8 }} />
        <LoadingSkeleton width="90%" height={12} />
      </View>
      <LoadingSkeleton width={50} height={12} />
    </View>
  );
};

/**
 * BriefingSkeleton - Skeleton for daily briefing
 */
export const BriefingSkeleton: React.FC = () => {
  return (
    <View style={styles.briefingCard}>
      <View style={styles.briefingItem}>
        <LoadingSkeleton width={20} height={20} borderRadius={10} />
        <LoadingSkeleton width={30} height={18} style={{ marginHorizontal: 6 }} />
        <LoadingSkeleton width={40} height={12} />
      </View>
      <View style={styles.briefingDivider} />
      <View style={styles.briefingItem}>
        <LoadingSkeleton width={20} height={20} borderRadius={10} />
        <LoadingSkeleton width={30} height={18} style={{ marginHorizontal: 6 }} />
        <LoadingSkeleton width={40} height={12} />
      </View>
      <View style={styles.briefingDivider} />
      <View style={styles.briefingItem}>
        <LoadingSkeleton width={20} height={20} borderRadius={10} />
        <LoadingSkeleton width={30} height={18} style={{ marginHorizontal: 6 }} />
        <LoadingSkeleton width={40} height={12} />
      </View>
    </View>
  );
};

/**
 * ReminderSkeleton - Skeleton for reminder cards
 */
export const ReminderSkeleton: React.FC = () => {
  return (
    <View style={styles.reminderCard}>
      <LoadingSkeleton width={36} height={36} borderRadius={18} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <LoadingSkeleton width="75%" height={15} style={{ marginBottom: 6 }} />
        <LoadingSkeleton width="40%" height={12} />
      </View>
    </View>
  );
};

/**
 * InsightSkeleton - Skeleton for AI insights
 */
export const InsightSkeleton: React.FC = () => {
  return (
    <View style={styles.insightCard}>
      <LoadingSkeleton width={28} height={28} borderRadius={14} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <LoadingSkeleton width="100%" height={14} style={{ marginBottom: 6 }} />
        <LoadingSkeleton width="80%" height={14} />
      </View>
    </View>
  );
};

/**
 * ListSkeleton - Multiple skeleton items for lists
 */
export const ListSkeleton: React.FC<{ count?: number; type?: 'task' | 'event' | 'conversation' }> = ({
  count = 5,
  type = 'task',
}) => {
  const SkeletonComponent =
    type === 'task' ? TaskCardSkeleton :
    type === 'event' ? EventCardSkeleton :
    ConversationCardSkeleton;

  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  briefingCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  briefingItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  briefingDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
});

export default LoadingSkeleton;
