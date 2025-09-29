import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector } from 'react-redux';
import { View, Text, ActivityIndicator } from 'react-native';
import { store } from './src/store';
import { RootState } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import AuthService from './src/services/auth';
import ConnectionManager from './src/services/connectionManager';
import { wakeWordService } from './src/services/wakeWordService';
import { conversationManager } from './src/services/conversationManager';
import { notificationService } from './src/services/notificationService';

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

        // Initialize connection manager first (includes locale service)
        await ConnectionManager.initialize();
        console.log('✅ Connection Manager initialized');

        // Initialize auth service
        await AuthService.initialize();
        console.log('✅ Auth Service initialized');

        // Initialize notification service
        const notificationsEnabled = await notificationService.initialize();
        if (notificationsEnabled) {
          console.log('✅ Notifications enabled');
          console.log('📱 Push token:', notificationService.getExpoPushToken());
        } else {
          console.log('⚠️ Notifications not enabled - user may have denied permission');
        }

        // Get initial connection diagnostics
        const diagnostics = await ConnectionManager.getDiagnostics();
        console.log('📊 App initialization diagnostics:', diagnostics);

        setIsInitialized(true);
        console.log('✅ App initialization completed successfully');
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
        // Don't prevent app from loading - show error but continue
        setIsInitialized(true);
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

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDark ? '#000000' : '#FFFFFF'
      }}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
        <Text style={{
          marginTop: 16,
          fontSize: 16,
          color: isDark ? '#FFFFFF' : '#000000',
          textAlign: 'center'
        }}>
          Initializing Yo! Assistant...
        </Text>
        {initError && (
          <Text style={{
            marginTop: 8,
            fontSize: 12,
            color: '#FF6B6B',
            textAlign: 'center',
            paddingHorizontal: 20
          }}>
            {initError}
          </Text>
        )}
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
