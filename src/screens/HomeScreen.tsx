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

import { RootState } from '../store';
import { RootStackParamList } from '../types';
import ApiService from '../services/api';
import AuthService from '../services/auth';
import { setUser } from '../store/slices/userSlice';

const { width, height } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

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

  // Background dots grid animation
  const backgroundDots = useRef(
    Array(600).fill(0).map(() => new Animated.Value(Math.random()))
  ).current;

  const quickActionsSlide = useRef(new Animated.Value(height)).current;
  const quickActionsOverlay = useRef(new Animated.Value(0)).current;
  const leftPanelSlide = useRef(new Animated.Value(-width)).current;
  const rightPanelSlide = useRef(new Animated.Value(width)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;

  // Panel states
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  // Panel overlay animation
  const panelOverlayOpacity = useRef(new Animated.Value(0)).current;

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

    // Animate background dots with random timing
    const backgroundAnimations = backgroundDots.map((anim) => {
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

    Animated.parallel(backgroundAnimations).start();
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

  const quickActions = [
    { id: 'task', icon: 'add-circle-outline', label: 'Add Task', screen: 'AddTask', color: '#C9A96E' },
    { id: 'reminder', icon: 'alarm-outline', label: 'Reminder', screen: 'AddReminder', color: '#C9A96E' },
    { id: 'note', icon: 'mic-circle-outline', label: 'Record', screen: 'QuickNote', color: '#C9A96E' },
    { id: 'research', icon: 'search-circle-outline', label: 'Research', screen: 'SmartSearch', color: '#C9A96E' },
    { id: 'updates', icon: 'notifications-circle-outline', label: 'Updates', screen: 'NotificationFeed', color: '#C9A96E' },
  ];

  const settingsItems = [
    { icon: 'person-outline', label: 'Profile', screen: 'EditProfile', badge: null },
    { icon: 'sparkles', label: 'AI Assistant', screen: 'AIAssistant', badge: null },
    { icon: 'notifications-outline', label: 'Notifications', screen: 'Notifications', badge: 3 },
    { icon: 'shield-checkmark-outline', label: 'Privacy', screen: 'PrivacySecurity', badge: null },
    { icon: 'help-circle-outline', label: 'Help', screen: 'HelpSupport', badge: null },
  ];

  const dashboardItems = [
    { icon: 'stats-chart-outline', label: 'Analytics', screen: 'Analytics', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'briefcase-outline', label: 'Team', screen: 'TeamManagement', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'document-text-outline', label: 'Documents', screen: 'DocumentIntelligence', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'card-outline', label: 'Finance', screen: 'FinancialDashboard', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'sunny-outline', label: 'Briefing', screen: 'DailyBriefing', gradient: ['#C9A96E', '#E5C794'] },
    { icon: 'search-outline', label: 'Search', screen: 'SmartSearch', gradient: ['#C9A96E', '#E5C794'] },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={styles.backgroundGradient}
        pointerEvents="none"
      />

      {/* Animated Background Dots */}
      <View style={styles.backgroundDotsContainer} pointerEvents="none">
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
      </View>

      {/* Radial Glow Effect Around Avatar */}
      <View style={styles.radialGlow} pointerEvents="none" />

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
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
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
          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('AIAssistant')}
            activeOpacity={0.8}
          >
            {user?.assistantProfileImage ? (
              <Image
                source={{ uri: user.assistantProfileImage }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <View style={styles.faceIdContainer}>
                  <View style={styles.faceIdOutline}>
                    <Ionicons name="scan-outline" size={60} color="#C9A96E" />
                  </View>
                </View>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.assistantName}>
            {user?.assistantName || 'Yo!'}
          </Text>

          <Text style={styles.wakeWordPrompt}>
            To activate voice assistant, say
          </Text>
          <Text style={styles.wakeWordText}>
            "Hey {user?.assistantName || 'Yo!'}"
          </Text>

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
          >
            <View style={styles.quickActionsHandle} />
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>

            <View style={styles.quickActionsList}>
              {quickActions.map((action, index) => (
                <React.Fragment key={action.id}>
                  <TouchableOpacity
                    style={styles.quickActionListItem}
                    onPress={() => {
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
          <View style={styles.userProfileSection}>
            <View style={styles.userAvatar}>
              {user?.assistantProfileImage ? (
                <Image
                  source={{ uri: user.assistantProfileImage }}
                  style={styles.userAvatarImage}
                />
              ) : (
                <Ionicons name="person" size={32} color="#C9A96E" />
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>

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
                    <Ionicons name={item.icon as any} size={24} color="#C9A96E" />
                  </View>
                  <Text style={styles.panelItemLabel}>{item.label}</Text>
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
    left: width * 0.5 - 150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
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
    paddingBottom: 200,
  },
  greetingContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
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
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  wakeWordPrompt: {
    fontSize: 14,
    fontWeight: '400',
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 8,
  },
  wakeWordText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C9A96E',
    textAlign: 'center',
    marginBottom: 30,
  },
  dotsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginBottom: 40,
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
    backgroundColor: '#000000',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
