import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { LinearGradient } from 'expo-linear-gradient';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { voiceService } from '../services/voiceService';

// Onboarding Screens
import SplashScreen from '../screens/SplashScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import PhoneInputScreen from '../screens/PhoneInputScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import EmailInputScreen from '../screens/EmailInputScreen';
import PasswordCreationScreen from '../screens/PasswordCreationScreen';
import CongratulationsScreen from '../screens/CongratulationsScreen';
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

// Authentication Screens
import WelcomeAuthScreen from '../screens/WelcomeAuthScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordOTPScreen from '../screens/ResetPasswordOTPScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import TermsPrivacyScreen from '../screens/TermsPrivacyScreen';
import UserDetailsScreen from '../screens/UserDetailsScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import ConversationScreen from '../screens/ConversationScreen';
import TasksScreen from '../screens/TasksScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Settings Screens
import NotificationsScreen from '../screens/NotificationsScreen';
import VoiceAssistantScreen from '../screens/VoiceAssistantScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import IntegrationScreen from '../screens/IntegrationScreen';
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
      bottom: 0,
      left: 0,
      right: 0,
      height: 120,
      backgroundColor: 'transparent',
      zIndex: 100,
      elevation: 100,
    }}>
      {/* Tab bar with 5 tabs */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        flexDirection: 'row',
        backgroundColor: theme.surface,
        borderTopColor: theme.border,
        borderTopWidth: 0.5,
        paddingBottom: 20,
      }}>
        {/* Home */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => navigation.navigate('Home')}
        >
          <View style={{
            width: 22,
            height: 22,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: currentRoute?.name === 'Home' ? '#FFFFFF' : theme.textSecondary,
            borderRadius: 4,
            position: 'relative'
          }}>
            <View style={{
              position: 'absolute',
              top: 6,
              left: 6,
              width: 6,
              height: 6,
              backgroundColor: currentRoute?.name === 'Home' ? '#FFFFFF' : theme.textSecondary,
              borderRadius: 1
            }} />
          </View>
          <Text style={{
            fontSize: 10,
            marginTop: 2,
            color: currentRoute?.name === 'Home' ? '#FFFFFF' : theme.textSecondary,
          }}>
            Home
          </Text>
        </View>

        {/* Integrations */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => navigation.navigate('Integration')}
        >
          <View style={{
            width: 22,
            height: 22,
            borderWidth: 2,
            borderColor: currentRoute?.name === 'Integration' ? '#FFFFFF' : theme.textSecondary,
            borderRadius: 11,
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <View style={{
              width: 8,
              height: 8,
              borderWidth: 1,
              borderColor: currentRoute?.name === 'Integration' ? '#FFFFFF' : theme.textSecondary,
              borderRadius: 4,
            }} />
          </View>
          <Text style={{
            fontSize: 10,
            marginTop: 2,
            color: currentRoute?.name === 'Integration' ? '#FFFFFF' : theme.textSecondary,
          }}>
            Integrations
          </Text>
        </View>

        {/* Center space for floating button */}
        <View style={{ flex: 1 }} />

        {/* Analytics */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => navigation.navigate('Analytics')}
        >
          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'center',
            width: 22,
            height: 20
          }}>
            <View style={{
              width: 3,
              height: 12,
              backgroundColor: currentRoute?.name === 'Analytics' ? '#FFFFFF' : theme.textSecondary,
              borderRadius: 1.5,
              marginRight: 2
            }} />
            <View style={{
              width: 3,
              height: 16,
              backgroundColor: currentRoute?.name === 'Analytics' ? '#FFFFFF' : theme.textSecondary,
              borderRadius: 1.5,
              marginRight: 2
            }} />
            <View style={{
              width: 3,
              height: 10,
              backgroundColor: currentRoute?.name === 'Analytics' ? '#FFFFFF' : theme.textSecondary,
              borderRadius: 1.5,
              marginRight: 2
            }} />
            <View style={{
              width: 3,
              height: 18,
              backgroundColor: currentRoute?.name === 'Analytics' ? '#FFFFFF' : theme.textSecondary,
              borderRadius: 1.5
            }} />
          </View>
          <Text style={{
            fontSize: 10,
            marginTop: 2,
            color: currentRoute?.name === 'Analytics' ? '#FFFFFF' : theme.textSecondary,
          }}>
            Analytics
          </Text>
        </View>

        {/* Settings */}
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onStartShouldSetResponder={() => true}
          onResponderGrant={() => navigation.navigate('Profile')}
        >
          <View style={{
            width: 20,
            height: 20,
            position: 'relative'
          }}>
            <View style={{
              width: 20,
              height: 20,
              borderWidth: 2,
              borderColor: currentRoute?.name === 'Profile' ? '#FFFFFF' : theme.textSecondary,
              borderRadius: 10,
              position: 'absolute'
            }} />
            <View style={{
              position: 'absolute',
              top: 4,
              left: 4,
              width: 12,
              height: 2,
              backgroundColor: currentRoute?.name === 'Profile' ? '#FFFFFF' : theme.textSecondary
            }} />
            <View style={{
              position: 'absolute',
              top: 8,
              left: 4,
              width: 8,
              height: 2,
              backgroundColor: currentRoute?.name === 'Profile' ? '#FFFFFF' : theme.textSecondary
            }} />
            <View style={{
              position: 'absolute',
              top: 12,
              left: 4,
              width: 10,
              height: 2,
              backgroundColor: currentRoute?.name === 'Profile' ? '#FFFFFF' : theme.textSecondary
            }} />
          </View>
          <Text style={{
            fontSize: 10,
            marginTop: 2,
            color: currentRoute?.name === 'Profile' ? '#FFFFFF' : theme.textSecondary,
          }}>
            Settings
          </Text>
        </View>
      </View>

      {/* Center floating Listen button */}
      <View style={{
        position: 'absolute',
        bottom: 15,
        left: '50%',
        marginLeft: isListening || isProcessing ? -50 : -40,
        width: isListening || isProcessing ? 100 : 80,
        height: isListening || isProcessing ? 100 : 80,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 101,
        elevation: 101,
      }}>
        <TouchableOpacity
          style={{
            width: isListening || isProcessing ? 100 : 80,
            height: isListening || isProcessing ? 100 : 80,
            borderRadius: isListening || isProcessing ? 50 : 40,
            backgroundColor: theme.surface,
            shadowColor: isListening ? '#FF4757' : isProcessing ? '#FF6B35' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isListening || isProcessing ? 0.25 : 0.15,
            shadowRadius: isListening || isProcessing ? 12 : 8,
            elevation: isListening || isProcessing ? 12 : 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={handleVoiceButtonPress}
        >
          <SiriWaveButton focused={true} isListening={isListening} isProcessing={isProcessing} />
        </TouchableOpacity>
      </View>
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
  return (
    <Stack.Navigator
      initialRouteName="LanguageSelection"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back
      }}
    >
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />

      {/* Welcome/Auth Choice Screen */}
      <Stack.Screen name="WelcomeAuth" component={WelcomeAuthScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPasswordOTP" component={ResetPasswordOTPScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="TermsPrivacy" component={TermsPrivacyScreen} />
      <Stack.Screen name="UserDetails" component={UserDetailsScreen} />

      {/* Original registration flow */}
      <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="EmailInput" component={EmailInputScreen} />
      <Stack.Screen name="PasswordCreation" component={PasswordCreationScreen} />
      <Stack.Screen name="Congratulations" component={CongratulationsScreen} />
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

    </Stack.Navigator>
  );
};

const MainAppNavigator = () => {
  const theme = useSelector((state: RootState) => state.theme.theme);

  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back to onboarding
      }}
    >
      <Stack.Screen name="Dashboard" component={TabNavigator} />
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

      {/* Individual Tab Screens (for direct navigation) */}
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Tasks" component={TasksScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="VoiceAssistant" component={VoiceAssistantScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="AIAssistant" component={AIAssistantScreen} />
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