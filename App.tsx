import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store, persistor } from './src/store';
import { RootState } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import BiometricLoginGate from './src/components/BiometricLoginGate';
import AuthService from './src/services/auth';
import sentryService from './src/services/sentry';
import ConnectionManager from './src/services/connectionManager';
import { wakeWordService } from './src/services/wakeWordService';
import { conversationManager } from './src/services/conversationManager';
import { notificationService } from './src/services/notificationService';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const AppContent: React.FC = () => {
  const isDark = useSelector((state: RootState) => state.theme.isDark);
  const user = useSelector((state: RootState) => state.user.user);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize all services on app start
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing Yo! Personal Assistant App...');

        // Initialize Sentry first for crash reporting
        sentryService.initialize();

        // Initialize connection manager first (includes locale service)
        await ConnectionManager.initialize();
        console.log('✅ Connection Manager initialized');

        // Initialize auth service
        await AuthService.initialize();
        console.log('✅ Auth Service initialized');

        // Initialize notification service (skip in Expo Go)
        // Note: Push notifications don't work in Expo Go (SDK 53+), only in production builds
        try {
          const notificationsEnabled = await notificationService.initialize();
          if (notificationsEnabled) {
            console.log('✅ Notifications enabled');
            console.log('📱 Push token:', notificationService.getExpoPushToken());
          } else {
            console.log('⚠️ Notifications not enabled - user may have denied permission or running in Expo Go');
          }
        } catch (error) {
          console.log('ℹ️ Push notifications unavailable in Expo Go - will work in production build');
        }

        // Get initial connection diagnostics
        const diagnostics = await ConnectionManager.getDiagnostics();
        console.log('📊 App initialization diagnostics:', diagnostics);

        setIsInitialized(true);
        console.log('✅ App initialization completed successfully');

        // Hide splash screen after initialization
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
        // Don't prevent app from loading - show error but continue
        setIsInitialized(true);

        // Hide splash screen even on error
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      ConnectionManager.destroy();
    };
  }, []);

  // Initialize wake word detection when user is logged in
  useEffect(() => {
    const initializeWakeWord = async () => {
      if (user && user.assistantName) {
        try {
          console.log('🎤 Initializing wake word detection...');

          // Check if running in Expo Go (native modules not available)
          const isExpoGo = !__DEV__ || typeof require('react-native').NativeModules.RNVoice === 'undefined';

          if (isExpoGo) {
            console.warn('⚠️ Wake word detection requires a development build. Skipping in Expo Go.');
            console.log('ℹ️ To enable voice features, create a development build with: eas build --profile development');
            return;
          }

          // Request permissions first
          const hasPermission = await wakeWordService.requestPermissions();
          if (!hasPermission) {
            console.warn('⚠️ Microphone permission not granted');
            return;
          }

          // Initialize wake word service with assistant name
          await wakeWordService.initialize(user.assistantName);

          // Set up callback for when wake word is detected
          wakeWordService.onWakeWordDetected(async () => {
            console.log('✅ Wake word detected! Starting conversation...');

            // Stop wake word detection while conversation is active
            await wakeWordService.stopListening();

            // Start conversation with the PA
            const started = await conversationManager.startConversation(user.assistantName || 'Assistant');

            if (started) {
              console.log('💬 Conversation started successfully');

              // When conversation ends, resume wake word detection
              // This is handled in conversationManager.endConversation() -> wakeWordService.resumeWakeWordDetection()
            }
          });

          // Start listening for wake word
          const started = await wakeWordService.startListening();
          if (started) {
            console.log(`✅ Wake word detection started - listening for "Yo ${user.assistantName}"`);
          }
        } catch (error) {
          console.error('❌ Failed to initialize wake word detection:', error);
          console.log('ℹ️ This is expected in Expo Go. Create a development build for voice features.');
        }
      }
    };

    initializeWakeWord();

    // Cleanup on unmount or user logout
    return () => {
      if (user) {
        try {
          wakeWordService.destroy();
        } catch (error) {
          // Ignore errors in Expo Go
        }
      }
    };
  }, [user]);

  // Initialize silently in the background - don't show loading screen

  // Set Sentry user context
  useEffect(() => {
    if (user) {
      sentryService.setUser({
        id: user.id,
        email: user.email,
        username: user.preferredName || user.fullName,
      });
    } else {
      sentryService.setUser(null);
    }
  }, [user]);

  return (
    <BiometricLoginGate>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </BiometricLoginGate>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          // Send error to Sentry
          sentryService.captureException(error, {
            errorInfo: errorInfo.componentStack,
          });
          console.error('App Error:', error, errorInfo);
        }}
      >
        <Provider store={store}>
          <PersistGate
            loading={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ color: '#FFF', marginTop: 16 }}>Loading...</Text>
              </View>
            }
            persistor={persistor}
          >
            <AppContent />
          </PersistGate>
        </Provider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
