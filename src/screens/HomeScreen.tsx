import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Image,
  PanResponder,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import LottieView from 'lottie-react-native';

import { RootState } from '../store';
import { RootStackParamList } from '../types';
import ApiService from '../services/api';
import AuthService from '../services/auth';
import { setUser } from '../store/slices/userSlice';
import ReadyPlayerMeAvatar from '../components/ReadyPlayerMeAvatar';

const { width, height } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Ready Player Me Configuration
// IMPORTANT: Replace this with your actual Ready Player Me avatar URL
// Get it from: https://readyplayer.me/ after creating your avatar
const AVATAR_URL = 'https://models.readyplayer.me/68f15c51e831796787f31bf5.glb';
const USE_READY_PLAYER_ME = true; // Set to true when you have your avatar URL

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);
  const dispatch = useDispatch();

  // Load user profile
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await ApiService.getProfile();
      dispatch(setUser(profile));
    } catch (error: any) {
      console.error('Failed to load user profile in HomeScreen:', error);
    }
  };

  // Animation states
  const dotAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Background dots grid animation - Disabled for cleaner look and better performance
  /* const backgroundDots = useRef(
    Array(600).fill(0).map(() => new Animated.Value(Math.random()))
  ).current; */

  const quickActionsSlide = useRef(new Animated.Value(height)).current;
  const quickActionsOverlay = useRef(new Animated.Value(0)).current;
  const leftPanelSlide = useRef(new Animated.Value(-width)).current;
  const rightPanelSlide = useRef(new Animated.Value(width)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;

  // Panel states
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  // Robot animation states
  type RobotState = 'idle' | 'listening' | 'talking' | 'thinking';
  const [robotState, setRobotState] = useState<RobotState>('idle');

  // Panel overlay animation
  const panelOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Lottie animation ref
  const lottieRef = useRef<LottieView>(null);

  // Get animation source based on robot state - Full character animations
  const getRobotAnimation = () => {
    switch (robotState) {
      case 'idle':
        // Character with blinking eyes, subtle breathing, head movements
        return { uri: 'https://lottie.host/c8b0e8d0-7f8e-4f5c-9e3d-8b5e5e5e5e5e/idle.json' };
      case 'listening':
        // Character listening attentively
        return { uri: 'https://lottie.host/d8f8e8e8-8e8e-4f5c-9e3d-8b5e5e5e5e5e/listening.json' };
      case 'talking':
        // Character talking with lip sync
        return { uri: 'https://lottie.host/e8f8e8e8-8e8e-4f5c-9e3d-8b5e5e5e5e5e/talking.json' };
      case 'thinking':
        // Character thinking
        return { uri: 'https://lottie.host/f8f8e8e8-8e8e-4f5c-9e3d-8b5e5e5e5e5e/thinking.json' };
      default:
        return { uri: 'https://lottie.host/c8b0e8d0-7f8e-4f5c-9e3d-8b5e5e5e5e5e/idle.json' };
    }
  };

  // Voice greeting on mount
  useEffect(() => {
    // Trigger greeting animation and voice
    const greetingTimeout = setTimeout(() => {
      setRobotTalking();

      // Voice greeting with speech
      const greeting = `Hey! I'm ${user?.assistantName || 'Yo!'}`;
      console.log(`🗣️ ${greeting}`);

      // Speak the greeting
      Speech.speak(greeting, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.85,
      });

      // Reset to idle after greeting
      setTimeout(() => {
        setRobotIdle();
      }, 4000);
    }, 1500);

    return () => clearTimeout(greetingTimeout);
  }, [user?.assistantName]);

  // Generate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.preferredName || user?.name || 'Boss';

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

    return { timeGreeting, userName };
  };

  const greeting = getGreeting();

  // Animate dots on mount
  useEffect(() => {
    // Stagger the dot animations
    const animations = dotAnimations.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 100),
          Animated.timing(anim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();

    // Animate background dots with random timing - Disabled for performance
    /* const backgroundAnimations = backgroundDots.map((anim) => {
      const randomDelay = Math.random() * 2000;
      const randomFadeInDuration = 600 + Math.random() * 800;
      const randomFadeOutDuration = 600 + Math.random() * 800;

      return Animated.loop(
        Animated.sequence([
          Animated.delay(randomDelay),
          Animated.timing(anim, {
            toValue: 1,
            duration: randomFadeInDuration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: randomFadeOutDuration,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.parallel(backgroundAnimations).start(); */
  }, []);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx > 0 && !leftPanelVisible && !rightPanelVisible) {
          // Swipe right - show settings from left
          leftPanelSlide.setValue(-width + gestureState.dx);
        } else if (gestureState.dx < 0 && !leftPanelVisible && !rightPanelVisible) {
          // Swipe left - show dashboard from right
          rightPanelSlide.setValue(width + gestureState.dx);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > width * 0.3 && !leftPanelVisible) {
          // Show left panel (Settings)
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          showLeftPanel();
        } else if (gestureState.dx < -width * 0.3 && !rightPanelVisible) {
          // Show right panel (Dashboard)
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          showRightPanel();
        } else {
          // Reset
          hideAllPanels();
        }
      },
    })
  ).current;

  // Pan responder for Quick Actions modal - swipe down to close
  const quickActionsPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward swipes
        if (gestureState.dy > 0) {
          quickActionsSlide.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // If swiped down more than 100px or velocity is high, close the modal
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          hideQuickActions();
        } else {
          // Otherwise, spring back to the original position
          Animated.spring(quickActionsSlide, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const showLeftPanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLeftPanelVisible(true);
    Animated.parallel([
      Animated.spring(leftPanelSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(arrowOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(panelOverlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showRightPanel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRightPanelVisible(true);
    Animated.parallel([
      Animated.spring(rightPanelSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(arrowOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(panelOverlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideAllPanels = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLeftPanelVisible(false);
    setRightPanelVisible(false);
    Animated.parallel([
      Animated.spring(leftPanelSlide, {
        toValue: -width,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(rightPanelSlide, {
        toValue: width,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(arrowOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(panelOverlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showQuickActions = () => {
    setQuickActionsVisible(true);
    Animated.parallel([
      Animated.spring(quickActionsSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(quickActionsOverlay, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideQuickActions = () => {
    Animated.parallel([
      Animated.spring(quickActionsSlide, {
        toValue: height,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(quickActionsOverlay, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setQuickActionsVisible(false);
    });
  };

  // Robot state handlers
  const setRobotListening = () => {
    setRobotState('listening');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const setRobotTalking = () => {
    setRobotState('talking');
  };

  const setRobotThinking = () => {
    setRobotState('thinking');
  };

  const setRobotIdle = () => {
    setRobotState('idle');
  };

  // Auto-reset to idle after certain duration
  useEffect(() => {
    if (robotState !== 'idle') {
      const timeout = setTimeout(() => {
        setRobotIdle();
      }, robotState === 'listening' ? 30000 : 5000); // 30s for listening, 5s for others

      return () => clearTimeout(timeout);
    }
  }, [robotState]);

  const quickActions = [
    { id: 'chat', icon: 'chatbubble-ellipses-outline', label: `Chat with ${user?.assistantName || 'Assistant'}`, screen: 'ChatScreen', color: '#C9A96E' },
    { id: 'note', icon: 'create-outline', label: 'Quick Note', screen: 'QuickNote', color: '#C9A96E' },
    { id: 'task', icon: 'add-circle-outline', label: 'Add Task', screen: 'Tasks', color: '#C9A96E' },
    { id: 'reminder', icon: 'alarm-outline', label: 'Set Reminder', screen: 'Reminders', color: '#C9A96E' },
    { id: 'updates', icon: 'newspaper-outline', label: 'Latest Updates', screen: 'NotificationFeed', color: '#C9A96E' },
  ];

  const settingsItems = [
    { icon: 'sparkles', label: 'AI Assistant', screen: 'AIAssistant', badge: null },
    { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications', badge: null },
    { icon: 'shield-checkmark-outline', label: 'Privacy', screen: 'PrivacySecurity', badge: null },
  ];

  const dashboardItems = [
    { icon: 'today-outline', label: 'Today\'s Overview', screen: 'Tasks', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'list-outline', label: 'Tasks & Reminders', screen: 'Tasks', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'calendar-outline', label: 'Schedule', screen: 'Calendar', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'mic-outline', label: 'Voice Notes', screen: 'QuickNote', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'search-outline', label: 'Smart Search', screen: 'SmartSearch', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'trending-up-outline', label: 'Insights', screen: 'Analytics', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'phone-portrait-outline', label: 'Active Sessions', screen: 'ActiveSessions', gradient: ['#C9A96E', '#E5C794'] },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#1A1510', '#000000']}  // Subtle gradient: dark gray-brown to black
        locations={[0, 0.5, 1]}  // Top, middle, bottom
        style={styles.backgroundGradient}
        pointerEvents="none"
      />

      {/* Animated Background Dots - Disabled for cleaner look */}
      {/* <View style={styles.backgroundDotsContainer} pointerEvents="none">
        {backgroundDots.map((anim, index) => {
          const dotSpacing = 35; // Equal spacing in all directions
          const columns = Math.ceil(width / dotSpacing);
          const rows = Math.ceil(height / dotSpacing);
          const row = Math.floor(index / columns);
          const col = index % columns;

          if (row >= rows) return null;

          return (
            <Animated.View
              key={index}
              style={[
                styles.backgroundDot,
                {
                  left: col * dotSpacing,
                  top: row * dotSpacing,
                  opacity: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 0.5],
                  }),
                },
              ]}
            />
          );
        })}
      </View> */}

      {/* Radial Glow Effect Around Avatar - Disabled, using gradient instead */}
      {/* <View style={styles.radialGlow} pointerEvents="none" /> */}

      {/* Main Content Area */}
      <View style={styles.mainContent} {...panResponder.panHandlers}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => showLeftPanel()}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(201, 169, 110, 0.2)', 'rgba(201, 169, 110, 0.05)']}
              style={styles.headerIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="menu" size={24} color="#C9A96E" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('NotificationFeed')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(201, 169, 110, 0.2)', 'rgba(201, 169, 110, 0.05)']}
              style={styles.headerIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="notifications" size={24} color="#C9A96E" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Greeting Message */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingTime}>{greeting.timeGreeting}</Text>
          <Text style={styles.greetingName}>{greeting.userName}</Text>
        </View>

        {/* Center Content - Avatar and Dots */}
        <View style={styles.centerContent}>
          {/* Avatar - 3D AI Robot (Always Show) */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => {
              // Cycle through states for demo/testing
              if (robotState === 'idle') {
                setRobotThinking();
              } else if (robotState === 'thinking') {
                setRobotListening();
              } else if (robotState === 'listening') {
                setRobotTalking();
              } else {
                setRobotIdle();
              }
            }}
            onLongPress={() => {
              navigation.navigate('AIAssistant');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.characterContainer}>
              {USE_READY_PLAYER_ME ? (
                /* Ready Player Me 3D Avatar */
                <>
                  <ReadyPlayerMeAvatar
                    avatarUrl={AVATAR_URL}
                    animationState={robotState}
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
            </View>
          </TouchableOpacity>

          {/* Wake Word Prompt */}
          <View style={styles.wakeWordContainer}>
            <Text style={styles.wakeWordPrompt}>Say</Text>
            <Text style={styles.wakeWordText}>
              "Yo {user?.assistantName || 'PA'}"
            </Text>
            <Text style={styles.wakeWordPrompt}>to activate</Text>
          </View>

          {/* Animated Dots */}
          <View style={styles.dotsContainer}>
            {dotAnimations.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    opacity: anim,
                    transform: [
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          </View>

          {/* Swipe Arrows Indicator */}
          <Animated.View style={[styles.swipeIndicator, { opacity: arrowOpacity }]}>
            <TouchableOpacity
              style={styles.swipeButton}
              onPress={showLeftPanel}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(201, 169, 110, 0.15)', 'rgba(201, 169, 110, 0.05)']}
                style={styles.swipeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="chevron-back" size={20} color="#C9A96E" />
                <Text style={styles.swipeText}>Settings</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.swipeButton}
              onPress={showRightPanel}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['rgba(201, 169, 110, 0.05)', 'rgba(201, 169, 110, 0.15)']}
                style={styles.swipeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.swipeText}>Dashboard</Text>
                <Ionicons name="chevron-forward" size={20} color="#C9A96E" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Floating Widget Button */}
        <TouchableOpacity
          style={styles.floatingWidget}
          onPress={showQuickActions}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#C9A96E', '#E5C794']}
            style={styles.widgetGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Actions Modal */}
      {quickActionsVisible && (
        <>
          <TouchableOpacity
            style={styles.quickActionsOverlay}
            activeOpacity={1}
            onPress={hideQuickActions}
          >
            <Animated.View
              style={[
                styles.overlayBackground,
                { opacity: quickActionsOverlay }
              ]}
            />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.quickActionsModal,
              { transform: [{ translateY: quickActionsSlide }] },
            ]}
            {...quickActionsPanResponder.panHandlers}
          >
            <View style={styles.quickActionsHandle} />
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>

            <View style={styles.quickActionsList}>
              {quickActions.map((action, index) => (
                <React.Fragment key={action.id}>
                  <TouchableOpacity
                    style={styles.quickActionListItem}
                    onPress={() => {
                      // Trigger appropriate robot state based on action
                      if (action.id === 'chat') {
                        setRobotTalking();
                      } else if (action.id === 'note' || action.id === 'reminder') {
                        setRobotListening();
                      } else {
                        setRobotThinking();
                      }

                      hideQuickActions();
                      setTimeout(() => navigation.navigate(action.screen as any), 300);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quickActionListIcon}>
                      <Ionicons name={action.icon as any} size={24} color="#C9A96E" />
                    </View>
                    <Text style={styles.quickActionListText}>{action.label}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666666" />
                  </TouchableOpacity>
                  {index < quickActions.length - 1 && (
                    <View style={styles.quickActionDivider} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </Animated.View>
        </>
      )}

      {/* Panel Overlay Backdrop */}
      {(leftPanelVisible || rightPanelVisible) && (
        <TouchableOpacity
          style={styles.panelOverlay}
          activeOpacity={1}
          onPress={hideAllPanels}
        >
          <Animated.View
            style={[
              styles.panelOverlayBackground,
              { opacity: panelOverlayOpacity }
            ]}
          />
        </TouchableOpacity>
      )}

      {/* Left Panel - Settings */}
      <Animated.View
        style={[
          styles.leftPanel,
          { transform: [{ translateX: leftPanelSlide }] },
        ]}
      >
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Settings</Text>
          <TouchableOpacity onPress={hideAllPanels} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.panelScrollView}
          contentContainerStyle={[styles.panelScrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Section */}
          <TouchableOpacity
            style={styles.userProfileSection}
            onPress={() => {
              hideAllPanels();
              setTimeout(() => navigation.navigate('EditProfile'), 300);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.userAvatar}>
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.userAvatarImage}
                />
              ) : (
                <Ionicons name="person" size={32} color="#C9A96E" />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.preferredName || user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999999" />
          </TouchableOpacity>

          <View style={styles.panelDivider} />

          {/* Settings Items */}
          <View style={styles.panelContent}>
            {settingsItems.map((item, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.panelItem}
                  onPress={() => {
                    hideAllPanels();
                    setTimeout(() => navigation.navigate(item.screen as any), 300);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.panelIconContainer}>
                    {item.screen === 'AIAssistant' ? (
                      user?.assistantProfileImage ? (
                        <Image
                          source={{ uri: user.assistantProfileImage }}
                          style={styles.panelAvatarImage}
                        />
                      ) : (
                        <Ionicons name="scan-outline" size={24} color="#C9A96E" />
                      )
                    ) : (
                      <Ionicons name={item.icon as any} size={24} color="#C9A96E" />
                    )}
                  </View>
                  <Text style={styles.panelItemLabel}>
                    {item.screen === 'AIAssistant' ? (user?.assistantName || 'Yo!') : item.label}
                  </Text>
                  {item.badge && (
                    <View style={styles.panelBadge}>
                      <Text style={styles.panelBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color="#999999" />
                </TouchableOpacity>
                {index < settingsItems.length - 1 && (
                  <View style={styles.panelDivider} />
                )}
              </React.Fragment>
            ))}
          </View>

          <View style={styles.panelDivider} />

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              hideAllPanels();
              await AuthService.logout();
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.panelIconContainer, { backgroundColor: 'rgba(255, 69, 87, 0.15)' }]}>
              <Ionicons name="log-out-outline" size={24} color="#FF4757" />
            </View>
            <Text style={[styles.panelItemLabel, { color: '#FF4757' }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={20} color="#FF4757" />
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Right Panel - Dashboard */}
      <Animated.View
        style={[
          styles.rightPanel,
          { transform: [{ translateX: rightPanelSlide }] },
        ]}
      >
        <View style={styles.panelHeader}>
          <TouchableOpacity onPress={hideAllPanels} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>Dashboard</Text>
        </View>

        <ScrollView
          style={styles.panelScrollView}
          contentContainerStyle={[styles.panelScrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {dashboardItems.map((item, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={styles.dashboardCard}
                onPress={() => {
                  hideAllPanels();
                  setTimeout(() => navigation.navigate(item.screen as any), 300);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.dashboardCardContent}>
                  <Ionicons name={item.icon as any} size={32} color="#C9A96E" />
                  <Text style={styles.dashboardCardLabel}>{item.label}</Text>
                </View>
              </TouchableOpacity>
              {index < dashboardItems.length - 1 && (
                <View style={styles.dashboardDivider} />
              )}
            </React.Fragment>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundDotsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundDot: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#C9A96E',
  },
  radialGlow: {
    position: 'absolute',
    top: height * 0.2,
    left: width * 0.5 - 175,
    width: 350,           // Increased from 300
    height: 350,          // Increased from 300
    borderRadius: 175,    // Adjusted for new size
    backgroundColor: 'rgba(201, 169, 110, 0.12)',  // Slightly more visible (was 0.08)
    zIndex: 1,
  },
  mainContent: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
  },
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
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Center Content
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 140,  // Increased more to shift content upward for bigger text
    paddingTop: 20,      // Add top padding for better balance
  },
  greetingContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 15,
  },
  greetingTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#C9A96E',
    letterSpacing: 1,
    marginBottom: 8,
  },
  greetingName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  avatarContainer: {
    marginBottom: 4,  // Further reduced for bigger wake word text
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  avatarImageContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#000000',
  },
  stateRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#C9A96E',
  },
  characterContainer: {
    width: width * 0.75,  // Match ReadyPlayerMeAvatar width
    height: 380,          // Match ReadyPlayerMeAvatar height
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  characterAnimation: {
    width: width * 0.75,
    height: 380,
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
  faceIdContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceIdOutline: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assistantName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,  // Reduced spacing
    marginTop: 2,     // Reduced spacing
  },
  wakeWordContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  wakeWordPrompt: {
    fontSize: 16,          // Increased from 13
    fontWeight: '500',     // Increased weight
    color: '#CCCCCC',      // Lighter color for better visibility
    textAlign: 'center',
    marginBottom: 8,       // More spacing
  },
  wakeWordText: {
    fontSize: 28,          // Increased from 16
    fontWeight: '800',     // Bold
    color: '#C9A96E',
    textAlign: 'center',
    marginBottom: 8,       // Adjusted spacing
    letterSpacing: 0.5,    // Better letter spacing
    textShadowColor: 'rgba(201, 169, 110, 0.3)',  // Add glow effect
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  dotsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,      // Reduced height
    marginBottom: 15, // Reduced margin
    marginTop: 8,     // Add small top margin
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C9A96E',
    marginVertical: 6,
  },

  // Swipe Indicator
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  swipeButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  swipeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  swipeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C9A96E',
    letterSpacing: 0.5,
  },

  // Floating Widget Button
  floatingWidget: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  widgetGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Quick Actions Modal
  quickActionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  quickActionsModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    zIndex: 101,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  quickActionsHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(201, 169, 110, 0.4)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  quickActionsList: {
    paddingHorizontal: 20,
  },
  quickActionListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  quickActionListIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionListText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 60,
  },

  // Left Panel (Settings)
  leftPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width,
    backgroundColor: '#000000',
    shadowColor: '#C9A96E',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  panelTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelScrollView: {
    flex: 1,
  },
  panelScrollContent: {
    paddingTop: 20,
  },
  panelContent: {
    paddingTop: 0,
  },
  userProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
    color: '#999999',
  },
  panelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  panelIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  panelAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  panelItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  panelDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginTop: 10,
  },
  panelOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  panelOverlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panelBadge: {
    backgroundColor: '#FF4757',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Right Panel (Dashboard)
  rightPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: width,
    backgroundColor: '#000000',
    shadowColor: '#C9A96E',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  dashboardCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    backgroundColor: '#1A1A1A',
  },
  dashboardCardContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardCardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 16,
  },
  dashboardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    marginBottom: 16,
  },
});

export default HomeScreen;
