import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';

import { RootState } from '../store';
import { RootStackParamList, Message } from '../types';
import { useVoice } from '../hooks/useVoice';
import VoiceButton from '../components/voice/VoiceButton';

type ConversationScreenRouteProp = RouteProp<RootStackParamList, 'Conversation'>;

const ConversationScreen: React.FC = () => {
  const route = useRoute<ConversationScreenRouteProp>();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const activeConversation = useSelector((state: RootState) => state.conversation.activeConversation);

  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const {
    voiceState,
    handleVoiceButtonPress,
    speakText,
  } = useVoice();

  useEffect(() => {
    if (activeConversation) {
      setMessages(activeConversation.messages);
    } else {
      // Create a welcome message for new conversation
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm Yo!, your personal assistant. How can I help you today?",
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [activeConversation]);

  const onVoiceButtonPress = async () => {
    const transcription = await handleVoiceButtonPress();
    if (transcription) {
      addUserMessage(transcription);
    }
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate AI response (in real app, send to your AI service)
    setTimeout(() => {
      addAIResponse(content);
    }, 1000);
  };

  const addAIResponse = (userMessage: string) => {
    // Mock AI responses based on user input
    let response = "I understand. Let me help you with that.";

    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar')) {
      response = "I can help you manage your schedule! You can ask me to add events, check your calendar, or set reminders. What would you like to do?";
    } else if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      response = "Let's organize your tasks! I can help you create new tasks, prioritize them, or check what's on your list. What task would you like to work on?";
    } else if (lowerMessage.includes('remind')) {
      response = "I'll set up a reminder for you! Can you tell me when you'd like to be reminded and what it's about?";
    } else if (lowerMessage.includes('weather')) {
      response = "The weather today is sunny and 72°F. Perfect weather for any outdoor activities you have planned!";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      response = "Hello! Great to see you again. I'm here to help make your day more organized and productive. What can I do for you?";
    }

    const aiMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, aiMessage]);

    // Speak the response
    setTimeout(() => {
      speakText(response);
    }, 500);
  };

  const sendTextMessage = () => {
    if (textInput.trim()) {
      addUserMessage(textInput.trim());
      setTextInput('');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const messageTime = new Date(item.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isUser ? 'transparent' : theme.surface,
            borderColor: isUser ? theme.accent : 'transparent',
            borderWidth: isUser ? 1 : 0,
          },
        ]}>
          {!isUser && (
            <Text style={styles.messageEmoji}>🤖</Text>
          )}
          <Text style={[
            styles.messageText,
            { color: theme.text },
          ]}>
            {item.content}
          </Text>
        </View>
        <Text style={[
          styles.messageTime,
          { color: theme.textTertiary },
          isUser ? styles.userMessageTime : styles.aiMessageTime,
        ]}>
          {messageTime}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={[styles.inputContainer, { backgroundColor: theme.surface }]}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Type your message..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={500}
              onSubmitEditing={sendTextMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: theme.accent },
              ]}
              onPress={sendTextMessage}
              disabled={!textInput.trim()}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.voiceInputContainer}>
            <VoiceButton onPress={onVoiceButtonPress} size={60} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    textAlign: 'right',
  },
  aiMessageTime: {
    textAlign: 'left',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  voiceInputContainer: {
    alignItems: 'center',
  },
});

export default ConversationScreen;