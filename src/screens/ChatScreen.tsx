import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import config from '../config/environment';
import { RootStackParamList, RootState } from '../types';

const { height, width } = Dimensions.get('window');

type ChatNavigationProp = StackNavigationProp<RootStackParamList, 'ChatScreen'>;

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface VoiceState {
  isRecording: boolean;
  isTranscribing: boolean;
  recording: Audio.Recording | null;
  transcription: string;
}

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<ChatNavigationProp>();
  const route = navigation.getState().routes[navigation.getState().index];
  const params = route.params as { autoStartVoice?: boolean } | undefined;
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const user = useSelector((state: RootState) => state.user.user);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);

  // Voice state
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isTranscribing: false,
    recording: null,
    transcription: '',
  });

  // Voice output enabled/disabled
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  useEffect(() => {
    // Initialize audio permissions
    initializeAudio();
    // Load conversation history
    loadConversationHistory();
    // Load voice preference
    loadVoicePreference();
  }, []);

  const loadVoicePreference = async () => {
    try {
      const stored = await AsyncStorage.getItem('chat_voice_enabled');
      if (stored !== null) {
        setIsVoiceEnabled(stored === 'true');
      }
    } catch (error) {
      console.error('Failed to load voice preference:', error);
    }
  };

  const toggleVoiceEnabled = async () => {
    try {
      const newValue = !isVoiceEnabled;
      setIsVoiceEnabled(newValue);
      await AsyncStorage.setItem('chat_voice_enabled', String(newValue));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log(`🔊 Voice output ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to save voice preference:', error);
    }
  };

  useEffect(() => {
    // Auto-start voice recording if requested from HomeScreen
    if (params?.autoStartVoice && !isLoadingConversation) {
      // Wait a moment for audio initialization and conversation loading
      const timer = setTimeout(() => {
        console.log('🎤 Auto-starting voice recording...');
        startRecording();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLoadingConversation]);

  const loadConversationHistory = async () => {
    try {
      setIsLoadingConversation(true);
      console.log('📜 Loading conversation history...');

      // Fetch recent conversations from backend
      const response = await ApiService.getConversations();
      console.log('📡 API Response:', JSON.stringify(response, null, 2));

      if (response.success && response.data && response.data.length > 0) {
        // Get the most recent conversation
        const recentConversation = response.data[0];
        console.log('📝 Recent conversation ID:', recentConversation._id);
        console.log('📝 Messages in conversation:', recentConversation.messages?.length || 0);

        setConversationId(recentConversation._id);

        // Convert backend messages to UI messages
        if (recentConversation.messages && recentConversation.messages.length > 0) {
          const loadedMessages: Message[] = recentConversation.messages.map((msg: any, index: number) => ({
            id: msg._id || `${index}`,
            type: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: new Date(msg.timestamp || Date.now()),
          }));

          setMessages(loadedMessages);
          console.log(`✅ Loaded ${loadedMessages.length} messages from conversation ${recentConversation._id}`);
        } else {
          // Conversation exists but no messages yet
          setMessages([
            {
              id: '1',
              type: 'assistant',
              content: `Hi! I'm ${user?.assistantName || 'your assistant'}. How can I help you today?`,
              timestamp: new Date(),
            },
          ]);
          console.log('📝 Conversation exists but no messages - showing welcome');
        }
      } else {
        // No existing conversation, show welcome message
        console.log('📝 No existing conversations found - starting fresh');
        setMessages([
          {
            id: '1',
            type: 'assistant',
            content: `Hi! I'm ${user?.assistantName || 'your assistant'}. How can I help you today?`,
            timestamp: new Date(),
          },
        ]);
        console.log('📝 Starting new conversation');
      }
    } catch (error: any) {
      console.error('❌ Failed to load conversation history:', error);
      console.error('❌ Error details:', error.message);
      // Show welcome message on error
      setMessages([
        {
          id: '1',
          type: 'assistant',
          content: `Hi! I'm ${user?.assistantName || 'your assistant'}. How can I help you today?`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

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

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    console.log('📤 Sending message...');
    console.log('📤 Current conversationId:', conversationId || 'NEW');
    console.log('📤 Message:', text.trim());

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      type: 'assistant',
      content: '...',
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      // Send message to backend
      const response = await ApiService.sendMessage(text.trim(), conversationId);
      console.log('📥 Response received:', response.success ? '✅ Success' : '❌ Failed');

      if (response.success) {
        // Update conversation ID if new conversation
        if (!conversationId && response.data.conversationId) {
          console.log('💾 Saving new conversationId:', response.data.conversationId);
          setConversationId(response.data.conversationId);
        } else if (conversationId) {
          console.log('📝 Continuing conversation:', conversationId);
        }

        // Remove typing indicator and add AI response
        setMessages(prev => {
          const filtered = prev.filter(msg => msg.id !== 'typing');
          const aiMessage: Message = {
            id: Date.now().toString() + '_ai',
            type: 'assistant',
            content: response.data.aiResponse,
            timestamp: new Date(),
          };
          return [...filtered, aiMessage];
        });

        // Auto-play PA voice response if audio is available and voice is enabled
        if (isVoiceEnabled && response.data.audioBuffer) {
          try {
            const audioBase64 = response.data.audioBuffer;
            const dataUri = `data:audio/mp3;base64,${audioBase64}`;

            const { sound } = await Audio.Sound.createAsync(
              { uri: dataUri },
              { shouldPlay: true },
              (status) => {
                if (status.isLoaded && status.didJustFinish) {
                  sound.unloadAsync();
                }
              }
            );
            console.log('🔊 Playing voice response');
          } catch (audioError) {
            console.error('Failed to play PA voice:', audioError);
          }
        } else if (!isVoiceEnabled) {
          console.log('🔇 Voice output disabled - text only');
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Remove typing indicator and show error
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'typing');
        const errorMessage: Message = {
          id: 'error',
          type: 'assistant',
          content: "Sorry, I'm having trouble responding right now. Please try again.",
          timestamp: new Date(),
        };
        return [...filtered, errorMessage];
      });

      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is required for voice messages.');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setVoiceState(prev => ({ ...prev, isRecording: true }));

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16_BIT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM,
          sampleRate: 16000,
          numberOfChannels: 1,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
        },
      });

      await recording.startAsync();
      setVoiceState(prev => ({ ...prev, recording }));
    } catch (error) {
      console.error('Failed to start recording:', error);
      setVoiceState(prev => ({ ...prev, isRecording: false }));
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      const { recording } = voiceState;
      if (!recording) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setVoiceState(prev => ({ ...prev, isRecording: false, isTranscribing: true }));

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        throw new Error('No recording URI available');
      }

      console.log('🎤 Recording stopped, audio URI:', uri);
      console.log('📡 API Base URL:', ApiService.getBaseURL());
      console.log('🔐 Conversation ID:', conversationId || 'NEW');

      // Test connection before sending
      try {
        const isConnected = await ApiService.checkConnection();
        console.log('📡 Connection test:', isConnected ? '✅ Connected' : '❌ Not connected');

        if (!isConnected) {
          const diagnostics = await ApiService.getConnectionDiagnostics();
          console.log('🔍 Connection diagnostics:', JSON.stringify(diagnostics, null, 2));

          Alert.alert(
            'Connection Error',
            `Cannot reach backend server at ${diagnostics.apiBaseUrl}\n\n` +
            `Network: ${diagnostics.networkConnected ? 'Connected' : 'Not connected'}\n` +
            `Server: ${diagnostics.serverReachable ? 'Reachable' : 'Not reachable'}\n\n` +
            'Please check:\n' +
            '1. Backend server is running\n' +
            '2. Your device is on the same network\n' +
            '3. Firewall settings allow connections'
          );
          return;
        }
      } catch (connError) {
        console.error('Connection test failed:', connError);
      }

      // Send audio for transcription and AI response
      console.log('📤 Sending audio for transcription...');
      const response = await ApiService.transcribeAndRespond(uri, conversationId);

      if (response.success) {
        // Update conversation ID if new conversation
        if (!conversationId && response.data.conversationId) {
          console.log('💾 Saving new conversationId:', response.data.conversationId);
          setConversationId(response.data.conversationId);
        } else if (conversationId) {
          console.log('📝 Continuing conversation:', conversationId);
        }

        // Add user message (transcription) and AI response
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: response.data.transcript || 'Voice message',
          timestamp: new Date(),
        };

        const aiMessage: Message = {
          id: Date.now().toString() + '_ai',
          type: 'assistant',
          content: response.data.aiResponse,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage, aiMessage]);

        // Auto-play PA voice response if audio is available and voice is enabled
        if (isVoiceEnabled && response.data.audioBuffer) {
          try {
            const audioBase64 = response.data.audioBuffer;
            const dataUri = `data:audio/mp3;base64,${audioBase64}`;

            const { sound } = await Audio.Sound.createAsync(
              { uri: dataUri },
              { shouldPlay: true },
              (status) => {
                if (status.isLoaded && status.didJustFinish) {
                  sound.unloadAsync();
                }
              }
            );
            console.log('🔊 Playing voice response');
          } catch (audioError) {
            console.error('Failed to play PA voice:', audioError);
          }
        } else if (!isVoiceEnabled) {
          console.log('🔇 Voice output disabled - text only');
        }
      } else {
        throw new Error(response.error || 'Transcription failed');
      }

      // Clean up recording file
      try {
        await FileSystem.deleteAsync(uri);
      } catch (cleanupError) {
        console.warn('Failed to cleanup recording file:', cleanupError);
      }

    } catch (error: any) {
      console.error('❌ Error processing recording:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        details: error?.details,
      });

      let errorMessage = 'Failed to process voice message. Please try again.';

      if (error?.code === 'CONNECTION_ERROR') {
        errorMessage = 'Cannot connect to server. Please ensure:\n\n' +
          '1. Backend server is running\n' +
          '2. You\'re on the same network (WiFi)\n' +
          `3. Server is reachable at: ${config.API_BASE_URL}`;
      } else if (error?.code === 'AUTH_EXPIRED') {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error?.code === 'NETWORK_ERROR') {
        errorMessage = 'No internet connection. Please check your network.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert('Voice Recording Error', errorMessage);
    } finally {
      setVoiceState(prev => ({
        ...prev,
        isRecording: false,
        isTranscribing: false,
        recording: null,
      }));
    }
  };

  const renderMessage = (item: Message) => {
    const isUser = item.type === 'user';

    return (
      <View key={item.id} style={styles.messageContainer}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          {item.isTyping ? (
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, { animationDelay: '0s' }]} />
              <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
              <View style={[styles.typingDot, { animationDelay: '0.4s' }]} />
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              isUser ? styles.userText : styles.assistantText
            ]}>
              {item.content}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <LinearGradient
        colors={['#000000', '#000000', '#000000']}
        style={styles.backgroundGradient}
      />

      {/* Animated Background Dots */}
      <View style={styles.backgroundDotsContainer} pointerEvents="none">
        {Array(200).fill(0).map((_, index) => {
          const dotSpacing = 35;
          const columns = Math.ceil(width / dotSpacing);
          const row = Math.floor(index / columns);
          const col = index % columns;

          return (
            <View
              key={index}
              style={[
                styles.backgroundDot,
                {
                  left: col * dotSpacing,
                  top: row * dotSpacing,
                  opacity: 0.15,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#C9A96E" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chat with {user?.assistantName || 'Assistant'}</Text>
          <Text style={styles.headerSubtitle}>Your AI Personal Assistant</Text>
        </View>
        <View style={styles.headerRightButtons}>
          {/* Voice Toggle Button */}
          <TouchableOpacity
            style={[styles.headerButton, isVoiceEnabled && styles.headerButtonActive]}
            onPress={toggleVoiceEnabled}
          >
            <Ionicons
              name={isVoiceEnabled ? "volume-high" : "volume-mute"}
              size={22}
              color={isVoiceEnabled ? "#C9A96E" : "rgba(201, 169, 110, 0.5)"}
            />
          </TouchableOpacity>

          {/* New Conversation Button */}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Start new conversation
              setConversationId(undefined);
              setMessages([
                {
                  id: '1',
                  type: 'assistant',
                  content: `Hi! I'm ${user?.assistantName || 'your assistant'}. How can I help you today?`,
                  timestamp: new Date(),
                },
              ]);
            }}
          >
            <Ionicons name="create-outline" size={22} color="#C9A96E" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: insets.bottom + 80 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isLoadingConversation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#C9A96E" size="large" />
              <Text style={styles.loadingText}>Loading conversation...</Text>
            </View>
          ) : (
            messages.map((message) => renderMessage(message))
          )}
        </ScrollView>

        {/* Input Section */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          {voiceState.isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingPulse} />
              <Ionicons name="mic" size={16} color="#FF4757" />
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              {/* Attachment Button */}
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // TODO: Implement attachment functionality
                }}
                disabled={voiceState.isRecording || isLoading}
              >
                <Ionicons name="add-circle" size={24} color="rgba(201, 169, 110, 0.6)" />
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor="rgba(201, 169, 110, 0.4)"
                multiline
                maxLength={500}
                editable={!isLoading && !voiceState.isRecording}
              />

              {/* Right side buttons inside input */}
              <View style={styles.inputRightButtons}>
                {/* Voice Button */}
                <TouchableOpacity
                  style={styles.inlineVoiceButton}
                  onPress={() => {
                    if (voiceState.isRecording) {
                      stopRecording();
                    } else {
                      startRecording();
                    }
                  }}
                  disabled={voiceState.isTranscribing || isLoading}
                >
                  {voiceState.isTranscribing ? (
                    <ActivityIndicator color="#C9A96E" size="small" />
                  ) : (
                    <Ionicons
                      name={voiceState.isRecording ? "stop-circle" : "mic"}
                      size={24}
                      color={voiceState.isRecording ? "#FF4757" : "rgba(201, 169, 110, 0.6)"}
                    />
                  )}
                </TouchableOpacity>

                {/* Send Button */}
                <TouchableOpacity
                  style={styles.inlineSendButton}
                  onPress={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading || voiceState.isRecording}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#C9A96E" size="small" />
                  ) : (
                    <Ionicons
                      name="arrow-up-circle"
                      size={28}
                      color={inputText.trim() ? "#C9A96E" : "rgba(201, 169, 110, 0.3)"}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#C9A96E',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonActive: {
    backgroundColor: 'rgba(201, 169, 110, 0.25)',
  },
  headerRight: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#C9A96E',
    marginTop: 12,
    fontWeight: '500',
  },
  keyboardContainer: {
    flex: 1,
    zIndex: 5,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingTop: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#C9A96E',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201, 169, 110, 0.15)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#000000',
    fontWeight: '500',
  },
  assistantText: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9A96E',
    opacity: 0.6,
  },
  inputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(201, 169, 110, 0.2)',
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  recordingPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4757',
  },
  recordingText: {
    fontSize: 14,
    color: '#FF4757',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.3)',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    maxHeight: 120,
    gap: 8,
  },
  attachmentButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
    paddingVertical: 6,
  },
  inputRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineVoiceButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineSendButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Legacy styles kept for backward compatibility
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  voiceButtonActive: {
    backgroundColor: '#FF4757',
    shadowColor: '#FF4757',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C9A96E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C9A96E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(201, 169, 110, 0.3)',
    shadowOpacity: 0,
  },
});

export default ChatScreen;
