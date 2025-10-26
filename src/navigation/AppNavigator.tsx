import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { voiceService } from '../services/voiceService';

// Onboarding Screens
import SplashScreen from '../screens/SplashScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import AuthOptionsScreen from '../screens/AuthOptionsScreen';
import EmailSignUpScreen from '../screens/EmailSignUpScreen';
import CongratulationsScreen from '../screens/CongratulationsScreen';
import UserProfileSetupScreen from '../screens/UserProfileSetupScreen';
import AssistantNamingScreen from '../screens/AssistantNamingScreen';
import AssistantGenderScreen from '../screens/AssistantGenderScreen';
import AssistantConversationScreen from '../screens/AssistantConversationScreen';
import ChatScreen from '../screens/ChatScreen';
import AssistantPersonalizationScreen from '../screens/AssistantPersonalizationScreen';

// Agent Setup Screens
import AgentPersonalityScreen from '../screens/AgentPersonalityScreen';
import AgentAvailabilityScreen from '../screens/AgentAvailabilityScreen';
import AgentTaskCategoriesScreen from '../screens/AgentTaskCategoriesScreen';
import AgentLearningScreen from '../screens/AgentLearningScreen';
import AgentPrivacyScreen from '../screens/AgentPrivacyScreen';
import AssistantProfileImageScreen from '../screens/AssistantProfileImageScreen';
import AgentCreativityScreen from '../screens/AgentCreativityScreen';
import AgentCommunicationStyleScreen from '../screens/AgentCommunicationStyleScreen';
import AgentProactivityScreen from '../screens/AgentProactivityScreen';
import SpecializedCapabilityScreen from '../screens/SpecializedCapabilityScreen';

// Authentication Screens
import WelcomeAuthScreen from '../screens/WelcomeAuthScreen';
import SignInScreen from '../screens/SignInScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordOTPScreen from '../screens/ResetPasswordOTPScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import TermsPrivacyScreen from '../screens/TermsPrivacyScreen';
import UserDetailsScreen from '../screens/UserDetailsScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ConversationScreen from '../screens/ConversationScreen';
import TasksScreen from '../screens/TasksScreen';
import RemindersScreen from '../screens/RemindersScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Settings Screens
import NotificationsScreen from '../screens/NotificationsScreen';
import VoiceAssistantScreen from '../screens/VoiceAssistantScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import ChangePasscodeScreen from '../screens/ChangePasscodeScreen';
import TwoFactorAuthScreen from '../screens/TwoFactorAuthScreen';
import ActiveSessionsScreen from '../screens/ActiveSessionsScreen';
import IntegrationScreen from '../screens/IntegrationsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import NotificationFeedScreen from '../screens/NotificationFeedScreen';
import EmailManagementScreen from '../screens/EmailManagementScreen';
import MeetingPrepScreen from '../screens/MeetingPrepScreen';
import DailyBriefingScreen from '../screens/DailyBriefingScreen';
import QuickCaptureScreen from '../screens/QuickCaptureScreen';
import SmartSearchScreen from '../screens/SmartSearchScreen';
import DocumentIntelligenceScreen from '../screens/DocumentIntelligenceScreen';
import FinancialDashboardScreen from '../screens/FinancialDashboardScreen';
import TeamManagementScreen from '../screens/TeamManagementScreen';
import AddTaskScreen from '../screens/AddTaskScreen';
import AddReminderScreen from '../screens/AddReminderScreen';
import AddEventScreen from '../screens/AddEventScreen';
import QuickNoteScreen from '../screens/QuickNoteScreen';

// Email Screens
import EmailIntegrationScreen from '../screens/EmailIntegrationScreen';
import EmailListScreen from '../screens/EmailListScreen';
import EmailDetailScreen from '../screens/EmailDetailScreen';
import EmailComposeScreen from '../screens/EmailComposeScreen';
import EmailAccountsScreen from '../screens/EmailAccountsScreen';

// PA Voice Interaction
import PAVoiceInteractionScreen from '../screens/PAVoiceInteractionScreen';

