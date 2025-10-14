import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const MOCK_WIDTH = width - 96; // Smaller to look like a phone screen

// Mock Push Notification Screen with animations
export const MockNotificationScreen: React.FC = () => {
  const [showPushNotif, setShowPushNotif] = useState(false);
  const pushSlideAnim = useRef(new Animated.Value(-100)).current;
  const notification1Anim = useRef(new Animated.Value(0)).current;
  const notification2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Show push notification at top
    const timer1 = setTimeout(() => {
      setShowPushNotif(true);
      Animated.sequence([
        Animated.spring(pushSlideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.delay(2000),
        Animated.timing(pushSlideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowPushNotif(false));
    }, 1000);

    // Pulse animations for notification cards
    const pulseNotification = (anim: Animated.Value, delay: number) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, delay);
    };

    pulseNotification(notification1Anim, 500);
    pulseNotification(notification2Anim, 1500);

    return () => clearTimeout(timer1);
  }, []);

  const notification1Scale = notification1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const notification2Scale = notification2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <View style={styles.mockContainer}>
      <View style={styles.mockHeader}>
        <View style={styles.mockProfile}>
          <View style={styles.mockAvatar} />
          <View>
            <Text style={styles.mockName}>Yo!</Text>
            <Text style={styles.mockRole}>Boss</Text>
          </View>
        </View>
        <Ionicons name="notifications" size={20} color="#3396D3" />
      </View>

      {/* Push notification at top */}
      {showPushNotif && (
        <Animated.View
          style={[
            styles.mockPushNotification,
            { transform: [{ translateY: pushSlideAnim }] }
          ]}
        >
          <Ionicons name="time" size={14} color="#FFB800" />
          <Text style={styles.mockPushText}>Meeting starts in 5 min!</Text>
        </Animated.View>
      )}

      <Text style={styles.mockSectionTitle}>Today's Notifications</Text>

      <Animated.View style={[styles.mockNotificationCard, { transform: [{ scale: notification1Scale }] }]}>
        <View style={styles.mockNotificationHeader}>
          <Ionicons name="call" size={18} color="#3396D3" />
          <Text style={styles.mockNotificationTime}>2 min ago</Text>
        </View>
        <Text style={styles.mockNotificationTitle}>Boss, time to call your wife!</Text>
        <Text style={styles.mockNotificationBody}>You mentioned calling her before 3 PM. It's 2:45 PM now.</Text>
        <View style={styles.mockNotificationActions}>
          <View style={styles.mockActionButton}>
            <Text style={styles.mockActionText}>Call Now</Text>
          </View>
          <View style={[styles.mockActionButton, styles.mockActionSecondary]}>
            <Text style={styles.mockActionTextSecondary}>Snooze</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.mockNotificationCard, { transform: [{ scale: notification2Scale }] }]}>
        <View style={styles.mockNotificationHeader}>
          <Ionicons name="car" size={18} color="#FF6B6B" />
          <Text style={styles.mockNotificationTime}>5 min ago</Text>
        </View>
        <Text style={styles.mockNotificationTitle}>Traffic Alert!</Text>
        <Text style={styles.mockNotificationBody}>Heavy traffic on your route home. Consider leaving 15 minutes early.</Text>
        {/* Mini traffic map */}
        <View style={styles.mockMiniMap}>
          <View style={styles.mockMapRoad}>
            <View style={styles.mockTrafficRed} />
            <View style={styles.mockTrafficYellow} />
            <View style={styles.mockTrafficGreen} />
          </View>
          <Text style={styles.mockMapText}>Your Route • +25 min delay</Text>
        </View>
      </Animated.View>

      <View style={styles.mockNotificationCard}>
        <View style={styles.mockNotificationHeader}>
          <Ionicons name="time" size={18} color="#FFB800" />
          <Text style={styles.mockNotificationTime}>10 min ago</Text>
        </View>
        <Text style={styles.mockNotificationTitle}>Meeting in 15 minutes</Text>
        <Text style={styles.mockNotificationBody}>Team sync starts at 3:00 PM. Zoom link ready.</Text>
      </View>
    </View>
  );
};

