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
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { RootState } from '../store';
import { deleteTask, setTasks } from '../store/slices/taskSlice';
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

const TasksScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const tasks = useSelector((state: RootState) => state.task.tasks);
  const user = useSelector((state: RootState) => state.user.user);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const handleBackPress = () => {
    navigation.navigate('Home', { openQuickActions: true } as never);
  };

  const handleAddTask = () => {
    navigation.navigate('AddTask' as never);
  };

  // Load tasks from API on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Reload tasks when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    try {
      const fetchedTasks = await apiService.getTasks();
      dispatch(setTasks(fetchedTasks));
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // Don't show error to user on initial load
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleEditTask = (task: any) => {
    const taskId = task._id || task.id;
    // Close the swipeable first
    swipeableRefs.current[taskId]?.close();
    // Navigate to edit screen or show edit modal
    console.log('Edit task:', taskId);
    Alert.alert('Edit Task', `Editing: ${task.title}`);
  };

  const handleDeleteTask = (task: any) => {
    const taskId = task._id || task.id;
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => swipeableRefs.current[taskId]?.close() },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from backend first
              await apiService.deleteTask(taskId);
              // Then update Redux
              dispatch(deleteTask(taskId));
              swipeableRefs.current[taskId]?.close();
            } catch (error) {
              console.error('Failed to delete task:', error);
              Alert.alert('Error', 'Failed to delete task. Please try again.');
              swipeableRefs.current[taskId]?.close();
            }
          }
        }
      ]
    );
  };

  const displayTasks = tasks;

  const filters = [
    { key: 'all', label: 'All', count: displayTasks.length },
    { key: 'pending', label: 'Pending', count: displayTasks.filter(t => t.status === 'pending').length },
    { key: 'in_progress', label: 'In Progress', count: displayTasks.filter(t => t.status === 'in_progress').length },
    { key: 'completed', label: 'Completed', count: displayTasks.filter(t => t.status === 'completed').length },
    { key: 'high', label: 'High Priority', count: displayTasks.filter(t => t.priority === 'high').length }
  ];

  const filteredTasks = displayTasks.filter(task => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return task.status === 'pending';
    if (selectedFilter === 'in_progress') return task.status === 'in_progress';
    if (selectedFilter === 'completed') return task.status === 'completed';
    if (selectedFilter === 'high') return task.priority === 'high';
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'in_progress': return 'time';
      case 'pending': return 'ellipse-outline';
      default: return 'ellipse-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return THEME_GOLD;
      case 'pending': return '#F59E0B';
      default: return theme.textSecondary;
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays > 0) return `Due in ${diffDays} days`;
    return `Overdue by ${Math.abs(diffDays)} days`;
  };

  // Calculate time remaining percentage (0-100)
  const getTimeRemainingPercentage = (dueDate: string, createdAt?: string) => {
    const now = new Date().getTime();
    const due = new Date(dueDate).getTime();
    const created = createdAt ? new Date(createdAt).getTime() : now - (7 * 24 * 60 * 60 * 1000); // Default 7 days ago if no created date

    const totalTime = due - created;
    const timeRemaining = due - now;

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
  const formatTimeRemaining = (dueDate: string) => {
    const now = new Date().getTime();
    const due = new Date(dueDate).getTime();
    const diff = due - now;

    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderRightActions = (task: any, progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: '#EF4444' }]}
          onPress={() => handleDeleteTask(task)}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLeftActions = (task: any, progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, { backgroundColor: THEME_GOLD }]}
          onPress={() => handleEditTask(task)}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="pencil-outline" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTask = (item: any, index: number) => {
    const isOverdue = new Date(item.dueDate) < new Date() && item.status !== 'completed';
    const isCompleted = item.status === 'completed';
    const isLast = index === filteredTasks.length - 1;

    const timePercentage = getTimeRemainingPercentage(item.dueDate, item.createdAt);
    const timeColor = getTimeColor(timePercentage, isOverdue, isCompleted);

    // Use consistent ID (MongoDB uses _id, we may use id in Redux)
    const taskId = item._id || item.id;

    return (
      <View key={taskId} style={styles.timelineItem}>
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
              ) : (
                <Ionicons name="time-outline" size={18} color={timeColor} />
              )}
            </View>
            {/* Time Remaining Text */}
            <Text style={[styles.timeRemainingText, { color: timeColor }]}>
              {isCompleted ? 'Done' : formatTimeRemaining(item.dueDate)}
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

        {/* Task Content - Right */}
        <View style={styles.taskContentWrapper}>
          <Swipeable
            ref={(ref) => (swipeableRefs.current[taskId] = ref)}
            renderLeftActions={(progress, dragX) => renderLeftActions(item, progress, dragX)}
            renderRightActions={(progress, dragX) => renderRightActions(item, progress, dragX)}
            overshootLeft={false}
            overshootRight={false}
          >
            <TouchableOpacity
              style={styles.taskCard}
              onPress={() => console.log('Task pressed:', taskId)}
              activeOpacity={0.7}
            >
              <View style={styles.taskHeader}>
                <Text style={[
                  styles.taskTitle,
                  { color: theme.text },
                  isCompleted && styles.completedTask,
                ]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: `${getPriorityColor(item.priority)}20` }
                ]}>
                  <Ionicons name="flag" size={12} color={getPriorityColor(item.priority)} />
                </View>
              </View>

              <Text style={[styles.taskDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.taskMeta}>
                <View style={[styles.metaItem, isOverdue && { backgroundColor: '#EF444420' }]}>
                  <Ionicons name="calendar-outline" size={14} color={isOverdue ? '#EF4444' : THEME_GOLD} />
                  <Text style={[
                    styles.metaText,
                    { color: isOverdue ? '#EF4444' : theme.textSecondary }
                  ]}>
                    {formatDueDate(item.dueDate)}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {item.estimatedTime}
                  </Text>
                </View>
                {item.category && (
                  <View style={styles.metaItem}>
                    <Ionicons name="folder-outline" size={14} color={THEME_GOLD} />
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                      {item.category}
                    </Text>
                  </View>
                )}
              </View>

              {!isCompleted && item.progress > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill,
                      {
                        width: `${item.progress}%`,
                        backgroundColor: item.status === 'in_progress' ? THEME_GOLD : getPriorityColor(item.priority)
                      }
                    ]} />
                  </View>
                  <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                    {item.progress}%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Swipeable>
        </View>
      </View>
    );
  };

  // Calculate unique stats
  const totalTasks = displayTasks.length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueTodayCount = displayTasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime() && t.status !== 'completed';
  }).length;

  const overdueCount = displayTasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    return dueDate < today && t.status !== 'completed';
  }).length;

  const highPriorityCount = displayTasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Tasks</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Overview Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: `${THEME_GOLD}20` }]}>
          <Text style={[styles.statNumber, { color: THEME_GOLD }]}>{totalTasks}</Text>
          <Text style={[styles.statLabel, { color: THEME_GOLD }]}>Total Tasks</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
          <Text style={[styles.statNumber, { color: '#EF4444' }]}>{overdueCount}</Text>
          <Text style={[styles.statLabel, { color: '#EF4444' }]}>Overdue</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{dueTodayCount}</Text>
          <Text style={[styles.statLabel, { color: '#3B82F6' }]}>Due Today</Text>
        </View>
      </View>

      {/* Gray Container */}
      <View style={styles.bottomSheet}>
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

        {/* Tasks List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME_GOLD} />
          }
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {filteredTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Tasks</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                {selectedFilter === 'all' ? 'Tap + to create your first task' : `No ${selectedFilter} tasks`}
              </Text>
            </View>
          ) : (
            <View style={styles.tasksContainer}>
              {filteredTasks.map((task, index) => renderTask(task, index))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={handleAddTask}
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
  tasksContainer: {
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
  taskContentWrapper: {
    flex: 1,
    paddingTop: 4,
  },
  taskCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
  completedTask: {
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
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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

export default TasksScreen;
