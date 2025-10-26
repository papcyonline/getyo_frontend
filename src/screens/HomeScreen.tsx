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
  ActivityIndicator,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootState } from '../store';
import { RootStackParamList } from '../types';
import ApiService from '../services/api';
import AuthService from '../services/auth';
import { setUser } from '../store/slices/userSlice';
import HomeHeader from '../components/HomeHeader';
import AvatarSection from '../components/AvatarSection';
import BottomNav from '../components/BottomNav';

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
    loadPendingCount();
    loadUnreadNotifications();
    loadActionUsage();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await ApiService.getProfile();
      console.log('👤 User Profile Loaded:', {
        assistantName: profile.assistantName,
        assistantProfileImage: profile.assistantProfileImage,
        profileImage: profile.profileImage,
      });
      dispatch(setUser(profile));
    } catch (error: any) {
      console.error('Failed to load user profile in HomeScreen:', error);
    }
  };

  const loadPendingCount = async () => {
    try {
      // Fetch tasks and reminders in parallel
      const [tasksResponse, remindersResponse] = await Promise.all([
        ApiService.getTasks().catch(() => ({ data: [] })),
        ApiService.getReminders().catch(() => ({ data: [] })),
      ]);

      // Count pending/incomplete items
      const pendingTasks = tasksResponse.data?.filter((task: any) => !task.completed).length || 0;
      const pendingReminders = remindersResponse.data?.filter((reminder: any) => !reminder.completed).length || 0;

      setPendingCount(pendingTasks + pendingReminders);
    } catch (error: any) {
      console.error('Failed to load pending count:', error);
    }
  };

  const loadUnreadNotifications = async () => {
    try {
      // Fetch notifications and count unread ones
      const response = await ApiService.getNotifications().catch(() => ({ data: [] }));
      const unreadCount = response.data?.filter((notification: any) => !notification.read).length || 0;
      setUnreadNotifications(unreadCount);
    } catch (error: any) {
      console.error('Failed to load unread notifications:', error);
    }
  };

  // Load action usage counts from storage
  const loadActionUsage = async () => {
    try {
      const stored = await AsyncStorage.getItem('action_usage_count');
      if (stored) {
        setActionUsageCount(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load action usage:', error);
    }
  };

  // Save action usage counts to storage
  const saveActionUsage = async (counts: Record<string, number>) => {
    try {
      await AsyncStorage.setItem('action_usage_count', JSON.stringify(counts));
    } catch (error) {
      console.error('Failed to save action usage:', error);
    }
  };

  // Track action usage
  const trackActionUsage = async (actionId: string) => {
    const newCounts = {
      ...actionUsageCount,
      [actionId]: (actionUsageCount[actionId] || 0) + 1,
    };
    setActionUsageCount(newCounts);
    await saveActionUsage(newCounts);
  };

  // Animation states removed - dots animation removed

  // Audio waveform animations for listening state
  const waveformBars = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.5),
    new Animated.Value(0.4),
    new Animated.Value(0.6),
    new Animated.Value(0.35),
    new Animated.Value(0.55),
  ]).current;

  // Background dots grid animation - Disabled for cleaner look and better performance
  /* const backgroundDots = useRef(
    Array(600).fill(0).map(() => new Animated.Value(Math.random()))
  ).current; */

  const quickActionsSlide = useRef(new Animated.Value(height)).current;
  const quickActionsOverlay = useRef(new Animated.Value(0)).current;
  const leftPanelSlide = useRef(new Animated.Value(-width)).current;
  const rightPanelSlide = useRef(new Animated.Value(width)).current;
  const arrowOpacity = useRef(new Animated.Value(0)).current; // Start hidden, will slide up

  // Pulse animation for wake word detection
  const avatarPulse = useRef(new Animated.Value(1)).current;

  // Panel states
  const [leftPanelVisible, setLeftPanelVisible] = useState(false);
  const [rightPanelVisible, setRightPanelVisible] = useState(false);
  const [quickActionsVisible, setQuickActionsVisible] = useState(false);

  // Robot animation states
  type RobotState = 'idle' | 'listening' | 'talking' | 'thinking';
  const [robotState, setRobotState] = useState<RobotState>('idle');

  // Pending items count for badge
  const [pendingCount, setPendingCount] = useState(0);

  // Unread notifications count
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Avatar loading state
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  // Notification badge pulse animation
  const notificationPulse = useRef(new Animated.Value(1)).current;

  // Double-tap detection
  const lastTap = useRef<number | null>(null);
  const DOUBLE_TAP_DELAY = 300; // milliseconds

  // Recently used actions tracking
  const [actionUsageCount, setActionUsageCount] = useState<Record<string, number>>({});

  // Panel overlay animation
  const panelOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Lottie animation ref
  const lottieRef = useRef<LottieView>(null);

  // Voice conversation state
  interface VoiceState {
    isRecording: boolean;
    isTranscribing: boolean;
    isPlaying: boolean;
    recording: Audio.Recording | null;
    conversationActive: boolean;
    conversationId: string | null;
  }

  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isTranscribing: false,
    isPlaying: false,
    recording: null,
    conversationActive: false,
    conversationId: null,
  });

  // Recording timeout refs
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRecordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationActiveRef = useRef<boolean>(false); // Track if conversation is active
  const AUTO_STOP_DELAY = 8000; // 8 seconds auto-stop (allows longer speech)
  const MAX_RECORDING_TIME = 30000; // 30 seconds maximum

  // Conversation overlay animation
  const conversationOverlayOpacity = useRef(new Animated.Value(0)).current;
  const conversationBackgroundPulse = useRef(new Animated.Value(1)).current;

  // Sync conversationActive state with ref
  useEffect(() => {
    conversationActiveRef.current = voiceState.conversationActive;
    console.log(`🔄 Conversation active state: ${voiceState.conversationActive}`);
  }, [voiceState.conversationActive]);

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

  // Initialize audio permissions
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Audio permission not granted');
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error('Audio initialization error:', error);
      }
    };

    initializeAudio();
  }, []);

  // Animate conversation overlay when active
  useEffect(() => {
    if (voiceState.conversationActive) {
      // Show overlay
      Animated.timing(conversationOverlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start pulsing background animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(conversationBackgroundPulse, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(conversationBackgroundPulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Hide overlay
      Animated.timing(conversationOverlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      conversationBackgroundPulse.stopAnimation();
      conversationBackgroundPulse.setValue(1);
    }
  }, [voiceState.conversationActive]);

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

  // Auto-open quick actions when navigated from tasks/reminders screens
  // Also reload profile when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reload user profile to get latest avatar and assistant data
      loadUserProfile();

      const params = navigation.getState().routes[navigation.getState().index].params as any;
      if (params?.openQuickActions) {
        // Delay to allow screen to settle
        setTimeout(() => {
          showQuickActions();
          // Clear the param after opening
          navigation.setParams({ openQuickActions: undefined } as any);
        }, 300);
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Generate contextual greeting based on time of day and pending tasks
  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.preferredName || user?.name || 'Boss';

    let timeGreeting = '';
    let contextMessage = '';

    if (hour >= 0 && hour < 5) {
      timeGreeting = 'Good Night';
      contextMessage = 'Time to rest';
    } else if (hour >= 5 && hour < 12) {
      timeGreeting = 'Good Morning';
      if (pendingCount > 0) {
        contextMessage = `You have ${pendingCount} task${pendingCount > 1 ? 's' : ''} today`;
      } else {
        contextMessage = 'Ready for a productive day?';
      }
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good Afternoon';
      if (pendingCount > 0) {
        contextMessage = `${pendingCount} pending item${pendingCount > 1 ? 's' : ''}`;
      } else {
        contextMessage = 'All caught up!';
      }
    } else if (hour >= 17 && hour < 21) {
      timeGreeting = 'Good Evening';
      if (pendingCount > 0) {
        contextMessage = `${pendingCount} item${pendingCount > 1 ? 's' : ''} to review`;
      } else {
        contextMessage = 'Great work today!';
      }
    } else {
      timeGreeting = 'Good Night';
      contextMessage = 'Time to rest';
    }

    return { timeGreeting, userName, contextMessage };
  };

  const greeting = getGreeting();

  // Animate bottom nav on mount
  useEffect(() => {
    // Animate bottom nav container sliding up quickly
    Animated.spring(arrowOpacity, {
      toValue: 1,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();

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
    ]).start(() => {
      // Update state AFTER animation completes
      setLeftPanelVisible(false);
      setRightPanelVisible(false);
    });
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

  // Start voice conversation (in-place, no navigation)
  const startQuickVoiceInput = async () => {
    console.log('🎤 Voice conversation activated');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // Request microphone permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Microphone permission not granted');
        return;
      }

      // If this is the first turn, play PA greeting
      if (!voiceState.conversationId) {
        console.log('🎙️ First turn - playing PA greeting');
        setRobotTalking();

        const greeting = `Hi boss, I'm listening. How can I help you?`;
        Speech.speak(greeting, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.85,
          onDone: async () => {
            // After greeting, start recording
            console.log('✅ Greeting complete, starting recording');
            await startRecording();
          }
        });
      } else {
        // Continue existing conversation
        await startRecording();
      }

    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      setVoiceState({
        isRecording: false,
        isTranscribing: false,
        isPlaying: false,
        recording: null,
        conversationActive: false,
        conversationId: null,
      });
      setRobotIdle();
    }
  };

  // Helper function to start recording
  const startRecording = async () => {
    try {
      console.log('🎙️ startRecording() called');

      // Clear any existing timeouts
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      if (maxRecordingTimeoutRef.current) {
        clearTimeout(maxRecordingTimeoutRef.current);
        maxRecordingTimeoutRef.current = null;
      }

      // Start conversation
      setVoiceState(prev => {
        console.log('📝 Setting conversationActive=true, isRecording=true');
        return { ...prev, conversationActive: true, isRecording: true };
      });
      setRobotListening();

      // Initialize recording
      console.log('🎤 Initializing audio recording...');
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      await recording.startAsync();
      setVoiceState(prev => ({ ...prev, recording }));
      console.log('✅ Recording started successfully');

      // Set auto-stop timer (8 seconds - allows longer speech without manual stop)
      console.log(`⏰ Setting auto-stop timer for ${AUTO_STOP_DELAY / 1000} seconds`);
      recordingTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-stop timer fired - stopping recording');
        stopRecording();
      }, AUTO_STOP_DELAY);

      // Set maximum recording time (30 seconds safety limit)
      maxRecordingTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Max recording time reached (30s) - force stopping');
        stopRecording();
      }, MAX_RECORDING_TIME);
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      setVoiceState(prev => ({
        ...prev,
        conversationActive: false,
        isRecording: false,
        recording: null
      }));
      setRobotIdle();
    }
  };

  // Stop recording and process voice input
  const stopRecording = async () => {
    try {
      console.log('🛑 stopRecording() called');

      // Clear auto-stop timers
      if (recordingTimeoutRef.current) {
        console.log('⏰ Clearing auto-stop timer');
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      if (maxRecordingTimeoutRef.current) {
        console.log('⏰ Clearing max recording timer');
        clearTimeout(maxRecordingTimeoutRef.current);
        maxRecordingTimeoutRef.current = null;
      }

      const { recording, conversationId } = voiceState;
      if (!recording) {
        console.warn('⚠️ No recording found, aborting stopRecording');
        return;
      }

      console.log('🎤 Stopping recording...');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      setVoiceState(prev => {
        console.log('📝 Setting isRecording=false, isTranscribing=true');
        return { ...prev, isRecording: false, isTranscribing: true };
      });
      setRobotThinking();

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        throw new Error('No recording URI available');
      }

      console.log('🔄 Transcribing and getting AI response...');
      console.log(`📝 Using conversationId: ${conversationId || 'none (new conversation)'}`);

      // Send audio for transcription and AI response with conversationId if available
      const response = await ApiService.transcribeAndRespond(uri, conversationId || undefined);

      if (response.success) {
        console.log('✅ Transcription:', response.data.transcript);
        console.log('✅ AI Response:', response.data.aiResponse);
        console.log('🆔 ConversationId:', response.data.conversationId);

        // Store conversationId for next turn
        const newConversationId = response.data.conversationId;

        // Set thinking state briefly before talking
        setVoiceState(prev => ({
          ...prev,
          isTranscribing: false,
          isPlaying: true,
          conversationId: newConversationId
        }));
        setRobotTalking();

        // Play voice response if available
        const audioBuffer = (response.data as any).audioBuffer;
        if (audioBuffer) {
          try {
            const audioBase64 = audioBuffer;
            const dataUri = `data:audio/mp3;base64,${audioBase64}`;

            const { sound } = await Audio.Sound.createAsync(
              { uri: dataUri },
              { shouldPlay: true },
              async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                  await sound.unloadAsync();
                  console.log('🔊 Voice playback finished');

                  // Return to idle, keep conversation active for next turn
                  setVoiceState(prev => ({
                    ...prev,
                    isPlaying: false,
                    recording: null
                  }));
                  setRobotIdle();

                  // Auto-start next turn after a brief pause (500ms)
                  setTimeout(() => {
                    if (conversationActiveRef.current) {
                      console.log('🔄 Auto-starting next turn');
                      startRecording();
                    } else {
                      console.log('❌ Conversation not active, skipping auto-start');
                    }
                  }, 500);
                }
              }
            );
          } catch (audioError) {
            console.error('Failed to play voice response:', audioError);
            // Still keep conversation active even if audio fails
            setVoiceState(prev => ({ ...prev, isPlaying: false, recording: null }));
            setRobotIdle();

            // Auto-start next turn even if audio failed
            setTimeout(() => {
              if (conversationActiveRef.current) {
                console.log('🔄 Auto-starting next turn (after audio error)');
                startRecording();
              } else {
                console.log('❌ Conversation not active, skipping auto-start');
              }
            }, 500);
          }
        } else {
          // No audio, return to idle and auto-start next turn
          setVoiceState(prev => ({ ...prev, isPlaying: false, recording: null }));
          setRobotIdle();

          setTimeout(() => {
            if (conversationActiveRef.current) {
              console.log('🔄 Auto-starting next turn (no audio)');
              startRecording();
            } else {
              console.log('❌ Conversation not active, skipping auto-start');
            }
          }, 500);
        }
      } else {
        throw new Error(response.error || 'Voice processing failed');
      }

      // Clean up recording file
      try {
        await FileSystem.deleteAsync(uri);
      } catch (cleanupError) {
        console.warn('Failed to cleanup recording file:', cleanupError);
      }

    } catch (error) {
      console.error('Error processing voice:', error);
      setVoiceState({
        isRecording: false,
        isTranscribing: false,
        isPlaying: false,
        recording: null,
        conversationActive: false,
        conversationId: null,
      });
      setRobotIdle();
    }
  };

  // End conversation
  const endConversation = async () => {
    console.log('🛑 Ending conversation');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Clear all recording timers
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (maxRecordingTimeoutRef.current) {
      clearTimeout(maxRecordingTimeoutRef.current);
      maxRecordingTimeoutRef.current = null;
    }

    // Stop any ongoing recording
    if (voiceState.recording) {
      try {
        await voiceState.recording.stopAndUnloadAsync();
      } catch (error) {
        console.warn('Failed to stop recording:', error);
      }
    }

    setVoiceState({
      isRecording: false,
      isTranscribing: false,
      isPlaying: false,
      recording: null,
      conversationActive: false,
      conversationId: null, // Clear conversationId when ending
    });
    setRobotIdle();
  };

  // Handle avatar tap with double-tap detection
  const handleAvatarTap = () => {
    const now = Date.now();

    if (lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      // Double tap detected
      lastTap.current = null;
      startQuickVoiceInput();
    } else {
      // Single tap - cycle through states for demo/testing
      lastTap.current = now;

      // Still allow state cycling on single tap
      if (robotState === 'idle') {
        setRobotThinking();
      } else if (robotState === 'thinking') {
        setRobotListening();
      } else if (robotState === 'listening') {
        setRobotTalking();
      } else {
        setRobotIdle();
      }
    }
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

  // Animate waveform bars when listening
  useEffect(() => {
    if (robotState === 'listening') {
      const animations = waveformBars.map((bar, index) => {
        const duration = 300 + (index * 50); // Stagger timings
        return Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 0.8 + (Math.random() * 0.2),
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(bar, {
              toValue: 0.2 + (Math.random() * 0.2),
              duration: duration,
              useNativeDriver: true,
            }),
          ])
        );
      });

      Animated.parallel(animations).start();
    } else {
      // Reset all bars to default when not listening
      waveformBars.forEach(bar => bar.setValue(0.3));
    }
  }, [robotState]);

  // Pulse animation when wake word detected (entering listening state)
  useEffect(() => {
    if (robotState === 'listening') {
      // Trigger pulse animation
      Animated.sequence([
        Animated.timing(avatarPulse, {
          toValue: 1.15,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulse, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulse, {
          toValue: 1.08,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(avatarPulse, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset to normal size
      avatarPulse.setValue(1);
    }
  }, [robotState]);

  // Animate notification indicator when there are unread notifications
  useEffect(() => {
    if (unreadNotifications > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(notificationPulse, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(notificationPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      notificationPulse.stopAnimation();
      notificationPulse.setValue(1);
    }
  }, [unreadNotifications]);

  // Define all available quick actions
  const allQuickActions = [
    { id: 'chat', icon: 'chatbubble-ellipses-outline', label: `Chat with ${user?.assistantName || 'Assistant'}`, screen: 'ChatScreen', color: '#C9A96E' },
    { id: 'note', icon: 'create-outline', label: 'Quick Note', screen: 'QuickNote', color: '#C9A96E' },
    { id: 'task', icon: 'add-circle-outline', label: 'Add Task', screen: 'Tasks', color: '#C9A96E' },
    { id: 'reminder', icon: 'alarm-outline', label: 'Set Reminder', screen: 'Reminders', color: '#C9A96E' },
    { id: 'updates', icon: 'newspaper-outline', label: 'Latest Updates', screen: 'NotificationFeed', color: '#C9A96E' },
  ];

  // Sort quick actions by usage count (most used first)
  const quickActions = [...allQuickActions].sort((a, b) => {
    const countA = actionUsageCount[a.id] || 0;
    const countB = actionUsageCount[b.id] || 0;
    return countB - countA; // Descending order
  });

  const settingsItems = [
    { icon: 'sparkles', label: 'AI Assistant', screen: 'AIAssistant', badge: null },
    { icon: 'link-outline', label: 'Integrations', screen: 'Integration', badge: null },
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
        colors={['rgba(201, 169, 110, 0.3)', '#000000']}  // Gold to black gradient with reduced opacity
        locations={[0, 0.5]}  // Top to middle
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
        <HomeHeader
          unreadNotifications={unreadNotifications}
          notificationPulse={notificationPulse}
          onMenuPress={showLeftPanel}
          onNotificationsPress={() => navigation.navigate('NotificationFeed')}
        />

        {/* Avatar Section */}
        <AvatarSection
          user={user}
          robotState={robotState}
          avatarPulse={avatarPulse}
          waveformBars={waveformBars}
          avatarLoadFailed={avatarLoadFailed}
          greeting={greeting}
          useReadyPlayerMe={USE_READY_PLAYER_ME}
          avatarUrl={user?.assistantProfileImage || AVATAR_URL}
          lottieRef={lottieRef}
          onAvatarPress={handleAvatarTap}
          onAvatarLongPress={() => navigation.navigate('AIAssistant')}
          onAvatarError={() => setAvatarLoadFailed(true)}
          getRobotAnimation={getRobotAnimation}
        />

        {/* Bottom Navigation */}
        <BottomNav
          user={user}
          pendingCount={pendingCount}
          arrowOpacity={arrowOpacity}
          onSettingsPress={showLeftPanel}
          onSettingsLongPress={() => navigation.navigate('PrivacySecurity')}
          onDashboardPress={showRightPanel}
          onDashboardLongPress={() => navigation.navigate('Tasks')}
          onMicPress={startQuickVoiceInput}
        />

        {/* Floating Widget Button */}
        <TouchableOpacity
          style={styles.floatingWidget}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            showQuickActions();
          }}
          activeOpacity={0.8}
          accessibilityLabel="Quick actions"
          accessibilityHint="Open quick actions menu for shortcuts"
          accessibilityRole="button"
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
                      // Track action usage
                      trackActionUsage(action.id);

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
                    {/* Most used indicator for top action */}
                    {index === 0 && actionUsageCount[action.id] && actionUsageCount[action.id] > 0 && (
                      <View style={styles.mostUsedBadge}>
                        <Text style={styles.mostUsedText}>Most Used</Text>
                      </View>
                    )}
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

      {/* Voice Conversation Overlay */}
      {voiceState.conversationActive && (
        <Animated.View
          style={[
            styles.conversationOverlay,
            { opacity: conversationOverlayOpacity }
          ]}
        >
          {/* Animated pulsing background */}
          <Animated.View
            style={[
              styles.conversationBackground,
              { transform: [{ scale: conversationBackgroundPulse }] }
            ]}
          >
            <LinearGradient
              colors={['rgba(201, 169, 110, 0.15)', 'rgba(201, 169, 110, 0.05)', 'rgba(0, 0, 0, 0.8)']}
              locations={[0, 0.5, 1]}
              style={styles.conversationGradient}
            />
          </Animated.View>

          {/* Conversation status indicator */}
          <View style={styles.conversationStatusContainer}>
            <View style={styles.conversationStatus}>
              {voiceState.isRecording && (
                <>
                  <View style={styles.recordingPulse} />
                  <Ionicons name="mic" size={24} color="#C9A96E" />
                  <Text style={styles.conversationStatusText}>Listening...</Text>
                </>
              )}
              {voiceState.isTranscribing && (
                <>
                  <ActivityIndicator color="#C9A96E" size="small" />
                  <Text style={styles.conversationStatusText}>Processing...</Text>
                </>
              )}
              {voiceState.isPlaying && (
                <>
                  <Ionicons name="volume-high" size={24} color="#C9A96E" />
                  <Text style={styles.conversationStatusText}>Speaking...</Text>
                </>
              )}
            </View>

            {/* Control buttons */}
            <View style={styles.conversationControls}>
              {voiceState.isRecording && (
                <TouchableOpacity
                  style={styles.stopRecordingButton}
                  onPress={stopRecording}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#C9A96E', '#E5C794']}
                    style={styles.stopRecordingGradient}
                  >
                    <Ionicons name="stop" size={28} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {(voiceState.isPlaying || (!voiceState.isRecording && !voiceState.isTranscribing)) && (
                <TouchableOpacity
                  style={styles.nextTurnButton}
                  onPress={() => {
                    if (!voiceState.isRecording && !voiceState.isTranscribing) {
                      startQuickVoiceInput();
                    }
                  }}
                  disabled={voiceState.isTranscribing}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#34C759', '#28A745']}
                    style={styles.nextTurnGradient}
                  >
                    <Ionicons name="mic" size={28} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.endConversationButton}
                onPress={endConversation}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FF4757', '#FF6B7A']}
                  style={styles.endConversationGradient}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 40,      // Shift avatar upward
  },
  greetingContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 15,
  },
  greetingTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  greetingName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  greetingContext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#C9A96E',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    width: width * 0.95,  // Increased from 0.75 - bigger avatar
    height: 480,          // Increased from 380 - taller avatar
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  characterAnimation: {
    width: width * 0.95,
    height: 480,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackGradient: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C9A96E',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  waveformContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  waveformBar: {
    position: 'absolute',
    width: 4,
    height: 60,
    backgroundColor: '#C9A96E',
    borderRadius: 2,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
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
  wakeWordContainerBottom: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 15,
  },
  wakeWordPrompt: {
    fontSize: 16,          // Increased from 13
    fontWeight: '500',     // Increased weight
    color: '#FFFFFF',      // White for better visibility
    textAlign: 'center',
    marginBottom: 8,       // More spacing
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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

  // Bottom Navigation Container
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomNavGradient: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  // Navigation Buttons
  navButtonLeft: {
    position: 'absolute',
    left: -28,  // 40% cut off (button width is 70px)
    bottom: 80,
    width: 70,
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  navButtonRight: {
    position: 'absolute',
    right: -28,  // 40% cut off (button width is 70px)
    bottom: 80,
    width: 70,
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  navButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonGradientLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  navButtonGradientRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  dashboardBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4757',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  dashboardBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Floating Widget Button
  floatingWidget: {
    position: 'absolute',
    bottom: height * 0.3 + 20, // Above the 30% bottom nav container
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
    position: 'relative',
  },
  quickActionListText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  usageCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C9A96E',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#2A2A2A',
  },
  usageCountText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
  mostUsedBadge: {
    backgroundColor: 'rgba(201, 169, 110, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  mostUsedText: {
    color: '#C9A96E',
    fontSize: 11,
    fontWeight: '600',
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

  // Voice Conversation Overlay Styles
  conversationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  conversationGradient: {
    flex: 1,
  },
  conversationStatusContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  conversationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)',
    marginBottom: 30,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  conversationStatusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C9A96E',
    letterSpacing: 0.5,
  },
  recordingPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4757',
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  conversationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stopRecordingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  stopRecordingGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextTurnButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  nextTurnGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endConversationButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  endConversationGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