// Mock AI Assistant Suggestions Screen with typing animation
export const MockAISuggestionsScreen: React.FC = () => {
  const [typingText, setTypingText] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const fullText = "Boss, I'm analyzing your schedule...";
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Typing animation
    setShowTyping(true);
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setTypingText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => setShowTyping(false), 1000);
      }
    }, 50);

    // Sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slide in animations for cards
    setTimeout(() => {
      Animated.spring(card1Anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }, 1500);

    setTimeout(() => {
      Animated.spring(card2Anim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }, 2000);

    return () => clearInterval(typingInterval);
  }, []);

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const card1TranslateX = card1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 0],
  });

  const card2TranslateX = card2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <View style={styles.mockContainer}>
      <View style={styles.mockHeader}>
        <View style={styles.mockProfile}>
          <View style={styles.mockAvatar} />
          <View>
            <Text style={styles.mockName}>Yo!</Text>
            <Text style={styles.mockRole}>Boss</Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: sparkleRotate }] }}>
          <Ionicons name="sparkles" size={20} color="#FFB800" />
        </Animated.View>
      </View>

      <Text style={styles.mockSectionTitle}>AI Suggestions for You</Text>

      {/* Typing indicator */}
      {showTyping && (
        <View style={styles.mockTypingIndicator}>
          <Text style={styles.mockTypingText}>{typingText}</Text>
          <View style={styles.mockCursor} />
        </View>
      )}

      <Animated.View style={[styles.mockSuggestionCard, { transform: [{ translateX: card1TranslateX }] }]}>
        <View style={styles.mockSuggestionIcon}>
          <Ionicons name="airplane" size={16} color="#3396D3" />
        </View>
        <View style={styles.mockSuggestionContent}>
          <Text style={styles.mockSuggestionTitle}>Cheap Flight Found!</Text>
          <Text style={styles.mockSuggestionBody}>Boss, I found a $240 flight to NYC next week. 40% cheaper than usual.</Text>
          <View style={styles.mockSuggestionAction}>
            <Text style={styles.mockSuggestionLink}>View Details →</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.mockSuggestionCard, { transform: [{ translateX: card2TranslateX }] }]}>
        <View style={[styles.mockSuggestionIcon, { backgroundColor: 'rgba(76, 203, 113, 0.15)' }]}>
          <Ionicons name="calendar" size={16} color="#4ECB71" />
        </View>
        <View style={styles.mockSuggestionContent}>
          <Text style={styles.mockSuggestionTitle}>Schedule Optimization</Text>
          <Text style={styles.mockSuggestionBody}>You have 2 hours free tomorrow. Want me to schedule gym time?</Text>
          <View style={styles.mockSuggestionActions}>
            <View style={styles.mockSmallButton}>
              <Text style={styles.mockSmallButtonText}>Yes</Text>
            </View>
            <View style={[styles.mockSmallButton, styles.mockSmallButtonSecondary]}>
              <Text style={styles.mockSmallButtonTextSecondary}>No</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <View style={styles.mockSuggestionCard}>
        <View style={[styles.mockSuggestionIcon, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
          <Ionicons name="heart" size={16} color="#FF6B6B" />
        </View>
        <View style={styles.mockSuggestionContent}>
          <Text style={styles.mockSuggestionTitle}>Anniversary Reminder</Text>
          <Text style={styles.mockSuggestionBody}>Your wife's birthday is in 5 days. Should I help you find a gift?</Text>
        </View>
      </View>
    </View>
  );
};

