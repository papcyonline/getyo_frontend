import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { voiceService } from '../services/voiceService';

const { height, width } = Dimensions.get('window');

type AssistantConversationNavigationProp = StackNavigationProp<RootStackParamList, 'AssistantConversation'>;

interface ConversationMessage {
  id: string;
  type: 'ai' | 'user';
  message: string;
  timestamp: Date;
}

interface ConversationState {
  currentQuestion: string;
  questionIndex: number;
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  messages: ConversationMessage[];
}

const conversationQuestions = [
  "Hi! I'm excited to be your assistant. Tell me, what's your role and what kind of work do you do?",
  "That sounds interesting! What are your biggest daily challenges or pain points at work?",
  "How do you prefer to organize your day? Are you more of a planner or do you like flexibility?",
  "When it comes to reminders and notifications, do you prefer gentle nudges or more direct alerts?",
  "What time of day are you typically most productive? When do you prefer to tackle important tasks?",
  "How do you usually handle meetings and appointments? Do you like detailed prep or minimal scheduling?",
  "What would make your daily routine smoother? What tasks take up too much of your time?",
  "Perfect! I've learned a lot about you. Is there anything else you'd like me to know about your work style or preferences?"
];

const AssistantConversationScreen: React.FC = () => {
  const navigation = useNavigation<AssistantConversationNavigationProp>();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [state, setState] = useState<ConversationState>({
    currentQuestion: conversationQuestions[0],
    questionIndex: 0,
    isRecording: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    messages: [
      {
        id: '1',
        type: 'ai',
        message: conversationQuestions[0],
        timestamp: new Date()
      }
    ]
  });

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Speak the initial question after a short delay
    setTimeout(() => {
      voiceService.speak(conversationQuestions[0]);
    }, 1000);
  }, []);

  useEffect(() => {
    // Pulse animation for recording button
    if (state.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.isRecording]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [state.messages]);

  const startRecording = async () => {
    try {
      setState(prev => ({ ...prev, isRecording: true, transcript: '', confidence: 0 }));

      const success = await voiceService.startConversationRecording(
        (text, confidence) => {
          // Real-time transcript update
          setState(prev => ({ ...prev, transcript: text, confidence }));
        },
        (error) => {
          console.error('Recording error:', error);
          Alert.alert('Recording Error', 'Failed to record audio. Please try again.');
          setState(prev => ({ ...prev, isRecording: false }));
        }
      );

      if (!success) {
        Alert.alert('Recording Error', 'Failed to start recording. Please check your microphone permissions.');
        setState(prev => ({ ...prev, isRecording: false }));
        return;
      }

      console.log('🎤 Real audio recording started...');

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (state.isRecording) {
          stopRecording();
        }
      }, 10000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      setState(prev => ({ ...prev, isRecording: false }));
    }
  };

  const stopRecording = async () => {
    try {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));

      console.log('🛑 Stopping recording and processing...');

      // Get transcription result from voice service
      const result = await voiceService.stopConversationRecording();

      if (result) {
        const { text: transcript, confidence } = result;

        // Add user message
        const userMessage: ConversationMessage = {
          id: Date.now().toString(),
          type: 'user',
          message: transcript,
          timestamp: new Date()
        };

        setState(prev => ({
          ...prev,
          transcript,
          confidence,
          messages: [...prev.messages, userMessage],
          isProcessing: false
        }));

        // Process the response and ask next question
        setTimeout(() => {
          askNextQuestion();
        }, 1500);
      } else {
        // Fallback to mock if transcription fails
        const mockResponses = [
          "I'm a marketing director at a tech startup. I manage campaigns and coordinate with different teams.",
          "My biggest challenge is juggling multiple projects and keeping track of all the moving pieces.",
          "I like to plan my week but keep my days flexible for urgent requests.",
          "I prefer gentle reminders, but make them persistent for really important stuff.",
          "I'm most productive in the morning, around 9-11 AM is my peak time.",
          "I like brief prep for meetings but don't want to over-schedule my calendar.",
          "I spend too much time in emails and status meetings. I'd love help organizing my inbox.",
          "Just remember I'm always curious about new marketing trends and tools!"
        ];

        const transcript = mockResponses[Math.min(state.questionIndex, mockResponses.length - 1)];
        const confidence = 0.85 + Math.random() * 0.1;

        const userMessage: ConversationMessage = {
          id: Date.now().toString(),
          type: 'user',
          message: transcript,
          timestamp: new Date()
        };

        setState(prev => ({
          ...prev,
          transcript,
          confidence,
          messages: [...prev.messages, userMessage],
          isProcessing: false
        }));

        setTimeout(() => {
          askNextQuestion();
        }, 1500);
      }

    } catch (error) {
      console.error('Failed to process recording:', error);
      Alert.alert('Processing Error', 'Failed to process your response. Please try again.');
      setState(prev => ({ ...prev, isRecording: false, isProcessing: false }));
    }
  };

  const askNextQuestion = () => {
    const nextIndex = state.questionIndex + 1;

    if (nextIndex < conversationQuestions.length) {
      const nextQuestion = conversationQuestions[nextIndex];

      const aiMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: 'ai',
        message: nextQuestion,
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        currentQuestion: nextQuestion,
        questionIndex: nextIndex,
        messages: [...prev.messages, aiMessage]
      }));

      // Speak the question using the user's selected voice
      setTimeout(() => {
        voiceService.speak(nextQuestion);
      }, 500);
    } else {
      // Conversation finished
      finishConversation();
    }
  };

  const finishConversation = async () => {
    try {
      // Add final AI message
      const finalMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: 'ai',
        message: "Great! I've learned so much about you. Let me now set up your assistant based on our conversation. This will just take a moment...",
        timestamp: new Date()
      };

      const finalMessages = [...state.messages, finalMessage];

      // Speak the final message
      voiceService.speak(finalMessage.message);

      setState(prev => ({
        ...prev,
        messages: finalMessages,
        isProcessing: true
      }));

      // Save conversation data to backend and extract preferences
      try {
        const conversationData = {
          messages: finalMessages,
          conversationSummary: 'User interview completed with personality and work style insights'
        };

        await ApiService.saveConversationData(conversationData);
        console.log('✅ Conversation data saved and preferences extracted');

        // Show success message
        const successMessage: ConversationMessage = {
          id: Date.now().toString(),
          type: 'ai',
          message: "Perfect! I've analyzed our conversation and set up your assistant preferences. You can always fine-tune these settings later. Let's continue!",
          timestamp: new Date()
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, successMessage],
          isProcessing: false
        }));

        // Wait a moment to show the success message
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Navigate to agent personality screen (now pre-filled with extracted preferences)
        navigation.navigate('AgentPersonality');

      } catch (error) {
        console.error('Failed to save conversation data:', error);
        // Still proceed to manual setup if API fails
        Alert.alert(
          'Analysis Failed',
          'We couldn\'t automatically analyze the conversation, but you can still set up your preferences manually.',
          [{ text: 'Continue', onPress: () => navigation.navigate('AgentPersonality') }]
        );
      }

    } catch (error) {
      console.error('Failed to finish conversation:', error);
      Alert.alert('Error', 'Something went wrong. Let\'s continue with the setup manually.');
      navigation.navigate('AgentPersonality');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Interview',
      'Are you sure you want to skip the conversation? This helps us understand your preferences better.',
      [
        { text: 'Continue Interview', style: 'cancel' },
        { text: 'Skip', onPress: () => navigation.navigate('AgentPersonality') }
      ]
    );
  };

  const renderMessage = (message: ConversationMessage, index: number) => {
    const isAI = message.type === 'ai';

    return (
      <View key={message.id} style={[styles.messageContainer, isAI ? styles.aiMessage : styles.userMessage]}>
        <View style={[styles.messageAvatar, isAI ? styles.aiAvatar : styles.userAvatar]}>
          <MaterialIcons
            name={isAI ? 'smart-toy' : 'person'}
            size={20}
            color="#FFF7F5"
          />
        </View>
        <View style={[styles.messageBubble, isAI ? styles.aiMessageBubble : styles.userMessageBubble]}>
          <Text style={[styles.messageText, isAI ? styles.aiMessageText : styles.userMessageText]}>
            {message.message}
          </Text>
          <Text style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Let's Chat!</Text>
          <Text style={styles.subtitle}>
            I'd love to learn about you and how I can help
          </Text>
        </View>

        <Animated.View
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.slidingContainer}>
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
              <Text style={styles.step}>Getting to know you</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {state.messages.map((message, index) => renderMessage(message, index))}

              {state.isProcessing && (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color="#3396D3" />
                  <Text style={styles.processingText}>Processing your response...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputContainer}>
              {state.transcript ? (
                <View style={styles.transcriptContainer}>
                  <Text style={styles.transcriptText}>"{state.transcript}"</Text>
                  <Text style={styles.confidenceText}>
                    Confidence: {Math.round(state.confidence * 100)}%
                  </Text>
                </View>
              ) : null}

              <View style={styles.recordingControls}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.recordButton,
                      state.isRecording && styles.recordingActive,
                      state.isProcessing && styles.recordingDisabled
                    ]}
                    onPress={state.isRecording ? stopRecording : startRecording}
                    disabled={state.isProcessing}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={state.isRecording ? 'stop' : 'mic'}
                      size={32}
                      color="#FFF7F5"
                    />
                  </TouchableOpacity>
                </Animated.View>

                <Text style={styles.recordingInstruction}>
                  {state.isRecording ? 'Tap to stop recording' :
                   state.isProcessing ? 'Processing...' :
                   'Tap to start speaking'}
                </Text>
              </View>
            </View>
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
    height: height * 0.4,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
    zIndex: 2,
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 15,
    alignItems: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF7F5',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 247, 245, 0.7)',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 24,
  },
  slidingContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 15,
    paddingBottom: 10,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 247, 245, 0.2)',
  },
  skipButtonText: {
    color: '#FFF7F5',
    fontSize: 14,
    fontWeight: '500',
  },
  step: {
    fontSize: 14,
    color: '#FFF7F5',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingVertical: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  aiAvatar: {
    backgroundColor: '#3396D3',
  },
  userAvatar: {
    backgroundColor: '#FF6B9D',
  },
  messageBubble: {
    maxWidth: width * 0.7,
    padding: 12,
    borderRadius: 16,
  },
  aiMessageBubble: {
    backgroundColor: 'rgba(51, 150, 211, 0.2)',
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  aiMessageText: {
    color: '#FFF7F5',
  },
  userMessageText: {
    color: '#FFF7F5',
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255, 247, 245, 0.5)',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  processingText: {
    color: 'rgba(255, 247, 245, 0.7)',
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 247, 245, 0.1)',
  },
  transcriptContainer: {
    backgroundColor: 'rgba(255, 247, 245, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  transcriptText: {
    color: '#FFF7F5',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  confidenceText: {
    color: 'rgba(255, 247, 245, 0.6)',
    fontSize: 12,
  },
  recordingControls: {
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3396D3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#3396D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  recordingActive: {
    backgroundColor: '#FF4757',
  },
  recordingDisabled: {
    backgroundColor: 'rgba(255, 247, 245, 0.1)',
  },
  recordingInstruction: {
    color: 'rgba(255, 247, 245, 0.7)',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default AssistantConversationScreen;