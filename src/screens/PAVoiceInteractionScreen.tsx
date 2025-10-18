import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../store';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import paVoiceService, { VoiceCommand } from '../services/paVoiceService';
import paCommandProcessor, { CommandResult } from '../services/paCommandProcessor';

interface ConversationMessage {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  action?: string;
}

const PAVoiceInteractionScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  // PA State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('Tap to activate');

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const assistantName = user?.assistantName || 'Assistant';
  const assistantImage = user?.assistantProfileImage;

  useEffect(() => {
    initializePA();

    return () => {
      // Cleanup
      paVoiceService.stopWakeWordListening();
    };
  }, []);

  useEffect(() => {
    if (isListening || isSpeaking) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isListening, isSpeaking]);

  const initializePA = async () => {
    const initialized = await paVoiceService.initialize({
      onWakeWordDetected: handleWakeWordDetected,
      onListeningStart: handleListeningStart,
      onListeningStop: handleListeningStop,
      onCommandReceived: handleCommandReceived,
      onSpeakingStart: handleSpeakingStart,
      onSpeakingEnd: handleSpeakingEnd,
      onError: handleError,
    });

    if (!initialized) {
      Alert.alert('Error', 'Failed to initialize voice service. Please check microphone permissions.');
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.setValue(1);
    waveAnim.setValue(0);
  };

  // PA Event Handlers
  const handleWakeWordDetected = () => {
    console.log('🔔 Wake word detected');
    setCurrentStatus('Wake word detected!');
  };

  const handleListeningStart = () => {
    console.log('👂 Listening started');
    setIsListening(true);
    setCurrentStatus('Listening...');
  };

  const handleListeningStop = () => {
    console.log('🛑 Listening stopped');
    setIsListening(false);
    setCurrentStatus('Processing...');
  };

  const handleCommandReceived = async (command: VoiceCommand) => {
    console.log('📝 Command received:', command.text);

    // Add user message to conversation
    addMessage(command.text, 'user');

    // Process command
    setCurrentStatus('Processing command...');
    const result = await paCommandProcessor.processCommand(command);

    // Add assistant response to conversation
    addMessage(result.response, 'assistant', result.action);

    // Speak response
    await paVoiceService.speak(result.response);

    setCurrentStatus(isWakeWordActive ? 'Listening for wake word...' : 'Tap to activate');
  };

  const handleSpeakingStart = () => {
    console.log('🗣️ Speaking started');
    setIsSpeaking(true);
    setCurrentStatus('Speaking...');
  };

  const handleSpeakingEnd = () => {
    console.log('✅ Speaking ended');
    setIsSpeaking(false);
    setCurrentStatus(isWakeWordActive ? 'Listening for wake word...' : 'Tap to activate');
  };

  const handleError = (error: string) => {
    console.error('❌ PA Error:', error);
    setCurrentStatus('Error: ' + error);
    setIsListening(false);
    setIsSpeaking(false);
  };

  // User Actions
  const toggleWakeWordListening = async () => {
    if (isWakeWordActive) {
      await paVoiceService.stopWakeWordListening();
      setIsWakeWordActive(false);
      setCurrentStatus('Wake word detection stopped');
      addMessage('Wake word listening stopped', 'assistant');
    } else {
      // Set wake words to include PA's name
      const wakeWords = [
        'yo',
        `yo ${assistantName.toLowerCase()}`,
        `hey ${assistantName.toLowerCase()}`,
        assistantName.toLowerCase(),
      ];
      paVoiceService.setWakeWords(wakeWords);

      await paVoiceService.startWakeWordListening();
      setIsWakeWordActive(true);
      setCurrentStatus(`Listening for "Yo ${assistantName}"...`);
      addMessage(`Wake word detection started. Say "Yo ${assistantName}" to activate me.`, 'assistant');
    }
  };

  const handleManualCommand = async () => {
    if (isListening || isSpeaking) {
      return;
    }

    setCurrentStatus('Listening for command...');
    const command = await paVoiceService.listenForCommand();

    if (command) {
      handleCommandReceived(command);
    } else {
      setCurrentStatus('No command received');
    }
  };

  const addMessage = (text: string, type: 'user' | 'assistant', action?: string) => {
    const message: ConversationMessage = {
      id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
      action,
    };

    setConversation((prev) => [...prev, message]);

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleQuickCommand = async (command: string) => {
    const voiceCommand: VoiceCommand = {
      text: command,
      confidence: 1.0,
      timestamp: new Date(),
    };

    await handleCommandReceived(voiceCommand);
  };

  const getStatusUpdate = async () => {
    setCurrentStatus('Getting status update...');
    const status = await paCommandProcessor.getStatusUpdate();
    addMessage('Status update', 'user');
    addMessage(status, 'assistant');
    await paVoiceService.speak(status);
  };

  return (
    <LinearGradient colors={['#000000', '#0A0A0A', '#1A1A1A']} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{assistantName}</Text>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('AIAssistant')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main PA Interface */}
      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {/* Animated waves */}
          {(isListening || isSpeaking) && (
            <>
              <Animated.View
                style={[
                  styles.wave,
                  styles.wave1,
                  {
                    opacity: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0],
                    }),
                    transform: [
                      {
                        scale: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  styles.wave2,
                  {
                    opacity: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 0],
                    }),
                    transform: [
                      {
                        scale: waveAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 2.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </>
          )}

          {/* Avatar */}
          <Animated.View
            style={[
              styles.avatarContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={
                isListening
                  ? ['#C9A96E', '#E5C794']
                  : isSpeaking
                  ? ['#4CAF50', '#81C784']
                  : isWakeWordActive
                  ? ['#2196F3', '#64B5F6']
                  : ['#666666', '#888888']
              }
              style={styles.avatarGradient}
            >
              {assistantImage ? (
                <Image source={{ uri: assistantImage }} style={styles.avatarImage} />
              ) : (
                <Ionicons name="person" size={80} color="#FFFFFF" />
              )}
            </LinearGradient>
          </Animated.View>

          {/* Status */}
          <Text style={styles.statusText}>{currentStatus}</Text>

          {/* Wake Word Status Indicator */}
          {isWakeWordActive && !isListening && !isSpeaking && (
            <View style={styles.wakeWordIndicator}>
              <View style={styles.wakeWordDot} />
              <Text style={styles.wakeWordText}>Listening for "Yo {assistantName}"</Text>
            </View>
          )}
        </View>

        {/* Conversation History */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.conversationContainer}
          contentContainerStyle={styles.conversationContent}
          showsVerticalScrollIndicator={false}
        >
          {conversation.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyStateText}>No conversation yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Start Listening" then say "Yo {assistantName}" to begin
              </Text>
            </View>
          ) : (
            conversation.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.type === 'user' ? styles.userMessage : styles.assistantMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.type === 'user' ? styles.userMessageText : styles.assistantMessageText,
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    message.type === 'user' ? styles.userMessageTime : styles.assistantMessageTime,
                  ]}
                >
                  {message.timestamp.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Wake Word Instructions */}
        {isWakeWordActive && conversation.length === 0 && (
          <View style={styles.instructionsContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#C9A96E" />
            <Text style={styles.instructionsText}>
              Say <Text style={styles.instructionsHighlight}>"Yo {assistantName}"</Text> to activate, then give your command
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickCommand('check my emails')}
            >
              <Ionicons name="mail-outline" size={20} color="#C9A96E" />
              <Text style={styles.quickActionText}>Check Emails</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickCommand("what's on my calendar today")}
            >
              <Ionicons name="calendar-outline" size={20} color="#C9A96E" />
              <Text style={styles.quickActionText}>Today's Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton} onPress={getStatusUpdate}>
              <Ionicons name="information-circle-outline" size={20} color="#C9A96E" />
              <Text style={styles.quickActionText}>Status Update</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickCommand('what can you do')}
            >
              <Ionicons name="help-circle-outline" size={20} color="#C9A96E" />
              <Text style={styles.quickActionText}>Help</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {/* Wake Word Toggle */}
          <TouchableOpacity
            style={[styles.controlButton, isWakeWordActive && styles.controlButtonActive]}
            onPress={toggleWakeWordListening}
          >
            <Ionicons
              name={isWakeWordActive ? 'ear' : 'ear-outline'}
              size={28}
              color={isWakeWordActive ? '#C9A96E' : '#FFFFFF'}
            />
            <Text style={[styles.controlButtonText, isWakeWordActive && styles.controlButtonTextActive]}>
              {isWakeWordActive ? 'Stop Listening' : 'Start Listening'}
            </Text>
          </TouchableOpacity>

          {/* Manual Command */}
          <TouchableOpacity
            style={[styles.micButton, (isListening || isSpeaking) && styles.micButtonActive]}
            onPress={handleManualCommand}
            disabled={isListening || isSpeaking}
          >
            <LinearGradient
              colors={isListening ? ['#C9A96E', '#E5C794'] : ['#C9A96E', '#B8945E']}
              style={styles.micButtonGradient}
            >
              <Ionicons name="mic" size={32} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Clear Conversation */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setConversation([])}
          >
            <Ionicons name="trash-outline" size={28} color="#FFFFFF" />
            <Text style={styles.controlButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#C9A96E',
  },
  wave1: {
    top: 30,
  },
  wave2: {
    top: 30,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  statusText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  wakeWordIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderRadius: 20,
  },
  wakeWordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginRight: 8,
  },
  wakeWordText: {
    fontSize: 13,
    color: '#64B5F6',
    fontWeight: '600',
  },
  conversationContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  conversationContent: {
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 8,
    textAlign: 'center',
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#C9A96E',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  assistantMessageTime: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)',
  },
  instructionsText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  instructionsHighlight: {
    color: '#C9A96E',
    fontWeight: '700',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C9A96E',
    marginLeft: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(201, 169, 110, 0.2)',
  },
  controlButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: '600',
  },
  controlButtonTextActive: {
    color: '#C9A96E',
  },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  micButtonActive: {
    elevation: 12,
    shadowOpacity: 0.6,
  },
  micButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PAVoiceInteractionScreen;