// Detail Screens
import TaskDetailScreen from '../screens/TaskDetailScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import ReminderDetailScreen from '../screens/ReminderDetailScreen';

// Components

// Types
import { RootStackParamList, TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const SiriWaveButton = ({ focused, isListening, isProcessing }: { focused: boolean; isListening?: boolean; isProcessing?: boolean }) => {

  const smokeAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const rotateAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const gradientRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (focused || isListening || isProcessing) {
      // Smoke-like wave animations inside the ball
      const smokeLoops = smokeAnimations.map((anim, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 3000 + index * 500,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 2000 + index * 300,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              useNativeDriver: true,
            })
          ])
        )
      );

      smokeLoops.forEach((loop, index) => {
        setTimeout(() => loop.start(), index * 400);
      });

      // Multiple rotation animations for different smoke layers
      const rotateLoops = rotateAnimations.map((anim, index) =>
        Animated.loop(
          Animated.timing(anim, {
            toValue: 1,
            duration: 15000 + index * 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        )
      );

      rotateLoops.forEach(loop => loop.start());

      // Gradient border rotation
      const gradientLoop = Animated.loop(
        Animated.timing(gradientRotation, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      gradientLoop.start();

      // Gentle pulse animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
            useNativeDriver: true,
          })
        ])
      );
      pulseLoop.start();

      // Outer glow animation
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          })
        ])
      );
      glowLoop.start();

      return () => {
        smokeLoops.forEach(loop => loop.stop());
        rotateLoops.forEach(loop => loop.stop());
        gradientLoop.stop();
        pulseLoop.stop();
        glowLoop.stop();
      };
    } else {
      smokeAnimations.forEach(anim => anim.setValue(0));
      rotateAnimations.forEach(anim => anim.setValue(0));
      gradientRotation.setValue(0);
      pulseAnimation.setValue(1);
      glowAnimation.setValue(0);
    }
  }, [focused, isListening, isProcessing]);

  const renderSmokeWaves = () => {
    let colors;
    if (isListening) {
      // Vibrant listening colors (red/pink theme)
      colors = [
        'rgba(255, 71, 87, 0.6)',
        'rgba(255, 107, 53, 0.5)',
        'rgba(236, 72, 153, 0.4)',
        'rgba(255, 20, 147, 0.3)',
        'rgba(255, 69, 0, 0.5)',
        'rgba(220, 20, 60, 0.4)',
        'rgba(255, 105, 180, 0.3)',
        'rgba(255, 99, 132, 0.4)',
        'rgba(255, 160, 122, 0.3)',
        'rgba(255, 182, 193, 0.5)',
      ];
    } else if (isProcessing) {
      // Processing colors (orange theme)
      colors = [
        'rgba(255, 107, 53, 0.6)',
        'rgba(255, 165, 0, 0.5)',
        'rgba(255, 140, 0, 0.4)',
        'rgba(255, 69, 0, 0.3)',
        'rgba(255, 215, 0, 0.5)',
        'rgba(255, 160, 122, 0.4)',
        'rgba(255, 218, 185, 0.3)',
        'rgba(255, 228, 181, 0.4)',
        'rgba(255, 99, 71, 0.3)',
        'rgba(255, 127, 80, 0.5)',
      ];
    } else {
      // Default colors
      colors = [
        'rgba(255, 255, 255, 0.4)',
        'rgba(102, 126, 234, 0.3)',
        'rgba(147, 51, 234, 0.25)',
        'rgba(236, 72, 153, 0.2)',
        'rgba(59, 130, 246, 0.3)',
        'rgba(16, 185, 129, 0.25)',
        'rgba(245, 158, 11, 0.2)',
        'rgba(139, 92, 246, 0.25)',
        'rgba(34, 197, 94, 0.2)',
        'rgba(168, 85, 247, 0.3)',
      ];
    }

    return smokeAnimations.map((anim, index) => {
      const translateX = anim.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [
          -12 + Math.sin(index * 1.2) * 6,
          Math.cos(index * 0.8) * 15,
          Math.sin(index * 1.5) * 10,
          18 + Math.cos(index * 0.9) * 8
        ],
      });

      const translateY = anim.interpolate({
        inputRange: [0, 0.25, 0.6, 0.85, 1],
        outputRange: [
          15 + Math.cos(index * 0.7) * 4,
          Math.sin(index * 1.3) * 12,
          -8 + Math.cos(index * 1.1) * 8,
          Math.sin(index * 0.9) * 15,
          -20 + Math.cos(index * 1.4) * 6
        ],
      });

      const scale = anim.interpolate({
        inputRange: [0, 0.2, 0.5, 0.8, 1],
        outputRange: [0.1, 0.4, 0.9, 1.2, 0.2],
      });

      const opacity = anim.interpolate({
        inputRange: [0, 0.1, 0.3, 0.7, 0.9, 1],
        outputRange: [0, 0.3, 0.8, 0.6, 0.2, 0],
      });

      const rotate = rotateAnimations[index % 4].interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', index % 2 === 0 ? '180deg' : '-180deg'],
      });

      const skewX = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['0deg', `${Math.sin(index * 0.5) * 15}deg`, '0deg'],
      });

      // Smoke-like irregular shapes
      return (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            transform: [
              { translateX },
              { translateY },
              { scale },
              { rotate },
              { skewX }
            ],
            opacity,
          }}
        >
          {/* Main smoke blob */}
          <View style={{
            width: 20 + index * 1.5,
            height: 15 + index * 1.2,
            backgroundColor: colors[index],
            borderRadius: 15 + index * 2,
            position: 'relative',
          }}>
            {/* Wispy smoke trails */}
            <View style={{
              position: 'absolute',
              top: -6 + Math.sin(index) * 3,
              left: 3 + Math.cos(index) * 4,
              width: 12 + index,
              height: 8 + index * 0.8,
              backgroundColor: colors[index],
              borderRadius: 10,
              opacity: 0.7,
            }} />
            <View style={{
              position: 'absolute',
              top: 2 + Math.cos(index * 1.5) * 2,
              right: -2 + Math.sin(index * 0.8) * 3,
              width: 8 + index * 0.6,
              height: 6 + index * 0.5,
              backgroundColor: colors[index],
              borderRadius: 8,
              opacity: 0.5,
            }} />
            <View style={{
              position: 'absolute',
              bottom: -4 + Math.sin(index * 1.2) * 2,
              left: 6 + Math.cos(index * 0.6) * 3,
              width: 6 + index * 0.4,
              height: 4 + index * 0.3,
              backgroundColor: colors[index],
              borderRadius: 6,
              opacity: 0.4,
            }} />
          </View>
        </Animated.View>
      );
    });
  };

  const glowColor = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isProcessing ? 'rgba(255, 107, 53, 0.3)' :
      isListening ? 'rgba(255, 71, 87, 0.3)' : 'rgba(102, 126, 234, 0.2)',
      isProcessing ? 'rgba(255, 107, 53, 0.6)' :
      isListening ? 'rgba(255, 71, 87, 0.6)' : 'rgba(147, 51, 234, 0.4)'
    ],
  });

  const glowSize = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isListening || isProcessing ? 70 : 50,
      isListening || isProcessing ? 100 : 70
    ],
  });

  const rotateInterpolate = gradientRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: isListening || isProcessing ? 100 : 80,
      height: isListening || isProcessing ? 100 : 80
    }}>
      {/* Outer glow effect */}
      {(focused || isListening || isProcessing) && (
        <Animated.View
          style={{
            position: 'absolute',
            width: glowSize,
            height: glowSize,
            borderRadius: isListening || isProcessing ? 50 : 35,
            backgroundColor: glowColor,
            opacity: isListening || isProcessing ? 0.4 : 0.2,
          }}
        />
      )}

      {/* Animated gradient border */}
      {(focused || isListening || isProcessing) && (
        <Animated.View
          style={{
            position: 'absolute',
            width: isListening || isProcessing ? 64 : 54,
            height: isListening || isProcessing ? 64 : 54,
            borderRadius: isListening || isProcessing ? 32 : 27,
            transform: [{ rotate: rotateInterpolate }],
          }}
        >
          <LinearGradient
            colors={
              isListening ?
                ['#FF4757', '#FF3742', '#FF6B35', '#F7931E', '#FF4757', '#FF3742', '#FF4757'] :
              isProcessing ?
                ['#FF6B35', '#F7931E', '#FFB347', '#FFA500', '#FF8C00', '#FF7F00', '#FF6B35'] :
                ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: isListening || isProcessing ? 64 : 54,
              height: isListening || isProcessing ? 64 : 54,
              borderRadius: isListening || isProcessing ? 32 : 27,
              padding: 2,
            }}
          >
            <View style={{
              width: isListening || isProcessing ? 60 : 50,
              height: isListening || isProcessing ? 60 : 50,
              borderRadius: isListening || isProcessing ? 30 : 25,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            }} />
          </LinearGradient>
        </Animated.View>
      )}

      {/* Main ball container */}
      <Animated.View
        style={{
          width: isListening || isProcessing ? 60 : 50,
          height: isListening || isProcessing ? 60 : 50,
          backgroundColor: isProcessing ? 'rgba(255, 107, 53, 0.4)' :
                          isListening ? 'rgba(255, 71, 87, 0.4)' :
                          focused ? 'rgba(0, 0, 0, 0.3)' : 'rgba(102, 126, 234, 0.8)',
          borderRadius: isListening || isProcessing ? 30 : 25,
          borderWidth: (focused || isListening || isProcessing) ? 0 : 1,
          borderColor: (focused || isListening || isProcessing) ? 'transparent' : 'rgba(102, 126, 234, 0.6)',
          transform: [{
            scale: isListening || isProcessing ?
              pulseAnimation.interpolate({
                inputRange: [1, 1.05],
                outputRange: [1.1, 1.25],
              }) :
              pulseAnimation
          }],
          elevation: 8,
          shadowColor: '#FFFFFF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          position: 'relative',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Smoke waves inside the ball */}
        {focused && renderSmokeWaves()}

        {/* Glass effect overlay */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 25,
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}>
          <View style={{
            position: 'absolute',
            top: 6,
            left: 6,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          }} />
        </View>
      </Animated.View>
    </View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const currentRoute = state.routes[state.index];
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Safety timeout to reset states if something goes wrong
  useEffect(() => {
    if (isListening || isProcessing) {
      const timeout = setTimeout(() => {
        setIsListening(false);
        setIsProcessing(false);
      }, 10000); // 10 second safety timeout

      return () => clearTimeout(timeout);
    }
  }, [isListening, isProcessing]);

  const handleVoiceButtonPress = async () => {
    if (isListening) {
      // Stop listening
      await voiceService.stopListening();
      setIsListening(false);
      setIsProcessing(false);
    } else {
      // Start listening
      setIsListening(true);
      setIsProcessing(false);

      const success = await voiceService.startListening(
        (text) => {
          console.log('Voice command received:', text);
          setIsListening(false);
          setIsProcessing(true);

          // Process the command and navigate
          processVoiceCommand(text);
        },
        (error) => {
          console.error('Voice error:', error);
          setIsListening(false);
          setIsProcessing(false);
        }
      );

      if (!success) {
        setIsListening(false);
      }
    }
  };

  const processVoiceCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();

    // Wait a moment to show processing state
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Navigation commands
      if (lowerCommand.includes('email') || lowerCommand.includes('mail')) {
        await voiceService.speak('Opening email management');
        navigation.navigate('EmailManagement');
      } else if (lowerCommand.includes('meeting') || lowerCommand.includes('schedule')) {
        await voiceService.speak('Opening meeting preparation');
        navigation.navigate('MeetingPrep');
      } else if (lowerCommand.includes('briefing') || lowerCommand.includes('today')) {
        await voiceService.speak('Opening daily briefing');
        navigation.navigate('DailyBriefing');
      } else if (lowerCommand.includes('task') || lowerCommand.includes('todo')) {
        await voiceService.speak('Opening tasks');
        navigation.navigate('Tasks');
      } else if (lowerCommand.includes('financial') || lowerCommand.includes('portfolio')) {
        await voiceService.speak('Opening financial dashboard');
        navigation.navigate('FinancialDashboard');
      } else if (lowerCommand.includes('team') || lowerCommand.includes('manage')) {
        await voiceService.speak('Opening team management');
        navigation.navigate('TeamManagement');
      } else if (lowerCommand.includes('document') || lowerCommand.includes('analyze')) {
        await voiceService.speak('Opening document intelligence');
        navigation.navigate('DocumentIntelligence');
      } else if (lowerCommand.includes('search') || lowerCommand.includes('find')) {
        await voiceService.speak('Opening smart search');
        navigation.navigate('SmartSearch');
      } else if (lowerCommand.includes('subscription') || lowerCommand.includes('plan')) {
        await voiceService.speak('Opening subscription management');
        navigation.navigate('Profile');
      } else if (lowerCommand.includes('home')) {
        await voiceService.speak('Going to home');
        navigation.navigate('Home');
      } else if (lowerCommand.includes('analytics') || lowerCommand.includes('reports')) {
        await voiceService.speak('Opening analytics');
        navigation.navigate('Analytics');
      } else {
        // General AI response
        await voiceService.speak('I understand. How can I assist you with your executive tasks today?');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      await voiceService.speak('Sorry, I had trouble with that command.');
    }

    setIsProcessing(false);
  };

  // Don't show tab bar on Profile/Settings screen
  if (currentRoute?.name === 'Profile') {
    return null;
  }

  return (
    <View style={{
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
    }}>
      <LinearGradient
        colors={['rgba(10, 10, 10, 0.95)', 'rgba(0, 0, 0, 0.98)']}
        style={{
          flexDirection: 'row',
          paddingTop: 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Home */}
        <TouchableOpacity
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.navigate('Home')}
        >
          <View style={{ alignItems: 'center' }}>
            <Ionicons
              name={currentRoute?.name === 'Home' ? 'list' : 'list-outline'}
              size={24}
              color={currentRoute?.name === 'Home' ? '#FFF' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={{
              fontSize: 10,
              marginTop: 4,
              fontWeight: currentRoute?.name === 'Home' ? '600' : '500',
              color: currentRoute?.name === 'Home' ? '#FFF' : 'rgba(255,255,255,0.5)',
            }}>Home</Text>
          </View>
        </TouchableOpacity>

        {/* Analytics */}
        <TouchableOpacity
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.navigate('Analytics')}
        >
          <View style={{ alignItems: 'center' }}>
            <Ionicons
              name={currentRoute?.name === 'Analytics' ? 'stats-chart' : 'stats-chart-outline'}
              size={24}
              color={currentRoute?.name === 'Analytics' ? '#FFF' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={{
              fontSize: 10,
              marginTop: 4,
              fontWeight: currentRoute?.name === 'Analytics' ? '600' : '500',
              color: currentRoute?.name === 'Analytics' ? '#FFF' : 'rgba(255,255,255,0.5)',
            }}>Analytics</Text>
          </View>
        </TouchableOpacity>

        {/* Voice Button - CENTER */}
        <View style={{ flex: 1, alignItems: 'center', marginTop: -32 }}>
          <TouchableOpacity
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              overflow: 'hidden',
              elevation: 12,
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
            }}
            onPress={handleVoiceButtonPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isListening || isProcessing ? ['#EF4444', '#DC2626'] : ['#3B82F6', '#2563EB']}
              style={{
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons
                  name={isListening ? 'mic' : isProcessing ? 'radio-outline' : 'mic-outline'}
                  size={30}
                  color="#FFF"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Integration */}
        <TouchableOpacity
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.navigate('Integration')}
        >
          <View style={{ alignItems: 'center' }}>
            <Ionicons
              name={currentRoute?.name === 'Integration' ? 'link' : 'link-outline'}
              size={24}
              color={currentRoute?.name === 'Integration' ? '#FFF' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={{
              fontSize: 10,
              marginTop: 4,
              fontWeight: currentRoute?.name === 'Integration' ? '600' : '500',
              color: currentRoute?.name === 'Integration' ? '#FFF' : 'rgba(255,255,255,0.5)',
            }}>Connect</Text>
          </View>
        </TouchableOpacity>

        {/* Chat */}
        <TouchableOpacity
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.navigate('Chat')}
        >
          <View style={{ alignItems: 'center' }}>
            <Ionicons
              name={currentRoute?.name === 'Chat' ? 'document-text' : 'document-text-outline'}
              size={24}
              color={currentRoute?.name === 'Chat' ? '#FFF' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={{
              fontSize: 10,
              marginTop: 4,
              fontWeight: currentRoute?.name === 'Chat' ? '600' : '500',
              color: currentRoute?.name === 'Chat' ? '#FFF' : 'rgba(255,255,255,0.5)',
            }}>Notes</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const TabNavigator = () => {
  const theme = useSelector((state: RootState) => state.theme.theme);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: theme.textSecondary,
        headerStyle: {
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <SiriWaveButton focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <View style={{
              width: 20,
              height: 20,
              position: 'relative'
            }}>
              <View style={{
                width: 20,
                height: 20,
                borderWidth: 2,
                borderColor: color,
                borderRadius: 10,
                position: 'absolute'
              }} />
              <View style={{
                position: 'absolute',
                top: 4,
                left: 4,
                width: 12,
                height: 2,
                backgroundColor: color
              }} />
              <View style={{
                position: 'absolute',
                top: 8,
                left: 4,
                width: 8,
                height: 2,
                backgroundColor: color
              }} />
              <View style={{
                position: 'absolute',
                top: 12,
                left: 4,
                width: 10,
                height: 2,
                backgroundColor: color
              }} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Conversation"
        component={ConversationScreen}
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <View style={{
              width: 22,
              height: 18,
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: color,
              borderRadius: 10,
              position: 'relative'
            }}>
              <View style={{
                position: 'absolute',
                bottom: -6,
                left: 4,
                width: 6,
                height: 6,
                backgroundColor: color,
                borderRadius: 3,
                transform: [{ rotate: '45deg' }]
              }} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const OnboardingNavigator = () => {
  // Determine the initial route based on authentication status
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const user = useSelector((state: RootState) => state.user.user);

  // If user is authenticated but hasn't completed onboarding, skip initial screens
  // and go to the appropriate onboarding step
  const initialRoute = isAuthenticated ? 'AssistantNaming' : 'LanguageSelection';

  console.log('🔄 [DEBUG] OnboardingNavigator initialRoute:', {
    initialRoute,
    isAuthenticated,
    userExists: !!user,
    userId: user?.id
  });

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back
      }}
    >
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />

      {/* New streamlined flow */}
      <Stack.Screen name="WelcomeAuth" component={WelcomeAuthScreen} />
      <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
      <Stack.Screen name="AuthOptions" component={AuthOptionsScreen} />
      <Stack.Screen name="SignUp" component={EmailSignUpScreen} />
      <Stack.Screen name="UserDetails" component={UserDetailsScreen} />

      {/* Auth Screens */}
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPasswordOTP" component={ResetPasswordOTPScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

      {/* Post-registration flow */}
      <Stack.Screen name="Congratulations" component={CongratulationsScreen} />
      <Stack.Screen name="UserProfileSetup" component={UserProfileSetupScreen} />
      <Stack.Screen name="AssistantNaming" component={AssistantNamingScreen} />
      <Stack.Screen name="AssistantGender" component={AssistantGenderScreen} />
      <Stack.Screen name="AssistantConversation" component={AssistantConversationScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="AssistantPersonalization" component={AssistantPersonalizationScreen} />

      {/* Agent Setup Screens */}
      <Stack.Screen name="AgentPersonality" component={AgentPersonalityScreen} />
      <Stack.Screen name="AgentAvailability" component={AgentAvailabilityScreen} />
      <Stack.Screen name="AgentTaskCategories" component={AgentTaskCategoriesScreen} />
      <Stack.Screen name="AgentLearning" component={AgentLearningScreen} />
      <Stack.Screen name="AgentPrivacy" component={AgentPrivacyScreen} />
      <Stack.Screen name="AssistantProfileImage" component={AssistantProfileImageScreen} />

    </Stack.Navigator>
  );
};

const MainAppNavigator = () => {
  const theme = useSelector((state: RootState) => state.theme.theme);

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back to onboarding
      }}
    >
      {/* Bottom tab navigation removed - HomeScreen has integrated swipeable panels */}
      {/* <Stack.Screen name="Dashboard" component={TabNavigator} /> */}
      <Stack.Screen
        name="Conversation"
        component={ConversationScreen}
        options={{
          headerShown: true,
          title: 'Yo!',
          headerStyle: {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
          headerTintColor: theme.text,
          gestureEnabled: true, // Allow back gesture within main app
        }}
      />

      {/* Individual Screens (for direct navigation) */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="VoiceAssistant" component={VoiceAssistantScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePasscode" component={ChangePasscodeScreen} />
      <Stack.Screen name="TwoFactorAuth" component={TwoFactorAuthScreen} />
      <Stack.Screen name="ActiveSessions" component={ActiveSessionsScreen} />
      <Stack.Screen name="AssistantProfileImage" component={AssistantProfileImageScreen} />
      <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
      <Stack.Screen name="PAVoiceInteraction" component={PAVoiceInteractionScreen} />
      <Stack.Screen name="AgentCreativity" component={AgentCreativityScreen} />
      <Stack.Screen name="AgentCommunicationStyle" component={AgentCommunicationStyleScreen} />
      <Stack.Screen name="AgentProactivity" component={AgentProactivityScreen} />
      <Stack.Screen name="SpecializedCapability" component={SpecializedCapabilityScreen} />
      <Stack.Screen name="Integration" component={IntegrationScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="NotificationFeed" component={NotificationFeedScreen} />
      <Stack.Screen name="EmailManagement" component={EmailManagementScreen} />
      <Stack.Screen name="MeetingPrep" component={MeetingPrepScreen} />
      <Stack.Screen name="DailyBriefing" component={DailyBriefingScreen} />
      <Stack.Screen name="QuickCapture" component={QuickCaptureScreen} />
      <Stack.Screen name="SmartSearch" component={SmartSearchScreen} />
      <Stack.Screen name="DocumentIntelligence" component={DocumentIntelligenceScreen} />
      <Stack.Screen name="FinancialDashboard" component={FinancialDashboardScreen} />
      <Stack.Screen name="TeamManagement" component={TeamManagementScreen} />
      <Stack.Screen name="AddTask" component={AddTaskScreen} />
      <Stack.Screen name="AddReminder" component={AddReminderScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} />
      <Stack.Screen name="QuickNote" component={QuickNoteScreen} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} />

      {/* Email Screens */}
      <Stack.Screen name="EmailIntegration" component={EmailIntegrationScreen} />
      <Stack.Screen name="EmailList" component={EmailListScreen} />
      <Stack.Screen name="EmailDetail" component={EmailDetailScreen} />
      <Stack.Screen name="EmailCompose" component={EmailComposeScreen} />
      <Stack.Screen name="EmailAccounts" component={EmailAccountsScreen} />

      {/* Detail Screens */}
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="ReminderDetail" component={ReminderDetailScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const hasCompletedOnboarding = useSelector((state: RootState) => state.user.hasCompletedOnboarding);
  const user = useSelector((state: RootState) => state.user.user);

  // Debug logging for AppNavigator
  console.log('🏠 [DEBUG] AppNavigator render - Redux state:', {
    isAuthenticated,
    hasCompletedOnboarding,
    userExists: !!user,
    userId: user?.id,
    assistantName: user?.assistantName,
    shouldShowMainApp: isAuthenticated && hasCompletedOnboarding,
    navigator: (isAuthenticated && hasCompletedOnboarding) ? 'MainAppNavigator' : 'OnboardingNavigator'
  });

  return (
    <SubscriptionProvider>
      <NavigationContainer>
        {isAuthenticated && hasCompletedOnboarding ? (
          <MainAppNavigator />
        ) : (
          <OnboardingNavigator />
        )}
      </NavigationContainer>
    </SubscriptionProvider>
  );
};

export default AppNavigator;