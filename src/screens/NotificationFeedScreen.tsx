import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

const { height, width } = Dimensions.get('window');

// Helper function to get icon name based on notification type
const getIconForType = (type: string): string => {
  const iconMap: Record<string, string> = {
    'ai_suggestion': 'sparkles',
    'calendar': 'calendar',
    'event': 'calendar',
    'meeting': 'people',
    'email': 'mail',
    'task': 'checkmark-circle',
    'ai_insight': 'trending-up',
    'reminder': 'alarm',
    'system': 'information-circle',
    'alert': 'alert-circle',
  };
  return iconMap[type] || 'notifications';
};

// Helper function to convert date to relative time
const getRelativeTime = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return past.toLocaleDateString();
};

const NotificationFeedScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [notificationList, setNotificationList] = useState<any[]>([]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await api.getNotifications({ limit: 50 });

      // Map backend format to frontend format
      const mappedNotifications = response.map((notification: any) => ({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: getRelativeTime(notification.createdAt),
        unread: !notification.read, // Backend uses "read", frontend uses "unread"
        icon: getIconForType(notification.type),
        priority: notification.priority,
        relatedId: notification.relatedId,
        relatedModel: notification.relatedModel,
      }));

      setNotificationList(mappedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      Alert.alert('Error', 'Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();

      // Auto-refresh every 10 seconds while screen is active
      const pollInterval = setInterval(() => {
        fetchNotifications();
      }, 10000); // Poll every 10 seconds

      // Cleanup interval when screen loses focus
      return () => {
        clearInterval(pollInterval);
      };
    }, [])
  );

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAllAsRead = async () => {
    Alert.alert(
      'Mark All as Read',
      'Mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All Read',
          onPress: async () => {
            try {
              await api.markAllNotificationsAsRead();
              // Update local state
              setNotificationList(prev =>
                prev.map(n => ({ ...n, unread: false }))
              );
            } catch (error) {
              console.error('Failed to mark all as read:', error);
              Alert.alert('Error', 'Failed to mark notifications as read.');
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = async (notification: any) => {
    // Mark as read in API
    try {
      await api.markNotificationAsRead(notification.id);

      // Update local state
      setNotificationList(prev =>
        prev.map(n => n.id === notification.id ? { ...n, unread: false } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }

    // For AI research notifications, fetch full results from the assignment
    if (notification.type === 'ai_suggestion' && notification.relatedModel === 'Assignment') {
      try {
        // Fetch the full assignment with research findings
        const assignment = await api.getAssignment(notification.relatedId);

        // Show full research results
        Alert.alert(
          notification.title,
          assignment.findings || notification.message,
          [
            {
              text: 'Close',
              style: 'cancel'
            },
            {
              text: 'View Task',
              onPress: () => {
                navigation.navigate('Tasks' as any);
              }
            }
          ],
          { cancelable: true }
        );
      } catch (error) {
        console.error('Failed to fetch assignment:', error);
        // Fallback to showing notification message
        Alert.alert(notification.title, notification.message);
      }
    } else {
      // Show notification details for other types
      Alert.alert(
        notification.title,
        notification.message,
        [
          {
            text: 'Dismiss',
            style: 'cancel'
          },
          {
            text: 'View Related',
            onPress: () => {
              // Navigate based on notification type
              if (notification.type === 'calendar' || notification.type === 'event' || notification.type === 'meeting') {
                navigation.navigate('Calendar' as any);
              } else if (notification.type === 'email') {
                navigation.navigate('EmailManagement' as any);
              } else if (notification.type === 'task') {
                navigation.navigate('Tasks' as any);
              } else if (notification.type === 'reminder') {
                navigation.navigate('Tasks' as any);
              }
            }
          }
        ]
      );
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteNotification(id);
              // Update local state
              setNotificationList(prev => prev.filter(n => n.id !== id));
            } catch (error) {
              console.error('Failed to delete notification:', error);
              Alert.alert('Error', 'Failed to delete notification.');
            }
          }
        }
      ]
    );
  };

  const filters = [
    { key: 'all', label: 'All', count: notificationList.length },
    { key: 'unread', label: 'Unread', count: notificationList.filter(n => n.unread).length },
    { key: 'urgent', label: 'Urgent', count: notificationList.filter(n => n.priority === 'urgent').length },
    { key: 'ai', label: 'AI Updates', count: notificationList.filter(n => n.type.includes('ai')).length }
  ];

  const filteredNotifications = notificationList.filter(notification => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return notification.unread;
    if (selectedFilter === 'urgent') return notification.priority === 'urgent';
    if (selectedFilter === 'ai') return notification.type.includes('ai');
    return true;
  });

  const unreadCount = notificationList.filter(n => n.unread).length;

  // Swipeable Notification Component
  const SwipeableNotification = ({ notification, index }: any) => {
    const translateX = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          return Math.abs(gestureState.dx) > 10;
        },
        onPanResponderMove: (evt, gestureState) => {
          if (gestureState.dx < 0) {
            translateX.setValue(Math.max(gestureState.dx, -80));
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          if (gestureState.dx < -40) {
            Animated.spring(translateX, {
              toValue: -80,
              useNativeDriver: true,
            }).start();
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      })
    ).current;

    return (
      <View style={styles.swipeableContainer}>
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }).start(() => handleDelete(notification.id));
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.notificationWrapper,
            { transform: [{ translateX }] }
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={[
              styles.notificationItem,
              notification.unread && styles.notificationItemUnread
            ]}
            onPress={() => handleNotificationPress(notification)}
            activeOpacity={0.7}
          >
            {notification.priority === 'urgent' && (
              <View style={styles.priorityIndicator} />
            )}

            <View style={styles.iconContainer}>
              <Ionicons name={notification.icon as any} size={22} color="#C9A96E" />
            </View>

            <View style={styles.notificationContent}>
              <View style={styles.titleRow}>
                <Text style={styles.notificationTitle} numberOfLines={1}>
                  {notification.title}
                </Text>
                {notification.unread && <View style={styles.unreadIndicator} />}
              </View>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </Text>
            </View>

            <View style={styles.rightContent}>
              <Text style={styles.timestamp}>
                {notification.timestamp}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Dot pattern for background
  const renderDots = () => {
    const dots = [];
    const rows = 8;
    const dotsPerRow = 8;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < dotsPerRow; col++) {
        dots.push(
          <View
            key={`${row}-${col}`}
            style={[
              styles.dot,
              {
                left: (col * width) / dotsPerRow + (width / dotsPerRow) / 2,
                top: (row * height) / rows + (height / rows) / 2,
              }
            ]}
          />
        );
      }
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      {/* Blue-Black Gradient Background */}
      

      {/* Dot Pattern */}
      <View style={styles.dotContainer} pointerEvents="none">
        {renderDots()}
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={28} color="#C9A96E" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.headerAction} onPress={markAllAsRead}>
          <Ionicons name="checkmark-done" size={24} color="#C9A96E" />
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterPill,
                selectedFilter === filter.key && styles.filterPillActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View style={[
                  styles.filterCount,
                  selectedFilter === filter.key && styles.filterCountActive
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    selectedFilter === filter.key && styles.filterCountTextActive
                  ]}>{filter.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A96E" />
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C9A96E" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={48} color="rgba(201, 169, 110, 0.3)" />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' ? 'You\'re all caught up!' : `No ${selectedFilter} notifications`}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((notification, index) => (
              <View key={notification.id}>
                <SwipeableNotification notification={notification} index={index} />
                {index < filteredNotifications.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    zIndex: 1,
  },
  dotContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    zIndex: 2,
  },
  dot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#C9A96E',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
  },
  filtersWrapper: {
    zIndex: 10,
    marginBottom: 20,
  },
  filtersContainer: {
    paddingHorizontal: 20,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  filterPillActive: {
    backgroundColor: '#C9A96E',
    borderColor: '#C9A96E',
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginRight: 6,
  },
  filterTextActive: {
    color: '#000000',
  },
  filterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterCountTextActive: {
    color: '#000000',
  },
  scrollView: {
    flex: 1,
    zIndex: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationsList: {
    // No gap needed with dividers
  },
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 80,
    height: '100%',
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationWrapper: {
    backgroundColor: '#000000',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(201, 169, 110, 0.05)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9A96E',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '500',
    color: '#C9A96E',
    marginBottom: 8,
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#C9A96E',
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 76,
    marginRight: 20,
  },
});

export default NotificationFeedScreen;