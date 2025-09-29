import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Animated,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { voiceService } from '../services/voiceService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface VoiceAssistantProps {
  visible: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  visible,
  onClose,
  onNavigate
}) => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const user = useSelector((state: RootState) => state.user.user);

  const [isListening, setIsListening] = useState(false);
  const [transcriptText, setTranscriptText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      startPulseAnimation();
    } else {
      stopListening();
    }
  }, [visible]);

  const startPulseAnimation = () => {
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
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      setTranscriptText('Listening...');

      const success = await voiceService.startListening(
        (text) => {
          setTranscriptText(text);
          setIsProcessing(true);
          processVoiceCommand(text);
        },
        (error) => {
          console.error('Voice error:', error);
          setTranscriptText('Sorry, I couldn\'t hear you clearly. Please try again.');
          setIsListening(false);
        }
      );

      if (!success) {
        setTranscriptText('Voice recognition not available. Please check your permissions.');
        setIsListening(false);
      }
    } catch (error) {
      console.error('Start listening error:', error);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await voiceService.stopListening();
      setIsListening(false);
      setIsProcessing(false);
    } catch (error) {
      console.error('Stop listening error:', error);
    }
  };

  const processVoiceCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();

    // Navigation commands
    if (lowerCommand.includes('email') || lowerCommand.includes('mail')) {
      await voiceService.speak('Opening email management');
      onNavigate?.('EmailManagement');
      onClose();
    } else if (lowerCommand.includes('meeting') || lowerCommand.includes('schedule')) {
      await voiceService.speak('Opening meeting preparation');
      onNavigate?.('MeetingPrep');
      onClose();
    } else if (lowerCommand.includes('briefing') || lowerCommand.includes('today')) {
      await voiceService.speak('Opening daily briefing');
      onNavigate?.('DailyBriefing');
      onClose();
    } else if (lowerCommand.includes('task') || lowerCommand.includes('todo')) {
      await voiceService.speak('Opening tasks');
      onNavigate?.('Tasks');
      onClose();
    } else if (lowerCommand.includes('financial') || lowerCommand.includes('portfolio')) {
      await voiceService.speak('Opening financial dashboard');
      onNavigate?.('FinancialDashboard');
      onClose();
    } else if (lowerCommand.includes('team') || lowerCommand.includes('manage')) {
      await voiceService.speak('Opening team management');
      onNavigate?.('TeamManagement');
      onClose();
    } else if (lowerCommand.includes('document') || lowerCommand.includes('analyze')) {
      await voiceService.speak('Opening document intelligence');
      onNavigate?.('DocumentIntelligence');
      onClose();
    } else if (lowerCommand.includes('search') || lowerCommand.includes('find')) {
      await voiceService.speak('Opening smart search');
      onNavigate?.('SmartSearch');
      onClose();
    } else {
      // General AI query - this would integrate with OpenAI/Claude
      const response = generateAIResponse(command);
      setTranscriptText(response);
      await voiceService.speak(response);
    }

    setIsProcessing(false);
    setTimeout(() => {
      if (!isListening) {
        onClose();
      }
    }, 3000);
  };

  const generateAIResponse = (query: string): string => {
    // This would integrate with actual AI service
    const responses = [
      `I understand you said "${query}". I'm here to help with your executive tasks.`,
      'I can help you manage emails, schedule meetings, or provide daily briefings. What would you like to do?',
      'As your AI assistant, I can help with various executive functions. Try asking me to open specific features.',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const quickCommands = [
    { title: 'Check emails', command: 'open email management', icon: 'mail' },
    { title: 'Daily briefing', command: 'show daily briefing', icon: 'sunny' },
    { title: 'Schedule meeting', command: 'schedule new meeting', icon: 'people' },
    { title: 'View tasks', command: 'open tasks', icon: 'checkmark-circle' },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {user?.assistantName || 'Yo!'} Assistant
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Voice Interface */}
          <View style={styles.voiceInterface}>
            <Animated.View style={[styles.voiceButton, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={isListening ? ['#C9A96E', '#1E88E5'] : ['#C9A96E', '#0D47A1']}
                style={styles.voiceButtonGradient}
              >
                <TouchableOpacity
                  style={styles.voiceButtonTouch}
                  onPress={isListening ? stopListening : startListening}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isListening ? 'stop' : 'mic'}
                    size={48}
                    color="white"
                  />
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            <Text style={[styles.voiceStatus, { color: theme.text }]}>
              {isListening ? 'Listening...' : 'Tap to speak'}
            </Text>

            {transcriptText && (
              <View style={[styles.transcriptContainer, { backgroundColor: theme.surface }]}>
                <Text style={[styles.transcriptText, { color: theme.text }]}>
                  {transcriptText}
                </Text>
              </View>
            )}

            {isProcessing && (
              <View style={styles.processingIndicator}>
                <Animated.View style={[styles.processingDot, { opacity: pulseAnim }]} />
                <Text style={[styles.processingText, { color: theme.textSecondary }]}>
                  Processing...
                </Text>
              </View>
            )}
          </View>

          {/* Quick Commands */}
          <View style={styles.quickCommands}>
            <Text style={[styles.quickCommandsTitle, { color: theme.text }]}>
              Quick Commands
            </Text>
            <View style={styles.commandGrid}>
              {quickCommands.map((cmd, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.commandButton, { backgroundColor: theme.surface }]}
                  onPress={() => processVoiceCommand(cmd.command)}
                >
                  <Ionicons name={cmd.icon as any} size={24} color="#C9A96E" />
                  <Text style={[styles.commandButtonText, { color: theme.text }]}>
                    {cmd.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Voice Commands Help */}
          <View style={styles.helpSection}>
            <Text style={[styles.helpTitle, { color: theme.textSecondary }]}>
              Try saying:
            </Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>
              • "Open email management"
            </Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>
              • "Show daily briefing"
            </Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>
              • "Schedule a meeting"
            </Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>
              • "What's my financial status?"
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceInterface: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  voiceButton: {
    marginBottom: 20,
  },
  voiceButtonGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceButtonTouch: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  transcriptContainer: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    maxWidth: width - 40,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  processingIndicator: {
    alignItems: 'center',
    marginTop: 16,
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9A96E',
    marginBottom: 8,
  },
  processingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  quickCommands: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickCommandsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  commandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  commandButton: {
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  commandButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  helpSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    marginBottom: 4,
  },
});

export default VoiceAssistant;