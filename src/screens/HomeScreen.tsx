import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  StatusBar,
  FlatList,
  Image,
  Modal,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { RootState } from '../store';
import { RootStackParamList } from '../types';
import MenuSidebar from '../components/MenuSidebar';
import VoiceAssistant from '../components/VoiceAssistant';
import ConnectionDebugger from '../components/ConnectionDebugger';
import ConnectionManager from '../services/connectionManager';
import ApiService from '../services/api';
import { setUser } from '../store/slices/userSlice';

const { width, height } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();

  // Load fresh user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await ApiService.getProfile();
      console.log('🏠 HomeScreen - Refreshed user profile:', {
        assistantName: profile.assistantName,
        assistantProfileImage: profile.assistantProfileImage,
        name: profile.name,
        preferredName: profile.preferredName
      });
      dispatch(setUser(profile));
    } catch (error: any) {
      console.error('Failed to load user profile in HomeScreen:', error);
    }
  };

  // Debug logging for user data
  useEffect(() => {
    console.log('🏠 HomeScreen - User data:', {
      assistantName: user?.assistantName,
      assistantProfileImage: user?.assistantProfileImage,
      name: user?.name,
      preferredName: user?.preferredName,
      fullName: user?.fullName,
      email: user?.email,
      hasData: !!user
    });
  }, [user]);

  // Generate greeting info
  const greetingInfo = (() => {
    const hour = new Date().getHours();
    const userPreferredName = user?.preferredName || user?.name || 'Boss';
    const assistantName = user?.assistantName || 'Yo!';

    let timeGreeting = '';
    if (hour >= 0 && hour < 5) {
      timeGreeting = 'Good Night';
    } else if (hour >= 5 && hour < 12) {
      timeGreeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeGreeting = 'Good Evening';
    } else {
      timeGreeting = 'Good Night';
    }

    return {
      assistantName,
      timeGreeting,
      userPreferredName
    };
  })();

  // State for real data
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch tasks and events from backend
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, eventsData] = await Promise.all([
        ApiService.getTasks(),
        ApiService.getEvents()
      ]);
      setTasks(tasksData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to fetch tasks and events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };


  const [activeTab, setActiveTab] = useState('today');
  const [scrollY] = useState(new Animated.Value(0));
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showMenuSidebar, setShowMenuSidebar] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Pan responder for swipe down to close
  const modalTranslateY = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 0 && gestureState.vy > 0.5;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        modalTranslateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100 || gestureState.vy > 0.8) {
        // Close modal
        Animated.timing(modalTranslateY, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setShowAddMenu(false);
          modalTranslateY.setValue(0);
        });
      } else {
        // Snap back
        Animated.spring(modalTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Integration options
  const integrations = [
    { id: 'gmail', label: 'Gmail', icon: 'mail-outline', color: '#EA4335', connected: true },
    { id: 'outlook', label: 'Outlook', icon: 'mail', color: '#0078D4', connected: false },
    { id: 'yahoo', label: 'Yahoo', icon: 'mail-open-outline', color: '#6001D2', connected: false },
    { id: 'google-calendar', label: 'Google Calendar', icon: 'calendar-outline', color: '#FFFFFF', connected: true },
    { id: 'calendly', label: 'Calendly', icon: 'calendar', color: '#006BFF', connected: false },
    { id: 'zoom', label: 'Zoom', icon: 'videocam-outline', color: '#2D8CFF', connected: true },
    { id: 'slack', label: 'Slack', icon: 'chatbubbles-outline', color: '#4A154B', connected: false },
    { id: 'teams', label: 'Teams', icon: 'people-outline', color: '#6264A7', connected: false },
    { id: 'notion', label: 'Notion', icon: 'document-text-outline', color: '#000000', connected: false },
    { id: 'trello', label: 'Trello', icon: 'grid-outline', color: '#0079BF', connected: true },
  ];

  // Advanced Tab options with data
  const getTabData = () => {
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdAt);
      const today = new Date();
      taskDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime() && task.status !== 'completed';
    });

    const reminderTasks = tasks.filter(task =>
      task.reminders && task.reminders.length > 0 && task.status !== 'completed'
    );

    const upcomingItems = [...tasks, ...events].filter(item => {
      if ('startTime' in item) {
        return new Date(item.startTime) > new Date();
      }
      return item.status !== 'completed';
    });

    return [
      {
        id: 'today',
        label: 'Today',
        subtitle: 'Active Tasks',
        icon: 'today-outline',
        count: todayTasks.length,
        gradient: ['#FFFFFF', '#0099CC'],
        status: todayTasks.length > 0 ? 'active' : 'completed'
      },
      {
        id: 'reminders',
        label: 'Reminders',
        subtitle: 'Notifications',
        icon: 'notifications-outline',
        count: reminderTasks.length,
        gradient: ['#FF4757', '#FF6B7A'],
        status: reminderTasks.length > 0 ? 'pending' : 'clear'
      },
      {
        id: 'upcoming',
        label: 'Upcoming',
        subtitle: 'Events & Tasks',
        icon: 'calendar-outline',
        count: upcomingItems.length,
        gradient: ['#00D84A', '#2ED573'],
        status: upcomingItems.length > 0 ? 'scheduled' : 'free'
      },
    ];
  };

  const tabs = getTabData();


  // Filter tasks based on active tab
  const getFilteredData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let filteredItems = [];

    switch (activeTab) {
      case 'today':
        filteredItems = tasks.filter(task => {
          const taskDate = new Date(task.createdAt);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime() && task.status !== 'completed';
        });
        // Sort by creation time (earliest first)
        filteredItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;

      case 'reminders':
        filteredItems = tasks.filter(task =>
          task.reminders && task.reminders.length > 0 && task.status !== 'completed'
        );
        // Sort by next reminder time
        filteredItems.sort((a, b) => {
          const nextReminderA = Math.min(...a.reminders.map(r => new Date(r).getTime()));
          const nextReminderB = Math.min(...b.reminders.map(r => new Date(r).getTime()));
          return nextReminderA - nextReminderB;
        });
        break;

      case 'upcoming':
        filteredItems = [...tasks, ...events]
          .filter(item => {
            if ('startTime' in item) {
              return new Date(item.startTime) > new Date();
            }
            return item.status !== 'completed' && new Date(item.dueDate || item.createdAt) > new Date();
          });
        // Sort by occurrence time (startTime for events, dueDate for tasks)
        filteredItems.sort((a, b) => {
          const dateA = 'startTime' in a ? new Date(a.startTime) : new Date(a.dueDate || a.createdAt);
          const dateB = 'startTime' in b ? new Date(b.startTime) : new Date(b.dueDate || b.createdAt);
          return dateA.getTime() - dateB.getTime();
        });
        break;

      default:
        filteredItems = tasks;
    }

    return filteredItems;
  };

  const handleAddTask = () => {
    setShowAddMenu(true);
  };

  const handleAddTaskType = (type: string) => {
    setShowAddMenu(false);

    switch (type) {
      case 'task':
        navigation.navigate('AddTask');
        break;
      case 'reminder':
        navigation.navigate('AddReminder');
        break;
      case 'event':
        navigation.navigate('AddEvent');
        break;
      case 'note':
        navigation.navigate('QuickNote');
        break;
      default:
        console.log('Unknown type:', type);
    }
  };

  // Calculate time urgency for color coding
  const getTimeUrgency = (scheduledTime: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffMinutes = (scheduled.getTime() - now.getTime()) / (1000 * 60);

    if (diffMinutes <= 5) return 'critical'; // Red - 5 minutes or less
    if (diffMinutes <= 15) return 'urgent';  // Orange - 15 minutes or less
    if (diffMinutes <= 60) return 'soon';    // Yellow - 1 hour or less
    return 'normal'; // Default color
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#FF4757'; // Red
      case 'urgent': return '#FFA502';   // Orange
      case 'soon': return '#F39C12';     // Yellow
      default: return '#FFFFFF';         // Blue
    }
  };

  const handleTaskCompletion = (taskId: string) => {
    setCompletedTasks(prev => [...prev, taskId]);
    console.log('Task completed:', taskId);
    // In real app: API call to update task status, trigger assistant notification
  };

  const handleTaskAction = (task: any) => {
    setSelectedTask(task);
    setShowActionMenu(true);
  };

  const handleActionMenuClose = () => {
    setShowActionMenu(false);
    setSelectedTask(null);
  };

  const handleEdit = () => {
    console.log('Edit task:', selectedTask?.title);
    handleActionMenuClose();
    // In real app: Navigate to edit screen
  };

  const handleReschedule = () => {
    console.log('Reschedule task:', selectedTask?.title);
    handleActionMenuClose();
    // In real app: Show reschedule modal
  };

  const handleDelete = () => {
    console.log('Delete task:', selectedTask?.title);
    handleActionMenuClose();
    // In real app: Show confirmation and delete
  };

  const handleViewDetails = () => {
    console.log('View details:', selectedTask?.title);
    handleActionMenuClose();
    // In real app: Navigate to details screen
  };

  const renderTaskItem = ({ item, index }) => {
    const isEvent = 'startTime' in item;
    const isCompleted = completedTasks.includes(item.id);
    const isToday = activeTab === 'today';

    // Time display logic
    let timeDisplay = '';
    let urgency = 'normal';
    let urgencyColor = '#FFFFFF';

    if (isEvent) {
      const startTime = new Date(item.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const endTime = new Date(item.endTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      timeDisplay = `${startTime} - ${endTime}${item.location ? ` • ${item.location}` : ''}`;
    } else if (isToday && item.scheduledTime) {
      const scheduledTime = new Date(item.scheduledTime);
      const timeStr = scheduledTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      timeDisplay = `${timeStr} • ${item.duration}min`;
      urgency = getTimeUrgency(item.scheduledTime);
      urgencyColor = getUrgencyColor(urgency);
    } else if (item.dueDate) {
      timeDisplay = `Due: ${new Date(item.dueDate).toLocaleDateString()}`;
    }

    return (
      <View style={styles.taskListItem}>
        <View style={styles.taskListContent}>
          <TouchableOpacity
            style={styles.checkmarkContainer}
            onPress={() => !isEvent && handleTaskCompletion(item.id)}
            activeOpacity={isEvent ? 1 : 0.6}
          >
            <View style={[
              styles.checkmarkCircle,
              isEvent && styles.eventIndicator,
              isCompleted && styles.completedCheckmark
            ]}>
              {isEvent ? (
                <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
              ) : isCompleted ? (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color="rgba(255, 255, 255, 0.3)"
                />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.taskContent}>
            <Text style={[
              styles.taskTitle,
              isCompleted && styles.completedTaskTitle
            ]} numberOfLines={2}>
              {item.title}
              {isEvent && <Text style={styles.eventBadge}> EVENT</Text>}
            </Text>
            {item.description && (
              <Text style={[
                styles.taskDescription,
                isCompleted && styles.completedTaskDescription
              ]} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <View style={styles.taskMeta}>
              {!isEvent && item.priority && !isToday && (
                <Text style={styles.taskPriority}>
                  {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} priority
                </Text>
              )}
              {timeDisplay && (
                <Text style={[
                  styles.taskDueDate,
                  isEvent && styles.eventTime,
                  isToday && !isEvent && { color: urgencyColor },
                  isCompleted && styles.completedTime
                ]}>
                  {timeDisplay}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.taskActionButton}
            onPress={() => handleTaskAction(item)}
            activeOpacity={0.6}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>
        <View style={styles.taskDivider} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

      {/* Blue-Black Theme Background */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />

      {/* White Dots Pattern Overlay */}
      <View style={styles.patternOverlay} pointerEvents="none">
        <View style={styles.dotRow1}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow2}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow3}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow4}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow5}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow6}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow7}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow8}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow9}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow10}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow11}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <View style={styles.dotRow12}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>


      {/* Compact Header */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerContent}>
          {/* Menu Icon */}
          <TouchableOpacity
            style={styles.menuButton}
            activeOpacity={0.6}
            onPress={() => setShowMenuSidebar(true)}
          >
            <Ionicons name="menu-outline" size={24} color="rgba(255, 255, 255, 0.9)" />
          </TouchableOpacity>

          {/* Avatar and Greeting */}
          <TouchableOpacity
            style={styles.centerSection}
            onPress={() => navigation.navigate('AIAssistant')}
            activeOpacity={0.8}
          >
            {user?.assistantProfileImage ? (
              <Image
                source={{ uri: user.assistantProfileImage }}
                style={styles.headerAvatar}
              />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: '#3396D3', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={22} color="white" />
              </View>
            )}
            <View style={styles.greetingText}>
              <Text style={styles.bossText}>{greetingInfo.timeGreeting}</Text>
              <Text style={styles.brandText}>{greetingInfo.userPreferredName}</Text>
            </View>
          </TouchableOpacity>

          {/* Notification Icon */}
          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.6}
            onPress={() => navigation.navigate('NotificationFeed')}
          >
            <Ionicons name="notifications-outline" size={22} color="rgba(255, 255, 255, 0.9)" />
            <View style={styles.badgeIndicator}>
              <Text style={styles.badgeNumber}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content without SafeAreaView gap */}
      <View style={styles.contentArea}>

        {/* Integrations Section */}
        <View style={styles.integrationsContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Integrations</Text>
            <View style={styles.titleDivider} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.integrationsScrollContent}
          >
            {integrations.filter(integration => integration.connected).map((integration) => (
              <TouchableOpacity
                key={integration.id}
                style={styles.integrationItem}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.integrationIconContainer,
                  { backgroundColor: integration.connected ? `${integration.color}15` : 'rgba(255, 255, 255, 0.05)' },
                  { borderColor: integration.connected ? integration.color : 'rgba(255, 255, 255, 0.1)' }
                ]}>
                  <Ionicons
                    name={integration.icon as any}
                    size={20}
                    color={integration.connected ? integration.color : 'rgba(255, 255, 255, 0.4)'}
                  />
                  {integration.connected && (
                    <View style={styles.connectedIndicator}>
                      <Ionicons name="checkmark-circle" size={12} color="#00D84A" />
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.integrationLabel,
                  { color: integration.connected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)' }
                ]}>
                  {integration.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Integrations Divider */}
        <View style={styles.sectionDivider} />

        {/* Compact Tab Navigation */}
        <View style={styles.compactTabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.compactTabScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.compactTab,
                    isActive && { backgroundColor: `${tab.gradient[0]}20` },
                    isActive && { borderColor: tab.gradient[0] }
                  ]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.compactTabContent}>
                    <Ionicons
                      name={tab.icon as any}
                      size={16}
                      color={isActive ? tab.gradient[0] : 'rgba(255, 255, 255, 0.6)'}
                    />
                    <Text style={[
                      styles.compactTabLabel,
                      { color: isActive ? tab.gradient[0] : 'rgba(255, 255, 255, 0.7)' }
                    ]}>
                      {tab.label}
                    </Text>
                    {tab.count > 0 && (
                      <View style={[
                        styles.compactTabBadge,
                        { backgroundColor: isActive ? tab.gradient[0] : 'rgba(255, 255, 255, 0.3)' }
                      ]}>
                        <Text style={[
                          styles.compactTabBadgeText,
                          { color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)' }
                        ]}>
                          {tab.count}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3396D3" />
              <Text style={styles.loadingText}>Loading your tasks...</Text>
            </View>
          ) : (
            <FlatList
              data={getFilteredData()}
              renderItem={renderTaskItem}
              keyExtractor={(item, index) => `${item.id || index}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={() => (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-done-circle-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.emptyStateText}>
                    {activeTab === 'today' ? 'No tasks for today' :
                     activeTab === 'reminders' ? 'No reminders set' :
                     'Nothing upcoming'}
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Tap the + button to add a new {activeTab === 'reminders' ? 'reminder' : 'task'}
                  </Text>
                </View>
              )}
            />
          )}
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity style={styles.fab} onPress={handleAddTask}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={handleActionMenuClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleActionMenuClose}
        >
          <View style={styles.actionMenu}>
            <View style={styles.actionMenuHeader}>
              <Text style={styles.actionMenuTitle} numberOfLines={1}>
                {selectedTask?.title || 'Task Actions'}
              </Text>
            </View>

            <TouchableOpacity style={styles.actionMenuItem} onPress={handleViewDetails}>
              <Ionicons name="eye-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionMenuItemText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionMenuItem} onPress={handleEdit}>
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionMenuItemText}>Edit</Text>
            </TouchableOpacity>

            {selectedTask?.scheduledTime && (
              <TouchableOpacity style={styles.actionMenuItem} onPress={handleReschedule}>
                <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                <Text style={[styles.actionMenuItemText, { color: '#FFFFFF' }]}>Reschedule</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actionMenuDivider} />

            <TouchableOpacity style={[styles.actionMenuItem, styles.deleteAction]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#FF4757" />
              <Text style={[styles.actionMenuItemText, { color: '#FF4757' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Menu Modal */}
      <Modal
        visible={showAddMenu}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddMenu(false)}
      >
        <View style={styles.addModalContainer}>
          <TouchableOpacity
            style={styles.addModalOverlay}
            activeOpacity={1}
            onPress={() => setShowAddMenu(false)}
          />
          <Animated.View
            style={[
              styles.addMenu,
              { transform: [{ translateY: modalTranslateY }] }
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.addMenuHandle} />
            <View style={styles.addMenuHeader}>
              <Text style={styles.addMenuTitle}>Add New</Text>
            </View>

            <TouchableOpacity
              style={styles.addMenuItem}
              onPress={() => handleAddTaskType('task')}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
              <View style={styles.addMenuItemContent}>
                <Text style={styles.addMenuItemText}>Task</Text>
                <Text style={styles.addMenuItemSubtext}>Create a new task</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addMenuItem}
              onPress={() => handleAddTaskType('reminder')}
            >
              <Ionicons name="alarm-outline" size={24} color="#FF4757" />
              <View style={styles.addMenuItemContent}>
                <Text style={styles.addMenuItemText}>Reminder</Text>
                <Text style={styles.addMenuItemSubtext}>Set a reminder</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addMenuItem}
              onPress={() => handleAddTaskType('event')}
            >
              <Ionicons name="calendar-outline" size={24} color="#10B981" />
              <View style={styles.addMenuItemContent}>
                <Text style={styles.addMenuItemText}>Event</Text>
                <Text style={styles.addMenuItemSubtext}>Schedule an event</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addMenuItem}
              onPress={() => handleAddTaskType('note')}
            >
              <Ionicons name="document-text-outline" size={24} color="#F59E0B" />
              <View style={styles.addMenuItemContent}>
                <Text style={styles.addMenuItemText}>Quick Note</Text>
                <Text style={styles.addMenuItemSubtext}>Capture thoughts</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Menu Sidebar */}
      <MenuSidebar
        visible={showMenuSidebar}
        onClose={() => setShowMenuSidebar(false)}
      />

      {/* Voice Assistant */}
      <VoiceAssistant
        visible={showVoiceAssistant}
        onClose={() => setShowVoiceAssistant(false)}
        onNavigate={(screen) => {
          // Type-safe navigation based on known screen names
          const validScreens = ['EmailManagement', 'MeetingPrep', 'DailyBriefing', 'Tasks', 'FinancialDashboard', 'TeamManagement', 'DocumentIntelligence', 'SmartSearch', 'Analytics', 'Profile'] as const;
          if (validScreens.includes(screen as any)) {
            navigation.navigate(screen as keyof RootStackParamList);
          }
          setShowVoiceAssistant(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },

  // Background Design
  gradientFlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 1,
  },

  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    opacity: 0.15,
    paddingTop: 40,
    paddingBottom: 40,
  },

  // White Dot Pattern Styles
  dotRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 50,
  },

  dotRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 45,
    marginBottom: 50,
  },

  dotRow3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 35,
    marginBottom: 50,
  },

  dotRow4: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginBottom: 50,
  },

  dotRow5: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 50,
    marginBottom: 50,
  },

  dotRow6: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    marginBottom: 50,
  },

  dotRow7: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 42,
    marginBottom: 50,
  },

  dotRow8: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 38,
    marginBottom: 50,
  },

  dotRow9: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 33,
    marginBottom: 50,
  },

  dotRow10: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 47,
    marginBottom: 50,
  },

  dotRow11: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    marginBottom: 50,
  },

  dotRow12: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 44,
    marginBottom: 20,
  },

  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  contentArea: {
    flex: 1,
    zIndex: 2,
  },

  // Compact Header Design
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 44, // Status bar height
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 60,
  },

  menuButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },


  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  greetingText: {
    alignItems: 'flex-start',
  },

  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 20,
  },

  bossText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
    lineHeight: 15,
  },

  notificationButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },


  badgeIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },

  badgeNumber: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Content spacing for fixed header
  contentWithHeader: {
    paddingTop: 100, // Reduced significantly to close gap
  },

  // Dividers
  headerDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 20,
  },

  sectionDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: 20,
    marginVertical: 4,
  },

  // Integrations Section
  integrationsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingBottom: 12,
    marginTop: 97, // Start right after header
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 12,
  },

  titleDivider: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  integrationsScrollContent: {
    paddingHorizontal: 20,
  },

  integrationItem: {
    alignItems: 'center',
    marginHorizontal: 4,
    width: 70,
  },

  integrationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    position: 'relative',
  },

  connectedIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#000000',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  integrationLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },

  // Compact Tab Navigation
  compactTabContainer: {
    backgroundColor: '#000000',
    paddingVertical: 8,
  },

  compactTabScrollContent: {
    paddingHorizontal: 20,
  },

  compactTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 80,
  },

  compactTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  compactTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.2,
  },

  compactTabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 4,
  },

  compactTabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingBottom: 100,
  },
  taskListItem: {
    backgroundColor: 'transparent',
  },
  taskListContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  taskDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 50,
    marginRight: 24,
  },
  checkmarkContainer: {
    paddingTop: 2,
    marginRight: 15,
  },
  checkmarkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventIndicator: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
  },
  completedCheckmark: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 22,
  },
  eventBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3396D3',
    letterSpacing: 0.5,
  },
  taskDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskPriority: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  eventTime: {
    color: '#00D84A',
    fontWeight: '600',
  },
  completedTaskTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'line-through',
  },
  completedTaskDescription: {
    color: 'rgba(255, 255, 255, 0.3)',
    textDecorationLine: 'line-through',
  },
  completedTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    textDecorationLine: 'line-through',
  },
  taskActionButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 140,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#1A1A1D',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 75,
    zIndex: 75,
  },
  fabIcon: {
    fontSize: 20,
    fontWeight: '200',
    color: '#FFFFFF',
    lineHeight: 20,
  },

  // Action Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  actionMenu: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 16,
    minWidth: 250,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  actionMenuHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  actionMenuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  actionMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
  },

  actionMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },

  deleteAction: {
    marginTop: 4,
  },

  // Add Menu Modal - Bottom Slide Up
  addModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 50,
  },

  addModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  addMenu: {
    backgroundColor: 'rgba(20, 20, 20, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    minHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 50,
    zIndex: 50,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
  },

  addMenuHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },

  addMenuHeader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },

  addMenuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },

  addMenuItemContent: {
    flex: 1,
    marginLeft: 16,
  },

  addMenuItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 2,
  },

  addMenuItemSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 16,
  },

});

export default HomeScreen;