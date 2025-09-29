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
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import ApiService from '../services/api';
import { RootStackParamList } from '../types';

const { height, width } = Dimensions.get('window');

type ChatNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

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
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  // Progress tracking
  const [totalQuestions] = useState(10); // Total expected questions in conversation
  const [answeredQuestions, setAnsweredQuestions] = useState(1); // Start with 1 (initial greeting)
  const [conversationProgress, setConversationProgress] = useState(10); // 10% progress

  // Voice state
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isTranscribing: false,
    recording: null,
    transcription: '',
  });

  useEffect(() => {
    // Initialize audio permissions
    initializeAudio();

    // Slide up animation
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    // Update progress when messages change
    const userMessages = messages.filter(msg => msg.type === 'user').length;
    const newProgress = Math.min(100, Math.round((userMessages / totalQuestions) * 100));
    setAnsweredQuestions(userMessages + 1); // +1 for initial greeting
    setConversationProgress(newProgress);
  }, [messages, totalQuestions]);

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
    console.log('🔵 sendMessage called with:', text);
    if (!text.trim()) {
      console.log('❌ Message is empty, returning');
      return;
    }

    console.log('✅ Sending message:', text.trim());
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

      if (response.success) {
        // Update conversation ID if new conversation
        if (!conversationId && response.data.conversationId) {
          setConversationId(response.data.conversationId);
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
    console.log('🎤 startRecording called');
    try {
      // Check permissions
      const { status } = await Audio.requestPermissionsAsync();
      console.log('🎤 Permission status:', status);
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone access is required for voice messages.');
        return;
      }

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

      console.log('🎤 Recording started');
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

      setVoiceState(prev => ({ ...prev, isRecording: false, isTranscribing: true }));

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        throw new Error('No recording URI available');
      }

      console.log('🎤 Recording stopped, starting transcription...');

      // Send audio for transcription and AI response
      const response = await ApiService.transcribeAndRespond(uri, conversationId);

      if (response.success) {
        // Update conversation ID if new conversation
        if (!conversationId && response.data.conversationId) {
          setConversationId(response.data.conversationId);
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
      } else {
        throw new Error(response.error || 'Transcription failed');
      }

      // Clean up recording file
      try {
        await FileSystem.deleteAsync(uri);
      } catch (cleanupError) {
        console.warn('Failed to cleanup recording file:', cleanupError);
      }

    } catch (error) {
      console.error('Error processing recording:', error);
      Alert.alert('Voice Error', 'Failed to process voice message. Please try again.');
    } finally {
      setVoiceState(prev => ({
        ...prev,
        isRecording: false,
        isTranscribing: false,
        recording: null,
      }));
    }
  };

  const renderMessage = (item: Message, index: number) => {
    const isUser = item.type === 'user';

    return (
      <View key={item.id} style={styles.messageRow}>
        <Text style={[
          styles.messageLabel,
          isUser ? styles.userLabel : styles.assistantLabel
        ]}>
          {isUser ? 'You' : 'AI Assistant'}
        </Text>
        {item.isTyping ? (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>●</Text>
            <Text style={styles.typingText}>●</Text>
            <Text style={styles.typingText}>●</Text>
          </View>
        ) : (
          <Text style={styles.messageContent}>
            {item.content}
          </Text>
        )}
        {index < messages.length - 1 && <View style={styles.messageDivider} />}
      </View>
    );
  };

  const renderProgressBar = () => {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Question {answeredQuestions} of {totalQuestions}
          </Text>
          <Text style={styles.progressPercentage}>
            {conversationProgress}% Complete
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: `${conversationProgress}%`,
                opacity: fadeAnim,
              }
            ]}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background gradient flare */}
      <LinearGradient
        colors={['rgba(51, 150, 211, 0.4)', 'rgba(0, 0, 0, 0.8)', 'transparent']}
        style={styles.gradientFlare}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="rgba(255, 255, 255, 0.9)" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Tell me more about you</Text>
          <Text style={styles.subtitle}>
            Let's get to know each other better
          </Text>
        </View>

        {/* Progress Tracker */}
        {renderProgressBar()}

        {/* Glass-like Sliding Container */}
        <Animated.View
          style={[
            styles.slidingContainer,
            { transform: [{ translateY: slideAnim }], opacity: fadeAnim }
          ]}
        >
          <View style={styles.glassPanel}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardContainer}
            >
              {/* Chat Messages */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((message, index) => renderMessage(message, index))}
              </ScrollView>

              {/* Input Section */}
              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type your message..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    multiline
                    maxLength={500}
                    editable={!isLoading}
                  />

                  {/* Voice Button */}
                  <TouchableOpacity
                    style={[
                      styles.voiceButton,
                      voiceState.isRecording && styles.voiceButtonActive
                    ]}
                    onPress={() => {
                      console.log('🎤 Voice button pressed, isRecording:', voiceState.isRecording);
                      if (voiceState.isRecording) {
                        stopRecording();
                      } else {
                        startRecording();
                      }
                    }}
                    disabled={voiceState.isTranscribing || isLoading}
                  >
                    {voiceState.isTranscribing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <MaterialIcons
                        name={voiceState.isRecording ? "stop" : "mic"}
                        size={20}
                        color="#fff"
                      />
                    )}
                  </TouchableOpacity>

                  {/* Send Button */}
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      !inputText.trim() && styles.sendButtonDisabled
                    ]}
                    onPress={() => {
                      console.log('📤 Send button pressed, inputText:', inputText);
                      sendMessage(inputText);
                    }}
                    disabled={!inputText.trim() || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Ionicons name="send" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>

                {voiceState.isRecording && (
                  <View style={styles.recordingIndicator}>
                    <MaterialIcons name="fiber-manual-record" size={12} color="#ff4444" />
                    <Text style={styles.recordingText}>Recording...</Text>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientFlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.3,
  },
  slidingContainer: {
    flex: 1,
    marginTop: 10,
  },
  glassPanel: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    paddingTop: 20,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 10,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    color: 'rgba(51, 150, 211, 0.9)',
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'rgba(51, 150, 211, 0.8)',
    borderRadius: 2,
  },
  keyboardContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageRow: {
    marginBottom: 20,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  userLabel: {
    color: 'rgba(51, 150, 211, 0.9)',
  },
  assistantLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  messageDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 16,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.5)',
    opacity: 0.6,
  },
  inputContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  voiceButtonActive: {
    backgroundColor: '#ff4444',
    shadowColor: '#ff4444',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    justifyContent: 'center',
  },
  recordingText: {
    fontSize: 14,
    color: '#ff4444',
    fontWeight: '600',
  },
});

export default ChatScreen;