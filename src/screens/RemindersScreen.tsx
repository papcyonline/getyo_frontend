import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState } from '../store';
import { setReminders, deleteReminder, updateReminder } from '../store/slices/reminderSlice';
import apiService from '../services/api';

const THEME_GOLD = '#C9A96E';

// Circular Progress Component
interface CircularProgressProps {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  color,
  size = 50,
  strokeWidth = 4,
  showPercentage = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {showPercentage && (
        <View style={{ position: 'absolute', width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color }}>{Math.round(percentage)}%</Text>
        </View>
      )}
    </View>
  );
};

const RemindersScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const reminders = useSelector((state: RootState) => state.reminder.reminders);
  const user = useSelector((state: RootState) => state.user.user);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const loadReminders = async () => {
    try {
      console.log('📡 Loading reminders from backend...');
      const remindersData = await apiService.getReminders();
      console.log('✅ Reminders loaded:', remindersData.length);

      // Transform MongoDB _id to id for frontend compatibility
      const transformedReminders = remindersData.map((reminder: any) => ({
        ...reminder,
        id: reminder._id || reminder.id,
      }));

      dispatch(setReminders(transformedReminders));
    } catch (error: any) {
      console.error('❌ Failed to load reminders:', error);
      Alert.alert('Error', error.message || 'Failed to load reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load reminders when screen mounts
  useEffect(() => {
    loadReminders();
  }, []);

  // Reload reminders when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadReminders();
    }, [])
  );

  const handleBackPress = () => {
    navigation.navigate('Home', { openQuickActions: true } as never);
  };

  const handleAddReminder = () => {
    navigation.navigate('AddReminder' as never);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const handleEditReminder = (reminder: any) => {
    // Close the swipeable
    swipeableRefs.current[reminder.id]?.close();

    // TODO: Navigate to edit reminder screen when implemented
    Alert.alert(
      'Edit Reminder',
      `Edit functionality for "${reminder.title}" will be implemented soon.`,
      [{ text: 'OK' }]
    );
  };

  const handleDeleteReminder = (reminder: any) => {
    // Close the swipeable
    swipeableRefs.current[reminder.id]?.close();

    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const reminderId = reminder._id || reminder.id;
              console.log('🗑️ Deleting reminder:', reminderId);
              await apiService.deleteReminder(reminderId);
              console.log('✅ Reminder deleted successfully');

              // Update Redux store
              dispatch(deleteReminder(reminder.id));
            } catch (error: any) {
              console.error('❌ Failed to delete reminder:', error);
              Alert.alert('Error', error.message || 'Failed to delete reminder. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderLeftActions = (reminder: any, progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: THEME_GOLD }]}
          onPress={() => handleEditReminder(reminder)}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="pencil-outline" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRightActions = (reminder: any, progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: '#EF4444' }]}
          onPress={() => handleDeleteReminder(reminder)}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const filters = [
    { key: 'all', label: 'All', count: reminders.length },
    { key: 'active', label: 'Active', count: reminders.filter(r => r.status === 'active').length },
    { key: 'urgent', label: 'Urgent', count: reminders.filter(r => r.isUrgent && r.status === 'active').length },
    { key: 'completed', label: 'Completed', count: reminders.filter(r => r.status === 'completed').length },
  ];

  const filteredReminders = reminders.filter(reminder => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return reminder.status === 'active';
    if (selectedFilter === 'urgent') return reminder.isUrgent && reminder.status === 'active';
    if (selectedFilter === 'completed') return reminder.status === 'completed';
    return true;
  });

  const getRepeatIcon = (repeatType: string) => {
    switch (repeatType) {
      case 'daily': return 'today-outline';
      case 'weekly': return 'calendar-outline';
      case 'monthly': return 'calendar';
      default: return 'refresh-outline';
    }
  };

  const getRepeatLabel = (repeatType: string) => {
    switch (repeatType) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return 'Once';
    }
  };

  const formatReminderTime = (timeStr: string) => {
    const date = new Date(timeStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const timeString = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    if (diffDays === 0) return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (diffDays === 1) return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0) return `Overdue`;
    return timeString;
  };

  // Calculate time remaining percentage (0-100)
  const getTimeRemainingPercentage = (reminderTime: string, createdAt?: string) => {
    const now = new Date().getTime();
    const reminder = new Date(reminderTime).getTime();
    const created = createdAt ? new Date(createdAt).getTime() : now - (7 * 24 * 60 * 60 * 1000); // Default 7 days ago if no created date

    const totalTime = reminder - created;
    const timeRemaining = reminder - now;

    if (timeRemaining <= 0) return 0; // Overdue
    if (timeRemaining >= totalTime) return 100; // Just created

    return Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));
  };

  // Get color based on time remaining
  const getTimeColor = (percentage: number, isOverdue: boolean, isCompleted: boolean) => {
    if (isCompleted) return '#10B981'; // Green for completed
    if (isOverdue) return '#EF4444'; // Red for overdue
    if (percentage > 50) return '#10B981'; // Green - plenty of time
    if (percentage > 25) return '#F59E0B'; // Orange - getting close
    return '#EF4444'; // Red - almost due
  };

  // Format time remaining in days, hours, minutes
  const formatTimeRemaining = (reminderTime: string) => {
    const now = new Date().getTime();
    const reminder = new Date(reminderTime).getTime();
    const diff = reminder - now;

    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderReminder = (item: any, index: number) => {
    const isOverdue = new Date(item.reminderTime) < new Date() && item.status === 'active';
    const isCompleted = item.status === 'completed';
    const isLast = index === filteredReminders.length - 1;

    const timePercentage = getTimeRemainingPercentage(item.reminderTime, item.createdAt);
    const timeColor = getTimeColor(timePercentage, isOverdue, isCompleted);

    return (
      <View key={item.id} style={styles.timelineItem}>
        {/* Timeline Section - Left */}
        <View style={styles.timelineSection}>
          {/* Circular Progress Donut */}
          <View style={styles.donutContainer}>
            <CircularProgress
              percentage={isCompleted ? 100 : timePercentage}
              color={timeColor}
              size={50}
              strokeWidth={4}
            />
            {/* Center Icon */}
            <View style={styles.donutCenter}>
              {isCompleted ? (
                <Ionicons name="checkmark" size={20} color={timeColor} />
              ) : isOverdue ? (
                <Ionicons name="alert" size={18} color={timeColor} />
              ) : item.isUrgent ? (
                <Ionicons name="warning" size={18} color={timeColor} />
              ) : (
                <Ionicons name="notifications-outline" size={18} color={timeColor} />
              )}
            </View>
            {/* Time Remaining Text */}
            <Text style={[styles.timeRemainingText, { color: timeColor }]}>
              {isCompleted ? 'Done' : formatTimeRemaining(item.reminderTime)}
            </Text>
          </View>

          {/* Dotted Connector Line */}
          {!isLast && (
            <View style={styles.connectorLine}>
              {[...Array(8)].map((_, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
              ))}
            </View>
          )}
        </View>

        {/* Reminder Content - Right */}
        <View style={styles.reminderContentWrapper}>
          <Swipeable
            ref={(ref) => (swipeableRefs.current[item.id] = ref)}
            renderLeftActions={(progress, dragX) => renderLeftActions(item, progress, dragX)}
            renderRightActions={(progress, dragX) => renderRightActions(item, progress, dragX)}
            overshootLeft={false}
            overshootRight={false}
          >
            <TouchableOpacity
              style={styles.reminderCard}
              onPress={() => console.log('Reminder pressed:', item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.reminderHeader}>
                <Text style={[
                  styles.reminderTitle,
                  { color: theme.text },
                  isCompleted && styles.completedText,
                ]} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.isUrgent && item.status === 'active' && (
                  <View style={[styles.urgentBadge, { backgroundColor: '#EF444420' }]}>
                    <Ionicons name="warning" size={12} color="#EF4444" />
                  </View>
                )}
              </View>

              {item.notes && (
                <Text style={[styles.reminderNotes, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.notes}
                </Text>
              )}

              <View style={styles.reminderMeta}>
                <View style={[styles.metaItem, isOverdue && { backgroundColor: '#EF444420' }]}>
                  <Ionicons name="time-outline" size={14} color={isOverdue ? '#EF4444' : THEME_GOLD} />
                  <Text style={[
                    styles.metaText,
                    { color: isOverdue ? '#EF4444' : theme.textSecondary }
                  ]}>
                    {formatReminderTime(item.reminderTime)}
                  </Text>
                </View>
                {item.repeatType !== 'none' && (
                  <View style={styles.metaItem}>
                    <Ionicons name={getRepeatIcon(item.repeatType) as any} size={14} color={THEME_GOLD} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                      {getRepeatLabel(item.repeatType)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </Swipeable>
        </View>
      </View>
    );
  };

  // Calculate unique stats
  const totalReminders = reminders.length;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayRemindersCount = reminders.filter(r => {
    const reminderDate = new Date(r.reminderTime);
    const reminderDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
    return reminderDay.getTime() === today.getTime() && r.status !== 'completed';
  }).length;

  const overdueCount = reminders.filter(r => {
    const reminderDate = new Date(r.reminderTime);
    return reminderDate < now && r.status === 'active';
  }).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Reminders</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Overview Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: `${THEME_GOLD}20` }]}>
          <Text style={[styles.statNumber, { color: THEME_GOLD }]}>{totalReminders}</Text>
          <Text style={[styles.statLabel, { color: THEME_GOLD }]}>Total</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{overdueCount}</Text>
          <Text style={[styles.statLabel, { color: '#EF4444' }]}>Overdue</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{todayRemindersCount}</Text>
          <Text style={[styles.statLabel, { color: '#3B82F6' }]}>Today</Text>
        </View>
      </View>

      {/* Gray Container */}
      <View style={styles.bottomSheet}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME_GOLD} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading reminders...</Text>
          </View>
        ) : (
          <>
            {/* Filter Tabs */}
            <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContentContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && { backgroundColor: THEME_GOLD }
              ]}
              onPress={() => setSelectedFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText,
                { color: selectedFilter === filter.key ? '#000000' : theme.text }
              ]}>
                {filter.label}
              </Text>
              {filter.count > 0 && (
                <View style={[
                  styles.filterBadge,
                  { backgroundColor: selectedFilter === filter.key ? 'rgba(0, 0, 0, 0.2)' : `${THEME_GOLD}30` }
                ]}>
                  <Text style={[
                    styles.filterBadgeText,
                    { color: selectedFilter === filter.key ? '#000000' : THEME_GOLD }
                  ]}>
                    {filter.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reminders List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME_GOLD} />
          }
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {filteredReminders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Reminders</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {selectedFilter === 'all' ? 'Tap + to create your first reminder' : `No ${selectedFilter} reminders`}
              </Text>
            </View>
          ) : (
            <View style={styles.remindersContainer}>
              {filteredReminders.map((reminder, index) => renderReminder(reminder, index))}
            </View>
          )}
        </ScrollView>
          </>
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={handleAddReminder}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#C9A96E', '#E5C794']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    flexGrow: 0,
  },
  filterContentContainer: {
    paddingRight: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  filterBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
  },
  remindersContainer: {
    paddingHorizontal: 20,
  },
  // Timeline Layout
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  timelineSection: {
    alignItems: 'center',
    marginRight: 16,
    width: 50,
  },
  donutContainer: {
    width: 50,
    height: 50,
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorLine: {
    flex: 1,
    width: 2,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 8,
    marginTop: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginVertical: 2,
  },
  reminderContentWrapper: {
    flex: 1,
    paddingTop: 4,
  },
  reminderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  urgentBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reminderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  reminderNotes: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reminderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  timeRemainingText: {
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RemindersScreen;
