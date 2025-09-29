import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';

const TasksScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const tasks = useSelector((state: RootState) => state.task.tasks);
  const user = useSelector((state: RootState) => state.user.user);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Enhanced mock tasks with more details
  const mockTasks = [
    {
      id: '1',
      title: 'Quarterly Business Review Preparation',
      description: 'Compile Q3 performance metrics and prepare presentation materials for board meeting',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2025-09-28',
      category: 'Business',
      progress: 75,
      estimatedTime: '2 hours',
      createdBy: 'ai_suggestion'
    },
    {
      id: '2',
      title: 'Review Investment Portfolio',
      description: 'Monthly review of investment performance and rebalancing recommendations',
      priority: 'high',
      status: 'pending',
      dueDate: '2025-09-26',
      category: 'Finance',
      progress: 0,
      estimatedTime: '45 mins',
      createdBy: 'user'
    },
    {
      id: '3',
      title: 'Team Performance Reviews',
      description: 'Complete mid-year performance evaluations for direct reports',
      priority: 'medium',
      status: 'pending',
      dueDate: '2025-09-30',
      category: 'Management',
      progress: 30,
      estimatedTime: '3 hours',
      createdBy: 'user'
    },
    {
      id: '4',
      title: 'Strategic Planning Session',
      description: 'Prepare agenda and materials for Q4 strategic planning workshop',
      priority: 'medium',
      status: 'completed',
      dueDate: '2025-09-25',
      category: 'Strategy',
      progress: 100,
      estimatedTime: '1.5 hours',
      createdBy: 'ai_suggestion'
    },
    {
      id: '5',
      title: 'Client Relationship Review',
      description: 'Quarterly check-in with top 5 clients to discuss satisfaction and growth opportunities',
      priority: 'high',
      status: 'pending',
      dueDate: '2025-09-27',
      category: 'Client Relations',
      progress: 0,
      estimatedTime: '2.5 hours',
      createdBy: 'ai_suggestion'
    },
    {
      id: '6',
      title: 'Technology Infrastructure Audit',
      description: 'Review current IT systems and identify upgrade requirements',
      priority: 'low',
      status: 'pending',
      dueDate: '2025-10-05',
      category: 'Technology',
      progress: 15,
      estimatedTime: '1 hour',
      createdBy: 'user'
    },
    {
      id: '7',
      title: 'Expense Report Submission',
      description: 'Submit monthly expense reports for business travel and entertainment',
      priority: 'medium',
      status: 'completed',
      dueDate: '2025-09-24',
      category: 'Finance',
      progress: 100,
      estimatedTime: '20 mins',
      createdBy: 'user'
    }
  ];

  const displayTasks = tasks.length > 0 ? tasks : mockTasks;

  const filters = [
    { key: 'all', label: 'All Tasks', count: displayTasks.length },
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
      case 'in_progress': return '#FFFFFF';
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

  const renderTask = ({ item, index }: { item: any; index: number }) => {
    const isOverdue = new Date(item.dueDate) < new Date() && item.status !== 'completed';

    return (
      <TouchableOpacity
        style={[
          styles.taskCard,
          { backgroundColor: theme.surface }
        ]}
        onPress={() => console.log('Task pressed:', item.id)}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskLeft}>
            <View style={[
              styles.priorityIndicator,
              { backgroundColor: getPriorityColor(item.priority) }
            ]} />
            <View style={styles.taskInfo}>
              <Text style={[
                styles.taskTitle,
                { color: theme.text },
                item.status === 'completed' && styles.completedTask,
              ]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.taskDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={20}
              color={getStatusColor(item.status)}
            />
          </View>
        </View>

        <View style={styles.taskDetails}>
          <View style={styles.taskMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {item.estimatedTime}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={isOverdue ? '#EF4444' : theme.textSecondary} />
              <Text style={[
                styles.metaText,
                { color: isOverdue ? '#EF4444' : theme.textSecondary }
              ]}>
                {formatDueDate(item.dueDate)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="folder-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                {item.category}
              </Text>
            </View>
          </View>

          {item.status !== 'completed' && item.progress > 0 && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View style={[
                  styles.progressFill,
                  {
                    width: `${item.progress}%`,
                    backgroundColor: item.status === 'in_progress' ? '#FFFFFF' : getPriorityColor(item.priority)
                  }
                ]} />
              </View>
              <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                {item.progress}%
              </Text>
            </View>
          )}

          {item.createdBy === 'ai_suggestion' && (
            <View style={styles.aiTag}>
              <Ionicons name="sparkles" size={12} color="#FFFFFF" />
              <Text style={[styles.aiTagText, { color: '#FFFFFF' }]}>
                AI Suggested
              </Text>
            </View>
          )}
        </View>

        {filteredTasks.length > 1 && index < filteredTasks.length - 1 && (
          <View style={[styles.taskDivider, { backgroundColor: theme.border }]} />
        )}
      </TouchableOpacity>
    );
  };

  const pendingCount = filteredTasks.filter(t => t.status === 'pending').length;
  const inProgressCount = filteredTasks.filter(t => t.status === 'in_progress').length;
  const completedCount = filteredTasks.filter(t => t.status === 'completed').length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Tasks</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>{inProgressCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{completedCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              { backgroundColor: theme.surface },
              selectedFilter === filter.key && { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text style={[
              styles.filterText,
              { color: selectedFilter === filter.key ? 'white' : theme.text }
            ]}>
              {filter.label}
            </Text>
            {filter.count > 0 && (
              <View style={[
                styles.filterBadge,
                { backgroundColor: selectedFilter === filter.key ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF' }
              ]}>
                <Text style={[
                  styles.filterBadgeText,
                  { color: 'white' }
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
        style={styles.tasksList}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Tasks Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              {selectedFilter === 'all' ? 'All tasks completed!' : `No ${selectedFilter} tasks`}
            </Text>
          </View>
        ) : (
          <View style={styles.tasksContainer}>
            {filteredTasks.map((task, index) => (
              <View key={task.id}>
                {renderTask({ item: task, index })}
              </View>
            ))}
          </View>
        )}

        {/* AI Insights */}
        <View style={styles.insightsSection}>
          <Text style={[styles.insightsTitle, { color: theme.text }]}>
            Productivity Insights from {user?.assistantName || 'Yo!'}
          </Text>

          <TouchableOpacity style={styles.insightItem}>
            <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              You have 3 high-priority tasks due this week. Consider tackling the investment review first.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.insightItem}>
            <Ionicons name="trending-up-outline" size={20} color="#10B981" />
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              Great progress! You've completed 67% more tasks this month compared to last month.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.insightItem}>
            <Ionicons name="time-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              Your most productive time is 9-11 AM. Schedule complex tasks during this window.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  filterBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tasksList: {
    flex: 1,
  },
  tasksContainer: {
    paddingHorizontal: 0,
  },
  taskCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  taskDivider: {
    height: 0.5,
    marginLeft: 44,
    marginRight: 20,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  priorityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 16,
    marginTop: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 6,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  statusContainer: {
    marginLeft: 12,
  },
  taskDetails: {
    marginLeft: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 32,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(21, 183, 232, 0.1)',
    borderRadius: 12,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  insightsSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 18,
  },
});

export default TasksScreen;