// Mock Tasks Screen with dynamic task completion
export const MockTasksScreen: React.FC = () => {
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [currentTask, setCurrentTask] = useState(0);
  const statsAnim = useRef(new Animated.Value(0)).current;

  // Individual animations for each task
  const task0CheckAnim = useRef(new Animated.Value(0)).current;
  const task0SlideAnim = useRef(new Animated.Value(0)).current;
  const task1CheckAnim = useRef(new Animated.Value(0)).current;
  const task1SlideAnim = useRef(new Animated.Value(0)).current;
  const task2CheckAnim = useRef(new Animated.Value(0)).current;
  const task2SlideAnim = useRef(new Animated.Value(0)).current;
  const task3CheckAnim = useRef(new Animated.Value(0)).current;
  const task3SlideAnim = useRef(new Animated.Value(0)).current;
  const task4CheckAnim = useRef(new Animated.Value(0)).current;
  const task4SlideAnim = useRef(new Animated.Value(0)).current;

  const tasks = [
    { title: 'Morning standup meeting', time: '9:00 AM', priority: '#3396D3', checkAnim: task0CheckAnim, slideAnim: task0SlideAnim },
    { title: 'Call dentist for appointment', time: '10:00 AM', priority: '#FF6B6B', checkAnim: task1CheckAnim, slideAnim: task1SlideAnim },
    { title: 'Review budget proposal', time: '11:30 AM', priority: '#FFB800', checkAnim: task2CheckAnim, slideAnim: task2SlideAnim },
    { title: 'Lunch with client', time: '12:30 PM', priority: '#4ECB71', checkAnim: task3CheckAnim, slideAnim: task3SlideAnim },
    { title: 'Prepare presentation slides', time: '2:00 PM', priority: '#FFB800', checkAnim: task4CheckAnim, slideAnim: task4SlideAnim },
  ];

  useEffect(() => {
    // Animate stats counting up
    Animated.timing(statsAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Sequentially complete tasks
    const completeTask = (taskIndex: number) => {
      const task = tasks[taskIndex];
      if (!task) return;

      setTimeout(() => {
        setCompletedTasks(prev => [...prev, taskIndex]);

        // Check animation
        Animated.sequence([
          Animated.spring(task.checkAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 5,
          }),
          Animated.delay(500),
          // Slide up and fade out
          Animated.parallel([
            Animated.timing(task.slideAnim, {
              toValue: -100,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          // Move to next task
          setCurrentTask(taskIndex + 1);
          if (taskIndex < tasks.length - 1) {
            completeTask(taskIndex + 1);
          }
        });
      }, taskIndex * 2500);
    };

    completeTask(0);
  }, []);

  const activeCount = statsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const todayCount = statsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  const completedCount = statsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 28],
  });

  const renderTask = (task: any, index: number) => {
    const isCompleted = completedTasks.includes(index);
    const isCurrent = currentTask === index;

    const checkboxScale = task.checkAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 1.3, 1],
    });

    const taskOpacity = task.slideAnim.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 1],
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.mockTask,
          isCurrent && styles.mockTaskCurrent,
          {
            opacity: taskOpacity,
            transform: [{ translateY: task.slideAnim }],
          }
        ]}
      >
        <Animated.View
          style={[
            isCompleted ? styles.mockCheckboxChecked : styles.mockCheckbox,
            { transform: [{ scale: checkboxScale }] }
          ]}
        >
          {isCompleted && <Ionicons name="checkmark" size={12} color="#000" />}
        </Animated.View>
        <View style={styles.mockTaskContent}>
          <Text style={[styles.mockTaskTitle, isCompleted && styles.mockTaskCompleted]}>
            {task.title}
          </Text>
          <View style={styles.mockTaskMeta}>
            {isCompleted ? (
              <>
                <Ionicons name="checkmark-circle" size={12} color="#4ECB71" />
                <Text style={styles.mockTaskTime}>Done</Text>
              </>
            ) : isCurrent ? (
              <>
                <Ionicons name="play-circle" size={12} color="#3396D3" />
                <Text style={styles.mockTaskTime}>In Progress</Text>
              </>
            ) : (
              <>
                <Ionicons name="time-outline" size={12} color="rgba(255, 247, 245, 0.5)" />
                <Text style={styles.mockTaskTime}>{task.time}</Text>
              </>
            )}
          </View>
        </View>
        <View style={[styles.mockPriority, { backgroundColor: task.priority }]} />
      </Animated.View>
    );
  };

  return (
    <View style={styles.mockContainer}>
      <View style={styles.mockHeader}>
        <Text style={styles.mockHeaderTitle}>My Tasks</Text>
        <Ionicons name="filter" size={20} color="#FFF7F5" />
      </View>

      <View style={styles.mockStats}>
        <View style={styles.mockStatCard}>
          <Animated.Text style={styles.mockStatNumber}>
            {activeCount.interpolate({
              inputRange: [0, 8],
              outputRange: ['0', '8'],
            })}
          </Animated.Text>
          <Text style={styles.mockStatLabel}>Active</Text>
        </View>
        <View style={styles.mockStatCard}>
          <Animated.Text style={styles.mockStatNumber}>
            {todayCount.interpolate({
              inputRange: [0, 5],
              outputRange: ['0', '5'],
            })}
          </Animated.Text>
          <Text style={styles.mockStatLabel}>Today</Text>
        </View>
        <View style={styles.mockStatCard}>
          <Animated.Text style={styles.mockStatNumber}>
            {completedCount.interpolate({
              inputRange: [0, 28],
              outputRange: ['0', '28'],
            })}
          </Animated.Text>
          <Text style={styles.mockStatLabel}>Completed</Text>
        </View>
      </View>

      <Text style={styles.mockSectionTitle}>Today's Schedule</Text>

      {tasks.map((task, index) => renderTask(task, index))}

      {/* Upcoming indicator */}
      <View style={styles.mockUpcomingIndicator}>
        <Ionicons name="arrow-down" size={12} color="rgba(255, 247, 245, 0.5)" />
        <Text style={styles.mockUpcomingText}>3 more tasks</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mockContainer: {
    width: MOCK_WIDTH,
    height: MOCK_WIDTH * 1.8,
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 16,
    borderWidth: 6,
    borderColor: '#1A1A1A',
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mockProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mockAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3396D3',
  },
  mockName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF7F5',
  },
  mockRole: {
    fontSize: 9,
    color: 'rgba(255, 247, 245, 0.6)',
  },
  mockHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF7F5',
    flex: 1,
    textAlign: 'center',
  },
  mockConnected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mockConnectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ECB71',
  },
  mockConnectedText: {
    fontSize: 9,
    color: '#4ECB71',
    fontWeight: '600',
  },
  mockSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 247, 245, 0.7)',
    marginBottom: 8,
    marginTop: 8,
  },
  mockIntegrations: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  mockIntegrationCard: {
    flex: 1,
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  mockIntegrationText: {
    fontSize: 8,
    color: '#FFF7F5',
    fontWeight: '600',
  },
  mockTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  mockTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 247, 245, 0.05)',
  },
  mockTabActive: {
    backgroundColor: 'rgba(51, 150, 211, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(51, 150, 211, 0.3)',
  },
  mockTabText: {
    fontSize: 10,
    color: 'rgba(255, 247, 245, 0.7)',
    fontWeight: '600',
  },
  mockTabActiveText: {
    color: '#3396D3',
  },
  mockBadge: {
    backgroundColor: '#3396D3',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mockBadgeText: {
    fontSize: 8,
    color: '#FFF7F5',
    fontWeight: '700',
  },
  mockAddButton: {
    backgroundColor: '#3396D3',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginVertical: 8,
  },
  mockAddText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF7F5',
  },
  mockModal: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
  },
  mockModalHandle: {
    width: 32,
    height: 3,
    backgroundColor: 'rgba(255, 247, 245, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  mockModalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF7F5',
    textAlign: 'center',
    marginBottom: 12,
  },
  mockOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: 'rgba(255, 247, 245, 0.03)',
    borderRadius: 10,
    marginBottom: 8,
  },
  mockOptionText: {
    flex: 1,
  },
  mockOptionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF7F5',
    marginBottom: 2,
  },
  mockOptionDesc: {
    fontSize: 9,
    color: 'rgba(255, 247, 245, 0.5)',
  },
  mockCalendarCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  mockCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF7F5',
    marginBottom: 12,
  },
  mockEvent: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center',
  },
  mockEventBar: {
    width: 3,
    height: 40,
    borderRadius: 2,
    marginRight: 10,
  },
  mockEventContent: {
    flex: 1,
  },
  mockEventTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF7F5',
    marginBottom: 2,
  },
  mockEventTime: {
    fontSize: 9,
    color: 'rgba(255, 247, 245, 0.5)',
  },
  mockSyncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mockSyncText: {
    fontSize: 9,
    color: 'rgba(255, 247, 245, 0.5)',
  },
  mockStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  mockStatCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  mockStatNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3396D3',
    marginBottom: 2,
  },
  mockStatLabel: {
    fontSize: 9,
    color: 'rgba(255, 247, 245, 0.6)',
  },
  mockTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  mockCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 247, 245, 0.3)',
  },
  mockCheckboxChecked: {
    backgroundColor: '#4ECB71',
    borderColor: '#4ECB71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockTaskContent: {
    flex: 1,
  },
  mockTaskTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF7F5',
    marginBottom: 4,
  },
  mockTaskCompleted: {
    textDecorationLine: 'line-through',
    color: 'rgba(255, 247, 245, 0.4)',
  },
  mockTaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mockTaskTime: {
    fontSize: 9,
    color: 'rgba(255, 247, 245, 0.5)',
  },
  mockPriority: {
    width: 3,
    height: 24,
    borderRadius: 2,
  },
  // Notification Screen Styles
  mockNotificationCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  mockNotificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mockNotificationTime: {
    fontSize: 9,
    color: 'rgba(255, 247, 245, 0.5)',
  },
  mockNotificationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF7F5',
    marginBottom: 4,
  },
  mockNotificationBody: {
    fontSize: 10,
    color: 'rgba(255, 247, 245, 0.7)',
    lineHeight: 14,
    marginBottom: 8,
  },
  mockNotificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  mockActionButton: {
    flex: 1,
    backgroundColor: '#3396D3',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  mockActionSecondary: {
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
  },
  mockActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF7F5',
  },
  mockActionTextSecondary: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 247, 245, 0.7)',
  },
  // AI Suggestions Screen Styles
  mockSuggestionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
  },
  mockSuggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(51, 150, 211, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockSuggestionContent: {
    flex: 1,
  },
  mockSuggestionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF7F5',
    marginBottom: 4,
  },
  mockSuggestionBody: {
    fontSize: 10,
    color: 'rgba(255, 247, 245, 0.7)',
    lineHeight: 14,
    marginBottom: 6,
  },
  mockSuggestionAction: {
    marginTop: 4,
  },
  mockSuggestionLink: {
    fontSize: 10,
    color: '#3396D3',
    fontWeight: '600',
  },
  mockSuggestionActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  mockSmallButton: {
    backgroundColor: '#3396D3',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mockSmallButtonSecondary: {
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
  },
  mockSmallButtonText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFF7F5',
  },
  mockSmallButtonTextSecondary: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255, 247, 245, 0.7)',
  },
  // Push Notification Styles
  mockPushNotification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFB800',
    zIndex: 10,
  },
  mockPushText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF7F5',
    flex: 1,
  },
  // Typing Indicator Styles
  mockTypingIndicator: {
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mockTypingText: {
    fontSize: 10,
    color: '#3396D3',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  mockCursor: {
    width: 2,
    height: 12,
    backgroundColor: '#3396D3',
    marginLeft: 2,
  },
  // Traffic Map Styles
  mockMiniMap: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  mockMapRoad: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  mockTrafficRed: {
    flex: 2,
    backgroundColor: '#FF6B6B',
  },
  mockTrafficYellow: {
    flex: 1,
    backgroundColor: '#FFB800',
  },
  mockTrafficGreen: {
    flex: 1,
    backgroundColor: '#4ECB71',
  },
  mockMapText: {
    fontSize: 9,
    color: 'rgba(255, 247, 245, 0.7)',
    fontWeight: '600',
  },
  // Task Current State
  mockTaskCurrent: {
    backgroundColor: 'rgba(51, 150, 211, 0.1)',
    borderLeftWidth: 2,
    borderLeftColor: '#3396D3',
  },
  // Upcoming Indicator
  mockUpcomingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 8,
  },
  mockUpcomingText: {
    fontSize: 9,
    color: 'rgba(255, 247, 245, 0.5)',
    fontWeight: '600',
  },
});
